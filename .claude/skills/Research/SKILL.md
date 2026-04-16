---
name: research
description: Comprehensive research, analysis, and content extraction system. Multi-source parallel research using available researcher agents. Deep content analysis with extended thinking. Intelligent retrieval for difficult sites. Fabric pattern selection for 242+ specialized prompts. USE WHEN user says 'do research', 'extract wisdom', 'analyze content', 'find information about', or requests web/content research.
---

# Research Skill

## API Keys Required

**This skill works best with these optional API keys configured in `~/.env`:**

| Feature | API Key | Get It From |
|---------|---------|-------------|
| Perplexity Research | `PERPLEXITY_API_KEY` | https://perplexity.ai/settings/api |
| Gemini Research | `GOOGLE_API_KEY` | https://aistudio.google.com/app/apikey |
| BrightData Scraping | `BRIGHTDATA_API_KEY` | https://brightdata.com |

**Works without API keys:**
- Claude-based research (uses built-in WebSearch)
- Basic web fetching (uses built-in WebFetch)
- Fabric patterns (if Fabric CLI installed)

---

## Workflow Routing

### Multi-Source Research Workflows

**When user requests comprehensive parallel research:**
Examples: "do research on X", "research this topic", "find information about Y", "investigate this subject"
→ **READ:** `${PAI_DIR}/skills/research/workflows/conduct.md`
→ **EXECUTE:** Parallel multi-agent research using available researcher agents

**When user requests Claude-based research (FREE - no API keys):**
Examples: "use claude for research", "claude research on X", "use websearch to research Y"
→ **READ:** `${PAI_DIR}/skills/research/workflows/claude-research.md`
→ **EXECUTE:** Intelligent query decomposition with Claude's WebSearch

**When user requests Perplexity research (requires PERPLEXITY_API_KEY):**
Examples: "use perplexity to research X", "perplexity research on Y"
→ **READ:** `${PAI_DIR}/skills/research/workflows/perplexity-research.md`
→ **EXECUTE:** Fast web search with query decomposition via Perplexity API

**When user requests interview preparation:**
Examples: "prepare interview questions for X", "interview research on Y"
→ **READ:** `${PAI_DIR}/skills/research/workflows/interview-research.md`
→ **EXECUTE:** Interview prep with diverse question generation

### Content Retrieval Workflows

**When user indicates difficulty accessing content:**
Examples: "can't get this content", "site is blocking me", "CAPTCHA blocking"
→ **READ:** `${PAI_DIR}/skills/research/workflows/retrieve.md`
→ **EXECUTE:** Escalation through layers (WebFetch → BrightData → Apify)

**When user provides YouTube URL:**
Examples: "get this youtube video", "extract from youtube URL"
→ **READ:** `${PAI_DIR}/skills/research/workflows/youtube-extraction.md`
→ **EXECUTE:** YouTube content extraction using fabric -y

**When user requests web scraping:**
Examples: "scrape this site", "extract data from this website"
→ **READ:** `${PAI_DIR}/skills/research/workflows/web-scraping.md`
→ **EXECUTE:** Web scraping techniques and tools

### Fabric Pattern Processing

**When user requests Fabric pattern usage:**
Examples: "use fabric to X", "create threat model", "summarize with fabric"
→ **READ:** `${PAI_DIR}/skills/research/workflows/fabric.md`
→ **EXECUTE:** Auto-select best pattern from 242+ Fabric patterns

### Content Enhancement Workflows

**When user requests content enhancement:**
Examples: "enhance this content", "improve this draft"
→ **READ:** `${PAI_DIR}/skills/research/workflows/enhance.md`
→ **EXECUTE:** Content improvement and refinement

**When user requests knowledge extraction:**
Examples: "extract knowledge from X", "get insights from this"
→ **READ:** `${PAI_DIR}/skills/research/workflows/extract-knowledge.md`
→ **EXECUTE:** Knowledge extraction and synthesis

---

## Multi-Source Research

### Three Research Modes

**QUICK RESEARCH MODE:**
- User says "quick research" → Launch 1 agent per researcher type
- **Timeout: 2 minutes**
- Best for: Simple queries, straightforward questions

**STANDARD RESEARCH MODE (Default):**
- Default for most research requests → Launch 3 agents per researcher type
- **Timeout: 3 minutes**
- Best for: Most research needs, comprehensive coverage

**EXTENSIVE RESEARCH MODE:**
- User says "extensive research" → Launch 8 agents per researcher type
- **Timeout: 10 minutes**
- Best for: Deep-dive research, comprehensive reports

