---
name: OSINT
description: Open source intelligence for client due diligence and threat research. USE WHEN user mentions OSINT, due diligence, company research, background check, threat intel, reconnaissance, OR wants public intelligence gathering for consulting.
---

# OSINT - Open Source Intelligence

Ethical open source intelligence gathering for CISO/CTO consulting engagements. Focuses on client due diligence, threat landscape analysis, and defensive security research using publicly available information only.

## Core Principles

**DEFENSIVE ONLY**: All OSINT activities are conducted for defensive purposes:
- Client due diligence before engagements
- Threat actor research for defensive planning
- Security posture assessment
- Compliance verification

**PUBLIC SOURCES ONLY**: All intelligence gathered from publicly available sources:
- No unauthorized access
- No social engineering
- No technical exploitation
- Strict ethical boundaries

## Intelligence Domains

### 1. Company Intelligence
**Purpose**: Client due diligence, vendor assessment, security posture evaluation

**Coverage**:
- Corporate structure and ownership
- Executive leadership and technical staff
- Technology stack and infrastructure
- Security incidents and breach history
- Financial health and stability
- Regulatory compliance status
- Public security posture

**Use Cases**:
- Pre-engagement due diligence
- Third-party vendor assessment
- Acquisition target evaluation
- Security maturity assessment

### 2. People Intelligence
**Purpose**: Executive background verification, key personnel research

**Coverage**:
- Professional background and credentials
- Published work and presentations
- Social media professional presence
- Industry reputation and expertise
- Past security incidents or breaches
- Public statements on security topics

**Use Cases**:
- Leadership team assessment
- Key hire verification
- Expert witness qualification
- Consulting team formation

### 3. Threat Intelligence
**Purpose**: Threat actor research, APT analysis, defensive planning

**Coverage**:
- APT groups and campaigns
- Tactics, techniques, and procedures (TTPs)
- Indicators of compromise (IOCs)
- Industry-specific threats
- Dark web mentions (via public reports)
- Vulnerability exploitation trends

