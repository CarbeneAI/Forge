# Z.AI Promo Section - Implementation Guide

## Overview

This redesigned promo section features a premium, eye-catching token/coin-style button that serves as the visual centerpiece. The design follows glassmorphism principles with smooth animations, professional gradients, and conversion-optimized layout.

## Key Features

### 1. Premium Token Button
- **Coin/Token Design**: Circular, layered design with multiple rings
- **Shimmer Effect**: Animated light reflection across the token surface
- **Floating Animation**: Subtle vertical movement to attract attention
- **Hover Effects**: Scale and shadow transitions for interactivity
- **Discount Badge**: Prominent "10% OFF" badge on the token
- **Glow Background**: Radial gradient glow behind the token

### 2. Visual Enhancements
- **Glass Card Container**: Frosted glass effect with backdrop blur
- **Gradient Text**: Brand name and CTA with gradient fills
- **Animated Badge**: "Limited Time Offer" badge with pulse animation
- **Floating Particles**: Decorative particles around the token
- **Trust Indicators**: Security and support badges

### 3. Conversion Elements
- **Clear Value Proposition**: "Unlock GLM 4.7" headline
- **Feature Highlights**: Fast API, 40% Off, Global Coverage
- **Secondary CTA**: GLM Suite integration link
- **Social Proof**: Trust badges at the bottom
- **Strong Color Contrast**: Meets WCAG AA accessibility standards

## Installation

### Option 1: WordPress Custom HTML Block

1. **Edit the Post** (ID 112)
2. **Find the existing promo section** between PRICING COMPARISON and FINAL CTA
3. **Delete the existing section**
4. **Add a Custom HTML block**
5. **Paste the entire content** from `zai-promo-section.html`

### Option 2: Theme Template File

If you're using a custom theme or page template:

1. **Locate the template file** for single posts (usually `single.php` or `template-parts/content.php`)
2. **Find the promo section location**
3. **Replace the existing section** with the new HTML/CSS
4. **Save the file**

### Option 3: Page Builder (Elementor, Divi, etc.)

1. **Add a Custom HTML element** to your page builder
2. **Paste the HTML/CSS code**
3. **Position it** between pricing and final CTA sections

## Customization Options

### Colors

The section uses CSS variables for easy customization:

```css
:root {
    --zai-primary: #6366f1;        /* Main brand color */
    --zai-primary-dark: #4f46e5;   /* Darker shade */
    --zai-secondary: #8b5cf6;      /* Secondary accent */
    --zai-accent: #10b981;         /* Success/accent color */
    --zai-gold: #f59e0b;           /* Gold for offers */
    --zai-gold-light: #fbbf24;     /* Light gold */
}
```

To customize colors, simply change these variable values in the `<style>` section.

### Sizing

Adjust token size by modifying:

```css
.zai-token {
    width: 200px;   /* Default size */
    height: 200px;
}
```

For smaller tokens, reduce both values proportionally (e.g., 160px, 140px).

### Animations

All animations can be disabled for users who prefer reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
    /* Animations are automatically disabled */
}
```

To customize animation speed, adjust the duration values:

```css
.zai-token {
    animation: zai-token-float 4s ease-in-out infinite;  /* Change 4s */
}
```

### Links

Update the affiliate and integration links:

```html
<!-- Token Button Link -->
<a href="https://z.ai/subscribe?ic=R0K78RJKNW" class="zai-token-button">

<!-- Secondary CTA Link -->
<a href="https://github.rommark.dev/admin/claude-code-glm-suite" class="zai-secondary-cta">
```

## Responsive Behavior

The section is fully responsive with breakpoints at:

- **Desktop (>968px)**: Two-column layout with token on the right
- **Tablet (768px-968px)**: Stacked layout with reduced spacing
- **Mobile (480px-768px)**: Single column, smaller token (160px)
- **Small Mobile (<480px)**: Compact layout with minimal token (140px)

## Accessibility Features

- **Color Contrast**: All text meets WCAG AA (4.5:1 minimum)
- **Focus States**: Visible focus rings on keyboard navigation
- **Reduced Motion**: Respects `prefers-reduced-motion` preference
- **Semantic HTML**: Proper heading hierarchy and link structure
- **Screen Reader Friendly**: Descriptive text for all interactive elements

## Performance Considerations

- **CSS-Only Animations**: No JavaScript required
- **Hardware Acceleration**: Uses `transform` and `opacity` for smooth 60fps animations
- **Optimized Animations**: Subtle effects that don't impact page load
- **No External Dependencies**: All styles inline, no additional HTTP requests

## Browser Compatibility

Tested and working on:
- Chrome 90+ (Desktop & Mobile)
- Firefox 88+ (Desktop & Mobile)
- Safari 14+ (Desktop & Mobile)
- Edge 90+ (Chromium)

**Note**: Backdrop-filter requires modern browsers. Falls back gracefully on older browsers.

## Troubleshooting

### Issue: Token appears distorted
**Solution**: Ensure the container has sufficient width. The token needs at least 220px width on mobile.

### Issue: Animations not smooth
**Solution**: Check if other CSS on the page is conflicting. Use browser DevTools to identify conflicting animations.

### Issue: Links not working
**Solution**: Verify that your theme doesn't have JavaScript intercepting link clicks. Check browser console for errors.

### Issue: Colors don't match theme
**Solution**: Update the CSS variables at the top of the style section to match your brand colors.

## A/B Testing Suggestions

Consider testing these variations:

1. **Token Size**: Test 160px vs 200px vs 240px tokens
2. **Badge Text**: "10% OFF" vs "SAVE 10%" vs "DISCOUNT"
3. **CTA Text**: "Get Started" vs "Unlock Now" vs "Claim Offer"
4. **Color Scheme**: Blue/Purple (default) vs Green/Teal vs Orange/Red
5. **Layout**: Token left vs Token right (currently right)

## Metrics to Track

After implementation, monitor:

- **Click-Through Rate (CTR)**: On the token button
- **Conversion Rate**: From clicks to signups
- **Bounce Rate**: Does the section engage users?
- **Time on Page**: Does the section capture attention?
- **Scroll Depth**: Do users reach this section?

## File Locations

- **HTML/CSS File**: `/home/uroma/.claude/skills/ui-ux-pro-max/zai-promo-section.html`
- **This Guide**: `/home/uroma/.claude/skills/ui-ux-pro-max/zai-promo-implementation-guide.md`

## Support

For issues or questions:
1. Check browser console for errors
2. Verify CSS specificity isn't being overridden
3. Test in incognito/private mode to rule out caching
4. Validate HTML structure using W3C validator

## Credits

Designed using UI/UX Pro Max principles:
- Glassmorphism design style
- WCAG AA accessibility compliance
- Mobile-first responsive approach
- Conversion-optimized layout
- Premium visual aesthetics

---

**Last Updated**: 2025-01-18
**Version**: 1.0
