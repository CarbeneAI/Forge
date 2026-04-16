# Lessons Template

**Format guide for entries in `~/Nextcloud/PAI/tasks/lessons.md`**

This template ensures consistent, searchable, actionable lesson entries that build institutional knowledge and prevent recurring mistakes.

---

## Standard Lesson Entry Format

```markdown
## [YYYY-MM-DD] - [Brief Title - 3-6 words]

**MISTAKE:** [Specific description of what went wrong - be concrete and detailed]

**WHY IT HAPPENED:** [Root cause analysis - dig deep, avoid surface explanations]

**CORRECT APPROACH:** [What should have been done - specific, actionable]

**RULE FOR NEXT TIME:**
- [Actionable rule 1 - specific trigger and action]
- [Actionable rule 2 - specific trigger and action]
- [Actionable rule 3 if needed]

**TRIGGER:** [When to remember this - scenario that activates this lesson]

**TAGS:** #category #technology #pattern #domain
```

---

## Field-by-Field Guide

### DATE - [YYYY-MM-DD]
- ISO format for easy sorting
- Today's date when lesson is learned
- Example: `2026-02-03`

### TITLE - [Brief descriptive title]
- 3-6 words maximum
- Describes the core mistake or lesson
- Scannable at a glance
- Examples:
  - "Missing null check in auth"
  - "Forgot to run tests first"
  - "Used wrong package manager"
  - "Skipped plan mode for complex task"

### MISTAKE - [What went wrong]
- **Be specific:** Don't say "I made an error in the code"
- **Include context:** What were you trying to do?
- **Show the error:** Include relevant code/command if helpful
- **Be honest:** No defensive language, own the mistake

**Good examples:**
```
MISTAKE: I implemented user authentication without validating email format.
Accepted emails like "user@", causing downstream database errors when trying
to send verification emails.

MISTAKE: I used `npm install` instead of `bun install` in the PAI directory,
creating a node_modules folder and package-lock.json that conflicted with the
existing bun.lockb.

MISTAKE: I started implementing the payment processor without writing a plan,
resulting in having to redo work three times as I discovered requirements I
missed.
```

**Bad examples:**
```
MISTAKE: Had an error ❌ (too vague)
MISTAKE: The code didn't work ❌ (no specifics)
MISTAKE: User corrected me ❌ (doesn't explain what)
```

### WHY IT HAPPENED - [Root cause]
- **Dig deeper than surface causes**
- Ask "why" 3-5 times to find root cause
- Identify the thought pattern or gap in knowledge
- Consider: Was it a knowledge gap? Rushed work? Wrong assumption?

**Good examples:**
```
WHY IT HAPPENED: I assumed email validation was handled by the form library,
without checking the library documentation. I made an assumption without
verification.

WHY IT HAPPENED: I forgot that PAI uses Bun exclusively, not npm. I fell
back to muscle memory from other projects instead of checking the project's
package manager configuration.

WHY IT HAPPENED: The task seemed simple at first glance, so I skipped plan
mode. I didn't recognize that "simple" tasks often have hidden complexity
that only becomes apparent during implementation.
```

**Bad examples:**
```
WHY IT HAPPENED: I made a mistake ❌ (circular, not helpful)
WHY IT HAPPENED: User said it was wrong ❌ (not root cause)
WHY IT HAPPENED: Bad luck ❌ (externalized, not analyzing own process)
```

### CORRECT APPROACH - [What should have been done]
- **Specific steps:** Not just "do better"
- **Actionable:** Something you can actually follow
- **Complete:** Enough detail to execute correctly next time

