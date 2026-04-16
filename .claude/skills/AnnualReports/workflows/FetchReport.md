# FetchReport Workflow

Retrieve specific security reports by name, find the latest edition, extract key findings, and provide access links.

## When to Use

- User requests a specific report by name (e.g., "get the latest DBIR")
- User wants to download a security report
- User asks for key findings from a known report
- User needs access link to annual security publications

## Workflow Steps

### 1. Identify Report

**Inputs:**
- Report name or partial name
- Optional: Year/edition
- Optional: Report category

**Actions:**
- Parse user request for report name
- Match against AnnualReports catalog (570+ sources)
- Disambiguate if multiple matches (e.g., "Threat Report" → which vendor?)
- Confirm report identification with user if ambiguous

**Example Queries:**
- "DBIR" → Verizon Data Breach Investigations Report
- "M-Trends" → Mandiant M-Trends Report
- "IBM breach cost" → IBM Cost of a Data Breach Report
- "State of the Phish" → Proofpoint State of the Phish

### 2. Search for Latest Edition

**Primary Sources:**
- Publisher's official website/resource center
- Security industry news sites (Dark Reading, CSO Online)
- Direct publisher press releases

**Search Strategy:**
```
1. Check publisher website first (most reliable)
2. Use WebSearch for "[Report Name] [current year] PDF"
3. Validate publication date (reports often released Q1/Q2 for prior year data)
4. Verify authenticity (official publisher domain)
```

**Web Search Examples:**
```
"Verizon DBIR 2025 PDF download"
"Mandiant M-Trends 2025 report"
"IBM Cost of Data Breach 2025"
"CrowdStrike Global Threat Report 2025"
```

**Report URLs (Major Reports):**
- **Verizon DBIR:** https://www.verizon.com/business/resources/reports/dbir/
- **Mandiant M-Trends:** https://www.mandiant.com/m-trends
- **IBM Cost of Breach:** https://www.ibm.com/security/data-breach
- **CrowdStrike:** https://www.crowdstrike.com/global-threat-report/
- **Microsoft Digital Defense:** https://www.microsoft.com/security/business/microsoft-digital-defense-report
- **Proofpoint State of Phish:** https://www.proofpoint.com/us/resources/threat-reports/state-of-phish
- **Sophos Threat Report:** https://www.sophos.com/en-us/labs/security-threat-report

### 3. Extract Key Findings

Once report is located, extract:

**Executive Summary:**
- Report scope (incidents analyzed, data sources, time period)
- Top threats identified
- Major trend changes from prior year
- Geographic/industry focus

**Critical Statistics:**
- Attack success rates
- Dwell time / mean time to detect
- Breach costs / ransom payments
- Most exploited vulnerabilities
- Common attack vectors (phishing %, malware %, etc.)

**Actionable Insights:**
- Recommended defensive controls
- Emerging threat warnings
- Compliance/regulatory impacts
- Industry-specific guidance

**Data Extraction Methods:**

**Option A: Use WebFetch + Fabric Pattern**
```bash
# Fetch report page and extract wisdom
WebFetch: [report_url]
Prompt: "Extract key findings, statistics, and recommendations from this security report"

# Then apply Fabric pattern for structured analysis
Fabric pattern: extract_wisdom
Input: [report content]
Output: Structured insights with IDEAS, QUOTES, FACTS, RECOMMENDATIONS
```

**Option B: Use Research Skill**
```
Delegate to Research skill:
"Research and summarize key findings from [Report Name] [Year]"
→ Parallel research across multiple sources
→ Synthesized summary with citations
```

**Option C: Manual PDF Analysis** (if direct link available)
```
1. Provide download link to user
2. Ask user to share specific sections for analysis
3. Use Read tool if user provides local PDF path
```

### 4. Provide Download Link or Summary

**If Report is Publicly Available:**
- Provide direct download link
- Include publisher name and publication date
- Note file size if known
- Mention registration requirements if any

**If Report Requires Registration:**
- Provide link to registration/download page
- Summarize registration requirements
- Suggest alternative sources (press release, executive summary)

