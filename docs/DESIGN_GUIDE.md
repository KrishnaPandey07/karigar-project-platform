# LocalLink Design & UX Guide

## Principles
1. **Hyperlocal & Human First**: Designed for real neighbors and local service micro-entrepreneurs. Tone is friendly, honest, plain language, and reassuring.
2. **WCAG 2.1 AA Accessibility**:
   - Contrast ratio minimum 4.5:1 for normal text, 3:1 for large text.
   - Visual focus states (`focus-visible:ring-2`) on all interactive buttons, inputs, and links.
   - Screen-reader friendly semantic tags and `aria-label` / `aria-expanded` attributes.
   - Alternative list representation for all map data.
3. **Mobile-First (360px minimum width)**:
   - Touch targets at least 44x44px.
   - Clean responsive collapse: filters collapse into a slide-up bottom sheet on mobile, persistent sidebar on desktop.
4. **Transparency & Confidence**:
   - Every ranking score provides an accessible "Why this ranking?" plain-language breakdown.
   - Clear badges for verified credentials and real-time open status.
5. **Localization (i18n)**:
   - All user-facing strings centralized in `react-i18next` for easy multi-language localization.

## Design Tokens Summary
- **Primary Brand**: Sky / Local Blue (`#0284c7`, `#0369a1`)
- **Success / Open**: Emerald (`#10b981`, `#059669`)
- **Warning / Review**: Amber (`#f59e0b`, `#d97706`)
- **Danger / Favorite**: Rose (`#f43f5e`, `#e11d48`)
- **Neutral Backgrounds**: Slate-50, Slate-100, Slate-900
