---
name: CallIntelligence
description: Extract structured intelligence from sales and customer success call transcripts. USE WHEN user mentions call transcript, sales call, customer call, call analysis, meeting transcript, PLAUD, call intelligence, OR wants to analyze recorded calls. Outputs to Google Sheets and Discord.
---

# CallIntelligence

Extract actionable intelligence from call transcripts for tracking sales pipeline health, customer sentiment, feature requests, and competitive landscape.

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **Analyze** | "analyze this call", "process transcript" | `workflows/Analyze.md` |
| **Report** | "call intelligence report", "weekly call summary" | `workflows/Report.md` |

## Quick Start

### Manual Analysis (Paste Transcript)

```
User: "Analyze this sales call transcript: [paste transcript]"
→ Uses extract_call_intelligence Fabric pattern
→ Returns structured JSON with competitors, objections, deal probability
→ Optionally appends to Google Sheet
```

### Automated Pipeline (n8n)

Webhook at `calls.home.yourdomain.com` receives:
- Client name
- Call type (sales/customer_success)
- Transcript text

Pipeline: Webhook → PAI Analysis → Google Sheets → Discord notification

## Output Fields

### Sales Calls

| Field | Description |
|-------|-------------|
| summary | 2-3 sentence call overview |
| competitors | Companies/products mentioned as alternatives |
| objections | Concerns or pushback from prospect |
| feature_requests | Capabilities they asked about |
| deal_probability | 0-100% likelihood to close |
| next_steps | Agreed action items |

### Customer Success Calls

| Field | Description |
|-------|-------------|
| summary | 2-3 sentence call overview |
| feature_requests | Desired new capabilities |
| recurring_issues | Pain points or problems discussed |
| expansion_signals | Interest in upgrades/growth |
| sentiment | 1-10 overall satisfaction score |
| follow_up_required | Action items needed |

## Google Sheets Integration

**Sheet:** "Call Intelligence" (two tabs)

### Sales Calls Tab Columns
`Date | Client | Summary | Competitors | Objections | Feature Requests | Deal Probability | Next Steps`

### Customer Success Tab Columns
`Date | Client | Summary | Feature Requests | Recurring Issues | Expansion Signals | Sentiment | Follow-up`

## Examples

**Example 1: Sales Call Analysis**
```
User: "Analyze this sales call with Acme Corp: [transcript]"
→ Reads extract_call_intelligence pattern
→ Applies to transcript with call_type=sales
→ Returns:
  {
    "call_type": "sales",
    "summary": "Initial discovery call with Acme Corp CTO...",
    "competitors": ["Competitor X", "In-house solution"],
    "objections": ["Budget constraints for Q1", "Security review required"],
    "feature_requests": ["SSO integration", "Custom reporting"],
    "deal_probability": 55,
    "next_steps": ["Send security questionnaire", "Schedule technical demo"]
  }
```

**Example 2: Customer Success Check-in**
```
User: "Process this CS call with existing customer Beta Inc"
→ Applies pattern with call_type=customer_success
→ Returns:
  {
    "call_type": "customer_success",
    "summary": "Quarterly review with Beta Inc. Generally satisfied...",
    "feature_requests": ["Mobile app", "Slack integration"],
    "recurring_issues": ["Onboarding new team members is confusing"],
    "expansion_signals": ["Mentioned bringing on 3 new departments"],
    "sentiment": 8,
    "follow_up_required": ["Send onboarding guide", "Intro to account exec for expansion"]
  }
```

## Tools

| Tool | Purpose |
|------|---------|
| `AnalyzeCall.ts` | CLI tool for transcript analysis, outputs JSON |
| `AppendToSheet.ts` | Appends analysis results to Google Sheet |

## Related

- **Fabric Pattern:** `extract_call_intelligence` - Core analysis logic
- **n8n Workflow:** Webhook → Analysis → Sheets → Discord
- **Discord:** Barnabas posts call summaries to configured channel
