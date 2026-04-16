# ThreatBriefing Workflow

Generate comprehensive threat landscape briefings by synthesizing findings from multiple annual security reports, creating executive-ready intelligence summaries for board presentations and CISO communications.

## When to Use

- User requests a threat landscape overview
- Preparing for board/executive presentations
- Quarterly or annual security briefings
- Strategic planning for security initiatives
- Justifying security budget increases
- Industry-specific threat analysis
- Compliance reporting on current threat environment

## Workflow Steps

### 1. Define Briefing Scope

**Inputs Required:**
- **Time Period:** Q1 2025, Annual 2024, Last 6 months
- **Audience:** Board, C-suite, technical team, audit committee
- **Industry Focus:** Healthcare, financial services, retail, manufacturing, general
- **Geographic Scope:** Global, regional (US, EU, APAC), country-specific
- **Threat Categories:** All, ransomware-focused, nation-state, insider threats
- **Depth Level:** Executive summary (2 pages), detailed briefing (10+ pages), technical deep-dive

**Scope Definition Questions:**
```
1. Who is the audience? (Board / C-Suite / Security Team / Audit Committee)
2. What time period? (Current quarter / Annual / Last 6 months)
3. Any industry focus? (Healthcare / Finance / Retail / Manufacturing / General)
4. Specific threats of concern? (Ransomware / APT / Insider / Supply chain / All)
5. Desired length? (2-page exec summary / 10-page briefing / 20+ full report)
```

**Default Scope (if not specified):**
- Audience: C-suite/Board
- Time Period: Last 12 months
- Industry: General + user's industry if known
- Threats: All major categories
- Length: Executive summary (2-3 pages)

### 2. Select Report Sources

**Core Reports (Always Include):**
1. **Verizon DBIR** - Broad breach statistics, attack patterns
2. **Mandiant M-Trends** - APT activity, dwell time, targeted attacks
3. **CrowdStrike Global Threat Report** - Nation-state actors, eCrime trends
4. **IBM Cost of Data Breach** - Financial impact, cost factors
5. **Microsoft Digital Defense Report** - Comprehensive threat landscape

**Industry-Specific Additions:**

**Healthcare:**
- HIMSS Healthcare Cybersecurity Survey
- Fortified Health Security Horizon Report
- HHS HIPAA Breach Report Analysis

**Financial Services:**
- FS-ISAC Navigating Cyber Report
- VMware Carbon Black Modern Bank Heists
- SWIFT Customer Security Programme Report

**Retail:**
- NRF/Forrester Retail Cybersecurity Report
- Verizon Payment Security Report

**Manufacturing:**
- Dragos ICS/OT Year in Review
- Claroty Industrial Cybersecurity Report

**Technology-Specific Additions:**

**Cloud Security:**
- Wiz Cloud Security Report
- Lacework State of Cloud Security
- Palo Alto Prisma Cloud Report

**Ransomware Deep-Dive:**
- Sophos State of Ransomware
- Coveware Quarterly Ransomware Report
- Chainalysis Crypto Crime Report

**Email/Phishing:**
- Proofpoint State of the Phish
- Mimecast State of Email Security

**Source Selection Matrix:**

| Briefing Type | Required Sources | Optional Sources |
|--------------|------------------|------------------|
| **Executive Summary** | DBIR, M-Trends, CrowdStrike, IBM (4) | +1 industry-specific |
| **Board Presentation** | Above + Microsoft (5) | +2 industry + 1 compliance |
| **Technical Deep-Dive** | Above + CISOs choice (8-10) | Vendor-specific, emerging tech |
| **Compliance Report** | DBIR, IBM + industry (3) | Regulatory body reports |
| **Quarterly Update** | Latest 3 major reports | +trend comparison to prior quarter |

### 3. Extract and Synthesize Findings

**Extraction Strategy:**

Use **parallel research agents** for speed:
```typescript
// Delegate to Research skill with parallel agents
Task({ prompt: "Extract key ransomware findings from Verizon DBIR 2025", subagent_type: "intern" })
Task({ prompt: "Extract APT trends from Mandiant M-Trends 2025", subagent_type: "intern" })
Task({ prompt: "Extract nation-state activity from CrowdStrike 2025 report", subagent_type: "intern" })
Task({ prompt: "Extract breach cost statistics from IBM 2025 report", subagent_type: "intern" })
Task({ prompt: "Extract threat landscape from Microsoft Digital Defense 2025", subagent_type: "intern" })
```