**Good examples:**
```
CORRECT APPROACH:
1. Check the form library documentation for built-in validation
2. If no built-in validation, add explicit email regex validation
3. Add test cases for valid and invalid email formats
4. Verify validation in both client and server code

CORRECT APPROACH:
1. Before running any package manager command, check for existing lockfiles
2. In PAI directory: always use `bun` (check for bun.lockb)
3. In other projects: check package.json -> packageManager field
4. When in doubt: `ls -la | grep -E "(package-lock|yarn.lock|bun.lockb)"`

CORRECT APPROACH:
1. Evaluate task complexity before starting (use 3+ steps as threshold)
2. If task has architectural implications, always enter plan mode
3. Write plan to ~/Nextcloud/PAI/tasks/todo.md
4. Get user approval before implementation
5. Track progress against the plan
```

**Bad examples:**
```
CORRECT APPROACH: Don't make that mistake again ❌ (not specific)
CORRECT APPROACH: Be more careful ❌ (vague, not actionable)
CORRECT APPROACH: Just do it right ❌ (circular, not helpful)
```

### RULE FOR NEXT TIME - [Actionable rules]
- **Imperative form:** "Always X", "Never Y", "Before Z, do A"
- **Specific triggers:** Clear conditions when rule applies
- **2-4 rules:** Most important preventive measures
- **Testable:** You can verify whether you followed the rule

**Good examples:**
```
RULE FOR NEXT TIME:
- ALWAYS validate user input on both client and server, never trust client alone
- BEFORE accepting input, check format with regex or validation library
- AFTER adding validation, add test cases for edge cases (empty, malformed, etc.)

RULE FOR NEXT TIME:
- BEFORE running package manager commands: ls -la and check for lockfiles
- IN PAI directory: use `bun` exclusively (bun install, bun run, bun test)
- IN other projects: check package.json for packageManager field first

RULE FOR NEXT TIME:
- IF task has 3+ steps OR architectural decisions → ALWAYS enter plan mode
- BEFORE starting implementation → write plan and get approval
- WHEN feeling uncertain about approach → STOP and plan first
```

**Bad examples:**
```
RULE FOR NEXT TIME:
- Be more careful ❌ (not specific or actionable)
- Try harder ❌ (not a rule, just effort)
- Don't mess up ❌ (obvious, not helpful)
```

### TRIGGER - [When to remember this]
- **Scenario description:** When does this lesson apply?
- **Keywords:** Terms that should trigger memory of this lesson
- **Context clues:** Environmental signals to activate this rule

**Good examples:**
```
TRIGGER: Anytime implementing user input fields, authentication, or forms.
When user says "add login", "user registration", "contact form", etc.

TRIGGER: Before running ANY package management command in ANY project.
When about to type npm/yarn/pnpm/bun install/add/remove.

TRIGGER: At the start of any implementation task. When user says "build",
"implement", "create", "add feature", "refactor", etc. Pause and evaluate
complexity before starting.
```

**Bad examples:**
```
TRIGGER: When coding ❌ (too broad)
TRIGGER: Sometimes ❌ (not specific)
TRIGGER: If it comes up ❌ (vague)
```

### TAGS - [Searchable categories]
- **Use # prefix** for consistency: `#authentication #validation`
- **Multiple dimensions:** Category, technology, pattern, domain
- **Common tags:**
  - **Category:** `#bug #feature #refactor #performance #security`
  - **Technology:** `#typescript #react #bun #postgres #docker`
  - **Pattern:** `#validation #error-handling #testing #planning`
  - **Domain:** `#authentication #database #api #frontend #backend`
- **4-6 tags** is typical

**Good examples:**
```
TAGS: #validation #authentication #security #user-input #typescript

TAGS: #package-manager #bun #npm #tooling #pai-specific

TAGS: #planning #complexity #workflow #methodology #software-process
```

---

## Complete Example Entries

### Example 1: Technical Mistake

