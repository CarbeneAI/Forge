# Threat Intelligence Workflow

Defensive threat actor research and adversary intelligence gathering for client protection and security planning.

## Objective

Gather and analyze threat intelligence from public sources to:
- Understand threat actor tactics and techniques
- Identify relevant indicators of compromise (IOCs)
- Assess client-specific threat landscape
- Inform defensive security strategies
- Support incident response and threat hunting
- Develop threat-informed defense

## Defensive Purpose Only

**CRITICAL**: This workflow is STRICTLY for defensive security purposes.

**Appropriate Use Cases**:
- Client threat briefings and education
- Red team planning (authorized defensive exercises)
- Incident response preparation
- Threat hunting playbook development
- Security awareness training
- Security control prioritization
- Risk assessment and modeling

**Prohibited Activities**:
- Offensive operations
- Unauthorized penetration testing
- Active reconnaissance of threat actors
- Retaliation or counterattacks
- Engaging with threat actors
- Dark web purchases or transactions

## Prerequisites

- [ ] Clear defensive purpose documented
- [ ] Client authorization for threat research
- [ ] Scope defined (which threats, why)
- [ ] Ethical framework reviewed
- [ ] Legal counsel consulted (if needed)
- [ ] Operational security measures in place

## Workflow Steps

### Phase 1: Threat Identification

**Goal**: Identify relevant threat actors and campaigns

```bash
# Notify workflow start
${PAI_DIR}/tools/skill-workflow-notification ThreatIntel OSINT
```

1. **Define Threat Scope**

   **By Industry**:
   - Financial services → FIN7, Carbanak, Lazarus Group
   - Healthcare → APT41, ransomware groups
   - Energy → Dragonfly, Energetic Bear
   - Technology → APT10, APT41, nation-state actors
   - Retail → Magecart, POS malware groups
   - Government → Various nation-state APTs

   **By Geography**:
   - North America → Russian and Chinese APTs
   - Europe → Russian APTs, ransomware
   - Asia-Pacific → Chinese APTs, North Korean actors
   - Middle East → Iranian APTs, regional actors

   **By Threat Type**:
   - Ransomware groups (REvil, Conti, LockBit, BlackCat)
   - Nation-state APTs (APT28, APT29, APT41, Lazarus)
   - Financially motivated (FIN7, Carbanak, Magecart)
   - Hacktivists (Anonymous, various regional groups)
   - Insider threats (industry-specific patterns)

2. **Prioritize Threats**

   **Prioritization Criteria**:
   - Targets client's industry
   - Operates in client's geography
   - Uses TTPs relevant to client's tech stack
   - Recent campaign activity
   - Sophistication level matches client's profile
   - Historical success against similar targets

3. **Initial Threat List**

   Create prioritized list with rationale:
   ```markdown
   | Threat Actor | Priority | Rationale |
   |--------------|----------|-----------|
   | APT29 | High | Targets government contractors, recent activity |
   | REvil | Medium | Ransomware threat to all sectors |
   | APT41 | High | Healthcare targeting, tech stack match |
   ```

**Deliverable**: Prioritized threat actor list

---

### Phase 2: MITRE ATT&CK Research

**Goal**: Understand threat actor tactics, techniques, and procedures

1. **MITRE ATT&CK Framework**
   - Visit: https://attack.mitre.org/
   - Search for threat actor by name or alias
   - Navigate to group page

2. **Extract TTPs**

   **For each threat actor, document**:

   **Tactics** (high-level goals):
   - Initial Access
   - Execution
   - Persistence
   - Privilege Escalation
   - Defense Evasion
   - Credential Access
   - Discovery
   - Lateral Movement
   - Collection
   - Command and Control
   - Exfiltration
   - Impact

   **Techniques** (specific methods):
   - Technique ID (e.g., T1566.001)
   - Technique name
   - Description
   - Examples from campaigns
   - Mitigations available

   **Procedures** (specific implementations):
   - Tools used
   - Malware families
   - Scripts and commands
   - Infrastructure patterns

