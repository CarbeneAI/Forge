# OSINT Ethical Framework

Comprehensive ethical and legal guidelines for open source intelligence gathering in CISO/CTO consulting engagements.

## Core Ethical Principles

### 1. Authorization First

**NEVER begin OSINT activities without proper authorization.**

**Required Authorization Types**:

- **Client Engagement Letter**: Written agreement defining scope, purpose, and limitations
- **Legal Counsel Review**: Attorney approval of engagement terms and methodology
- **Internal Approval**: Company compliance and legal team sign-off
- **Subject Notification**: Where required by law or policy (e.g., employment background checks)

**Authorization Documentation Must Include**:
- Specific scope of research (what entities, what data)
- Purpose and justification
- Legal basis (contract, legitimate interest, consent)
- Data retention and deletion policies
- Subject rights and recourse
- Limitations and boundaries

**Red Flags - Stop and Get Approval**:
- Client asks for information about competitors (potential espionage)
- Request to research individuals without business justification
- Scope expands beyond original authorization
- Client requests access to non-public data
- Legal or ethical boundaries unclear

### 2. Public Sources Only

**Definition of "Public Source"**:
✅ **Acceptable**:
- Publicly accessible websites (no authentication required)
- Social media profiles set to "public"
- Government databases (EDGAR, WHOIS, USPTO)
- Published news articles and media
- Conference proceedings and academic publications
- Open source code repositories
- Professional networking sites (public portions)
- Public breach databases (Have I Been Pwned)
- Search engines and web archives

❌ **Prohibited**:
- Password-protected content (even if weak password)
- Content requiring authentication or login
- Paid databases (unless you have legitimate subscription)
- Data obtained through social engineering
- Information from data breaches (except aggregated public breach lists)
- Private messages or communications
- Non-public portions of social media profiles
- Paywalled content (unless you pay legitimately)

**Gray Areas Requiring Legal Approval**:
- LinkedIn profile viewing (may notify subject)
- Web scraping (check terms of service)
- Archived content from Wayback Machine
- Public records that require payment (court records, property records)
- OSINT tools that aggregate public data

### 3. Do No Harm

**Harm Prevention Principles**:

**Do NOT**:
- Engage in or encourage illegal activity
- Cause reputational damage without justification
- Violate privacy rights
- Discriminate based on protected characteristics
- Share sensitive information irresponsibly
- Use information for purposes beyond authorization
- Retaliate or exact revenge
- Harass or stalk individuals
- Interfere with law enforcement operations

**Minimize Harm**:
- Use least invasive methods to achieve objectives
- Limit scope to what's necessary
- Protect subject privacy where possible
- Handle sensitive findings responsibly
- Provide context for negative information
- Allow subjects to respond to adverse findings
- Secure all collected intelligence
- Delete data when no longer needed

### 4. Accuracy and Verification

**Truth and Accuracy Standards**:

- Verify information through multiple sources
- Distinguish between fact and inference
- Assign confidence levels to findings
- Acknowledge limitations and gaps
- Correct errors promptly
- Don't speculate or assume
- Provide context for all findings
- Cite sources properly

**Confidence Levels**:
- **High**: Multiple corroborating sources, official records
- **Medium**: Single credible source, consistent with other data
- **Low**: Unverified, single uncorroborated source, indirect evidence

### 5. Transparency and Honesty

**With Clients**:
- Be clear about capabilities and limitations
- Disclose methodology and sources
- Explain confidence levels
- Acknowledge ethical boundaries
- Refuse unethical requests
- Report findings honestly (even if unfavorable)

**With Subjects** (where applicable):
- Disclose research if required by law
- Provide opportunity to correct information
- Explain purpose and legal basis
- Honor data rights (access, deletion, correction)

---

## Legal Framework

### United States

**Fair Credit Reporting Act (FCRA)**:

**Applies when**:
- OSINT used for employment decisions
- OSINT used for credit, insurance, or housing decisions
- Report provided by third party

**Requirements**:
- Subject must provide written consent
- Must provide disclosure before adverse action
- Subject has right to dispute findings
- Report must be accurate and complete
- Reasonable procedures to ensure accuracy

