---
name: RedTeam
description: Adversarial analysis with parallel agents to stress-test ideas and strategies. USE WHEN user mentions red team, devil's advocate, adversarial analysis, stress test idea, challenge proposal, poke holes, find weaknesses, OR wants critical evaluation of plans, proposals, strategies, or arguments.
---

# RedTeam

**Adversarial analysis system using parallel agents to rigorously challenge ideas, proposals, and strategies from multiple attack vectors.**

## Methodology

The RedTeam skill deploys 3-5 parallel agents, each taking a different adversarial perspective to stress-test your ideas. Instead of confirmation bias, you get multi-angle critique designed to expose weaknesses before they become failures.

### Attack Vectors

Each agent attacks from a different angle:

1. **Technical Feasibility** - Can this actually be built? What technical debt, dependencies, or implementation gaps exist?
2. **Market Risk** - Will anyone care? What competitive threats, market timing issues, or adoption barriers exist?
3. **Resource Constraints** - Do you have the time, money, people, and skills to execute?
4. **Hidden Assumptions** - What unstated beliefs underpin this plan? Which assumptions are fragile?
5. **Second-Order Effects** - What unintended consequences, downstream impacts, or ripple effects could emerge?

### Severity Scoring

Findings are rated on a 5-point scale:

- **CRITICAL (5)** - Fatal flaw. Project will likely fail without addressing this.
- **HIGH (4)** - Serious risk. Strongly recommend mitigation before proceeding.
- **MEDIUM (3)** - Moderate concern. Address during planning or early implementation.
- **LOW (2)** - Minor issue. Monitor but not blocking.
- **INFO (1)** - Observation for awareness. No immediate action required.

### Output Format

The synthesis produces:
- **Executive Summary** - Top 3-5 vulnerabilities identified
- **Findings by Severity** - All issues grouped by score
- **Recommended Mitigations** - Specific actions to address each finding
- **Go/No-Go Assessment** - Clear recommendation on whether to proceed

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **Adversarial Analysis** | "red team this", "stress test", "poke holes" | `workflows/AdversarialAnalysis.md` |
| **Claim Decomposition** | "analyze argument", "check logic", "find fallacies" | `workflows/ClaimDecomposition.md` |

## Examples

**Example 1: Strategy Stress Test**
```
User: "Red team my plan to launch a fractional CTO consulting business"
→ Launches 5 parallel adversarial agents (haiku for speed)
→ Technical: "How will you scale expertise across multiple clients?"
→ Market: "Market is saturated with fractional CTOs. What's your differentiation?"
→ Resource: "Do you have sales/marketing capacity or just delivery capacity?"
→ Assumptions: "Assumes companies want fractional vs full-time. True for your target segment?"
→ Second-order: "Success creates time constraint. How do you avoid becoming the bottleneck?"
→ Synthesizes findings with severity scores
→ Recommends mitigations before launch
```

**Example 2: Technical Architecture Review**
```
User: "Stress test this microservices architecture design"
→ Launches adversarial analysis workflow
→ Technical: "Service mesh adds complexity. Have you considered operational overhead?"
→ Resource: "Team size is 3 engineers. Can they manage 12 services?"
→ Assumptions: "Assumes high traffic. Current scale might not justify microservices."
→ Second-order: "Distributed tracing and monitoring costs could exceed current budget."
→ Severity: 2 CRITICAL, 3 HIGH, 4 MEDIUM findings
→ Recommendation: "Start with modular monolith, extract services as scale demands"
```

**Example 3: Argument Analysis**
```
User: "Analyze the logic in this proposal document"
→ Launches claim decomposition workflow
→ Extracts 12 atomic claims from proposal
→ Identifies 3 claims with weak evidence
→ Flags 2 logical fallacies (appeal to authority, slippery slope)
→ Rates confidence: 4 claims HIGH, 5 MEDIUM, 3 LOW
→ Produces annotated version with evidence gaps highlighted
→ Feeds to adversarial analysis for deeper critique
```

## Integration with Other Skills

- **ceo-advisor / cto-advisor** - Use RedTeam before finalizing strategic recommendations
- **architect** - Stress test architecture decisions before implementation
- **Research** - Validate research conclusions against adversarial critique
- **prd** - Red team PRDs before engineering work begins

## When to Use RedTeam

**Use before:**
- Making significant decisions (architecture, hiring, strategy)
- Committing resources (budget, time, team allocation)
- Launching products or services
- Presenting to executives or investors
- Publishing research or analysis

**Don't use for:**
- Brainstorming (kills creativity)
- Early-stage exploration (too early for critique)
- Simple operational tasks (overkill)

## Model Selection

- **Standard analysis**: Use `haiku` agents for speed (3-5 agents in parallel)
- **Deep strategic critique**: Use `sonnet` agents for nuanced reasoning
- **Critical business decisions**: Use `opus` for maximum rigor

## Notes

- RedTeam is ADVERSARIAL by design. Expect harsh critique.
- Findings are not personal attacks - they're risk mitigation.
- Not every finding needs mitigation - prioritize by severity.
- Best used BEFORE commitment, not after failure.
- Can be applied to your own ideas or external proposals.
