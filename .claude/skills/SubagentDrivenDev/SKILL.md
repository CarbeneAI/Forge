---
name: subagent-driven-development
description: |
  Execute implementation plans by dispatching fresh subagent per task with two-stage review (spec compliance + code quality).
  USE WHEN user has a plan with independent tasks that can be executed in the same session, OR wants to implement features using TDD with isolated context per task.
  Fresh context per task prevents confusion. Implementer → Spec Reviewer → Code Quality Reviewer → Fix cycles → Mark complete. Naturally encourages TDD.
---

# Subagent-Driven Development

Execute plans by dispatching a fresh subagent per task, with mandatory two-stage review to ensure spec compliance and code quality.

## 🎯 Load Full CORE Context

```bash
read ${PAI_DIR}/skills/CORE/SKILL.md
```

## When to Activate This Skill

**Decision Tree:**

```
Do you have a plan?
├─ No → Use WritingPlans skill first
└─ Yes → Are tasks independent?
    ├─ No → Execute sequentially yourself
    └─ Yes → Can tasks be done in same session?
        ├─ No → User should open separate sessions (parallel execution)
        └─ Yes → USE THIS SKILL
```

**Use this skill when:**
- ✅ You have written plan (from WritingPlans or similar)
- ✅ Tasks are independent (Task B doesn't need Task A's output)
- ✅ All tasks can be done in same session (same codebase, same context)
- ✅ You want isolated context per task (prevents confusion)
- ✅ You want mandatory review checkpoints

## Core Philosophy

**Why Fresh Subagent Per Task?**

Traditional approach: One agent does all tasks sequentially, carrying forward all context and decisions.

**Problems:**
- Context pollution: Earlier decisions affect later tasks inappropriately
- Assumption drift: Agent assumes things from earlier tasks apply to later ones
- Inconsistent quality: Agent gets tired/sloppy as session progresses
- No review: Agent reviews their own work (bias)

**Subagent-Driven Approach:** Fresh subagent for each task, two independent reviewers.

**Benefits:**
- ✅ Clean slate: Each implementer sees only their task spec
- ✅ Consistent quality: No fatigue effect across tasks
- ✅ Independent review: Reviewers haven't implemented, see with fresh eyes
- ✅ Natural TDD: Fresh context encourages test-first thinking
- ✅ Parallel potential: Tasks can be dispatched in parallel if needed

## The Process

### Step 1: Extract Tasks from Plan

**Your job as orchestrator:**

1. Read the plan document
2. Extract discrete tasks (each should be 2-5 minutes of work)
3. Verify tasks are independent
4. Create task list

**Example:**

```markdown
Plan: docs/plans/2026-02-03-user-auth.md

Tasks extracted:
1. Write test for User model validation
2. Implement User model with validation
3. Write test for login endpoint
4. Implement login endpoint
5. Write test for session management
6. Implement session management
```

### Step 2: Dispatch Implementer Subagent

**For each task:**

1. **Create implementer prompt** (use template from `reference/ImplementerPrompt.md`)
2. **Dispatch subagent** using Task tool
3. **Wait for completion** before proceeding

**Implementer Prompt Structure:**

```markdown
You are an implementation specialist executing a single task from a larger plan.

## Your Task

[Exact task description from plan]

## Context

**Full Plan:** docs/plans/2026-02-03-user-auth.md
**Your Scope:** Just this one task - nothing more, nothing less

## Before You Start

Ask clarifying questions if:
- Task spec is ambiguous
- You need to know about existing code
- You're unsure about dependencies

DO NOT make assumptions. Ask first.

## Implementation Steps

Follow this exact sequence:

1. **Implement the functionality**
   - Write the code exactly as specified
   - Follow existing patterns in codebase
   - Keep it simple (YAGNI)

2. **Write tests**
   - Test the happy path
   - Test error cases
   - Test edge cases mentioned in plan

3. **Verify locally**
   - Run the tests
   - Ensure they pass
   - Check for any warnings

4. **Commit**
   - Stage changes
   - Write clear commit message
   - Include what was implemented and tested

5. **Self-Review**
   Before reporting completion, check:
   - [ ] Did I implement exactly what was specified?
   - [ ] Did I write tests for this functionality?
   - [ ] Do all tests pass?
   - [ ] Did I follow TDD (test first, then implement)?
   - [ ] Did I avoid adding unrelated changes?
   - [ ] Is my code clean and readable?
   - [ ] Did I commit the changes?

## Reporting Completion

When done, report:

1. **What you implemented** (brief description)
2. **Test output** (paste actual test results)
3. **Commit hash** (the git commit SHA)
4. **Self-review results** (did you check all items above?)

**CRITICAL:** Include ACTUAL test output. Don't say "tests pass" - show the output.
```