**If Report is Paywalled:**
- Note subscription requirement (e.g., Gartner, Forrester)
- Provide free alternatives (vendor blogs, news coverage)
- Summarize publicly available excerpts

**Output Format:**

```markdown
## [Report Name] - [Year Edition]

**Publisher:** [Organization Name]
**Publication Date:** [Month Year]
**Report Scope:** [Number of incidents, data sources, coverage period]

### Download Access
- **Direct Link:** [URL or "Registration required"]
- **File Format:** PDF, [X] pages
- **Access Level:** Public / Registration / Subscription

### Executive Summary
[2-3 paragraph summary of report purpose and scope]

### Key Findings

**Top Threats:**
1. [Threat category] - [percentage or ranking]
2. [Threat category] - [percentage or ranking]
3. [Threat category] - [percentage or ranking]

**Critical Statistics:**
- Mean time to detect: [X] days
- Average breach cost: $[X] million
- Ransomware payments: [X]% of victims paid
- Most exploited CVE: [CVE-ID] ([vulnerability name])

**Trend Changes:**
- [Trend 1]: [up/down] [X]% from prior year
- [Trend 2]: [description]
- [Emerging threat]: [new attack vector or technique]

### Industry/Geographic Highlights
- [Industry]: [specific findings]
- [Region]: [specific findings]

### Recommendations for CISOs

1. **Immediate Actions:**
   - [Control to implement]
   - [Vulnerability to patch]
   - [Awareness to raise]

2. **Strategic Initiatives:**
   - [Long-term improvement]
   - [Program to develop]
   - [Investment to prioritize]

### Report Sections (for further reading)
- Page X: [Section topic]
- Page Y: [Section topic]
- Appendix: [Additional resources]

### Related Reports for Cross-Reference
- [Related Report 1] - [why relevant]
- [Related Report 2] - [why relevant]

---

**Citation:**
[Author/Organization]. ([Year]). *[Report Full Title]*. Retrieved from [URL]
```

## Tool Usage

**Primary Tools:**
- **WebSearch:** Find latest report editions and publisher URLs
- **WebFetch:** Extract content from report landing pages
- **Fabric (extract_wisdom):** Structure findings from lengthy reports
- **Research Skill:** Deep analysis of report content
- **Memory Skill:** Track which reports have been fetched

## Error Handling

**Report Not Found:**
- Search for similar reports in same category
- Check if report has been discontinued or renamed
- Suggest alternative reports from same publisher

**Report Not Yet Released:**
- Provide expected publication timeline
- Offer previous year's edition
- Set reminder for publication date

**Access Restrictions:**
- Identify alternative public sources
- Summarize press release or blog post coverage
- Suggest institutional library access

## Examples

### Example 1: Simple Fetch

**User Request:**
```
"Get me the latest Verizon DBIR"
```

**Workflow Execution:**
1. Identify: Verizon Data Breach Investigations Report
2. Search: WebSearch for "Verizon DBIR 2025"
3. Extract: Key findings from landing page
4. Provide: Direct download link + executive summary

**Output:**
```
✅ Retrieved: Verizon 2025 Data Breach Investigations Report

Download: https://www.verizon.com/business/resources/reports/dbir/
Published: June 2025 | 94 pages | Free (registration required)

Key Finding: 68% of breaches involved a human element (social engineering, error, misuse)
Ransomware: Present in 24% of breaches, up 13% from 2024
Mean time to detect: 21 days (down from 28 days in 2024)
```

### Example 2: Detailed Analysis

**User Request:**
```
"Analyze the Mandiant M-Trends report and give me the top 5 recommendations for our SOC"
```

**Workflow Execution:**
1. Identify: Mandiant M-Trends Report
2. Search: Latest edition (2025)
3. Extract: Full report content using WebFetch
4. Analyze: Apply Fabric extract_wisdom pattern
5. Synthesize: Top 5 SOC-specific recommendations

