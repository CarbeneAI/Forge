---
name: Algorithm
description: Structured 7-phase execution engine for systematic problem-solving with effort classification and rigorous methodology. USE WHEN user mentions algorithm, systematic approach, structured execution, step-by-step methodology, rigorous framework, OR wants disciplined problem-solving process.
---

# Algorithm

A structured 7-phase execution framework for systematic problem-solving. The Algorithm skill provides a rigorous, repeatable methodology for approaching any task - from trivial to complex - with appropriate depth based on effort classification.

## Core Philosophy

**Every problem deserves the right amount of rigor.**

The Algorithm framework scales from TRIVIAL tasks (minutes of effort) to DETERMINED challenges (multi-day investigations) by adjusting the depth of each phase while maintaining consistent structure.

## The 7 Phases

The Algorithm consists of seven sequential phases, each with clear inputs, actions, outputs, and exit criteria:

### 1. OBSERVE
**Purpose:** Gather facts and understand the current state.

- **Input:** Problem statement or task description
- **Actions:** Read, investigate, measure, document current state
- **Output:** Factual understanding of what exists now
- **Exit criteria:** Can describe problem objectively without interpretation

### 2. THINK
**Purpose:** Analyze, reason, and form hypotheses.

- **Input:** Observations from OBSERVE phase
- **Actions:** Analyze patterns, identify root causes, generate theories
- **Output:** Understanding of why things are the way they are
- **Exit criteria:** Have working theory of causation and relationships

### 3. PLAN
**Purpose:** Design solution approach and implementation strategy.

- **Input:** Understanding from THINK phase
- **Actions:** Design solution, sequence steps, identify resources
- **Output:** Detailed implementation plan with success criteria
- **Exit criteria:** Clear roadmap from current state to desired state

### 4. BUILD
**Purpose:** Create the solution components.

- **Input:** Plan from PLAN phase
- **Actions:** Write code, create documents, build infrastructure
- **Output:** Working implementation of solution
- **Exit criteria:** All planned components exist and are integrated

### 5. EXECUTE
**Purpose:** Run the solution in target environment.

- **Input:** Built solution from BUILD phase
- **Actions:** Deploy, configure, launch, operate
- **Output:** Solution running in production/real environment
- **Exit criteria:** System operational and handling real work

### 6. VERIFY
**Purpose:** Confirm solution meets requirements and objectives.

- **Input:** Executing solution from EXECUTE phase
- **Actions:** Test, measure, compare to success criteria
- **Output:** Evidence that solution works as intended
- **Exit criteria:** All success metrics met, no critical failures

### 7. LEARN
**Purpose:** Extract insights and improve future performance.

- **Input:** Results from VERIFY phase
- **Actions:** Document learnings, identify improvements, update knowledge
- **Output:** Captured knowledge for future reference
- **Exit criteria:** Key insights documented, ready for next iteration

## Effort Classification System

Before executing the Algorithm, classify the effort level to determine appropriate depth for each phase:

| Level | Duration | Characteristics | Example |
|-------|----------|-----------------|---------|
| **TRIVIAL** | Minutes | Obvious path, no unknowns, routine | "Create new directory" |
| **SIMPLE** | ~1 hour | Clear path, minimal unknowns, straightforward | "Fix known bug with clear cause" |
| **MODERATE** | Few hours | Some unknowns, requires investigation | "Add new feature to existing system" |
| **COMPLEX** | 1+ days | Multiple unknowns, requires research/design | "Redesign authentication system" |
| **DETERMINED** | Multi-day | Significant unknowns, requires deep investigation | "Root cause performance degradation" |

**Classification drives depth:**
- TRIVIAL: Minimal documentation, fast execution
- SIMPLE: Basic documentation, standard thoroughness
- MODERATE: Detailed documentation, careful execution
- COMPLEX: Comprehensive documentation, rigorous validation
- DETERMINED: Exhaustive documentation, extreme rigor

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **Execute** | "use algorithm", "systematic approach", "structured execution" | `workflows/Execute.md` |

## When to Use Algorithm

**High-value scenarios:**
- Complex problems requiring systematic approach
- Unfamiliar domains where structure helps
- Critical tasks where rigor prevents mistakes
- Team collaboration requiring shared methodology
- Learning scenarios where process matters
- When previous ad-hoc attempts failed

**Lower-value scenarios:**
- Well-practiced routine tasks (muscle memory suffices)
- Genuinely trivial operations (overhead exceeds benefit)
- Brainstorming or creative exploration (structure inhibits)
- Time-critical emergencies (act first, analyze later)

