# Effort Classification Guide

Proper effort classification is critical to applying the Algorithm framework effectively. This guide helps you classify tasks into the correct effort level, which determines the appropriate depth for each phase of execution.

## The Five Levels

### TRIVIAL
**Duration:** Minutes (1-15 minutes)
**Characteristics:** Obvious path, no unknowns, routine operation

**Identifying features:**
- Solution is immediately apparent
- You've done this exact thing many times
- No research or investigation needed
- Single obvious correct approach
- Failure has minimal consequences
- Can be reversed easily if wrong

**Examples:**
- Create a directory
- Copy a file
- Install a known package
- Restart a service
- Update a configuration value you know
- Run a standard command

**Algorithm depth:**
- OBSERVE: Read request (30 seconds)
- THINK: Recognize obvious solution (30 seconds)
- PLAN: Mental checklist (1 minute)
- BUILD: Execute (2 minutes)
- EXECUTE: Run in target environment (1 minute)
- VERIFY: Quick check (1 minute)
- LEARN: Mental note (30 seconds)

**Documentation:** Minimal - maybe a one-line note

**Red flag:** If you're writing extensive documentation for a TRIVIAL task, it's not actually trivial.

---

### SIMPLE
**Duration:** ~1 hour
**Characteristics:** Clear path, minimal unknowns, straightforward

**Identifying features:**
- Solution approach is clear, but requires care
- You've done similar things, but not this exact task
- Minimal research needed (quick docs check)
- Few possible approaches (1-2 obvious ones)
- Failure is recoverable with modest effort
- Some edge cases to consider

**Examples:**
- Fix a known bug with clear root cause
- Add a simple API endpoint following existing patterns
- Configure a service using documentation
- Write a small utility script
- Refactor a single function for clarity
- Create a basic test suite for one component

**Algorithm depth:**
- OBSERVE: Review problem carefully (5 minutes)
- THINK: Identify approach and edge cases (10 minutes)
- PLAN: List 3-5 steps with rough timeline (10 minutes)
- BUILD: Implement with basic error handling (25 minutes)
- EXECUTE: Deploy and check (5 minutes)
- VERIFY: Test main cases (5 minutes)
- LEARN: Note one key learning (2 minutes)

**Documentation:** Brief - task summary, approach, any gotchas

**Red flag:** If you need to consult multiple sources or stakeholders, it's not SIMPLE.

---

### MODERATE
**Duration:** Few hours (2-6 hours)
**Characteristics:** Some unknowns, requires investigation

**Identifying features:**
- Solution approach requires investigation to determine
- You understand the domain but not this specific problem
- Moderate research needed (read docs, check examples)
- Multiple possible approaches (3-4 reasonable options)
- Trade-offs between approaches need evaluation
- Some unknown unknowns (surprises possible)
- Failure requires significant rework

**Examples:**
- Add a new feature to existing system
- Debug an unfamiliar issue with some clues
- Integrate a new third-party API
- Optimize performance of a slow component
- Migrate data between schema versions
- Refactor a module while maintaining compatibility

**Algorithm depth:**
- OBSERVE: Thorough investigation (30 minutes)
- THINK: Analyze options, evaluate trade-offs (45 minutes)
- PLAN: Detailed step-by-step with milestones (45 minutes)
- BUILD: Implement with tests and docs (2-3 hours)
- EXECUTE: Deploy with monitoring (30 minutes)
- VERIFY: Comprehensive testing (45 minutes)
- LEARN: Document lessons, update playbook (30 minutes)

**Documentation:** Detailed - problem analysis, approach rationale, implementation notes, lessons learned

**Red flag:** If you need to design new architecture or conduct deep research, it's not MODERATE.

---

### COMPLEX
**Duration:** 1-3 days
**Characteristics:** Multiple unknowns, requires research and design

**Identifying features:**
- Solution requires significant design work
- Unfamiliar domain or novel problem
- Extensive research needed (multiple sources, experts)
- Many possible approaches (5+ options to evaluate)
- Complex trade-offs (performance vs. cost vs. maintainability)
- Known unknowns that require investigation
- Significant integration points or dependencies
- Failure could have serious consequences
- Requires coordination with multiple stakeholders