**OSINT Impact**:
- Background checks for hiring = FCRA applies
- Due diligence for partnerships = FCRA may not apply (consult counsel)
- Internal research for security = FCRA typically doesn't apply

**Computer Fraud and Abuse Act (CFAA)**:

**Prohibits**:
- Unauthorized access to protected computers
- Exceeding authorized access
- Accessing computer to obtain information
- Causing damage through unauthorized access

**OSINT Implications**:
- Don't access password-protected systems
- Don't bypass authentication mechanisms
- Don't use credentials not authorized for you
- Don't scrape in violation of ToS (gray area)
- Don't use automated tools against a site's wishes

**Electronic Communications Privacy Act (ECPA)**:

**Prohibits**:
- Intercepting electronic communications
- Accessing stored communications without authorization
- Unauthorized disclosure of communications

**OSINT Implications**:
- Don't intercept emails or messages
- Don't access private communications
- Don't use illegally obtained communications

**State Privacy Laws**:

**California (CCPA/CPRA)**:
- Provides broad privacy rights to California residents
- Rights: Access, deletion, correction, opt-out
- Applies to businesses collecting California resident data
- Penalties for violations

**Colorado, Virginia, Connecticut, Utah** (Similar laws):
- Resident privacy rights
- Data protection obligations
- Consent requirements

**Illinois Biometric Information Privacy Act (BIPA)**:
- Strict rules on biometric data collection
- Don't collect facial recognition or biometric data without consent

### European Union

**General Data Protection Regulation (GDPR)**:

**Applies when**:
- Subject is in EU
- Your company operates in EU
- You offer services to EU residents

**Key Principles**:
- **Lawfulness**: Must have legal basis (consent, legitimate interest, legal obligation)
- **Purpose Limitation**: Only use data for stated purpose
- **Data Minimization**: Collect only what's necessary
- **Accuracy**: Ensure data is accurate and up to date
- **Storage Limitation**: Don't keep data longer than needed
- **Integrity and Confidentiality**: Protect data security

**Subject Rights**:
- Right to access their data
- Right to rectification (correction)
- Right to erasure ("right to be forgotten")
- Right to restrict processing
- Right to data portability
- Right to object

**OSINT Implications**:
- Document legal basis for research
- Minimize data collection
- Implement data retention policies
- Honor subject access requests
- Appoint DPO if required
- Conduct DPIA for high-risk processing
- Secure all collected data

**Penalties**: Up to €20M or 4% of annual revenue

### Canada

**Personal Information Protection and Electronic Documents Act (PIPEDA)**:
- Consent requirements
- Purpose limitation
- Data accuracy obligations
- Security safeguards
- Subject access rights

### Australia

**Privacy Act 1988**:
- Australian Privacy Principles (APPs)
- Consent and notification requirements
- Data security obligations
- Cross-border disclosure restrictions

### Other Jurisdictions

**Always consult local counsel when operating internationally.**

---

## Scope Boundaries

### What's In Scope

**Company Intelligence**:
✅ Corporate structure and ownership
✅ Executive leadership
✅ Public financial information
✅ Technology stack (public info)
✅ Security posture (public-facing)
✅ Breach history (public records)
✅ Regulatory filings
✅ News and media coverage
✅ Public employee information (LinkedIn)
✅ Domain and infrastructure (external)

**People Intelligence**:
✅ Professional background
✅ Education and credentials
✅ Public certifications
✅ Published work and presentations
✅ Professional social media
✅ Conference talks and appearances
✅ Industry reputation
✅ Public breach exposure (email addresses)

**Threat Intelligence**:
✅ APT tactics and techniques
✅ Public malware analysis
✅ Indicators of compromise (public)
✅ Campaign analysis (public reports)
✅ Industry threat landscape
✅ Vendor threat intelligence
✅ Government threat advisories

### What's Out of Scope

**Company Intelligence**:
❌ Internal networks or systems
❌ Employee credentials or passwords
❌ Non-public financial information
❌ Trade secrets
❌ Confidential business plans
❌ Internal communications
❌ Proprietary data