## Integration with Other Skills

**Algorithm works well with:**

- **FirstPrinciples skill**: Use in THINK phase to challenge assumptions
- **Research skill**: Use in OBSERVE phase to gather information
- **test-driven-development skill**: Use in BUILD and VERIFY phases
- **systematic-debugging skill**: Use when VERIFY reveals failures
- **cto-advisor / ceo-advisor**: Use for strategic decision-making

**Common patterns:**

```
Algorithm (OBSERVE + THINK) → FirstPrinciples → Algorithm (PLAN + BUILD)
Algorithm (OBSERVE) → Research skill → Algorithm (THINK + PLAN)
Algorithm (BUILD) → test-driven-development → Algorithm (VERIFY)
```

## Examples

**Example 1: TRIVIAL task (classified appropriately)**

```
User: "Create a new skills directory for Algorithm skill"

→ Activates Algorithm skill
→ Effort classification: TRIVIAL (minutes, obvious path)
→ Execute workflow (minimal depth):

OBSERVE: Need directory at ~/.claude/skills/Algorithm/
THINK: Standard skill structure: SKILL.md + workflows/ + reference/
PLAN: mkdir -p and create files
BUILD: Execute mkdir commands
EXECUTE: Verify directories created
VERIFY: ls confirms structure exists
LEARN: Standard skill creation pattern works

Result: Task complete in 2 minutes with appropriate rigor
```

**Example 2: MODERATE task (appropriate depth)**

```
User: "Our API response times increased from 200ms to 2000ms over the last week"

→ Activates Algorithm skill
→ Effort classification: MODERATE (hours, some unknowns require investigation)
→ Execute workflow (detailed depth):

OBSERVE:
- Baseline: 200ms response time (last week)
- Current: 2000ms response time (today)
- Change: 10x degradation over 7 days
- Affected: All endpoints, not isolated to one
- Infrastructure: No changes to servers/config

THINK:
- Hypothesis 1: Database queries slowed (most common cause)
- Hypothesis 2: Increased load (check traffic metrics)
- Hypothesis 3: External dependency degraded (check third-party APIs)
- Root cause: Likely database (affects all endpoints uniformly)

PLAN:
1. Check database query performance logs
2. Review slow query log for new patterns
3. Check for missing indexes (common after data growth)
4. Test query performance in staging
5. If confirmed, add missing index

BUILD:
- Query to find slow queries: SELECT * FROM pg_stat_statements ORDER BY total_time DESC
- Identified: User lookup query doing full table scan (no index)
- Solution: CREATE INDEX idx_users_email ON users(email)

EXECUTE:
- Run CREATE INDEX in staging (test first)
- Monitor performance impact
- Deploy to production during low-traffic window

VERIFY:
- Response times: 2000ms → 180ms (back to baseline)
- Query time: 1800ms → 5ms (index working)
- No errors introduced
- All endpoints fast again

LEARN:
- User table grew past index-less threshold (~100K rows)
- Add monitoring alert for queries >500ms
- Document: Always index foreign keys and email lookups
- Future: Automated index suggestions in staging

Result: Performance restored in 3 hours with root cause documented
```

**Example 3: COMPLEX task (comprehensive depth)**

