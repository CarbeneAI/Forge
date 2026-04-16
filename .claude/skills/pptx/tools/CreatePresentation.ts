#!/usr/bin/env bun
/**
 * CreatePresentation.ts - Main PowerPoint presentation creation orchestrator
 * Parses markdown outlines and generates presentations using pptx or gamma engines
 */

import { mkdtemp, readFile, writeFile, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'bun';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Metadata {
  title?: string;
  subtitle?: string;
  author?: string;
  date?: string;
  brand?: string;
}

interface Slide {
  layout: string;
  title?: string;
  subtitle?: string;
  bullets?: string[];
  notes?: string;
  image?: string;
}

interface PresentationData {
  metadata: Metadata;
  slides: Slide[];
}

interface ParsedArgs {
  outline?: string;
  brand: string;
  engine: string;
  output: string;
  generateImages: boolean;
  checkCredits: boolean;
  help: boolean;
}

// ============================================================================
// ARGUMENT PARSING
// ============================================================================

function parseArgs(argv: string[]): ParsedArgs {
  const args: ParsedArgs = {
    brand: 'professional',
    engine: 'pptx',
    output: 'presentation.pptx',
    generateImages: false,
    checkCredits: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    switch (arg) {
      case '--help':
      case '-h':
        args.help = true;
        break;
      case '--outline':
        args.outline = argv[++i];
        break;
      case '--brand':
        args.brand = argv[++i];
        break;
      case '--engine':
        args.engine = argv[++i];
        break;
      case '--output':
        args.output = argv[++i];
        break;
      case '--generate-images':
        args.generateImages = true;
        break;
      case '--check-credits':
        args.checkCredits = true;
        break;
    }
  }

  return args;
}

function showHelp(): void {
  console.log(`
CreatePresentation.ts - PowerPoint presentation creation orchestrator

USAGE:
  bun CreatePresentation.ts [OPTIONS]

OPTIONS:
  --outline PATH          Path to markdown outline file (required unless --check-credits)
  --brand BRAND           Brand theme: "carbeneai" or "professional" (default: professional)
  --engine ENGINE         Generation engine: "pptx" or "gamma" (default: pptx)
  --output PATH           Output .pptx file path (default: presentation.pptx)
  --generate-images       Generate AI images for slides with ![image](auto)
  --check-credits         Check Gamma credits and exit
  --help, -h              Show this help message

MARKDOWN OUTLINE FORMAT:
  ---
  title: Presentation Title
  subtitle: Optional Subtitle
  author: Your Name
  date: 2026-02-03
  brand: carbeneai
  ---

  # Section Title
  <!-- layout: section -->

  ## Slide Title
  <!-- layout: content -->
  - Bullet point one
  - Bullet point two
  - Bullet point three

  > Speaker notes go in blockquotes

  ![image](auto)
  ![image](path/to/existing-image.png)

SUPPORTED LAYOUTS:
  - title: Title slide (auto-generated from frontmatter)
  - section: Section divider
  - content: Content with bullets
  - content-image: Content with image on right
  - closing: Closing slide (auto-generated if not specified)

EXAMPLES:
  # Check Gamma API credits
  bun CreatePresentation.ts --check-credits

  # Create presentation using pptx engine
  bun CreatePresentation.ts --outline outline.md --brand carbeneai --output deck.pptx

  # Create with Gamma engine and image generation
  bun CreatePresentation.ts --outline outline.md --engine gamma --generate-images

  # Professional brand with custom output path
  bun CreatePresentation.ts --outline outline.md --brand professional --output ~/presentations/pitch.pptx
`);
}

// ============================================================================
// MARKDOWN PARSING
// ============================================================================

function parseMarkdown(content: string): PresentationData {
  const lines = content.split('\n');
  const metadata: Metadata = {};
  const slides: Slide[] = [];

  let i = 0;
  let inFrontmatter = false;
  let currentSlide: Slide | null = null;
  let currentBullets: string[] = [];
  let currentNotes: string[] = [];

  // Helper to finalize current slide
  const finalizeSlide = () => {
    if (currentSlide) {
      if (currentBullets.length > 0) {
        currentSlide.bullets = currentBullets;
        currentBullets = [];
      }
      if (currentNotes.length > 0) {
        currentSlide.notes = currentNotes.join('\n');
        currentNotes = [];
      }
      slides.push(currentSlide);
      currentSlide = null;
    }
  };

  // Parse frontmatter
  if (lines[0]?.trim() === '---') {
    inFrontmatter = true;
    i = 1;

    while (i < lines.length) {
      const line = lines[i].trim();
      if (line === '---') {
        inFrontmatter = false;
        i++;
        break;
      }

      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        metadata[key as keyof Metadata] = value;
      }
      i++;
    }
  }

  // Create title slide from frontmatter
  if (metadata.title) {
    slides.push({
      layout: 'title',
      title: metadata.title,
      subtitle: metadata.subtitle,
    });
  }

  // Parse body content
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    // Check for layout comment
    const layoutMatch = trimmed.match(/^<!--\s*layout:\s*(\w+)\s*-->$/);
    if (layoutMatch) {
      if (currentSlide) {
        currentSlide.layout = layoutMatch[1];
      }
      i++;
      continue;
    }

    // Section heading (# Heading)
    if (trimmed.match(/^#\s+(.+)$/)) {
      finalizeSlide();
      const title = trimmed.replace(/^#\s+/, '');
      currentSlide = { layout: 'section', title };
      i++;
      continue;
    }

    // Slide heading (## Heading)
    if (trimmed.match(/^##\s+(.+)$/)) {
      finalizeSlide();
      const title = trimmed.replace(/^##\s+/, '');
      currentSlide = { layout: 'content', title };
      i++;
      continue;
    }

    // Bullet point
    if (trimmed.match(/^-\s+(.+)$/)) {
      const bullet = trimmed.replace(/^-\s+/, '');
      currentBullets.push(bullet);
      i++;
      continue;
    }

    // Speaker notes (blockquote)
    if (trimmed.match(/^>\s+(.+)$/)) {
      const note = trimmed.replace(/^>\s+/, '');
      currentNotes.push(note);
      i++;
      continue;
    }

    // Image reference
    if (trimmed.match(/^!\[image\]\((.+)\)$/)) {
      const imagePath = trimmed.match(/^!\[image\]\((.+)\)$/)?.[1] || '';
      if (currentSlide) {
        currentSlide.image = imagePath;
        if (currentSlide.layout === 'content') {
          currentSlide.layout = 'content-image';
        }
      }
      i++;
      continue;
    }

    i++;
  }

  // Finalize last slide
  finalizeSlide();

  // Add closing slide if not present
  const hasClosing = slides.some(s => s.layout === 'closing');
  if (!hasClosing) {
    slides.push({
      layout: 'closing',
      title: 'Thank You',
      subtitle: metadata.author || '',
    });
  }

  return { metadata, slides };
}

// ============================================================================
// SUBPROCESS EXECUTION
// ============================================================================

async function runCommand(cmd: string, args: string[]): Promise<{ success: boolean; stdout: string; stderr: string }> {
  try {
    const proc = spawn([cmd, ...args], {
      stdout: 'pipe',
      stderr: 'pipe',
    });

    const [stdout, stderr] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
    ]);

    await proc.exited;

    return {
      success: proc.exitCode === 0,
      stdout,
      stderr,
    };
  } catch (error) {
    return {
      success: false,
      stdout: '',
      stderr: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================================
// MAIN WORKFLOW
// ============================================================================

async function main() {
  const args = parseArgs(Bun.argv.slice(2));

  // Show help
  if (args.help) {
    showHelp();
    process.exit(0);
  }

  // Check Gamma credits
  if (args.checkCredits) {
    console.log('Checking Gamma credits...');
    const toolsDir = resolve(__dirname);
    const result = await runCommand('bun', [join(toolsDir, 'gamma-client.ts'), '--check-credits']);

    if (result.success) {
      console.log(result.stdout);
      process.exit(0);
    } else {
      console.error('ERROR: Failed to check credits');
      console.error(result.stderr);
      process.exit(1);
    }
  }

  // Validate required arguments
  if (!args.outline) {
    console.error('ERROR: --outline is required (unless using --check-credits)');
    console.error('Run with --help for usage information');
    process.exit(1);
  }

  // Validate brand
  if (!['carbeneai', 'professional'].includes(args.brand)) {
    console.error('ERROR: --brand must be "carbeneai" or "professional"');
    process.exit(1);
  }

  // Validate engine
  if (!['pptx', 'gamma'].includes(args.engine)) {
    console.error('ERROR: --engine must be "pptx" or "gamma"');
    process.exit(1);
  }

  const toolsDir = resolve(__dirname);
  const templatesDir = resolve(toolsDir, '..', 'templates');
  let tempDir: string | null = null;

  try {
    // Read and parse markdown outline
    console.log(`📖 Reading outline from ${args.outline}...`);
    const outlineContent = await readFile(args.outline, 'utf-8');
    const presentation = parseMarkdown(outlineContent);

    console.log(`✓ Parsed ${presentation.slides.length} slides`);

    // If using gamma engine, delegate to gamma-client
    if (args.engine === 'gamma') {
      console.log('🎨 Using Gamma engine...');
      const gammaArgs = [
        join(toolsDir, 'gamma-client.ts'),
        '--outline', args.outline,
        '--brand', args.brand,
        '--output', args.output,
      ];

      const result = await runCommand('bun', gammaArgs);

      if (result.success) {
        console.log(result.stdout);
        console.log(`\n✅ Presentation created → ${args.output} (${presentation.slides.length} slides, gamma engine, ${args.brand} brand)`);
        process.exit(0);
      } else {
        console.error('ERROR: Gamma generation failed');
        console.error(result.stderr);
        process.exit(1);
      }
    }

    // PPTX engine workflow
    console.log('⚙️  Using pptx engine...');

    // Create temp directory
    tempDir = await mkdtemp(join(tmpdir(), 'pptx-'));
    const slidesJsonPath = join(tempDir, 'slides.json');
    const imagesDir = join(tempDir, 'images');
    await mkdir(imagesDir, { recursive: true });

    // Write slides JSON
    const slidesJson = JSON.stringify(presentation, null, 2);
    await writeFile(slidesJsonPath, slidesJson);
    console.log(`✓ Created slides.json in ${tempDir}`);

    // Generate images if requested
    if (args.generateImages) {
      console.log('🎨 Generating AI images...');
      const result = await runCommand('bun', [
        join(toolsDir, 'generate-slide-images.ts'),
        '--input', slidesJsonPath,
        '--brand', args.brand,
        '--output-dir', imagesDir,
      ]);

      if (!result.success) {
        console.error('WARNING: Image generation failed');
        console.error(result.stderr);
      } else {
        console.log('✓ Images generated');
        // TODO: Update slides.json with generated image paths
      }
    }

    // Determine template path
    const templateName = args.brand === 'carbeneai' ? 'carbeneai-master.pptx' : 'professional-master.pptx';
    const templatePath = join(templatesDir, templateName);
    console.log(`✓ Using template: ${templateName}`);

    // Generate presentation using Python builder
    console.log('🔨 Building presentation...');
    const builderArgs = [
      join(toolsDir, 'presentation-builder.py'),
      '--input', slidesJsonPath,
      '--template', templatePath,
      '--output', args.output,
      '--images-dir', imagesDir,
    ];

    const result = await runCommand('python3', builderArgs);

    if (result.success) {
      console.log(`\n✅ Presentation created → ${args.output} (${presentation.slides.length} slides, pptx engine, ${args.brand} brand)`);
    } else {
      console.error('ERROR: Presentation generation failed');
      console.error(result.stderr);
      process.exit(1);
    }

  } catch (error) {
    console.error('ERROR:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    // Cleanup temp directory on success
    if (tempDir) {
      try {
        await rm(tempDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

// ============================================================================
// ENTRY POINT
// ============================================================================

main();