```markdown
## 2026-02-03 - Missing null check in database query

**MISTAKE:** I called `user.email.toLowerCase()` without checking if `user`
was null, causing a "Cannot read property 'toLowerCase' of null" error when
the database query returned no matching user.

**WHY IT HAPPENED:** I assumed the database query would always return a user
object. I didn't consider the case where the query might return null for a
non-existent user. I focused on the "happy path" and neglected error cases.

**CORRECT APPROACH:**
1. Always check if database query results exist before accessing properties
2. Use optional chaining (`user?.email`) or explicit null checks
3. Handle the null case with appropriate error response (404, 401, etc.)
4. Add test cases for both existing and non-existent users

**RULE FOR NEXT TIME:**
- BEFORE accessing properties on database results → check for null/undefined
- USE optional chaining (?.) or explicit if (!obj) checks
- AFTER writing database queries → add test case for "not found" scenario
- WHEN handling user lookups → always consider the "user doesn't exist" case

**TRIGGER:** Anytime querying databases, working with database results, or
accessing properties on objects that might not exist. When implementing
authentication, user lookups, or any database query that might return null.

**TAGS:** #null-check #database #error-handling #typescript #defensive-programming
```

### Example 2: Process Mistake

```markdown
## 2026-02-03 - Skipped plan mode for multi-file refactor

**MISTAKE:** I started refactoring the authentication system across 5 files
without writing a plan. Ended up breaking tests, missing edge cases, and had
to redo work twice because I didn't think through the full impact.

**WHY IT HAPPENED:** The refactor seemed straightforward at first - just
"moving some functions around". I underestimated the complexity and skipped
plan mode. I didn't recognize that touching 5+ files is a clear signal for
planning first.

**CORRECT APPROACH:**
1. Identify scope: count files affected, list components touched
2. If 3+ files OR architectural changes → ENTER PLAN MODE
3. Write plan to ~/Nextcloud/PAI/tasks/todo.md with:
   - Files to modify
   - Order of changes
   - Test verification steps
   - Rollback plan
4. Get user approval before starting
5. Execute plan step-by-step with verification

**RULE FOR NEXT TIME:**
- IF touching 3+ files → ALWAYS write plan first
- BEFORE refactoring → count files and components affected
- WHEN plan seems "obvious" → write it anyway (takes 5 minutes, saves hours)
- AFTER each refactor step → run tests before continuing

**TRIGGER:** When user says "refactor", "reorganize", "restructure", or when
about to modify multiple files. When thinking "this should be simple" about
a multi-component change.

**TAGS:** #planning #refactoring #workflow #multi-file #process-discipline
```

### Example 3: Methodology Mistake

```markdown
## 2026-02-03 - Marked task complete without verification

**MISTAKE:** I told the user the bug was fixed without actually running the
code to verify. User ran it and found the bug still existed - I had fixed
the symptom but not the root cause.

**WHY IT HAPPENED:** I was confident in my analysis and assumed the fix would
work. I relied on mental verification instead of actual testing. I wanted to
move fast and skipped the verification step.

**CORRECT APPROACH:**
1. After making fix, run the code and observe output
2. Reproduce the original bug to establish baseline
3. Verify the bug is now fixed with fresh evidence
4. Run related tests to check for regressions
5. Provide verification output to user (logs, screenshots, test results)
6. Only claim completion after verification succeeds

**RULE FOR NEXT TIME:**
- NEVER claim "fixed" without running the code
- ALWAYS provide fresh verification evidence (not "I tested earlier")
- BEFORE marking complete → run tests and show output
- WHEN confident fix will work → still verify anyway (confidence ≠ proof)

**TRIGGER:** Before marking any task complete, before claiming any bug is
fixed, before saying "this should work now". Anytime about to report completion
to user.

**TAGS:** #verification #testing #completion #methodology #false-positive
```

### Example 4: Tool/Technology Mistake

