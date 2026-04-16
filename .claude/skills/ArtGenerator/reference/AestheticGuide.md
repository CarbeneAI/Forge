# CarbeneAI Aesthetic Guide

Complete visual design system for CarbeneAI brand identity, covering colors, typography, composition, and style guidelines for all image generation.

## Brand Identity

**CarbeneAI** is a fractional CTO/CISO consulting firm specializing in technology strategy, security architecture, and executive leadership. The visual identity reflects:

- **Technical expertise** - Professional, precise, high-quality
- **Innovation** - Futuristic, cutting-edge, forward-thinking
- **Clarity** - Clean, organized, easy to understand
- **Security focus** - Protected, solid, trustworthy

**Visual metaphor:** *"Tron meets Excalidraw"*
- Tron: Dark, neon, futuristic, precise geometry
- Excalidraw: Hand-drawn, approachable, sketch aesthetic

## Color Palette

### Primary Colors

| Color | Hex Code | RGB | Use Case |
|-------|----------|-----|----------|
| **Deep Space Black** | `#0a0a0f` | RGB(10, 10, 15) | Primary background, establishes dark aesthetic |
| **Neon Cyan** | `#00D4FF` | RGB(0, 212, 255) | Primary accent, links, highlights, key elements |
| **Neon Magenta** | `#FF00FF` | RGB(255, 0, 255) | Secondary accent, calls-to-action, emphasis |

### Secondary Colors

| Color | Hex Code | RGB | Use Case |
|-------|----------|-----|----------|
| **Electric Purple** | `#9D4EDD` | RGB(157, 78, 221) | Tertiary accent, gradients, variety |
| **Slate Gray** | `#2d2d3a` | RGB(45, 45, 58) | Secondary background, panels, cards |
| **Ghost White** | `#f8f8ff` | RGB(248, 248, 255) | Text, readability on dark backgrounds |

### Gradient Combinations

**Cyan to Magenta** (signature gradient):
```css
background: linear-gradient(135deg, #00D4FF 0%, #FF00FF 100%);
```
**Use:** Buttons, hero sections, major CTAs

**Purple to Cyan** (subtle gradient):
```css
background: linear-gradient(135deg, #9D4EDD 0%, #00D4FF 100%);
```
**Use:** Background overlays, panels, secondary elements

**Dark to Darker** (depth gradient):
```css
background: linear-gradient(180deg, #2d2d3a 0%, #0a0a0f 100%);
```
**Use:** Card backgrounds, section dividers

### Color Usage Guidelines