**People Intelligence**:
❌ Personal life details (family, relationships)
❌ Private social media posts
❌ Medical or health information
❌ Financial records (bank accounts, credit)
❌ Private communications
❌ Home address or personal phone (unless public)
❌ Information obtained through deception
❌ Protected characteristics (unless job-related)

**Threat Intelligence**:
❌ Active engagement with threat actors
❌ Accessing malicious infrastructure
❌ Purchasing stolen data or credentials
❌ Dark web transactions
❌ Offensive operations
❌ Unauthorized penetration testing

---

## Authorization Requirements

### Engagement Agreement Checklist

Before beginning OSINT, ensure written agreement includes:

- [ ] **Client Information**: Full legal name, address, authorized representative
- [ ] **Scope of Research**: Specific entities, individuals, or threats to research
- [ ] **Purpose and Justification**: Business need and legal basis
- [ ] **Methodology**: OSINT techniques to be used, sources consulted
- [ ] **Legal Compliance**: GDPR, FCRA, CCPA, or other applicable laws
- [ ] **Data Handling**: How data will be collected, stored, secured, and deleted
- [ ] **Retention Period**: How long data will be kept
- [ ] **Deliverables**: What will be provided to client
- [ ] **Limitations**: What will NOT be done (out of scope)
- [ ] **Subject Rights**: How subjects can access, correct, or delete their data
- [ ] **Liability and Indemnification**: Risk allocation
- [ ] **Confidentiality**: How findings will be protected
- [ ] **Termination**: How engagement can be ended
- [ ] **Signatures**: Both parties sign and date

### Special Authorizations

**Employment Background Checks**:
- Candidate written consent
- FCRA disclosure and authorization form
- Pre-adverse and adverse action notices
- Opportunity to dispute findings

**EU Subjects**:
- GDPR legal basis documented
- Data Protection Impact Assessment (DPIA) if high-risk
- DPO consultation if required
- Subject notification (may be required)

**Sensitive Industries** (healthcare, finance, government):
- Industry-specific compliance (HIPAA, GLBA, FedRAMP)
- Enhanced security measures
- Regulatory approval if needed

---

## Ethical Decision Framework

**When facing an ethical dilemma, use this framework**:

### Step 1: Identify the Issue

What is the ethical concern?
- Privacy violation?
- Legal gray area?
- Potential harm?
- Unauthorized access?
- Scope creep?

### Step 2: Gather Information

- What are the facts?
- What laws apply?
- What does the engagement agreement say?
- What are the potential consequences?
- What are the stakeholder interests?

### Step 3: Consider Alternatives

- What are different approaches?
- What's the most ethical option?
- What's the least harmful option?
- Is there a legal way to achieve the objective?

### Step 4: Evaluate Against Principles

**Test against**:
- Is it legal?
- Is it authorized?
- Is it from public sources only?
- Does it minimize harm?
- Is it truthful and accurate?
- Would I be comfortable if it were made public?
- Would I want this done to me?

### Step 5: Consult

**When in doubt, consult**:
- Legal counsel
- Company ethics officer
- Industry associations
- Trusted colleagues
- Client (if appropriate)

### Step 6: Decide and Document

- Make a decision
- Document reasoning
- Implement with safeguards
- Monitor for issues

### Step 7: Review

- Did it work as intended?
- Were there unintended consequences?
- What was learned?
- Would you do it differently next time?

---

## Prohibited Activities

**NEVER do the following**:

### Technical Exploitation
❌ Unauthorized penetration testing
❌ Vulnerability exploitation
❌ Credential stuffing or password cracking
❌ Man-in-the-middle attacks
❌ Network sniffing or packet capture
❌ SQL injection or code injection
❌ DDoS or denial of service
❌ Malware deployment

### Social Engineering
❌ Pretexting (creating false scenarios)
❌ Phishing employees or subjects
❌ Impersonating others
❌ Elicitation through deception
❌ Bribing or coercing sources
❌ Manipulating individuals for information

