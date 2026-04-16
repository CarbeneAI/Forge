#!/usr/bin/env python3
"""
PowerPoint Template Generator for PAI/pptx Skill

Generates two master template files:
1. carbeneai-master.pptx - Dark/neon CarbeneAI theme
2. professional-master.pptx - Professional white/navy theme

Each template contains 6 slide layouts:
- Title (0): Title + subtitle with gradient bar
- Section (1): Section header, large centered text
- Content (2): Title + bullet list area
- Content+Image (3): Title + left text + right image
- Data/Chart (4): Title + full-width content area
- Closing (5): Thank you/contact slide

Author: Hiram (PAI Engineering Agent)
"""

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.oxml.xmlchemy import OxmlElement
import os

# Theme definitions
THEMES = {
    'carbeneai': {
        'name': 'CarbeneAI Dark/Neon',
        'filename': 'carbeneai-master.pptx',
        'colors': {
            'background': RGBColor(10, 10, 18),      # #0a0a12
            'surface': RGBColor(26, 26, 46),         # #1a1a2e
            'primary': RGBColor(0, 212, 255),        # #00d4ff (cyan)
            'accent': RGBColor(168, 85, 247),        # #a855f7 (purple)
            'text': RGBColor(248, 250, 252),         # #f8fafc
            'text_secondary': RGBColor(148, 163, 184) # #94a3b8 (silver)
        },
        'font': 'Arial'
    },
    'professional': {
        'name': 'Professional White/Navy',
        'filename': 'professional-master.pptx',
        'colors': {
            'background': RGBColor(255, 255, 255),   # #ffffff
            'surface': RGBColor(241, 245, 249),      # #f1f5f9
            'primary': RGBColor(30, 58, 138),        # #1e3a8a (navy)
            'accent': RGBColor(59, 130, 246),        # #3b82f6 (blue)
            'text': RGBColor(30, 41, 59),            # #1e293b
            'text_secondary': RGBColor(100, 116, 139) # #64748b (silver)
        },
        'font': 'Arial'
    }
}

# Slide dimensions (16:9 widescreen)
SLIDE_WIDTH = Inches(13.333)
SLIDE_HEIGHT = Inches(7.5)

# Margins and spacing
MARGIN_TOP = Inches(0.5)
MARGIN_BOTTOM = Inches(0.5)
MARGIN_LEFT = Inches(0.5)
MARGIN_RIGHT = Inches(0.5)
ACCENT_BAR_HEIGHT = Inches(0.04)  # 4px thin gradient bar


def add_gradient_bar(slide, theme_colors):
    """Add a thin gradient accent bar at the top of the slide"""
    left = Inches(0)
    top = Inches(0)
    width = SLIDE_WIDTH
    height = ACCENT_BAR_HEIGHT

    shape = slide.shapes.add_shape(
        1,  # Rectangle
        left, top, width, height
    )

    # Set solid fill with primary color (gradient requires XML manipulation)
    fill = shape.fill
    fill.solid()
    fill.fore_color.rgb = theme_colors['primary']

    # Remove line
    shape.line.fill.background()

    return shape


def create_title_layout(prs, theme_colors, font_name):
    """Layout 0: Title slide with centered title and subtitle"""
    slide_layout = prs.slide_layouts[0]
    slide = prs.slides.add_slide(slide_layout)

    # Set background
    background = slide.background
    fill = background.fill
    fill.solid()
    fill.fore_color.rgb = theme_colors['background']

    # Add gradient bar
    add_gradient_bar(slide, theme_colors)

    # Clear existing shapes
    for shape in slide.shapes:
        if hasattr(shape, "text"):
            sp = shape.element
            sp.getparent().remove(sp)

    # Add gradient bar
    add_gradient_bar(slide, theme_colors)

    # Title placeholder (centered)
    left = Inches(1)
    top = Inches(2.5)
    width = Inches(11.333)
    height = Inches(1.5)

    title_box = slide.shapes.add_textbox(left, top, width, height)
    title_frame = title_box.text_frame
    title_frame.text = "Presentation Title"
    title_frame.word_wrap = True

    # Title formatting
    p = title_frame.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    p.font.name = font_name
    p.font.size = Pt(54)
    p.font.bold = True
    p.font.color.rgb = theme_colors['primary']

    # Subtitle placeholder
    left = Inches(1)
    top = Inches(4.2)
    width = Inches(11.333)
    height = Inches(1)

    subtitle_box = slide.shapes.add_textbox(left, top, width, height)
    subtitle_frame = subtitle_box.text_frame
    subtitle_frame.text = "Subtitle or Date"
    subtitle_frame.word_wrap = True

    # Subtitle formatting
    p = subtitle_frame.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    p.font.name = font_name
    p.font.size = Pt(24)
    p.font.color.rgb = theme_colors['text_secondary']

    return slide


