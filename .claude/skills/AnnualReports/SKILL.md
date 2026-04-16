---
name: AnnualReports
description: Comprehensive catalog of 570+ annual security reports and threat intelligence sources for CISO consulting, threat landscape analysis, and security research. USE WHEN user mentions annual reports, threat landscape, security reports, industry reports, DBIR, Verizon, Mandiant, CrowdStrike, threat briefing, threat intelligence, security trends, OR wants security research sources, vendor reports, compliance reports.
---

# AnnualReports

Production-ready catalog of 570+ annual security reports, threat intelligence publications, and industry studies for CISO consulting and security research.

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **FetchReport** | "get [report name]", "find latest DBIR", "download threat report" | `workflows/FetchReport.md` |
| **ThreatBriefing** | "create threat briefing", "summarize threat landscape", "executive security update" | `workflows/ThreatBriefing.md` |

## Report Categories

### 1. Threat Landscape Reports (150+ sources)

**Major Annual Reports:**
- **Verizon Data Breach Investigations Report (DBIR)** - Comprehensive breach analysis, 16,000+ incidents analyzed annually
- **Mandiant M-Trends** - APT trends, dwell time metrics, attacker techniques
- **CrowdStrike Global Threat Report** - Nation-state actors, eCrime trends, threat hunting insights
- **IBM X-Force Threat Intelligence Index** - Attack trends, vulnerability exploitation, geographic analysis
- **Cisco Talos Year in Review** - Malware trends, vulnerability research, threat actor analysis
- **Palo Alto Networks Unit 42 Threat Report** - Cloud threats, ransomware economics, attack lifecycle
- **Microsoft Digital Defense Report** - Nation-state threats, cybercrime trends, supply chain security
- **Google Cybersecurity Forecast** - Emerging threats, AI security, cloud attack trends
- **Akamai State of the Internet Security Report** - DDoS trends, web attacks, bot management
- **Cloudflare DDoS Threat Report** - Application layer attacks, network layer trends, regional analysis

**Regional & Specialized Threat Reports:**
- ENISA Threat Landscape Report (Europe)
- APWG Phishing Activity Trends Report
- Anti-Phishing Working Group Wire Transfer Fraud Report
- CISA Cybersecurity Alerts & Advisories
- NCSC UK Threat Assessment
- CERT-EU Threat Landscape Report
- ANSSI Threat Panorama (France)
- BSI State of IT Security (Germany)
- ACSC Annual Cyber Threat Report (Australia)
- Canadian Centre for Cyber Security National Cyber Threat Assessment

**Ransomware-Specific:**
- Sophos State of Ransomware
- Emsisoft State of Ransomware
- Coveware Quarterly Ransomware Report
- Chainalysis Crypto Crime Report (ransomware payments)
- Intel 471 Ransomware Report
- Group-IB Ransomware Uncovered
- Secureworks State of the Threat
- BlackBerry Global Threat Intelligence Report

### 2. Cloud Security Reports (80+ sources)

**Cloud-Native Security:**
- **Wiz Cloud Security Report** - Misconfigurations, cloud vulnerabilities, toxic combinations
- **Lacework State of Cloud Security Report** - Container security, K8s threats, cloud workload protection
- **Sysdig Cloud-Native Security and Usage Report** - Runtime threats, container vulnerabilities
- **Aqua Security Cloud Native Threat Report** - Supply chain attacks, image vulnerabilities
- **Palo Alto Prisma Cloud Report** - Multi-cloud security posture, compliance gaps
- **Red Hat State of Kubernetes Security** - K8s misconfigurations, container runtime threats
- **Snyk State of Cloud Native Application Security** - Open source vulnerabilities in cloud apps
- **Check Point CloudGuard Cloud Security Report** - IaaS security, serverless threats
- **Trend Micro Cloud Security Report** - AWS/Azure/GCP threat analysis
- **McAfee/Trellix Cloud Adoption and Risk Report** - Shadow IT, DLP in cloud

**Cloud Provider Reports:**
- AWS Security Best Practices (annual update)
- Azure Security Benchmark Report
- Google Cloud Security Command Center Insights
- Oracle Cloud Threat Report
- IBM Cloud Security and Compliance Report

**SaaS Security:**
- Netskope Cloud and Threat Report
- Zscaler ThreatLabz State of Encrypted Attacks
- Proofpoint Cloud Account Takeover Report
- Barracuda SaaS Security Report
- Skyhigh Security Cloud Adoption and Risk Report

### 3. Application Security Reports (70+ sources)

