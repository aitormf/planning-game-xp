/**
 * Design System Tokens
 *
 * This module exports all design tokens organized in layers:
 *
 * 1. PrimitiveTokens - Raw values (colors, spacing, typography scales)
 *    - Do NOT use directly in components
 *    - Used as a reference for semantic tokens
 *
 * 2. SemanticTokens - Meaningful tokens (brand colors, functional colors, states)
 *    - Use these in components for consistent theming
 *    - Reference primitive tokens internally
 *
 * 3. ComponentTokens - Component-specific defaults (card, button, input, modal)
 *    - Provide sensible defaults for UI components
 *    - Can be overridden at the component level
 *
 * Usage in Lit components:
 * ```js
 * import { AllTokens } from './tokens/index.js';
 *
 * static styles = [
 *   AllTokens,
 *   css`
 *     .my-element {
 *       color: var(--text-primary);
 *       background: var(--bg-primary);
 *     }
 *   `
 * ];
 * ```
 */

import { css } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';
import { PrimitiveTokens } from './primitives.js';
import { SemanticTokens } from './semantic.js';
import { ComponentTokens } from './components.js';

/**
 * All design tokens combined in the correct order.
 * Primitives → Semantic → Components (each layer can reference previous layers)
 */
export const AllTokens = css`
  ${PrimitiveTokens}
  ${SemanticTokens}
  ${ComponentTokens}
`;

export { PrimitiveTokens, SemanticTokens, ComponentTokens };
