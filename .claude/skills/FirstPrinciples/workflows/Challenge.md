# Challenge Workflow

Test every assumption and constraint rigorously. Classify constraints as hard (physics/math), soft (changeable), or assumptions (unverified).

## Purpose

The second phase of first principles reasoning. Take the components and assumptions identified in Deconstruction and challenge each one systematically. Separate true physical limits from artificial constraints that can be changed or eliminated.

## Three-Tier Constraint Classification

### HARD Constraints (Immutable)
**Definition:** Based on physics, mathematics, or fundamental laws of nature.

**Characteristics:**
- Cannot be violated regardless of resources
- Based on thermodynamics, physics, chemistry, mathematics
- True across all contexts and time periods

**Examples:**
- Speed of light in vacuum is 299,792,458 m/s
- Energy cannot be created or destroyed
- Water boils at 100°C at sea level (given atmospheric pressure)
- Chemical reaction rates follow Arrhenius equation

**Test:** "Could infinite money/time/resources change this?" If no → HARD

### SOFT Constraints (Changeable)
**Definition:** Based on current technology, resources, regulations, or organizational choices.

**Characteristics:**
- Can be changed with sufficient resources or innovation
- Technology-dependent or policy-dependent
- Vary by context, location, or time period
- Someone, somewhere may have already overcome them

**Examples:**
- "Battery costs $600/kWh" (market price, not material cost)
- "Requires FDA approval" (regulation, but can be navigated)
- "Our budget is $100K" (resource allocation choice)
- "Processing takes 2 weeks" (process design choice)

**Test:** "Has anyone ever done this differently?" If yes → SOFT

### ASSUMPTIONS (Unverified Beliefs)
**Definition:** Beliefs not based on evidence or systematic testing.

**Characteristics:**
- "We think" or "customers probably want"
- Based on analogy, tradition, or intuition
- Never directly tested or measured
- May be true, may be false - need data

**Examples:**
- "Users won't pay more than $X"
- "This feature is essential"
- "Customers want human customer service"
- "Our competitors will respond this way"

**Test:** "What evidence do we have?" If none → ASSUMPTION

## Process

### 1. Take Each Component from Deconstruction

Go through every constraint, requirement, and assumption identified.

**Template:**
```
CONSTRAINT: [Statement from deconstruction]
CLASSIFICATION: [HARD / SOFT / ASSUMPTION]
EVIDENCE: [Why we classified it this way]
CHANGEABILITY: [If not hard, how could it be changed?]
```

### 2. Apply Classification Tests

For each constraint, ask:

**Test 1: Physics Test**
- "Is this a law of nature or physics?"
- "Does this violate thermodynamics, gravity, speed of light, etc.?"
- If yes → HARD

**Test 2: Historical Test**
- "Has anyone, anywhere, ever done this differently?"
- "Are there counterexamples in other industries/countries/contexts?"
- If yes → SOFT (not HARD, since someone bypassed it)

**Test 3: Resource Test**
- "Could infinite resources change this?"
- "Is this about capability or about allocation?"
- If resources help → SOFT

**Test 4: Evidence Test**
- "What evidence supports this belief?"
- "Have we tested this directly?"
- If no evidence → ASSUMPTION

### 3. Challenge Assumptions with Thought Experiments

For each ASSUMPTION, design a test:

**Assumption Challenge Template:**
```
ASSUMPTION: [Belief statement]

WHY WE BELIEVE IT:
- [Source of belief - analogies? tradition? intuition?]

COUNTER-EVIDENCE:
- [Any data that contradicts this?]
- [Examples where this doesn't hold?]

THOUGHT EXPERIMENT:
- [What if the opposite were true?]
- [How would we test this cheaply?]

PROPOSED TEST:
- [Minimal experiment to validate/invalidate]
- [Cost: $ and time]
```

### 4. Calculate Cost to Change Soft Constraints

For SOFT constraints, estimate what it would take to change them:

**Template:**
```
SOFT CONSTRAINT: [Statement]

CURRENT STATE: [How it is now]

CHANGE OPTIONS:
1. [Option A] - Cost: $X, Time: Y, Risk: Z
2. [Option B] - Cost: $X, Time: Y, Risk: Z

PRECEDENT: [Who has done this before? How?]

RECOMMENDATION: [Worth pursuing? Why/why not?]
```

### 5. Identify Leveraged Constraints

**High-leverage constraints:** Small changes unlock big value.