3. **MITRE ATT&CK Navigator**
   - Visit: https://mitre-attack.github.io/attack-navigator/
   - Create heat map for threat actor
   - Visualize attack patterns
   - Export layer file for documentation

4. **Defensive Mapping**

   For each technique, identify:
   - Detection methods
   - Mitigation strategies
   - Relevant security controls
   - Client's current defensive posture

   **Example**:
   ```markdown
   ## T1566.001 - Spearphishing Attachment

   **Used by**: APT29, APT28, FIN7

   **Detection**:
   - Email gateway inspection
   - Sandbox analysis
   - User reporting
   - Endpoint behavior analytics

   **Mitigation**:
   - Email security training
   - Anti-phishing controls
   - Macro blocking policies
   - Application whitelisting

   **Client Status**: Partially implemented
   **Recommendation**: Enhance sandbox analysis
   ```

**Deliverable**: Comprehensive TTP mapping with defensive recommendations

---

### Phase 3: Indicators of Compromise (IOCs)

**Goal**: Collect and organize threat indicators

1. **IOC Categories**

   **Network Indicators**:
   - IP addresses (C2 servers)
   - Domain names (malicious, C2)
   - URLs (phishing, malware hosting)
   - Email addresses (phishing campaigns)
   - SSL certificate hashes

   **Host Indicators**:
   - File hashes (MD5, SHA1, SHA256)
   - File names and paths
   - Registry keys
   - Scheduled tasks
   - Service names
   - Mutex names

   **Behavioral Indicators**:
   - Process execution patterns
   - Network connection patterns
   - File modification behaviors
   - Privilege escalation attempts

2. **IOC Sources**

   **Public Threat Intelligence Platforms**:
   - AlienVault OTX: https://otx.alienvault.com/
   - ThreatConnect: https://app.threatconnect.com/
   - VirusTotal: https://www.virustotal.com/
   - Hybrid Analysis: https://www.hybrid-analysis.com/

   **Vendor Threat Reports**:
   - CrowdStrike Intelligence reports
   - Mandiant (now Google) threat reports
   - Palo Alto Unit 42 reports
   - Microsoft Security Intelligence
   - Cisco Talos Intelligence

   **Government Sources**:
   - CISA alerts: https://www.cisa.gov/uscert/ncas/alerts
   - FBI Flash alerts (if authorized)
   - NSA cybersecurity advisories
   - International CERT advisories

   **Security Researcher Blogs**:
   - Krebs on Security
   - The Hacker News
   - BleepingComputer
   - Security Week

3. **IOC Collection and Validation**

   **For each IOC**:
   - Source and publication date
   - Confidence level (high/medium/low)
   - Context (campaign, malware family)
   - False positive potential
   - Expiration or age

   **Validation Methods**:
   - Multiple source confirmation
   - VirusTotal checks for hashes/URLs
   - WHOIS for domain age and registration
   - Passive DNS for historical resolution
   - Threat intelligence platform reputation

4. **IOC Organization**

   **Structured Format** (CSV or JSON):
   ```csv
   type,indicator,description,source,date,confidence,campaign
   ip,192.0.2.100,APT29 C2 server,CISA Alert,2024-01-15,high,SolarWinds
   domain,evil.example.com,Phishing domain,Unit42,2024-01-10,medium,COVID-themed
   hash,abc123...,Emotet loader,VirusTotal,2024-01-05,high,Emotet Campaign
   ```

**Deliverable**: Validated IOC feed with metadata

---

### Phase 4: Campaign and Operation Research

**Goal**: Understand specific threat campaigns and operations

1. **Major Campaign Identification**

   **Research Questions**:
   - What was the campaign name?
   - What was the timeline?
   - Who were the targets?
   - What was the objective?
   - What TTPs were used?
   - What was the impact?
   - How was it discovered?
   - What were the lessons learned?

