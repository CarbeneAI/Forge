# UI/UX Pro Max - Design Intelligence Skill

Professional design intelligence for web and mobile interfaces with comprehensive accessibility support, modern design patterns, and technology-specific best practices.

## Overview

UI/UX Pro Max provides expert-level design guidance for:
- **50+ Design Styles**: Glassmorphism, Neumorphism, Claymorphism, Bento Grids, Brutalism, Minimalism, and more
- **97 Color Palettes**: Industry-specific color schemes for SaaS, E-commerce, Healthcare, Fintech, etc.
- **57 Font Pairings**: Typography combinations for elegant, modern, playful, professional, and technical contexts
- **Comprehensive Accessibility**: WCAG 2.1 AA/AAA compliance guidelines
- **Stack-Specific Guidance**: React, Next.js, Vue, Svelte, Tailwind CSS, shadcn/ui patterns

## Skill Structure

```
ui-ux-pro-max/
├── README.md                      # This file
└── scripts/
    └── search.py                  # Design knowledge search tool
```

## Core Components

### 1. Design Knowledge Base

The `search.py` script contains a comprehensive design knowledge base organized into domains:

#### Product Types
- **SaaS**: Clean, modern, professional with clear CTAs and social proof
- **E-commerce**: Visual, product-focused with trust badges and urgency indicators
- **Portfolio**: Minimal, showcase-driven with large imagery
- **Healthcare**: Trustworthy, WCAG AAA compliant, privacy-focused
- **Fintech**: Secure, professional with bank-level security UI patterns
- **Blog**: Readable, content-focused with strong typography
- **Dashboard**: Data-rich with clear visualization and filter controls
- **Landing Page**: Conversion-focused with strong CTAs and social proof

#### Design Styles
- **Glassmorphism**: Frosted glass effects with blur and transparency
- **Minimalism**: Clean, simple, content-focused design
- **Brutalism**: Bold, raw, high-contrast aesthetics
- **Neumorphism**: Soft UI with extruded shapes
- **Dark Mode**: Reduced eye strain with proper contrast
- **Bento Grid**: Modular grid layouts
- **Claymorphism**: 3D clay-like elements

#### Typography Categories
- **Elegant**: Serif headings + Sans-serif body (luxury brands)
- **Modern**: Sans-serif throughout with weight variation (SaaS, tech)
- **Playful**: Rounded geometric fonts (lifestyle apps)
- **Professional**: Corporate sans-serif (B2B, financial)
- **Technical**: Monospace for code (developer tools)

#### Color Systems
Industry-specific color palettes with primary, secondary, accent, background, text, and border colors.

#### UX Principles
- **Accessibility**: WCAG 2.1 AA/AAA compliance
- **Animation**: 150-300ms timing, easing functions, reduced motion
- **Z-Index Management**: Organized stacking context (10, 20, 30, 50)
- **Loading Patterns**: Skeleton screens, spinners, progress bars
- **Forms**: Clear labels, inline validation, error handling

#### Landing Page Elements
- **Hero Sections**: Value propositions, CTAs, social proof
- **Testimonials**: Customer quotes with photos and results
- **Pricing Tables**: Clear differentiation, annual/monthly toggle
- **Social Proof**: Logos, user counts, ratings, case studies

#### Chart Types
- **Trend**: Line charts, area charts for time-series data
- **Comparison**: Bar charts for category comparison
- **Timeline**: Gantt charts for schedules
- **Funnel**: Conversion and sales pipeline visualization
- **Pie**: Parts-of-whole with accessibility considerations

#### Technology Stack Patterns
- **React**: Performance optimization, component patterns
- **Next.js**: SSR/SSG strategies, image optimization
- **Vue**: Composition API, reactivity system
- **Tailwind**: Utility-first approach, responsive design
- **shadcn/ui**: Component customization, theming

### 2. Search Tool

The `search.py` script provides command-line access to the design knowledge base.

#### Usage

```bash
# Search within a domain
python scripts/search.py "dashboard" --domain product

# Search design styles
python scripts/search.py "glassmorphism" --domain style

# Search UX principles
python scripts/search.py "accessibility" --domain ux

# Search technology-specific patterns
python scripts/search.py "performance" --stack react

# Limit results
python scripts/search.py "color" --domain product --max-results 5
```

#### Available Domains

- `product` - Product types (SaaS, e-commerce, portfolio, etc.)
- `style` - Design styles (glassmorphism, minimalism, etc.)
- `typography` - Font pairings and usage
- `color` - Color systems and palettes
- `ux` - UX principles and patterns
- `landing` - Landing page elements
- `chart` - Chart types and usage
- `stack` - Technology stack patterns

#### Available Stacks

- `react` - React-specific patterns
- `nextjs` - Next.js optimization strategies
- `vue` - Vue.js best practices
- `tailwind` - Tailwind CSS patterns
- `shadcn` - shadcn/ui customization

## Critical Design Rules

### Accessibility (Non-Negotiable)

1. **Color Contrast**: 4.5:1 minimum for normal text, 3:1 for large text
2. **Focus Indicators**: Visible focus rings on all interactive elements
3. **Alt Text**: Descriptive text for all meaningful images
4. **ARIA Labels**: For icon-only buttons and interactive elements
5. **Form Labels**: Explicit labels with `for` attribute
6. **Semantic HTML**: Proper use of button, nav, main, section, article
7. **Keyboard Navigation**: Tab order matches visual order

### Touch & Interaction

1. **Touch Targets**: Minimum 44x44px for mobile
2. **Cursor Feedback**: `cursor-pointer` on all clickable elements
3. **Loading States**: Show loading indicators during async operations
4. **Error Messages**: Clear, specific, near the problem
5. **Hover Feedback**: Color, shadow, or border changes (NOT scale transforms)
6. **Disabled States**: Clear visual indication for disabled elements

