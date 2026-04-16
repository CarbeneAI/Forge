---
name: executing-plans
description: |
  Execute written implementation plans with review checkpoints and batch processing.
  USE WHEN user has a written plan to execute, OR wants to implement from docs/plans/, OR needs systematic task execution with verification gates.
  Process: Load/review plan → Execute batch (default 3 tasks) → Report → Continue → Complete. STOP when blocked - ask rather than guess.
---

# Executing Plans

Systematically execute written implementation plans with batch processing, verification checkpoints, and progress reporting.

## 🎯 Load Full CORE Context

```bash
read ${PAI_DIR}/skills/CORE/SKILL.md
```

## When to Activate This Skill

- "execute the plan at docs/plans/..." → Systematic implementation
- "implement from the plan" → Follow written specification
- "start working on the plan" → Batch execution with checkpoints
- User has written plan ready to execute

## Core Philosophy

**Plans Are Single Source of Truth**

The plan document specifies:
- What to build
- How to build it
- What order to build it
- How to verify each step

Follow the plan exactly. Don't improvise or "improve" unless explicitly discussed with user.

**Batch Execution with Checkpoints**

Execute 3 tasks (default), then STOP and report:
- What was implemented
- Verification output
- Current status

Wait for user feedback before continuing. This enables:
- Course correction if something's wrong
- User awareness of progress
- Clear stopping points
- Better debugging

**STOP When Blocked**

If you encounter ANY uncertainty:
- Missing file referenced in plan
- Unclear instruction
- Dependency issue
- Environment problem

**STOP and ASK.** Never guess or make assumptions.

## The Five-Step Process

### Step 1: Load and Review Plan

**Before starting any work:**

1. **Read the entire plan** from docs/plans/
2. **Review critically** - does it make sense?
3. **Check prerequisites** - are they met?
4. **Understand execution order** - why this sequence?
5. **Raise concerns** before starting

**Critical Questions:**

- Is the plan clear and executable?
- Are prerequisites met?
- Do file paths exist or need creation?
- Are dependencies installed?
- Is codebase state ready for this plan?

**If you find issues with the plan, STOP and report them before starting.**

**Example Review:**

```markdown
## Plan Review

**Plan:** docs/plans/2026-02-03-user-auth.md

**Checked:**
- [x] Prerequisites met (Express running, Vitest configured, bcrypt installed)
- [x] File paths make sense (src/models/, tests/, src/services/)
- [x] Task sequence logical (test-first, then implement)
- [x] Verification steps clear

**Concerns:**
- None - plan looks executable

**Ready to start:** YES

Proceeding with first batch (Tasks 1-3).
```

### Step 2: Execute Batch

**Default batch size: 3 tasks**

Execute tasks in order, following plan exactly:

1. **Mark task as in_progress**
2. **Follow the task steps** from plan
3. **Run verification commands**
4. **Capture actual output**
5. **Mark task as completed**

**For each task:**

```markdown
## Task N: [Title from plan]

**Status:** In Progress

[Follow task specification from plan]

**Verification:**
```
[Paste actual command output]
```

**Status:** ✅ Complete

**Verification Notes:**
[What the output shows - tests pass, file created, etc.]
```

**Example Batch Execution:**

```markdown
## Batch 1: Tasks 1-3

### Task 1: Write test for User model email validation

**File:** tests/user.test.ts

[Create file with code from plan]

**Verification:**
```bash
$ npm test tests/user.test.ts

FAIL tests/user.test.ts
  User model > email validation
    ✗ accepts valid email addresses
      ReferenceError: User is not defined

Test Files  1 failed (1)
     Tests  1 failed (1)
```

✅ Test created and fails as expected (TDD RED phase)

---

### Task 2: Implement User model with email validation

**File:** src/models/user.ts

[Create file with code from plan]

**Verification:**
```bash
$ npm test tests/user.test.ts

PASS tests/user.test.ts
  User model > email validation
    ✓ accepts valid email addresses (5ms)
    ✓ rejects invalid email addresses (3ms)
    ✓ rejects empty email (2ms)

Test Files  1 passed (1)
     Tests  3 passed (3)
```

✅ User model implemented, tests pass (TDD GREEN phase)

---

### Task 3: Write test for password hashing

**File:** tests/user.test.ts (add to existing)

[Add test code from plan]

**Verification:**
```bash
$ npm test tests/user.test.ts

FAIL tests/user.test.ts
  password hashing
    ✗ stores hashed password, not plaintext
      Expected passwordHash to not be 'secret123'

Test Files  1 failed (1)
     Tests  4 passed, 1 failed (5)
