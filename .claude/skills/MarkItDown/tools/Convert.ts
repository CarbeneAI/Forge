#!/usr/bin/env bun
/**
 * Convert.ts - Convert files to Markdown using Microsoft's markitdown
 *
 * Wraps the markitdown Python library to convert PDF, DOCX, PPTX, XLSX,
 * HTML, images, audio, EPUB, and more to clean Markdown.
 *
 * Usage:
 *   bun Convert.ts <file> [options]
 *   bun Convert.ts <file1> <file2> ... [options]
 *   bun Convert.ts <glob-pattern> [options]
 *
 * Options:
 *   --obsidian          Save output to Obsidian vault
 *   --folder <name>     Obsidian subfolder (default: "Imports")
 *   --name <name>       Custom output filename (without .md)
 *   --stdout            Force output to stdout (default when no --obsidian)
 *   --help              Show this help
 */

import { resolve, basename, extname, dirname } from "path";
import { existsSync, mkdirSync, writeFileSync } from "fs";

const SKILL_DIR = resolve(import.meta.dir, "..");
const MARKITDOWN = resolve(SKILL_DIR, "venv/bin/markitdown");
const OBSIDIAN_VAULT = process.env.OBSIDIAN_VAULT_PATH || resolve(process.env.HOME || "~", "Nextcloud/PAI/Obsidian");

function help() {
  console.log(`
Convert.ts - Convert files to Markdown via markitdown

USAGE:
  bun Convert.ts <file> [options]
  bun Convert.ts file1.pdf file2.docx --obsidian
  bun Convert.ts ~/Documents/*.pdf --obsidian --folder "PDF-Imports"

OPTIONS:
  --obsidian          Save to Obsidian vault (${OBSIDIAN_VAULT})
  --folder <name>     Obsidian subfolder (default: "Imports")
  --name <name>       Custom output filename (without .md extension)
  --stdout            Force output to stdout even with --obsidian
  --help              Show this help

SUPPORTED FORMATS:
  PDF, DOCX, PPTX, XLSX, XLS, HTML, CSV, JSON, XML,
  Images (JPG, PNG, etc.), Audio (MP3, WAV), .msg, EPUB, ZIP

EXAMPLES:
  bun Convert.ts report.pdf
  bun Convert.ts slides.pptx --obsidian
  bun Convert.ts data.xlsx --obsidian --folder "Spreadsheets"
  bun Convert.ts photo.jpg --obsidian --name "Meeting Whiteboard"
`);
  process.exit(0);
}

// Parse args
const args = process.argv.slice(2);
if (args.length === 0 || args.includes("--help")) help();

let obsidian = false;
let folder = "Imports";
let customName = "";
let forceStdout = false;
const files: string[] = [];

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "--obsidian") { obsidian = true; continue; }
  if (arg === "--folder") { folder = args[++i] || "Imports"; continue; }
  if (arg === "--name") { customName = args[++i] || ""; continue; }
  if (arg === "--stdout") { forceStdout = true; continue; }
  if (arg.startsWith("--")) { console.error(`Unknown option: ${arg}`); process.exit(1); }
  files.push(arg);
}

if (files.length === 0) {
  console.error("Error: No input files specified");
  process.exit(1);
}

// Verify markitdown is installed
if (!existsSync(MARKITDOWN)) {
  console.error(`Error: markitdown not found at ${MARKITDOWN}`);
  console.error("Run: python3 -m venv ${PAI_DIR}/skills/MarkItDown/venv && ${PAI_DIR}/skills/MarkItDown/venv/bin/pip install 'markitdown[all]'");
  process.exit(1);
}

async function convertFile(filePath: string): Promise<{ markdown: string; source: string }> {
  const absPath = resolve(filePath);
  if (!existsSync(absPath)) {
    throw new Error(`File not found: ${absPath}`);
  }

  const proc = Bun.spawn([MARKITDOWN, absPath], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    throw new Error(`markitdown failed (exit ${exitCode}): ${stderr.trim()}`);
  }

  return { markdown: stdout, source: absPath };
}

function saveToObsidian(markdown: string, sourcePath: string, outputName?: string): string {
  const outputDir = resolve(OBSIDIAN_VAULT, folder);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const name = outputName || basename(sourcePath, extname(sourcePath));
  const safeName = name.replace(/[^\w\s-]/g, "").replace(/\s+/g, " ").trim();
  const outputPath = resolve(outputDir, `${safeName}.md`);

  // Add frontmatter with source info
  const date = new Date().toISOString().split("T")[0];
  const frontmatter = `---
source: "${basename(sourcePath)}"
converted: ${date}
tool: markitdown
---

`;

  writeFileSync(outputPath, frontmatter + markdown);
  return outputPath;
}

// Process files
let successCount = 0;
let errorCount = 0;

for (const file of files) {
  try {
    const { markdown, source } = await convertFile(file);

    if (obsidian && !forceStdout) {
      const nameToUse = files.length === 1 ? customName : "";
      const savedPath = saveToObsidian(markdown, source, nameToUse || undefined);
      console.log(`Converted: ${basename(source)} → ${savedPath}`);
      successCount++;
    } else {
      if (files.length > 1) {
        console.log(`\n--- ${basename(source)} ---\n`);
      }
      console.log(markdown);
      successCount++;
    }
  } catch (err: any) {
    console.error(`Error converting ${file}: ${err.message}`);
    errorCount++;
  }
}

if (files.length > 1) {
  console.error(`\nDone: ${successCount} converted, ${errorCount} errors`);
}
