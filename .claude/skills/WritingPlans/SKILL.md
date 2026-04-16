---
name: writing-plans
description: |
  Structures detailed implementation plans for multi-step development work.
  USE WHEN user needs implementation plan, development roadmap, feature breakdown, OR wants to plan before implementing.
  Creates granular task lists (2-5 min each) with exact file paths, complete code, expected output. TDD, DRY, YAGNI methodology. Saves to docs/plans/.
---

# Writing Plans

Creates detailed, executable implementation plans that break complex features into granular tasks with exact specifications.

## 🎯 Load Full CORE Context

```bash
read ${PAI_DIR}/skills/CORE/SKILL.md
```

## When to Activate This Skill

- "create implementation plan for X" → Detailed task breakdown
- "plan this feature" → Step-by-step roadmap
- "how should I implement Y" → Design + plan
- "write a plan for Z" → Executable specification
- Before starting complex implementation → Planning phase

## Core Philosophy

**Granular Task Sizing: 2-5 Minutes Each**

Each task should be completable in 2-5 minutes by a skilled developer. This enables:
- Clear progress tracking
- Easy parallelization
- Minimal context switching
- Obvious verification points

**Audience: Skilled Developers Unfamiliar with Codebase**

Write plans assuming implementer:
- ✅ Knows the programming language and frameworks
- ✅ Understands software development best practices
- ❌ Doesn't know this codebase's structure
- ❌ Hasn't seen the existing code patterns
- ❌ Doesn't know where files are located

**Provide exact file paths, show existing patterns, explain integration points.**

**Methodology: TDD, DRY, YAGNI**

