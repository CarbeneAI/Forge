---
name: verification-before-done
description: |
  Enforces evidence-based completion claims with mandatory verification gates.
  USE WHEN completing any task, claiming results, reporting success, OR before declaring work done. Prevents rationalization and false completion.
  Iron Law: NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE. Run the command, read the output, THEN claim the result.
---

# Verification Before Done

Prevents premature and false completion claims by requiring fresh verification evidence before declaring any task complete.

## 🎯 Load Full CORE Context

```bash
read ${PAI_DIR}/skills/CORE/SKILL.md
```

## When to Activate This Skill

**ALWAYS active** - This is a gate function that applies to ALL task completion, not just specific requests.

**Activate when:**
- About to claim "tests pass"
- About to claim "feature works"
- About to claim "deployment successful"
- About to claim "requirement met"
- About to claim ANY completion status

## The Iron Law

**NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE**

You MUST:
1. IDENTIFY what needs verification
2. RUN the verification command
3. READ the actual output
4. VERIFY the result
5. ONLY THEN claim completion

**NEVER:**
- Claim "should work" without running
- Claim "tests should pass" without running them
- Claim "probably works" based on code inspection
- Claim completion based on satisfaction with code

## The Gate Function

This skill acts as a gate between work completion and claim of completion.

```
Write Code → [VERIFICATION GATE] → Claim Completion
              ↑
              Must show evidence:
              - Command run
              - Output captured
              - Result verified
```

**The gate blocks you from claiming done until verification evidence is provided.**

## Common Completion Claims & Required Evidence

| Claim | Required Evidence | NOT Acceptable |
|-------|-------------------|----------------|
| "Tests pass" | Actual test output showing passes | "Tests should pass", "I wrote tests" |
| "Feature works" | Demo output or screenshot | "Code looks right", "Should work" |
| "Build succeeds" | Build command output | "No syntax errors", "Compiles in my head" |
| "Deployment live" | curl/browser output of deployed URL | "Pushed to server", "Deploy command ran" |
| "Requirements met" | Verification of each requirement | "I implemented everything", "Looks complete" |
| "Bug fixed" | Test case or reproduction showing fix | "Changed the code", "Root cause addressed" |
| "Performance improved" | Benchmark numbers before/after | "Optimized algorithm", "Should be faster" |

## The Process

### Step 1: Identify Verification Criteria

Before claiming done, identify what specifically needs verification.

**Examples:**

**Claim:** "Implemented user authentication"
**Verification Criteria:**
- Test suite passes for auth module
- Can create user account
- Can log in with correct password
- Cannot log in with wrong password
- Session persists across requests

**Claim:** "Fixed crash on empty input"
**Verification Criteria:**
- Reproduction case no longer crashes
- Test case passes
- Related edge cases also handled

**Claim:** "Deployed to production"
**Verification Criteria:**
- curl shows expected response
- Browser loads page correctly
- Health check endpoint responds
- Logs show successful deploy

### Step 2: Run Verification Commands

Execute commands that generate verifiable evidence.

**Examples:**

```bash
# For "tests pass"
npm test

# For "feature works"
curl http://localhost:3000/api/user
# or
node scripts/test-feature.js

# For "build succeeds"
npm run build

# For "deployment live"
curl https://example.com/health
# and
open https://example.com  # screenshot result

# For "performance improved"
npm run benchmark > after.txt
diff before.txt after.txt
```

### Step 3: Read Actual Output

Don't assume success. Read what actually happened.

**Example:**

```bash
$ npm test

> test
> vitest run

 RUN  v0.34.6

 ✓ src/auth.test.ts (5) 324ms
   ✓ User authentication
     ✓ accepts valid credentials
     ✓ rejects invalid password
     ✓ rejects unknown user
     ✓ creates session on success
     ✓ handles empty input

 Test Files  1 passed (1)
      Tests  5 passed (5)
   Duration  1.02s
```

**Now you can claim:** "All 5 authentication tests pass"

### Step 4: Verify Expected Result

Check that output matches what you expected for completion.

**Questions to ask:**

- Did ALL tests pass? (not just some)
- Did the feature produce expected output?
- Is the deployment actually accessible?
- Do benchmark numbers show improvement?
- Are error cases handled correctly?

**If verification fails:**
- DO NOT claim completion
- Fix the issue
- Re-run verification
- Repeat until verification passes

### Step 5: Claim Completion with Evidence

Only after verification passes, claim completion and provide evidence.

**Format:**

```markdown
## Completion Status: ✅ VERIFIED

**Claim:** [What you're claiming is done]

**Verification Evidence:**

[Paste actual command output]

**Conclusion:** [What the evidence shows]
```

**Example:**