**Output:**
```
📊 Mandiant M-Trends 2025 Analysis - SOC Recommendations

**Top 5 Priorities for Your SOC:**

1. **Reduce Dwell Time (Currently 16 days globally)**
   - Implement 24/7 EDR monitoring
   - Tune alerts for lateral movement detection
   - Deploy network traffic analysis for C2 detection

2. **Focus on Ransomware Pre-Cursors**
   - Monitor for credential harvesting (Mimikatz, DCSync)
   - Alert on volume shadow copy deletion
   - Detect data staging in temp directories

3. **Improve Email Security Posture**
   - 47% of initial compromises via phishing
   - Implement DMARC enforcement
   - Deploy email sandboxing for attachments

4. **Hunt for Living-off-the-Land Techniques**
   - 63% of intrusions used legitimate tools
   - Baseline PowerShell/WMI activity
   - Monitor LOLBins (certutil, bitsadmin, mshta)

5. **Strengthen Cloud Detection**
   - API abuse now in 31% of cloud intrusions
   - Enable CloudTrail/Azure logs in SIEM
   - Alert on impossible travel and bulk data egress

[Full report: 115 pages with case studies and TTPs]
```

### Example 3: Multiple Report Comparison

**User Request:**
```
"Compare ransomware statistics across the DBIR, M-Trends, and CrowdStrike reports"
```

**Workflow Execution:**
1. Identify: 3 reports (DBIR, M-Trends, CrowdStrike Global Threat Report)
2. Search: Fetch all 3 latest editions in parallel
3. Extract: Ransomware-specific sections from each
4. Synthesize: Create comparison table

**Output:**
```
🔐 Ransomware Statistics - 3-Report Comparison (2025 Editions)

| Metric | Verizon DBIR | Mandiant M-Trends | CrowdStrike |
|--------|--------------|-------------------|-------------|
| Prevalence | 24% of breaches | 18% of incidents | Present in 62% of intrusions |
| Median Ransom | Not disclosed | $1.2M demanded | $5M demanded (enterprise) |
| Payment Rate | 29% of victims | 35% paid | 41% paid (down from 2024) |
| Dwell Time | 9 days median | 5 days median | 3.5 days (eCrime) |
| Top Vectors | Email (41%), RDP (31%) | Email (47%), exploits (28%) | Vulnerability exploit (55%) |
| Emerging Trends | Double extortion | Data leak sites | Intermittent encryption |

**Consensus Insights:**
- Ransomware remains top threat across all reports
- Dwell times decreasing as operators move faster
- Payment rates stabilizing or declining
- Double/triple extortion (steal data + encrypt + DDoS) is new normal
- Cloud environments increasingly targeted

**CISO Takeaway:**
Assume breach will include data theft even if ransomware is detected/blocked.
Prioritize data classification and egress monitoring over just backup strategies.
```

## Integration with Other Skills

**Memory Skill:**
```
After fetching report:
→ Store report metadata (name, year, publisher, fetch date)
→ Save key statistics for future reference
→ Track which reports have been reviewed this quarter
```

**Research Skill:**
```
For deep analysis:
→ Delegate comprehensive report analysis to Research skill
→ Use parallel researcher agents for multi-report synthesis
```

**Fabric Skill:**
```
For structured extraction:
→ extract_wisdom: Get IDEAS, QUOTES, FACTS, RECOMMENDATIONS
→ summarize: Create executive summary
→ create_threat_model: Extract TTPs and build threat scenarios
```

**TelegramStatus Skill:**
```
For alerts:
→ Notify when high-priority report is published
→ Send weekly digest of new reports added to catalog
```

## Maintenance Notes

- Update publisher URLs annually (companies rebrand/merge)
- Verify report access methods quarterly (some move behind paywalls)
- Add new report sources as discovered through security news
- Archive discontinued reports with note about successor publication

## Success Criteria

✅ Report correctly identified from partial name
✅ Latest edition found (within 30 days of publication)
✅ Download link provided or access method explained
✅ Key findings extracted (minimum: top 3 threats, 5 statistics)
✅ Executive summary suitable for CISO briefing
✅ Recommendations actionable and specific to report findings

---

**Workflow Owner:** AnnualReports Skill
**Related Workflows:** ThreatBriefing.md (uses FetchReport for multi-source synthesis)
**Tools Required:** WebSearch, WebFetch, Fabric (optional), Research (optional)