### Unauthorized Access
❌ Using stolen credentials
❌ Bypassing authentication
❌ Accessing private accounts
❌ Password guessing or brute force
❌ Exploiting misconfigurations
❌ Unauthorized API access

### Data Acquisition
❌ Purchasing stolen data
❌ Using leaked credentials
❌ Dark web transactions
❌ Bribing insiders for information
❌ Hacking or theft
❌ Wiretapping or interception

### Harassment and Intimidation
❌ Stalking individuals
❌ Repeated unwanted contact
❌ Threatening subjects
❌ Doxxing or public shaming
❌ Blackmail or extortion

### Illegal Activities
❌ Violating CFAA or equivalent laws
❌ Copyright infringement
❌ Fraud or identity theft
❌ Witness tampering
❌ Obstruction of justice
❌ Money laundering
❌ Espionage

---

## Data Handling and Security

### Collection

**Minimize Collection**:
- Only collect what's necessary for stated purpose
- Don't collect sensitive data unless essential
- Avoid personally identifiable information (PII) when possible
- Screen captures must be necessary and relevant

**Source Documentation**:
- URL and access date
- Screenshot if appropriate
- Context and relevance
- How data was obtained

### Storage

**Security Requirements**:
- Encrypted storage (AES-256 or better)
- Access controls (least privilege)
- Audit logging (who accessed what)
- Backup and disaster recovery
- Physical security for servers/devices

**Classification**:
- Label data by sensitivity
- Separate different client data
- Protect attorney-client privileged information
- Mark confidential vs. public

### Transmission

**Secure Communication**:
- Encrypted email (TLS minimum, S/MIME or PGP preferred)
- Secure file transfer (SFTP, encrypted cloud)
- Avoid unencrypted email for sensitive data
- Password-protect documents sent electronically

### Retention

**Retention Policies**:
- Keep only as long as needed
- Document retention schedule
- Delete after retention period
- Secure deletion (overwrite, not just delete)

**Typical Retention**:
- Active client engagement: Duration + 90 days
- Completed engagement: Per contract or law (often 3-7 years)
- No longer needed: Delete immediately

### Deletion

**Secure Deletion Methods**:
- Digital: Overwrite multiple times (DoD 5220.22-M or better)
- Physical media: Shred or physically destroy
- Cloud storage: Verify deletion across all backups
- Document deletion with date and method

### Breach Response

**If data is compromised**:
1. Contain the breach immediately
2. Assess scope and impact
3. Notify affected parties (clients, subjects)
4. Notify authorities if required (GDPR: 72 hours)
5. Document incident and response
6. Remediate vulnerabilities
7. Review and improve security

---

## Subject Rights and Responsibilities

### Subject Rights (especially under GDPR/CCPA)

**Right to Access**:
- Subject can request what data you hold
- You must provide within 30 days (GDPR) or 45 days (CCPA)
- Free of charge (usually)

**Right to Rectification**:
- Subject can correct inaccurate data
- You must update within 30 days
- Notify recipients if data was shared

**Right to Erasure** ("Right to Be Forgotten"):
- Subject can request deletion
- You must delete unless legal basis to keep
- Exceptions: Legal obligations, legal claims, public interest

**Right to Restrict Processing**:
- Subject can limit how data is used
- You must comply or explain why not

**Right to Data Portability**:
- Subject can request data in machine-readable format
- To transfer to another service

**Right to Object**:
- Subject can object to processing for legitimate interest
- You must stop unless compelling reason to continue

### Your Responsibilities

**Respond Promptly**:
- Acknowledge request within reasonable time
- Fulfill within legal deadlines
- Document all requests and responses

**Verify Identity**:
- Ensure requester is actually the subject
- Don't provide data to wrong person

**Provide Clear Information**:
- Explain what data you hold
- Explain why you collected it
- Explain legal basis
- Explain retention period
- Explain rights

---

## Special Considerations

### Cross-Border Intelligence

**Complications**:
- Different laws in different countries
- Data localization requirements
- Cross-border data transfer restrictions
- Cultural and ethical differences

**Best Practices**:
- Understand laws in all relevant jurisdictions
- Use GDPR as baseline (highest standard)
- Consult local counsel
- Respect local customs and expectations
- Document legal basis for transfers