```markdown
## 2026-02-03 - Used Node.js instead of Bun in PAI

**MISTAKE:** I ran `node script.ts` in the PAI directory, which failed because
TypeScript isn't natively supported by Node. PAI uses Bun for all TypeScript
execution.

**WHY IT HAPPENED:** Muscle memory from other projects led me to use `node`
automatically. I didn't check the project's runtime environment before executing.
I assumed Node.js because it's more common.

**CORRECT APPROACH:**
1. Check for Bun-specific indicators: bun.lockb, package.json → "bun" in scripts
2. Look at existing script invocations in codebase (grep "bun run")
3. Check project documentation (CLAUDE.md, README.md)
4. When in PAI directory → ALWAYS use `bun` (bun run, bun test, bun script.ts)
5. For other projects → check package.json first

**RULE FOR NEXT TIME:**
- IN PAI directory → use `bun` exclusively for TypeScript (not node, not ts-node)
- BEFORE running scripts → check project's runtime (bun.lockb = use bun)
- WHEN writing new scripts → match existing patterns in project
- IF unsure → `ls -la | grep -E "(bun.lockb|package-lock)"` to identify runtime

**TRIGGER:** Before running any TypeScript file, before executing scripts,
when setting up development environment. When in PAI directory specifically.

**TAGS:** #bun #nodejs #runtime #typescript #pai-specific #tooling
```

---

## Writing Guidelines

### Be Specific
- ✅ "I used `Array.forEach()` which doesn't await promises"
- ❌ "I had an async problem"

### Be Honest
- ✅ "I rushed through without reading docs because I assumed I knew"
- ❌ "The documentation was unclear"

### Be Actionable
- ✅ "BEFORE querying database → check for null, add test for 'not found' case"
- ❌ "Be more careful with database queries"

### Be Searchable
- Use consistent tags
- Include technology names
- Reference specific error messages
- Use keywords from trigger scenarios

---

## Reviewing and Maintaining Lessons

### Weekly Review Process
1. Read all lessons from past week
2. Identify patterns across multiple lessons
3. Consolidate similar lessons if applicable
4. Refine rules based on whether they prevented recurrence
5. Archive obsolete lessons (technology changed, no longer relevant)

### Consolidation Example

**Before (3 separate entries):**
```
Lesson 1: Forgot to validate email in login form
Lesson 2: Forgot to validate password length in registration
Lesson 3: Forgot to sanitize username in profile update
```

**After (consolidated):**
```
## 2026-02-03 - Always validate user input server-side

MISTAKE: Multiple instances of missing input validation (email, password,
username) across different endpoints, all caught in code review.

WHY: I validated on client-side and assumed that was sufficient. Didn't
consider that API endpoints can be called directly, bypassing client validation.

CORRECT APPROACH:
1. ALWAYS validate on server-side, regardless of client validation
2. Use validation middleware/library consistently
3. Never trust client-provided data

RULE FOR NEXT TIME:
- EVERY endpoint accepting user input → add validation middleware
- BEFORE implementing endpoint → define validation schema
- ASSUME client validation doesn't exist (defense in depth)

TRIGGER: Implementing any API endpoint, handling user input, creating forms.

TAGS: #validation #security #api #user-input #defense-in-depth
```

### Archiving Obsolete Lessons

When to archive:
- Technology is no longer used (switched from X to Y)
- Pattern is now enforced by tooling (linter catches it)
- Lesson is superseded by better understanding
- Never made that mistake again for 6+ months

Archive format:
```markdown
## ARCHIVED LESSONS

### 2025-12-15 - Used var instead of const
Archived 2026-02-03: Now enforced by ESLint, impossible to make this mistake.
[Original lesson content...]
```

---

## Template for Quick Copy-Paste

```markdown
## 2026-02-03 - [Brief Title]

**MISTAKE:**

**WHY IT HAPPENED:**

**CORRECT APPROACH:**
1.
2.
3.

**RULE FOR NEXT TIME:**
-
-
-

**TRIGGER:**

**TAGS:** #
```

---

**Remember: The goal is to build institutional knowledge that makes you better over time. Be honest, specific, and actionable.**
