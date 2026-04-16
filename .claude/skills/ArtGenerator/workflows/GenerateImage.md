# GenerateImage Workflow

Create AI-generated images for blog posts, presentations, social media, and content creation.

## Purpose

Generate high-quality images optimized for specific use cases (blog headers, social posts, presentations) using AI image generation tools with CarbeneAI aesthetic guidelines.

## Process

### 1. Understand Context

**Questions to clarify:**
- What's the content topic? (Blog post subject, presentation theme, social post message)
- Where will this be used? (Blog header, social media, presentation slide, email)
- What's the target audience? (Technical, executive, general public)
- Are there specific elements required? (Logos, specific imagery, text space)
- What's the mood/feeling? (Professional, playful, serious, inspirational)

**Output:** Clear understanding of image purpose and constraints

### 2. Determine Specifications

**Based on use case, define:**

#### Dimensions
- **Blog header:** 1200x630px (social media preview standard)
- **Twitter/X:** 1200x675px (16:9)
- **LinkedIn:** 1200x627px
- **Instagram:** 1080x1080px (square)
- **Presentation:** 1920x1080px (16:9 widescreen)
- **Hero image:** 1920x1080px or wider
- **Thumbnail:** 400x300px

#### Aspect Ratio for AI Generation
- **16:9** - Presentations, blog headers, social media
- **1:1** - Instagram, profile images
- **4:5** - Instagram portrait
- **21:9** - Ultrawide hero images

#### Style Requirements
- **CarbeneAI brand?** Yes/No (determines color palette)
- **Text overlay needed?** Yes/No (determines negative space)
- **Realism vs. illustration?** (Affects model choice)
- **Complexity level?** Minimal/moderate/detailed

**Output:** Technical specifications document

### 3. Extract Visual Concept

**From content, identify:**
- **Core concept:** What's the main idea? (e.g., "breaking down complexity")
- **Key metaphors:** What visual metaphors work? (e.g., "building blocks", "network")
- **Emotion/mood:** What should viewers feel? (e.g., "clarity", "power", "innovation")
- **Symbols:** Any specific imagery? (e.g., "locks for security", "clouds for infrastructure")

**Brainstorm visual approaches:**
1. **Literal approach:** Direct representation (security = lock and shield)
2. **Metaphorical approach:** Conceptual (security = fortress, network of protection)
3. **Abstract approach:** Mood-based (security = dark background with safe space)

**Choose best fit** for content and audience.

**Output:** Visual concept description

### 4. Craft Prompt

**Structure:** Subject + Style + Colors + Mood + Technical details + Negative prompts

#### For CarbeneAI Branded Content

**Template:**
```
[Core visual concept], dark space black background (#0a0a0f),
neon cyan (#00D4FF) and magenta (#FF00FF) accents,
glass morphism [elements], Tron-style aesthetic,
[specific objects/elements],
[composition notes],
futuristic and professional,
no text, no watermarks,
[aspect ratio],
highly detailed, cinematic lighting, 8K quality
```

**Example (Blog header for AI article):**
```
Abstract neural network visualization with interconnected nodes,
dark space black background (#0a0a0f), glowing cyan and magenta
pathways between nodes, glass morphism layers showing data flow,
Tron-style grid beneath network, geometric precision, depth and
dimension, rule of thirds composition, futuristic and professional,
no text, no watermarks, 16:9 aspect ratio, highly detailed,
cinematic lighting, 8K quality
```

#### For Non-Branded Content

**Template:**
```
[Subject/scene description],
[lighting and atmosphere],
[style reference] (e.g., "cinematic", "minimalist", "hand-drawn"),
[color palette] (if specific),
[mood],
[composition notes],
no text, no watermarks,
[aspect ratio],
[quality modifiers]
```

**Example (Professional headshot background):**
```
Soft gradient background for professional headshot, deep navy blue
transitioning to slate gray, subtle bokeh effect, corporate and
professional atmosphere, minimal and clean, centered composition
with negative space in center third, no objects, no patterns,
16:9 aspect ratio, high quality, professional photography style
```

#### Advanced Prompt Techniques

**Quality boosters:**
- "highly detailed"
- "8K resolution"
- "professional photography"
- "cinematic lighting"
- "award-winning composition"

**Style modifiers:**
- "in the style of [artist/aesthetic]"
- "digital art"
- "photorealistic"
- "illustration"
- "technical diagram"

**Composition:**
- "rule of thirds"
- "centered composition"
- "negative space on [left/right/top/bottom]"
- "wide angle view"
- "isometric perspective"