**Questions:**
- If we removed this constraint, what becomes possible?
- Does this constraint block multiple other improvements?
- Is this constraint widely believed but rarely tested?

**Example:** "Rockets must be disposable"
- Removing this constraint unlocked 90% cost reduction
- Widely believed, but based on tradition, not physics
- High leverage: Enabled entire space industry transformation

### 6. Map Constraint Dependencies

Some constraints depend on others. Changing one might eliminate several.

**Example:**
```
"Approval takes 2 weeks"
  ↓ depends on
"5 sequential approvals required"
  ↓ depends on
"All senior leaders must review"
  ↓ depends on
"High risk requires many eyes" (ASSUMPTION)

→ Challenge root assumption: Does adding reviewers reduce risk?
→ If no, then all dependent constraints can be removed
```

## Output Format

```markdown
# Challenge Analysis: [Problem Name]

## Constraint Classification

### HARD Constraints (Cannot Change)
| Constraint | Evidence | Implication |
|------------|----------|-------------|
| [Physical law] | [Physics/math basis] | [What this means for solution] |

### SOFT Constraints (Can Change)
| Constraint | Current State | Change Options | Cost to Change | Precedent |
|------------|---------------|----------------|----------------|-----------|
| [Changeable limit] | [How it is now] | [Possible changes] | [$X, Y time] | [Who's done this] |

### ASSUMPTIONS (Need Testing)
| Assumption | Why We Believe | Counter-Evidence | Proposed Test | Cost |
|------------|----------------|------------------|---------------|------|
| [Unverified belief] | [Source] | [Data against it] | [How to test] | [$X] |

## High-Leverage Opportunities

**Top 3 Constraints to Challenge:**

1. **[Constraint name]**
   - **Current impact:** [How it limits us]
   - **Type:** [SOFT / ASSUMPTION]
   - **Change strategy:** [How to overcome]
   - **Potential impact:** [What becomes possible]
   - **Precedent:** [Who's done this]

2. **[Constraint name]**
   - ...

3. **[Constraint name]**
   - ...

## Constraint Dependency Map

```
[Root assumption]
  ↓
[Dependent constraint 1]
  ↓
[Dependent constraint 2]
  ↓
[Resulting limitation]
```

**Insight:** If we challenge [root], we eliminate [all dependents].

## Recommended Tests

**Highest priority experiments to run:**

1. **Test [assumption X]**
   - Method: [How to test cheaply]
   - Cost: $X, Y days
   - Success criteria: [What we'd learn]
   - Risk: [What's the downside]

2. **Test [assumption Y]**
   - ...

---

**Next Step:** Proceed to Reconstruct workflow with only HARD constraints + tested assumptions.
```

## Key Questions for Challenging

1. **For constraints:** "Is this physics or policy? Nature or choice?"
2. **For assumptions:** "What would it cost to test this? $100? $1000? $10K?"
3. **For precedent:** "Who has violated this 'rule' successfully?"
4. **For leverage:** "If we removed this, what percentage improvement do we get?"
5. **For dependencies:** "What's the root constraint everything else depends on?"

## Red Flags (Signs of challengeable constraints)

- "That's just how it's done" (convention, not law)
- "No one has ever..." (absence of evidence, not evidence of absence)
- "It's too expensive" (resource allocation, not physics)
- "Regulations require..." (soft constraint, can be worked with/around)
- "Our industry standard..." (convention, not optimum)

## Challenge Techniques

### Technique 1: Inversion
"What if the opposite were true?"
- Assumption: "Customers want human support"
- Inversion: "What if customers prefer self-service?" (Test: Offer both)

### Technique 2: Extreme Scenario
"What if we had infinite resources? What would change?"
- Helps identify resource constraints vs. physics constraints

### Technique 3: Cross-Industry Analogy
"How do other industries handle this?"
- Aviation reuses aircraft (why not rockets?)
- Software deploys continuously (why not hardware?)

### Technique 4: Historical Analysis
"When did this constraint start? Why?"
- Many constraints are historical accidents, not optimizations

### Technique 5: Direct Measurement
"Can we test this assumption for $X?"
- Better to spend $1000 testing than assume for years

## Example: Battery Cost Challenge