**Data Points to Extract:**

**1. Threat Actor Activity:**
- Nation-state groups active (APT numbers, countries)
- eCrime/ransomware groups operating
- Hacktivism trends
- Insider threat prevalence

**2. Attack Vectors:**
- Phishing/social engineering percentages
- Vulnerability exploitation rates
- Credential theft/misuse
- Supply chain compromises
- Cloud/SaaS attacks

**3. Targeted Industries:**
- Most attacked sectors
- High-value targets
- Emerging target profiles

**4. Technical Indicators:**
- Mean time to detect (MTTD)
- Mean time to respond (MTTR)
- Dwell time statistics
- Breakout time (ransomware)

**5. Financial Impact:**
- Average breach costs
- Ransom payment trends
- Recovery costs
- Lost business impact

**6. Emerging Threats:**
- New attack techniques
- Evolving threat groups
- Technology-specific risks (AI, quantum, 5G)

**Synthesis Process:**

```markdown
For each data point:
1. Collect statistics from all reports
2. Calculate averages/medians where applicable
3. Identify consensus (3+ reports agree)
4. Flag outliers or conflicting data
5. Note report-specific insights
6. Create unified narrative
```

**Example Synthesis:**

**Topic: Mean Time to Detect**
- Verizon DBIR: 21 days (median)
- Mandiant M-Trends: 16 days (median, down from 24 days)
- CrowdStrike: 79 hours (median, eCrime only)
- IBM: 204 days (mean, includes long-tail outliers)

**Synthesized Insight:**
"Detection timelines continue to improve, with median dwell time dropping to 16-21 days across most breach types. However, sophisticated APT groups still evade detection for 90+ days. eCrime operators (especially ransomware) are moving faster, with median breakout time under 4 days per CrowdStrike research."

### 4. Format Executive-Ready Briefing

**Standard Briefing Structure:**

