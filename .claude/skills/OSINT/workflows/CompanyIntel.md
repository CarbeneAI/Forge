# Company Intelligence Workflow

Comprehensive due diligence and security assessment for corporate entities using open source intelligence.

## Objective

Gather and synthesize publicly available intelligence about a company to assess:
- Security posture and maturity
- Financial stability and business health
- Technology stack and infrastructure
- Breach history and incident response
- Leadership and key personnel
- Regulatory compliance status

## Prerequisites

- [ ] Client authorization obtained for OSINT activity
- [ ] Engagement agreement signed (if external client)
- [ ] Ethical framework reviewed
- [ ] Clear scope defined (what will be researched)

## Workflow Steps

### Phase 1: Company Identification

**Goal**: Confirm company identity and establish baseline information

```bash
# Notify workflow start
${PAI_DIR}/tools/skill-workflow-notification CompanyIntel OSINT
```

1. **Verify Company Identity**
   - Full legal name
   - Primary domain(s)
   - Corporate structure (LLC, Inc., etc.)
   - Parent company or subsidiaries
   - Primary business location(s)

2. **Establish Baseline**
   - Industry sector
   - Company size (employees)
   - Revenue range (if public)
   - Years in operation
   - Key products/services

**Deliverable**: Company profile overview (1 paragraph)

---

### Phase 2: Corporate Structure Research

**Goal**: Understand ownership, leadership, and organizational structure

1. **Ownership and Leadership**
   - CEO, CTO, CISO, CFO identification
   - Board of directors (if available)
   - Ownership structure (public, private, VC-backed)
   - Recent leadership changes

2. **SEC Filings** (if public company)
   - Visit: https://www.sec.gov/edgar/searchedgar/companysearch.html
   - Review recent 10-K (annual report)
   - Review recent 10-Q (quarterly reports)
   - Check 8-K (material events)
   - Note: Risk factors, cybersecurity disclosures

3. **Financial Health**
   - Revenue trends
   - Profitability
   - Recent funding rounds (if private)
   - Credit ratings (if available)
   - Cybersecurity insurance mentions

**Deliverable**: Executive leadership list, financial stability assessment

---

### Phase 3: Technology Stack Intelligence

**Goal**: Identify technologies, infrastructure, and development practices

1. **LinkedIn Company Analysis**
   - Visit: https://www.linkedin.com/company/[company-name]/
   - Note employee count by role
   - Technology mentions in employee profiles
   - Recent hires (especially security roles)
   - Organizational growth patterns
   - Skills trending in job postings

2. **GitHub Organization Research**
   ```bash
   # Find GitHub organization
   gh api /search/users?q="company+name"+type:org

   # List public repositories
   gh repo list org-name --limit 100 --json name,description,url

   # Check for security practices
   # - SECURITY.md files
   # - Dependabot enabled
   # - Branch protection
   # - Code scanning alerts (if public)
   ```

3. **Job Postings Analysis**
   - Visit: LinkedIn Jobs, Indeed, company careers page
   - Technology requirements in postings
   - Security-focused roles
   - Cloud infrastructure mentions (AWS, Azure, GCP)
   - DevOps and security tools

4. **Technology Fingerprinting**
   ```bash
   # Web server headers
   curl -I https://company.com

   # SSL/TLS configuration
   openssl s_client -connect company.com:443 -servername company.com

   # DNS records
   dig company.com ANY

   # Email security (SPF, DKIM, DMARC)
   dig TXT company.com
   dig TXT _dmarc.company.com
   ```

**Deliverable**: Technology stack inventory, infrastructure overview

---

### Phase 4: Security Posture Assessment

**Goal**: Evaluate public-facing security maturity

1. **Breach History Research**
   - Visit: https://haveibeenpwned.com/
   - Search: Company domain
   - Check: BreachDirectory, IntelligenceX (public data)
   - Review: News archives for incident reports
   - Note: Response quality and timeline

2. **Security Researcher Disclosures**
   - Search: Google for "company name security vulnerability"
   - Search: Twitter/X for security researcher mentions
   - Check: Bug bounty programs (HackerOne, Bugcrowd)
   - Review: CVE database for company products

