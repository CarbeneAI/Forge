# Claim Decomposition Workflow

**Break arguments into atomic claims, assess evidence quality, identify logical fallacies, and rate confidence.**

## Overview

Before you can effectively red team an argument or proposal, you need to decompose it into discrete, testable claims. This workflow systematically breaks down complex arguments into their atomic components, evaluates the evidence supporting each claim, and identifies logical weaknesses.

## When to Use

- Analyzing proposals, whitepapers, or strategy documents
- Evaluating research papers or analysis
- Assessing vendor pitches or sales presentations
- Reviewing architectural decision records (ADRs)
- Fact-checking arguments before accepting them
- Preparing input for adversarial analysis

## Workflow Steps

### Step 1: Extract Atomic Claims

**Read the argument/proposal and extract every distinct claim.**

**Atomic claim definition**: A single, testable assertion that can be evaluated as true/false or strong/weak.

**Example decomposition:**

**Original argument:**
> "We should adopt microservices because they improve scalability and our competitors use them."

**Atomic claims:**
1. Microservices improve scalability
2. Our competitors use microservices
3. Using what competitors use is beneficial
4. (Implicit) We have a scalability problem
5. (Implicit) Microservices are worth the complexity trade-off

**Techniques:**
- Look for "because", "therefore", "since" - these signal reasoning chains
- Identify implicit assumptions (claims assumed but not stated)
- Separate factual claims from value judgments
- Break compound claims into components

**Output format:**
```
## Claim Inventory

1. [Claim statement]
   - Type: [Factual / Value Judgment / Prediction / Assumption]
   - Explicit or Implicit: [E/I]

2. [Claim statement]
   - Type: [...]
   - Explicit or Implicit: [E/I]
```

### Step 2: Assess Evidence Quality

**For each claim, evaluate the supporting evidence.**

**Evidence quality scale:**

**STRONG Evidence**:
- Direct empirical data from reliable sources
- Peer-reviewed research
- First-hand experience with clear documentation
- Multiple independent sources confirm
- Specific examples with verifiable details

**MODERATE Evidence**:
- Industry reports or surveys
- Expert opinions (but not consensus)
- Anecdotal evidence from multiple sources
- Logical inference from established facts
- Case studies (but limited sample size)

**WEAK Evidence**:
- Single source, not independently verified
- Vague or unspecified ("many people say")
- Outdated information
- Circular reasoning
- Correlation presented as causation

**NO Evidence**:
- Claim stated without any supporting information
- "Everyone knows" or "obviously true" assertions
- Unverifiable predictions
- Pure speculation

**Output format:**
```
## Evidence Assessment

**Claim 1**: [Claim statement]
- **Evidence Provided**: [What evidence was given, if any]
- **Evidence Quality**: [STRONG / MODERATE / WEAK / NONE]
- **Gaps**: [What evidence is missing or questionable]
- **Verification**: [How could this be verified?]

**Claim 2**: [...]
```

### Step 3: Identify Logical Fallacies

**Flag common reasoning errors.**

**Common fallacies to look for:**

**Appeal to Authority**
- "Expert X says Y, therefore Y is true"
- Problem: Experts can be wrong, especially outside their domain

**Appeal to Popularity (Bandwagon)**
- "Everyone is doing X, so we should too"
- Problem: Popularity doesn't equal correctness

**False Dichotomy**
- "Either we do X or we fail"
- Problem: Ignores other options

**Slippery Slope**
- "If we do X, then Y will inevitably happen, leading to Z disaster"
- Problem: Assumes causation without evidence

**Correlation ≠ Causation**
- "A and B happened together, so A caused B"
- Problem: Ignores confounding factors

**Hasty Generalization**
- "This worked once, so it always works"
- Problem: Insufficient sample size

**Circular Reasoning**
- "X is true because Y, and Y is true because X"
- Problem: No independent support

**Straw Man**
- "Critics say we shouldn't improve, but we clearly need to improve"
- Problem: Misrepresents opposing argument

**Sunk Cost Fallacy**
- "We've invested so much, we can't stop now"
- Problem: Past investment irrelevant to future decisions

**Ad Hominem**
- "The source is biased, therefore their argument is wrong"
- Problem: Attacks person, not argument

**Output format:**
```
## Logical Fallacies Detected

**Fallacy**: [Name of fallacy]
- **Location**: [Which claim(s)]
- **Explanation**: [Why this is a fallacy]
- **Impact**: [How it weakens the argument]

**Fallacy**: [...]
```

### Step 4: Rate Confidence

**For each claim, assign a confidence rating based on evidence + logic.**

**Confidence scale:**

**HIGH (8-10/10)**
- Strong evidence from multiple sources
- No logical fallacies
- Claim is specific and verifiable
- Consensus among experts (if relevant)
- Example: "Our current API response time is 450ms (measured via APM)"

**MEDIUM (5-7/10)**
- Moderate evidence provided
- Minor logical weaknesses
- Some ambiguity in claim
- Example: "Microservices can improve scalability (depends on implementation)"

