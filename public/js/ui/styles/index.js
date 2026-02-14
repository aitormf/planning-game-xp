// Archivo principal que exporta todos los estilos del sistema DRY
export { ThemeVariables } from './theme-variables.js';
export { BaseCardStyles } from './base-card-styles.js';
export { BaseTabStyles } from './base-tab-styles.js';

// Temas específicos
export { BugTheme } from './themes/bug-theme.js';
export { SprintTheme } from './themes/sprint-theme.js';
export { StoryTheme } from './themes/story-theme.js';
export { TaskTheme } from './themes/task-theme.js';

// Función helper para combinar estilos
export function combineStyles(...styles) {
  return styles;
}