2. **Notable Campaigns by Threat Actor**

   **Example: APT29**
   - SolarWinds supply chain attack (2020)
   - COVID-19 vaccine research targeting (2020)
   - Democratic National Committee breach (2016)
   - Operation Ghost (ongoing)

   **For each campaign**:
   - Timeline and duration
   - Target organizations
   - Attack vector and initial access
   - Tools and malware used
   - Data stolen or impact
   - Attribution evidence
   - Defensive recommendations

3. **Campaign Analysis Sources**

   **Security Vendor Research**:
   - Use Research skill to search:
     - "[Campaign name] analysis"
     - "[Threat actor] campaign report"
     - "[Malware family] technical analysis"

   **Academic Research**:
   - Google Scholar for peer-reviewed analysis
   - University security lab reports
   - Conference proceedings (BlackHat, DEF CON)

   **Government Reports**:
   - CISA malware analysis reports (MARs)
   - Joint cybersecurity advisories
   - International CERT technical reports

4. **Evolution and Trends**

   **Track over time**:
   - Evolving TTPs
   - New tools or malware
   - Target shifts
   - Infrastructure changes
   - Collaboration with other groups

**Deliverable**: Campaign profiles with timeline and analysis

---

### Phase 5: Threat Actor Profiling

**Goal**: Build comprehensive adversary profiles

1. **Threat Actor Attributes**

   **Identity Information**:
   - Primary name/designation
   - Alternative names and aliases
   - Attribution (nation-state, criminal, hacktivist)
   - Sponsoring entity (if nation-state)
   - First observed date
   - Active status

   **Motivation and Objectives**:
   - Financial gain
   - Espionage/intelligence collection
   - Sabotage/disruption
   - Hacktivism/ideology
   - Competitive advantage

   **Sophistication Level**:
   - Low (script kiddies, opportunistic)
   - Medium (organized crime, commodity malware)
   - High (advanced persistent threats, zero-days)
   - Nation-state (extensive resources, patient)

   **Target Profile**:
   - Industries targeted
   - Geographic focus
   - Organization size preference
   - Technology stack preferences
   - Victim selection criteria

2. **Infrastructure and Resources**

   **Command and Control**:
   - C2 infrastructure patterns
   - Domain generation algorithms (DGAs)
   - IP address ranges
   - Hosting providers used
   - Proxy and anonymization methods

   **Tools and Malware**:
   - Custom malware families
   - Publicly available tools
   - Commercial tools (Cobalt Strike, etc.)
   - Exploit frameworks
   - Living-off-the-land binaries

3. **Operational Security (OpSec)**

   **Attribution Challenges**:
   - False flag operations
   - Infrastructure sharing
   - Tool reuse from other groups
   - Operational security measures
   - Anti-forensics techniques

4. **Threat Actor Profile Template**

   ```markdown
   # Threat Actor Profile: [Name/Designation]

   ## Overview
   **Alternative Names**: [Aliases]
   **Attribution**: [Nation-state/Criminal/Hacktivist]
   **First Observed**: [Year]
   **Status**: Active / Dormant

   ## Motivation
   [Primary objectives and motivations]

   ## Target Profile
   - **Industries**: [List]
   - **Geography**: [Regions]
   - **Organization Size**: [Small/Medium/Large/Enterprise]
   - **Selection Criteria**: [How they choose victims]

   ## Tactics, Techniques, and Procedures
   [Summary with links to MITRE ATT&CK]

   ### Initial Access
   - [Methods with technique IDs]

   ### Execution
   - [Methods with technique IDs]

   [Continue for all relevant tactics]

   ## Tools and Malware
   | Tool/Malware | Type | Purpose |
   |--------------|------|---------|
   | [Name] | [Custom/Commercial] | [Description] |

   ## Infrastructure
   - **C2 Patterns**: [Description]
   - **Hosting**: [Providers, countries]
   - **Domains**: [Pattern analysis]

   ## Notable Campaigns
   | Campaign | Date | Targets | Impact |
   |----------|------|---------|--------|
   | [Name] | [Year] | [Organizations] | [Brief] |

   ## Detection Strategies
   [How to detect this threat actor]

   ## Defensive Recommendations
   [Prioritized controls to defend against this threat]

   ## Intelligence Gaps
   [What is unknown or uncertain]

   ## References
   [All sources with dates]
   ```