### Professional Visual Quality

1. **No Emoji Icons**: Use SVG icons (Heroicons, Lucide, Simple Icons)
2. **Consistent Sizing**: Icons at w-6 h-6 in Tailwind (24x24px viewBox)
3. **Correct Brand Logos**: Verify from Simple Icons project
4. **Smooth Transitions**: 150-300ms duration (not instant or >500ms)
5. **Consistent Spacing**: 4px/8px grid system
6. **Z-Index Scale**: 10 (tooltips), 20 (modals), 30 (notifications), 50 (alerts)

### Light/Dark Mode

**Light Mode:**
- Glass cards: `bg-white/80` or higher (NOT `bg-white/10`)
- Body text: `#0F172A` (slate-900)
- Muted text: `#475569` (slate-600) minimum (NOT gray-400)
- Borders: `border-gray-200` (NOT `border-white/10`)

**Dark Mode:**
- Background: `#0f172a` (slate-900)
- Cards: `#1e293b` (slate-800)
- Text: `#f8fafc` (slate-50)
- Accent: `#6366f1` (indigo-500)

## Common Anti-Patterns to Avoid

### Icons
❌ DON'T: Use emojis as icons (🎨 🚀 ⚙️)
✅ DO: Use SVG icons from Heroicons or Lucide

❌ DON'T: Mix icon sizes randomly
✅ DO: Consistent sizing (w-6 h-6 in Tailwind)

### Hover Effects
❌ DON'T: Use scale transforms that shift layout
✅ DO: Use color/opacity transitions

❌ DON'T: No hover feedback
✅ DO: Always provide visual feedback

### Light Mode Visibility
❌ DON'T: `bg-white/10` for glass cards (invisible)
✅ DO: `bg-white/80` or higher opacity

❌ DON'T: `text-gray-400` for body text (unreadable)
✅ DO: `text-slate-600` (#475569) minimum

❌ DON'T: `border-white/10` for borders (invisible)
✅ DO: `border-gray-200` or darker

### Accessibility Violations
❌ DON'T: Remove outline (focus-visible)
✅ DO: Style focus rings attractively

❌ DON'T: Use color alone for meaning
✅ DO: Use icons + text

## Pre-Delivery Checklist

Before delivering any UI code, verify:

**Visual Quality:**
- [ ] No emojis used as icons
- [ ] All icons from consistent set (Heroicons/Lucide)
- [ ] Brand logos are correct
- [ ] Hover states don't cause layout shift
- [ ] Smooth transitions (150-300ms)

**Interaction:**
- [ ] All clickable elements have `cursor-pointer`
- [ ] Hover states provide clear feedback
- [ ] Focus states are visible
- [ ] Loading states for async actions
- [ ] Disabled states are clear

**Accessibility:**
- [ ] Color contrast meets WCAG AA (4.5:1 minimum)
- [ ] All interactive elements are keyboard accessible
- [ ] ARIA labels for icon-only buttons
- [ ] Alt text for meaningful images
- [ ] Form inputs have associated labels
- [ ] Semantic HTML used correctly

**Responsive:**
- [ ] Works on mobile (320px minimum)
- [ ] Touch targets are 44x44px minimum
- [ ] Text is readable without zooming
- [ ] No horizontal scroll on mobile
- [ ] Images are responsive (srcset, WebP)

**Performance:**
- [ ] Images optimized (WebP, lazy loading)
- [ ] Reduced motion support checked
- [ ] No layout shift (CLSR < 0.1)
- [ ] Fast first contentful paint

## Integration with Claude Code

This skill integrates with the UI/UX Pro Max agent located at:
```
/tmp/claude-repo/agents/design/ui-ux-pro-max.md
```

The agent provides comprehensive design intelligence and automatically triggers when:
- Building UI components (buttons, modals, forms, cards, etc.)
- Creating pages or layouts
- Reviewing or fixing existing UI
- Making design decisions (colors, fonts, styles)
- Working with specific tech stacks (React, Tailwind, etc.)

## File Locations

- **Skill Directory**: `/tmp/claude-repo/skills/ui-ux-pro-max/`
- **Search Script**: `/tmp/claude-repo/skills/ui-ux-pro-max/scripts/search.py`
- **Agent File**: `/tmp/claude-repo/agents/design/ui-ux-pro-max.md`

## Testing

To verify the search tool works correctly:

```bash
# Test product domain search
cd /tmp/claude-repo/skills/ui-ux-pro-max
python3 scripts/search.py "dashboard" --domain product

# Test style domain search
python3 scripts/search.py "glassmorphism" --domain style

# Test UX domain search
python3 scripts/search.py "accessibility" --domain ux

# Test stack search
python3 scripts/search.py "memo" --stack react
```

All searches should return formatted results with relevant design information.

## Success Metrics

You've succeeded when:
- Interface is intuitive without explanation
- All accessibility requirements are met (WCAG AA minimum)
- Code follows framework best practices
- Design works on mobile and desktop
- User can complete tasks without confusion
- Visuals are professional and consistent

**Remember**: Great design is invisible. Users shouldn't notice your work - they should just enjoy using the product.

## License

This skill is part of the Claude Code customization framework.

## Version History

- **v1.0** - Initial release with comprehensive design knowledge base
- 50+ design styles
- 97 color palettes
- 57 font pairings
- Full WCAG 2.1 AA/AAA accessibility guidelines
- Stack-specific patterns for React, Next.js, Vue, Tailwind, shadcn/ui