def create_section_layout(prs, theme_colors, font_name):
    """Layout 1: Section header with large centered text"""
    slide_layout = prs.slide_layouts[1] if len(prs.slide_layouts) > 1 else prs.slide_layouts[0]
    slide = prs.slides.add_slide(slide_layout)

    # Set background
    background = slide.background
    fill = background.fill
    fill.solid()
    fill.fore_color.rgb = theme_colors['surface']

    # Clear existing shapes
    for shape in list(slide.shapes):
        if hasattr(shape, "text"):
            sp = shape.element
            sp.getparent().remove(sp)

    # Add gradient bar
    add_gradient_bar(slide, theme_colors)

    # Section title (large, centered)
    left = Inches(1)
    top = Inches(2.5)
    width = Inches(11.333)
    height = Inches(2.5)

    section_box = slide.shapes.add_textbox(left, top, width, height)
    section_frame = section_box.text_frame
    section_frame.text = "Section Title"
    section_frame.word_wrap = True
    section_frame.vertical_anchor = MSO_ANCHOR.MIDDLE

    # Section formatting
    p = section_frame.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    p.font.name = font_name
    p.font.size = Pt(60)
    p.font.bold = True
    p.font.color.rgb = theme_colors['primary']

    return slide


def create_content_layout(prs, theme_colors, font_name):
    """Layout 2: Title + bullet list content area"""
    slide_layout = prs.slide_layouts[2] if len(prs.slide_layouts) > 2 else prs.slide_layouts[0]
    slide = prs.slides.add_slide(slide_layout)

    # Set background
    background = slide.background
    fill = background.fill
    fill.solid()
    fill.fore_color.rgb = theme_colors['background']

    # Clear existing shapes
    for shape in list(slide.shapes):
        if hasattr(shape, "text"):
            sp = shape.element
            sp.getparent().remove(sp)

    # Add gradient bar
    add_gradient_bar(slide, theme_colors)

    # Title
    left = MARGIN_LEFT
    top = MARGIN_TOP + ACCENT_BAR_HEIGHT + Inches(0.2)
    width = SLIDE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT
    height = Inches(0.8)

    title_box = slide.shapes.add_textbox(left, top, width, height)
    title_frame = title_box.text_frame
    title_frame.text = "Slide Title"
    title_frame.word_wrap = True

    p = title_frame.paragraphs[0]
    p.font.name = font_name
    p.font.size = Pt(40)
    p.font.bold = True
    p.font.color.rgb = theme_colors['primary']

    # Content area
    left = MARGIN_LEFT + Inches(0.3)
    top = MARGIN_TOP + ACCENT_BAR_HEIGHT + Inches(1.3)
    width = SLIDE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT - Inches(0.3)
    height = SLIDE_HEIGHT - top - MARGIN_BOTTOM

    content_box = slide.shapes.add_textbox(left, top, width, height)
    content_frame = content_box.text_frame
    content_frame.text = "• Bullet point 1\n• Bullet point 2\n• Bullet point 3"
    content_frame.word_wrap = True

    for paragraph in content_frame.paragraphs:
        paragraph.font.name = font_name
        paragraph.font.size = Pt(24)
        paragraph.font.color.rgb = theme_colors['text']
        paragraph.space_before = Pt(12)

    return slide


