# Execute Workflow

Full 7-phase Algorithm execution with effort-appropriate depth for each phase.

## Purpose

Execute the complete Algorithm framework from OBSERVE through LEARN. This workflow provides the detailed structure for each phase, including inputs, actions, outputs, and exit criteria.

## Before Starting: Classify Effort

**First, determine the appropriate effort level for this task:**

| Level | Duration | When to Use |
|-------|----------|-------------|
| **TRIVIAL** | Minutes | Obvious solution, no unknowns, routine task |
| **SIMPLE** | ~1 hour | Clear path, minimal unknowns, straightforward |
| **MODERATE** | Few hours | Some unknowns, requires investigation |
| **COMPLEX** | 1+ days | Multiple unknowns, requires research/design |
| **DETERMINED** | Multi-day | Significant unknowns, deep investigation needed |

**This classification determines the depth applied to each phase.**

---

## Phase 1: OBSERVE

**Purpose:** Gather objective facts about the current state.

### Input
- Problem statement or task description
- Available context and background information

### Actions (by effort level)

**TRIVIAL:**
- Read the request
- Note key requirements

**SIMPLE:**
- Review problem statement carefully
- Identify explicit requirements
- Note any constraints mentioned

**MODERATE:**
- Thoroughly investigate current state
- Gather relevant data and metrics
- Review related documentation
- Identify stakeholders and their needs

**COMPLEX:**
- Comprehensive investigation of system
- Collect quantitative data (metrics, logs, benchmarks)
- Interview stakeholders for qualitative insights
- Review all relevant documentation and prior art
- Identify constraints (technical, business, regulatory)
- Map current system architecture/process

