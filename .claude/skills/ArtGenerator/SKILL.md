---
name: ArtGenerator
description: AI image generation for blog posts, presentations, and content creation. USE WHEN user mentions generate image, create artwork, blog image, header image, presentation visual, AI art, Replicate, DALL-E, Midjourney, OR wants visual content for publications and marketing materials.
---

# ArtGenerator

Professional AI image generation for blog posts, presentations, marketing materials, and content creation. The ArtGenerator skill creates detailed prompts optimized for AI image generation tools (Replicate, DALL-E, Midjourney, Stable Diffusion) with a focus on CarbeneAI's signature aesthetic.

## Core Purpose

Generate high-quality images for:
- **Blog headers and featured images**
- **Social media posts**
- **Presentation slides**
- **Marketing materials**
- **Technical documentation**
- **Website hero images**

## CarbeneAI Aesthetic

**Signature style:** Dark, futuristic, professional with neon accents

**Visual DNA:**
- **Dark backgrounds:** #0a0a0f (deep space black)
- **Neon accents:** Cyan (#00D4FF), Magenta (#FF00FF), Purple (#9D4EDD)
- **Glass morphism:** Translucent panels with blur effects
- **Tron aesthetic:** Glowing lines, geometric patterns, grid overlays
- **Hand-drawn feel:** Excalidraw-style sketch elements mixed with polished UI
- **Technical vibe:** Code snippets, terminal windows, architecture diagrams

**Typography:**
- **Headers:** Orbitron (geometric, futuristic)
- **Body:** Inter or system fonts (clean, readable)

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **GenerateImage** | "generate image", "create blog header", "make artwork" | `workflows/GenerateImage.md` |
| **TechnicalDiagram** | "architecture diagram", "technical visual", "system diagram" | `workflows/TechnicalDiagram.md` |

## Supported Image Generation Tools

### Replicate (Recommended)
**Best for:** Production use, API integration, diverse models

**Models available:**
- **Flux 1.1 Pro** - Highest quality, photorealistic
- **Stable Diffusion XL** - Fast, versatile, good balance
- **Playground v2.5** - Artistic, vibrant colors
- **SDXL Lightning** - Ultra-fast generation

**API setup:**
```bash
# In PAI .env file
REPLICATE_API_TOKEN=your_token_here
```

**Usage:**
```bash
# Via API
curl -X POST https://api.replicate.com/v1/predictions \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"version": "MODEL_ID", "input": {"prompt": "..."}}'
```

### DALL-E 3 (OpenAI)
**Best for:** Photorealistic images, following complex instructions

**Strengths:**
- Excellent at understanding detailed prompts
- Great for realistic scenes and people
- Strong safety guardrails

**Limitations:**
- More expensive than alternatives
- Slower generation
- Less control over style

### Midjourney
**Best for:** Artistic, cinematic images

**Strengths:**
- Beautiful artistic style
- Great for fantasy/sci-fi
- Vibrant colors and composition

**Limitations:**
- Discord-only interface (no API)
- Less control over technical details
- Requires manual workflow

### Stable Diffusion (Local)
**Best for:** Full control, privacy, no API costs

**Strengths:**
- Free and unlimited
- Complete control over model and parameters
- Runs locally (no data sent to cloud)

**Limitations:**
- Requires GPU (M1/M2 Mac or NVIDIA GPU)
- Setup complexity
- Slower than cloud APIs

## Image Types and Use Cases

### 1. Blog Headers
**Dimensions:** 1200x630px (standard social media preview)
**Style:** Eye-catching, readable, professional
**Elements:** Title text overlay area, focal point off-center

**Example prompt:**
```
Dark futuristic blog header, deep space black background (#0a0a0f),
glowing cyan and magenta neon accents, abstract AI neural network
visualization, glass morphism panels, Tron-style grid, geometric
shapes, professional and modern, no text, 1200x630 aspect ratio
```

### 2. Social Media Posts
**Dimensions:**
- Twitter/X: 1200x675px
- LinkedIn: 1200x627px
- Instagram: 1080x1080px (square)

**Style:** Bold, high-contrast, attention-grabbing
**Elements:** Strong focal point, readable at small sizes

### 3. Presentation Slides
**Dimensions:** 1920x1080px (16:9)
**Style:** Clean, minimal, supports text overlays
**Elements:** Plenty of negative space for text

### 4. Technical Diagrams
**Dimensions:** Variable (typically 1600x1200px)
**Style:** Clean, professional, easy to understand
**Elements:** Flowcharts, system diagrams, architecture visualizations

### 5. Hero Images
**Dimensions:** 1920x1080px or wider
**Style:** Cinematic, professional, brand-aligned
**Elements:** Wide aspect ratio, dramatic lighting

## Prompt Engineering Patterns

### Basic Structure
```
[Subject] in [style], [color palette], [mood/feeling], [technical details]
```

### CarbeneAI Pattern
```
[Subject], dark background (#0a0a0f), neon cyan and magenta accents,
glass morphism, Tron aesthetic, futuristic, professional,
[specific elements], no text, [aspect ratio]
```

### Technical Diagram Pattern
```
[System/architecture diagram], clean and minimal, dark theme,
glowing connection lines (cyan), geometric shapes, professional
technical illustration, clear hierarchy, [specific components]
```

### Advanced Modifiers

**Quality boosters:**
- "highly detailed"
- "professional photography"
- "8K resolution"
- "cinematic lighting"

**Style guides:**
- "in the style of [artist/aesthetic]"
- "cyberpunk aesthetic"
- "minimalist design"
- "hand-drawn sketch"

**Composition:**
- "rule of thirds"
- "centered composition"
- "wide angle"
- "close-up"

**Negative prompts** (what to avoid):
- "no text, no watermarks, no people" (if not wanted)
- "no clutter, no chaos"
- "not photorealistic" (if wanting illustration)

## Integration with Content Workflows

### Blog Post Workflow
1. **Write post** (or have AI write it)
2. **Extract key concept** (main theme of post)
3. **Generate header image** (via ArtGenerator skill)
4. **Add to post** (insert image in Markdown)
5. **Publish**

### Social Media Workflow
1. **Create content** (text, article link)
2. **Generate social image** (optimized for platform)
3. **Add text overlay** (if needed, using Figma/Canva)
4. **Schedule post**

### Presentation Workflow
1. **Outline presentation**
2. **Identify slide needing visuals**
3. **Generate supporting images**
4. **Add to slides** (with text overlays)

## Quality Checklist

Before finalizing any generated image:

✅ **Brand alignment:** Matches CarbeneAI aesthetic (dark, neon, futuristic)
✅ **Purpose fit:** Appropriate for use case (blog vs. social vs. presentation)
✅ **Resolution:** High enough for intended use (no pixelation)
✅ **Composition:** Visual hierarchy supports content
✅ **Text space:** Enough negative space for text overlays (if needed)
✅ **Accessibility:** Sufficient contrast for readability
✅ **Originality:** Not obviously derivative or cliché

## Common Image Needs

### For Technology Blog Posts
**Topics:** AI, cybersecurity, infrastructure, cloud, DevOps

**Visual themes:**
- Neural networks and AI concepts
- Security locks and shields
- Cloud infrastructure and servers
- Code and terminal windows
- Data flows and pipelines

### For Business/Consulting Content
**Topics:** Strategy, leadership, transformation, advisory

**Visual themes:**
- Executive silhouettes
- Strategic planning boards
- Organizational networks
- Growth and progress visualizations
- Meeting and collaboration scenes

### For Technical Documentation
**Topics:** Architecture, system design, APIs, databases

**Visual themes:**
- System architecture diagrams
- Flowcharts and processes
- API endpoint visualizations
- Database schema diagrams
- Network topology maps

## Examples

**Example 1: Blog header for "First Principles Thinking" article**

```
User: "Generate a blog header image for my article on first principles thinking"

→ Activates ArtGenerator skill
→ GenerateImage workflow

Context analysis:
- Article topic: First principles (breaking down to fundamentals)
- Visual concept: Deconstruction, building blocks, foundation
- Style: Professional, thought-provoking

Generated prompt:
"Abstract visualization of first principles thinking, dark space black
background (#0a0a0f), complex structure deconstructing into simple
geometric primitives, glowing cyan and magenta neon outlines, glass
morphism layers peeling away, Tron-style grid at foundation level,
professional and intellectual, no text, 1200x630 aspect ratio, highly
detailed, cinematic lighting"

Model recommendation: Flux 1.1 Pro (best for abstract concepts)

Output: High-quality blog header ready for use
```

**Example 2: Presentation slide background for security talk**

```
User: "I need a background image for my cybersecurity presentation slide"

→ Activates ArtGenerator skill
→ GenerateImage workflow

Context analysis:
- Use case: Presentation background (needs text overlay space)
- Topic: Cybersecurity
- Requirements: Not too busy, professional

Generated prompt:
"Minimalist cybersecurity background, deep black (#0a0a0f), subtle
cyan glowing circuit patterns in corners, abstract shield icon
suggestion (very subtle), clean and professional, 80% negative space
for text overlay, 1920x1080 aspect ratio, no text, no obvious symbols"

Model recommendation: SDXL Lightning (fast, clean results)

Output: Clean background suitable for presentation text
```

**Example 3: Technical architecture diagram**

```
User: "Create a visual of microservices architecture for my blog post"

→ Activates ArtGenerator skill
→ TechnicalDiagram workflow

Context analysis:
- Type: System architecture
- Content: Microservices (multiple services, API gateway, database)
- Style: Technical but approachable

Generated prompt:
"Clean microservices architecture diagram, dark background (#0a0a0f),
geometric boxes representing services (cyan glow), API gateway in
center (larger box, magenta), glowing connection lines between
services, database cylinders at bottom (purple), load balancer at top,
professional technical illustration style, isometric perspective,
clear hierarchy, no text labels (will add separately), 1600x1200"

Model recommendation: Stable Diffusion XL (good for technical diagrams)

Additional steps:
- Generate base diagram
- Add text labels using Figma or Excalidraw
- Export final version

Output: Professional architecture diagram ready for labeling
```

## Tips for Best Results

1. **Be specific:** More detail = better results ("dark blue" vs. "#0a0a0f")
2. **Iterate:** Generate 3-4 variants, pick the best
3. **Use negative prompts:** Tell the model what NOT to include
4. **Match aspect ratio:** Generate at final use size (avoid scaling)
5. **Consider text space:** Leave room for overlays if needed
6. **Test small:** Preview at actual use size (social media thumbnails)
7. **Brand consistency:** Use same color palette across all images

## Integration with PAI Skills

**Works well with:**
- **Research skill:** Generate images based on research findings
- **StoryExplanation skill:** Create visuals for narrative content
- **Fabric patterns:** Use `create_art_prompt` pattern for prompt generation
- **Trading skill:** Generate charts and data visualizations

## Future Enhancements

Potential additions to ArtGenerator:
- **Batch generation:** Create series of related images
- **Style library:** Pre-defined CarbeneAI style templates
- **Text overlay automation:** Auto-add titles to images
- **Brand asset library:** Reusable elements (logos, patterns)
- **Video generation:** Expand to animated content

## Resources

**Prompt libraries:**
- [PromptHero](https://prompthero.com/) - Community prompt gallery
- [Lexica](https://lexica.art/) - Stable Diffusion prompt search
- [Midjourney Showcase](https://www.midjourney.com/showcase/) - Inspiration gallery

**Tools:**
- **Replicate:** Primary API for production
- **Figma:** Text overlays and final composition
- **Excalidraw:** Hand-drawn diagram elements
- **Unsplash:** Fallback for stock photography if AI doesn't work

## Success Metrics

**Good image generation:**
- ✅ Matches brand aesthetic (CarbeneAI dark/neon style)
- ✅ Appropriate for use case (blog/social/presentation)
- ✅ High quality (no artifacts, good composition)
- ✅ Efficient (generated in <2 minutes)
- ✅ Usable without extensive editing

**When to regenerate:**
- ❌ Brand mismatch (wrong colors, wrong vibe)
- ❌ Composition issues (focal point unclear, too busy)
- ❌ Quality problems (artifacts, distortions, text gibberish)
- ❌ Off-topic (doesn't match content concept)
