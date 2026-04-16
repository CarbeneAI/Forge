---
name: brainstorming
description: |
  Collaborative brainstorming skill that transforms ideas into fully-formed designs through structured dialogue.
  USE WHEN user wants to brainstorm, design a feature, explore approaches, plan architecture, or needs help thinking through a design problem.
  Four-phase process: Understanding → Exploring → Presenting → Documenting. Asks one question at a time, proposes multiple approaches with trade-offs, presents design incrementally for validation, and commits final design to git.
---

# Brainstorming

Collaborative brainstorming that converts rough ideas into fully-formed, validated designs through structured dialogue.

## 🎯 Load Full CORE Context

```bash
read ${PAI_DIR}/skills/CORE/SKILL.md
```

## When to Activate This Skill

- "brainstorm with me" → Four-phase collaborative design
- "help me think through X" → Structured exploration
- "what's the best approach for Y" → Multiple options with trade-offs
- "design a feature for Z" → Incremental design validation
- "I have an idea for..." → Idea to implementation-ready design

## Core Philosophy

**The Iron Law: One Question at a Time**

Ask ONE question. Wait for answer. Process deeply. Ask next question.

NEVER ask multiple questions in one message. This is the foundation of effective brainstorming.

**Multiple Choice Preferred**

When gathering requirements, provide 2-4 options whenever possible rather than open-ended questions.

**YAGNI Ruthlessly Applied**

You Ain't Gonna Need It. Strip out everything not essential to the core use case. Fight scope creep at every turn.

## The Four-Phase Process

### Phase 1: Understanding (Questions & Requirements)

**Goal:** Deeply understand what the user wants to build and why.

**Approach:**
1. Ask clarifying questions ONE AT A TIME
2. Prefer multiple choice over open-ended questions
3. Focus on the core use case first
4. Challenge assumptions gently
5. Apply YAGNI - strip out non-essential features

**Example Questions:**
- "What's the main problem this solves?" (not "tell me everything about your idea")
- "Who will use this? A) End users B) Developers C) Both" (not "who's the audience?")
- "Is this primarily for A) Real-time interaction B) Batch processing C) Configuration"
- "Should this handle edge case X or focus on the common path first?"

**Phase Complete When:** You can state the core requirement in 1-2 sentences and user confirms it's accurate.

### Phase 2: Exploring Approaches

**Goal:** Present 2-3 viable approaches with honest trade-offs.

**Structure:**

```markdown
## Approach 1: [Name]

**How it works:** [2-3 sentence explanation]

**Pros:**
- [Advantage 1]
- [Advantage 2]

**Cons:**
- [Disadvantage 1]
- [Disadvantage 2]

**Best for:** [When this makes sense]

## Approach 2: [Name]

[Same structure]

## Approach 3: [Name] (if applicable)

[Same structure]

## My Recommendation

Given your requirements, I'd suggest [Approach X] because [reasoning].

However, if [constraint or preference], then [Alternative] might be better.

What sounds right to you?
```

**Critical Rules:**
- Present REAL trade-offs (not "Pros: everything, Cons: none")
- Recommend ONE approach but explain why others might be better in different contexts
- Keep it to 2-3 approaches (not 5+)
- Make sure approaches are meaningfully different, not variations of same idea

**Phase Complete When:** User selects an approach or asks to combine elements.

### Phase 3: Presenting Design

**Goal:** Present the complete design in digestible chunks for incremental validation.

**Structure:**
- Present design in 200-300 word sections
- Wait for validation after each section
- Adjust based on feedback before continuing

**Section Order (typical):**

1. **Architecture Overview** (200-300 words)
   - High-level components
   - How they interact
   - Data flow
   - Wait for: ✅ or feedback

2. **Core Implementation** (200-300 words)
   - Key classes/functions/modules
   - Primary logic
   - Critical algorithms
   - Wait for: ✅ or feedback