3. **Security Presence**
   - Security page on website
   - Responsible disclosure policy
   - Bug bounty program
   - Security team visibility (blog, Twitter)
   - Industry certifications (SOC 2, ISO 27001)
   - Compliance mentions (HIPAA, PCI-DSS, GDPR)

4. **Domain and Infrastructure Security**
   ```bash
   # WHOIS information
   whois company.com

   # SSL certificate validity
   echo | openssl s_client -connect company.com:443 2>/dev/null | openssl x509 -noout -dates -subject

   # Check for subdomain takeover risks (manual)
   # Use: https://crt.sh/?q=%.company.com

   # Email authentication
   dig TXT company.com | grep -E "spf|dkim"
   dig TXT _dmarc.company.com
   ```

5. **Security Ratings** (if available)
   - BitSight Security Rating
   - SecurityScorecard
   - UpGuard
   - RiskRecon

**Deliverable**: Security maturity score, breach history timeline, risk factors

---

### Phase 5: Public Reputation and News

**Goal**: Understand public perception and recent events

1. **News and Media Coverage**
   - Use Research skill for comprehensive search
   - Focus areas:
     - Security incidents
     - Data breaches
     - Leadership changes
     - Acquisitions or mergers
     - Product launches
     - Regulatory actions

2. **Industry Reputation**
   - Glassdoor reviews (employee perspective)
   - Gartner/Forrester reports (if available)
   - Industry analyst opinions
   - Competitor comparisons

3. **Social Media Presence**
   - Twitter/X for company announcements
   - LinkedIn for professional updates
   - Security community mentions

**Deliverable**: Reputation summary, recent notable events

---

### Phase 6: Compliance and Regulatory

**Goal**: Assess regulatory compliance and legal standing

1. **Regulatory Filings**
   - FTC actions or settlements
   - State attorney general actions
   - Industry-specific regulations
   - GDPR compliance (if EU operations)
   - CCPA compliance (if California operations)

2. **Legal History**
   - Major lawsuits
   - Patent disputes
   - Trademark issues
   - Data breach litigation

3. **Compliance Certifications**
   - SOC 2 Type II
   - ISO 27001
   - HIPAA (if healthcare)
   - PCI-DSS (if payment processing)
   - FedRAMP (if government)

**Deliverable**: Compliance status summary, legal risk factors

---

### Phase 7: Synthesis and Analysis

**Goal**: Integrate all findings into actionable intelligence

1. **Risk Assessment Matrix**

   | Risk Category | Level (L/M/H) | Evidence | Impact |
   |---------------|---------------|----------|--------|
   | Security Posture | | | |
   | Financial Stability | | | |
   | Breach History | | | |
   | Compliance | | | |
   | Leadership | | | |

2. **SWOT Analysis**
   - **Strengths**: Positive security indicators
   - **Weaknesses**: Security gaps or concerns
   - **Opportunities**: Areas for improvement
   - **Threats**: External risks or vulnerabilities

3. **Confidence Scoring**

   For each finding, assign confidence level:
   - **High**: Multiple corroborating sources
   - **Medium**: Single reliable source
   - **Low**: Unverified or indirect evidence

**Deliverable**: Risk matrix, SWOT analysis, confidence-scored findings

---

### Phase 8: Report Generation

**Goal**: Deliver comprehensive, actionable intelligence report

**Report Structure**:

