# Spam Detection Guide

Technical reference for the EmailManager's 4-layer spam detection system.

## Layer 1: Authentication Headers (40% weight)

Parses the `Authentication-Results` header to check email authentication status.

### Protocols Checked

| Protocol | What It Verifies | Pass Score | Fail Score |
|----------|-----------------|------------|------------|
| **SPF** | Sender's IP authorized by domain | 30 points | 0 points |
| **DKIM** | Email content signed by domain | 40 points | 0 points |
| **DMARC** | Domain policy for SPF/DKIM alignment | 30 points | 0 points |

### Example Authentication-Results Header

```
authentication-results: mx.google.com;
       spf=pass (google.com: domain of noreply@github.com designates 192.30.252.194 as permitted sender) smtp.mailfrom=noreply@github.com;
       dkim=pass header.i=@github.com header.s=pf2023 header.b=abc123;
       dmarc=pass (p=NONE sp=NONE dis=NONE) header.from=github.com
```

### Scoring Logic

- All pass (100) → 0 spam score (inverted)
- All fail (0) → 100 spam score
- Mixed results → proportional score

## Layer 2: Sender Reputation (20% weight)

Analyzes the sender's email address and domain.

### Known Good Domains

Domains in the whitelist receive -40 spam score reduction:

```
google.com, github.com, microsoft.com, apple.com, amazon.com,
anthropic.com, carbene.ai, yourdomain.com, stripe.com, vercel.com,
cloudflare.com, linear.app, notion.so, slack.com, zoom.us,
linkedin.com, twitter.com, x.com
```

### Suspicious Domain Patterns

| Pattern | Score Impact | Example |
|---------|-------------|---------|
| Multiple hyphens | +15 | `secure-login-verify.com` |
| Numeric domain | +20 | `mail123456.com` |
| Short + numbers | +15 | `ab12.xyz` |

### Special Cases

- **noreply addresses**: -10 (usually legitimate automation)
- **Unknown domains**: Start at neutral (50)

## Layer 3: Content Analysis (20% weight)

Scans email body and subject for suspicious patterns.

### Suspicious URL Patterns

Each match adds +10 to spam score:

- `bit.ly`, `tinyurl.com`, `t.co`, `goo.gl`
- `is.gd`, `short.link`
- `click.track`, `redirect`
- IP addresses in URLs

### Urgency Language Patterns

Presence of any adds +20 to spam score:

- "urgent", "immediate action", "act now"
- "limited time", "expires today"
- "account suspended", "verify immediately"
- "security alert", "unusual activity"
- "confirm your identity", "click here to avoid"

### Display Name Analysis

+30 if display name contains different domain than actual sender:

```
From: "support@paypal.com" <attacker@malicious.com>
```

### Legitimate Newsletter Indicators

- `List-Unsubscribe` header present: -15
- Usually indicates legitimate mailing list

## Layer 4: AI Analysis (20% weight)

Uses Claude Haiku for semantic spam probability.

### Prompt Structure

```
Analyze this email for spam/phishing probability.
Return ONLY a JSON object with:
- "score" (0-100, where 100 is definitely spam)
- "reasoning" (one sentence)
- "confidence" (0-100)

From: [sender]
Subject: [subject]
Preview: [first 500 chars]
```

### Cost Estimate

- ~$0.75/month for 100 emails/day
- ~4,500 input tokens per email
- Claude Haiku at $0.25/M input tokens

### Fallback Behavior

If AI analysis fails (rate limit, API error):
- Returns neutral score (50)
- Confidence set to 0
- Reasoning contains error message

## Final Score Calculation

```
total = (authHeaders × 0.4) + (senderReputation × 0.2) +
        (contentAnalysis × 0.2) + (aiAnalysis × 0.2)
```

### Verdict Thresholds

| Score Range | Verdict | Action |
|-------------|---------|--------|
| >80 | `spam` | Auto-filter, no notification |
| 50-80 | `suspicious` | Deliver with warning |
| <50 | `legitimate` | Deliver normally |

## Tuning Recommendations

### Too Many False Positives

1. Raise threshold from 80 to 85
2. Add trusted domains to KNOWN_GOOD_DOMAINS
3. Review spam-log to identify patterns

### Too Much Spam Getting Through

1. Lower threshold from 80 to 75
2. Add suspicious patterns to content analysis
3. Enable stricter auth header checking

### Performance Optimization

1. Use `--skip-ai` for faster processing
2. Disable AI layer for high-volume accounts
3. Cache sender reputation lookups

## Logging

All spam decisions logged to `data/spam-log/YYYY-MM-DD.jsonl`:

```json
{
  "total": 25.5,
  "verdict": "legitimate",
  "layers": {
    "authHeaders": { "score": 0, "weight": 0.4, "details": {...} },
    "senderReputation": { "score": 10, "weight": 0.2, "details": {...} },
    "contentAnalysis": { "score": 30, "weight": 0.2, "details": {...} },
    "aiAnalysis": { "score": 45, "weight": 0.2, "details": {...} }
  },
  "timestamp": "2026-02-05T14:30:00.000Z",
  "messageId": "18d5a7b2c3e4f5a6",
  "account": "personal"
}
```

## References

- [Email Authentication Best Practices](https://dmarcly.com/blog/email-authentication-explained)
- [Gmail Authentication Headers](https://support.google.com/a/answer/9948472)
- [OWASP Email Injection](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/10-Testing_for_Mail_Injection)
