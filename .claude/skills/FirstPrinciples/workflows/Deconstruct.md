# Deconstruct Workflow

Break complex problems into fundamental component parts, separating verified facts from assumptions.

## Purpose

The first phase of first principles reasoning. Take any problem, system, or constraint and reduce it to its most basic elements. Identify what is actually true versus what is merely assumed or conventional wisdom.

## Process

### 1. Define the True Goal

**Question:** What are we ACTUALLY trying to achieve?

- Strip away proxy metrics and intermediate goals
- Get to the fundamental human need or business outcome
- Distinguish between stated goal and real goal

**Example:**
- Stated: "We need faster approval workflow"
- Real: "We need to reduce risk while enabling speed"

### 2. List All Components

**Question:** What are the distinct parts of this problem/system?

Break down into:
- **Physical components** (materials, objects, resources)
- **Process components** (steps, decisions, handoffs)
- **Constraint components** (limitations, requirements, rules)
- **Stakeholder components** (people, roles, incentives)

**Template:**
```
COMPONENTS:
- Physical: [Materials, hardware, infrastructure]
- Process: [Steps, workflows, transformations]
- Constraints: [Rules, limits, requirements]
- Stakeholders: [People, organizations, interests]
```

### 3. Separate Facts from Assumptions

**Question:** What do we KNOW versus what do we ASSUME?

| Category | Definition | Examples |
|----------|------------|----------|
| **FACTS** | Objectively verifiable, physics/math-based | "Water boils at 100°C at sea level", "This material costs $X/kg" |
| **ASSUMPTIONS** | Beliefs without verification | "Customers won't pay more", "This process is necessary" |
| **CONVENTIONS** | "How it's always been done" | "Rockets are disposable", "Meetings need agendas" |

**Output template:**
```
VERIFIED FACTS:
- [Physics/math-based truths]
- [Measured data points]
- [Regulatory requirements]

ASSUMPTIONS (UNVERIFIED):
- [Beliefs about what's possible]
- [Beliefs about what users want]
- [Beliefs about what competitors will do]

CONVENTIONS (TRADITIONAL):
- [Industry standards we follow]
- [Internal policies]
- [Common practices]
```

### 4. Map Dependencies

**Question:** What depends on what? What's foundational versus derived?

Create a hierarchy:
- **Level 0:** Fundamental laws (physics, mathematics)
- **Level 1:** Direct consequences of fundamentals
- **Level 2:** Constraints from Level 1
- **Level 3:** Conventions built on Level 2

**Example: Electric vehicle cost**
```
L0: Energy density of lithium-ion chemistry (physics)
L1: kWh needed for 300-mile range (calculation)
L2: Battery pack size and weight (consequence)
L3: Current market price for batteries (convention)
```

### 5. Document the Conventional Approach

**Question:** How is this typically done? What's the standard solution?

- Current state / industry standard
- Why people believe this is the right way
- Historical context (why did this approach emerge?)
- What would happen if we continued this path

**Purpose:** Not to dismiss convention, but to make it explicit so we can challenge it.

### 6. Identify Cost/Performance Gaps

**Question:** Where is there a large gap between fundamental limits and current reality?

Calculate:
- **Theoretical minimum** (based on physics/math)
- **Current performance** (industry standard)
- **Gap size** (ratio or difference)

Large gaps suggest opportunity for first principles breakthrough.

**Example:**
```
Battery cost gap:
- Material cost: $80/kWh (commodity markets)
- Market price: $600/kWh (industry standard)
- Gap: 7.5x markup
- Implication: Huge room for innovation in manufacturing/supply chain
```

## Output Format

