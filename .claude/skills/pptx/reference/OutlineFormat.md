# Markdown Outline Format Specification

## Overview

Presentations are defined using Markdown with YAML frontmatter. The orchestrator parses this format into structured JSON for the presentation engines.

## Structure

```markdown
---
title: Presentation Title
subtitle: Optional Subtitle
author: Author Name
date: YYYY-MM-DD
brand: carbeneai|professional
---

# Section Title
<!-- layout: section -->

## Slide Title
<!-- layout: content | content-image | data -->
- Bullet point one
- Bullet point two

> Speaker notes in blockquotes

![image](auto)
![image](path/to/image.png)
```

## Frontmatter (YAML)

Required between `---` delimiters at the top of the file.

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `title` | Yes | - | Presentation title (appears on title slide) |
| `subtitle` | No | "" | Subtitle text |
| `author` | No | "Clint Garrison" | Author name for metadata |
| `date` | No | Today | Date string |
| `brand` | No | "professional" | Can be overridden by CLI `--brand` flag |

## Headings

| Markdown | Layout | Description |
|----------|--------|-------------|
| `# Heading` | section | Section divider slide |
| `## Heading` | content | Standard content slide |

## Layout Override

Use HTML comments to override the default layout:

```markdown
<!-- layout: title -->
<!-- layout: section -->
<!-- layout: content -->
<!-- layout: content-image -->
<!-- layout: data -->
<!-- layout: closing -->
```

Place the comment immediately after the heading.

## Content Elements

### Bullets
```markdown
- First bullet point
- Second bullet point
- Third bullet point
```

### Speaker Notes
```markdown
> These become speaker notes
> Multiple blockquote lines are joined
```

### Images
```markdown
![image](auto)              <!-- Generate with AI -->
![image](path/to/file.png)  <!-- Use existing file -->
```

- `auto` triggers AI image generation via Art skill
- File paths are relative to the outline file's directory
- Images are placed in the right column of `content-image` layouts

## Automatic Slides

- **Title slide**: Auto-generated from frontmatter (always first)
- **Closing slide**: Auto-generated if not explicitly defined (always last)

## Example: Complete Outline

```markdown
---
title: CarbeneAI Security Advisory
subtitle: Quarterly Review Q1 2026
author: Clint Garrison
date: 2026-02-03
brand: carbeneai
---

# Threat Landscape
<!-- layout: section -->

## Ransomware Trends
<!-- layout: content-image -->
- 150% increase in attacks YoY
- Healthcare and finance most targeted
- Average ransom demand: $4.5M

> Focus on the sectors relevant to the client's industry

![image](auto)

## Security Metrics
<!-- layout: data -->
- MTTD: 4.2 hours
- MTTR: 2.1 hours
- Incidents prevented: 847
- False positive rate: 3.2%

> These metrics show significant improvement from last quarter

# Recommendations
<!-- layout: section -->

## Immediate Actions
<!-- layout: content -->
- Deploy EDR across all endpoints
- Enable MFA on all privileged accounts
- Conduct tabletop exercise this quarter

## Contact
<!-- layout: closing -->
```
