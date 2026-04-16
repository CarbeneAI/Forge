#!/usr/bin/env bun

/**
 * generate-slide-images.ts - Generate AI Images for Presentation Slides
 *
 * Generates images for presentation slides using PAI's Art skill.
 * Reads a slides.json file, crafts prompts from slide content, and generates
 * images for slides marked with "image": "auto".
 *
 * Usage:
 *   bun generate-slide-images.ts \
 *     --input slides.json \
 *     --brand carbeneai \
 *     --output-dir /tmp/slide-images/
 *
 * @see ~/.claude/skills/pptx/SKILL.md
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { existsSync } from "node:fs";

// ============================================================================
// Types
// ============================================================================

interface Slide {
  title: string;
  bullets: string[];
  image?: string | "auto";
  layout?: string;
}

interface SlidesData {
  title: string;
  subtitle?: string;
  slides: Slide[];
}

type Brand = "carbeneai" | "professional";

interface CLIArgs {
  input: string;
  brand: Brand;
  outputDir: string;
  model: string;
  help?: boolean;
}

// ============================================================================
// Configuration
// ============================================================================

const DEFAULTS = {
  brand: "professional" as Brand,
  outputDir: "/tmp/slide-images/",
  model: "nano-banana-pro",
};

const BRAND_STYLES = {
  carbeneai: "Abstract futuristic illustration with dark background (#0a0a12), neon cyan (#00d4ff) and purple (#a855f7) accents, clean geometric shapes, tech aesthetic, modern minimalist design",
  professional: "Clean minimal illustration with white background, navy blue (#1e3a8a) and light blue (#3b82f6) accents, corporate professional style, simple geometric shapes",
};

const ART_TOOL_PATH = `${process.env.PAI_DIR || `${process.env.HOME}/.claude`}/skills/Art/tools/generate-ulart-image.ts`;

// ============================================================================
// Error Handling
// ============================================================================

class CLIError extends Error {
  constructor(message: string, public exitCode: number = 1) {
    super(message);
    this.name = "CLIError";
  }
}

function handleError(error: unknown): never {
  if (error instanceof CLIError) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(error.exitCode);
  }

  if (error instanceof Error) {
    console.error(`❌ Unexpected error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }

  console.error(`❌ Unknown error:`, error);
  process.exit(1);
}

// ============================================================================
// Help Text
// ============================================================================

function showHelp(): void {
  console.log(`
generate-slide-images - Generate AI Images for Presentation Slides

Generate images for presentation slides using PAI's Art skill.
Reads a slides.json file and generates images for slides marked with "image": "auto".

USAGE:
  generate-slide-images --input <file> [OPTIONS]

REQUIRED:
  --input <file>        Path to slides.json file

OPTIONS:
  --brand <brand>       Brand style: carbeneai or professional (default: professional)
  --output-dir <path>   Output directory for images (default: /tmp/slide-images/)
  --model <model>       AI model for generation (default: nano-banana-pro)
  --help, -h            Show this help message

BRAND STYLES:
  carbeneai             Dark background, neon cyan/purple accents, futuristic tech aesthetic
  professional          White background, navy/light blue accents, corporate professional style

EXAMPLES:
  # Generate images for CarbeneAI branded presentation
  generate-slide-images --input slides.json --brand carbeneai

  # Generate images with custom output directory
  generate-slide-images --input slides.json --output-dir ./images/

  # Use different AI model
  generate-slide-images --input slides.json --model flux --brand professional

HOW IT WORKS:
  1. Reads slides.json file
  2. For each slide with "image": "auto":
     - Crafts prompt from slide title + first 2-3 bullets
     - Applies brand-appropriate style context
     - Calls Art skill's generate-ulart-image.ts tool
  3. Saves images as slide-{index}.png in output directory
  4. Updates slides.json image references to point to generated files

SLIDES.JSON FORMAT:
  {
    "title": "Presentation Title",
    "subtitle": "Optional Subtitle",
    "slides": [
      {
        "title": "Slide Title",
        "bullets": ["Point 1", "Point 2", "Point 3"],
        "image": "auto"  // Generates image for this slide
      },
      {
        "title": "Another Slide",
        "bullets": ["Point A", "Point B"],
        "image": "./path/to/existing.png"  // Uses existing image
      }
    ]
  }

ERROR CODES:
  0  Success
  1  General error (invalid arguments, file not found, generation failed)

MORE INFO:
  Documentation: ~/.claude/skills/pptx/SKILL.md
  Art Skill: ~/.claude/skills/Art/SKILL.md
`);
  process.exit(0);
}

// ============================================================================
// Argument Parsing
// ============================================================================

function parseArgs(argv: string[]): CLIArgs {
  const args = argv.slice(2);

  // Check for help flag
  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    showHelp();
  }

  const parsed: Partial<CLIArgs> = {
    brand: DEFAULTS.brand,
    outputDir: DEFAULTS.outputDir,
    model: DEFAULTS.model,
  };

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];

    if (!flag.startsWith("--")) {
      throw new CLIError(`Invalid flag: ${flag}. Flags must start with --`);
    }

    const key = flag.slice(2);
    const value = args[i + 1];

    if (!value || value.startsWith("--")) {
      throw new CLIError(`Missing value for flag: ${flag}`);
    }

    switch (key) {
      case "input":
        parsed.input = value;
        i++;
        break;
      case "brand":
        if (value !== "carbeneai" && value !== "professional") {
          throw new CLIError(`Invalid brand: ${value}. Must be: carbeneai or professional`);
        }
        parsed.brand = value;
        i++;
        break;
      case "output-dir":
        parsed.outputDir = value;
        i++;
        break;
      case "model":
        parsed.model = value;
        i++;
        break;
      default:
        throw new CLIError(`Unknown flag: ${flag}`);
    }
  }

  // Validate required arguments
  if (!parsed.input) {
    throw new CLIError("Missing required argument: --input");
  }

  return parsed as CLIArgs;
}

// ============================================================================
// Prompt Crafting
// ============================================================================

function craftImagePrompt(slide: Slide, brand: Brand): string {
  const styleContext = BRAND_STYLES[brand];

  // Take title and first 2-3 bullets for context
  const bullets = slide.bullets.slice(0, 3);
  const contentContext = bullets.join(", ");

  // Build prompt
  const prompt = `${slide.title}. ${contentContext}. ${styleContext}. No text or words in the image.`;

  // Keep under 200 words
  const words = prompt.split(/\s+/).slice(0, 200).join(" ");
  return words;
}

// ============================================================================
// Image Generation
// ============================================================================

async function generateImage(
  prompt: string,
  outputPath: string,
  model: string
): Promise<void> {
  console.log(`🎨 Generating image with ${model}...`);

  // Call Art skill's generate-ulart-image.ts via Bun subprocess
  const proc = Bun.spawn([
    "bun",
    "run",
    ART_TOOL_PATH,
    "--model",
    model,
    "--prompt",
    prompt,
    "--aspect-ratio",
    "16:9",
    "--size",
    "2K",
    "--output",
    outputPath,
  ], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    throw new Error(`Art tool failed: ${stderr}`);
  }
}

// ============================================================================
// Main Processing
// ============================================================================

async function processSlides(args: CLIArgs): Promise<void> {
  // Read slides.json
  const inputPath = resolve(args.input);
  if (!existsSync(inputPath)) {
    throw new CLIError(`Input file not found: ${inputPath}`);
  }

  const slidesContent = await readFile(inputPath, "utf-8");
  const slidesData: SlidesData = JSON.parse(slidesContent);

  // Find slides that need image generation
  const slidesToGenerate: Array<{ index: number; slide: Slide }> = [];

  slidesData.slides.forEach((slide, index) => {
    if (slide.image === "auto") {
      slidesToGenerate.push({ index, slide });
    }
  });

  if (slidesToGenerate.length === 0) {
    console.log("✅ No slides require image generation");
    return;
  }

  // Create output directory if it doesn't exist
  const outputDir = resolve(args.outputDir);
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
    console.log(`📁 Created output directory: ${outputDir}`);
  }

  console.log(`\n🎨 Generating ${slidesToGenerate.length} image${slidesToGenerate.length > 1 ? 's' : ''}...\n`);

  // Generate images
  let successCount = 0;
  for (let i = 0; i < slidesToGenerate.length; i++) {
    const { index, slide } = slidesToGenerate[i];
    const imageFilename = `slide-${index + 1}.png`;
    const outputPath = join(outputDir, imageFilename);

    try {
      console.log(`[${i + 1}/${slidesToGenerate.length}] ${slide.title}`);

      // Craft prompt
      const prompt = craftImagePrompt(slide, args.brand);
      console.log(`   Prompt: ${prompt.slice(0, 80)}...`);

      // Generate image
      await generateImage(prompt, outputPath, args.model);

      // Update slides.json reference
      slidesData.slides[index].image = outputPath;

      console.log(`   ✅ Saved to ${outputPath}\n`);
      successCount++;
    } catch (error) {
      console.error(`   ⚠️  Failed to generate image: ${error instanceof Error ? error.message : String(error)}`);
      console.log(`   Continuing with remaining slides...\n`);
    }
  }

  // Save updated slides.json
  await writeFile(inputPath, JSON.stringify(slidesData, null, 2));
  console.log(`✅ Updated ${args.input} with image references`);

  console.log(`\n📊 Summary:`);
  console.log(`   Generated: ${successCount}/${slidesToGenerate.length} images`);
  console.log(`   Output: ${outputDir}`);
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  try {
    const args = parseArgs(process.argv);
    await processSlides(args);
  } catch (error) {
    handleError(error);
  }
}

main();
