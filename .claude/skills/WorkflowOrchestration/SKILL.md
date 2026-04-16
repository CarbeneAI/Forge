---
name: workflow-orchestration
description: Development workflow methodology enforcing plan-first execution, subagent strategy, self-improvement loops, verification gates, and elegant solutions. USE WHEN developing applications, writing code, implementing features, fixing bugs, building systems, OR when user mentions workflow, development process, coding methodology, plan first, OR at the start of any non-trivial implementation task.
license: MIT
metadata:
  version: 1.0.0
  author: CarbeneAI
  category: development-methodology
  domain: software-engineering
  updated: 2026-02-03
---

# WorkflowOrchestration - Development Excellence Methodology

**Auto-loaded for development work.** This skill enforces rigorous development methodology that eliminates common failure modes and maximizes code quality.

## Core Philosophy

High-quality software comes from disciplined process, not heroic effort. This methodology prevents the most common development failures:
- Starting implementation before understanding the problem (Plan Mode Default)
- Thrashing in a broken state instead of re-planning (Stop & Re-plan)
- Working in a cluttered context window (Subagent Strategy)
- Repeating the same mistakes (Self-Improvement Loop)
- Claiming completion without proof (Verification Before Done)
- Accepting hacky solutions when elegant ones exist (Demand Elegance)
- Waiting for hand-holding on obvious fixes (Autonomous Bug Fixing)

---

## 1. Plan Mode Default

**CRITICAL: Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)**

### When to Plan