**Negative prompts** (critical for quality):
```
Negative: text, watermarks, signatures, logos, people (if not wanted),
blur, low quality, distorted, deformed, ugly, bad composition,
cluttered, chaotic, oversaturated
```

### 5. Select Model

**Based on requirements, choose:**

| Model | Best For | Speed | Cost | Quality |
|-------|----------|-------|------|---------|
| **Flux 1.1 Pro** | Photorealistic, complex scenes | Slow | $$$ | Highest |
| **SDXL** | General purpose, versatile | Medium | $$ | High |
| **Playground v2.5** | Artistic, vibrant colors | Fast | $$ | High |
| **SDXL Lightning** | Speed-critical, iterations | Very Fast | $ | Good |
| **DALL-E 3** | Following complex instructions | Slow | $$$ | High |

**Decision matrix:**

**Use Flux 1.1 Pro when:**
- Photorealism required
- Complex scene with many elements
- Highest quality needed
- Budget allows

**Use SDXL when:**
- General-purpose image
- Good balance of speed/quality
- Most common choice

**Use SDXL Lightning when:**
- Need to iterate quickly
- Testing different prompts
- Simple compositions

**Use Playground v2.5 when:**
- Artistic, vibrant style wanted
- Illustration over photorealism
- Fantasy/sci-fi aesthetic

**Use DALL-E 3 when:**
- Very specific, complex prompt
- Need strong safety guardrails
- Integration with OpenAI tools

### 6. Generate Image

#### Using Replicate API

**Setup (one-time):**
```bash
# Add to ~/.claude/.env
REPLICATE_API_TOKEN=your_token_here
```

**Generate via API:**
```bash
# Using Flux 1.1 Pro
curl -X POST https://api.replicate.com/v1/predictions \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "flux-1.1-pro-model-id",
    "input": {
      "prompt": "YOUR_PROMPT_HERE",
      "aspect_ratio": "16:9",
      "output_format": "png",
      "output_quality": 100
    }
  }'

# Save prediction ID, then fetch result:
curl -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  https://api.replicate.com/v1/predictions/{PREDICTION_ID}
```

**Using TypeScript (recommended):**
```typescript
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const output = await replicate.run(
  "black-forest-labs/flux-1.1-pro",
  {
    input: {
      prompt: "YOUR_PROMPT_HERE",
      aspect_ratio: "16:9",
      output_format: "png",
      output_quality: 100
    }
  }
);

console.log(output);
// Output is image URL
```

#### Using DALL-E 3

```typescript
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const response = await openai.images.generate({
  model: "dall-e-3",
  prompt: "YOUR_PROMPT_HERE",
  n: 1,
  size: "1792x1024", // or "1024x1024", "1024x1792"
  quality: "hd", // or "standard"
  style: "vivid", // or "natural"
});

const imageUrl = response.data[0].url;
console.log(imageUrl);
```

### 7. Review and Iterate

**Quality checklist:**