**Deliverable**: Comprehensive threat actor profiles

---

### Phase 6: Industry and Sector Analysis

**Goal**: Understand broader threat landscape for client's industry

1. **Use AnnualReports Skill**

   Access industry threat reports:
   ```
   "Show me threat reports for [healthcare/financial/energy] sector"
   ```

   **Key Reports**:
   - Verizon DBIR (Data Breach Investigations Report)
   - Mandiant M-Trends
   - CrowdStrike Global Threat Report
   - IBM X-Force Threat Intelligence Index
   - Industry-specific reports (FS-ISAC, H-ISAC, etc.)

2. **Industry Threat Patterns**

   **Analyze**:
   - Most common attack vectors for industry
   - Typical attacker motivations
   - Average dwell time
   - Most targeted data types
   - Prevalent malware families
   - Regulatory breaches and impacts

3. **Peer Intelligence**

   **Research similar organizations**:
   - Recent breaches in same industry
   - Similar company size and profile
   - Geographic proximity
   - Technology stack similarities
   - Lessons learned from peer incidents

4. **Emerging Threats**

   **Monitor for**:
   - New threat groups targeting industry
   - Novel attack techniques
   - Zero-day exploits
   - Supply chain risks
   - Cloud security threats
   - IoT/OT vulnerabilities (if applicable)

**Deliverable**: Industry threat landscape assessment

---

### Phase 7: Threat Modeling and Prioritization

**Goal**: Apply threat intelligence to client-specific context

1. **Threat Modeling Framework**

   **Use STRIDE or similar**:
   - **S**poofing identity
   - **T**ampering with data
   - **R**epudiation
   - **I**nformation disclosure
   - **D**enial of service
   - **E**levation of privilege

   **Or use ATT&CK-based threat modeling**

2. **Client-Specific Risk Assessment**

   **For each prioritized threat**:
   ```markdown
   ## Threat: [Actor/Campaign]

   **Likelihood**: High / Medium / Low
   **Impact**: Critical / High / Medium / Low

   **Risk Score**: [Likelihood × Impact]

   **Rationale**:
   - Client matches target profile: [Yes/No + explanation]
   - Threat actor is active: [Yes/No]
   - Client has vulnerabilities to TTPs: [Assessment]
   - Existing controls: [Effectiveness]

   **Attack Path Analysis**:
   1. [Initial access method most likely]
   2. [Likely execution technique]
   3. [Expected lateral movement]
   4. [Target data or systems]
   5. [Potential impact]

   **Detection Confidence**: Can we detect this? [Yes/Partial/No]
   **Response Capability**: Can we respond? [Yes/Partial/No]
   ```

3. **Risk Matrix**

   | Threat Actor | Likelihood | Impact | Risk Score | Priority |
   |--------------|------------|--------|------------|----------|
   | APT29 | High | Critical | 9 | 1 |
   | REvil | Medium | High | 6 | 3 |
   | APT41 | High | High | 8 | 2 |

4. **Gap Analysis**

   **Identify defensive gaps**:
   - Undetected TTPs
   - Missing security controls
   - Insufficient logging/monitoring
   - Inadequate response procedures
   - Training and awareness needs

**Deliverable**: Client-specific threat model with risk prioritization

---

### Phase 8: Defensive Recommendations

**Goal**: Provide actionable security improvements

1. **Prioritized Control Recommendations**

   **Tier 1 (Critical - Immediate Implementation)**:
   - Controls addressing highest-priority threats
   - Quick wins with high impact
   - Critical gaps in current defenses

   **Tier 2 (High - Within 90 days)**:
   - Important controls for major threats
   - Medium complexity implementations
   - Enhance existing controls

   **Tier 3 (Medium - Within 6 months)**:
   - Defense-in-depth improvements
   - Advanced detection capabilities
   - Long-term strategic controls