**Examples:**
- Design and implement authentication system
- Migrate from monolith to microservices
- Build a new data pipeline
- Implement complex algorithm with requirements
- Design API for new product area
- Refactor core system architecture
- Root cause and fix systemic performance issues

**Algorithm depth:**
- OBSERVE: Comprehensive investigation with data (2-4 hours)
- THINK: Deep analysis, multiple solutions evaluated (3-6 hours)
- PLAN: Comprehensive implementation plan with phases (2-4 hours)
- BUILD: Production-ready with full testing (1-2 days)
- EXECUTE: Phased rollout with monitoring (3-6 hours)
- VERIFY: Comprehensive validation and benchmarking (3-6 hours)
- LEARN: Detailed retrospective, knowledge artifacts (2-3 hours)

**Documentation:** Comprehensive - architecture decision records (ADRs), design docs, implementation details, runbooks, lessons learned, updated standards

**Red flag:** If fundamental assumptions need to be questioned or significant unknowns remain after initial investigation, it's DETERMINED.

---

### DETERMINED
**Duration:** Multi-day (3+ days to weeks)
**Characteristics:** Significant unknowns, requires deep investigation

**Identifying features:**
- Problem is poorly understood, even after initial investigation
- Requires challenging fundamental assumptions
- Deep research needed (first principles, academic papers, expert consultation)
- Solution space is vast (many possible approaches)
- High uncertainty about what will work
- Unknown unknowns dominate (expect surprises)
- Critical importance (major business/technical impact)
- Requires experimentation and validation
- Cross-functional coordination essential
- Failure could be catastrophic

**Examples:**
- Root cause mysterious production outage that's been occurring for months
- Design novel architecture for unprecedented scale
- Investigate complex security breach
- Evaluate and choose core technology stack for new product
- Build system for requirements that don't fully exist yet
- Solve problem that has no known solutions in industry
- Transform organizational architecture or process

**Algorithm depth:**
- OBSERVE: Exhaustive investigation, multiple data sources (1-2 days)
- THINK: First principles analysis, assumption testing (1-3 days)
- PLAN: Multi-phase strategy with validation gates (1-2 days)
- BUILD: Production-grade with extensive testing (3-7 days)
- EXECUTE: Phased rollout with pilot and validation (2-5 days)
- VERIFY: Long-term validation, business impact measurement (ongoing)
- LEARN: Case study, updated standards, training materials (1-2 days)

**Documentation:** Exhaustive - case studies, ADRs, comprehensive design docs, runbooks, training materials, published learnings (internal/external), organizational standard updates

**Red flag:** If you can clearly define the solution upfront, it's not DETERMINED (it's COMPLEX or less).

---

## Classification Decision Tree

Use this decision tree to classify any task:

```
START: I have a task to complete

Q1: Is the solution immediately obvious?
├─ YES: Is it a routine operation I've done many times?
│  ├─ YES: → TRIVIAL
│  └─ NO: Continue to Q2
└─ NO: Continue to Q2

Q2: Do I understand the domain and problem well?
├─ YES: Is the solution approach clear?
│  ├─ YES: Are there multiple reasonable approaches?
│  │  ├─ NO: → SIMPLE
│  │  └─ YES: Continue to Q3
│  └─ NO: Continue to Q3
└─ NO: Continue to Q4

Q3: Will this take more than a day of focused work?
├─ NO: → MODERATE
└─ YES: Continue to Q4

Q4: Do I need to challenge fundamental assumptions or conduct deep research?
├─ NO: Will I need to design significant new architecture?
│  ├─ YES: → COMPLEX
│  └─ NO: → MODERATE
└─ YES: Are there significant unknowns even after initial investigation?
   ├─ YES: → DETERMINED
   └─ NO: → COMPLEX
```

## Common Misclassifications

### Mistake: Classifying COMPLEX as SIMPLE
**Example:** "Just add authentication" (Actually: requires security design, multiple integration points, testing, compliance)

**Why it happens:** Underestimating unknowns and scope

**Consequence:** Poor quality implementation, security issues, technical debt

**Fix:** If you say "just" and it takes more than an hour, it's not SIMPLE

### Mistake: Classifying SIMPLE as COMPLEX
**Example:** "Fix this bug" becomes multi-day architectural analysis (Actually: typo in config file)