```

✅ Test created and fails as expected (TDD RED phase)

---

## Batch 1 Complete (Tasks 1-3)

**Implemented:**
- User model email validation (with tests)
- Password hashing test

**Tests Status:**
- Email validation: 3/3 passing ✅
- Password hashing: 0/1 passing (expected - RED phase) ⏸️

**Ready for Batch 2** (Tasks 4-6)

Proceed? Or want to review?
```

### Step 3: Report and Wait

**After each batch, report:**

1. **What was implemented** (summary)
2. **Verification output** (actual command results)
3. **Current status** (what's working, what's pending)
4. **Next batch** (what's coming next)

**Then WAIT for user response before continuing.**

User might:
- Say "continue" → Execute next batch
- Say "stop" → Pause execution
- Say "change X" → Apply modification
- Ask question → Provide clarification

**Example Report:**

```markdown
## Batch 1 Report

**Completed Tasks:**
- Task 1: User email validation test (RED phase) ✅
- Task 2: User model implementation (GREEN phase) ✅
- Task 3: Password hashing test (RED phase) ✅

**Current State:**
- Email validation working with 3 passing tests
- Password hashing test in place, ready for implementation
- User model at src/models/user.ts

**Next Batch (4-6):**
- Task 4: Implement password hashing
- Task 5: Write test for login service
- Task 6: Implement login service

Continue with Batch 2?
```

### Step 4: Apply Changes and Continue

**If user requests changes:**
- Apply the modification
- Update affected tasks
- Re-run verification
- Report changes made

**If user says continue:**
- Execute next batch (Step 2)
- Report results (Step 3)
- Wait for feedback (Step 3)

**Repeat until all tasks complete.**

### Step 5: Complete Development

**When all tasks are done:**

1. **Run full verification** (entire test suite, not just recent tests)
2. **Review against plan** (did we complete everything?)
3. **Final commit** (if not already committed per-task)
4. **Report completion**

**Example Completion Report:**

```markdown
## Implementation Complete

**Plan:** docs/plans/2026-02-03-user-auth.md

**All Tasks Completed:** 8/8 ✅

**Final Verification:**
```bash
$ npm test

PASS tests/user.test.ts
  User model
    ✓ email validation (3 tests)
    ✓ password hashing (2 tests)

PASS tests/auth.test.ts
  Auth service
    ✓ login (3 tests)
    ✓ session management (2 tests)

Test Files  2 passed (2)
     Tests  10 passed (10)
Duration  1.24s
```

**Feature Demo:**
```bash
$ curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"secret123"}'

{"sessionId":"550e8400-e29b-41d4-a716-446655440000","userId":"1"}
```

**Git Status:**
```bash
$ git log --oneline -8
a1b2c3d Implement session management
b2c3d4e Add session management tests
c3d4e5f Implement login service
d4e5f6g Add login service tests
e5f6g7h Implement password hashing
f6g7h8i Add password hashing tests
g7h8i9j Implement User model
h8i9j0k Add User model tests
```

**Plan Status:** ✅ ALL REQUIREMENTS MET

User authentication feature is complete, tested, and ready for use.
```

## Critical Rules

### DO:
- ✅ Review plan before starting
- ✅ Execute in batches (default 3 tasks)
- ✅ Report after each batch
- ✅ Wait for user feedback
- ✅ Follow plan exactly
- ✅ Provide actual verification output
- ✅ STOP when blocked or uncertain

### DON'T:
- ❌ Start without reviewing plan
- ❌ Execute entire plan without checkpoints
- ❌ Skip reporting and continue automatically
- ❌ Deviate from plan without discussing
- ❌ Claim completion without verification
- ❌ Guess when uncertain - ASK
- ❌ Make assumptions about unclear steps

## Handling Common Scenarios

### Scenario 1: Blocked by Missing File

**WRONG:**

```markdown
Task requires src/utils/crypto.ts but it doesn't exist.
I'll create a simple version...
```

**RIGHT:**

```markdown
⚠️ BLOCKED on Task 5

Task requires src/utils/crypto.ts (for hashPassword function) but file doesn't exist.

Options:
1. Should I create src/utils/crypto.ts with bcrypt hashing?
2. Is it elsewhere in the codebase? (I'll search)
3. Should we update the plan?

What would you like me to do?
```

### Scenario 2: Test Fails Unexpectedly

**WRONG:**

```markdown
Test failed, but I think it's a minor issue.
Continuing to next task...
```

**RIGHT:**

```markdown
⚠️ UNEXPECTED TEST FAILURE in Task 2

Expected test to pass (TDD GREEN phase) but got failure:

```
$ npm test tests/user.test.ts

FAIL
  ✗ accepts valid email
    Expected email@example.com, got undefined
```

This doesn't match plan expectations. Something's wrong.

Should I:
1. Debug the implementation
2. Check if test is incorrect
3. Pause and discuss

Waiting for guidance.
```