```markdown
# Challenge Analysis: EV Battery Costs

## Constraint Classification

### HARD Constraints (Cannot Change)
| Constraint | Evidence | Implication |
|------------|----------|-------------|
| Lithium-ion energy density ~250 Wh/kg | Electrochemistry limits | Need ~400kg battery for 300mi range |
| Charging time limited by thermal management | Heat dissipation physics | Faster charging risks battery damage |

### SOFT Constraints (Can Change)
| Constraint | Current State | Change Options | Cost to Change | Precedent |
|------------|---------------|----------------|----------------|-----------|
| Battery costs $600/kWh | Market price from suppliers | Vertical integration, direct material sourcing | $5B factory investment | Tesla Gigafactory ($5B, achieved <$100/kWh) |
| Cobalt required for cathode | Current chemistry uses 10-20% cobalt | LFP or cobalt-reduced chemistries | R&D + production shift | CATL LFP batteries (cobalt-free) |
| Manual battery assembly | Labor-intensive pack assembly | Automated cell-to-pack manufacturing | $500M automation | BYD Blade Battery (automated) |

### ASSUMPTIONS (Need Testing)
| Assumption | Why We Believe | Counter-Evidence | Proposed Test | Cost |
|------------|----------------|------------------|---------------|------|
| "Customers need 300+ mile range" | Marketing surveys, range anxiety | 90% of daily drives <40 miles | Offer lower-cost 200mi model, measure sales | $10M pilot |
| "Fast charging is essential" | EV narratives | Most charging is overnight at home | Survey actual charging behavior | $50K survey |
| "Premium materials needed for safety" | Industry practice | Chinese EVs use cheaper materials safely | Third-party safety testing | $100K tests |

## High-Leverage Opportunities

**Top 3 Constraints to Challenge:**

1. **"Battery costs $600/kWh"**
   - **Current impact:** Makes EVs unaffordable vs. gas cars
   - **Type:** SOFT (market price, not material cost)
   - **Change strategy:** Vertical integration - buy raw materials directly at $80/kWh
   - **Potential impact:** 86% cost reduction on battery = 40% reduction in vehicle cost
   - **Precedent:** Tesla Gigafactory achieved <$100/kWh through vertical integration

2. **"Customers need 300+ mile range"**
   - **Current impact:** Forces expensive 75-100 kWh battery packs
   - **Type:** ASSUMPTION (never directly tested at scale)
   - **Change strategy:** Offer 50 kWh option (200mi) at $10K less
   - **Potential impact:** Opens mass-market price point (<$25K)
   - **Precedent:** Nissan Leaf sold 500K+ units with 150mi range

3. **"Cobalt required for cathodes"**
   - **Current impact:** Supply chain risk, human rights concerns, high cost
   - **Type:** SOFT (chemistry choice, not physics requirement)
   - **Change strategy:** Switch to LFP (lithium iron phosphate) chemistry
   - **Potential impact:** -$50/kWh cost, no cobalt supply risk
   - **Precedent:** BYD, CATL mass-produce LFP batteries at scale

## Constraint Dependency Map

```
"EVs must be expensive" (OUTCOME)
  ↑
"Battery costs $600/kWh" (SOFT)
  ↑
"Buy from battery suppliers" (CHOICE)
  ↑
"Can't afford battery factory" (ASSUMPTION)
```

**Insight:** If we challenge "can't afford factory" → we unlock vertical integration → we achieve $100/kWh → EVs become affordable

## Recommended Tests

**Highest priority experiments to run:**

1. **Test "customers need 300mi range" assumption**
   - Method: Pre-sell 200mi model at $10K discount, measure conversion
   - Cost: $10M pilot production
   - Success criteria: >20% of buyers choose 200mi model
   - Risk: Low - only produce what's pre-sold

2. **Test "LFP battery acceptability" assumption**
   - Method: Offer LFP variant (cheaper, slightly lower range) in China first
   - Cost: $50M production line
   - Success criteria: 30%+ buyers choose LFP despite 10% less range
   - Risk: Medium - China market more price-sensitive (good test market)

---

**Next Step:** Reconstruct workflow - Design EV using only HARD constraints + tested assumptions:
- Use $80/kWh material cost (vertical integration)
- Offer 50 kWh battery option (200mi)
- Use LFP chemistry (no cobalt)
- Target: $25K mass-market EV
```

## Success Criteria

Challenge is complete when:
- Every constraint classified as HARD, SOFT, or ASSUMPTION
- HARD constraints have physics/math basis documented
- SOFT constraints have change strategies and precedent identified
- ASSUMPTIONS have proposed tests with costs
- High-leverage opportunities identified (top 3)
- Ready to rebuild solution using only verified constraints
