# Adversarial Analysis Workflow

**Full red team exercise using parallel agents to stress-test ideas, proposals, and strategies.**

## Overview

This workflow deploys multiple adversarial agents in parallel, each attacking your idea from a different angle. The goal is to expose vulnerabilities, challenge assumptions, and identify risks BEFORE they cause failure.

## When to Use

- Strategic planning (business model, go-to-market, product roadmap)
- Architecture decisions (technology choices, system design)
- Investment decisions (resource allocation, hiring, tools)
- Proposals and presentations (board decks, investor pitches, RFPs)
- Research conclusions (validate findings against critique)

## Workflow Steps

### Step 1: Define Target

**Clarify what you're analyzing:**
- What is the idea, proposal, plan, or strategy?
- What stage is it at? (concept, planning, ready to execute)
- What's the decision at stake? (go/no-go, which option, how much to invest)
- What context is needed? (market, team, constraints, timeline)

**Prompt the user for details if needed:**
```
"To red team this effectively, I need:
1. The complete proposal/plan/strategy
2. Key assumptions you're making
3. Constraints (time, budget, team size)
4. Success criteria - what does 'working' look like?"
```

### Step 2: Spawn Parallel Adversarial Agents

**Launch 3-5 intern agents in parallel, each with a different attack vector.**

**Agent 1: Technical Feasibility Critic**
```
Prompt: "You are a technical feasibility critic. Your job is to identify implementation gaps, technical debt, dependency risks, and architectural weaknesses in this plan: [PLAN]. Be brutally honest about what could go wrong technically. Output: List of technical vulnerabilities with severity scores (1-5)."

Model: haiku (for speed) or sonnet (for depth)
```

**Agent 2: Market Risk Analyst**
```
Prompt: "You are a market risk analyst. Your job is to identify competitive threats, market timing issues, adoption barriers, and customer skepticism in this plan: [PLAN]. Challenge whether anyone will actually care. Output: List of market risks with severity scores (1-5)."

Model: haiku or sonnet
```

**Agent 3: Resource Constraint Auditor**
```
Prompt: "You are a resource constraint auditor. Your job is to identify time, money, people, and skill gaps in this plan: [PLAN]. Challenge whether the team actually has capacity to execute. Output: List of resource limitations with severity scores (1-5)."

Model: haiku or sonnet
```

**Agent 4: Hidden Assumptions Hunter**
```
Prompt: "You are an assumptions hunter. Your job is to identify unstated beliefs, fragile assumptions, and logical leaps in this plan: [PLAN]. Surface what's being taken for granted but might not be true. Output: List of questionable assumptions with severity scores (1-5)."

Model: haiku or sonnet
```

**Agent 5: Second-Order Effects Analyst**
```
Prompt: "You are a second-order effects analyst. Your job is to identify unintended consequences, downstream impacts, and ripple effects of this plan: [PLAN]. What could go wrong AFTER success? Output: List of second-order risks with severity scores (1-5)."

Model: haiku or sonnet
```

**Example Task calls:**
```typescript
Task({
  prompt: "Technical feasibility critique: [PLAN]...",
  subagent_type: "intern",
  model: "haiku"
})

Task({
  prompt: "Market risk analysis: [PLAN]...",
  subagent_type: "intern",
  model: "haiku"
})

// ... etc for all 5 agents
```

### Step 3: Collect Findings

**Wait for all agents to complete, then aggregate results.**

**Organize findings by:**
1. **Severity** (CRITICAL → HIGH → MEDIUM → LOW → INFO)
2. **Category** (Technical, Market, Resource, Assumptions, Second-Order)
3. **Theme** (group related findings)

**Track totals:**
- Count of findings by severity
- Most commonly flagged issues (consensus vulnerabilities)
- Unique outlier concerns (single agent found)

### Step 4: Synthesize Vulnerabilities

**Create executive summary:**

```
## RedTeam Analysis: [TARGET]

**Overview**: [One paragraph - what we analyzed and overall assessment]

**Severity Breakdown**:
- CRITICAL (5): [count] findings
- HIGH (4): [count] findings
- MEDIUM (3): [count] findings
- LOW (2): [count] findings
- INFO (1): [count] observations

**Top 5 Vulnerabilities**:
1. [Most severe/impactful finding with explanation]
2. [Second most severe...]
3. [Third...]
4. [Fourth...]
5. [Fifth...]
```

### Step 5: Score Severity

**For each finding, assign severity score:**

**CRITICAL (5) - Fatal Flaw**
- Example: "No clear customer acquisition strategy. How will anyone find you?"
- Example: "Architecture requires 50 TB RAM. Budget is $5K."
- Example: "Assumes regulatory approval. Takes 18+ months, project timeline is 6 months."

**HIGH (4) - Serious Risk**
- Example: "Team has no security expertise. Building healthcare app requires HIPAA compliance."
- Example: "Market leader just launched this exact feature. Differentiation unclear."
- Example: "Success requires 10 hires. Runway only supports 3 months."