**See full template:** `reference/ImplementerPrompt.md`

### Step 3: Spec Compliance Review

**After implementer reports completion:**

1. **Create spec reviewer prompt** (use template from `reference/SpecReviewerPrompt.md`)
2. **Dispatch reviewer subagent** using Task tool
3. **Wait for review results**

**Spec Reviewer Job:**

Independently verify implementer built what was requested. Critical skepticism required.

**Reviewer prompt structure:**

```markdown
You are a specification compliance reviewer.

An implementer just completed a task. Your job: verify they built exactly what was requested.

## The Original Request

[Task specification from plan]

## The Implementation

**Files changed:** [list from implementer report]
**Implementer claims:** [what they said they did]

## Your Review Process

1. **Read the spec** (the original task request)
2. **Examine the code** (independently - don't trust implementer's report)
3. **Check test output** (verify tests actually ran and passed)
4. **Compare** spec vs implementation

DO NOT assume the implementer is correct. Verify everything yourself.

## Review Categories

Check for three types of issues:

### 1. Missing Requirements

Did they skip anything from the spec?
- Unimplemented features
- Missing tests
- Skipped error handling
- Incomplete functionality

### 2. Extra/Unneeded Work

Did they add things NOT in the spec?
- Features not requested
- Over-engineering
- Premature optimization
- Scope creep

### 3. Misunderstandings

Did they misinterpret the spec?
- Wrong approach
- Incorrect logic
- Misunderstood requirements

## Output Format

**Spec Compliance: ✅ PASS** or **❌ FAIL**

If PASS:
- "Implementation matches specification exactly. Ready for code quality review."

If FAIL:
```markdown
**Missing Requirements:**
- file.ts:42 - Missing validation for email format
- tests/user.test.ts - No test for duplicate email case

**Extra Work:**
- file.ts:100-150 - Added caching layer not in spec (remove)

**Misunderstandings:**
- file.ts:25 - Used bcrypt instead of specified argon2
```

**CRITICAL:** If you find issues, cite exact file:line references.
```

**See full template:** `reference/SpecReviewerPrompt.md`

### Step 4: Code Quality Review

**Only after spec compliance passes:**

1. **Create code quality reviewer prompt** (use template from `reference/CodeQualityReviewerPrompt.md`)
2. **Dispatch reviewer subagent** using Task tool
3. **Wait for quality assessment**

**Code Quality Reviewer Job:**

Evaluate cleanliness, testing, and maintainability. This runs ONLY after spec compliance passes.

**Reviewer prompt structure:**

```markdown
You are a code quality reviewer.

An implementation has passed spec compliance review. Now evaluate code quality.

## Implementation

**Files changed:** [list]
**Purpose:** [what it does]

## Review Criteria

### 1. Code Cleanliness

- Naming (clear, descriptive)
- Structure (logical organization)
- Duplication (DRY principle)
- Complexity (simple > clever)
- Comments (explain why, not what)

### 2. Testing Quality

- Test coverage (happy path, errors, edges)
- Test clarity (readable, maintainable)
- Test independence (no shared state)
- Assertions (specific, meaningful)

### 3. Maintainability

- Error handling (comprehensive, informative)
- Edge cases (handled appropriately)
- Future changes (easy to modify)
- Documentation (inline comments where needed)

## Output Format

### Strengths

- [What was done well]

### Issues

**Critical (must fix before merge):**
- file.ts:42 - No error handling for network failure

**Important (should fix soon):**
- file.ts:100 - Complex nested logic, extract to function

**Minor (nice to have):**
- file.ts:25 - Variable name could be more descriptive

### Overall Assessment

**Quality: Excellent/Good/Acceptable/Needs Work**

[Summary paragraph]
```

**See full template:** `reference/CodeQualityReviewerPrompt.md`

### Step 5: Fix Cycles

**If either review fails:**

1. **Create fix prompt** for implementer (or new subagent)
2. **Include review feedback** verbatim
3. **Request fixes**
4. **Re-run reviews** after fixes complete