```markdown
# [Industry] Cybersecurity Threat Briefing
## [Time Period] Edition

**Prepared for:** [Audience]
**Date:** [Briefing Date]
**Sources:** [Number] industry security reports analyzed

---

## Executive Summary

[3-4 paragraph overview of threat landscape]

**Key Takeaways:**
1. [Most critical finding - one sentence]
2. [Second most critical - one sentence]
3. [Third most critical - one sentence]
4. [Emerging threat - one sentence]
5. [Strategic recommendation - one sentence]

---

## Threat Landscape Overview

### Current Threat Level: [HIGH / ELEVATED / MODERATE]

**Factors driving threat level:**
- [Factor 1 with statistic]
- [Factor 2 with statistic]
- [Factor 3 with statistic]

### Top Threats for [Time Period]

**1. [Threat Category - e.g., Ransomware]**
- **Prevalence:** [X]% of incidents ([source])
- **Impact:** $[X] average cost ([source])
- **Trend:** ↑↓ [X]% from prior period
- **Key Finding:** [Most important insight]

**2. [Threat Category - e.g., Business Email Compromise]**
- [Same structure as above]

**3. [Threat Category]**
- [Same structure as above]

**4. [Threat Category]**
- [Same structure as above]

**5. [Threat Category]**
- [Same structure as above]

---

## Attack Vector Analysis

| Vector | Prevalence | Trend | Typical Impact |
|--------|-----------|-------|----------------|
| Phishing/Social Engineering | [X]% | ↑↓ | Initial access, credential theft |
| Vulnerability Exploitation | [X]% | ↑↓ | Remote code execution, privilege escalation |
| Credential Misuse | [X]% | ↑↓ | Lateral movement, data exfiltration |
| Supply Chain Compromise | [X]% | ↑↓ | Widespread impact, persistent access |
| Insider Threat | [X]% | ↑↓ | Data theft, sabotage |

**Fastest Growing Vector:** [Vector name] - up [X]% from [prior period]
**Most Costly Vector:** [Vector name] - $[X] average breach cost

---

## Industry-Specific Insights

### [Your Industry] Threat Profile

**Attack Frequency:** [Ranking among industries - e.g., "3rd most targeted sector"]

**Common Threats:**
1. [Industry-specific threat 1]
2. [Industry-specific threat 2]
3. [Industry-specific threat 3]

**Regulatory Implications:**
- [Compliance requirement impact]
- [Recent enforcement actions]
- [Upcoming regulatory changes]

**Peer Benchmark:**
- Average breach cost in [industry]: $[X] ([X]% above/below global average)
- Mean time to detect: [X] days ([X]% better/worse than cross-industry)
- Most targeted assets: [asset types]

---

## Financial Impact Analysis

**Global Breach Cost Statistics:**
- **Average breach cost:** $[X] million (IBM)
- **Mega-breach (50M+ records):** $[X] million
- **Cost per record:** $[X]
- **Ransomware average payment:** $[X]
- **Recovery timeline:** [X] days/months

**Cost Factors:**
- Detection & escalation: [X]%
- Notification: [X]%
- Post-breach response: [X]%
- Lost business: [X]%

**Cost Mitigators (reduce breach impact):**
1. [Mitigation factor 1]: Saves $[X] on average
2. [Mitigation factor 2]: Saves $[X] on average
3. [Mitigation factor 3]: Saves $[X] on average

---

## Threat Actor Landscape

### Nation-State Activity

**Most Active Groups:**
- [APT Group 1]: [Country] - Targeting [industries/regions]
- [APT Group 2]: [Country] - Focusing on [objectives]
- [APT Group 3]: [Country] - Known for [TTPs]

**Geopolitical Trends:**
- [Conflict/tension] driving increased activity in [region]
- [Policy change] leading to shift in targeting

### Cybercriminal Organizations

**Dominant Ransomware Groups:**
1. [Group name]: [Operating since], [affiliate model], [avg ransom]
2. [Group name]: [Same structure]
3. [Group name]: [Same structure]

**Emerging Groups:** [New groups to watch]

**Law Enforcement Disruptions:** [Recent takedowns and their impact]

---

## Emerging Threats & Trends

### New Attack Techniques
1. **[Technique Name]:** [Description, why concerning, defenses]
2. **[Technique Name]:** [Description]
3. **[Technique Name]:** [Description]

### Technology-Driven Risks
- **AI/ML Threats:** [Adversarial AI, deepfakes, automated attacks]
- **Cloud/SaaS:** [Misconfigurations, API abuse, identity attacks]
- **IoT/OT:** [Industrial targeting, IoT botnets]
- **Supply Chain:** [Software dependencies, vendor compromises]

### Looking Ahead (Next 6-12 Months)
- [Prediction 1 from reports]
- [Prediction 2 from reports]
- [Prediction 3 from reports]

---

## Defensive Posture Recommendations

### Immediate Actions (0-30 days)

**Priority 1: [Control Category]**
- Action: [Specific implementation]
- Rationale: [Threat it addresses]
- Expected Outcome: [Risk reduction]

**Priority 2: [Control Category]**
- [Same structure]

**Priority 3: [Control Category]**
- [Same structure]

### Short-Term Initiatives (30-90 days)

1. **[Initiative Name]:** [Description, resources needed, risk addressed]
2. **[Initiative Name]:** [Same structure]
3. **[Initiative Name]:** [Same structure]

### Strategic Investments (90+ days)

1. **[Program/Capability]:** [Long-term security improvement]
2. **[Program/Capability]:** [Same structure]
3. **[Program/Capability]:** [Same structure]

---

## Board/Executive Questions to Anticipate

**Q: How does our organization compare to industry peers?**
A: [Use industry benchmark data from reports]

**Q: What is our greatest risk?**
A: [Based on industry targeting + current posture]

**Q: Do we need to increase security budget?**
A: [Cost of breach vs. cost of controls, ROI data]

**Q: Are we compliant with regulations?**
A: [Regulatory trends from reports, audit implications]

**Q: What are competitors experiencing?**
A: [Industry-specific findings, if available]

**Q: How prepared are we for [specific threat]?**
A: [Control maturity assessment against threat]

---

## Appendix

### Report Sources
1. [Report Name], [Publisher], [Publication Date], [URL]
2. [Same structure for each source]
3. [etc.]

### Glossary
- **APT (Advanced Persistent Threat):** [Definition]
- **MTTD (Mean Time To Detect):** [Definition]
- **Dwell Time:** [Definition]
- [Other technical terms used]

### Additional Resources
- [Link to full reports]
- [Industry-specific guidance]
- [Regulatory resources]

---

**This briefing synthesized findings from [X] security reports representing analysis of [X] incidents/breaches globally.**

**Next briefing scheduled:** [Date]
```