### Available Research Agents

Check `${PAI_DIR}/agents/` for agents with "researcher" in their name:
- `claude-researcher` - Uses Claude's WebSearch (FREE, no API key needed)
- `perplexity-researcher` - Uses Perplexity API (requires PERPLEXITY_API_KEY)
- `gemini-researcher` - Uses Gemini API (requires GOOGLE_API_KEY)
- `grok-researcher` - Uses xAI Grok API (requires XAI_API_KEY)
- `ollama-researcher` - Uses local Ollama models (FREE, requires Ollama server)

---

## AI Model Selection Guide

**Use this guide to select the optimal researcher for each task type.**

### Quick Reference Table

| Model | Best For | Strengths | Limitations |
|-------|----------|-----------|-------------|
| **Claude** | Deep reading, long documents | 200K+ context, nuanced analysis, citations | Conservative style |
| **Perplexity** | Verified research, fact-checking | Real-time web, verified sources, citations | Weak at creative writing |
| **Gemini** | Google Workspace, team collaboration | Deep Google integration, structured output | Dependent on Google ecosystem |
| **Grok** | Real-time trends, social sentiment | Real-time X/Twitter insights, humor | Not ideal for formal work |
| **ChatGPT** | Creative content, coding workflows | Multimodal, creative, advanced reasoning | Can hallucinate creative facts |

### Detailed Model Profiles

#### Claude (claude-researcher)
- **Best For:** Deep reading & comprehension
- **Use Cases:** Reviewing long reports, contracts, technical documents, research papers
- **Strengths:** Handles 200K+ tokens, excellent for long-form analysis, balanced citations
- **Response Style:** Balanced, thorough, with citations
- **Best For Professionals:** Lawyers, analysts, researchers, technical writers
- **Limitations:** Conservative style, may be overly cautious
- **Pro Tip:** Use for refining drafts and adding proper citations

#### Perplexity (perplexity-researcher)
- **Best For:** Verified research & fact-checking
- **Use Cases:** Accurate data inquiries, citation-heavy research, current events
- **Strengths:** Real-time web access, verified sources, automatic citations
- **Response Style:** Factual, source-linked, academic
- **Best For Professionals:** Lawyers, analysts, researchers, journalists
- **Limitations:** Weak at creative writing, less conversational
- **Pro Tip:** Use when you need every claim backed by a source

#### Gemini (gemini-researcher)
- **Best For:** Google Workspace integration & structured research
- **Use Cases:** Docs/Sheets planning, team collaboration, real-time research
- **Strengths:** Deep Google integration, precise structured output
- **Response Style:** Neutral, structured, precise
- **Best For Professionals:** Teams using Google Workspace, project managers
- **Limitations:** Dependent on Google ecosystem
- **Pro Tip:** Use for team collaboration and Google-integrated workflows

#### Grok (grok-researcher)
- **Best For:** Real-time trends & pop culture
- **Use Cases:** Tracking trends, social sentiment analysis, viral content
- **Strengths:** Real-time X/Twitter insights, humorous tone, unfiltered
- **Response Style:** Sarcastic, bold, edgy
- **Best For Professionals:** Social media analysts, trend developers, marketers
- **Limitations:** Not ideal for formal or professional work
- **Pro Tip:** Use for viral commentary and social media pulse checks

#### ChatGPT (via OpenAI API if configured)
- **Best For:** Creative content & coding workflows
- **Use Cases:** Writing, brainstorming, coding assistance, multimodal tasks
- **Strengths:** Multimodal capabilities, creative output, advanced reasoning
- **Response Style:** Friendly, creative, informative
- **Best For Professionals:** Marketers, writers, programmers, content creators
- **Limitations:** Can hallucinate creative facts
- **Pro Tip:** Build custom GPT workflows for specialized tasks

### Task-to-Model Routing

**PAI should auto-select based on these patterns:**

| Task Type | Primary Model | Fallback |
|-----------|---------------|----------|
| Legal document review | Claude | Perplexity |
| Fact-checking claims | Perplexity | Claude |
| Current events/news | Perplexity | Grok |
| Social media trends | Grok | Perplexity |
| Long report analysis | Claude | Gemini |
| Creative writing | Claude | - |
| Technical documentation | Claude | Perplexity |
| Market research | Perplexity | Gemini |
| Competitor analysis | Perplexity | Claude |
| Code research | Claude | Perplexity |
| Google Workspace tasks | Gemini | Claude |
| Viral content analysis | Grok | Perplexity |
| Academic research | Perplexity | Claude |
| Contract review | Claude | Perplexity |