def create_content_image_layout(prs, theme_colors, font_name):
    """Layout 3: Title + left text + right image placeholder"""
    slide_layout = prs.slide_layouts[3] if len(prs.slide_layouts) > 3 else prs.slide_layouts[0]
    slide = prs.slides.add_slide(slide_layout)

    # Set background
    background = slide.background
    fill = background.fill
    fill.solid()
    fill.fore_color.rgb = theme_colors['background']

    # Clear existing shapes
    for shape in list(slide.shapes):
        if hasattr(shape, "text"):
            sp = shape.element
            sp.getparent().remove(sp)

    # Add gradient bar
    add_gradient_bar(slide, theme_colors)

    # Title
    left = MARGIN_LEFT
    top = MARGIN_TOP + ACCENT_BAR_HEIGHT + Inches(0.2)
    width = SLIDE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT
    height = Inches(0.8)

    title_box = slide.shapes.add_textbox(left, top, width, height)
    title_frame = title_box.text_frame
    title_frame.text = "Slide Title"

    p = title_frame.paragraphs[0]
    p.font.name = font_name
    p.font.size = Pt(40)
    p.font.bold = True
    p.font.color.rgb = theme_colors['primary']

    # Left content area
    content_top = MARGIN_TOP + ACCENT_BAR_HEIGHT + Inches(1.3)
    content_height = SLIDE_HEIGHT - content_top - MARGIN_BOTTOM

    left = MARGIN_LEFT + Inches(0.3)
    width = Inches(6)

    text_box = slide.shapes.add_textbox(left, content_top, width, content_height)
    text_frame = text_box.text_frame
    text_frame.text = "• Key point 1\n• Key point 2\n• Key point 3"
    text_frame.word_wrap = True

    for paragraph in text_frame.paragraphs:
        paragraph.font.name = font_name
        paragraph.font.size = Pt(22)
        paragraph.font.color.rgb = theme_colors['text']
        paragraph.space_before = Pt(10)

    # Right image placeholder
    left = MARGIN_LEFT + Inches(6.5)
    width = SLIDE_WIDTH - left - MARGIN_RIGHT

    image_box = slide.shapes.add_textbox(left, content_top, width, content_height)
    image_frame = image_box.text_frame
    image_frame.text = "[Image Placeholder]"
    image_frame.vertical_anchor = MSO_ANCHOR.MIDDLE

    p = image_frame.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    p.font.name = font_name
    p.font.size = Pt(18)
    p.font.color.rgb = theme_colors['text_secondary']

    # Add border to image area
    image_box.line.color.rgb = theme_colors['text_secondary']
    image_box.line.width = Pt(1)
    image_box.fill.background()

    return slide


def create_data_chart_layout(prs, theme_colors, font_name):
    """Layout 4: Title + full-width content area for charts/tables"""
    slide_layout = prs.slide_layouts[4] if len(prs.slide_layouts) > 4 else prs.slide_layouts[0]
    slide = prs.slides.add_slide(slide_layout)

    # Set background
    background = slide.background
    fill = background.fill
    fill.solid()
    fill.fore_color.rgb = theme_colors['background']

    # Clear existing shapes
    for shape in list(slide.shapes):
        if hasattr(shape, "text"):
            sp = shape.element
            sp.getparent().remove(sp)

    # Add gradient bar
    add_gradient_bar(slide, theme_colors)

    # Title
    left = MARGIN_LEFT
    top = MARGIN_TOP + ACCENT_BAR_HEIGHT + Inches(0.2)
    width = SLIDE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT
    height = Inches(0.8)

    title_box = slide.shapes.add_textbox(left, top, width, height)
    title_frame = title_box.text_frame
    title_frame.text = "Data & Charts"

    p = title_frame.paragraphs[0]
    p.font.name = font_name
    p.font.size = Pt(40)
    p.font.bold = True
    p.font.color.rgb = theme_colors['primary']

    # Full-width content area for charts/data
    left = MARGIN_LEFT
    top = MARGIN_TOP + ACCENT_BAR_HEIGHT + Inches(1.3)
    width = SLIDE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT
    height = SLIDE_HEIGHT - top - MARGIN_BOTTOM

    data_box = slide.shapes.add_textbox(left, top, width, height)
    data_frame = data_box.text_frame
    data_frame.text = "[Chart/Table/Data Visualization Area]"
    data_frame.vertical_anchor = MSO_ANCHOR.MIDDLE

    p = data_frame.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    p.font.name = font_name
    p.font.size = Pt(20)
    p.font.color.rgb = theme_colors['text_secondary']

    # Add subtle border
    data_box.line.color.rgb = theme_colors['text_secondary']
    data_box.line.width = Pt(0.5)
    data_box.line.dash_style = 2  # Dashed
    data_box.fill.background()

    return slide


