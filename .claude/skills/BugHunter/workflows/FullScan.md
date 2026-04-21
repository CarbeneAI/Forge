# Full Scan Workflow

Complete 6-stage vulnerability discovery pipeline. Use for comprehensive bug bounty scans or security audits.

## Prerequisites

- Target repository URL or local path
- Authorization to test (bug bounty program, own code, or explicit permission)
- Optional: Kali MCP for exploit validation

## Execution

### Stage 1: Ingest (Build Attack Surface Map)

```
Step 1.1: Clone or open the target repository
  - If URL: git clone --depth 1 <url> /tmp/bughunter/<repo-name>
  - If local path: work in place
  - Record: language(s), framework(s), LOC count

Step 1.2: Map the codebase structure
  - Identify entry points (main, routes, handlers, CLI parsers)
  - Identify trust boundaries (user input, API endpoints, file uploads, IPC)
  - Identify sensitive operations (auth, crypto, DB, file I/O, exec)

Step 1.3: Score files for security relevance (0-100)
  Use these heuristics:
  - +30: Handles authentication or authorization
  - +25: Processes user/external input
  - +25: Performs cryptographic operations
  - +20: Executes database queries
  - +20: Performs file system operations
  - +20: Executes system commands or child processes
  - +15: Handles serialization/deserialization
  - +15: Implements network protocols
  - +10: Configuration or secrets management
  - +5:  Recent git churn (many recent commits)
  - -20: Test file (but check for test-only vulns)
  - -30: Documentation, generated code, vendored deps

Step 1.4: Prioritize files
  - Sort by score descending
  - Group into tiers: Critical (80+), High (60-79), Medium (40-59)
  - For Quick config: take top 50 files only
  - Output: Prioritized file list with scores and rationale
```

### Stage 2: Detect (Multi-Pass LLM Analysis)

```
Step 2.1: Fast Sweep (parallel subagents on Critical + High files)
  Launch parallel agents (haiku-class if available, sonnet otherwise).
  Each agent receives 3-5 files and this prompt:

  "Analyze these files for security vulnerabilities. For each potential
  finding, report:
  - File and line range
  - Suspected vulnerability type (CWE number)
  - Brief description
  - Confidence: Low / Medium / High
  Focus on: injection, auth bypass, crypto weakness, SSRF, path traversal,
  deserialization, command injection, XSS, IDOR, race conditions."

  Collect all candidates into a unified list.

Step 2.2: Deep Analysis (sequential, on each candidate)
  For each candidate from 2.1, read the full file plus any imported/called files.
  Analyze with this framework:

  a) SOURCE: Where does the tainted data originate?
     - User input (HTTP params, headers, body, cookies)
     - File content, environment variables, database values
     - External API responses

  b) SINK: Where does the data reach a dangerous operation?
     - SQL query, system command, file path, HTML output
     - Crypto function, deserialization, redirect URL

  c) SANITIZATION: What transformations happen between source and sink?
     - Framework-provided sanitization (parameterized queries, template escaping)
     - Manual validation (regex, allowlists, type checks)
     - Missing or bypassable sanitization

  d) CLASSIFICATION:
     - Confirmed: Clear taint flow, no adequate sanitization
     - Likely: Probable taint flow, sanitization may be bypassable
     - Possible: Suspicious pattern, needs more context
     - False Positive: Adequate sanitization exists, drop the finding

Step 2.3: Adversarial Review (for Confirmed/Likely findings only)
  Optional but recommended for bug bounty submissions.

  Launch two subagents per finding:
  - ACTOR: "Argue why this vulnerability is exploitable. Provide specific
    attack scenarios and bypasses for any sanitization."
  - SKEPTIC: "Argue why this is NOT exploitable. Identify all defensive
    measures, framework protections, and reasons this is a false positive."

  Adjudicate: If the Actor's argument survives the Skeptic's challenges,
  the finding is promoted to Verified.
```

### Stage 3: Verify (Agentic Code Exploration)