3. **Data Structures** (200-300 words)
   - Schema/types
   - Persistence strategy
   - State management
   - Wait for: ✅ or feedback

4. **Integration Points** (200-300 words)
   - APIs to call
   - External dependencies
   - Configuration needed
   - Wait for: ✅ or feedback

5. **Edge Cases & Error Handling** (200-300 words)
   - Failure modes
   - Validation
   - Recovery strategies
   - Wait for: ✅ or feedback

**Critical Rules:**
- STOP after each section and wait for validation
- If user says "looks good", continue to next section
- If user gives feedback, adjust design and re-present that section
- Keep sections tight (200-300 words) - not 1000-word walls of text

**Phase Complete When:** All sections validated and user says "ready to document" or similar.

### Phase 4: Documenting

**Goal:** Capture the validated design in markdown and commit to git.

**Steps:**

1. **Create design document:**
   ```bash
   # Standard location for design docs
   mkdir -p docs/plans

   # Format: YYYY-MM-DD-topic-design.md
   touch docs/plans/2026-02-03-user-auth-design.md
   ```

2. **Document structure:**
   ```markdown
   # [Feature Name] Design

   **Date:** 2026-02-03
   **Status:** Ready for Implementation

   ## Goal

   [1-2 sentence problem statement]

   ## Architecture

   [Architecture overview from Phase 3, Section 1]

   ## Implementation Details

   [Core implementation from Phase 3, Section 2]

   ## Data Structures

   [Data structures from Phase 3, Section 3]

   ## Integration Points

   [Integration points from Phase 3, Section 4]

   ## Edge Cases & Error Handling

   [Edge cases from Phase 3, Section 5]

   ## Open Questions

   - [Any unresolved items]

   ## Next Steps

   - [ ] Create git worktree for implementation
   - [ ] Implement core functionality
   - [ ] Write tests
   - [ ] Integration testing
   ```

3. **Commit to git:**
   ```bash
   git add docs/plans/YYYY-MM-DD-topic-design.md
   git commit -m "Add design document for [feature]

   Collaborative brainstorming session covering:
   - Architecture approach
   - Implementation strategy
   - Data structures
   - Integration points
   - Edge cases

   Ready for implementation.

   Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
   ```

4. **Suggest next steps:**
   ```markdown
   Design documented and committed!

   Recommended next steps:

   1. Create git worktree for implementation (see GitWorktrees skill)
   2. Create implementation plan (see WritingPlans skill)
   3. Execute plan using subagent-driven development

   Would you like help with any of these?
   ```

**Phase Complete When:** Design committed to git and next steps suggested.

## Integration with Other Skills

**Brainstorming → WritingPlans:**
After design is documented, create detailed implementation plan.

**Brainstorming → GitWorktrees:**
Before implementation, create isolated worktree for the feature.

**Brainstorming → SubagentDrivenDev:**
Execute the implementation plan with fresh subagent per task.

## Best Practices

### DO:
- ✅ Ask one question at a time
- ✅ Provide multiple choice options when possible
- ✅ Present honest trade-offs between approaches
- ✅ Show design in 200-300 word chunks with validation checkpoints
- ✅ Apply YAGNI ruthlessly
- ✅ Commit final design to git with clear commit message

### DON'T:
- ❌ Ask 5 questions in one message
- ❌ Present approaches with no real trade-offs
- ❌ Dump 2000-word design document without checkpoints
- ❌ Add features "because they might be useful"
- ❌ Skip git commit of final design
- ❌ Proceed to implementation without user validation

## Common Failure Modes

| Failure | Fix |
|---------|-----|
| **Asking too many questions at once** | Stop. Ask ONE. Wait for answer. |
| **Open-ended requirements gathering** | Provide multiple choice options instead. |
| **Vague trade-offs ("flexible but complex")** | Be specific: "Adds 200 LOC, 3 new dependencies, 2x complexity in error handling" |
| **Monolithic design presentation** | Break into 200-300 word sections with validation stops. |
| **Feature creep** | Apply YAGNI. Ask: "Do you need this for v1?" |
| **Design not committed to git** | Always commit final design with clear documentation. |