**DETERMINED:**
- All COMPLEX actions, plus:
- Multi-source data gathering
- Historical analysis of how we got here
- Competitive/market analysis
- Identify unknown unknowns (what don't we know?)
- Document assumptions for later testing

### Output
- **TRIVIAL:** 1-2 sentence summary of what needs to be done
- **SIMPLE:** Brief description of current state and requirements
- **MODERATE:** Detailed understanding of problem, metrics, and constraints
- **COMPLEX:** Comprehensive problem documentation with data, stakeholder needs, system context
- **DETERMINED:** Exhaustive analysis with quantified baselines, historical context, and identified knowledge gaps

### Exit Criteria
Can you describe the problem objectively without adding interpretation?
- **TRIVIAL:** Yes, it's obvious
- **SIMPLE:** Yes, requirements are clear
- **MODERATE:** Yes, with supporting data
- **COMPLEX:** Yes, with comprehensive context
- **DETERMINED:** Yes, with quantified baselines and identified unknowns

---

## Phase 2: THINK

**Purpose:** Analyze observations and develop understanding of causation.

### Input
- Observations from Phase 1

### Actions (by effort level)

**TRIVIAL:**
- Recognize the obvious solution

**SIMPLE:**
- Identify the straightforward approach
- Note any gotchas or edge cases

**MODERATE:**
- Analyze patterns in the data
- Form hypotheses about root causes
- Consider multiple approaches
- Evaluate trade-offs between approaches

**COMPLEX:**
- Deep analysis of root causes (use 5 Whys, fishbone, etc.)
- Generate multiple solution hypotheses
- Analyze each approach for pros/cons/risks
- Consider second-order effects
- Identify dependencies and constraints
- Model different scenarios

**DETERMINED:**
- All COMPLEX actions, plus:
- First principles analysis (can use FirstPrinciples skill)
- Challenge assumptions systematically
- Research best practices and prior art extensively
- Consult domain experts
- Build mental models and validate them
- Consider long-term implications (1-5 years)

### Output
- **TRIVIAL:** The obvious solution approach
- **SIMPLE:** Clear approach with main considerations noted
- **MODERATE:** Analyzed problem with recommended approach and alternatives
- **COMPLEX:** Comprehensive analysis with multiple solutions evaluated, trade-offs documented, recommendation with rationale
- **DETERMINED:** Deep understanding with first principles reasoning, challenged assumptions, multiple scenarios modeled, high-confidence recommendation

### Exit Criteria
Do you understand WHY things are the way they are?
- **TRIVIAL:** Yes, it's obvious
- **SIMPLE:** Yes, causation is clear
- **MODERATE:** Yes, with reasoned hypothesis
- **COMPLEX:** Yes, with validated analysis
- **DETERMINED:** Yes, with first principles understanding and tested assumptions

---

## Phase 3: PLAN

**Purpose:** Design the solution approach and create implementation roadmap.

### Input
- Understanding and approach from Phase 2

### Actions (by effort level)

**TRIVIAL:**
- Mental note of the 1-2 steps needed

**SIMPLE:**
- List the key steps (3-5 steps)
- Note any dependencies
- Estimate rough timeline

**MODERATE:**
- Detailed step-by-step plan
- Identify required resources
- Define success criteria
- Create timeline with milestones
- Identify risks and mitigation strategies

**COMPLEX:**
- Comprehensive implementation plan with phases
- Detailed resource requirements (time, people, tools, budget)
- Architectural design documents
- Success metrics (quantified)
- Risk register with mitigation plans
- Dependency map
- Rollback strategy
- Communication plan for stakeholders

**DETERMINED:**
- All COMPLEX actions, plus:
- Phased rollout plan (pilot → broader → full)
- Contingency plans for multiple failure modes
- Validation plan to test assumptions
- Decision points with go/no-go criteria
- Long-term maintenance and evolution strategy
- Documentation plan
- Knowledge transfer plan

### Output
- **TRIVIAL:** Mental checklist
- **SIMPLE:** Simple task list with order
- **MODERATE:** Detailed plan with timeline and success criteria
- **COMPLEX:** Comprehensive implementation plan with architecture, risks, resources, metrics
- **DETERMINED:** Multi-phase execution strategy with validation, contingencies, and long-term plan

### Exit Criteria
Could someone else execute this plan successfully?
- **TRIVIAL:** Yes, if they have basic skills
- **SIMPLE:** Yes, with the task list
- **MODERATE:** Yes, with the detailed plan
- **COMPLEX:** Yes, with the comprehensive documentation
- **DETERMINED:** Yes, with the full execution strategy and decision framework

---

## Phase 4: BUILD

**Purpose:** Create the solution components.

### Input
- Plan from Phase 3

### Actions (by effort level)

**TRIVIAL:**
- Execute the 1-2 commands/actions

**SIMPLE:**
- Implement the solution following the plan
- Basic error handling
- Simple validation

**MODERATE:**
- Implement solution with proper structure
- Comprehensive error handling
- Input validation
- Logging for debugging
- Unit tests for key functionality
- Code review (self or peer)

**COMPLEX:**
- All MODERATE actions, plus:
- Modular, maintainable architecture
- Comprehensive test suite (unit, integration)
- Security considerations implemented
- Performance optimization
- Documentation (inline comments, README)
- Configuration management
- Monitoring and alerting setup

**DETERMINED:**
- All COMPLEX actions, plus:
- Production-grade implementation
- Extensive test coverage (unit, integration, e2e, load)
- Security audit and hardening
- Performance benchmarking and optimization
- Comprehensive documentation (architecture, API, operations)
- Disaster recovery procedures
- Observability (metrics, logs, traces)
- Infrastructure as code
- Automated deployment pipeline

### Output
- **TRIVIAL:** Working solution (no documentation needed)
- **SIMPLE:** Working solution with basic comments
- **MODERATE:** Well-structured solution with tests and documentation
- **COMPLEX:** Production-ready solution with comprehensive tests, docs, monitoring
- **DETERMINED:** Battle-tested solution with enterprise-grade quality, security, observability

### Exit Criteria
Does the solution exist and is it ready for the next phase?
- **TRIVIAL:** Yes, it runs
- **SIMPLE:** Yes, it works in basic tests
- **MODERATE:** Yes, unit tests pass and it's documented
- **COMPLEX:** Yes, all tests pass and it's production-ready
- **DETERMINED:** Yes, exceeds production requirements with comprehensive validation

---

## Phase 5: EXECUTE

**Purpose:** Deploy and run the solution in the target environment.

### Input
- Built solution from Phase 4

### Actions (by effort level)

**TRIVIAL:**
- Run the command in the target environment

**SIMPLE:**
- Deploy to target environment
- Verify basic functionality
- Monitor for immediate errors

**MODERATE:**
- Deploy following deployment checklist
- Smoke test critical paths
- Monitor metrics during initial operation
- Verify integration points
- Communicate deployment to stakeholders

**COMPLEX:**
- Phased rollout (dev → staging → production)
- Comprehensive testing at each phase
- Canary deployment or blue/green deployment
- Monitor all critical metrics
- Have rollback plan ready
- Stakeholder communication plan executed
- On-call rotation in place

**DETERMINED:**
- All COMPLEX actions, plus:
- Pilot phase with subset of users/traffic
- Gradual rollout with validation gates
- Real-time monitoring dashboard
- Automated rollback triggers
- Incident response team on standby
- Customer communication prepared
- Post-deployment validation checklist

### Output
- **TRIVIAL:** Solution running
- **SIMPLE:** Solution deployed and operational
- **MODERATE:** Solution in production with monitoring active
- **COMPLEX:** Solution fully deployed with comprehensive monitoring and support
- **DETERMINED:** Solution deployed with validated success, rollback capability, and full observability

### Exit Criteria
Is the solution running in the target environment and handling real work?
- **TRIVIAL:** Yes, it executed
- **SIMPLE:** Yes, it's running
- **MODERATE:** Yes, it's operational and monitored
- **COMPLEX:** Yes, it's in production with healthy metrics
- **DETERMINED:** Yes, validated at scale with proven stability

---

## Phase 6: VERIFY

**Purpose:** Confirm the solution meets requirements and objectives.

### Input
- Executing solution from Phase 5

### Actions (by effort level)

**TRIVIAL:**
- Quick check that it worked

**SIMPLE:**
- Test the primary functionality
- Verify expected output
- Check for obvious errors

**MODERATE:**
- Test all key use cases
- Compare results to success criteria
- Check performance metrics
- Verify edge cases
- Gather initial user feedback

**COMPLEX:**
- Comprehensive testing against all requirements
- Quantitative metrics vs. success criteria
- Performance benchmarking
- Security validation
- User acceptance testing
- Load/stress testing
- Regression testing
- A/B testing (if applicable)

**DETERMINED:**
- All COMPLEX actions, plus:
- Long-term stability testing (days/weeks)
- Extensive user feedback program
- Statistical significance testing
- Business metrics impact measurement
- Security audit/penetration testing
- Compliance verification
- Competitor benchmarking
- Total cost of ownership analysis

### Output
- **TRIVIAL:** It worked
- **SIMPLE:** Primary functionality verified
- **MODERATE:** All requirements met, metrics healthy
- **COMPLEX:** Comprehensive validation passed, success criteria exceeded
- **DETERMINED:** Proven at scale, business impact measured, long-term success validated

### Exit Criteria
Does the solution meet all requirements and success criteria?
- **TRIVIAL:** Yes, obviously
- **SIMPLE:** Yes, basic tests pass
- **MODERATE:** Yes, all tests pass and metrics are good
- **COMPLEX:** Yes, comprehensive validation confirms success
- **DETERMINED:** Yes, proven over time with measured business impact

---

## Phase 7: LEARN

**Purpose:** Extract insights and improve future performance.

### Input
- Results and data from Phase 6

### Actions (by effort level)

**TRIVIAL:**
- Mental note of what worked

**SIMPLE:**
- Note what worked and what didn't
- Identify one key learning

**MODERATE:**
- Document approach and results
- Identify lessons learned
- Note improvements for next time
- Update relevant documentation
- Share insights with team

**COMPLEX:**
- Comprehensive post-mortem/retrospective
- Document detailed lessons learned
- Identify process improvements
- Update playbooks and standards
- Create reusable components/patterns
- Share knowledge broadly (blog post, presentation)
- Update training materials

**DETERMINED:**
- All COMPLEX actions, plus:
- Formal case study documentation
- Extract generalizable principles
- Update organizational standards
- Create training program from learnings
- Publish externally (blog, conference, paper)
- Mentor others using these insights
- Measure long-term impact of learnings

### Output
- **TRIVIAL:** Mental note
- **SIMPLE:** 1-paragraph summary of learnings
- **MODERATE:** Documented lessons and improvements
- **COMPLEX:** Comprehensive retrospective with actionable improvements and knowledge artifacts
- **DETERMINED:** Case study, updated standards, training materials, published insights

### Exit Criteria
Have you captured the key insights so they won't be forgotten?
- **TRIVIAL:** Yes, I'll remember
- **SIMPLE:** Yes, noted in task/ticket
- **MODERATE:** Yes, documented in project retrospective
- **COMPLEX:** Yes, captured in knowledge base and shared with team
- **DETERMINED:** Yes, formalized in organizational standards and training

---

## Complete Output Template

```markdown
# Algorithm Execution: [Task Name]

**Effort Classification:** [TRIVIAL / SIMPLE / MODERATE / COMPLEX / DETERMINED]
**Started:** [Date/time]
**Completed:** [Date/time]

---

## 1. OBSERVE

### Current State
[What exists now? What are the facts?]

### Requirements
[What needs to be done? What are the constraints?]

### Data Gathered
[Metrics, measurements, stakeholder input]

### Context
[Background, history, why now?]

---

## 2. THINK

### Analysis
[What patterns do we see? What's the root cause?]

### Hypotheses
[What approaches could work?]

### Evaluation
[Pros/cons of each approach]

### Recommendation
[Chosen approach and why]

---

## 3. PLAN

### Approach
[High-level solution strategy]

### Steps
1. [Step 1]
2. [Step 2]
...

### Resources Required
[Time, people, tools, budget]

### Success Criteria
[How will we know it worked?]

### Risks & Mitigation
[What could go wrong? How will we handle it?]

### Timeline
[Key milestones]

---

## 4. BUILD

### Implementation Summary
[What was built]

### Key Components
- [Component 1]
- [Component 2]

### Technical Decisions
[Important choices made and why]

### Testing Approach
[How it was validated]

---

## 5. EXECUTE

### Deployment Approach
[How it was rolled out]

### Monitoring
[What was watched during deployment]

### Issues Encountered
[Any problems during execution]

### Resolution
[How issues were handled]

---

## 6. VERIFY

### Test Results
[Did it work as intended?]

### Metrics
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| [Metric 1] | [Target] | [Result] | ✅/❌ |

### User Feedback
[What did users say?]

### Overall Assessment
[Success? Partial? Failed?]

---

## 7. LEARN

### What Worked Well
- [Success 1]
- [Success 2]

### What Didn't Work
- [Challenge 1]
- [Challenge 2]

### Key Insights
1. [Learning 1]
2. [Learning 2]
3. [Learning 3]

### Improvements for Next Time
- [Improvement 1]
- [Improvement 2]

### Knowledge Artifacts Created
- [Documentation updated]
- [Playbook created]
- [Training material]

---

## Summary

**Status:** [Complete / Partial / Failed]
**Outcome:** [Brief description of result]
**Next Steps:** [What comes next, if anything]
```

## Tips for Effective Execution

1. **Don't skip phases:** Each builds on the previous. Jumping ahead creates gaps.

2. **Match depth to effort:** Don't over-engineer TRIVIAL tasks or under-engineer COMPLEX ones.

3. **Exit criteria matter:** Don't proceed until current phase is truly complete.

4. **Document as you go:** Don't try to reconstruct after the fact.

5. **LEARN is not optional:** This is where compound growth comes from.

6. **Use tools appropriately:**
   - OBSERVE: Research skill, data analysis
   - THINK: FirstPrinciples skill for challenging assumptions
   - BUILD: test-driven-development skill
   - VERIFY: systematic-debugging skill if issues found

7. **Iterate when needed:** Algorithm can loop (VERIFY → OBSERVE for round 2).

## Success Indicators

You're using Algorithm effectively when:
- ✅ You rarely skip steps or phases
- ✅ You adjust rigor based on task complexity
- ✅ You document learnings consistently
- ✅ Your success rate on complex tasks increases
- ✅ You can explain your reasoning at each phase
- ✅ Others can follow your work easily

## Common Pitfalls

❌ **Premature implementation:** Jumping to BUILD before understanding (OBSERVE/THINK)
❌ **Analysis paralysis:** Spending DETERMINED effort on SIMPLE tasks
❌ **Skipping verification:** Assuming it works without testing
❌ **Forgetting to learn:** Missing the opportunity to improve
❌ **Inconsistent depth:** Using COMPLEX rigor for one phase, TRIVIAL for another
