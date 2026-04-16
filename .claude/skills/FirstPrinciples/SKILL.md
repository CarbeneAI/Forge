---
name: FirstPrinciples
description: First principles reasoning framework for breaking complex problems into fundamental truths. USE WHEN user mentions first principles, fundamental analysis, root cause, deconstruct problem, reason from basics, challenge assumptions, OR wants to reason from foundational truths without relying on analogy or convention.
---

# FirstPrinciples

First principles reasoning is a systematic approach to problem-solving by breaking down complex situations into their most basic, fundamental truths and rebuilding solutions from the ground up. Instead of reasoning by analogy (doing things because they've been done that way before), you reason from verified facts and fundamental laws.

This approach, famously used by Elon Musk and other innovative thinkers, enables breakthrough solutions by questioning every assumption and rebuilding from what is provably true.

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **Deconstruct** | "break down", "what are the basics", "deconstruct this" | `workflows/Deconstruct.md` |
| **Challenge** | "test assumptions", "what's actually true", "challenge this" | `workflows/Challenge.md` |
| **Reconstruct** | "rebuild solution", "first principles solution", "rethink this" | `workflows/Reconstruct.md` |

## Framework Overview

**Three-Phase Process:**

1. **DECONSTRUCT**: Break problem into component parts and identify fundamental truths
   - Separate what is known from what is assumed
   - Identify the core elements and constraints
   - List all assumptions being made

2. **CHALLENGE**: Test each assumption and constraint rigorously
   - Hard constraints (physics, mathematics, laws of nature)
   - Soft constraints (regulations, conventions, resources)
   - Assumptions (unverified beliefs, analogies, "common wisdom")

3. **RECONSTRUCT**: Build solution from verified fundamentals only
   - Use only hard constraints and verified facts
   - Question soft constraints (can they be changed?)
   - Eliminate or test assumptions
   - Design optimal solution without conventional baggage

## Core Principles

**What First Principles Reasoning Is:**
- Reducing complexity to fundamental truths
- Questioning every assumption systematically
- Reasoning from physics, math, and verified facts
- Building solutions without relying on "how it's always been done"

**What First Principles Reasoning Is NOT:**
- Ignoring all existing knowledge (learn from history, but don't be bound by it)
- Rejecting convention for its own sake
- Assuming everything is possible (respect true physical limits)
- Skipping research (you need data to identify fundamentals)

## Key Questions

**Deconstruction Questions:**
- What are we really trying to achieve? (True goal, not proxy metrics)
- What are the component parts of this problem?
- What do we know for certain? What are we assuming?
- What are the stated constraints? Are they real or artificial?

**Challenge Questions:**
- Is this constraint based on physics/math, or is it changeable?
- Why do we believe this assumption? What evidence supports it?
- What would have to be true for this constraint to not apply?
- Has anyone violated this "rule" successfully before?

**Reconstruction Questions:**
- If we started from scratch with no baggage, what would we build?
- What is the simplest solution using only verified fundamentals?
- How does our first principles solution compare to the conventional approach?
- What becomes possible when we remove false constraints?

## Examples

**Example 1: Reducing battery costs (Elon Musk's actual approach)**

```
User: "How can we make electric vehicles affordable when battery packs cost $600/kWh?"

→ Activates FirstPrinciples skill
→ Deconstruct workflow:
  - Goal: Affordable energy storage for EVs
  - Conventional thinking: "Batteries are expensive, therefore EVs must be expensive"
  - Assumption: Current market price represents fundamental cost
→ Challenge workflow:
  - What are batteries made of? Cobalt, nickel, aluminum, carbon, polymers
  - What do these materials cost on commodity markets? ~$80/kWh
  - Gap analysis: $600 market price vs $80 material cost = 7.5x markup
  - Constraint classification: Current price is SOFT (manufacturing/supply chain)
→ Reconstruct workflow:
  - First principles solution: Vertically integrate, buy materials directly, optimize manufacturing
  - Result: Tesla achieved <$100/kWh battery costs
  - What changed: Challenged "batteries are expensive" assumption
```

**Example 2: Rocket reusability (SpaceX)**

```
User: "Why are rockets so expensive? Can we make space launch cheaper?"

→ Activates FirstPrinciples skill
→ Deconstruct workflow:
  - Conventional approach: Rockets are disposable, crash into ocean after each use
  - Material cost of rocket: ~$60M
  - Launch price: ~$60M (all cost is in hardware, not fuel)
  - Analogy thinking: "Rockets have always been disposable"
→ Challenge workflow:
  - Hard constraint: Physics requires X fuel to reach orbit (TRUE)
  - Soft constraint: "Rockets can't land safely" (ASSUMPTION)
  - Soft constraint: "Recovery costs more than building new" (ASSUMPTION)
  - Test: Aircraft land and reuse - why not rockets?
→ Reconstruct workflow:
  - First principles: If airplane landed once per flight, tickets would cost millions
  - Solution: Design rockets to land and reuse
  - Result: SpaceX Falcon 9 reduced launch costs 90%
  - What changed: Rejected "disposable rocket" convention
```

**Example 3: Business process optimization**

```
User: "Our approval workflow takes 2 weeks. How can we speed it up?"

→ Activates FirstPrinciples skill
→ Deconstruct workflow:
  - Current process: 5 approvals required (dept head → VP → SVP → CFO → CEO)
  - Stated reason: "Risk management and oversight"
  - Time breakdown: 2-3 days waiting per approval level
  - Assumption: "Multiple layers prevent mistakes"
→ Challenge workflow:
  - What risk are we actually managing? (Dollar threshold, regulatory, reputational)
  - Does every layer add value or just latency?
  - Evidence: Do the 5 approvers catch different issues, or rubber-stamp?
  - Historical analysis: What % of requests are rejected at each level?
→ Reconstruct workflow:
  - Risk threshold: Only CEO approval needed for deals >$1M
  - For <$1M: Single dept head approval with post-audit review
  - Parallel approvals instead of sequential when needed
  - Result: 2 weeks → 2 days for most requests
  - What changed: Questioned "more approvals = less risk" assumption
```

## When to Use First Principles

**High-value scenarios:**
- Breakthrough innovation needed (incremental improvement isn't enough)
- Industry consensus seems wrong (everyone believes something that limits progress)
- Cost reduction targets seem impossible with current approach
- Novel problems without established solutions
- Challenging "that's how it's always been done" thinking

**Lower-value scenarios:**
- Well-understood problems with proven solutions
- Time-sensitive decisions (first principles takes longer)
- Low-stakes situations (not worth the cognitive effort)
- When incremental improvement is sufficient

## Integration with Other Skills

- **Algorithm skill**: Use as OBSERVE and THINK phases before first principles analysis
- **Research skill**: Gather data about fundamentals and challenge assumptions
- **cto-advisor skill**: Apply to technical architecture and technology decisions
- **ceo-advisor skill**: Apply to business strategy and organizational design

## Output Format

When completing first principles analysis, provide:

1. **Original Problem & Conventional Approach**
2. **Fundamental Truths Identified** (physics, math, verified facts)
3. **Assumptions Challenged** (with evidence for/against)
4. **Constraints Reclassified** (hard vs soft)
5. **First Principles Solution** (rebuilt from fundamentals)
6. **Comparison** (new approach vs conventional)
7. **What Becomes Possible** (breakthrough opportunities)

## Key Insight

The power of first principles reasoning is not in ignoring everything that came before - it's in **questioning everything** and rebuilding from what is provably true. Most "impossible" problems are only impossible because of false assumptions and artificial constraints that can be removed.

> "I think it's important to reason from first principles rather than by analogy. The normal way we conduct our lives is we reason by analogy. We are doing this because it's like something else that was done, or it is like what other people are doing. With first principles, you boil things down to the most fundamental truths and say, 'What are we sure is true?' and then reason up from there." - Elon Musk