**Software Vulnerability Research:**
- **Synopsys Open Source Security and Risk Analysis (OSSRA)** - Open source vulnerabilities, license risks
- **Veracode State of Software Security (SOSS)** - Application security debt, fix rates, language-specific trends
- **WhiteSource/Mend State of Open Source Security** - Supply chain attacks, OSS vulnerabilities
- **Snyk State of Open Source Security** - Developer security practices, vulnerability trends
- **Sonatype State of the Software Supply Chain** - Dependency attacks, malicious packages
- **Contrast Security Application Security Observability Report** - Runtime vulnerability detection
- **HackerOne Hacker-Powered Security Report** - Bug bounty trends, vulnerability disclosure
- **Bugcrowd Inside the Platform Report** - Crowdsourced security findings, OWASP Top 10 trends

**Web Application Security:**
- OWASP Top 10 (updated every 3-4 years, referenced annually)
- Positive Technologies Web Application Vulnerabilities Report
- Detectify Security Report
- Acunetix Web Application Vulnerability Report
- Netsparker Web Security Trends
- PortSwigger Web Security Academy Research

**API Security:**
- Salt Security State of API Security Report
- Akamai API Security Report
- Imperva API Security Trends
- Noname Security API Security Report
- Traceable AI State of API Security

### 4. Identity & Access Management (60+ sources)

**Identity Security:**
- **Okta Businesses at Work Report** - SSO trends, MFA adoption, passwordless authentication
- **Microsoft Entra (Azure AD) Security Report** - Identity attacks, compromised accounts, conditional access trends
- **CyberArk Identity Security Threat Landscape** - Privileged access attacks, identity-based threats
- **BeyondTrust Privileged Access Threat Report** - PAM trends, credential theft, lateral movement
- **Delinea/Thycotic Privileged Access Management Report**
- **Ping Identity Digital Trust Report** - Consumer identity trends, fraud prevention

**Authentication & MFA:**
- Duo Security Trusted Access Report
- Yubico State of Global Enterprise Authentication
- FIDO Alliance Authentication Trends
- Auth0 State of Secure Identity Report
- RSA Fraud Report (authentication fraud)

**Password & Credential Security:**
- Verizon Mobile Security Index (password reuse)
- LastPass Psychology of Passwords Report
- 1Password Security Report
- Bitwarden Password Practices Report
- Specops Weak Password Report

### 5. Email Security & Phishing (50+ sources)

**Email Threat Reports:**
- **Proofpoint State of the Phish** - Phishing success rates, user behavior, training effectiveness
- **Mimecast State of Email Security (SOES)** - Email-borne threats, impersonation attacks
- **Barracuda Email Threats and Trends** - Spear phishing, BEC, email security gaps
- **Abnormal Security Email Attack Report** - AI-driven phishing, vendor email compromise
- **Cofense Phishing Defense Report** - Phishing campaigns, credential harvesting
- **Trustwave Email Security Insights** - Malware delivery, phishing infrastructure
- **Valimail Email Fraud and Identity Deception Report** - DMARC adoption, spoofing trends
- **Agari/Help Systems BEC & EAC Report** - Business email compromise economics

**Spam & Malicious Email:**
- Kaspersky Spam and Phishing Report
- Sophos Threat Report (email threats section)
- Cisco Talos Email Threat Report
- Bitdefender Spam Report
- Hornet Security Cyber Threat Report

### 6. Endpoint & Mobile Security (55+ sources)

**Endpoint Protection:**
- **CrowdStrike Global Threat Report** - Endpoint detection, breakout time, eCrime trends
- **SentinelOne State of Endpoint Security** - Autonomous response, endpoint visibility
- **Carbon Black Threat Report** - Endpoint attacks, lateral movement, fileless malware
- **Cybereason Defenders Advantage Report** - Endpoint operations, threat hunting
- **Sophos Threat Report** - Malware trends, exploit techniques, defensive strategies
- **Bitdefender Cybersecurity Assessment Report** - Endpoint vulnerabilities, security posture
- **ESET Threat Report** - Regional malware trends, APT analysis
- **Kaspersky Security Bulletin** - Malware evolution, targeted attacks, mobile threats

**Mobile Security:**
- Verizon Mobile Security Index
- Zimperium Global Mobile Threat Report
- Lookout Mobile Threat Landscape
- Check Point Mobile Security Report
- Pradeo Mobile Security Report
- Jamf Security 360 Annual Threat Report (Apple devices)