### Multi-Model Research Strategy

**For comprehensive research, combine models strategically:**

1. **Quick Facts:** Start with Perplexity for verified baseline
2. **Deep Analysis:** Use Claude for synthesizing and long-form analysis
3. **Current Trends:** Add Grok for real-time social sentiment
4. **Structured Output:** Use Gemini for tables and Google-integrated deliverables

### Speed Benefits

- ❌ **Old approach**: Sequential searches → 5-10 minutes
- ✅ **Quick mode**: 1 agent per type → **2 minute timeout**
- ✅ **Standard mode**: 3 agents per type → **3 minute timeout**
- ✅ **Extensive mode**: 8 agents per type → **10 minute timeout**

---

## Intelligent Content Retrieval

### Three-Layer Escalation System

**Layer 1: Built-in Tools (Try First - FREE)**
- WebFetch - Standard web content fetching
- WebSearch - Search engine queries
- When to use: Default for all content retrieval

**Layer 2: BrightData MCP (requires BRIGHTDATA_API_KEY)**
- CAPTCHA solving via Scraping Browser
- Advanced JavaScript rendering
- When to use: Bot detection blocking, CAPTCHA protection

**Layer 3: Apify MCP (requires Apify account)**
- Specialized site scrapers (Instagram, LinkedIn, etc.)
- Complex extraction logic
- When to use: Layers 1 and 2 both failed

**Critical Rules:**
- Always try simplest approach first (Layer 1)
- Escalate only when previous layer fails
- Document which layers were used and why

---

## Fabric Pattern Selection

### Categories (242+ Patterns)

**Threat Modeling & Security:**
- `create_threat_model`, `create_stride_threat_model`
- `analyze_threat_report`, `analyze_incident`

**Summarization:**
- `summarize`, `create_5_sentence_summary`
- `summarize_meeting`, `summarize_paper`, `youtube_summary`

**Wisdom Extraction:**
- `extract_wisdom`, `extract_article_wisdom`
- `extract_insights`, `extract_main_idea`

**Analysis:**
- `analyze_claims`, `analyze_code`, `analyze_debate`
- `analyze_logs`, `analyze_paper`

**Content Creation:**
- `create_prd`, `create_design_document`
- `create_mermaid_visualization`, `create_user_story`

**Improvement:**
- `improve_writing`, `improve_prompt`, `review_code`

### Usage

```bash
# Auto-select pattern based on intent
fabric [input] -p [selected_pattern]

# From URL
fabric -u "URL" -p [pattern]

# From YouTube
fabric -y "YOUTUBE_URL" -p [pattern]
```

---

## File Organization

### Working Directory (Scratchpad)
```
${PAI_DIR}/scratchpad/YYYY-MM-DD-HHMMSS_research-[topic]/
├── raw-outputs/
├── synthesis-notes.md
└── draft-report.md
```

### Permanent Storage (History)
```
${PAI_DIR}/history/research/YYYY-MM/YYYY-MM-DD_[topic]/
├── README.md
├── research-report.md
└── metadata.json
```

---

## Key Principles

1. **Parallel execution** - Launch multiple agents simultaneously
2. **Hard timeouts** - Don't wait indefinitely, proceed with partial results
3. **Simplest first** - Always try free tools before paid services
4. **Auto-routing** - Skill analyzes intent and activates appropriate workflow

---

## Workflow Files

| Workflow | File | API Keys Needed |
|----------|------|-----------------|
| Multi-Source Research | `workflows/conduct.md` | Varies by agent |
| Claude Research | `workflows/claude-research.md` | None (FREE) |
| Perplexity Research | `workflows/perplexity-research.md` | PERPLEXITY_API_KEY |
| Interview Prep | `workflows/interview-research.md` | None |
| Content Retrieval | `workflows/retrieve.md` | Optional: BRIGHTDATA_API_KEY |
| YouTube Extraction | `workflows/youtube-extraction.md` | None (uses Fabric) |
| Web Scraping | `workflows/web-scraping.md` | Optional: BRIGHTDATA_API_KEY |
| Fabric Patterns | `workflows/fabric.md` | None |
| Content Enhancement | `workflows/enhance.md` | None |
| Knowledge Extraction | `workflows/extract-knowledge.md` | None |