**LOW (1-4/10)**
- Weak or no evidence
- Significant logical fallacies
- Vague or unverifiable claim
- Conflicts with other evidence
- Example: "Competitors use microservices (unverified, and 'competitors' undefined)"

**Output format:**
```
## Confidence Ratings

| Claim | Evidence | Fallacies | Confidence | Notes |
|-------|----------|-----------|------------|-------|
| 1. [Short claim] | STRONG | None | HIGH (9/10) | Verified data |
| 2. [Short claim] | WEAK | Appeal to popularity | LOW (3/10) | Needs validation |
| 3. [Short claim] | MODERATE | None | MEDIUM (6/10) | Context-dependent |
```

### Step 5: Synthesize Findings

**Create summary report.**

```
## Claim Decomposition Summary: [Document Title]

**Total Claims Analyzed**: [count]

**Evidence Quality Breakdown**:
- STRONG: [count] claims
- MODERATE: [count] claims
- WEAK: [count] claims
- NONE: [count] claims

**Logical Fallacies Found**: [count]
- Most common: [fallacy type]

**Confidence Distribution**:
- HIGH confidence: [count] claims
- MEDIUM confidence: [count] claims
- LOW confidence: [count] claims

**Critical Weaknesses**:
1. [Claim with LOW confidence + WEAK/NO evidence + fallacies]
2. [Next weakest...]
3. [...]

**Strongest Claims**:
1. [Claim with HIGH confidence + STRONG evidence + no fallacies]
2. [Next strongest...]

**Recommendations**:
- [What evidence should be gathered?]
- [Which claims need revision?]
- [What assumptions should be tested?]
```

### Step 6: Annotate Original Document

**Mark up the original text with findings.**

**Use this format:**

```
[Original text of argument]

---

## Annotated Version

[Paragraph 1 of original]

**CLAIM 1** (LOW CONFIDENCE): "[Extract claim]"
- Evidence: WEAK - [explanation]
- Fallacy: [type] - [explanation]
- Verification needed: [what would strengthen this?]

[Paragraph 2 of original]

**CLAIM 2** (HIGH CONFIDENCE): "[Extract claim]"
- Evidence: STRONG - [citation/data]
- No fallacies detected

[Continue for full document...]
```

## Output Deliverables

**Provide three deliverables:**

1. **Claims Inventory** - List of all atomic claims extracted
2. **Detailed Analysis** - Evidence, fallacies, confidence for each claim
3. **Annotated Document** - Original text marked up with findings

## Integration with Adversarial Analysis

**This workflow is INPUT to AdversarialAnalysis workflow:**

```
User: "Analyze this proposal's logic"

→ Step 1-6: Run ClaimDecomposition workflow
→ Identify 15 claims, 4 with LOW confidence
→ Flag 3 logical fallacies
→ Generate annotated version

→ Feed to AdversarialAnalysis workflow:
  "Here are the weak claims to attack: [list LOW confidence claims]"
  "These fallacies should be explored: [list fallacies]"
  "Focus adversarial agents on: [critical weaknesses]"
```

## Best Practices

**Do:**
- Be charitable - assume best interpretation before critique
- Separate claim quality from agreement - weak evidence for a claim you agree with is still weak
- Look for implicit assumptions - often the weakest points
- Verify "common knowledge" claims - often unverified
- Consider context - some claims are context-dependent

**Don't:**
- Nitpick word choice - focus on substance
- Assume malice - weak arguments often result from lack of rigor, not deception
- Reject everything - some claims will be strong
- Forget your own biases - you have them too

## Example Execution

```
User: "Check the logic in this architecture proposal"

→ Step 1: Extract 12 atomic claims
  - "Microservices improve scalability" (explicit)
  - "We have a scalability problem" (implicit)
  - "Our team can manage microservices complexity" (implicit)
  - [9 more...]

→ Step 2: Assess evidence
  - Claim 1: MODERATE evidence (industry reports, but no specific data)
  - Claim 2: NO evidence (problem not quantified)
  - Claim 3: WEAK evidence (team has no microservices experience)

→ Step 3: Identify fallacies
  - Appeal to popularity: "All major tech companies use microservices"
  - Hasty generalization: "Microservices worked for Netflix, so they'll work for us"

→ Step 4: Rate confidence
  - Claim 1: MEDIUM (5/10) - evidence moderate but context-dependent
  - Claim 2: LOW (2/10) - no evidence of actual problem
  - Claim 3: LOW (3/10) - weak evidence + implicit assumption

→ Step 5: Synthesize
  - 12 claims total
  - 2 STRONG, 4 MODERATE, 3 WEAK, 3 NONE evidence
  - 2 fallacies detected
  - 3 HIGH, 5 MEDIUM, 4 LOW confidence
  - Critical weakness: "No evidence we have scalability problem that requires microservices"

→ Step 6: Annotate document with findings

→ Output: "Recommendation: Gather evidence of actual scalability issues before proceeding with microservices adoption. Consider starting with modular monolith."
```

## Notification

**At workflow start:**
```bash
${PAI_DIR}/tools/skill-workflow-notification ClaimDecomposition RedTeam
```