2. **MITRE ATT&CK Defensive Mapping**

   For top threats, map defenses:
   ```markdown
   ## Defense Against APT29

   ### Initial Access Defense
   - **Phishing Protection**:
     - Email gateway with sandbox
     - Link analysis
     - User training quarterly
     - Phishing simulations

   ### Execution Defense
   - **Application Whitelisting**:
     - Deploy on critical systems
     - Block untrusted executables
     - PowerShell logging and restrictions

   ### Persistence Defense
   - **Registry Monitoring**:
     - Alert on suspicious registry changes
     - Baseline authorized persistence
     - Automated removal of unauthorized items

   [Continue for all relevant tactics]
   ```

3. **Detection Use Cases**

   **Create SIEM detection rules**:
   ```markdown
   ## Detection Use Case: APT29 Cobalt Strike Beacon

   **Description**: Detect Cobalt Strike C2 traffic patterns

   **Data Sources**:
   - Network traffic logs
   - Proxy logs
   - Endpoint network connections

   **Detection Logic**:
   - Periodic beaconing to external IP
   - Specific User-Agent strings
   - TLS certificate patterns
   - Unusual DNS requests

   **Alert Priority**: High

   **Response Actions**:
   1. Isolate affected endpoint
   2. Analyze process tree
   3. Check for lateral movement
   4. Preserve forensic evidence
   5. Escalate to IR team
   ```

4. **Threat Hunting Playbooks**

   **Proactive hunting procedures**:
   ```markdown
   ## Hunt Playbook: APT29 Post-Compromise Activity

   **Hypothesis**: APT29 has achieved initial access and is performing reconnaissance

   **Hunting Procedure**:
   1. Search for PowerShell reconnaissance scripts
   2. Analyze unusual admin tool execution
   3. Check for LSASS memory dumps
   4. Review remote desktop connections
   5. Examine scheduled task creation
   6. Analyze unusual service installations

   **Data Sources**: [Logs required]
   **Tools**: [EDR, SIEM, etc.]
   **Success Criteria**: [What confirms hypothesis]
   ```

5. **Incident Response Procedures**

   **Threat-specific IR playbooks**:
   - Detection and triage
   - Containment strategies
   - Eradication procedures
   - Recovery steps
   - Post-incident activities

**Deliverable**: Comprehensive defensive strategy with prioritized recommendations

---

### Phase 9: Report Generation

**Goal**: Deliver actionable threat intelligence report

**Report Structure**:

```markdown
# Threat Intelligence Report: [Client Name]

**Prepared for**: [Client]
**Date**: [YYYY-MM-DD]
**Classification**: Confidential
**Prepared by**: PAI OSINT Skill

## Executive Summary
[2-3 paragraphs: Key threats, risk assessment, priority recommendations]

## Scope and Methodology
- **Purpose**: [Defensive threat intelligence]
- **Timeline**: [Research period]
- **Sources**: Public threat intelligence only
- **Framework**: MITRE ATT&CK

## Threat Landscape Overview
### Industry Threat Trends
[Summary from Phase 6]

### Emerging Threats
[New threats on the horizon]

## Prioritized Threat Actors
[Top 5-10 threat actors with profiles from Phase 5]

## Threat Actor Profiles
[Detailed profiles for each priority threat]

## Tactics, Techniques, and Procedures
[MITRE ATT&CK mapping from Phase 2]

## Indicators of Compromise
[IOC feed from Phase 3 - may be separate file]

## Risk Assessment
[Threat model and risk matrix from Phase 7]

## Defensive Recommendations
### Immediate Actions (0-30 days)
[Critical controls]

### Short-term Actions (30-90 days)
[High-priority improvements]

### Long-term Strategy (6-12 months)
[Strategic enhancements]

## Detection Use Cases
[SIEM rules and hunting playbooks from Phase 8]

## Incident Response Considerations
[Threat-specific IR procedures]

## Intelligence Gaps
[Unknown or uncertain information]

## References
[All sources with dates and URLs]

## Appendices
- A: Full IOC List (CSV format)
- B: MITRE ATT&CK Navigator Layers
- C: Detection Rule Templates
- D: Threat Hunting Queries
```