**MEDIUM (3) - Moderate Concern**
- Example: "Monitoring strategy not defined. Will be hard to debug in production."
- Example: "Pricing model untested. May need iteration after launch."
- Example: "Assumes async communication works. Team prefers synchronous."

**LOW (2) - Minor Issue**
- Example: "Documentation could be more comprehensive."
- Example: "Some edge cases not fully spec'd."
- Example: "Team skill gaps exist but trainable."

**INFO (1) - Observation**
- Example: "Consider adding feature X in future iteration."
- Example: "Alternative approach Y might be worth exploring."
- Example: "Industry trend Z could impact long-term."

### Step 6: Recommend Mitigations

**For CRITICAL and HIGH findings, provide specific mitigations:**

```
## Recommended Mitigations

**CRITICAL Findings:**

1. [Finding]: [Description]
   - **Mitigation 1**: [Specific action to address]
   - **Mitigation 2**: [Alternative approach]
   - **Fallback**: [What to do if unfixable]

2. [Finding]: [Description]
   - **Mitigation**: [Action]
   ...

**HIGH Findings:**

1. [Finding]: [Description]
   - **Mitigation**: [Action]
   ...
```

**Mitigation patterns:**
- **De-risk**: Prototype, test, validate assumptions before full commitment
- **Adjust scope**: Reduce ambition to match resources
- **Acquire resources**: Hire, partner, or outsource gaps
- **Change approach**: Pivot strategy to avoid vulnerability
- **Accept risk**: Knowingly proceed with risk mitigation plan

### Step 7: Go/No-Go Assessment

**Provide clear recommendation:**

```
## Recommendation

**Decision**: [GO / NO-GO / CONDITIONAL GO]

**Rationale**: [Why this recommendation based on findings]

**If GO**:
- Address these CRITICAL findings first: [list]
- Monitor these HIGH risks closely: [list]
- Timeline adjustment: [if needed]

**If NO-GO**:
- Fatal flaws: [list]
- Alternative approach: [suggestion]
- Revisit when: [conditions]

**If CONDITIONAL GO**:
- Proceed only if: [conditions]
- Required mitigations: [list]
- Decision checkpoint: [when to reassess]
```

## Output Format

**Deliver results as:**
1. **Executive Summary** (1 page) - Top vulnerabilities and recommendation
2. **Full Findings Report** (detailed) - All agent outputs organized by severity
3. **Mitigation Playbook** (actionable) - Specific steps to address findings

## Best Practices

**Do:**
- Be brutally honest - sugar-coating defeats the purpose
- Focus on impact, not opinion - "this will fail because X" not "I don't like X"
- Provide specific mitigations, not just critique
- Celebrate what's STRONG too (balanced assessment)

**Don't:**
- Attack the person - critique the idea
- Nitpick for sake of nitpicking - focus on material risks
- Assume failure - identify risks so they CAN be mitigated
- Over-index on unlikely scenarios - probability matters

## Model Selection Guide

| Scenario | Model Choice | Why |
|----------|-------------|-----|
| Quick stress test | haiku | Fast, good enough for most analyses |
| Standard analysis | sonnet | Better nuance, reasonable speed |
| Critical business decision | opus | Maximum rigor, deepest reasoning |
| Very complex proposal | opus | Handles complexity better |

## Integration Points

**Before adversarial analysis:**
- **ClaimDecomposition** workflow - Break down arguments first
- **Research** skill - Gather competitive/market intelligence

**After adversarial analysis:**
- **ceo-advisor** or **cto-advisor** - Develop mitigation strategy
- **prd** skill - Refine requirements based on findings
- **architect** - Adjust technical design

## Example Execution

```
User: "Red team my plan to build a fractional CTO consulting business"

→ Step 1: Gather details about plan, pricing, target market, team
→ Step 2: Launch 5 parallel haiku agents with critique prompts
→ Step 3: Collect 23 findings across all categories
→ Step 4: Synthesize into executive summary
→ Step 5: Score severity: 2 CRITICAL, 4 HIGH, 9 MEDIUM, 6 LOW, 2 INFO
→ Step 6: Recommend mitigations for top 6 findings
→ Step 7: "CONDITIONAL GO - proceed after addressing CRITICAL findings"

Critical Finding 1: "No lead generation strategy. How will you get first 5 clients?"
→ Mitigation: "Build LinkedIn presence + guest post on CTO blogs before launch"

Critical Finding 2: "Revenue model assumes 5 clients at $10K/mo. Takes 6+ months to close enterprise deals. Cash runway?"
→ Mitigation: "Start with 2-3 pilot clients at reduced rate to prove model, or secure bridge funding"
```

## Notification

**At workflow start:**
```bash
${PAI_DIR}/tools/skill-workflow-notification AdversarialAnalysis RedTeam
```
