---
name: MarkItDown
description: Convert files (PDF, DOCX, PPTX, XLSX, HTML, images, audio, EPUB, etc.) to Markdown and save to Obsidian vault. USE WHEN user mentions convert to markdown, markitdown, file to markdown, save to obsidian, import document, OR wants to convert any document format to Markdown.
---

# MarkItDown

Convert any document to clean Markdown using Microsoft's markitdown library, with optional save to Obsidian vault.

## Supported Formats

PDF, DOCX, PPTX, XLSX, XLS, HTML, CSV, JSON, XML, images (with OCR), audio (with transcription), .msg (Outlook), EPUB, ZIP archives, YouTube URLs, HTTP URLs

## Workflow Routing

| Action | Trigger | Behavior |
|--------|---------|----------|
| **Convert** | "convert this file to markdown" | Convert file → stdout or save to Obsidian |
| **Batch** | "convert all PDFs in folder" | Convert multiple files in batch |
| **Import** | "import this to obsidian" | Convert + save to Obsidian vault |

## Quick Usage

```bash
# Convert a file and print markdown
bun ${PAI_DIR}/skills/MarkItDown/tools/Convert.ts input.pdf

# Convert and save to Obsidian vault
bun ${PAI_DIR}/skills/MarkItDown/tools/Convert.ts input.pdf --obsidian

# Convert with custom output filename
bun ${PAI_DIR}/skills/MarkItDown/tools/Convert.ts input.pdf --obsidian --name "My Notes"

# Convert to specific Obsidian subfolder
bun ${PAI_DIR}/skills/MarkItDown/tools/Convert.ts input.pdf --obsidian --folder "Imports"

# Batch convert all PDFs in a directory
bun ${PAI_DIR}/skills/MarkItDown/tools/Convert.ts ~/Documents/*.pdf --obsidian --folder "PDF-Imports"
```

## Examples

**Example 1: Convert PDF to Obsidian**
```
User: "Convert this PDF to markdown and save in Obsidian"
→ Runs Convert.ts with --obsidian flag
→ Converts PDF to markdown via markitdown
→ Saves to ~/Nextcloud/PAI/Obsidian/Imports/<filename>.md
→ Reports success with file path
```

**Example 2: Quick conversion for reading**
```
User: "Can you read this DOCX file?"
→ Runs Convert.ts on the file
→ Returns markdown content to conversation
→ Claude can now analyze/summarize the content
```

**Example 3: Batch import**
```
User: "Import all the slides from my presentations folder to Obsidian"
→ Runs Convert.ts on each .pptx file
→ Saves all to Obsidian vault under Imports/
→ Reports count of files converted
```