```
Step 3.1: For each Confirmed/Likely finding, trace the complete data flow:
  - Map caller chain from entry point to vulnerable sink
  - Use Grep to find all callers of the vulnerable function
  - Verify each step in the chain passes tainted data
  - Document the full trace: EntryPoint -> FuncA -> FuncB -> VulnSink

Step 3.2: Check for guards that detection might have missed:
  - Middleware that validates/sanitizes before the handler
  - Framework-level protections (CSRF tokens, Content-Security-Policy)
  - WAF rules or rate limiting (note: these mitigate but don't fix)
  - Type systems that prevent certain injection classes

Step 3.3: Assess reachability:
  - Is the vulnerable code path reachable from a public entry point?
  - Are there authentication/authorization gates before the vuln?
  - Does the attacker control the tainted input?
  - Is the feature enabled in production configuration?

Step 3.4: Trust model analysis:
  - DROP if: input only comes from trusted internal services
  - DROP if: the "vulnerability" is in test code testing security features
  - DROP if: the code is dead/unreachable in production
  - KEEP if: any path from untrusted input reaches the sink
```

### Stage 4: Exploit (Proof of Vulnerability)

```
Step 4.1: For each verified finding, generate a proof-of-vulnerability:

  Web applications:
  - Craft HTTP request (curl command or fetch snippet)
  - Include malicious payload in the relevant parameter
  - Show expected response demonstrating the vulnerability
  - Example: SQL injection returning unauthorized data

  Libraries/packages:
  - Write a minimal code snippet that imports the library
  - Demonstrate the vulnerability with a concrete input
  - Show the dangerous behavior (code execution, data leak, etc.)

  CLI tools:
  - Provide command-line invocation with malicious arguments
  - Show how the tool mishandles the input

Step 4.2: Validate the exploit (if Kali MCP available):
  - Set up the vulnerable application in a sandboxed environment
  - Execute the proof-of-vulnerability
  - Capture evidence (response, logs, side effects)
  - Document: exact steps, environment, evidence

Step 4.3: Determine impact:
  - Confidentiality: Can attacker read unauthorized data?
  - Integrity: Can attacker modify data or code?
  - Availability: Can attacker cause denial of service?
  - Scope: Is impact contained or does it affect other components?
```

### Stage 5: Patch (Fix and Validate)

```
Step 5.1: Determine fix tier:
  Tier 1 - Dependency bump:
    Check if the vuln is in a dependency with a patched version.
    Generate: package.json/requirements.txt/go.mod update.

  Tier 2 - Targeted guard:
    Add specific mitigation at the vulnerability point.
    Examples: parameterized query, input validation, output encoding,
    allowlist check, proper auth gate.

  Tier 3 - Structural refactor:
    Replace the vulnerable pattern entirely.
    Examples: switch from eval() to AST parsing, replace pickle with JSON,
    use ORM instead of raw SQL.

Step 5.2: Generate the patch:
  - Produce a clean diff (Edit tool format or git diff)
  - Include only the minimum changes needed
  - Preserve existing functionality
  - Add security-relevant code comments only where non-obvious

Step 5.3: Validate the patch:
  - Re-run the exploit from Stage 4 against the patched code
  - Verify the exploit NO LONGER succeeds
  - Verify existing functionality is NOT broken
  - If tests exist: run them to check for regressions
  - Only report patches that provably fix the bug
```

### Stage 6: Report

```
Step 6.1: Generate findings.md with this structure per finding:

  ## [SEVERITY] Finding Title
  **CWE:** CWE-XXX (Name)
  **CVSS:** X.X (Vector String)
  **File:** path/to/file.ext:line_number

  ### Description
  [Clear explanation of the vulnerability]

  ### Data Flow
  ```
  [EntryPoint] -> [Function A] -> [Function B] -> [Vulnerable Sink]
  ```

  ### Proof of Vulnerability
  ```
  [Exact reproduction steps / curl command / code snippet]
  ```

  ### Impact
  [What an attacker can achieve]

  ### Recommended Fix
  ```diff
  [Patch diff]
  ```

  ### Patch Validation
  [Evidence that the patch fixes the issue]

  ### References
  - [Relevant CVE, OWASP guide, or CWE entry]

Step 6.2: Generate executive summary:
  - Total findings by severity
  - Top 3 most critical issues
  - Overall security posture assessment
  - Prioritized remediation roadmap

Step 6.3: Output location:
  - Save report to: <repo-path>/bughunter-report/
  - findings.md (human-readable)
  - findings.json (machine-readable, for integration)
  - Individual finding files if report exceeds 500 lines
```

## Completion Criteria

- All 6 stages completed
- Every reported finding has a proof-of-vulnerability
- Every patch has been validated via re-exploitation
- No unverified findings in the final report
- Report saved to target repository