```markdown
# Company Intelligence Report: [Company Name]

**Prepared for**: [Client/Internal]
**Date**: [YYYY-MM-DD]
**Classification**: Confidential
**Prepared by**: PAI OSINT Skill

## Executive Summary
[2-3 paragraphs: Key findings, risk level, primary recommendations]

## Scope and Methodology
- Authorization: [Reference]
- Timeline: [Duration]
- Sources: Public sources only
- Limitations: [Any constraints]

## Company Overview
- Legal name and structure
- Industry and business model
- Size and revenue
- Key leadership

## Technology Stack
- Infrastructure (cloud, on-prem)
- Development languages and frameworks
- Security tools and practices
- DevOps maturity

## Security Posture
- Security team and leadership
- Certifications and compliance
- Bug bounty program
- Incident response capabilities
- Known vulnerabilities
- Breach history

## Financial and Business Health
- Revenue trends
- Funding history
- Market position
- Recent events

## Risk Assessment
[Include risk matrix from Phase 7]

## Findings and Observations
[Detailed findings organized by category]

## Red Flags
[Critical concerns requiring immediate attention]

## Recommendations
1. [Prioritized action items]
2. [Risk mitigation strategies]
3. [Further investigation needs]

## Confidence and Limitations
[Explain confidence levels and data gaps]

## Sources
[All sources with URLs and access dates]

## Appendices
- A: Full technology inventory
- B: Timeline of security incidents
- C: Leadership profiles
- D: Compliance certifications
```

**Delivery Formats**:
- PDF (for formal delivery)
- Markdown (for internal use)
- Executive slide deck (1-page summary)

---

## Quality Checklist

Before delivering the report:

- [ ] All sources documented with URLs and dates
- [ ] Confidence levels assigned to findings
- [ ] No unauthorized access or techniques used
- [ ] Legal and ethical guidelines followed
- [ ] Client-specific concerns addressed
- [ ] Recommendations are actionable and prioritized
- [ ] Report reviewed for accuracy
- [ ] Sensitive findings appropriately flagged
- [ ] Professional tone and formatting
- [ ] Executive summary is clear and concise

---

## Common Pitfalls

**Avoid these mistakes**:

1. **Over-interpretation**: Don't speculate beyond evidence
2. **Incomplete sourcing**: Always cite sources
3. **Outdated information**: Check dates on all sources
4. **False positives**: Verify breach data before reporting
5. **Scope creep**: Stay within authorized boundaries
6. **Technical jargon**: Make findings accessible
7. **Missing context**: Explain significance of findings

---

## Follow-Up Actions

**After report delivery**:

1. **Client Briefing**
   - Walk through findings
   - Answer questions
   - Clarify recommendations

2. **Additional Investigation**
   - Identify areas needing deeper research
   - Technical assessment requirements
   - Penetration testing recommendations

3. **Monitoring Setup**
   - Set up breach monitoring
   - Track regulatory actions
   - Monitor security announcements

4. **Documentation**
   - Archive all findings
   - Update threat intelligence database
   - Record lessons learned

---

## Time Estimates

**Typical Timeline**:

- Phase 1-2 (Identification & Structure): 1-2 hours
- Phase 3 (Technology Stack): 2-3 hours
- Phase 4 (Security Posture): 3-4 hours
- Phase 5 (Reputation): 1-2 hours
- Phase 6 (Compliance): 1-2 hours
- Phase 7 (Synthesis): 2-3 hours
- Phase 8 (Report): 2-4 hours

**Total**: 12-20 hours for comprehensive assessment

**Factors affecting timeline**:
- Company size and complexity
- Public vs. private company
- Industry-specific requirements
- Depth of analysis required
- Quality of available public data

---

## Integration with Other Skills

**Delegate parallel research** (faster execution):

```typescript
// Launch multiple intern agents for different phases
Task({
  prompt: "Research [Company] SEC filings and financial health",
  subagent_type: "intern",
  model: "haiku"
})

Task({
  prompt: "Research [Company] GitHub presence and technology stack",
  subagent_type: "intern",
  model: "haiku"
})

Task({
  prompt: "Research [Company] breach history and security incidents",
  subagent_type: "intern",
  model: "haiku"
})

// Synthesize results when all complete
```

**Use complementary skills**:
- Research skill for deep-dive investigations
- BrightData for difficult-to-access data
- AnnualReports skill for industry threat context

---

## Notes

- Always maintain objectivity and base findings on evidence
- Document methodology for audit trail
- Respect privacy and ethical boundaries
- Keep client information confidential
- Follow engagement terms and scope strictly

**Questions during execution? Consult `reference/EthicalFramework.md`**