```markdown
# Deconstruction: [Problem Name]

## 1. TRUE GOAL
[What we're actually trying to achieve]

## 2. COMPONENTS
**Physical:** [Materials, objects, resources]
**Process:** [Steps, workflows, transformations]
**Constraints:** [Limitations, rules, requirements]
**Stakeholders:** [People, roles, incentives]

## 3. FACTS vs ASSUMPTIONS

### Verified Facts
- [Physics/math-based truths]
- [Measured data with sources]

### Assumptions (Unverified)
- [Belief 1] - Why we believe it: [reason]
- [Belief 2] - Why we believe it: [reason]

### Conventions (Traditional)
- [Practice 1] - Historical reason: [context]
- [Practice 2] - Historical reason: [context]

## 4. DEPENDENCY MAP
```
L0 (Physics): [Fundamental laws]
L1 (Direct):  [Consequences]
L2 (Derived): [Constraints]
L3 (Convention): [Standard practices]
```

## 5. CONVENTIONAL APPROACH
**Current method:** [How it's done today]
**Rationale:** [Why people do it this way]
**Trajectory:** [Where this leads if continued]

## 6. OPPORTUNITY ANALYSIS
**Theoretical limit:** [Physics-based minimum]
**Current performance:** [Industry standard]
**Gap:** [Ratio or difference]
**Implication:** [What this gap suggests]

---

**Next Step:** Proceed to Challenge workflow to test assumptions and reclassify constraints.
```

## Key Questions to Drive Deconstruction

1. **Goal clarity:** If we achieved this perfectly, what would change?
2. **Component completeness:** What are we missing? What's hidden?
3. **Assumption detection:** Why do we believe this? Who told us? When?
4. **Convention detection:** Has this always been true? Why did it start?
5. **Gap significance:** Where is the biggest delta between theory and practice?

## Red Flags (Signs you need deeper deconstruction)

- "That's just how it is" (unquestioned assumption)
- "Everyone does it this way" (convention, not necessity)
- "It's impossible to..." (assuming constraint is hard when it's soft)
- Large unexplained cost/performance gaps
- Solutions that seem inefficient but are standard practice

## Integration

**Feeds into:**
- Challenge workflow (to test what we found)
- Algorithm skill (as OBSERVE phase)
- Research skill (to verify facts and test assumptions)

**Requires:**
- Deep domain knowledge or research
- Willingness to question everything
- Data about current state and theoretical limits

## Example: Coffee Shop Wait Time

```markdown
# Deconstruction: Coffee Shop Wait Times

## 1. TRUE GOAL
Customers get coffee quickly without sacrificing quality or experience.

## 2. COMPONENTS
**Physical:** Espresso machine, grinders, milk steamers, cups, coffee beans
**Process:** Order taking, payment, drink making, pickup
**Constraints:** 1 barista, counter space, equipment capacity
**Stakeholders:** Customers (want speed), barista (manages workflow), owner (wants efficiency)

## 3. FACTS vs ASSUMPTIONS

### Verified Facts
- Espresso shot takes 25-30 seconds to pull (physics of extraction)
- Milk steaming takes 30-40 seconds (thermal transfer rate)
- Credit card processing takes 3-5 seconds

### Assumptions (Unverified)
- "Customers want to watch their drink being made" - Do they? Or do they just want it fast?
- "One barista is optimal" - Why not two? Or zero (automation)?
- "Orders must be sequential" - Could we batch-process?

### Conventions (Traditional)
- Counter-based service - Historical: started with diners and cafes
- Pay before drink - Why not pay after, or subscription?
- Made-to-order - Could some drinks be pre-made?

## 4. DEPENDENCY MAP
```
L0 (Physics): Espresso extraction time (25-30s), milk steaming (30-40s)
L1 (Direct):  Minimum drink time is ~60s per drink
L2 (Derived): With 1 barista, max throughput is 1 drink/minute
L3 (Convention): Sequential service, counter pickup, pay first
```

## 5. CONVENTIONAL APPROACH
**Current method:** Customer orders at counter, pays, waits while barista makes drink, picks up
**Rationale:** Personal service, quality control, simple workflow
**Trajectory:** Long lines during peak times, customer frustration

## 6. OPPORTUNITY ANALYSIS
**Theoretical limit:** 60s per drink (physics-based)
**Current performance:** 3-5 minutes per drink (includes ordering, payment, waiting)
**Gap:** 3-5x slower than theoretical minimum
**Implication:** Most time lost in ordering/payment/waiting, NOT drink making

---

**Next Step:** Challenge workflow - Can we remove ordering time? Can we parallelize with more baristas? Can we batch drinks? Can we eliminate counter service?
```

## Success Criteria

Deconstruction is complete when:
- True goal is clear and agreed upon
- All components are identified and categorized
- Facts are separated from assumptions with evidence
- Dependencies are mapped showing what's fundamental vs. derived
- Opportunity gaps are quantified
- You could explain the system to someone who knows nothing about it
