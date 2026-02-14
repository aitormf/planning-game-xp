import { css } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';

/**
 * Primitive Tokens - Low-level design tokens
 * These are the raw values that semantic tokens reference.
 * Do not use these directly in components - use semantic tokens instead.
 */
export const PrimitiveTokens = css`
  :host, :root {
    /* ==================== COLOR PALETTE ==================== */

    /* Blue scale */
    --color-blue-50: #e3f2fd;
    --color-blue-100: #bbdefb;
    --color-blue-200: #90caf9;
    --color-blue-300: #64b5f6;
    --color-blue-400: #42a5f5;
    --color-blue-500: #4a9eff;
    --color-blue-600: #3a8eef;
    --color-blue-700: #1976d2;
    --color-blue-800: #1565c0;
    --color-blue-900: #0d47a1;

    /* Pink scale */
    --color-pink-50: #fce4ec;
    --color-pink-100: #f8bbd9;
    --color-pink-200: #f48fb1;
    --color-pink-300: #f06292;
    --color-pink-400: #ec407a;
    --color-pink-500: #ec3e95;
    --color-pink-600: #d81b60;
    --color-pink-700: #c2185b;
    --color-pink-800: #ad1457;
    --color-pink-900: #880e4f;

    /* Green scale */
    --color-green-50: #e8f5e9;
    --color-green-100: #c8e6c9;
    --color-green-200: #a5d6a7;
    --color-green-300: #81c784;
    --color-green-400: #66bb6a;
    --color-green-500: #4caf50;
    --color-green-600: #43a047;
    --color-green-700: #388e3c;
    --color-green-800: #2e7d32;
    --color-green-900: #1b5e20;

    /* Orange scale */
    --color-orange-50: #fff3e0;
    --color-orange-100: #ffe0b2;
    --color-orange-200: #ffcc80;
    --color-orange-300: #ffb74d;
    --color-orange-400: #ffa726;
    --color-orange-500: #ff9800;
    --color-orange-600: #fb8c00;
    --color-orange-700: #f57c00;
    --color-orange-800: #ef6c00;
    --color-orange-900: #e65100;

    /* Red scale */
    --color-red-50: #ffebee;
    --color-red-100: #ffcdd2;
    --color-red-200: #ef9a9a;
    --color-red-300: #e57373;
    --color-red-400: #ef5350;
    --color-red-500: #d9534f;
    --color-red-600: #c9302c;
    --color-red-700: #d32f2f;
    --color-red-800: #c62828;
    --color-red-900: #b71c1c;

    /* Yellow scale */
    --color-yellow-50: #fffde7;
    --color-yellow-100: #fff9c4;
    --color-yellow-200: #fff59d;
    --color-yellow-300: #fff176;
    --color-yellow-400: #ffee58;
    --color-yellow-500: #cce500;
    --color-yellow-600: #fdd835;
    --color-yellow-700: #fbc02d;
    --color-yellow-800: #f9a825;
    --color-yellow-900: #f57f17;

    /* Cyan/Teal scale */
    --color-cyan-50: #e0f7fa;
    --color-cyan-100: #b2ebf2;
    --color-cyan-200: #80deea;
    --color-cyan-300: #4dd0e1;
    --color-cyan-400: #26c6da;
    --color-cyan-500: #17a2b8;
    --color-cyan-600: #138496;
    --color-cyan-700: #0097a7;
    --color-cyan-800: #00838f;
    --color-cyan-900: #006064;

    /* Gray scale */
    --color-gray-0: #ffffff;
    --color-gray-50: #fafafa;
    --color-gray-100: #f8f9fa;
    --color-gray-200: #f1f1f1;
    --color-gray-300: #e9ecef;
    --color-gray-400: #e0e0e0;
    --color-gray-500: #dee2e6;
    --color-gray-600: #999999;
    --color-gray-700: #6c757d;
    --color-gray-800: #666666;
    --color-gray-900: #333333;
    --color-gray-1000: #212121;

    /* ==================== SPACING SCALE ==================== */
    --space-0: 0;
    --space-1: 0.2rem;   /* 3.2px */
    --space-2: 0.5rem;   /* 8px */
    --space-3: 1rem;     /* 16px */
    --space-4: 1.5rem;   /* 24px */
    --space-5: 2rem;     /* 32px */
    --space-6: 3rem;     /* 48px */

    /* ==================== TYPOGRAPHY SCALE ==================== */
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
    --radius-md: 6px;
    --radius-lg: 8px;
    --radius-xl: 12px;
    --radius-2xl: 16px;
    --radius-full: 9999px;

    /* ==================== SHADOWS ==================== */
    --shadow-none: none;
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
    --shadow-md: 0 2px 4px rgba(0, 0, 0, 0.08);
    --shadow-lg: 0 4px 8px rgba(0, 0, 0, 0.1);
    --shadow-xl: 0 8px 16px rgba(0, 0, 0, 0.15);
    --shadow-2xl: 0 12px 24px rgba(0, 0, 0, 0.2);
    --shadow-inner: inset 0 2px 4px rgba(0, 0, 0, 0.06);

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