**Fix Prompt Structure:**

```markdown
The implementation needs fixes based on review feedback.

## Original Task

[Task spec]

## Review Feedback

[Paste exact feedback from reviewer]

## Your Job

Fix the issues identified. For each issue:
1. Locate the problem
2. Implement the fix
3. Update tests if needed
4. Verify fix works

Then report completion with updated test output.
```

**Repeat reviews until both pass.**

### Step 6: Mark Task Complete

**When both reviews pass:**

1. Mark task complete in your tracking
2. Move to next task
3. Dispatch new implementer subagent

**Progress Tracking Example:**

```markdown
## Task Status

✅ 1. Write test for User model validation (Commit: a1b2c3d)
✅ 2. Implement User model with validation (Commit: e4f5g6h)
🔄 3. Write test for login endpoint (In Review)
⏸️ 4. Implement login endpoint (Waiting)
⏸️ 5. Write test for session management (Waiting)
⏸️ 6. Implement session management (Waiting)
```

## Integration with Other Skills

**WritingPlans → SubagentDrivenDev:**
Create plan first, then execute with this skill.

**GitWorktrees → SubagentDrivenDev:**
Create worktree before starting subagent-driven execution.

**VerificationBeforeDone → SubagentDrivenDev:**
Each review stage uses verification principles (run tests, read output, verify).

## Best Practices

### DO:
- ✅ Extract clear, discrete tasks from plan
- ✅ Use fresh subagent per task (clean context)
- ✅ Run both review stages (spec compliance, then code quality)
- ✅ Request actual test output (not claims)
- ✅ Fix issues before moving to next task
- ✅ Track progress clearly

### DON'T:
- ❌ Skip reviews to save time (reviews catch bugs early)
- ❌ Let implementer review their own work (bias)
- ❌ Accept "tests should pass" without seeing output
- ❌ Move to next task with failing reviews
- ❌ Use same subagent for multiple tasks (context pollution)

## Why This Works

**TDD Naturally Emerges:**
- Fresh context encourages test-first thinking
- No legacy code to work around
- Clean slate per task

**Quality Stays High:**
- Independent review catches mistakes
- Two-stage review separates concerns (spec vs quality)
- Fix cycles ensure issues addressed

**Confusion Prevented:**
- Each subagent sees only their task
- No assumptions carried forward
- Clear scope boundaries

## Examples

### Example 1: Executing Authentication Plan

```
Orchestrator: "I have a plan at docs/plans/2026-02-03-user-auth.md with 6 tasks.

I'll execute using subagent-driven development:

Task 1: Write test for User model validation

[Dispatches implementer subagent with ImplementerPrompt]"

[Implementer completes task]

Orchestrator: "Implementer reports completion. Dispatching spec compliance reviewer..."

[Spec reviewer verifies implementation matches spec]

Spec Reviewer: "✅ PASS - Implementation matches specification exactly."

Orchestrator: "Spec compliance passed. Dispatching code quality reviewer..."

[Code quality reviewer evaluates cleanliness and testing]

Quality Reviewer: "Quality: Good

Strengths:
- Clear test descriptions
- Comprehensive coverage
- Good error messages

Minor issues:
- test.ts:15 - Could extract magic string to constant

Overall: Ready to merge."

Orchestrator: "✅ Task 1 complete (Commit: a1b2c3d)

Moving to Task 2: Implement User model with validation

[Dispatches new implementer subagent...]"

[Process repeats for all 6 tasks]
```

### Example 2: Review Failure and Fix Cycle

```
[After implementer completion]

Spec Reviewer: "❌ FAIL

Missing Requirements:
- user.ts:50 - No email validation (spec required regex check)
- tests/user.test.ts - Missing test for empty email case

Extra Work:
- user.ts:100-120 - Added password strength checker (not in spec - remove)

Misunderstandings:
- None"

Orchestrator: "Spec review failed. Dispatching fix request to implementer..."

[Implementer fixes issues]

Orchestrator: "Fixes complete. Re-running spec compliance review..."

Spec Reviewer: "✅ PASS - All issues resolved. Implementation matches specification."

Orchestrator: "Spec compliance passed. Dispatching code quality reviewer..."

[Quality review proceeds]
```

## Workflow Routing

When user has a plan with independent tasks, invoke this skill's process. Use the three reference templates for prompts.

---

**This skill ensures high-quality implementations through isolated context and mandatory independent review.**