**DO:**
- ✅ Use deep space black (#0a0a0f) as primary background
- ✅ Use cyan (#00D4FF) for primary interactive elements
- ✅ Use magenta (#FF00FF) sparingly for emphasis
- ✅ Use gradients for depth and visual interest
- ✅ Maintain high contrast for accessibility

**DON'T:**
- ❌ Use pure black (#000000) - too harsh, use #0a0a0f
- ❌ Use bright colors on bright backgrounds
- ❌ Mix cyan/magenta equally - one should dominate
- ❌ Use low-contrast color combinations
- ❌ Add unnecessary colors outside the palette

## Typography

### Font Families

| Font | Use Case | Characteristics |
|------|----------|-----------------|
| **Orbitron** | Headers, titles, logos | Geometric, futuristic, technical |
| **Inter** | Body text, UI elements | Clean, readable, professional |
| **JetBrains Mono** | Code, technical content | Monospace, developer-focused |

### Type Scale

| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| **H1 - Main title** | Orbitron | 48-64px | Bold (700) | Cyan (#00D4FF) or White |
| **H2 - Section** | Orbitron | 36-42px | Bold (700) | White |
| **H3 - Subsection** | Orbitron | 28-32px | Medium (500) | White |
| **H4 - Component** | Inter | 20-24px | Semibold (600) | White |
| **Body - Paragraph** | Inter | 16-18px | Regular (400) | Ghost White (#f8f8ff) |
| **Caption - Small** | Inter | 12-14px | Regular (400) | Slate Gray (#8a8a9a) |
| **Code** | JetBrains Mono | 14-16px | Regular (400) | Cyan (#00D4FF) |

### Typography Guidelines

**DO:**
- ✅ Use Orbitron for tech-focused headlines
- ✅ Use Inter for high readability body text
- ✅ Maintain consistent hierarchy (H1 > H2 > H3)
- ✅ Use sufficient line height (1.6 for body, 1.2 for headers)
- ✅ Limit line length to 60-80 characters

**DON'T:**
- ❌ Mix more than 2-3 font families
- ❌ Use decorative fonts for body text
- ❌ Set body text smaller than 16px
- ❌ Use all-caps for large blocks (ok for short labels)

## Visual Style Elements

### Glass Morphism

**Definition:** Translucent, frosted-glass effect with blur and transparency.

**CSS implementation:**
```css
.glass-panel {
  background: rgba(45, 45, 58, 0.4); /* Slate gray with 40% opacity */
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
```

**Use cases:**
- Card backgrounds
- Modal dialogs
- Navigation panels
- Floating UI elements

**In AI prompts:**
```
"glass morphism translucent panels with blur effect, frosted glass
texture, subtle transparency"
```

### Neon Glow Effects

**Definition:** Glowing edges and highlights reminiscent of neon lights.

**CSS implementation:**
```css
.neon-glow {
  text-shadow: 0 0 10px #00D4FF,
               0 0 20px #00D4FF,
               0 0 30px #00D4FF;
}

.neon-border {
  box-shadow: 0 0 5px #00D4FF,
              0 0 10px #00D4FF,
              inset 0 0 5px #00D4FF;
}
```

**Use cases:**
- Accent text
- Interactive elements (hover states)
- Call-to-action buttons
- Important icons

**In AI prompts:**
```
"glowing cyan neon edges, soft light bloom effect, neon tube lighting
aesthetic"
```

### Geometric Patterns

**Definition:** Precise, mathematical shapes (hexagons, triangles, grids).

**Common patterns:**
- **Hexagonal grid** - Technology, connectivity
- **Triangular mesh** - Structure, precision
- **Square grid (Tron-style)** - Digital space, foundation
- **Circuit board traces** - Technology, complexity

**In AI prompts:**
```
"Tron-style hexagonal grid pattern, geometric precision, mathematical
shapes, clean lines and angles"
```

### Hand-Drawn Elements (Excalidraw Style)

**Definition:** Sketch-like, hand-drawn aesthetic for approachability.

**Characteristics:**
- Imperfect lines (slight wobble)
- Rough edges (not perfectly smooth)
- Hand-written annotations
- Sketch arrows and connectors

**Use cases:**
- Diagrams and flowcharts
- Annotations and callouts
- Wireframes and sketches
- Casual/approachable content

**In AI prompts:**
```
"hand-drawn sketch style, Excalidraw aesthetic, rough edges, imperfect
lines, whiteboard marker feel"
```

**Note:** Mix polished UI with sketch elements for unique CarbeneAI look.

## Composition Guidelines

### Rule of Thirds

**Definition:** Divide image into 3x3 grid, place key elements at intersections.

```
┌─────┬─────┬─────┐
│     │     │     │
├─────┼─────┼─────┤  ← Place focal points
│     │  ●  │     │    at intersections
├─────┼─────┼─────┤
│     │     │     │
└─────┴─────┴─────┘
```

**Use for:**
- Blog headers (title in top third, focal point at intersection)
- Presentations (content in left two-thirds, image on right)
- Hero images (subject at intersection, not center)

### Negative Space

**Definition:** Empty space around elements, gives breathing room.

**Guidelines:**
- **Minimum 15-20% negative space** for readability
- Use for text overlays (blog headers need title space)
- Creates professional, uncluttered look
- Guides eye to focal points

**In AI prompts:**
```
"plenty of negative space, minimal composition, 20% content 80% space,
clean and uncluttered"
```

### Visual Hierarchy

**Definition:** Size, color, and position establish importance.

**Hierarchy levels:**
1. **Primary:** Largest, brightest, centered or at key intersection
2. **Secondary:** Medium size, supporting elements
3. **Tertiary:** Small, background details

**Example - Blog header hierarchy:**
1. Primary: Key visual concept (largest element)
2. Secondary: Supporting geometric patterns
3. Tertiary: Background grid or texture

### Depth and Dimension

**Create depth through:**
- **Layering:** Multiple planes (foreground, midground, background)
- **Shadows:** Drop shadows, ambient occlusion
- **Blur:** Depth of field (focus on foreground, blur background)
- **Size:** Larger objects appear closer
- **Overlap:** Overlapping elements create depth

**In AI prompts:**
```
"multiple layers with depth, foreground elements sharp, background
slightly blurred, depth of field effect, isometric perspective"
```

## Content-Specific Guidelines

### Blog Headers

**Specs:**
- **Dimensions:** 1200x630px (social media standard)
- **Aspect ratio:** ~1.91:1 (16:9 works too)
- **Safe area:** Top 25% for title text
- **Focal point:** Center or right-third intersection

**Style:**
- Dark background (#0a0a0f)
- Eye-catching but professional
- Abstract concept visualization (not literal)
- Neon accents for visual interest

**Example prompt structure:**
```
"[Abstract concept], dark space black background (#0a0a0f), neon cyan
and magenta accents, glass morphism elements, Tron aesthetic, negative
space in top third for title, rule of thirds composition, professional,
no text, 16:9 aspect ratio"
```

### Social Media Graphics

**Specs:**
- **Twitter/X:** 1200x675px (16:9)
- **LinkedIn:** 1200x627px (~1.9:1)
- **Instagram:** 1080x1080px (square)

**Style:**
- High contrast (must be eye-catching)
- Bold, simple composition (readable at small sizes)
- Strong focal point (clear subject)
- Less detail than blog headers (will be thumbnails)

**Platform-specific:**
- **LinkedIn:** More professional, business-focused
- **Twitter/X:** Can be bolder, more playful
- **Instagram:** Square format, centered composition

### Presentation Slides

**Specs:**
- **Dimensions:** 1920x1080px (16:9)
- **Safe area:** Text should stay within 90% center area
- **Contrast:** Very high (projectors wash out colors)

**Style:**
- Minimal (slides are backgrounds for text)
- 70-80% negative space
- Subtle patterns (not distracting)
- Support content, don't overpower it

**Example prompt:**
```
"Minimalist presentation background, dark space black (#0a0a0f), very
subtle geometric pattern (10% opacity), 80% negative space, clean and
professional, no focal point, even composition, no text, 16:9"
```

### Technical Diagrams

**Specs:**
- **Dimensions:** 1600x1200px or 1920x1080px
- **Clarity:** Must be readable when embedded at 800px width

**Style:**
- Clean and geometric
- Clear component separation
- Labeled (add text after generation)
- Professional technical illustration

**Colors:**
- **Cyan:** Services, applications, APIs
- **Magenta:** Gateways, routers, critical infrastructure
- **Purple:** Databases, storage, data
- **White/Ghost White:** Connections, generic elements

### Hero Images

**Specs:**
- **Dimensions:** 1920x1080px minimum (often wider)
- **Aspect ratio:** 16:9 or ultrawide (21:9)

**Style:**
- Cinematic, dramatic
- Wide composition
- High quality (these are prominent)
- Brand-aligned but impactful

## Accessibility Considerations

### Contrast Ratios

**WCAG AA compliance requires:**
- **Normal text:** 4.5:1 contrast ratio
- **Large text (18pt+):** 3:1 contrast ratio
- **Interactive elements:** 3:1 contrast ratio

**CarbeneAI palette contrast:**
- ✅ Cyan (#00D4FF) on black (#0a0a0f): 12.8:1 (excellent)
- ✅ White (#f8f8ff) on black (#0a0a0f): 19.5:1 (excellent)
- ✅ Magenta (#FF00FF) on black (#0a0a0f): 8.2:1 (excellent)
- ⚠️ Slate gray (#2d2d3a) on black (#0a0a0f): 2.1:1 (insufficient for text)

**Guidelines:**
- Use ghost white (#f8f8ff) for body text
- Use cyan/magenta for accents and headings
- Never use slate gray for text (backgrounds only)

### Alt Text for Images

**Always provide descriptive alt text:**

**Good alt text:**
```
"Microservices architecture diagram showing API Gateway connecting
to five backend services with individual databases and a shared
message queue"
```

**Bad alt text:**
```
"Diagram"
```

**Guidelines:**
- Describe what's in the image
- Mention key components
- Explain the concept if abstract
- Keep to 150 characters or less

### Color Blindness

**Test designs for:**
- **Deuteranopia** (red-green colorblind) - Most common
- **Protanopia** (red-green colorblind) - Common
- **Tritanopia** (blue-yellow colorblind) - Rare

**CarbeneAI palette considerations:**
- ✅ Cyan and magenta are distinguishable for most colorblind types
- ✅ Don't rely solely on color (use text, icons, patterns)
- ⚠️ Purple and cyan may be similar for some types

**Tools:**
- [Color Oracle](https://colororacle.org/) - Colorblind simulator
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

## Image Generation Cheat Sheet

### Quick Prompt Template (CarbeneAI Branded)

```
[Subject/concept], dark space black background (#0a0a0f), neon cyan
(#00D4FF) and magenta (#FF00FF) accents, glass morphism translucent
panels, Tron-style geometric patterns, [composition notes], futuristic
and professional, no text, no watermarks, [aspect ratio], highly
detailed, cinematic lighting

Negative: text, watermarks, signatures, people (if not wanted),
cluttered, chaotic, low quality, distorted, oversaturated
```

### Essential Prompt Elements

**Must include:**
1. Subject/concept
2. Background color (#0a0a0f)
3. Accent colors (cyan/magenta)
4. Style keywords (glass morphism, Tron, geometric)
5. Composition notes (rule of thirds, negative space)
6. Quality modifiers (detailed, cinematic)
7. Aspect ratio
8. Negative prompts

**Optional but recommended:**
- Specific hex codes for precision
- Mood/feeling keywords
- Lighting direction
- Perspective (isometric, top-down, etc.)
- Level of detail (minimal vs. intricate)

## Examples by Use Case

### Blog Header Example
```
Abstract AI neural network visualization, dark space black background
(#0a0a0f), glowing cyan (#00D4FF) nodes interconnected with magenta
(#FF00FF) pathways, glass morphism layered panels showing data flow,
Tron-style hexagonal grid foundation, negative space in top 25% for
title text, rule of thirds composition with focal point at right
intersection, depth and dimension through layering, futuristic and
professional, no text, 1200x630 aspect ratio, highly detailed,
cinematic lighting

Negative: text, watermarks, people, cluttered, photorealistic faces
```

### Social Media Post Example
```
Bold geometric visualization of cybersecurity concept, dark background
(#0a0a0f), large cyan (#00D4FF) shield icon with hexagonal pattern,
magenta (#FF00FF) circuit traces around edges, glass morphism effect
on shield, simple and clean composition, high contrast for small sizes,
centered focal point, minimal details, professional, no text, 1200x675
aspect ratio, highly detailed

Negative: text, cluttered, complex details, people
```

### Presentation Background Example
```
Minimalist dark presentation background, deep space black (#0a0a0f),
very subtle cyan (#00D4FF) geometric pattern in corners (5% opacity),
80% negative space in center for text content, clean and professional,
no focal point, even composition, elegant and simple, no text, 1920x1080
aspect ratio

Negative: text, busy, cluttered, focal points, distracting elements
```

## Brand Evolution

**Current aesthetic (v1.0):**
- Dark + neon (Tron aesthetic)
- Glass morphism
- Geometric precision
- Mix of polished + hand-drawn (Excalidraw)

**Future considerations:**
- 3D elements (isometric, depth)
- Animated elements (videos, GIFs)
- Interactive visualizations
- AR/VR experiences

**Maintain consistency:**
- Color palette stays core to identity
- Dark backgrounds non-negotiable
- Neon accents are signature
- Professional + innovative balance
