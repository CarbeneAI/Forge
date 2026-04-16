# People Intelligence Workflow

Ethical background research on individuals for professional due diligence using publicly available information only.

## Objective

Gather and verify publicly available professional information about individuals to:
- Verify credentials and experience
- Assess expertise and qualifications
- Identify potential conflicts of interest
- Evaluate professional reputation
- Support hiring or partnership decisions

## Ethical Boundaries

**CRITICAL**: This workflow is for professional due diligence only.

**Appropriate Use Cases**:
- Executive background checks (with authorization)
- Key hire verification
- Expert witness qualification
- Partnership due diligence
- Consultant credentialing

**Prohibited Activities**:
- Personal life investigation
- Social engineering or pretexting
- Accessing private/restricted information
- Harassment or stalking behaviors
- Identity theft or impersonation

**Privacy Principles**:
- Focus on professional information only
- Respect personal privacy boundaries
- No unauthorized access to private data
- Document sources and methodology
- Obtain proper authorization

## Prerequisites

- [ ] Authorization obtained (client, legal, HR)
- [ ] Clear business justification documented
- [ ] Ethical framework reviewed
- [ ] Subject notified if required by policy/law
- [ ] Data protection compliance verified (GDPR, etc.)

## Workflow Steps

### Phase 1: Identity Verification

**Goal**: Confirm identity and establish baseline information

```bash
# Notify workflow start
${PAI_DIR}/tools/skill-workflow-notification PersonIntel OSINT
```

1. **Basic Information**
   - Full legal name (confirm spelling)
   - Current employer and title
   - Professional email (if available)
   - Location (city/state)
   - Professional social media handles

2. **Identity Disambiguation**
   - Verify this is the correct person
   - Distinguish from others with same name
   - Cross-reference multiple sources
   - Note: Common names require extra care

3. **Professional Timeline**
   - Current position and tenure
   - Previous roles (last 5-10 years)
   - Career progression patterns
   - Industry focus areas

**Deliverable**: Verified identity and professional timeline

---

### Phase 2: Professional Background

**Goal**: Verify work history, education, and credentials

1. **LinkedIn Profile Analysis**
   - Visit: https://www.linkedin.com/in/[username]/
   - **Extract**:
     - Complete work history
     - Education credentials
     - Certifications and licenses
     - Skills endorsements
     - Recommendations (quantity and quality)
     - Publications and projects
     - Volunteer work
     - Professional groups and associations

   - **Analyze**:
     - Career progression (promotions, lateral moves)
     - Job tenure patterns
     - Industry transitions
     - Leadership experience
     - Technical vs. management focus