**Use Cases**:
- Threat briefings for clients
- Red team planning (defensive)
- Incident response preparation
- Security awareness training

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName OSINT
```

| Workflow | Trigger | File |
|----------|---------|------|
| **Company Intel** | "research company", "due diligence on", "company background" | `workflows/CompanyIntel.md` |
| **Person Intel** | "background check", "research person", "executive background" | `workflows/PersonIntel.md` |
| **Threat Intel** | "threat actor", "APT research", "threat landscape" | `workflows/ThreatIntel.md` |

## Examples

**Example 1: Pre-Engagement Due Diligence**
```
User: "We're considering a consulting engagement with Acme Corp. Run OSINT."
→ Invokes CompanyIntel workflow
→ Gathers SEC filings, breach history, LinkedIn presence, tech stack
→ Synthesizes findings into risk assessment
→ Delivers executive summary with red flags and recommendations
```

**Example 2: Executive Background Verification**
```
User: "Do a background check on their new CISO, Jane Smith"
→ Invokes PersonIntel workflow
→ Researches professional background, certifications, publications
→ Checks conference talks, social media presence
→ Verifies credentials and identifies expertise areas
→ Provides professional profile summary
```

**Example 3: Threat Actor Research**
```
User: "Research APT29 for client threat briefing"
→ Invokes ThreatIntel workflow
→ Gathers public threat reports (MITRE ATT&CK, vendor reports)
→ Analyzes TTPs and recent campaigns
→ Identifies relevant IOCs and defensive measures
→ Delivers threat profile with defensive recommendations
```

**Example 4: Vendor Security Assessment**
```
User: "Client wants to use a new SaaS vendor. OSINT on their security."
→ Invokes CompanyIntel workflow
→ Checks breach databases, security researcher disclosures
→ Reviews public bug bounty program
→ Analyzes domain security (SSL, DNS, email auth)
→ Assesses public-facing infrastructure
→ Provides security maturity score
```

## Data Sources

### Company Research
- SEC EDGAR (financial filings, 10-K, 10-Q)
- LinkedIn (employees, tech stack, hiring patterns)
- GitHub (code repositories, security practices)
- Job postings (technology requirements, security roles)
- Breach databases (Have I Been Pwned, Breach Compilation)
- News archives (security incidents, leadership changes)
- Domain intelligence (WHOIS, DNS, SSL certificates)
- Web archives (Wayback Machine)

### People Research
- LinkedIn (professional history)
- GitHub (code contributions, security projects)
- Conference archives (talks, presentations)
- Academic publications (Google Scholar)
- Professional certifications (verify via issuing org)
- Social media (Twitter/X for security professionals)
- News mentions (achievements, incidents)

### Threat Intelligence
- MITRE ATT&CK (TTPs, groups, techniques)
- CISA advisories (government threat alerts)
- Vendor threat reports (CrowdStrike, Mandiant, Palo Alto)
- CVE databases (vulnerability intelligence)
- Threat sharing platforms (ThreatConnect, AlienVault OTX)
- Security researcher blogs
- Annual security reports (see AnnualReports skill)

## Ethical Framework

**MANDATORY**: Review `reference/EthicalFramework.md` before conducting OSINT.

**Key Rules**:
- Always obtain proper authorization
- Only public sources
- No unauthorized access
- No social engineering
- Document all sources
- Respect privacy boundaries
- Follow legal guidelines

## Integration with Other Skills

**Complementary Skills**:
- **Research**: General research capabilities for in-depth investigation
- **AnnualReports**: Access to 570+ threat intelligence reports
- **BrightData**: Web scraping for difficult-to-access public data
- **Ehud (Agent)**: Pentester agent for technical reconnaissance (authorized only)

**Typical Workflow**:
1. OSINT skill for initial intelligence gathering
2. Research skill for deep-dive investigations
3. AnnualReports skill for threat landscape context
4. Engineer or Architect agent for synthesizing findings into deliverables

## Deliverables

**Standard Outputs**:
- Executive summary (1-2 pages)
- Detailed intelligence report
- Risk assessment matrix
- Actionable recommendations
- Source citations and confidence levels

**Report Structure**:
1. Executive Summary
2. Scope and Methodology
3. Findings (organized by domain)
4. Risk Analysis
5. Recommendations
6. Sources and Attribution

## Legal and Compliance Notes

**Geographic Considerations**:
- GDPR compliance for EU entities
- CCPA compliance for California residents
- Local privacy laws and regulations

**Attorney-Client Privilege**:
- OSINT conducted as part of legal consulting may be privileged
- Maintain proper documentation for legal protection
- Consult with legal counsel on engagement terms

**Data Retention**:
- Follow client data retention policies
- Secure storage of intelligence reports
- Proper disposal of sensitive findings

## Quick Reference Commands

```bash
# Company domain reconnaissance
whois example.com
dig example.com ANY
curl -I https://example.com

# GitHub organization research
gh repo list org-name --limit 100

# LinkedIn company research (manual)
# Visit: https://www.linkedin.com/company/company-name/

# Check breach databases
# Visit: https://haveibeenpwned.com/

# MITRE ATT&CK research
# Visit: https://attack.mitre.org/

# SEC filings search
# Visit: https://www.sec.gov/edgar/searchedgar/companysearch.html
```

## Skills and Tools

**Skills Required**:
- Understanding of corporate structures
- Familiarity with security frameworks
- Knowledge of threat landscapes
- Critical thinking and analysis
- Report writing and synthesis

**Tools Used**:
- Web browsers (Firefox, Chrome)
- Command-line tools (whois, dig, curl)
- GitHub CLI
- Research skill (PAI)
- BrightData (for difficult sources)
- Note-taking and documentation

---

**REMINDER**: All OSINT activities must comply with ethical guidelines in `reference/EthicalFramework.md`. When in doubt, consult with legal counsel and obtain explicit authorization.
