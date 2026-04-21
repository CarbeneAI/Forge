# Patch Validate Workflow

Verify that a proposed patch actually fixes a vulnerability. Ensures no regressions and confirms the exploit no longer works.

## Prerequisites

- The original vulnerability details (CWE, affected file, data flow)
- The proposed patch (diff, PR, or code change)
- The proof-of-vulnerability from the original finding

## Execution

### Step 1: Understand the Original Vulnerability

```
1.1: Read the vulnerability report or finding
1.2: Identify the exact vulnerability mechanism
     - Source of tainted input
     - Sink where it causes harm
     - Why existing code fails to prevent it
1.3: Review the proof-of-vulnerability
     - Understand exactly what the exploit does
     - Note the expected malicious outcome
```

### Step 2: Analyze the Patch

```
2.1: Read the proposed patch/diff
2.2: Classify the fix approach:
     - Tier 1: Dependency version bump
     - Tier 2: Targeted guard (validation, sanitization, encoding)
     - Tier 3: Structural refactor (pattern replacement)
2.3: Assess patch completeness:
     - Does it address the root cause, not just the symptom?
     - Does it cover all code paths to the vulnerable sink?
     - Are there other callers of the same sink that remain vulnerable?
     - Does it handle edge cases (empty input, unicode, encoding tricks)?
```

### Step 3: Re-Exploit

```
3.1: Apply the patch to the codebase
3.2: Re-run the original proof-of-vulnerability
3.3: Expected result: exploit FAILS (the fix works)
3.4: Try bypass variants:
     - Encoding variations (URL encoding, unicode, double encoding)
     - Case variations
     - Null byte injection
     - Alternative attack vectors for the same CWE
3.5: Document results for each attempt
```

### Step 4: Regression Check

```
4.1: If tests exist, run the test suite
4.2: Verify the patched function still handles valid inputs correctly
4.3: Check that the fix doesn't break adjacent functionality
4.4: Review for new vulnerabilities introduced by the patch
```

### Step 5: Verdict

```
Output one of:
- PASS: Patch fixes the vulnerability. No bypasses found. No regressions.
- PARTIAL: Patch mitigates but doesn't fully fix. [Explain bypass or gap]
- FAIL: Patch does not fix the vulnerability. [Explain why]
- REGRESSION: Patch fixes the vuln but breaks other functionality. [Details]
```

### Output Format

```markdown
# Patch Validation Report

**Finding:** [Original finding title]
**CWE:** CWE-XXX
**Patch:** [Brief description of the fix]

## Validation Results

| Test | Result | Notes |
|------|--------|-------|
| Original exploit | BLOCKED | [Details] |
| Encoding bypass | BLOCKED | [Details] |
| Alternative vector | BLOCKED | [Details] |
| Regression tests | PASSED | X/Y tests pass |

## Verdict: PASS / PARTIAL / FAIL / REGRESSION

## Notes
[Any additional observations or recommendations]
```