2. **Education Verification**
   - Degrees claimed (institution, year, field)
   - Advanced degrees (Master's, PhD)
   - Professional certifications:
     - **Security**: CISSP, CISM, CEH, OSCP, GIAC
     - **Technical**: AWS, Azure, GCP, Kubernetes
     - **Management**: PMP, Agile, Scrum Master
     - **Compliance**: CISA, CRISC, ISO Lead Auditor

   - **Verification** (when possible):
     - University registrar records (public alumni lists)
     - Professional certification databases
     - State licensing boards (if applicable)

3. **Employment History Validation**
   - Cross-reference dates across sources
   - Look for gaps in employment
   - Verify company names and roles
   - Check for consistent narrative
   - Note: Discrepancies require explanation

**Deliverable**: Verified education and employment history

---

### Phase 3: Expertise and Contributions

**Goal**: Assess professional expertise and industry contributions

1. **Publications and Writing**

   **Academic Publications**:
   - Search: Google Scholar
   - Visit: https://scholar.google.com/
   - Note: Publications, citations, h-index

   **Professional Articles**:
   - Medium, personal blog, company blog
   - Industry publications
   - Trade magazines
   - White papers and research reports

   **Topics and Focus Areas**:
   - Technical specialties
   - Thought leadership topics
   - Industry trends covered

2. **Conference Presentations**

   **Major Conferences**:
   - RSA Conference
   - Black Hat / DEF CON
   - OWASP AppSec
   - AWS re:Invent
   - Industry-specific conferences

   **Search Methods**:
   - Conference websites (speaker archives)
   - YouTube for recorded talks
   - SlideShare / Speaker Deck for slides
   - Conference Twitter accounts

   **Analysis**:
   - Speaking frequency
   - Topic expertise
   - Presentation quality (if videos available)
   - Audience engagement

3. **Open Source Contributions**

   **GitHub Profile**:
   ```bash
   # Find GitHub user
   gh api /search/users?q="full+name"+location:city

   # View profile
   gh api /users/username

   # List repositories
   gh repo list username --limit 50 --json name,description,stargazerCount,language

   # Check contributions
   # Visit: https://github.com/username
   ```

   **Evaluate**:
   - Repository quality and activity
   - Programming languages
   - Stars/forks on projects
   - Contribution frequency
   - Code review participation
   - Documentation quality
   - Security-focused projects

4. **Patents and Intellectual Property**
   - Search: Google Patents
   - Search: USPTO Patent Database
   - Note: Patent titles, application dates, status
   - Assess: Innovation and technical depth

5. **Awards and Recognition**
   - Industry awards
   - Company recognition
   - Hall of Fame memberships
   - Bug bounty achievements
   - Certifications of excellence

**Deliverable**: Expertise assessment with evidence

---

### Phase 4: Professional Reputation

**Goal**: Evaluate industry standing and reputation

1. **Social Media Professional Presence**

   **Twitter/X** (for security/tech professionals):
   - Professional vs. personal content mix
   - Follower count and engagement
   - Quality of technical discussions
   - Industry influence
   - Controversial statements (assess context)

   **Mastodon** (increasingly common for tech):
   - Similar analysis to Twitter/X

   **Professional Networks**:
   - Stack Overflow reputation (if applicable)
   - Reddit participation (technical subreddits)
   - Professional forums and communities

2. **Media Mentions and Press**
   - News articles (quoted as expert)
   - Industry press coverage
   - Podcast appearances
   - Webinar presentations
   - Interview transcripts

   **Search**: Use Research skill with queries:
   - "[Name] security expert"
   - "[Name] interview"
   - "[Name] quoted"

3. **Peer Recognition**
   - LinkedIn recommendations analysis:
     - Who wrote them (seniority, credibility)
     - Specific accomplishments mentioned
     - Soft skills vs. technical skills
     - Recency of recommendations

   - Endorsements:
     - Most endorsed skills
     - Who endorsed (credibility check)

4. **Glassdoor / Company Reviews**
   - If subject is/was a manager:
     - Search for leadership mentions in reviews
     - Leadership style patterns
     - Employee satisfaction indicators
   - Note: Take with grain of salt (selection bias)

**Deliverable**: Reputation summary with supporting evidence

---

### Phase 5: Security and Risk Factors

**Goal**: Identify potential red flags or concerns

1. **Breach Database Checks**
   - Visit: https://haveibeenpwned.com/
   - Search: Professional email addresses
   - Note: Breached accounts (assess relevance)
   - Consider: Password reuse risk

2. **Public Security Incidents**
   - Previous employer breaches during tenure
   - Personal responsibility or involvement
   - Public statements about incidents
   - Lessons learned and improvements made

3. **Legal and Regulatory Issues**
   - SEC enforcement actions (if executive)
   - Professional misconduct allegations
   - Licensing board actions
   - Patent disputes
   - Non-compete violations

   **Search**: "[Name] lawsuit" or "[Name] settlement"

   **Context matters**: Evaluate circumstances fairly

4. **Conflicts of Interest**
   - Board memberships (current/past)
   - Advisory roles with competitors
   - Startup equity or ownership
   - Vendor relationships
   - Speaking fees and sponsorships

5. **Professional Controversies**
   - Public disagreements with former employers
   - Controversial statements or positions
   - Ethical concerns raised by others
   - Industry criticism or backlash

   **Analysis**: Assess severity and context

6. **Social Media Red Flags**
   - Unprofessional behavior online
   - Discriminatory statements
   - Dishonesty or misrepresentation
   - Harassment or bullying
   - Privacy violations (sharing confidential info)

**Deliverable**: Risk assessment with confidence levels

---

### Phase 6: Credential Verification

**Goal**: Validate claimed qualifications

1. **Certification Verification**

   **Security Certifications**:
   - CISSP: https://www.isc2.org/MemberVerification
   - CISM: ISACA member directory
   - CEH: EC-Council verification
   - OSCP: Offensive Security verification

   **Cloud Certifications**:
   - AWS: Certification validation
   - Azure: Microsoft credential verification
   - GCP: Google certification directory

   **Project Management**:
   - PMP: PMI member registry

2. **Education Verification**
   - Alumni directories (if public)
   - Degree verification services (authorized)
   - University registrar (if offering service)

   **Note**: Privacy laws may restrict access

3. **Professional Licenses**
   - State licensing boards (if applicable)
   - Bar associations (for attorneys)
   - Engineering boards (for PEs)
   - Medical boards (for healthcare)

4. **Cross-Reference Consistency**
   - Compare claims across multiple sources
   - Look for date inconsistencies
   - Verify institution names match official records
   - Check for credential mills

**Deliverable**: Verified credentials list with confidence scores

---

### Phase 7: Synthesis and Analysis

**Goal**: Integrate findings into comprehensive profile

1. **Professional Profile Summary**
   ```markdown
   ## [Full Name]
   **Current Role**: [Title] at [Company]
   **Location**: [City, State]
   **Experience**: [X] years in [industry/field]

   ### Key Qualifications
   - [Certification 1] - Verified
   - [Certification 2] - Verified
   - [Degree], [University], [Year]

   ### Expertise Areas
   1. [Primary expertise]
   2. [Secondary expertise]
   3. [Tertiary expertise]

   ### Notable Achievements
   - [Achievement 1 with evidence]
   - [Achievement 2 with evidence]

   ### Leadership Experience
   - [Teams led, scope, duration]

   ### Public Contributions
   - Publications: [X] articles/papers
   - Speaking: [X] conferences
   - Open source: [Notable projects]
   ```

2. **Strengths and Weaknesses**

   **Strengths**:
   - Strong technical expertise in [areas]
   - Proven leadership experience
   - Industry recognition
   - Communication skills
   - Continuous learning

   **Areas of Concern** (if any):
   - Limited experience in [area]
   - Career gaps requiring explanation
   - Credential discrepancies
   - Professional controversies

3. **Fit Assessment** (if for specific role)
   - Technical skills alignment
   - Leadership style match
   - Cultural fit indicators
   - Industry experience relevance
   - Salary expectations (if public)

4. **Confidence Scoring**

   | Information | Confidence | Sources |
   |-------------|------------|---------|
   | Work history | High | LinkedIn, multiple sources |
   | Education | Medium | LinkedIn only |
   | Certifications | High | Verified via issuer |
   | Publications | High | Direct links |
   | Reputation | Medium | Limited peer reviews |

**Deliverable**: Comprehensive professional profile

---

### Phase 8: Report Generation

**Goal**: Deliver professional background report

**Report Structure**:

```markdown
# Professional Background Report: [Full Name]

**Prepared for**: [Client/Hiring Manager]
**Date**: [YYYY-MM-DD]
**Classification**: Confidential
**Prepared by**: PAI OSINT Skill

## Executive Summary
[2-3 paragraphs: Overall assessment, key qualifications, recommendations]

## Authorization and Scope
- Authorization: [Reference]
- Purpose: [Hiring, partnership, etc.]
- Methodology: Public sources only
- Legal compliance: [GDPR, FCRA if applicable]

## Identity Verification
- Full name: [Verified]
- Current employer: [Verified]
- Location: [Verified]
- Professional contacts: [Listed]

## Professional Background
### Work History
[Chronological list with dates, titles, companies]

### Education
[Degrees with institutions and years]

### Certifications
[List with verification status]

## Expertise Assessment
### Technical Skills
[Evidence-based assessment]

### Leadership Experience
[Team sizes, scope, duration]

### Industry Contributions
- Publications: [Count and links]
- Conference speaking: [Count and topics]
- Open source: [Notable projects]
- Patents: [If applicable]

## Professional Reputation
### Industry Standing
[Assessment with evidence]

### Peer Recognition
[LinkedIn recommendations, endorsements]

### Media Presence
[Articles, interviews, quotes]

## Risk Assessment
[Any concerns identified with context]

## Verification Results
| Claim | Status | Source |
|-------|--------|--------|
| [Degree] | Verified | [Source] |
| [Certification] | Verified | [Source] |
| [Previous role] | Verified | [Source] |

## Recommendation
[Hire / Don't hire / Further investigation needed]

**Rationale**: [2-3 sentences explaining recommendation]

## Limitations
[Data gaps, unverified claims, areas needing further investigation]

## Sources
[All sources with URLs and access dates]
```

**Delivery Notes**:
- Follow company/client privacy policies
- Secure transmission (encrypted email, secure portal)
- Retention policy compliance
- Subject access rights (if GDPR applies)

---

## Quality Checklist

Before delivering the report:

- [ ] Identity confirmed beyond reasonable doubt
- [ ] Key credentials verified through official sources
- [ ] All sources documented with dates
- [ ] No unauthorized access methods used
- [ ] Privacy boundaries respected
- [ ] Findings supported by evidence
- [ ] Context provided for negative information
- [ ] Confidence levels assigned
- [ ] Professional tone maintained
- [ ] Legal compliance verified (FCRA, GDPR, etc.)

---

## Legal and Compliance Notes

### FCRA Compliance (US)

If used for employment purposes, the Fair Credit Reporting Act applies:
- Subject must provide written consent
- Adverse action notice required if used against candidate
- Opportunity to dispute findings must be provided
- Report must be accurate and complete

### GDPR Compliance (EU)

If subject is in EU or company operates in EU:
- Lawful basis required (legitimate interest or consent)
- Subject has right to access their data
- Right to rectification and erasure
- Data retention limits apply
- DPO consultation recommended

### State Laws

California, Colorado, and other states have additional requirements.

**Recommendation**: Consult with legal counsel before conducting background research.

---

## Common Pitfalls

**Avoid these mistakes**:

1. **Identity misattribution**: Ensure you have the right person
2. **Outdated information**: Check dates on all sources
3. **Over-reliance on social media**: Balance multiple sources
4. **Assumption bias**: Don't fill gaps with speculation
5. **Privacy violations**: Stay within public sources
6. **Incomplete verification**: Don't assume credentials are real
7. **Missing context**: Evaluate negative findings fairly

---

## Time Estimates

**Typical Timeline**:

- Phase 1 (Identity): 15-30 minutes
- Phase 2 (Professional Background): 1-2 hours
- Phase 3 (Expertise): 2-3 hours
- Phase 4 (Reputation): 1-2 hours
- Phase 5 (Risk Factors): 1-2 hours
- Phase 6 (Verification): 1-2 hours
- Phase 7 (Synthesis): 1-2 hours
- Phase 8 (Report): 1-2 hours

**Total**: 8-15 hours for comprehensive assessment

**Factors affecting timeline**:
- Individual's public profile size
- Number of credentials to verify
- Complexity of work history
- Availability of verification services
- Depth of analysis required

---

## Follow-Up Actions

**After report delivery**:

1. **Client Briefing**
   - Walk through key findings
   - Clarify any questions
   - Discuss concerns or red flags

2. **Subject Interview** (if hiring)
   - Verify findings directly
   - Ask about gaps or inconsistencies
   - Assess cultural fit

3. **Additional Verification** (if needed)
   - Professional reference checks
   - Direct credential verification
   - Previous employer verification

4. **Documentation**
   - Archive report securely
   - Follow retention policies
   - Provide subject access if required

---

## Integration with Other Skills

**Use complementary skills**:
- Research skill for deep-dive investigations
- CompanyIntel workflow for previous employers
- ThreatIntel workflow if subject is security researcher

**Delegate parallel research**:
```typescript
// Launch multiple intern agents
Task({
  prompt: "Research [Name]'s LinkedIn profile and work history",
  subagent_type: "intern",
  model: "haiku"
})

Task({
  prompt: "Research [Name]'s GitHub contributions and technical projects",
  subagent_type: "intern",
  model: "haiku"
})

Task({
  prompt: "Research [Name]'s publications and conference presentations",
  subagent_type: "intern",
  model: "haiku"
})
```

---

## Privacy and Ethics Reminder

**Always remember**:
- Individuals have a right to privacy
- Professional research ≠ personal surveillance
- Context and fairness matter
- Verify before concluding
- Use information responsibly
- Follow all applicable laws
- When in doubt, consult legal counsel

**Questions during execution? Consult `reference/EthicalFramework.md`**