Enter plan mode when ANY of these are true:
- Task requires 3+ distinct steps
- Architectural decisions need to be made
- Multiple files/components will be affected
- User says "plan first" or requests a plan
- You're not 100% certain about the approach
- **Something went sideways** (stop immediately, don't push forward)

### Planning Process

```bash
# 1. Write detailed plan to task file
# Location: ~/Nextcloud/PAI/tasks/todo.md

# 2. Plan structure (required sections):
# - OBJECTIVE: What are we building/fixing?
# - CONTEXT: What's the current state?
# - CONSTRAINTS: What limitations exist?
# - APPROACH: High-level strategy
# - STEPS: Numbered checklist items [ ]
# - VERIFICATION: How will we prove it works?
# - ROLLBACK: How to undo if things break?

# 3. Check in with user BEFORE starting implementation
# Present the plan, wait for approval

# 4. Track progress as you work
# Mark items complete: [x] in todo.md

# 5. Explain changes at each step
# Add high-level summary after each major step

# 6. Document results
# Add REVIEW section to todo.md with:
# - What worked
# - What didn't
# - Lessons learned
# - Final verification results
```

### Plan Template

```markdown
# [Task Name] - [Date]

## OBJECTIVE
[One-sentence description of what we're building/fixing]

## CONTEXT
- Current state: [Describe what exists now]
- Problem: [What's broken or missing?]
- Impact: [Why does this matter?]

## CONSTRAINTS
- Technical: [Language versions, dependencies, APIs]
- Business: [Deadlines, requirements, must-haves]
- Resources: [Time, compute, external services]

## APPROACH
[High-level strategy in 2-4 sentences]

## STEPS
- [ ] Step 1: [Specific, measurable action]
- [ ] Step 2: [Specific, measurable action]
- [ ] Step 3: [Specific, measurable action]
[Continue as needed...]

## VERIFICATION
- [ ] Verification 1: [How to prove step 1 works]
- [ ] Verification 2: [How to prove step 2 works]
- [ ] Final check: [End-to-end verification]

## ROLLBACK
[How to undo changes if this breaks production]

---

## REVIEW (Added after completion)
### What Worked
- [Successful approach 1]
- [Successful approach 2]

### What Didn't
- [Challenge 1 and how it was resolved]
- [Challenge 2 and how it was resolved]

### Lessons Learned
- [Key insight 1]
- [Key insight 2]

### Final Verification
- [Verification result 1]
- [Verification result 2]
```

### Stop & Re-plan Protocol

**If something goes sideways: STOP immediately, don't keep pushing.**

Signs you need to re-plan:
- Error messages you don't understand
- "Quick fix" didn't work after 2 attempts
- Implementation is getting messy/hacky
- You're deviating significantly from the original plan
- Tests are failing in unexpected ways
- You're making assumptions without verification

**Re-planning process:**
1. STOP what you're doing
2. Document what went wrong in todo.md
3. Analyze root cause
4. Write new plan addressing the issue
5. Get user approval before continuing

---

## 2. Subagent Strategy

**Use subagents liberally to keep main context window clean and maximize parallelism.**

### When to Use Subagents

| Task Type | Use Subagent? | Model | Why |
|-----------|---------------|-------|-----|
| Research/investigation | YES | haiku/sonnet | Keeps findings isolated |
| File exploration | YES | haiku | Fast, simple task |
| Parallel analysis | YES | haiku/sonnet | Run multiple in parallel |
| Testing/verification | YES | haiku | Quick checks |
| Writing code | NO | N/A | Keep in main context |
| Building features | NO | N/A | Keep in main context |
| Architectural decisions | NO | opus | Need full context |

### Subagent Best Practices

**One task per subagent:**
```typescript
// GOOD - Focused, single purpose
Task({
  prompt: "Read auth.ts and list all exported functions with their signatures",
  subagent_type: "intern",
  model: "haiku"
})

// BAD - Multiple tasks, unclear scope
Task({
  prompt: "Look at the auth system and figure out what's wrong and maybe check the database too",
  subagent_type: "intern"
})
```

**Model Selection (CRITICAL FOR SPEED):**
- **haiku** - Grunt work, file reading, simple checks (10-20x faster)
- **sonnet** - Research, implementation, standard coding
- **opus** - Deep reasoning, complex architecture, strategic decisions

**Launch in parallel:**
```typescript
// GOOD - All in one message, run in parallel
Task({ prompt: "Research authentication patterns", model: "sonnet", subagent_type: "intern" })
Task({ prompt: "Analyze database schema", model: "haiku", subagent_type: "intern" })
Task({ prompt: "Review security best practices", model: "sonnet", subagent_type: "intern" })

// BAD - Sequential, wastes time
Task({ prompt: "Research authentication patterns", model: "sonnet", subagent_type: "intern" })
// Wait for response...
// Then launch next one... (SLOW)
```

**Always spotcheck after parallel work:**
After subagents complete, launch ONE verification intern to cross-check their work:
```typescript
Task({
  prompt: "Review the findings from the 3 research interns above. Check for contradictions, gaps, or errors.",
  model: "sonnet",
  subagent_type: "intern"
})
```

### Throw More Compute at Complex Problems

Don't struggle alone. For complex problems:
- Launch 3-5 interns with different angles
- Have them research in parallel
- Synthesize their findings
- Make informed decision with full context

**Example: Debugging a complex issue**
```typescript
Task({ prompt: "Analyze error logs for authentication failures", model: "haiku", subagent_type: "intern" })
Task({ prompt: "Check database connection configuration", model: "haiku", subagent_type: "intern" })
Task({ prompt: "Review recent code changes to auth system", model: "haiku", subagent_type: "intern" })
Task({ prompt: "Search for similar issues in GitHub/Stack Overflow", model: "sonnet", subagent_type: "intern" })
```

---

## 3. Self-Improvement Loop

**After ANY correction from the user: capture the pattern to prevent recurrence.**

### When to Update Lessons

Update `~/Nextcloud/PAI/tasks/lessons.md` whenever:
- User corrects an error you made
- You make the same mistake twice
- User says "don't do that" or "always do this"
- You discover a better approach after implementation
- User provides feedback on code quality/style
- You misunderstand a requirement

### Lesson Entry Format

See `reference/LessonsTemplate.md` for detailed format. Quick structure:

```markdown
## [Date] - [Brief Title]

**MISTAKE:** [What you did wrong - be specific]

**WHY IT HAPPENED:** [Root cause analysis]

**CORRECT APPROACH:** [What you should have done]

**RULE FOR NEXT TIME:**
- [Specific, actionable rule 1]
- [Specific, actionable rule 2]

**TRIGGER:** [When to remember this - what scenario activates this lesson?]

**TAGS:** #category #technology #pattern
```

### Review Lessons at Session Start

**CRITICAL: Review lessons.md at the start of any relevant project session.**

When starting work:
1. Read `~/Nextcloud/PAI/tasks/lessons.md`
2. Scan for lessons tagged with current project/technology
3. Keep those rules in mind during implementation
4. Reference specific lessons if similar situation arises

### Iterate Ruthlessly

The goal: **mistake rate drops to near-zero over time.**

- Review patterns weekly
- Consolidate duplicate lessons
- Refine rules based on new corrections
- Delete obsolete lessons (technology changed, no longer relevant)

---

## 4. Verification Before Done

**NEVER mark a task complete without proving it works. Zero exceptions.**

### Verification Requirements

Before claiming ANY task is complete:

**For Code Changes:**
- [ ] Run the code and show output
- [ ] Run tests (unit, integration, e2e as applicable)
- [ ] Check logs for errors/warnings
- [ ] Diff behavior: main vs. your changes
- [ ] Verify edge cases work correctly

**For Bug Fixes:**
- [ ] Reproduce the original bug
- [ ] Show the bug is fixed
- [ ] Run regression tests
- [ ] Check for side effects
- [ ] Document the fix

**For New Features:**
- [ ] Demo the feature working
- [ ] Show test coverage
- [ ] Verify performance is acceptable
- [ ] Check security implications
- [ ] Document usage

### Verification Checklist

Ask yourself these questions before marking complete:

1. **Would a staff engineer approve this?**
   - Code quality acceptable?
   - Tests comprehensive?
   - Documentation clear?

2. **Can I prove it works RIGHT NOW?**
   - Fresh verification evidence (not from earlier)
   - Actual output/logs/screenshots
   - Test results passing

3. **What could break?**
   - Edge cases handled?
   - Error handling in place?
   - Rollback plan exists?

4. **Is it production-ready?**
   - No console.log() or debug statements
   - No TODO comments for critical functionality
   - No security vulnerabilities

### Fresh Verification Evidence Required

**NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE**

"Fresh" means:
- Generated in the current session
- After the latest code change
- Shows the final state, not intermediate

"Evidence" means:
- Command output (test results, build logs)
- Screenshots of working feature
- Curl/API responses
- Diff showing behavior change
- Log entries confirming success

**Examples:**

GOOD verification:
```bash
# Run tests NOW
npm test

# Output shows:
# ✓ auth.test.ts (5 tests passing)
# ✓ database.test.ts (12 tests passing)
# Test Suites: 2 passed, 2 total
# Tests: 17 passed, 17 total

# Show feature working
curl http://localhost:3000/api/auth/login -d '{"email":"test@example.com","password":"test123"}'
# {"token":"eyJ...","user":{"id":1,"email":"test@example.com"}}
```

BAD verification:
```
"I think it should work now" ❌
"The tests passed earlier" ❌
"I verified it in my head" ❌
```

---

## 5. Demand Elegance (Balanced)

**For non-trivial changes: pause and ask "is there a more elegant way?"**

### When to Demand Elegance

**DO demand elegance when:**
- Fix feels hacky or brittle
- Code is getting messy/complex
- You're adding workarounds for workarounds
- Duplication is creeping in
- Future maintainability is questionable
- **After implementing: "Knowing everything I know now, what's the elegant solution?"**

**DON'T over-engineer when:**
- Fix is simple and obvious
- Code is already clean
- Time constraints are critical
- It's a temporary workaround (with clear TODO)
- Elegance adds complexity without benefit

### Elegance Triggers

Pause and reconsider if you find yourself:
- Copy-pasting code blocks
- Adding if/else chains longer than 3 levels
- Passing 5+ parameters to a function
- Using global variables to avoid proper state management
- Writing code you'll be afraid to touch later

### Elegance Evaluation Framework

Before implementing, ask:

1. **Simplicity:** Is this the simplest solution that could work?
2. **Readability:** Will future me understand this in 6 months?
3. **Maintainability:** How hard is it to change later?
4. **Testability:** Can I easily write tests for this?
5. **Performance:** Is this reasonably efficient?
6. **Security:** Are there obvious vulnerabilities?

### "Knowing Everything I Know Now" Pattern

**POWERFUL TECHNIQUE:** After implementing something that feels suboptimal:

1. Stop and reflect on what you learned during implementation
2. Ask: "If I started over with this knowledge, what would I do differently?"
3. If the answer is significantly better: **do it**
4. Refactor to the elegant solution while it's fresh

**Example:**

Initial approach (works but hacky):
```typescript
// Messy: Nested callbacks, error handling scattered
function fetchUserData(userId) {
  fetch(`/api/users/${userId}`)
    .then(res => res.json())
    .then(user => {
      fetch(`/api/posts/${user.id}`)
        .then(res => res.json())
        .then(posts => {
          // Do something with user and posts
        })
        .catch(err => console.error(err))
    })
    .catch(err => console.error(err))
}
```

Elegant approach (knowing everything now):
```typescript
// Clean: async/await, clear error handling, composable
async function fetchUserData(userId: string): Promise<UserWithPosts> {
  const user = await fetchUser(userId)
  const posts = await fetchUserPosts(user.id)
  return { user, posts }
}

async function fetchUser(userId: string): Promise<User> {
  const response = await fetch(`/api/users/${userId}`)
  if (!response.ok) throw new Error(`Failed to fetch user: ${response.statusText}`)
  return response.json()
}

async function fetchUserPosts(userId: string): Promise<Post[]> {
  const response = await fetch(`/api/posts/${userId}`)
  if (!response.ok) throw new Error(`Failed to fetch posts: ${response.statusText}`)
  return response.json()
}
```

### Balance: Don't Over-Engineer Simple Fixes

**Simple fix that's fine as-is:**
```typescript
// This is fine - no need to over-engineer
function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
```

**Over-engineered version (DON'T DO THIS):**
```typescript
// Too much for a simple task
class StringTransformer {
  private strategy: TransformStrategy

  constructor(strategy: TransformStrategy) {
    this.strategy = strategy
  }

  transform(input: string): string {
    return this.strategy.execute(input)
  }
}

interface TransformStrategy {
  execute(input: string): string
}

class CapitalizeFirstLetterStrategy implements TransformStrategy {
  execute(input: string): string {
    return input.charAt(0).toUpperCase() + input.slice(1)
  }
}
```

---

## 6. Autonomous Bug Fixing

**When given a bug report: just fix it. Don't ask for hand-holding.**

### Autonomous Debugging Process

**You have everything you need to fix most bugs. Act like it.**

1. **Understand the bug**
   - Read error message/stack trace
   - Identify affected component
   - Reproduce if possible

2. **Locate the code**
   - Use grep/ripgrep to find relevant files
   - Read the code around the error
   - Understand the context

3. **Identify root cause**
   - Don't just fix symptoms
   - Find WHY it's broken
   - Check for related issues

4. **Implement fix**
   - Make minimal changes
   - Follow existing patterns
   - Add tests if missing

5. **Verify fix**
   - Reproduce bug, show it's fixed
   - Run tests
   - Check for regressions

6. **Document**
   - Add comment explaining fix
   - Update lessons.md if applicable
   - Note in commit message

### Zero Context Switching from User

**The user should NEVER have to:**
- Point you to the exact file
- Explain the error message
- Tell you how to run tests
- Guide you through debugging steps
- Hold your hand through the fix

**You should ALWAYS:**
- Find the files yourself (grep, file structure)
- Read error logs yourself
- Figure out how to run tests (package.json, Makefile, README)
- Trace through the code yourself
- Propose AND implement the fix

### Example: Autonomous Bug Fix

**User says:** "The login endpoint is returning 500 errors"

**YOU DO (autonomously):**

```bash
# 1. Find relevant files
rg -l "login" --type ts

# 2. Check error logs
tail -100 logs/app.log | rg -i error

# 3. Read the login endpoint code
# (Use Read tool on auth.ts or similar)

# 4. Identify the issue
# Example: Missing null check on user object

# 5. Implement fix
# (Use Edit tool to add proper error handling)

# 6. Verify fix
# Run tests, curl the endpoint, check logs

# 7. Report to user
"Fixed: Login endpoint was missing null check on user lookup.
Added proper error handling and validation.

Changes:
- Added null check before token generation
- Return 401 for invalid credentials instead of 500
- Added test coverage for this case

Verification:
✓ Tests passing (auth.test.ts)
✓ Endpoint returns proper 401 for invalid creds
✓ No more 500 errors in logs"
```

### Common Bug Categories to Handle Autonomously

| Bug Type | What You Should Do |
|----------|-------------------|
| **Failing tests** | Read test output, find failing line, fix code, verify |
| **500 errors** | Check logs, find stack trace, identify error, fix root cause |
| **Type errors** | Read TypeScript error, add types/fix signatures |
| **Null/undefined** | Add null checks, optional chaining, proper validation |
| **Import errors** | Check file paths, fix imports, verify exports |
| **CI failures** | Read CI logs, reproduce locally, fix, push |

### When to Ask for Help

**Only ask the user when:**
- Bug requires domain knowledge you don't have
- Multiple valid fix approaches exist (architectural decision)
- Fix will impact public API or user-facing behavior
- You've tried 3 different approaches and all failed
- Security implications are unclear

**DON'T ask when:**
- You can figure it out by reading code/docs
- Error message is self-explanatory
- Fix is obvious once you locate the file
- It's a standard debugging task

---

## Core Principles

### Simplicity First
- Make every change as simple as possible
- Impact minimal code
- Avoid unnecessary abstraction
- Don't add features not requested
- YAGNI (You Aren't Gonna Need It)

### No Laziness
- Find root causes, not symptoms
- No temporary fixes without TODO and plan
- Senior developer standards always
- Every file you touch should be better than you found it
- No "good enough for now" code

### Minimal Impact
- Changes touch only necessary code
- Avoid introducing bugs in unrelated areas
- Respect existing patterns and conventions
- Don't rewrite working code without reason
- Surgical precision, not bulldozer approach

---

## Task Management Flow

### Visual Flowchart

```
┌─────────────────────────────────────────────────────────────┐
│ 1. PLAN FIRST                                               │
│    Write plan to ~/Nextcloud/PAI/tasks/todo.md             │
│    Include: Objective, Context, Steps, Verification        │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. VERIFY PLAN                                              │
│    Present plan to user                                     │
│    Wait for approval before starting                        │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. TRACK PROGRESS                                           │
│    Mark checklist items [x] as you complete them           │
│    Update todo.md with current status                       │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. EXPLAIN CHANGES                                          │
│    Add high-level summary after each major step            │
│    Document decisions and rationale                         │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. VERIFY COMPLETION                                        │
│    Run tests, check logs, demonstrate correctness          │
│    NO COMPLETION WITHOUT FRESH VERIFICATION EVIDENCE        │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. DOCUMENT RESULTS                                         │
│    Add REVIEW section to todo.md                            │
│    What worked, what didn't, lessons learned               │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. CAPTURE LESSONS                                          │
│    If user corrected anything:                              │
│    Update ~/Nextcloud/PAI/tasks/lessons.md                  │
│    Write rule to prevent recurrence                         │
└─────────────────────────────────────────────────────────────┘
```

### Step-by-Step Process

**1. Plan First**
- Location: `~/Nextcloud/PAI/tasks/todo.md`
- Required sections: Objective, Context, Constraints, Approach, Steps, Verification, Rollback
- Use checklist format `- [ ]` for all action items

**2. Verify Plan**
- Present complete plan to user
- Wait for explicit approval
- Address any concerns before starting
- Don't start implementation until user says "go"

**3. Track Progress**
- Mark items complete: `- [x]` in todo.md
- Update file after completing each major step
- Keep user informed of progress
- Flag blockers immediately

**4. Explain Changes**
- Add summary after each major milestone
- Document WHY decisions were made
- Explain tradeoffs considered
- Note any deviations from plan

**5. Verify Completion**
- Run all tests and show results
- Check logs for errors
- Demonstrate feature working
- Provide fresh verification evidence

**6. Document Results**
- Add REVIEW section to todo.md
- List what worked well
- Document challenges encountered
- Capture lessons learned
- Include final verification results

**7. Capture Lessons**
- If user made corrections: update lessons.md
- Write specific, actionable rules
- Tag for easy reference later
- Review periodically to improve

---

## Integration with PAI

### Auto-Loading

This skill should be loaded automatically for development work by:
1. SessionStart hook (if development context detected)
2. Manual invocation when starting development tasks
3. Reference when user mentions workflow/methodology

### File Locations

| File | Location | Purpose |
|------|----------|---------|
| **Todo** | `~/Nextcloud/PAI/tasks/todo.md` | Current task planning and tracking |
| **Lessons** | `~/Nextcloud/PAI/tasks/lessons.md` | Self-improvement knowledge base |
| **Decision Tree** | `reference/DecisionTree.md` | When to use each methodology component |
| **Template** | `reference/LessonsTemplate.md` | Format for lessons entries |

### Relationship to Other Skills

| Skill | Relationship |
|-------|--------------|
| **CORE** | WorkflowOrchestration extends CORE principles |
| **SubagentDrivenDev** | Use together for parallel development |
| **VerificationBeforeDone** | Detailed verification methodology |
| **WritingPlans** | Plan format and structure guidance |
| **ExecutingPlans** | Plan execution and tracking |

---

## Quick Reference

### Decision Matrix

| Scenario | Action |
|----------|--------|
| Task has 3+ steps | Enter plan mode |
| Something went wrong | Stop, re-plan |
| Need to research | Launch subagent (haiku/sonnet) |
| Need to test | Launch verification subagent (haiku) |
| User corrects error | Update lessons.md |
| Ready to mark complete | Verify with fresh evidence |
| Fix feels hacky | Ask "is there an elegant way?" |
| Bug reported | Fix autonomously |

### Key Files

```bash
# Current task plan
~/Nextcloud/PAI/tasks/todo.md

# Lessons learned
~/Nextcloud/PAI/tasks/lessons.md

# Decision guidance
${PAI_DIR}/skills/WorkflowOrchestration/reference/DecisionTree.md

# Lesson template
${PAI_DIR}/skills/WorkflowOrchestration/reference/LessonsTemplate.md
```

### Verification Checklist

Before marking ANY task complete:
- [ ] Code runs without errors
- [ ] Tests pass (unit, integration, e2e)
- [ ] Logs show no warnings/errors
- [ ] Feature demonstrated working
- [ ] Edge cases handled
- [ ] Documentation updated
- [ ] Fresh verification evidence provided

---

**Remember: High-quality software comes from disciplined process, not heroic effort.**
