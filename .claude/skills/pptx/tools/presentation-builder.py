#!/usr/bin/env python3
"""
PowerPoint Presentation Builder
Generates .pptx presentations from JSON input using python-pptx
"""

import argparse
import json
import sys
from pathlib import Path
from pptx import Presentation
from pptx.util import Inches, Pt


LAYOUT_MAP = {
    "title": 0,
    "section": 1,
    "content": 2,
    "content-image": 3,
    "data": 4,
    "closing": 5
}


def load_json(input_path):
    """Load and validate JSON input"""
    try:
        with open(input_path, 'r') as f:
            data = json.load(f)

        if 'slides' not in data or not isinstance(data['slides'], list):
            print("Error: JSON must contain 'slides' array", file=sys.stderr)
            sys.exit(1)

        return data
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON - {e}", file=sys.stderr)
        sys.exit(1)
    except FileNotFoundError:
        print(f"Error: Input file not found - {input_path}", file=sys.stderr)
        sys.exit(1)


def add_slide_content(slide, slide_data, images_dir):
    """Fill slide with content based on layout"""
    placeholders = slide.placeholders

    # Title (placeholder 0)
    if 'title' in slide_data and len(placeholders) > 0:
        placeholders[0].text = slide_data['title']

    # Subtitle or bullets (placeholder 1)
    if len(placeholders) > 1:
        if 'subtitle' in slide_data:
            placeholders[1].text = slide_data['subtitle']
        elif 'bullets' in slide_data:
            text_frame = placeholders[1].text_frame
            text_frame.clear()
            for i, bullet in enumerate(slide_data['bullets']):
                p = text_frame.paragraphs[0] if i == 0 else text_frame.add_paragraph()
                p.text = bullet
                p.level = 0

    # Image for content-image layout
    if slide_data.get('layout') == 'content-image' and 'image' in slide_data:
        image_path = Path(images_dir) / slide_data['image'] if images_dir else Path(slide_data['image'])
        if image_path.exists():
            # Add image to right side (adjust positioning as needed)
            left = Inches(6.5)
            top = Inches(2)
            height = Inches(4)
            slide.shapes.add_picture(str(image_path), left, top, height=height)
        else:
            print(f"Warning: Image not found - {image_path}", file=sys.stderr)

    # Speaker notes
    if 'notes' in slide_data:
        notes_slide = slide.notes_slide
        notes_slide.notes_text_frame.text = slide_data['notes']


def build_presentation(input_path, template_path, output_path, images_dir):
    """Build PowerPoint presentation from JSON input"""
    data = load_json(input_path)

    # Load template
    try:
        prs = Presentation(template_path)
    except FileNotFoundError:
        print(f"Error: Template not found - {template_path}", file=sys.stderr)
        sys.exit(1)

    # Set metadata
    metadata = data.get('metadata', {})
    if 'title' in metadata:
        prs.core_properties.title = metadata['title']
    if 'author' in metadata:
        prs.core_properties.author = metadata['author']
    if 'subject' in metadata:
        prs.core_properties.subject = metadata.get('subtitle', '')

    # Create slides
    slide_count = 0
    for slide_data in data['slides']:
        layout_name = slide_data.get('layout', 'content')
        layout_idx = LAYOUT_MAP.get(layout_name, 2)

        if layout_idx >= len(prs.slide_layouts):
            print(f"Warning: Layout index {layout_idx} not found, using 0", file=sys.stderr)
            layout_idx = 0

        slide = prs.slides.add_slide(prs.slide_layouts[layout_idx])
        add_slide_content(slide, slide_data, images_dir)
        slide_count += 1

    # Save output
    try:
        prs.save(output_path)
        print(f"Created {slide_count} slides → {output_path}")
    except Exception as e:
        print(f"Error saving presentation: {e}", file=sys.stderr)
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description='Generate PowerPoint presentations from JSON input',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Example:
  python3 presentation-builder.py \\
    --input slides.json \\
    --template templates/carbeneai-master.pptx \\
    --output presentation.pptx \\
    --images-dir /tmp/slide-images/
        """
    )

    parser.add_argument('--input', required=True, help='Path to JSON file with slide data')
    parser.add_argument('--template', required=True, help='Path to .pptx master template')
    parser.add_argument('--output', required=True, help='Output .pptx path')
    parser.add_argument('--images-dir', help='Directory containing slide images')

    args = parser.parse_args()

    build_presentation(args.input, args.template, args.output, args.images_dir)


if __name__ == '__main__':
    main()