```markdown
## Completion Status: ✅ VERIFIED

**Claim:** User authentication implementation complete with all tests passing

**Verification Evidence:**

```
$ npm test src/auth.test.ts

 ✓ src/auth.test.ts (5) 324ms
   ✓ User authentication
     ✓ accepts valid credentials
     ✓ rejects invalid password
     ✓ rejects unknown user
     ✓ creates session on success
     ✓ handles empty input

 Test Files  1 passed (1)
      Tests  5 passed (5)
   Duration  1.02s
```

**Conclusion:** All 5 test cases pass including happy path, error cases, and edge cases. Authentication implementation verified working.
```

## Red Flags & Rationalization Prevention

### Red Flag Words

If you catch yourself saying these, STOP and run verification:

- "should"
- "probably"
- "seems to"
- "appears to"
- "likely"
- "I think"
- "based on the code"
- "assuming"

**Example red flags:**

❌ "Tests should pass now that I fixed the logic"
❌ "The deployment probably worked since push succeeded"
❌ "Feature seems to be working based on code review"
❌ "Performance likely improved with the new algorithm"

**Correct versions:**

✅ "Tests pass [paste output]"
✅ "Deployment verified live [paste curl output]"
✅ "Feature works [paste demo output]"
✅ "Performance improved 40% [paste benchmark comparison]"

### Rationalization Patterns

Humans rationalize to avoid verification work. Catch these patterns:

| Rationalization | Reality | Fix |
|----------------|---------|-----|
| "Code looks right, must work" | Code frequently has subtle bugs | Run it and verify |
| "I fixed the root cause" | Root cause analysis is often wrong | Test the fix |
| "No syntax errors = works" | Logic errors are more common than syntax | Run tests |
| "I'm satisfied with implementation" | Satisfaction ≠ correctness | Verify objectively |
| "Small change, won't break anything" | Small changes break things regularly | Regression test |
| "Someone else will test it" | Passing broken code wastes time | Test yourself first |

**The fix is always the same: RUN THE VERIFICATION COMMAND.**

## Verification Patterns by Task Type

### Pattern 1: Tests Pass

**Claim:** "Tests pass"

**Verification:**
```bash
# Run the test suite
npm test

# Or specific test file
npm test path/to/test.ts

# Or test by pattern
npm test --grep "user authentication"
```

**Evidence Required:**
- Test runner output showing passes
- Number of tests run
- No failures or errors
- No skipped tests (unless intentional)