✅ **Brand alignment**
- Matches CarbeneAI aesthetic (if branded)
- Color palette correct (#0a0a0f, #00D4FF, #FF00FF)
- Style consistent with brand guidelines

✅ **Composition**
- Focal point clear
- Rule of thirds applied (if appropriate)
- Negative space for text (if needed)
- Not too cluttered or busy

✅ **Technical quality**
- High resolution (no pixelation)
- No obvious artifacts or distortions
- No unwanted text/watermarks
- Proper aspect ratio

✅ **Purpose fit**
- Appropriate for use case (blog vs. social vs. presentation)
- Supports content topic
- Appeals to target audience
- Evokes intended mood

**If any checklist item fails:**
1. **Identify the issue** (composition, quality, brand, purpose)
2. **Adjust prompt** (be more specific, add negative prompts)
3. **Try different model** (if quality issue)
4. **Regenerate** (iterate until satisfactory)

**Common fixes:**

| Issue | Solution |
|-------|----------|
| Too busy/cluttered | Add "minimal", "clean", "simple" to prompt; use negative: "cluttered, chaotic" |
| Wrong colors | Be very specific with hex codes in prompt |
| Text gibberish | Add negative: "no text, no words, no letters" |
| Composition off | Specify "centered" or "rule of thirds" or "negative space on left" |
| Low quality | Switch to higher-quality model (Flux 1.1 Pro) |
| Off-topic | Be more specific about subject matter in prompt |

### 8. Finalize and Deliver

**Post-processing (if needed):**
1. **Crop/resize:** Match exact dimensions required
2. **Text overlay:** Add title/headline (using Figma, Canva, or code)
3. **Compression:** Optimize file size for web (use ImageOptim, TinyPNG)
4. **Format conversion:** PNG for quality, JPG for file size

**Delivery:**
```markdown
## Generated Image

**Use case:** [Blog header / Social post / Presentation]
**Dimensions:** [1200x630px / etc.]
**Model used:** [Flux 1.1 Pro / SDXL / etc.]

**Image URL:** [Direct link to generated image]

**Prompt used:**
```
[Full prompt for reference/reproduction]
```

**Alt text (for accessibility):**
"[Descriptive alt text for screen readers]"

**Usage notes:**
- [Any special considerations]
- [Recommended text overlay positions]
- [Suggested color for text (#00D4FF for cyan, #FF00FF for magenta)]

**Files delivered:**
- Original high-res: [filename.png]
- Web-optimized: [filename-optimized.jpg]
```

## Example Execution

```markdown
# Image Generation: "First Principles Thinking" Blog Header

## 1. Context
- **Content:** Blog post explaining first principles reasoning methodology
- **Use case:** Blog header (featured image)
- **Audience:** Technical professionals, entrepreneurs, product managers
- **Mood:** Intellectual, clarity, foundational thinking

## 2. Specifications
- **Dimensions:** 1200x630px
- **Aspect ratio:** 16:9
- **Style:** CarbeneAI branded
- **Text overlay:** Yes (will add post title)
- **Negative space:** Top third for title

## 3. Visual Concept
- **Core concept:** Deconstruction - breaking complexity into simple fundamentals
- **Key metaphor:** Complex 3D structure breaking down into basic geometric shapes
- **Emotion:** Clarity, understanding, intellectual rigor
- **Symbols:** Geometric primitives (sphere, cube, pyramid), layers peeling away

## 4. Prompt
```
Abstract visualization of first principles thinking, complex 3D
architectural structure in upper portion deconstructing into simple
geometric primitives (sphere, cube, pyramid) in lower portion,
dark space black background (#0a0a0f), neon cyan (#00D4FF) and
magenta (#FF00FF) glowing edges on geometry, glass morphism
translucent layers peeling away showing internal structure,
Tron-style grid at foundation level, professional and intellectual
aesthetic, negative space in top third for text overlay, rule of
thirds composition, futuristic, no text, no watermarks, 16:9
aspect ratio, highly detailed, cinematic lighting, 8K quality

Negative: text, watermarks, people, clutter, chaos, low quality,
distorted, oversaturated
```

## 5. Model Selection
**Chosen:** Flux 1.1 Pro
**Reason:** Complex 3D geometry requires high-quality rendering

## 6. Generation
[Image generated via Replicate API]
**Time:** 45 seconds
**Cost:** $0.04

## 7. Review
✅ Brand alignment - Dark background, cyan/magenta accents present
✅ Composition - Negative space at top for title, rule of thirds applied
✅ Technical quality - High resolution, no artifacts
✅ Purpose fit - Abstract concept clearly visualized

**Status:** Approved without iteration

## 8. Finalization
- Cropped to exact 1200x630px
- Added title overlay in Figma: "First Principles: Think From the Ground Up"
- Text color: Cyan (#00D4FF) for contrast
- Exported PNG for high quality
- Generated optimized JPG (85% quality, 120KB) for web

**Delivered:**
- `first-principles-header.png` (original, 2.4MB)
- `first-principles-header-optimized.jpg` (web, 120KB)

**Alt text:**
"Abstract 3D structure deconstructing into simple geometric shapes
against a dark background with glowing cyan and magenta accents,
representing first principles thinking methodology"

✅ **Complete** - Ready for blog post publication
```

## Tips for Success

1. **Iterate in batches:** Generate 3-4 variants with slight prompt variations, pick best
2. **Start broad, refine:** First generation discovers what works, second refines
3. **Use negative prompts:** Just as important as positive prompts
4. **Match dimensions:** Generate at final size to avoid quality loss from scaling
5. **Consider compression:** Web images should be <200KB for performance
6. **Test at scale:** View at actual use size (social media thumbnails are small!)
7. **Maintain consistency:** Use same color palette and style across content series

## Integration Points

**Upstream (inputs):**
- Content from blog writing workflows
- Presentation outlines
- Social media post plans

**Downstream (outputs):**
- Images delivered to content management system
- Assets saved to design library
- Variations archived for future reference

## Success Criteria

**Image generation is successful when:**
- ✅ Matches brand guidelines (if branded content)
- ✅ Appropriate for stated use case
- ✅ High technical quality (resolution, composition)
- ✅ Generated efficiently (<3 attempts)
- ✅ Requires minimal post-processing
- ✅ Client/user approves