**Delivery Formats**:
- PDF (for executive stakeholders)
- Markdown (for technical teams)
- STIX/TAXII feed (for SIEM integration)
- CSV IOC file (for defensive tools)

---

## Quality Checklist

Before delivering the report:

- [ ] All threats tied to client's risk profile
- [ ] TTPs mapped to MITRE ATT&CK
- [ ] IOCs validated and contextualized
- [ ] Recommendations are actionable and prioritized
- [ ] Detection use cases are implementable
- [ ] Sources documented with dates
- [ ] No offensive tactics recommended
- [ ] Defensive purpose clearly stated
- [ ] Professional tone and accuracy
- [ ] Executive summary is non-technical

---

## Integration with Other Skills

**Complementary Skills**:
- **AnnualReports**: Access 570+ threat intelligence sources
- **Research**: Deep-dive on specific threats or campaigns
- **CompanyIntel**: Research threat actor infrastructure
- **Ehud (Agent)**: Validate defensive controls via authorized testing

**Parallel Research**:
```typescript
// Launch multiple intern agents for different threat actors
Task({
  prompt: "Research APT29 TTPs and recent campaigns using MITRE ATT&CK",
  subagent_type: "intern",
  model: "sonnet"
})

Task({
  prompt: "Research REvil ransomware TTPs and IOCs from public reports",
  subagent_type: "intern",
  model: "sonnet"
})

Task({
  prompt: "Collect healthcare sector threat landscape from recent reports",
  subagent_type: "intern",
  model: "haiku"
})
```

---

## Ongoing Threat Intelligence

**After initial report**:

1. **Continuous Monitoring**
   - Subscribe to threat intelligence feeds
   - Monitor security researcher Twitter/X
   - Track CISA and vendor advisories
   - Review daily security news

2. **Regular Updates**
   - Quarterly threat briefings
   - Monthly IOC updates
   - Ad-hoc alerts for critical threats
   - Annual comprehensive reassessment

3. **Threat Intelligence Platform**
   - Consider commercial TIP (MISP, ThreatConnect)
   - Automate IOC ingestion
   - Integrate with SIEM
   - Enable threat hunting workflows

---

## Time Estimates

**Initial Threat Intelligence Report**:

- Phase 1 (Identification): 1-2 hours
- Phase 2 (MITRE ATT&CK): 3-4 hours
- Phase 3 (IOCs): 2-3 hours
- Phase 4 (Campaigns): 2-3 hours
- Phase 5 (Profiling): 3-4 hours
- Phase 6 (Industry): 2-3 hours
- Phase 7 (Modeling): 2-3 hours
- Phase 8 (Recommendations): 3-4 hours
- Phase 9 (Report): 3-4 hours

**Total**: 20-30 hours for comprehensive threat intelligence report

**Ongoing**: 4-8 hours monthly for updates

---

## Operational Security Notes

When conducting threat intelligence research:

- Use VPN or anonymization (Tor) when researching threat actor infrastructure
- Never engage directly with threat actors
- Don't visit malicious sites without proper sandboxing
- Be cautious with IOC testing (use isolated environments)
- Sanitize data before sharing with clients
- Protect sources and methods
- Follow responsible disclosure for new findings

---

## Legal and Ethical Considerations

**Remember**:
- Threat intelligence is for DEFENSE only
- Never conduct offensive operations
- Respect law enforcement investigations
- Don't interfere with active threat actor operations
- Report significant threats to authorities (CISA)
- Comply with information sharing agreements
- Protect client confidentiality

**Questions during execution? Consult `reference/EthicalFramework.md`**