### Sensitive Personal Information

**Special Categories (GDPR Article 9)**:
- Race or ethnic origin
- Political opinions
- Religious or philosophical beliefs
- Trade union membership
- Genetic data
- Biometric data
- Health data
- Sex life or sexual orientation

**NEVER collect without explicit consent or legal requirement.**

**If encountered incidentally**:
- Don't include in report unless directly relevant
- Protect with enhanced security
- Delete as soon as possible if not needed

### Whistleblowers and Protected Sources

**If source requests anonymity**:
- Honor the request
- Protect source identity
- Use secure communication
- Don't document source in reports
- Prepare for legal process (may be compelled to disclose)

### Conflict of Interest

**Avoid or disclose**:
- Financial interest in subject
- Personal relationship with subject
- Previous work for or against subject
- Competing client interests

**Maintain objectivity**:
- Don't let bias affect findings
- Disclose conflicts to client
- Consider recusal if conflict is significant

---

## Ethical Red Lines

**These are absolute prohibitions. Violation = Stop work immediately.**

1. **Illegal Activity**: Never break the law, even if client requests it.
2. **Unauthorized Access**: Never access systems without authorization.
3. **Social Engineering**: Never deceive people for information.
4. **Harm**: Never cause harm to subjects without justification.
5. **Fraud**: Never misrepresent yourself or your purpose.
6. **Discrimination**: Never discriminate based on protected characteristics.
7. **Retaliation**: Never use OSINT for revenge or personal vendettas.
8. **Offensive Operations**: Never conduct offensive cyber operations.

**If client requests any of these, refuse and document.**

---

## Questions to Ask Before Starting

Before beginning OSINT, ask yourself:

1. **Authorization**: Do I have clear written authorization?
2. **Legal**: Have I consulted legal counsel? Do I understand applicable laws?
3. **Purpose**: Is the purpose legitimate and defensive?
4. **Scope**: Is the scope clearly defined and reasonable?
5. **Methods**: Will I use only public sources and ethical methods?
6. **Harm**: Have I considered potential harm and minimized it?
7. **Privacy**: Have I respected privacy boundaries?
8. **Accuracy**: Will I verify information and assign confidence levels?
9. **Transparency**: Am I being honest with all parties?
10. **Security**: Do I have proper data security measures?
11. **Rights**: Do subjects have recourse to correct or delete their data?
12. **Comfort**: Would I be comfortable if my methods were made public?

**If you answer "no" or "unsure" to any, stop and resolve before proceeding.**

---

## When to Consult Legal Counsel

**Always consult counsel for**:
- First-time OSINT engagement
- International/cross-border research
- Sensitive industries (healthcare, finance, government)
- High-risk subjects (public figures, minors, protected classes)
- Unclear legal requirements
- Potential privacy law violations
- Client requests that seem unethical
- Subject threatens legal action
- Data breach or security incident

**Have counsel review**:
- Engagement agreements
- Methodology
- Report templates
- Data handling procedures
- Subject notification processes

---

## Professional Standards and Associations

**Relevant Organizations**:
- **ASIS International**: Security professional association
- **ISACA**: Information security and audit standards
- **(ISC)²**: Security certification body
- **NIST**: Cybersecurity framework and guidance
- **ENISA**: European cybersecurity guidance
- **Bellingcat**: OSINT investigative journalism (ethical methods)

**Codes of Conduct**:
- ASIS Code of Ethics
- (ISC)² Code of Ethics
- ISACA Code of Professional Ethics

---

## Conclusion

**Ethics are not optional. They are essential.**

- OSINT is powerful and must be used responsibly
- Always obtain proper authorization
- Use only public sources and ethical methods
- Respect privacy and minimize harm
- Comply with all applicable laws
- Protect collected data rigorously
- Be transparent and honest
- When in doubt, consult counsel and err on the side of caution

**Remember: Your reputation and your client's trust depend on ethical conduct.**

---

**For questions during OSINT operations, refer back to this framework or consult with legal counsel immediately.**
