# WorkflowOrchestration Decision Tree

**Quick reference for when to use each component of the development methodology.**

---

## Plan Mode Decision Tree

```
START: New task received
│
├─ Is task trivial (1-2 obvious steps)?
│  ├─ YES → Skip plan mode, execute directly
│  └─ NO → Continue evaluation
│
├─ Does task require 3+ steps?
│  ├─ YES → ENTER PLAN MODE
│  └─ NO → Continue evaluation
│
├─ Are there architectural decisions?
│  ├─ YES → ENTER PLAN MODE
│  └─ NO → Continue evaluation
│
├─ Will multiple files/components be affected?
│  ├─ YES → ENTER PLAN MODE
│  └─ NO → Continue evaluation
│
├─ Are you uncertain about the approach?
│  ├─ YES → ENTER PLAN MODE
│  └─ NO → Continue evaluation
│
├─ Did user explicitly request a plan?
│  ├─ YES → ENTER PLAN MODE
│  └─ NO → Execute with caution, ready to stop & plan if needed
│
└─ DURING EXECUTION: Something went wrong?
   └─ YES → STOP, RE-PLAN IMMEDIATELY
```

### Plan Mode Examples

| Scenario | Plan Mode? | Why |
|----------|------------|-----|
| Add input validation to login form | NO | Simple, obvious, 1-2 steps |
| Build authentication system | YES | Multiple components, architectural decisions |
| Fix typo in error message | NO | Trivial change |
| Refactor database layer | YES | Impacts multiple files, needs careful planning |
| Update dependency version | MAYBE | If just bump version: no. If requires migration: yes |
| Implement payment processing | YES | Critical feature, security implications, multi-step |
| Debug failing test | NO | Unless root cause requires architectural changes |
| Migrate from REST to GraphQL | YES | Major architectural change |

---

## Subagent Strategy Decision Tree

```
START: Considering whether to use subagent
│
├─ Is this writing/implementing code?
│  ├─ YES → DON'T use subagent (keep in main context)
│  └─ NO → Continue evaluation
│
├─ Is this an architectural decision?
│  ├─ YES → DON'T use subagent (need full context in main)
│  └─ NO → Continue evaluation
│
├─ Is this research or investigation?
│  ├─ YES → USE SUBAGENT (model: haiku/sonnet)
│  └─ NO → Continue evaluation
│
├─ Is this reading/exploring files?
│  ├─ YES → USE SUBAGENT (model: haiku)
│  └─ NO → Continue evaluation
│
├─ Is this testing/verification?
│  ├─ YES → USE SUBAGENT (model: haiku)
│  └─ NO → Continue evaluation
│
├─ Can this run in parallel with other tasks?
│  ├─ YES → USE SUBAGENT, launch multiple in parallel
│  └─ NO → Continue evaluation
│
└─ Is main context getting cluttered?
   └─ YES → USE SUBAGENT to keep main clean
```

### Model Selection Decision

```
START: Decided to use subagent
│
├─ Is task simple/grunt work?
│  └─ YES → Use HAIKU (10-20x faster)
│
├─ Is task standard research/implementation?
│  └─ YES → Use SONNET (balanced)
│
└─ Is task deep reasoning/complex strategy?
   └─ YES → Use OPUS (maximum intelligence)
```

### Subagent Examples

| Task | Use Subagent? | Model | Reasoning |
|------|---------------|-------|-----------|
| List all exported functions in auth.ts | YES | haiku | Simple file reading, fast |
| Research authentication best practices | YES | sonnet | Standard research task |
| Design new authentication architecture | NO | opus | Need full context, architectural decision |
| Check if tests pass | YES | haiku | Quick verification |
| Implement login endpoint | NO | sonnet | Writing code, keep in main |
| Analyze 5 competitor products | YES (5x) | sonnet | Parallel research |
| Debug complex race condition | NO | opus | Need full context, deep reasoning |
| Read error logs and extract failures | YES | haiku | Simple extraction task |

---

## Elegance Decision Tree