**EDR/XDR Insights:**
- Palo Alto Cortex XDR Report
- Microsoft Defender EDR Insights
- Trend Micro XDR Report
- Fortinet FortiEDR Threat Landscape

### 7. Network Security & DDoS (45+ sources)

**Network Threat Reports:**
- **Fortinet Global Threat Landscape Report** - Network attacks, exploit trends, IoT threats
- **WatchGuard Internet Security Report** - Firewall data, malware trends, network attacks
- **SonicWall Cyber Threat Report** - Ransomware, IoT malware, encrypted threats
- **Cloudflare DDoS Threat Report** - Largest attacks, attack vectors, mitigation strategies
- **Netscout Threat Intelligence Report** - DDoS trends, attack sophistication
- **A10 Networks DDoS Threat Intelligence Report** - Weaponized DDoS, ransom DDoS

**DNS Security:**
- Infoblox DNS Threat Report
- EfficientIP Global DNS Threat Report
- Cisco Umbrella Security Report (DNS layer)
- Akamai DNS Attack Report

**Zero Trust & SASE:**
- Forrester Zero Trust Security Reports
- Gartner SASE Market Guide (annual)
- Zscaler Zero Trust Exchange Report
- Palo Alto Networks SASE Adoption Report

### 8. Data Security & Privacy (50+ sources)

**Data Breach Economics:**
- **IBM Cost of a Data Breach Report** - Breach costs, mean time to identify/contain, cost factors
- **Verizon Payment Security Report** - PCI DSS compliance, payment card breaches
- **Thales Data Threat Report** - Encryption adoption, key management, data sovereignty
- **Varonis Data Risk Report** - Stale data, overexposed files, insider threats
- **Digital Guardian Data Exfiltration Report** - DLP effectiveness, insider risk

**Privacy & Compliance:**
- IAPP Privacy Tech Vendor Report
- TrustArc Privacy Compliance Report
- OneTrust Privacy Maturity Report
- Cisco Privacy Benchmark Study
- Gartner Privacy Engineering Report

**Insider Threats:**
- Ponemon Cost of Insider Threats Report
- ObserveIT Insider Threat Report
- Proofpoint Insider Threat Report
- Code42 Data Exposure Report
- Dtex Systems Insider Threat Intelligence Report

### 9. Industry-Specific Reports (80+ sources)

**Financial Services:**
- FS-ISAC Navigating Cyber Report
- VMware Carbon Black Modern Bank Heists Report
- Accenture State of Cybersecurity in Financial Services
- Deloitte Financial Services Cybersecurity Report
- SWIFT Customer Security Programme Report
- American Bankers Association Deposit Account Fraud Survey
- UK Finance Fraud Report
- Federal Reserve Payment Fraud Insights

**Healthcare:**
- HIMSS Healthcare Cybersecurity Survey
- Fortified Health Security Horizon Report
- Protenus Breach Barometer
- Black Book Healthcare Cybersecurity Survey
- HHS HIPAA Breach Report Analysis
- Censinet State of Healthcare Cybersecurity

**Retail & E-commerce:**
- NRF/Forrester Retail Cybersecurity Report
- LexisNexis True Cost of Fraud (Retail)
- Verizon Payment Security Report
- Akamai Retail Attack & API Traffic Report

**Manufacturing & ICS:**
- Dragos ICS/OT Cybersecurity Year in Review
- Claroty Industrial Cybersecurity Report
- Nozomi Networks OT/IoT Security Report
- Forescout Vedere Labs OT Security Report
- Siemens State of Industrial Security

**Energy & Utilities:**
- ICS-CERT Year in Review
- S&P Global Platts Energy Security Report
- NERC GridEx After-Action Report

**Government & Defense:**
- CISA Federal Cybersecurity Risk Determination Report
- DoD Cyber Strategy Implementation Report
- GAO High-Risk Series: Ensuring the Cybersecurity of the Nation

### 10. Compliance & Regulatory (40+ sources)

**Compliance Benchmarks:**
- Verizon PCI Compliance Report
- Coalfire CMMC Readiness Report
- Trustwave Global Security Report (PCI focus)
- Qualys Compliance Benchmark Reports
- Rapid7 Vulnerability Risk Management Report

**Audit & Governance:**
- ISACA State of Cybersecurity Report
- (ISC)² Cybersecurity Workforce Study
- ESG Cybersecurity Spending Trends
- Gartner Security and Risk Management Survey
- Forrester Security Survey

### 11. Vendor & Technology Reports (60+ sources)

