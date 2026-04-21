---
name: BugHunter
description: >-
  AI-powered source code vulnerability discovery, exploitation, and patching pipeline.
  Inspired by Praetorian Constantine's 6-stage architecture.
  USE WHEN user mentions bug bounty, source code audit, vulnerability scanning, code security review,
  CVE hunting, exploit generation, proof of vulnerability, patch validation, security-relevant file scoring,
  SAST, static analysis, or wants to find exploitable bugs in a codebase.
  Integrates with Ehud (pentest agent) and Nehemiah (security auditor) for comprehensive assessments.
version: "1.0"
author: CarbeneAI
---

# BugHunter

AI-powered source code vulnerability discovery and patching pipeline. Inspired by [Praetorian Constantine](https://docs.praetorian.com/articles/1856234-constantine-locates-fatal-security-bugs-in-software) -- adapted for Claude Code's native capabilities.

## Philosophy

> "Never report a finding you can't prove, never propose a fix you haven't tested."

Three core principles (from DARPA AIxCC):
1. **Patching matters 3x more than discovery** -- validation through re-exploitation is critical
2. **Accuracy multipliers punish speculation** -- independent verification at every stage
3. **Prove it or drop it** -- every finding needs a proof-of-vulnerability

## Pipeline Overview

```
1. INGEST --> 2. DETECT --> 3. VERIFY --> 4. EXPLOIT --> 5. PATCH --> 6. REPORT
     |              |            |             |            |            |
  Clone/Map     Multi-pass    Agentic       Generate     Fix + Re-    CWE/CVSS
  + Score       LLM scan      code flow     PoV code     verify       Markdown
  files         (fast+deep)   analysis                                + JSON
```

## Quick Start

### Full Scan (recommended)
```
"Run a BugHunter full scan on <repo-url-or-path>"
"Bug bounty scan this repository"
```

### Quick Triage
```
"BugHunter quick scan on src/"
"Triage this codebase for security issues"
```

### Targeted Scan
```
"BugHunter scan the auth module for injection flaws"
"Hunt for deserialization bugs in the API routes"
```

### Patch Validation
```
"BugHunter validate this patch fixes the vulnerability"
"Re-exploit after patch to confirm the fix"
```

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **Full Scan** | "full scan", "bug bounty scan", "comprehensive audit" | `workflows/FullScan.md` |
| **Quick Scan** | "quick scan", "triage", "fast audit" | `workflows/QuickScan.md` |
| **Patch Validate** | "validate patch", "verify fix", "re-exploit" | `workflows/PatchValidate.md` |

## Stage Details

### Stage 1: Ingest

Clone (or open) the target repository and build an attack surface map.

**File Scoring (0-100):** Each file is scored for security relevance:

| Score Range | Category | Examples |
|-------------|----------|----------|
| 80-100 | Critical | Auth handlers, crypto, input parsers, deserialization, network protocols |
| 60-79 | High | Database queries, file I/O, API controllers, middleware, config loaders |
| 40-59 | Medium | Business logic, data models, service layers |
| 20-39 | Low | Utilities, helpers, formatting |
| 0-19 | Skip | Tests, fixtures, docs, generated code, vendored deps |

**Priority signals:**
- Files touching: authentication, authorization, cryptography, input parsing, deserialization, SQL/NoSQL queries, file system ops, command execution, network I/O, secrets/env handling
- Recent git commits (churn = risk)
- Large functions with complex control flow
- Files with prior CVEs or security-related commits

### Stage 2: Detect

Multi-pass LLM analysis on high-scoring files:

**Pass 1 -- Fast Sweep (subagent, haiku-class):**
- Scan each file for known vulnerability patterns
- Flag potential issues with low confidence threshold
- Output: candidate list with file, line range, suspected CWE

**Pass 2 -- Deep Analysis (subagent, sonnet/opus-class):**
- Review each candidate with full file context
- Trace data flow from sources to sinks
- Classify: Confirmed, Likely, Possible, False Positive
- Output: refined findings with confidence scores

**Pass 3 -- Adversarial Review (optional, for critical findings):**
- Actor agent argues the finding is real
- Skeptic agent argues it's a false positive
- Adjudicator decides based on evidence
- Output: high-confidence findings only

### Stage 3: Verify

Agentic code exploration to confirm each finding:

- Trace taint from untrusted input to vulnerable sink
- Map the full call chain (caller -> ... -> vulnerable function)
- Check for existing sanitization, validation, or guards
- Determine if the vulnerability is reachable from an entry point
- Assess trust boundaries (is the input actually attacker-controlled?)

**Drop criteria:** Finding is dropped if:
- Input is only reachable from trusted/internal callers
- Existing sanitization adequately prevents exploitation
- The vulnerable pattern is dead code or unreachable

### Stage 4: Exploit

Generate proof-of-vulnerability for each verified finding:

- Craft actual input/payload that triggers the bug
- For web apps: HTTP request with malicious parameters
- For libraries: Code snippet that demonstrates the flaw
- For CLI tools: Command-line invocation that triggers the issue
- Run in sandboxed environment when possible (Kali MCP)
- Document: exact reproduction steps, expected vs actual behavior

**Trust model analysis:** Eliminate self-inflicted vulnerabilities (e.g., a test that deliberately uses weak crypto is not a finding).

### Stage 5: Patch

Generate and validate fixes using tiered approach:

| Tier | Fix Type | Example |
|------|----------|---------|
| 1 | Dependency bump | Update library past vulnerable version |
| 2 | Targeted guard | Add input validation, parameterized query |
| 3 | Structural refactor | Replace vulnerable pattern entirely |

**Validation:** Re-run the exploit from Stage 4 against patched code. Only report patches that provably fix the bug.

### Stage 6: Report

Generate structured output:

**For each finding:**
- Title and description
- CWE classification (e.g., CWE-89: SQL Injection)
- CVSS v3.1 score and vector string
- Severity: Critical / High / Medium / Low / Info
- Affected file(s) and line numbers
- Data flow trace (source -> ... -> sink)
- Proof-of-vulnerability (exact reproduction steps)
- Recommended patch (with validation status)
- References (CVE database, OWASP, etc.)

**Output formats:**
- `findings.md` -- Human-readable Markdown report
- `findings.json` -- Machine-readable structured data

## Vulnerability Pattern Library

### Injection (CWE-74 family)
- SQL Injection (CWE-89)
- OS Command Injection (CWE-78)
- LDAP Injection (CWE-90)
- XPath Injection (CWE-643)
- Template Injection (SSTI)
- Header Injection (CWE-113)

### Authentication & Access (CWE-287 family)
- Broken Authentication (CWE-287)
- Missing Authorization (CWE-862)
- IDOR / Insecure Direct Object Reference (CWE-639)
- Privilege Escalation (CWE-269)
- JWT Vulnerabilities (weak signing, none algorithm)

### Cryptographic (CWE-310 family)
- Weak Algorithms (CWE-327)
- Hardcoded Credentials (CWE-798)
- Insufficient Key Length (CWE-326)
- Missing Encryption (CWE-311)
- Predictable Random (CWE-330)

### Input Handling (CWE-20 family)
- Path Traversal (CWE-22)
- Deserialization of Untrusted Data (CWE-502)
- XML External Entity (CWE-611)
- Server-Side Request Forgery (CWE-918)
- Open Redirect (CWE-601)
- Prototype Pollution (JS-specific)

### Memory Safety (C/C++/Rust unsafe)
- Buffer Overflow (CWE-120)
- Use After Free (CWE-416)
- Double Free (CWE-415)
- Integer Overflow (CWE-190)
- Format String (CWE-134)

### Configuration & Secrets
- Debug Mode in Production (CWE-489)
- Exposed Admin Interfaces
- CORS Misconfiguration
- Missing Security Headers
- Secrets in Source Code (CWE-540)

## Language-Specific Focus Areas

| Language | Priority Patterns |
|----------|------------------|
| **Python** | eval/exec, pickle, yaml.load, subprocess shell=True, SQL string concat, Jinja2 autoescape=False |
| **JavaScript/TS** | eval, innerHTML, dangerouslySetInnerHTML, child_process, prototype pollution, regex DoS |
| **Java** | ObjectInputStream, Runtime.exec, XML parsers (XXE), Spring expression injection, Log4j patterns |
| **Go** | sql.Query with string concat, template.HTML, exec.Command, path traversal in http.FileServer |
| **C/C++** | strcpy/strcat/sprintf, malloc/free patterns, format strings, integer arithmetic |
| **PHP** | system/exec/passthru, include/require with user input, unserialize, SQL concat |
| **Ruby** | send/public_send, ERB/eval, YAML.load, system/backticks, mass assignment |
| **Rust** | unsafe blocks, raw pointer deref, unchecked indexing, std::mem::transmute |

## Agent Integration

| Agent | Role in BugHunter |
|-------|-------------------|
| **Ehud** | Exploit validation on Kali MCP, network-layer PoC execution |
| **Nehemiah** | Deep security code review, OWASP compliance verification |
| **Solomon** | Code quality assessment of proposed patches |
| **Deborah** | Adversarial skeptic in Stage 3 verification |

## Scan Configurations

| Config | Files Scored | Findings Reviewed | Best For |
|--------|-------------|-------------------|----------|
| **Full** | All files | Up to 250 | Comprehensive audit, bug bounty |
| **Quick** | Top 50 by score | Up to 50 | Fast triage, PR review |
| **Targeted** | Specified paths only | All in scope | Focused investigation |

## Cost & Scope Control

- File scoring prevents wasting analysis on test fixtures and docs
- Configurable depth limits per stage
- Early termination when budget/time constraints hit
- Progress reporting at each stage transition

## Ethical Guidelines

1. **Authorization required** -- Only scan repos you own or have explicit permission to test
2. **Responsible disclosure** -- Follow coordinated disclosure for public repos
3. **Bug bounty scope** -- Respect program scope, rules, and safe harbor provisions
4. **No weaponization** -- PoVs demonstrate the bug, not maximize damage
5. **Privacy** -- Don't exfiltrate or store sensitive data found during scans

## References

- [Praetorian Constantine](https://docs.praetorian.com/articles/1856234-constantine-locates-fatal-security-bugs-in-software) -- Inspiration for the 6-stage pipeline
- [DARPA AIxCC](https://aicyberchallenge.com/) -- AI Cyber Challenge competition
- [CWE Database](https://cwe.mitre.org/) -- Common Weakness Enumeration
- [CVSS Calculator](https://www.first.org/cvss/calculator/3.1) -- Scoring framework
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) -- Web application security risks
