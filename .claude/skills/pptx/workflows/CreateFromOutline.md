# CreateFromOutline Workflow

## Overview

End-to-end workflow for creating branded PowerPoint presentations from Markdown outlines. Supports two engines (python-pptx for full control, Gamma.app for AI-assisted drafts) and two brands (CarbeneAI dark/neon, Professional white/navy).

## When to Use

- Creating presentations from scratch
- Converting written outlines to slides
- Generating branded decks for clients or internal use

## Prerequisites

- python-pptx installed: `pip3 install python-pptx`
- Master templates generated (run `python3 tools/create-templates.py` once)
- For Gamma engine: `GAMMA_API_KEY` in `${PAI_DIR}/.env`
- For image generation: Replicate API token configured in `${PAI_DIR}/.env`

## Step-by-Step

### 1. Write Your Outline

Create a Markdown file following the outline format (see `reference/OutlineFormat.md`):

```markdown
---
title: AI Security Strategy
subtitle: Board Presentation Q1 2026
author: Your Name
date: 2026-02-03
---

# Executive Summary
<!-- layout: section -->

## Current Threat Landscape
<!-- layout: content -->
- Ransomware attacks up 150% YoY
- AI-powered phishing emerging as top vector
- Supply chain attacks targeting SMBs

> Emphasize the urgency without creating panic

## Our Security Posture
<!-- layout: content-image -->
- Zero trust architecture deployed
- 24/7 SOC monitoring active
- Incident response plan tested quarterly

![image](auto)

## Key Metrics
<!-- layout: data -->
- MTTD: 4.2 hours (down from 18)
- MTTR: 2.1 hours (down from 12)
- False positive rate: 3.2%

## Thank You
<!-- layout: closing -->
```

### 2. Choose Your Engine

| Scenario | Engine | Command Flag |
|----------|--------|-------------|
| Quick draft / exploring ideas | Gamma | `--engine gamma` |
| Final board presentation | python-pptx | `--engine pptx` |
| Client pitch deck | Gamma then refine | `--engine gamma` |
| Data-heavy presentation | python-pptx | `--engine pptx` |
| Low on Gamma credits | python-pptx | `--engine pptx` |

### 3. Run the CLI

```bash
# Basic: python-pptx with professional brand
bun tools/CreatePresentation.ts --outline outline.md

# CarbeneAI branded with AI images
bun tools/CreatePresentation.ts \
  --outline outline.md \
  --brand carbeneai \
  --engine pptx \
  --generate-images \
  --output ~/Nextcloud/PAI/outputs/security-deck.pptx

# Quick Gamma draft
bun tools/CreatePresentation.ts \
  --outline outline.md \
  --engine gamma \
  --output draft.pptx

# Check Gamma credits
bun tools/CreatePresentation.ts --check-credits
```

### 4. Review Output

- Open the .pptx in LibreOffice or PowerPoint
- Check text fits within placeholders
- Verify images are properly placed (if generated)
- Review speaker notes

### 5. Iterate

- Edit the Markdown outline and re-run
- Switch brands or engines as needed
- Add/remove `![image](auto)` tags to control image generation

## Engine Comparison

| Feature | python-pptx | Gamma |
|---------|-------------|-------|
| Cost | Free | Credits (Plus plan) |
| Speed | Fast | ~30-60s per deck |
| Control | Full | AI decides layout |
| Offline | Yes | No |
| Image gen | Via Art skill | Built-in |
| Charts | Manual | AI-assisted |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Template not found | Run `python3 tools/create-templates.py` |
| Gamma API error | Check `GAMMA_API_KEY` in `.env` |
| Image generation fails | Check `REPLICATE_API_TOKEN` in `.env` |
| Text overflow | Reduce bullet text length, use fewer bullets |
