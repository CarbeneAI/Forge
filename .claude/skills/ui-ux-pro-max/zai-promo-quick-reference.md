# Z.AI Promo Section - Quick Reference

## One-Line Summary
Premium glassmorphism promo section with animated coin/token button featuring gradients, shimmer effects, and conversion-optimized layout.

## File to Use
**`zai-promo-section.html`** - Copy this entire file content into WordPress Custom HTML block

## Quick Install (WordPress)
1. Edit Post ID 112
2. Find existing promo section (between PRICING COMPARISON and FINAL CTA)
3. Delete old section
4. Add "Custom HTML" block
5. Paste content from `zai-promo-section.html`
6. Save/update post

## Preview Before Installing
Open `zai-promo-preview.html` in browser to see full design with dark mode toggle

## Key Links in Code
- **Token Button**: `https://z.ai/subscribe?ic=R0K78RJKNW`
- **GLM Suite**: `https://github.rommark.dev/admin/claude-code-glm-suite`

## Quick Customization

### Change Colors
Edit CSS variables at top of `<style>`:
```css
:root {
    --zai-primary: #6366f1;      /* Main brand color */
    --zai-secondary: #8b5cf6;    /* Secondary accent */
    --zai-gold: #f59e0b;         /* Gold for offers */
}
```

### Change Token Size
```css
.zai-token {
    width: 200px;   /* Default */
    height: 200px;  /* Keep both same */
}
```

Mobile sizes automatically scale (160px → 140px)

### Change Discount Text
Find in HTML:
```html
<span class="zai-discount-text">10% OFF</span>
```

### Change Badge Text
Find in HTML:
```html
<span class="zai-badge-text">Limited Time Offer</span>
```

## Design Specs

| Element | Value |
|---------|-------|
| Token Size | 200px (desktop), 160px (tablet), 140px (mobile) |
| Card Radius | 24px |
| Primary Color | #6366f1 (Indigo) |
| Secondary Color | #8b5cf6 (Purple) |
| Gold/Accent | #f59e0b |
| Font Family | System fonts (San Francisco, Segoe UI, Roboto) |
| Animation Speed | 2-4s (subtle, not distracting) |

## Responsive Breakpoints
- **Desktop**: >968px - Two columns, token on right
- **Tablet**: 768-968px - Stacked, full-width
- **Mobile**: 480-768px - Single column, smaller token
- **Small**: <480px - Compact layout

## Browser Support
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Falls back gracefully on older browsers
- Backdrop-filter not required for core functionality

## Accessibility
- WCAG AA compliant (4.5:1 contrast)
- Keyboard navigable
- Reduced motion support
- Screen reader friendly
- Focus indicators visible

## Performance
- CSS-only, no JavaScript required
- ~8KB inline styles
- 60fps animations (GPU accelerated)
- Zero external requests
- No layout shift (CLS = 0)

## Troubleshooting

### Token looks distorted
→ Check container width (needs 220px minimum)

### Animations not smooth
→ Check for conflicting CSS in theme

### Links not working
→ Check for JavaScript intercepting clicks

### Colors don't match theme
→ Update CSS variables at top of style

### Glass effect not visible
→ Ensure backdrop-filter is supported (modern browsers)

## What Makes This Design Work

1. **Visual Hierarchy**: Token is clear focal point
2. **Motion Design**: Subtle animations attract attention
3. **Color Psychology**: Blue/purple = trust, gold = value
4. **Glassmorphism**: Modern, premium aesthetic
5. **Conversion Focus**: Clear CTAs with trust signals
6. **Accessibility**: Usable by everyone
7. **Performance**: Fast, smooth, no dependencies

## Testing Checklist

- [ ] Open preview file in browser
- [ ] Check token floats and animates
- [ ] Hover over token (should scale)
- [ ] Click token button (should navigate)
- [ ] Resize browser (test responsive)
- [ ] Toggle dark mode (if in preview)
- [ ] Tab through elements (keyboard nav)
- [ ] Check for console errors
- [ ] Test on mobile device
- [ ] Verify contrast is sufficient

## Files Overview

| File | Purpose | When to Use |
|------|---------|-------------|
| `zai-promo-section.html` | Production code | Copy to WordPress |
| `zai-promo-preview.html` | Testing/preview | Open in browser |
| `zai-promo-implementation-guide.md` | Setup guide | First-time install |
| `zai-promo-design-reference.md` | Detailed specs | Customization |
| `zai-promo-summary.md` | Project overview | Understanding |
| `zai-promo-quick-reference.md` | This file | Quick lookup |

## A/B Testing Ideas

Test these variations:
1. Token size: 160px vs 200px vs 240px
2. Badge: "10% OFF" vs "SAVE 10%" vs "DISCOUNT"
3. CTA: "Get Started" vs "Unlock Now" vs "Claim Offer"
4. Colors: Blue/Purple vs Green/Teal vs Orange/Red
5. Layout: Token left vs Token right

## Metrics to Track

- Click-through rate (CTR)
- Conversion rate
- Bounce rate
- Time on page
- Scroll depth
- Mobile vs desktop performance

## Success Indicators

✅ Token button stands out visually
✅ Animations are smooth (60fps)
✅ Design matches article aesthetic
✅ Mobile experience is excellent
✅ Accessibility requirements met
✅ Performance is optimal
✅ Conversions improve

---

**Need Help?**
- Full details: `zai-promo-summary.md`
- Setup guide: `zai-promo-implementation-guide.md`
- Design specs: `zai-promo-design-reference.md`

**Quick Start**: Open `zai-promo-preview.html` → See design → Copy `zai-promo-section.html` to WordPress ✅