### 5. Create Supporting Visuals

**Charts to Include:**

**1. Threat Prevalence Chart**
```
[Bar chart showing top 5-7 threats with percentages]
- Ransomware: 24%
- BEC: 18%
- Phishing: 16%
- [etc.]
```

**2. Industry Targeting Heatmap**
```
[Table showing which industries most attacked]
Healthcare: 🔴🔴🔴🔴🔴 Very High
Finance: 🔴🔴🔴🔴 High
Retail: 🔴🔴🔴 Moderate
[etc.]
```

**3. Breach Cost Breakdown**
```
[Pie chart of cost factors]
- Lost business: 38%
- Detection & escalation: 29%
- Post-breach response: 27%
- Notification: 6%
```

**4. Attack Vector Trends**
```
[Line graph showing trends over time]
Phishing ──────── (increasing)
Vuln Exploitation ──────── (stable)
Credential Misuse ──────── (increasing)
```

**5. Time-Based Metrics**
```
[Bar comparison chart]
MTTD: 2023 vs 2024 vs 2025
MTTR: 2023 vs 2024 vs 2025
Dwell Time: 2023 vs 2024 vs 2025
```

**Visual Creation Methods:**
- Use Mermaid for simple charts (embedded in Markdown)
- Export to PowerPoint for board presentations
- Create infographics for executive summaries

### 6. Tailor to Audience

**For Board of Directors:**
- Focus on business risk, not technical details
- Emphasize financial impact and reputation risk
- Include peer comparisons and industry benchmarks
- Provide clear go/no-go recommendations
- Limit technical jargon, use glossary
- 2-3 pages maximum, executive summary first

**For C-Suite (CEO, CFO, COO):**
- Business continuity and operational impact
- Competitive intelligence (what are peers doing?)
- Budget justification with ROI data
- Regulatory compliance implications
- Strategic initiatives alignment
- 5-10 pages, balance business/technical

**For CISO/Security Team:**
- Technical depth on TTPs
- Control effectiveness benchmarks
- Tool/technology evaluations
- Threat hunting priorities
- Incident response playbook updates
- 15-20+ pages, technical detail welcomed

**For Audit Committee:**
- Compliance and regulatory focus
- Control maturity assessments
- Risk quantification
- Gap analysis
- Remediation timelines
- 8-12 pages, audit framework alignment

## Tool Usage

**Research Skill:**
```
Primary tool for multi-report synthesis
Use parallel intern agents for speed (haiku model)
Each agent assigned 1-2 reports to analyze
```

**Fabric Patterns:**
```
extract_wisdom: Structure findings from each report
summarize: Create concise overviews
create_threat_model: Build threat scenarios from TTPs
```

**WebSearch:**
```
Find latest report editions
Verify publication dates
Locate industry-specific supplements
```

**WebFetch:**
```
Extract content from report landing pages
Get executive summaries
Pull key statistics
```

**Memory Skill:**
```
Store briefing for future reference
Track which reports used
Save custom analysis for quarterly comparisons
```

## Examples

### Example 1: Quarterly Board Briefing

**User Request:**
```
"Create a Q1 2025 threat briefing for our board meeting next week"
```

**Workflow Execution:**
1. **Scope:** Board audience, Q1 2025, 2-page executive summary
2. **Sources:** DBIR, M-Trends, CrowdStrike, IBM, Microsoft (5 core)
3. **Extract:** Parallel research agents fetch key findings
4. **Synthesize:** Create unified narrative on top threats
5. **Format:** 2-page board-ready document with visuals
6. **Tailor:** Non-technical language, business risk focus

