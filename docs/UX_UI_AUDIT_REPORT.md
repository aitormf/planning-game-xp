# UX/UI Audit Report — Planning Game V1

**Date**: 2026-03-18
**Task**: PLN-TSK-0319
**Branch**: feat/PLN-TSK-0319-ux-ui-audit

---

## Anti-Patterns Verdict

**PASS — No AI slop detected.** The design is professional, hand-crafted with architectural discipline. The 3-layer token system (primitives → semantic → components) is well-engineered. No bounce easing, no glassmorphism abuse, no nested cards, no gratuitous animations. Overall score: **A-**.

---

## Executive Summary

| Severity | Count | Categories |
|----------|-------|------------|
| Critical | 5 | Accessibility (ARIA, keyboard, focus traps) |
| High | 12 | Theming (94+ hard-coded colors, no dark mode in 41 files), Performance (layout thrashing, expensive animations), Responsive (fixed widths) |
| Medium | 18 | Missing breakpoints, touch targets, event leaks, spacing inconsistency |
| Low | 8 | Minor ARIA, decorative elements, font size standardization |

### Top 5 Critical Issues

1. **MultiSelect/ProjectSelector**: Divs used as buttons without ARIA roles or keyboard support (WCAG 2.1.1, 4.1.2)
2. **94+ hard-coded colors**: Components don't use design tokens → dark mode broken in 41/41 style files
3. **NotificationBell modal**: No focus trap, no Escape key handler, no role="dialog" (WCAG 2.4.3)
4. **MenuNav.js layout thrashing**: Read/write layout properties causing forced synchronous reflows
5. **Fixed card widths (300px)**: Cards overflow on mobile < 320px

---

## Detailed Findings

### CRITICAL — Accessibility

| # | Component | Issue | WCAG | Fix |
|---|-----------|-------|------|-----|
| 1 | MultiSelect.js:44,54 | Divs with @click as buttons, no keyboard | 2.1.1, 4.1.2 | Replace with `<button>`, add ArrowUp/Down/Enter |
| 2 | ProjectSelector.js:44,54 | Same div-as-button pattern | 2.1.1, 4.1.2 | Same fix |
| 3 | MultiSelect.js:63-65 | Checkboxes without `<label>` association | 1.3.1, 3.3.2 | Wrap in `<label>` or add `for` attribute |
| 4 | NotificationBell.js modal | No focus trap, no Escape, no role="dialog" | 2.1.1, 2.4.3 | Add focus trap, Escape handler, ARIA |
| 5 | MenuNav.astro | Missing skip-to-main-content link | 2.4.1 | Add skip link before nav |

### HIGH — Theming

| # | Issue | Count | Impact |
|---|-------|-------|--------|
| 6 | Hard-coded hex colors in style files | 94+ | Dark mode doesn't work; themes ignored |
| 7 | All 41 style files lack dark mode variants | 41 files | Complete dark mode failure |
| 8 | Brand color mismatch: `#4a9eff` vs `--brand-primary` (#6366f1) | 5+ files | Inconsistent brand appearance |
| 9 | Hard-coded gradients (no tokens) | 6 | Don't respond to theme changes |
| 10 | theme-config.json stale values | 1 file | Config doesn't match semantic tokens |

### HIGH — Performance

| # | Component | Issue | Impact |
|---|-----------|-------|--------|
| 11 | MenuNav.js:65-73 | Layout thrashing: read then write in sequence | Forced synchronous reflows on every hover |
| 12 | push-notification-styles.js:9 | Animating `top` property | Layout recalc every frame |
| 13 | state-history-viewer-styles.js:460 | Animating `width` property | Layout recalc every frame |

### HIGH — Responsive

| # | Component | Issue | Impact |
|---|-----------|-------|--------|
| 14 | qa/epic/proposal-card-styles.js | Fixed width: 300px | Overflow on < 320px screens |
| 15 | notification-bell-styles.js:56 | Modal 380px, no mobile breakpoint | Clipped on mobile |
| 16 | 11 components | Zero @media queries | No mobile adaptation |

### MEDIUM — Various

| # | Issue | Count |
|---|-------|-------|
| 17 | Touch targets < 44px | 4 components |
| 18 | NotificationBell.js event listener leaks | 2 listeners |
| 19 | avatar-eyes.js mousemove without rAF throttle | 60+ fires/sec |
| 20 | Tables without overflow-x wrapper | 4 components |
| 21 | Missing focus-visible styles | 3 components |
| 22 | Hard-coded spacing (rem/px) instead of tokens | 200+ occurrences |
| 23 | Hard-coded font sizes instead of tokens | 80+ occurrences |
| 24 | MenuNav: missing aria-current="page" | 1 component |

---

## Positive Findings

- **Token architecture**: Excellent 3-layer system (primitives → semantic → components)
- **ColorTabs.js**: Proper ARIA tab roles, keyboard navigation, focus management
- **ThemeToggle.js**: Proper button with aria-label and focus-visible
- **YearSelector.js**: Proper `<select>` with `<label>` association
- **Animation discipline**: All animations serve a purpose, conservative durations (0.15-0.5s)
- **No AI slop**: Zero glassmorphism, bounce easing, nested cards, or decorative gradients
- **Dark theme infrastructure**: Fully defined in dark-theme.js, just not connected to components

---

## Recommended Fix Order

### Immediate (this session)
1. `/harden` — Fix critical accessibility: MultiSelect, ProjectSelector, NotificationBell ARIA + keyboard
2. `/normalize` — Replace top hard-coded colors with design tokens in critical components
3. `/optimize` — Fix MenuNav layout thrashing, expensive animations

### Short-term (next sprint)
4. `/adapt` — Add mobile breakpoints to 11 components, fix card widths
5. `/normalize` — Complete token migration for all 41 style files
6. `/harden` — Fix event listener leaks, add focus-visible styles

### Medium-term
7. `/extract` — Unify button patterns into shared component tokens
8. `/polish` — Standardize spacing/font-size token usage across all components
9. `/optimize` — Add lazy loading, rAF throttling for expensive listeners

### Long-term
10. Add CSS linter rules to prevent hard-coded colors
11. Visual regression tests for theme switching
12. WCAG AA compliance audit with axe DevTools