**Security Platforms:**
- Splunk State of Security Report
- Elastic Security Outcomes Study
- Sumo Logic State of Modern Apps and Security
- LogRhythm Security Intelligence Report

**Vulnerability Management:**
- Tenable Cyber Exposure Report
- Qualys TruRisk Research Report
- Rapid7 Vulnerability Intelligence Report
- Kenna Security Risk-Based Vulnerability Management Report

**Penetration Testing:**
- Cobalt State of Pentesting Report
- HackerOne Hacker-Powered Security Report
- Bugcrowd Inside the Platform Report
- Bishop Fox Cybersecurity Report

**Threat Intelligence Platforms:**
- Recorded Future Threat Intelligence Report
- Anomali Cyber Threat Report
- ThreatConnect Research Report
- IntSights Cyber Threat Intelligence Report

### 12. Emerging Technology Security (35+ sources)

**AI/ML Security:**
- Microsoft AI Security Research Report
- Google AI Safety Report
- IBM AI Security Report
- Adversa AI Security Report
- MITRE ATLAS (Adversarial Threat Landscape for AI Systems)

**IoT Security:**
- Palo Alto Unit 42 IoT Threat Report
- Forescout Device Cloud Report
- Armis Asset Visibility and Security Report
- Zingbox IoT Security Report

**Blockchain & Crypto:**
- Chainalysis Crypto Crime Report
- CipherTrace Cryptocurrency Crime Report
- Elliptic State of Cross-Chain Crime

**5G Security:**
- Ericsson 5G Security Report
- GSMA Mobile Threat Intelligence Report

### 13. Human Factor & Security Awareness (30+ sources)

**Security Awareness Training:**
- KnowBe4 Phishing By Industry Benchmarking Report
- SANS Security Awareness Report
- Proofpoint State of the Phish
- Terranova Security Gone Phishing Tournament Report
- Wombat Security State of the Phish (legacy)

**Human Risk:**
- Tessian Psychology of Human Error Report
- Egress Email Security Risk Report
- Forcepoint Human-Centric Cybersecurity Report

**Security Culture:**
- CLTRe Security Culture Report
- SANS Security Culture Survey
- ISF Cybersecurity Culture Report

### 14. Cyber Insurance & Risk (25+ sources)

**Cyber Insurance Market:**
- Coalition Cyber Claims Report
- Corvus Cyber Insurance Report
- Aon Cyber Insurance Trends
- Marsh Microsoft Cyber Handbook
- Hiscox Cyber Readiness Report
- Advisen Cyber Loss Data

**Risk Quantification:**
- Factor Analysis of Information Risk (FAIR) Institute Reports
- RiskLens Cyber Risk Quantification Report
- Safe Security Cyber Risk Quantification Report

### 15. Government & Policy Reports (40+ sources)

**US Government:**
- CISA Cybersecurity Alerts & Advisories (annual compilation)
- NSA Cybersecurity Advisories
- FBI Internet Crime Report (IC3)
- Secret Service Financial Crimes Report
- DHS Cybersecurity Strategy Report
- GAO Cybersecurity Reports
- NIST Cybersecurity Framework Updates

**International Government:**
- UK NCSC Annual Review
- ENISA Threat Landscape Report (Europe)
- CERT-EU Threat Landscape
- ACSC Annual Cyber Threat Report (Australia)
- CCCS National Cyber Threat Assessment (Canada)
- ANSSI Threat Panorama (France)
- BSI State of IT Security (Germany)
- JPCERT/CC Annual Activity Report (Japan)
- KCERT Annual Report (South Korea)

**International Organizations:**
- Interpol Cybercrime Report
- Europol Internet Organised Crime Threat Assessment (IOCTA)
- NATO Cyber Threat Assessment
- UN Cybersecurity Reports

## Report Access Methods

**Direct Publisher Websites:**
- Most reports freely available at vendor/organization websites
- Email registration often required
- Annual publication cycles (typically Q1/Q2)

**Aggregator Sites:**
- SANS Reading Room
- CISA Publications Library
- Dark Reading Reports
- TechTarget/SearchSecurity Research
- CSO Online Research Library

**Research Firms:**
- Gartner Research (subscription required)
- Forrester Research (subscription required)
- IDC Security Research
- ESG Research Library
- 451 Research (S&P Global)

## Key Metrics to Extract

When analyzing reports for CISO briefings:

1. **Attack Statistics:** Success rates, dwell time, mean time to detect/respond
2. **Cost Data:** Average breach costs, ransom payments, recovery expenses
3. **Threat Actor TTPs:** Common techniques, tools, attack chains
4. **Vulnerability Trends:** Most exploited CVEs, zero-days, patch cycles
5. **Industry Benchmarks:** Peer comparison, maturity levels, spending trends
6. **Compliance Gaps:** Common audit findings, remediation timelines
7. **Emerging Threats:** New attack vectors, evolving techniques
8. **Defensive Efficacy:** Control effectiveness, detection rates, false positives

## Examples

**Example 1: Fetch Latest DBIR**
```
User: "Get me the latest Verizon DBIR report"
→ FetchReport workflow activated
→ Identifies report: Verizon Data Breach Investigations Report
→ Searches for most recent edition
→ Extracts key findings: breach patterns, attack vectors, industry trends
→ Provides download link and executive summary
→ Result: Latest DBIR edition with actionable insights
```

**Example 2: Executive Threat Briefing**
```
User: "Create a Q1 2025 threat landscape briefing for the board"
→ ThreatBriefing workflow activated
→ Pulls from 10+ major reports: DBIR, M-Trends, CrowdStrike, IBM, Microsoft
→ Synthesizes ransomware trends, nation-state activity, emerging threats
→ Formats as executive-ready 2-page briefing
→ Includes charts, risk ratings, and recommended actions
→ Result: Board-ready threat intelligence summary
```

**Example 3: Industry-Specific Research**
```
User: "What do annual reports say about healthcare security in 2024?"
→ FetchReport workflow with industry filter
→ Aggregates findings from HIMSS, Fortified Health, Protenus, HHS breach data
→ Identifies healthcare-specific threats: ransomware targeting EHR, medical IoT attacks
→ Compares to previous years for trend analysis
→ Result: Healthcare security landscape overview with peer benchmarks
```

## Integration Points

**Research Skill:** Use for deep-dive analysis of report findings
**Fabric Patterns:** Apply extract_wisdom to lengthy reports for quick insights
**ceo-advisor/cto-advisor Skills:** Incorporate report data into strategic recommendations
**TelegramStatus Skill:** Send alerts when new high-priority reports are published
**Memory Skill:** Track which reports have been reviewed, key findings from each

## Maintenance

**Annual Updates Required:**
- Review new report sources (security vendor landscape changes)
- Archive discontinued reports
- Update URLs for report publishers that rebrand/merge
- Validate access methods (some reports move behind paywalls)

**Quarterly Reviews:**
- Check for special/mid-year reports from major publishers
- Update emerging threat categories
- Add new security domains (e.g., quantum security, AI red teaming)

## Report Publication Calendar

**Q1 (January-March):**
- Verizon DBIR (typically late May/early June)
- IBM Cost of a Data Breach (July)
- Most vendor year-end reports from prior year

**Q2 (April-June):**
- Mandiant M-Trends (March/April)
- Microsoft Digital Defense Report (October)
- Gartner Magic Quadrants updated

**Q3 (July-September):**
- CrowdStrike Global Threat Report (February/March)
- Forrester Wave Reports (various)

**Q4 (October-December):**
- Government fiscal year reports (US)
- Ponemon Cost studies
- Year-end threat predictions

**Note:** Publication dates vary annually; this is a general pattern.

## Usage Tips for CISO Consulting

1. **Benchmark Against Peers:** Use industry-specific reports for comparative analysis
2. **Support Budget Requests:** Cost data from Ponemon/IBM for business case development
3. **Board Communications:** High-level insights from Microsoft/CrowdStrike for executive audiences
4. **Technical Deep-Dives:** Mandiant/Unit 42 for SOC team training and threat hunting
5. **Compliance Evidence:** Cite SANS/Verizon for control justification in audits
6. **Trend Analysis:** Compare 3-5 years of same report for strategic planning
7. **Vendor Evaluation:** Use Gartner/Forrester alongside technical reports for procurement

## Voice Notification Support

When delivering report findings via voice:
- **COMPLETED** line format: "Retrieved [Report Name] [Year] with [X] key findings"
- Keep technical details in written format
- Speak high-level insights, risks, and recommendations
- Reference page numbers for detailed follow-up

---

**Skill Metadata:**
- **Created:** 2025-01-27
- **Report Count:** 570+ sources across 15 categories
- **Update Frequency:** Quarterly skill review, annual full catalog update
- **Primary Users:** CISO consultants, security researchers, threat intelligence analysts
- **Integration:** Research, Fabric, CEO/CTO advisors, Memory