def create_closing_layout(prs, theme_colors, font_name):
    """Layout 5: Thank you/contact slide with centered text"""
    slide_layout = prs.slide_layouts[5] if len(prs.slide_layouts) > 5 else prs.slide_layouts[0]
    slide = prs.slides.add_slide(slide_layout)

    # Set background
    background = slide.background
    fill = background.fill
    fill.solid()
    fill.fore_color.rgb = theme_colors['surface']

    # Clear existing shapes
    for shape in list(slide.shapes):
        if hasattr(shape, "text"):
            sp = shape.element
            sp.getparent().remove(sp)

    # Add gradient bar
    add_gradient_bar(slide, theme_colors)

    # Main message (Thank You)
    left = Inches(1)
    top = Inches(2)
    width = Inches(11.333)
    height = Inches(1.5)

    thanks_box = slide.shapes.add_textbox(left, top, width, height)
    thanks_frame = thanks_box.text_frame
    thanks_frame.text = "Thank You"
    thanks_frame.vertical_anchor = MSO_ANCHOR.MIDDLE

    p = thanks_frame.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    p.font.name = font_name
    p.font.size = Pt(60)
    p.font.bold = True
    p.font.color.rgb = theme_colors['primary']

    # Contact/additional info
    left = Inches(1)
    top = Inches(4)
    width = Inches(11.333)
    height = Inches(2)

    contact_box = slide.shapes.add_textbox(left, top, width, height)
    contact_frame = contact_box.text_frame
    contact_frame.text = "Questions?\ncontact@example.com\nwww.example.com"
    contact_frame.vertical_anchor = MSO_ANCHOR.MIDDLE

    for paragraph in contact_frame.paragraphs:
        paragraph.alignment = PP_ALIGN.CENTER
        paragraph.font.name = font_name
        paragraph.font.size = Pt(24)
        paragraph.font.color.rgb = theme_colors['text']
        paragraph.space_before = Pt(8)

    return slide


def create_template(theme_name, theme_config, output_dir):
    """Create a complete PowerPoint template with all layouts"""
    print(f"\n📝 Creating {theme_config['name']} template...")

    # Create presentation
    prs = Presentation()

    # Set slide dimensions (16:9)
    prs.slide_width = SLIDE_WIDTH
    prs.slide_height = SLIDE_HEIGHT

    theme_colors = theme_config['colors']
    font_name = theme_config['font']

    # Create all 6 layouts
    layouts = [
        ("Title", create_title_layout),
        ("Section", create_section_layout),
        ("Content", create_content_layout),
        ("Content+Image", create_content_image_layout),
        ("Data/Chart", create_data_chart_layout),
        ("Closing", create_closing_layout)
    ]

    for idx, (layout_name, layout_func) in enumerate(layouts):
        print(f"  ✓ Creating layout {idx}: {layout_name}")
        layout_func(prs, theme_colors, font_name)

    # Save template
    output_path = os.path.join(output_dir, theme_config['filename'])
    prs.save(output_path)
    print(f"  ✅ Saved: {output_path}")

    return output_path


def main():
    """Generate both PowerPoint master templates"""
    print("=" * 70)
    print("PowerPoint Template Generator")
    print("=" * 70)

    # Determine output directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    templates_dir = os.path.join(os.path.dirname(script_dir), 'templates')

    # Create templates directory if it doesn't exist
    os.makedirs(templates_dir, exist_ok=True)
    print(f"\n📁 Output directory: {templates_dir}")

    # Generate both templates
    created_files = []

    for theme_name, theme_config in THEMES.items():
        output_path = create_template(theme_name, theme_config, templates_dir)
        created_files.append(output_path)

    # Verification
    print("\n" + "=" * 70)
    print("✅ GENERATION COMPLETE")
    print("=" * 70)

    for file_path in created_files:
        if os.path.exists(file_path):
            file_size = os.path.getsize(file_path)
            print(f"✓ {os.path.basename(file_path)}")
            print(f"  Size: {file_size:,} bytes")
            print(f"  Path: {file_path}")
        else:
            print(f"✗ FAILED: {file_path}")

    print("\n📊 Summary:")
    print(f"  - Templates created: {len(created_files)}")
    print(f"  - Layouts per template: 6")
    print(f"  - Total slide layouts: {len(created_files) * 6}")
    print("\n🎯 Templates ready for use with PAI pptx skill!")


if __name__ == "__main__":
    main()
