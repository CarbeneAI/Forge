# Presentation Templates

## Available Templates

| Template | File | Theme |
|----------|------|-------|
| CarbeneAI | `carbeneai-master.pptx` | Dark background, cyan/purple neon accents |
| Professional | `professional-master.pptx` | White background, navy/blue corporate style |

## Slide Layouts (Both Templates)

| Index | Name | Use For |
|-------|------|---------|
| 0 | Title | Opening slide with title + subtitle |
| 1 | Section | Section dividers between topics |
| 2 | Content | Standard bullet point slides |
| 3 | Content+Image | Text on left, image on right |
| 4 | Data/Chart | Full-width area for charts/tables |
| 5 | Closing | Thank you / contact information |

## Regenerating Templates

If templates need to be updated or regenerated:

```bash
cd ~/Forge/.claude/skills/pptx
python3 tools/create-templates.py
```

This creates both template files in this directory.

## Color Specifications

### CarbeneAI
- Background: `#0a0a12`
- Surface: `#1a1a2e`
- Primary (Cyan): `#00d4ff`
- Accent (Purple): `#a855f7`
- Text: `#f8fafc`

### Professional
- Background: `#ffffff`
- Surface: `#f1f5f9`
- Primary (Navy): `#1e3a8a`
- Accent (Blue): `#3b82f6`
- Text: `#1e293b`