**Common Failure:**
❌ "Tests should pass" (didn't run them)
❌ "I wrote tests" (didn't verify they pass)
❌ "No test failures in my editor" (didn't run test command)

✅ Paste actual test runner output showing passes

### Pattern 2: Regression Tests (TDD Red-Green)

**Claim:** "Test went from red to green"

**Verification:**
```bash
# Step 1: Show test failing (RED)
npm test  # before fix

# Step 2: Implement fix

# Step 3: Show test passing (GREEN)
npm test  # after fix
```

**Evidence Required:**
- BEFORE output showing failure
- AFTER output showing pass
- Same test case in both

**Common Failure:**
❌ "Fixed the bug" (no before/after test evidence)
❌ "Test passes now" (didn't show it failing first)

✅ Show both red and green test output

### Pattern 3: Build Success

**Claim:** "Build succeeds"

**Verification:**
```bash
# Clean build from scratch
rm -rf dist/
npm run build

# Or language-specific
cargo build --release
go build .
python setup.py build
```

**Evidence Required:**
- Build command output
- Exit code 0
- Artifacts created (dist/, target/, etc.)
- No warnings (or warnings acknowledged)

**Common Failure:**
❌ "No syntax errors" (didn't actually build)
❌ "Should compile" (didn't run build command)

✅ Paste build output with success confirmation

### Pattern 4: Feature Demonstration

**Claim:** "Feature works as specified"

**Verification:**
```bash
# For API: curl command
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"secret"}'

# For CLI: run the command
./bin/tool --option value

# For web: screenshot of browser
# Load page, take screenshot, paste in response
```

**Evidence Required:**
- Command output or screenshot
- Expected behavior demonstrated
- Error cases handled (show error handling works)

**Common Failure:**
❌ "Feature is implemented" (didn't demo it)
❌ "Should work when user clicks button" (didn't actually click)

✅ Show actual feature execution output or screenshot

### Pattern 5: Deployment Verification

**Claim:** "Deployed to production"

**Verification:**
```bash
# Check endpoint responds
curl -I https://production-domain.com/health

# Load in browser and screenshot
open https://production-domain.com

# Check logs
ssh production "tail /var/log/app.log"

# Verify version
curl https://production-domain.com/version
```

**Evidence Required:**
- Successful HTTP response from production domain
- Screenshot of working page
- Version number matches deployment
- Logs show successful startup

**Common Failure:**
❌ "Pushed to server" (didn't verify it's accessible)
❌ "Deploy command succeeded" (didn't check if app started)

✅ Show curl output and screenshot of live site

### Pattern 6: Requirements Met

**Claim:** "All requirements implemented"

**Verification:**
- Create checklist of requirements
- Verify each one individually
- Provide evidence for each

**Example:**

```markdown
## Requirements Verification

**Requirement 1:** User can create account
✅ Verified: [paste curl output of account creation]

**Requirement 2:** User receives confirmation email
✅ Verified: [screenshot of received email]

**Requirement 3:** Password must be 8+ characters
✅ Verified: [paste test output showing validation]

**Requirement 4:** Account activation link expires after 24h
✅ Verified: [paste test output of expired link rejection]
```

**Common Failure:**
❌ "I implemented all requirements" (no per-requirement verification)

✅ Verify each requirement individually with evidence

### Pattern 7: Agent Delegation

**Claim:** "Agent X completed task Y"

**Verification:**
- Read agent's report
- Independently verify their claims
- Don't trust agent's self-assessment

**Process:**
```markdown
1. Agent reports: "Implemented feature Z, tests pass"

2. Verify their claim:
   - Read the code they wrote
   - Run the tests yourself
   - Check git commit
   - Verify against original task spec

3. Claim completion only after YOUR verification
```

**Common Failure:**
❌ "Agent said it's done" (blindly trusting report)
❌ "Agent showed test output" (didn't verify yourself)

✅ Independently verify agent's work before claiming completion

## Integration with Other Skills

**SubagentDrivenDev:**
- Implementer must verify before reporting
- Spec reviewer must verify implementation matches spec
- Quality reviewer must verify code quality claims

**ExecutingPlans:**
- Each task completion requires verification
- Batch completion requires all task verifications
- Never proceed to next batch without verification

**Brainstorming:**
- Design documentation committed (verify git commit)
- Design matches user validation (verify against notes)

## Common Mistakes

| Mistake | Why It's Wrong | Correct Approach |
|---------|---------------|------------------|
| "Tests should pass" | Didn't actually run them | Run tests, paste output |
| "Code looks good" | Visual inspection ≠ verification | Execute and verify behavior |
| "I'm confident this works" | Confidence ≠ proof | Demonstrate it working |
| "Probably deployed" | Uncertainty means no verification | Check production URL |
| "Agent said it's done" | Trust but verify | Independently verify agent's work |
| "No obvious errors" | Absence of obvious ≠ correctness | Test thoroughly |

## Examples

### Example 1: Test Verification

**WRONG:**

```markdown
I implemented user authentication with password hashing.
Tests should pass now.

Task complete! ✅
```

**RIGHT:**

```markdown
I implemented user authentication with password hashing.

Verification:

```
$ npm test src/auth.test.ts

 RUN  v0.34.6

 ✓ src/auth.test.ts (5) 324ms
   ✓ User authentication
     ✓ accepts valid credentials (102ms)
     ✓ rejects invalid password (98ms)
     ✓ rejects unknown user (87ms)
     ✓ creates session on success (115ms)
     ✓ handles empty input (22ms)

 Test Files  1 passed (1)
      Tests  5 passed (5)
   Duration  1.02s
```

All 5 authentication tests pass. Implementation verified. ✅
```

### Example 2: Deployment Verification

**WRONG:**

```markdown
Ran `npm run deploy`. Deploy command succeeded.

Deployment complete! ✅
```

**RIGHT:**

```markdown
Ran deployment command. Verifying production:

```
$ curl -I https://myapp.com

HTTP/2 200
content-type: text/html; charset=utf-8
date: Mon, 03 Feb 2026 18:30:45 GMT
server: nginx

$ curl https://myapp.com/api/health

{"status":"healthy","version":"1.2.3","uptime":142}
```

Production responding correctly with version 1.2.3 (matches deployment).

Browser screenshot: [attached]

Deployment verified. ✅
```

### Example 3: Bug Fix Verification

**WRONG:**

```markdown
Fixed the null pointer exception in user profile handler.
Changed line 42 to check for null before dereferencing.

Bug fixed! ✅
```

**RIGHT:**

```markdown
Fixed null pointer exception in user profile handler.

Verification - Before fix:

```
$ npm test -- --grep "null user profile"

 FAIL  src/profile.test.ts
   ✗ handles null user profile (15ms)
     TypeError: Cannot read property 'name' of null
       at getUserProfile (profile.ts:42)
```

Applied fix (null check at line 42).

Verification - After fix:

```
$ npm test -- --grep "null user profile"

 PASS  src/profile.test.ts
   ✓ handles null user profile (8ms)

 Test Files  1 passed (1)
      Tests  1 passed (1)
```

Test went from red to green. Bug fix verified. ✅
```

## The Non-Negotiable Rule

**Run the command. Read the output. THEN claim the result.**

No shortcuts. No assumptions. No rationalizations.

Evidence-based completion claims only.

---

**This skill prevents false confidence and ensures all completion claims are backed by verification evidence.**
