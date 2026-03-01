import { css } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';

/**
 * Primitive Tokens - Low-level design tokens
 * These are the raw values that semantic tokens reference.
 * Do not use these directly in components - use semantic tokens instead.
 */
export const PrimitiveTokens = css`
  :host, :root {
    /* ==================== COLOR PALETTE ==================== */

    /* Blue scale (Indigo) */
    --color-blue-50: #eef2ff;
    --color-blue-100: #e0e7ff;
    --color-blue-200: #c7d2fe;
    --color-blue-300: #a5b4fc;
    --color-blue-400: #818cf8;
    --color-blue-500: #6366f1;
    --color-blue-600: #4f46e5;
    --color-blue-700: #4338ca;
    --color-blue-800: #3730a3;
    --color-blue-900: #312e81;

    /* Pink scale (Emerald) */
    --color-pink-50: #ecfdf5;
    --color-pink-100: #d1fae5;
    --color-pink-200: #a7f3d0;
    --color-pink-300: #6ee7b7;
    --color-pink-400: #34d399;
    --color-pink-500: #10b981;
    --color-pink-600: #059669;
    --color-pink-700: #047857;
    --color-pink-800: #065f46;
    --color-pink-900: #064e3b;

    /* Green scale (Tailwind Green) */
    --color-green-50: #f0fdf4;
    --color-green-100: #dcfce7;
    --color-green-200: #bbf7d0;
    --color-green-300: #86efac;
    --color-green-400: #4ade80;
    --color-green-500: #22c55e;
    --color-green-600: #16a34a;
    --color-green-700: #15803d;
    --color-green-800: #166534;
    --color-green-900: #14532d;

    /* Orange scale (Amber) */
    --color-orange-50: #fffbeb;
    --color-orange-100: #fef3c7;
    --color-orange-200: #fde68a;
    --color-orange-300: #fcd34d;
    --color-orange-400: #fbbf24;
    --color-orange-500: #f59e0b;
    --color-orange-600: #d97706;
    --color-orange-700: #b45309;
    --color-orange-800: #92400e;
    --color-orange-900: #78350f;

    /* Red scale (Rose) */
    --color-red-50: #fff1f2;
    --color-red-100: #ffe4e6;
    --color-red-200: #fecdd3;
    --color-red-300: #fda4af;
    --color-red-400: #fb7185;
    --color-red-500: #f43f5e;
    --color-red-600: #e11d48;
    --color-red-700: #be123c;
    --color-red-800: #9f1239;
    --color-red-900: #881337;

    /* Yellow scale (Tailwind Yellow) */
    --color-yellow-50: #fefce8;
    --color-yellow-100: #fef9c3;
    --color-yellow-200: #fef08a;
    --color-yellow-300: #fde047;
    --color-yellow-400: #facc15;
    --color-yellow-500: #eab308;
    --color-yellow-600: #ca8a04;
    --color-yellow-700: #a16207;
    --color-yellow-800: #854d0e;
    --color-yellow-900: #713f12;

    /* Cyan scale (Tailwind Cyan) */
    --color-cyan-50: #ecfeff;
    --color-cyan-100: #cffafe;
    --color-cyan-200: #a5f3fc;
    --color-cyan-300: #67e8f9;
    --color-cyan-400: #22d3ee;
    --color-cyan-500: #06b6d4;
    --color-cyan-600: #0891b2;
    --color-cyan-700: #0e7490;
    --color-cyan-800: #155e75;
    --color-cyan-900: #164e63;

    /* Gray scale (Slate) */
    --color-gray-0: #ffffff;
    --color-gray-50: #f8fafc;
    --color-gray-100: #f1f5f9;
    --color-gray-200: #e2e8f0;
    --color-gray-300: #cbd5e1;
    --color-gray-400: #94a3b8;
    --color-gray-500: #64748b;
    --color-gray-600: #475569;
    --color-gray-700: #334155;
    --color-gray-800: #1e293b;
    --color-gray-900: #0f172a;
    --color-gray-1000: #020617;

    /* ==================== SPACING SCALE ==================== */
    --space-0: 0;
    --space-1: 0.2rem;   /* 3.2px */
    --space-2: 0.5rem;   /* 8px */
    --space-3: 1rem;     /* 16px */
    --space-4: 1.5rem;   /* 24px */
    --space-5: 2rem;     /* 32px */
    --space-6: 3rem;     /* 48px */

    /* ==================== TYPOGRAPHY SCALE ==================== */
    --font-family-sans: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    --font-family-mono: 'JetBrains Mono', 'Fira Code', ui-monospace, 'Cascadia Code', monospace;

    --font-size-2xs: 0.625rem;  /* 10px */
    --font-size-xs: 0.75rem;    /* 12px */
    --font-size-sm: 0.8rem;     /* 12.8px */
    --font-size-base: 1rem;     /* 16px */
    --font-size-lg: 1.1rem;     /* 17.6px */
    --font-size-xl: 1.2rem;     /* 19.2px */
    --font-size-2xl: 1.3rem;    /* 20.8px */
    --font-size-3xl: 1.5rem;    /* 24px */
    --font-size-4xl: 2rem;      /* 32px */

    --font-weight-normal: 400;
    --font-weight-medium: 500;
    --font-weight-semibold: 600;
    --font-weight-bold: 700;

    --line-height-tight: 1.2;
    --line-height-normal: 1.5;
    --line-height-relaxed: 1.75;

    /* ==================== BORDER RADIUS ==================== */
    --radius-none: 0;
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-xl: 16px;
    --radius-2xl: 20px;
    --radius-full: 9999px;

    /* ==================== SHADOWS ==================== */
    --shadow-none: none;
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
    --shadow-md: 0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04);
    --shadow-lg: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
    --shadow-xl: 0 10px 15px -3px rgba(0, 0, 0, 0.06), 0 4px 6px -4px rgba(0, 0, 0, 0.06);
    --shadow-2xl: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.06);
    --shadow-inner: inset 0 2px 4px rgba(0, 0, 0, 0.04);

    /* ==================== TRANSITIONS ==================== */
    --duration-instant: 0ms;
    --duration-fast: 150ms;
    --duration-normal: 200ms;
    --duration-slow: 300ms;
    --duration-slower: 500ms;

    --easing-default: ease;
    --easing-in: ease-in;
    --easing-out: ease-out;
    --easing-in-out: ease-in-out;

    /* ==================== Z-INDEX SCALE ==================== */
    --z-base: 0;
    --z-above: 1;
    --z-dropdown: 10;
    --z-sticky: 20;
    --z-fixed: 30;
    --z-modal-backdrop: 40;
    --z-modal: 50;
    --z-popover: 60;
    --z-tooltip: 70;
    --z-notification: 80;
    --z-max: 9999;

    /* ==================== BREAKPOINTS (for reference) ==================== */
    --breakpoint-sm: 640px;
    --breakpoint-md: 768px;
    --breakpoint-lg: 1024px;
    --breakpoint-xl: 1280px;
    --breakpoint-2xl: 1536px;
  }
`;