```
START: Implementation complete or in progress
│
├─ Is fix simple and obvious?
│  ├─ YES → Accept as-is, don't over-engineer
│  └─ NO → Continue evaluation
│
├─ Does fix feel hacky or brittle?
│  ├─ YES → DEMAND ELEGANCE
│  └─ NO → Continue evaluation
│
├─ Are you adding workarounds for workarounds?
│  ├─ YES → DEMAND ELEGANCE
│  └─ NO → Continue evaluation
│
├─ Is code getting messy/complex?
│  ├─ YES → DEMAND ELEGANCE
│  └─ NO → Continue evaluation
│
├─ Is duplication creeping in?
│  ├─ YES → DEMAND ELEGANCE
│  └─ NO → Continue evaluation
│
├─ Will future maintainability be questionable?
│  ├─ YES → DEMAND ELEGANCE
│  └─ NO → Continue evaluation
│
└─ Are there time constraints that outweigh elegance?
   ├─ YES → Accept temporary solution, ADD TODO
   └─ NO → Consider elegant refactor
```

### Elegance Triggers (PAUSE if you see these)

| Red Flag | Action |
|----------|--------|
| Copy-pasting code blocks | Extract to function/component |
| If/else chains > 3 levels deep | Use switch/polymorphism/lookup table |
| Function with 5+ parameters | Group into object/config |
| Global variables for state | Proper state management |
| Code you'll fear touching later | Refactor now while fresh |
| "This is a hack but..." | Ask "what's the elegant way?" |

### Elegance Examples

| Scenario | Demand Elegance? | Why |
|----------|------------------|-----|
| Simple null check | NO | Straightforward, no complexity |
| Nested try/catch blocks 4 levels deep | YES | Unreadable, unmaintainable |
| Adding 3rd instance of similar code | YES | Extract to reusable function |
| Temporary debug logging | NO | Will be removed soon |
| Workaround for workaround | YES | Fix root cause instead |
| Clear, readable solution | NO | Already elegant |
| "If I started over, I'd do X differently" | YES | Refactor to X while fresh |

---

## Verification Decision Tree

```
START: Task appears complete
│
├─ Can you prove it works RIGHT NOW?
│  ├─ NO → NOT DONE, run verification
│  └─ YES → Continue evaluation
│
├─ Are tests passing?
│  ├─ NO → NOT DONE, fix tests
│  └─ YES → Continue evaluation
│
├─ Have you checked logs for errors?
│  ├─ NO → NOT DONE, check logs
│  └─ YES (no errors) → Continue evaluation
│
├─ For bug fixes: Can you show before/after?
│  ├─ NO → NOT DONE, demonstrate fix
│  └─ YES → Continue evaluation
│
├─ For new features: Can you demo it working?
│  ├─ NO → NOT DONE, run demo
│  └─ YES → Continue evaluation
│
├─ Would a staff engineer approve this?
│  ├─ NO → NOT DONE, improve quality
│  └─ YES → Continue evaluation
│
├─ Have you provided FRESH verification evidence?
│  ├─ NO → NOT DONE, get fresh evidence
│  └─ YES → Task may be complete
│
└─ Are there edge cases to test?
   ├─ YES → NOT DONE, test edge cases
   └─ NO → TASK COMPLETE
```

### Verification Checklist by Task Type

#### Code Changes
- [ ] Code runs without errors
- [ ] Tests pass (unit + integration)
- [ ] Logs show no warnings
- [ ] Performance is acceptable
- [ ] Edge cases handled

#### Bug Fixes
- [ ] Can reproduce original bug
- [ ] Bug is now fixed (demonstrated)
- [ ] Regression tests added
- [ ] No new side effects
- [ ] Root cause documented

#### New Features
- [ ] Feature works as specified
- [ ] Test coverage adequate
- [ ] Error handling in place
- [ ] Documentation updated
- [ ] Security reviewed

---

## Autonomous Bug Fixing Decision Tree

```
START: Bug report received
│
├─ Can you understand error from message/logs?
│  ├─ NO → Ask user for clarification ONLY
│  └─ YES → Continue autonomously
│
├─ Can you find affected files with grep/search?
│  ├─ NO → Ask user for file locations ONLY
│  └─ YES → Continue autonomously
│
├─ Can you reproduce the bug?
│  ├─ NO → Try to reproduce from description
│  └─ YES → Continue to fix
│
├─ Can you identify root cause from code?
│  ├─ NO → Investigate further (logs, tests, trace)
│  └─ YES → Continue to fix
│
├─ Is fix obvious once you understand root cause?
│  ├─ YES → IMPLEMENT FIX autonomously
│  └─ NO → Continue evaluation
│
├─ Are there multiple valid approaches?
│  ├─ YES & architectural impact → Ask user to choose
│  └─ NO clear best approach → IMPLEMENT FIX autonomously
│
└─ After fix: Can you verify it works?
   ├─ YES → Verify and report
   └─ NO → Ask user for verification help ONLY
```