**Why it happens:** Analysis paralysis, over-engineering

**Consequence:** Wasted time, delayed delivery, team frustration

**Fix:** Start with SIMPLE, upgrade if you discover complexity

### Mistake: Classifying MODERATE as TRIVIAL
**Example:** "Quick database change" without considering migration, rollback, data integrity

**Why it happens:** Familiarity bias (done this before, forgetting edge cases)

**Consequence:** Production incidents, data loss, downtime

**Fix:** If it touches production or has failure scenarios, it's at least MODERATE

## Classification Red Flags

**Signs you misclassified:**

🚩 **Underclassified (task is harder than you thought):**
- You're 2x past estimated time
- You've discovered multiple unknowns
- You need to consult other people/teams
- Simple tests are failing unexpectedly
- You're saying "just one more thing" repeatedly

**Action:** Pause, reclassify, restart with appropriate depth

🚩 **Overclassified (task is easier than you thought):**
- You're spending more time planning than executing
- Documentation is 10x longer than the code
- You're solving problems that don't exist
- Stakeholders are asking "is this done yet?"

**Action:** Simplify, deliver, learn

## Domain-Specific Guidance

### Software Development
- **TRIVIAL:** Update README, fix typo, restart service
- **SIMPLE:** Fix known bug, add logging, update dependency
- **MODERATE:** Add feature to existing module, refactor for clarity
- **COMPLEX:** Design new service, major refactor, authentication system
- **DETERMINED:** Choose architecture for new product, root cause systemic issue

### System Administration
- **TRIVIAL:** Restart service, check disk space, read logs
- **SIMPLE:** Update configuration, install package, create backup
- **MODERATE:** Configure monitoring, set up new service, migrate server
- **COMPLEX:** Design infrastructure architecture, implement DR plan
- **DETERMINED:** Architect multi-region setup, root cause cascading failures

### Data Analysis
- **TRIVIAL:** Run existing query, export CSV, create basic chart
- **SIMPLE:** Write new query, filter dataset, basic visualization
- **MODERATE:** Exploratory analysis, dashboard creation, data cleaning
- **COMPLEX:** Statistical modeling, predictive analysis, ML pipeline
- **DETERMINED:** Novel analysis methodology, causal inference, research

### Security
- **TRIVIAL:** Check for known CVE, run security scan, read report
- **SIMPLE:** Apply security patch, configure firewall rule, update certificate
- **MODERATE:** Security audit of component, threat modeling, pen test scope
- **COMPLEX:** Design security architecture, incident response, compliance program
- **DETERMINED:** Investigate major breach, design zero-trust architecture

## Calibration Exercise

**Practice classifying these tasks (answers at bottom):**

1. "Deploy the new Docker container to staging"
2. "Figure out why our API latency increased 10x over 3 months"
3. "Add a new column to the users table"
4. "Design our authentication and authorization system"
5. "Fix the login button that's not clickable"
6. "Improve the performance of our search feature"
7. "Create a script to back up the database"
8. "Choose between microservices and monolith for our new product"

---

## Answers to Calibration Exercise

1. **SIMPLE** (if standard process) or **MODERATE** (if new service with unknowns)
2. **COMPLEX** (long investigation needed) or **DETERMINED** (if root cause deeply unclear)
3. **MODERATE** (database change requires migration, testing, rollback plan)
4. **COMPLEX** (significant design work, security implications, integration)
5. **SIMPLE** (if cause is obvious CSS bug) or **MODERATE** (if cause unclear)
6. **MODERATE** (if specific bottleneck identified) or **COMPLEX** (if systemic issue)
7. **SIMPLE** (if standard backup script) or **MODERATE** (if custom requirements)
8. **DETERMINED** (fundamental architectural decision with long-term implications)

**Note:** Many tasks depend on context! The same task can be different effort levels based on your domain knowledge, system complexity, and failure consequences.

## Key Principle

**When in doubt, start one level lower and upgrade if needed.**

Better to:
- Start SIMPLE, discover it's MODERATE (adjust and continue)

Than to:
- Start COMPLEX, realize it's SIMPLE (waste time on unnecessary rigor)

**Effort classification is a skill.** You'll get better with practice and feedback.