### Scenario 3: Prerequisite Not Met

**WRONG:**

```markdown
bcrypt not installed. I'll skip that part for now...
```

**RIGHT:**

```markdown
⚠️ PREREQUISITE MISSING

Plan requires bcrypt (Task 3) but it's not installed:

```bash
$ npm test
Error: Cannot find module 'bcrypt'
```

Shall I:
1. Install it now (`npm install bcrypt @types/bcrypt`)
2. Update plan to use different library
3. Something else

Waiting for confirmation before proceeding.
```

## Integration with Other Skills

**WritingPlans → ExecutingPlans:**
Create plan first, then execute it with this skill.

**ExecutingPlans → VerificationBeforeDone:**
Each task completion uses verification principles.

**ExecutingPlans → GitWorktrees:**
Execute plan within git worktree for isolation.

**ExecutingPlans → SubagentDrivenDev:**
Alternative execution approach (subagent per task vs sequential batches).

## Git Integration

### Working Branch Requirement

**NEVER start on main/master without explicit consent.**

**Before executing plan:**

```bash
# Check current branch
$ git branch

# If on main/master, create feature branch OR use git worktree
$ git checkout -b feature/user-auth
# or
$ git worktree add ../user-auth-feature feature/user-auth
```

**If plan execution starts on main/master:**

```markdown
⚠️ SAFETY CHECK

Currently on branch: main

It's dangerous to implement features directly on main.

Should I:
1. Create feature branch (git checkout -b feature/user-auth)
2. Create git worktree (isolated directory)
3. You explicitly want to work on main (are you sure?)

Waiting for confirmation.
```

### Commit Strategy

Plans can specify commit timing:

**Option 1: Commit per task**
```markdown
### Task 2: Implement User model

[... implementation ...]

**Commit:**
```bash
git add src/models/user.ts tests/user.test.ts
git commit -m "Add User model with email validation

- Implements email regex validation
- Tests for valid/invalid/empty emails
- All tests passing (TDD GREEN phase)"
```

**Option 2: Commit per batch**
```markdown
## After Batch 1 (Tasks 1-3)

**Commit all changes:**
```bash
git add .
git commit -m "Implement User model email validation

Tasks completed:
- Email validation test (Task 1)
- User model implementation (Task 2)
- Password hashing test (Task 3)

Tests: 3 passing, 1 failing (expected - RED phase)"
```

**Option 3: Final commit at end**
```markdown
## After All Tasks Complete

**Commit complete feature:**
```bash
git add .
git commit -m "Implement user authentication

Complete implementation of email/password authentication:
- User model with validation
- Password hashing
- Login service
- Session management

All tests passing (10/10)"
```

## Examples

### Example 1: Smooth Execution

```markdown
## Plan Execution: docs/plans/2026-02-03-user-auth.md

### Step 1: Plan Review

Plan looks good. Prerequisites met. Ready to start.

---

### Step 2: Batch 1 (Tasks 1-3)

[Execute tasks 1-3 with verification]

✅ Batch 1 complete

---

### Step 3: Report

Email validation implemented and tested. Password hashing test ready.

Continue with Batch 2 (Tasks 4-6)?

[User: "continue"]

---

### Step 2: Batch 2 (Tasks 4-6)

[Execute tasks 4-6 with verification]

✅ Batch 2 complete

---

### Step 3: Report

Password hashing and login service implemented.

Continue with Batch 3 (Tasks 7-8)?

[User: "continue"]

---

[... continues until complete ...]

### Step 5: Completion

All 8 tasks complete. Feature working. Tests pass (10/10).

Implementation complete! ✅
```

### Example 2: Blocked Execution

```markdown
## Plan Execution: docs/plans/2026-02-03-user-auth.md

### Step 1: Plan Review

Plan looks good. Starting Batch 1...

---

### Step 2: Batch 1 (Tasks 1-3)

**Task 1:** ✅ Complete
**Task 2:** ✅ Complete
**Task 3:** ⚠️ BLOCKED

Task 3 requires bcrypt but it's not installed.

```bash
$ npm test
Error: Cannot find module 'bcrypt'
```

⚠️ PAUSED - Prerequisite missing

Should I install bcrypt to continue?

[User: "yes, install it"]

Installing bcrypt...

```bash
$ npm install bcrypt @types/bcrypt
added 2 packages
```

Resuming Task 3...

**Task 3:** ✅ Complete

---

### Step 3: Report

Batch 1 complete (including bcrypt installation).

Continue with Batch 2?

[Execution continues...]
```

---

**This skill ensures systematic, verifiable execution of written plans with appropriate checkpoints and user visibility.**