```
User: "Design and implement authentication system for new SaaS product"

→ Activates Algorithm skill
→ Effort classification: COMPLEX (1-2 days, multiple unknowns, security-critical)
→ Execute workflow (comprehensive depth):

OBSERVE:
- Requirements: Multi-tenant SaaS, B2B customers
- Users: 10-10,000 users per tenant
- Security: SOC2 compliance required
- Use cases: SSO for enterprise, email/password for SMB
- Constraints: Budget $50K, 3-month timeline
- Current state: New product, no existing auth

THINK:
- Build vs. buy analysis:
  - Build: Full control, $50K dev cost, ongoing maintenance
  - Buy: Faster, $20K/year, vendor dependency
- Security requirements:
  - Password hashing (bcrypt/argon2)
  - MFA support (TOTP, SMS backup)
  - SSO (SAML, OAuth)
  - Session management (JWT + refresh tokens)
- Compliance: Need audit logs, encryption at rest/transit
- Decision: Use Auth0 for SSO, custom for email/password (hybrid)
  - Rationale: SSO complexity high, email/password well-understood

PLAN:
1. Week 1: Design auth flow, select tools
2. Week 2: Implement email/password with Auth0 integration
3. Week 3: Add MFA, session management
4. Week 4: SSO integration, testing
5. Week 5: Security audit, penetration testing
6. Week 6: Documentation, monitoring, launch

Detailed tasks:
- Database schema: users, sessions, mfa_devices, audit_log
- API endpoints: /login, /logout, /register, /mfa/setup, /mfa/verify
- Frontend: Login page, registration, MFA setup
- Integration: Auth0 for SSO tenants
- Security: Rate limiting, password policies, session expiry
- Monitoring: Failed login alerts, unusual patterns

BUILD:
[Detailed implementation phase - code, tests, infrastructure]
- Database migrations with encrypted password storage
- JWT token service with refresh token rotation
- MFA implementation using TOTP (Google Authenticator compatible)
- Auth0 integration for SSO tenants
- Rate limiting middleware (max 5 failed attempts → 15min lockout)
- Comprehensive test suite (unit, integration, security)

EXECUTE:
- Deploy to staging with test tenants
- Run penetration testing (internal + external firm)
- Beta test with 3 pilot customers
- Monitor for issues (error rates, performance)
- Fix bugs identified in testing

VERIFY:
✅ Functional tests: All auth flows work correctly
✅ Security tests: No vulnerabilities in pentest report
✅ Performance tests: Login <200ms, SSO <500ms
✅ Compliance: Audit log captures all auth events
✅ User testing: 3 beta customers successfully using system
✅ Documentation: Admin guide, user guide, API docs complete

LEARN:
Key insights:
1. Hybrid approach (custom + Auth0) was right call
   - Saved 3 weeks vs. full custom implementation
   - Avoided SSO complexity (SAML is hard)
   - Maintained control over core user experience

2. Security testing revealed issues early
   - Missing rate limiting on password reset
   - Session tokens not invalidated on password change
   - Both caught and fixed before launch

3. MFA adoption requires education
   - 60% of beta users didn't set up MFA initially
   - After adding in-app prompts: 90% adoption
   - Lesson: Security features need UX focus

4. Monitoring is critical
   - Failed login spike = credential stuffing attack
   - Caught and blocked within 15 minutes
   - Alert system proved valuable immediately

Improvements for next time:
- Start with security testing framework from day 1
- Involve security team in design phase (not just review)
- Plan for phased MFA rollout (don't force immediately)

Documentation:
- Architecture decision record (ADR) for auth choices
- Runbook for common auth issues
- Security incident response playbook
- User onboarding guide with security best practices

Result: Production-ready auth system in 6 weeks, SOC2 compliant, zero security incidents in first 3 months
```

## Output Format

When using Algorithm skill, structure output by phase:

```markdown
# Algorithm Execution: [Task Name]

**Effort Classification:** [TRIVIAL / SIMPLE / MODERATE / COMPLEX / DETERMINED]

## 1. OBSERVE
[What is the current state? What facts do we have?]

## 2. THINK
[What does this mean? What are the patterns? What's the root cause?]

## 3. PLAN
[What's the solution approach? What are the steps?]

## 4. BUILD
[Create the solution components]

## 5. EXECUTE
[Run the solution in target environment]

## 6. VERIFY
[Does it work? Does it meet requirements?]

## 7. LEARN
[What did we learn? What would we do differently?]

---

**Status:** [Complete / In Progress / Blocked]
**Next:** [What comes next, if anything]
```

## Key Principles

1. **Sequential phases:** Don't skip ahead. Each phase builds on the previous.
2. **Exit criteria:** Don't move to next phase until current phase is complete.
3. **Appropriate depth:** Match rigor to effort classification.
4. **Documentation:** Write as you go, don't document after the fact.
5. **Learning:** LEARN phase is not optional - extract insights for future.

## Anti-Patterns to Avoid

❌ **Jumping to BUILD without THINK:** Implementing before understanding
❌ **Skipping VERIFY:** Assuming it works without testing
❌ **Forgetting LEARN:** Missing the opportunity to improve
❌ **Over-engineering TRIVIAL tasks:** Using COMPLEX rigor for simple work
❌ **Under-engineering COMPLEX tasks:** Using TRIVIAL rigor for critical work

## Success Criteria

Algorithm execution is successful when:
- ✅ All 7 phases completed with appropriate depth
- ✅ Exit criteria met for each phase before proceeding
- ✅ Solution verified to meet requirements
- ✅ Learnings documented for future reference
- ✅ Next steps clear (or task complete)

## Meta Note

The Algorithm skill is itself an algorithm. This recursive nature makes it particularly powerful for complex problem-solving: you can use the Algorithm to improve the Algorithm.