## Examples

### Example 1: Feature Brainstorming

```
User: "I want to add user authentication to my app"

Hiram: "Great! Let's start with the core requirement.

What type of authentication do you need?

A) Simple username/password (stored locally)
B) OAuth/Social login (Google, GitHub, etc.)
C) Enterprise SSO (SAML, Active Directory)
D) Combination of the above

Just pick the letter that fits best."

User: "B - OAuth with Google and GitHub"

Hiram: "Perfect. One more question:

Where will user session data be stored?

A) Browser localStorage (simple, but limited)
B) HTTP-only cookies (more secure, better for sensitive data)
C) Server-side sessions with Redis/similar
D) JWT tokens (stateless, scales horizontally)

What sounds right for your use case?"

[... continues through 4 phases ...]
```

### Example 2: Architecture Design

```
User: "Help me design a job queue system"

Hiram: "Let's explore this. First question:

What's the primary use case?

A) Background email sending (100s per hour)
B) Heavy data processing (long-running jobs, minutes to hours)
C) Real-time webhooks (must execute within seconds)
D) Scheduled tasks (cron-like, specific times)

Which fits your needs?"

[... Phase 1: Understanding continues ...]

[Phase 2: Exploring Approaches]

Hiram: "Based on your requirements, here are 3 viable approaches:

## Approach 1: Redis + Bull Queue

**How it works:** Use Bull (Node.js queue library) with Redis as broker. Jobs queued to Redis, workers poll and execute.

**Pros:**
- Battle-tested library, used by thousands of companies
- Built-in retry logic, job prioritization, delayed jobs
- Web UI for monitoring (Bull Board)
- Horizontal scaling: just add more workers

**Cons:**
- Requires Redis infrastructure (another service to maintain)
- Node.js specific (if you need other languages, need separate workers)
- Memory-based (if Redis crashes, in-flight jobs lost unless persisted)

**Best for:** Node.js apps, moderate scale (1K-100K jobs/day), need quick setup

## Approach 2: Database-Backed Queue (PostgreSQL)

**How it works:** Use pg_boss or similar to store jobs in PostgreSQL. Workers poll database for jobs.

**Pros:**
- No additional infrastructure (you already have Postgres)
- ACID guarantees: jobs never lost even if worker crashes
- Simple debugging: SQL queries to see job state
- Language agnostic: any language can query Postgres

**Cons:**
- Slower than in-memory Redis (disk I/O on every poll)
- Database becomes bottleneck at high scale (10K+ jobs/sec)
- Need to manage indexes and table cleanup

**Best for:** Small-medium scale, prefer simplicity, already using Postgres, need durability

## Approach 3: Cloud Service (AWS SQS, Google Cloud Tasks)

**How it works:** Use managed queue service. Push jobs to queue, workers poll cloud API.

**Pros:**
- Zero infrastructure management
- Infinite scale (cloud provider handles it)
- Built-in monitoring, metrics, alerting
- Pay only for what you use

**Cons:**
- Vendor lock-in
- Costs increase with volume ($0.50 per 1M requests)
- Network latency on every job (not suitable for tight loops)
- Less control over retry logic, scheduling

**Best for:** Already on cloud, want managed solution, unpredictable scale

## My Recommendation

Given you mentioned wanting to keep infrastructure simple and you're already using PostgreSQL, I'd suggest **Approach 2: pg_boss**.

However, if you expect to scale beyond 10K jobs/day or need sub-second latency, go with **Approach 1: Bull + Redis**.

What sounds right to you?"

[... continues to Phase 3 after user selects ...]
```

## Workflow Routing

When user requests brainstorming, invoke this skill's four-phase process. No separate workflow files needed - entire process documented above.

---

**This skill transforms rough ideas into implementation-ready designs through disciplined, incremental collaboration.**