**Output:**
```
📊 Q1 2025 Cybersecurity Threat Briefing - Board of Directors

EXECUTIVE SUMMARY
The cybersecurity threat landscape in Q1 2025 remains at ELEVATED risk level.
Ransomware continues to dominate incident response (24% of breaches), while
nation-state activity targeting critical infrastructure has intensified due
to ongoing geopolitical tensions.

KEY TAKEAWAYS:
1. Ransomware groups are moving 40% faster (median dwell time now 5 days)
2. Cloud misconfigurations led to 32% of data breaches (up from 19% in 2024)
3. Average breach cost reached $4.88M, a 12% increase year-over-year
4. AI-powered phishing campaigns show 3x higher success rates
5. Our industry (healthcare) remains the #1 targeted sector for 4th consecutive year

[Continues with formatted briefing per template above...]

RECOMMENDED ACTIONS FOR BOARD:
1. Approve $2M investment in cloud security posture management (prevent 32% of breach types)
2. Mandate MFA for all systems (reduces breach cost by average $1.1M per IBM research)
3. Conduct ransomware tabletop exercise in Q2 (peer benchmark: 78% of similar orgs do annually)

SOURCES: Analysis of Verizon DBIR 2025, Mandiant M-Trends 2025, CrowdStrike Global
Threat Report 2025, IBM Cost of Data Breach 2025, Microsoft Digital Defense Report 2025
```

### Example 2: Healthcare Industry Deep-Dive

**User Request:**
```
"I need a comprehensive healthcare threat briefing for our annual security planning"
```

**Workflow Execution:**
1. **Scope:** Healthcare-specific, annual planning, detailed (15+ pages)
2. **Sources:** Core 5 + HIMSS, Fortified Health, Protenus, HHS breach data (9 total)
3. **Extract:** Healthcare-specific sections from each report
4. **Synthesize:** Focus on HIPAA, medical device security, EHR attacks
5. **Format:** Full briefing with technical appendix
6. **Tailor:** CISO/Security team audience with compliance focus

**Output:**
```
🏥 Healthcare Cybersecurity Threat Landscape 2025
Annual Security Planning Briefing

[50+ page comprehensive analysis including:]

SECTION 1: Executive Summary (2 pages)
SECTION 2: Healthcare Threat Profile (5 pages)
  - EHR/EMR targeting trends
  - Medical device vulnerabilities
  - Ransomware impact on patient care
  - Insider threat (higher in healthcare at 34%)
SECTION 3: Regulatory Landscape (4 pages)
  - HIPAA enforcement trends
  - OCR audit focus areas
  - State privacy laws (CCPA, VCDPA impacts)
SECTION 4: Peer Benchmarking (3 pages)
  - Healthcare breach costs ($10.93M average - highest of all industries)
  - Detection times (healthcare average: 236 days - worst performance)
  - Control maturity compared to similar organizations
SECTION 5: Technical Deep-Dive (10 pages)
  - Specific attack campaigns targeting hospitals
  - Medical IoT attack vectors
  - Healthcare-specific TTPs
SECTION 6: Strategic Recommendations (5 pages)
  - 3-year security roadmap
  - Budget allocation guidance
  - Control priorities by risk reduction
SECTION 7: Incident Response Playbooks (8 pages)
  - Ransomware response specific to EHR downtime
  - HIPAA breach notification workflows
  - Patient care continuity procedures

APPENDIX:
- All report sources with links
- Healthcare security frameworks (NIST, HITRUST)
- Vendor evaluation criteria
```

### Example 3: Ransomware-Focused Briefing

**User Request:**
```
"The CEO wants to understand ransomware risk specifically - make it 5 pages max"
```

**Workflow Execution:**
1. **Scope:** Ransomware-only, CEO audience, 5 pages
2. **Sources:** Sophos Ransomware, Coveware, Chainalysis, DBIR ransomware section, M-Trends ransomware cases (5 focused)
3. **Extract:** Ransomware prevalence, payment trends, recovery costs, prevention controls
4. **Synthesize:** Build narrative around ransomware as business continuity threat
5. **Format:** Executive document with financial focus
6. **Tailor:** Business language, decision-oriented, clear ROI on controls