### When to Fix Autonomously vs. Ask

| Situation | Action | Why |
|-----------|--------|-----|
| Error message is clear | FIX IT | Self-explanatory |
| Can find files with grep | FIX IT | Standard debugging |
| Obvious null check needed | FIX IT | Simple fix |
| Missing import | FIX IT | Standard fix |
| Test failure with clear assertion | FIX IT | Error shows what's wrong |
| Multiple architectural approaches | ASK | Needs user decision |
| Requires domain knowledge | ASK | Don't guess business logic |
| Security implications unclear | ASK | Safety critical |
| Tried 3 approaches, all failed | ASK | Need fresh perspective |
| Error in external dependency | ASK | May need configuration/upgrade |

---

## Self-Improvement Decision Tree

```
START: Interaction with user
│
├─ Did user correct an error you made?
│  └─ YES → UPDATE lessons.md
│
├─ Did you make the same mistake twice?
│  └─ YES → UPDATE lessons.md
│
├─ Did user say "don't do that" or "always do this"?
│  └─ YES → UPDATE lessons.md
│
├─ Did you discover better approach after implementation?
│  └─ YES → UPDATE lessons.md
│
├─ Did user provide code quality/style feedback?
│  └─ YES → UPDATE lessons.md
│
└─ Did you misunderstand a requirement?
   └─ YES → UPDATE lessons.md
```

### Lesson Quality Criteria

A good lesson entry has:
- [ ] Specific description of what went wrong
- [ ] Root cause analysis (WHY it happened)
- [ ] Correct approach clearly stated
- [ ] Actionable rule for next time
- [ ] Trigger scenario (when to remember this)
- [ ] Relevant tags for easy search

### Lesson Review Triggers

Review lessons.md when:
- Starting new project
- Working with specific technology
- User mentions recurring issue
- Weekly review (consolidate/refine)
- Before major implementation tasks

---

## Combined Decision Matrix

| Scenario | Plan | Subagent | Elegance | Verify | Auto-Fix | Lessons |
|----------|------|----------|----------|--------|----------|---------|
| Simple bug fix | NO | NO | NO | YES | YES | If corrected |
| Add validation | NO | NO | NO | YES | YES | If corrected |
| Build auth system | YES | YES (research) | YES | YES | N/A | Always |
| Refactor messy code | MAYBE | NO | YES | YES | YES | If corrected |
| Research libraries | NO | YES | N/A | N/A | N/A | No |
| Debug race condition | YES | NO | MAYBE | YES | MAYBE | If corrected |
| Implement payment | YES | YES (research) | YES | YES | N/A | Always |
| Fix failing test | NO | YES (verify) | NO | YES | YES | If corrected |
| Migrate database | YES | YES (research) | YES | YES | N/A | Always |
| Update dependency | NO | NO | NO | YES | YES | If breaks |

---

## Quick Reference Flowchart

```
NEW TASK
   │
   ▼
[Is it trivial?]──YES──> Execute directly
   │                         │
   NO                        ▼
   │                    [Verify]──PASS──> Done
   ▼                         │
[Enter plan mode]           FAIL
   │                         │
   ▼                         ▼
[Need research?]──YES──> [Launch subagents (parallel)]
   │                         │
   NO                        │
   │                    [Synthesize findings]
   ▼                         │
[Implement]◄─────────────────┘
   │
   ▼
[Feels hacky?]──YES──> [Refactor to elegant]
   │                         │
   NO                        │
   │◄────────────────────────┘
   ▼
[Verify with fresh evidence]
   │
   ▼
[Document results]
   │
   ▼
[User corrections?]──YES──> [Update lessons.md]
   │                         │
   NO                        │
   │◄────────────────────────┘
   ▼
DONE
```

---

## Anti-Patterns to Avoid

| Anti-Pattern | Better Approach |
|--------------|-----------------|
| Start coding without plan (complex task) | Enter plan mode first |
| Keep pushing when stuck | Stop and re-plan |
| Clutter main context with research | Use subagents |
| Use opus for simple file reading | Use haiku subagent |
| Accept hacky solution without thought | Ask "is there an elegant way?" |
| Mark complete without testing | Run tests, provide evidence |
| Ask user to debug for you | Fix autonomously |
| Repeat same mistake | Update lessons.md |
| Launch subagents sequentially | Launch all in parallel |
| Over-engineer simple fixes | Keep it simple |

---

**Remember: Use this decision tree to build good habits. Over time, these decisions become automatic.**