- **TDD (Test-Driven Development):** Write test first, implement to make it pass
- **DRY (Don't Repeat Yourself):** Reuse existing code, extract common patterns
- **YAGNI (You Ain't Gonna Need It):** Only implement what's specified, no extras

## Plan Structure

### Standard Location

```bash
docs/plans/YYYY-MM-DD-<feature-name>.md
```

**Example:**
```bash
docs/plans/2026-02-03-user-authentication.md
docs/plans/2026-02-03-email-notifications.md
```

### Mandatory Headers

Every plan must include:

```markdown
# [Feature Name] Implementation Plan

**Created:** 2026-02-03
**Status:** Ready for Implementation
**Estimated Time:** [X tasks × 2-5 min = Y-Z minutes total]

## Goal

[1-2 sentences: What are we building and why?]

## Architecture

[High-level approach: What components, how they interact, data flow]

## Tech Stack

[Languages, frameworks, libraries to use. Must match existing codebase.]

## Prerequisites

[What must exist before starting? Dependencies, setup, access required]

## Tasks

[Detailed task list - see below]

## Verification

[How to verify entire implementation is complete]

## Rollback

[How to undo if needed]
```

### Task Format

Each task should specify:

1. **Exact file path** (where to write code)
2. **Complete code** (what to write, not pseudocode)
3. **Exact commands** (what to run, with expected output)
4. **Verification** (how to confirm task complete)

**Task Template:**

```markdown
### Task N: [Verb] [specific thing]

**File:** `exact/path/to/file.ts`

**Action:** [What to do]

**Code:**
```typescript
// Complete, runnable code
// Not pseudocode or placeholders
```

**Run:**
```bash
# Exact command to execute
command --with-flags input
```

**Expected Output:**
```
[What should appear when command succeeds]
```

**Verification:**
- [ ] File created/modified at specified path
- [ ] Command runs without errors
- [ ] Output matches expected
```

## Task Granularity Examples

### Too Large (Don't Do This)

❌ **Task 1: Implement user authentication**

This is 30+ minutes of work. Too large.

### Correct Granularity (Do This)

✅ **Task 1:** Write test for User model email validation (2 min)
✅ **Task 2:** Implement User model with email validation (3 min)
✅ **Task 3:** Write test for password hashing (2 min)
✅ **Task 4:** Implement password hashing in User model (3 min)
✅ **Task 5:** Write test for login endpoint (3 min)
✅ **Task 6:** Implement login endpoint (5 min)
✅ **Task 7:** Write test for session management (3 min)
✅ **Task 8:** Implement session management (4 min)

Each task: 2-5 minutes, clear verification, exact specification.

## Methodology Application

### TDD Pattern

Every feature should follow this sequence:

1. Write test for functionality (Task N)
2. Run test - it should FAIL (verification: test fails)
3. Implement functionality (Task N+1)
4. Run test - it should PASS (verification: test passes)
5. Commit (Task N+2 or part of N+1)

**Example:**

```markdown
### Task 1: Write test for email validation

**File:** `tests/user.test.ts`

**Code:**
```typescript
describe('User model', () => {
  describe('email validation', () => {
    it('accepts valid email addresses', () => {
      const user = new User({ email: 'test@example.com' });
      expect(user.email).toBe('test@example.com');
    });

    it('rejects invalid email addresses', () => {
      expect(() => {
        new User({ email: 'invalid' });
      }).toThrow(ValidationError);
    });
  });
});
```

**Run:**
```bash
npm test tests/user.test.ts
```

**Expected Output:**
```
FAIL tests/user.test.ts
  ✗ accepts valid email addresses
    ReferenceError: User is not defined
```

**Verification:**
- [x] Test file created
- [x] Test fails (User not implemented yet)
- [x] Failure is expected (RED phase of TDD)

---

### Task 2: Implement User model with email validation

**File:** `src/models/user.ts`

**Code:**
```typescript
import { ValidationError } from '../errors';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class User {
  email: string;

  constructor({ email }: { email: string }) {
    if (!EMAIL_REGEX.test(email)) {
      throw new ValidationError(`Invalid email: ${email}`);
    }
    this.email = email;
  }
}
```

**Run:**
```bash
npm test tests/user.test.ts
```

**Expected Output:**
```
PASS tests/user.test.ts
  ✓ accepts valid email addresses (5ms)
  ✓ rejects invalid email addresses (3ms)

Test Files  1 passed (1)
     Tests  2 passed (2)
```

**Verification:**
- [x] User model created
- [x] Email validation implemented
- [x] Tests pass (GREEN phase of TDD)
```

### DRY Pattern

When similar code exists, reference it and reuse.

**Example:**

```markdown
### Task 5: Implement password hashing

**File:** `src/models/user.ts`

**Important:** Reuse existing `hashPassword` utility from `src/utils/crypto.ts`

**Code:**
```typescript
import { hashPassword } from '../utils/crypto';

export class User {
  email: string;
  passwordHash: string;

  constructor({ email, password }: { email: string; password: string }) {
    // ... email validation from previous task ...

    // Reuse existing hashing utility (DRY)
    this.passwordHash = hashPassword(password);
  }
}
```

**Verification:**
- [x] Uses existing hashPassword utility (not reimplemented)
- [x] No duplication of crypto logic
```

### YAGNI Pattern

Only implement what's specified. No extras.

**Example:**

```markdown
### Task 7: Implement session management

**Scope:** Basic in-memory session storage only.

**DO NOT implement:**
- ❌ Redis session store (not needed yet)
- ❌ Session expiration (not in requirements)
- ❌ Multi-device session tracking (YAGNI)

**File:** `src/services/session.ts`

**Code:**
```typescript
// Simple in-memory session store
// Redis integration can be added later if needed

const sessions = new Map<string, { userId: string; createdAt: Date }>();

export function createSession(userId: string): string {
  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, { userId, createdAt: new Date() });
  return sessionId;
}

export function getSession(sessionId: string) {
  return sessions.get(sessionId);
}
```

**Verification:**
- [x] Implements only what's specified
- [x] No extra features added
- [x] Can be extended later if needed
```

## Execution Options

Plans can be executed two ways:

### Option 1: Subagent-Driven (Same Session)

Use SubagentDrivenDev skill to execute tasks with fresh subagent per task.

**When to use:**
- Tasks are independent
- Can be done in single session
- Want isolated context per task

**How:**
```markdown
## Execution

Execute using SubagentDrivenDev skill:
1. Dispatch implementer for each task
2. Spec compliance review after each task
3. Code quality review after spec passes
4. Fix cycles as needed
5. Mark task complete when reviews pass
```

### Option 2: Parallel Sessions

User opens multiple Claude Code sessions, each doing different tasks.

**When to use:**
- Tasks can run in parallel
- Want maximum speed
- Have multiple terminal windows

**How:**
```markdown
## Execution

Parallel execution in separate sessions:
1. Session A: Tasks 1-3 (User model)
2. Session B: Tasks 4-6 (Login endpoint)
3. Session C: Tasks 7-9 (Session management)

All sessions work from same plan, different tasks.
```

## Complete Plan Example

```markdown
# User Authentication Implementation Plan

**Created:** 2026-02-03
**Status:** Ready for Implementation
**Estimated Time:** 8 tasks × 2-5 min = 16-40 minutes total

## Goal

Implement basic user authentication with email/password, allowing users to create accounts and log in. Sessions stored in memory.

## Architecture

**Components:**
- User model (email validation, password hashing)
- Auth service (login, logout)
- Session store (in-memory Map)
- Login endpoint (POST /api/login)

**Data Flow:**
1. User submits email + password
2. Validate email format
3. Hash password with bcrypt
4. Create session
5. Return session token

## Tech Stack

- TypeScript
- Express.js (existing)
- bcrypt (for password hashing)
- Vitest (for testing)

## Prerequisites

- [ ] Express server running
- [ ] Vitest configured
- [ ] bcrypt installed (`npm install bcrypt @types/bcrypt`)

## Tasks

### Task 1: Write test for User model email validation

**File:** `tests/user.test.ts`

**Code:**
```typescript
import { describe, it, expect } from 'vitest';
import { User } from '../src/models/user';
import { ValidationError } from '../src/errors';

describe('User model', () => {
  describe('email validation', () => {
    it('accepts valid email addresses', () => {
      const user = new User({ email: 'test@example.com', password: 'secret123' });
      expect(user.email).toBe('test@example.com');
    });

    it('rejects invalid email addresses', () => {
      expect(() => {
        new User({ email: 'invalid', password: 'secret123' });
      }).toThrow(ValidationError);
    });

    it('rejects empty email', () => {
      expect(() => {
        new User({ email: '', password: 'secret123' });
      }).toThrow(ValidationError);
    });
  });
});
```

**Run:**
```bash
npm test tests/user.test.ts
```

**Expected Output:**
```
FAIL tests/user.test.ts
  User model > email validation
    ✗ accepts valid email addresses
      ReferenceError: User is not defined
```

**Verification:**
- [x] Test file created
- [x] Test fails (TDD RED phase)
- [x] Failure reason: User not defined yet

---

### Task 2: Implement User model with email validation

**File:** `src/models/user.ts`

**Code:**
```typescript
import { ValidationError } from '../errors';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class User {
  email: string;
  passwordHash: string;

  constructor({ email, password }: { email: string; password: string }) {
    // Validate email format
    if (!email || !EMAIL_REGEX.test(email)) {
      throw new ValidationError(`Invalid email: ${email}`);
    }

    this.email = email;
    this.passwordHash = password; // Temporary - will hash in next task
  }
}
```

**Run:**
```bash
npm test tests/user.test.ts
```

**Expected Output:**
```
PASS tests/user.test.ts
  User model > email validation
    ✓ accepts valid email addresses (5ms)
    ✓ rejects invalid email addresses (3ms)
    ✓ rejects empty email (2ms)

Test Files  1 passed (1)
     Tests  3 passed (3)
```

**Verification:**
- [x] User model created
- [x] Email validation working
- [x] Tests pass (TDD GREEN phase)

---

### Task 3: Write test for password hashing

**File:** `tests/user.test.ts`

**Code to add:**
```typescript
describe('password hashing', () => {
  it('stores hashed password, not plaintext', async () => {
    const user = new User({ email: 'test@example.com', password: 'secret123' });
    expect(user.passwordHash).not.toBe('secret123');
    expect(user.passwordHash).toMatch(/^\$2[aby]\$/); // bcrypt format
  });

  it('generates different hashes for same password', async () => {
    const user1 = new User({ email: 'test1@example.com', password: 'secret' });
    const user2 = new User({ email: 'test2@example.com', password: 'secret' });
    expect(user1.passwordHash).not.toBe(user2.passwordHash);
  });
});
```

**Run:**
```bash
npm test tests/user.test.ts
```

**Expected Output:**
```
FAIL tests/user.test.ts
  password hashing
    ✗ stores hashed password, not plaintext
      Expected passwordHash to not be 'secret123', but it was
```

**Verification:**
- [x] Test added
- [x] Test fails (password not hashed yet - RED phase)

---

[Continue with remaining tasks following same pattern...]

## Verification

All tasks complete when:
- [ ] All tests pass (`npm test`)
- [ ] User can create account (demo in curl)
- [ ] User can log in (demo in curl)
- [ ] Session persists across requests
- [ ] Code committed to git

## Rollback

If implementation needs to be reverted:
```bash
git revert HEAD~8  # Revert last 8 commits (one per task)
```
```

## Integration with Other Skills

**Brainstorming → WritingPlans:**
After design is finalized, create detailed implementation plan.

**WritingPlans → SubagentDrivenDev:**
Execute plan with fresh subagent per task.

**WritingPlans → GitWorktrees:**
Create worktree before executing plan.

**WritingPlans → ExecutingPlans:**
Load plan and execute tasks systematically.

## Best Practices

### DO:
- ✅ Break tasks into 2-5 minute chunks
- ✅ Provide exact file paths
- ✅ Include complete, runnable code
- ✅ Specify exact commands with expected output
- ✅ Follow TDD (test first, then implement)
- ✅ Apply DRY (reuse existing code)
- ✅ Apply YAGNI (no extra features)
- ✅ Save to docs/plans/YYYY-MM-DD-feature.md

### DON'T:
- ❌ Create giant tasks (30+ minutes)
- ❌ Use vague file paths ("the user file")
- ❌ Write pseudocode instead of real code
- ❌ Skip expected output for commands
- ❌ Implement before writing tests
- ❌ Duplicate existing code
- ❌ Add features not in requirements

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Tasks too large | Can't track progress | Break into 2-5 min chunks |
| Vague file paths | Implementer doesn't know where to write | Exact paths: `src/models/user.ts` |
| Pseudocode | Can't copy-paste into implementation | Complete, runnable code |
| No expected output | Can't verify completion | Show what success looks like |
| Implement first | Skips TDD RED phase | Write failing test first |
| Reimplements existing | Code duplication | Reference and reuse existing |
| Scope creep | Feature bloat | Stick to requirements (YAGNI) |

---

**This skill creates executable plans that transform designs into shipped features through granular, verifiable tasks.**