**Output:**
```
🚨 Ransomware Risk Assessment - Executive Briefing

TO: CEO
FROM: CISO
RE: Ransomware threat analysis and recommended actions
DATE: [Date]

SITUATION:
Ransomware is the fastest-growing cyber threat facing businesses, present in
24% of all data breaches. Median ransom demands have increased to $1.2M, but
total recovery costs average $4.54M when including downtime, lost revenue,
and remediation. Our industry experiences attacks 67% more frequently than
cross-industry average.

FINANCIAL IMPACT IF ATTACKED:
- Direct ransom payment: $1.2M (median demand)
- Business interruption: $2.1M (average 21 days downtime)
- Recovery/remediation: $800K
- Legal/notification: $300K
- Reputation damage: $140K
TOTAL EXPECTED COST: $4.54M

LIKELIHOOD:
- 59% probability of ransomware attack within next 12 months (Sophos research)
- Our current security posture: MODERATE risk (see attached assessment)
- Similar organizations: 34% experienced attack in 2024

PREVENTION INVESTMENT vs. BREACH COST:
Recommended controls: $850K one-time + $320K annual
Expected cost reduction: 72% (reduces likelihood and impact)
Risk-adjusted ROI: 4.2:1 over 3 years

[Continues with detailed analysis, specific threat groups, attack timeline,
prevention controls ranked by effectiveness, incident response readiness gap
analysis, and decision matrix for CEO]

DECISION REQUIRED:
Approve $850K investment in ransomware prevention controls (EDR upgrade, backup
architecture, network segmentation) to reduce risk by 72%, yielding positive ROI
within 18 months based on expected cost avoidance.

[Attached: Technical control specifications, vendor comparisons, implementation timeline]
```

## Integration with Other Skills

**ceo-advisor / cto-advisor:**
```
Threat briefings inform strategic advisory recommendations
Cost data supports budget/investment scenarios
Risk analysis drives technology evaluation criteria
```

**Memory Skill:**
```
Store threat briefings for historical comparison
Track quarterly trend changes
Maintain custom intelligence repository
```

**Research Skill:**
```
Delegate deep-dive research on specific threats
Parallel agent research for speed
Synthesis of multiple sources
```

**Fabric (extract_wisdom):**
```
Structure unstructured report content
Extract actionable recommendations
Identify patterns across multiple reports
```

**TelegramStatus:**
```
Alert when new major reports published
Send briefing summary to stakeholders
Scheduled threat landscape updates
```

## Quality Checklist

Before delivering threat briefing:

- [ ] Minimum 5 reputable report sources cited
- [ ] Statistics from 2024-2025 (no outdated data)
- [ ] Industry-specific insights included (if applicable)
- [ ] Financial impact quantified with sources
- [ ] Actionable recommendations with clear priorities
- [ ] Audience-appropriate language and depth
- [ ] Visuals support key findings
- [ ] Sources properly cited with URLs
- [ ] Executive summary stands alone (can be read independently)
- [ ] Proofread for typos/formatting issues

## Maintenance

**Quarterly:**
- Update with newly published reports
- Refresh statistics and trends
- Add emerging threat categories

**Annual:**
- Full catalog review of report sources
- Archive outdated reports
- Validate URLs and access methods
- Update briefing templates based on stakeholder feedback

## Success Criteria

✅ Briefing synthesizes 5+ authoritative reports
✅ Findings are current (within 6 months of latest data)
✅ Clear narrative thread across multiple sources
✅ Conflicting data identified and explained
✅ Industry-specific insights included (when applicable)
✅ Recommendations are prioritized and actionable
✅ Audience-appropriate formatting and language
✅ Executive summary can stand alone
✅ All sources properly cited
✅ Delivered in requested format (Markdown, PDF, PPTX)

---

**Workflow Owner:** AnnualReports Skill
**Related Workflows:** FetchReport.md (retrieves individual reports for briefing)
**Tools Required:** Research Skill (primary), WebSearch, WebFetch, Fabric (extract_wisdom, summarize), Memory (optional)
**Estimated Time:** 30-45 minutes for executive briefing, 2-3 hours for comprehensive report
