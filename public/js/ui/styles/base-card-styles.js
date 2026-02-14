import { css } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';

export const BaseCardStyles = css`
  *, *::before, *::after {
    box-sizing: border-box;
  }

  /* Estilos base del host */
  :host {
    display: block;
    width: var(--card-width);
    max-width: var(--card-width);
    height: var(--card-height, 280px);
    min-height: var(--card-height, 280px);
    margin: var(--spacing-sm);
    background: var(--bg-white);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    transition: box-shadow var(--transition-fast), transform var(--transition-fast);
    overflow: hidden;
  }

  :host(:hover) {
    transform: translateY(-2px);
    box-shadow: var(--shadow-hover);
  }

  :host([selected]) {
    border: 2px solid var(--primary-color);
  }

  :host([expanded]) {
    width: 100%;
    max-width: 100%;
    height: auto;
    min-height: auto;
    margin: 0;
    border-radius: 0;
    box-shadow: none;
    overflow: visible;
  }

  /* Header común */
  .card-header {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    margin: 0;
    padding: 0;
    background: transparent;
  }

  /* Fila del CardID e iconos */
  .card-id-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: var(--spacing-xs);
  }

  /* Título común */
  .title {
    font-size: var(--font-size-lg);
    font-weight: bold;
    color: var(--text-primary);
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.3;
    height: 2.6em;
    min-height: 2.6em;
    max-height: 2.6em;
    text-align: left;
  }

  /* ID de card */
  .cardid {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    opacity: 0.8;
    font-weight: 500;
  }
  
  .cardidexpanded {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    opacity: 0.8;
    margin-top: var(--spacing-xs);
    text-align: right;
  }

  .cardidexpanded {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    top: var(--spacing-sm);
  }

  /* Badge para mostrar el cardId junto al título en vista expandida */
  .cardid-badge {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    background: var(--bg-tertiary);
    padding: 2px 8px;
    border-radius: var(--radius-sm);
    white-space: nowrap;
    flex-shrink: 0;
    font-family: monospace;
    border: 1px solid var(--border-subtle);
  }

  /* Badge para mostrar el proyecto cuando la tarea es de otro proyecto */
  .project-badge {
    font-size: var(--font-size-xs);
    color: var(--text-white);
    background: var(--info-color, #17a2b8);
    padding: 2px 10px;
    border-radius: var(--radius-sm);
    white-space: nowrap;
    flex-shrink: 0;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Botones base */
  button {
    background: var(--primary-color);
    color: var(--text-white);
    border: none;
    padding: 8px 16px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    margin-top: 16px;
    font-size: var(--font-size-base);
    transition: background var(--transition-fast);
  }

  button:hover {
    background: var(--primary-hover);
  }

  /* Botón de eliminar */
  .delete-button {
    background: none;
    border: none;
    cursor: pointer;
    font-size: var(--font-size-xl);
    color: var(--danger-color);
    margin: 0;
    padding: 0;
    transition: color var(--transition-fast);
  }

  .delete-button:hover {
    color: var(--danger-hover);
  }

  /* Botón de copiar enlace */
  .copy-link-button {
    background: none;
    border: none;
    cursor: pointer;
    font-size: var(--font-size-lg);
    color: var(--text-secondary);
    margin: 0;
    padding: 0;
    transition: color var(--transition-fast);
  }

  .copy-link-button:hover {
    color: var(--primary-color);
  }

  /* Indicador de adjunto */
  .attachment-indicator {
    font-size: var(--font-size-lg);
    color: var(--secondary-color);
    margin: 0;
    padding: 0;
  }

  /* Inputs comunes */
  input, select, textarea {
    width: 100%;
    padding: var(--spacing-sm);
    margin: var(--spacing-xs) 0;
    border: 1px solid var(--bg-border);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
  }

  textarea {
    min-height: 60px;
    resize: vertical;
    margin-bottom: var(--spacing-sm);
  }

  /* Labels */
  label {
    font-weight: bold;
    color: var(--primary-color);
    font-size: 0.95em;
  }

  /* Status común */
  .status {
    padding: 0.25rem var(--spacing-sm);
    border-radius: var(--radius-sm);
    font-size: 0.9rem;
    font-weight: 500;
    text-transform: uppercase;
    background: var(--bg-muted);
    color: var(--text-primary);
  }

  /* Priority común */
  .priority {
    font-size: var(--font-size-base);
    font-weight: bold;
    color: var(--secondary-color);
    background: var(--color-pink-50);
    border-radius: var(--radius-sm);
    padding: 0.25rem var(--spacing-sm);
    text-align: right;
  }

  /* Actions container */
  .card-actions {
    margin: 0;
    padding: 0;
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  /* Card body container for content */
  .card-body {
    flex: 1;
    overflow: hidden;
    padding: var(--spacing-sm);
  }

  /* Card container for consistent layout */
  .card-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: var(--spacing-md);
  }

  /* Dates container */
  .card-dates, .card-extra {
    display: flex;
    flex-direction: row;
    gap: var(--spacing-lg);
    padding: var(--spacing-sm);
    font-size: 0.95em;
    color: var(--text-primary);
    background: var(--bg-light);
    border-radius: var(--radius-md);
    margin-bottom: var(--spacing-sm);
  }

  .card-dates div, .card-extra div {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .card-dates label, .card-extra label {
    font-weight: bold;
    color: var(--primary-color);
    font-size: 0.95em;
    margin-bottom: 0.1rem;
  }

  /* Texto truncado común */
  .truncate-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
    display: inline-block;
    vertical-align: middle;
    cursor: help;
    color: var(--text-primary);
    background: var(--bg-muted);
    padding: var(--spacing-xs);
    border-radius: var(--radius-md);
  }

  .createdByColor {
    color: inherit !important;
    background: none !important;
  }

  /* Estilos expandidos */
  :host([expanded]) .card-header {
    flex-direction: row;
    align-items: flex-start;
    gap: var(--spacing-lg);
    padding: var(--spacing-md) var(--spacing-lg) 0 var(--spacing-lg);
    margin-bottom: var(--spacing-sm);
    background: var(--bg-white);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    box-shadow: var(--shadow-sm);
  }

  :host([expanded]) .card-dates, :host([expanded]) .card-extra {
    background: var(--bg-light);
    border-radius: var(--radius-md);
    margin: 0 var(--spacing-lg) var(--spacing-md) var(--spacing-lg);
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-size-base);
    gap: var(--spacing-xl);
  }

  :host([expanded]) .title {
    font-size: var(--font-size-xxl);
    font-weight: bold;
    margin: var(--spacing-sm) 0;
    text-align: center;
    color: var(--text-primary);
    background: var(--bg-white);
    border: 0;
    padding: var(--spacing-sm) 0;
  }

  :host([expanded]) input, :host([expanded]) select, :host([expanded]) textarea {
    font-size: var(--font-size-base);
    border-radius: var(--radius-sm);
    border: 1px solid var(--bg-border);
    margin: 0;
    padding: 0;
    height: 2rem;
  }

  :host([expanded]) button {
    margin: var(--spacing-md) var(--spacing-lg) var(--spacing-lg) var(--spacing-lg);
    width: 10rem;
  }

  /* ======================== ULTRA-COMPACT VIEW ======================== */
  :host([view-mode="ultra-compact"]) {
    width: 220px;
    max-width: 220px;
    height: auto;
    min-height: 70px;
    margin: 4px;
  }

  :host([view-mode="ultra-compact"]:hover) {
    transform: translateY(-1px);
  }

  /* Override ultra-compact styles when expanded (modal view) */
  :host([view-mode="ultra-compact"][expanded]) {
    width: 100%;
    max-width: 100%;
    height: auto;
    min-height: auto;
    margin: 0;
    border-radius: 0;
    box-shadow: none;
    overflow: visible;
  }

  .card-container.ultra-compact {
    padding: 8px 10px;
    height: auto;
    min-height: 60px;
    gap: 4px;
  }

  .uc-row-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 4px;
  }

  .uc-cardid {
    font-size: 0.7rem;
    color: var(--text-secondary);
    font-weight: 500;
    font-family: monospace;
  }

  .uc-priority {
    font-size: 0.7rem;
    font-weight: bold;
    color: var(--text-white);
    background: var(--secondary-color);
    padding: 1px 6px;
    border-radius: 10px;
    min-width: 28px;
    text-align: center;
  }

  .uc-title {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.2;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 2px 0;
  }

  .uc-row-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 4px;
    margin-top: auto;
  }

  .uc-indicators {
    display: flex;
    gap: 2px;
    font-size: 0.65rem;
  }

  .uc-blocked-biz,
  .uc-blocked-dev,
  .uc-spike,
  .uc-expedited {
    cursor: help;
  }

  .uc-developer {
    font-size: 0.65rem;
    font-weight: 600;
    color: var(--text-white);
    background: var(--primary-color);
    padding: 1px 4px;
    border-radius: 3px;
    text-transform: uppercase;
  }

  .uc-co-developer {
    font-size: 0.6rem;
    font-weight: 500;
    color: var(--text-white);
    background: var(--secondary-color, #6c757d);
    padding: 1px 3px;
    border-radius: 3px;
    text-transform: uppercase;
    margin-left: 2px;
  }

  .uc-status {
    font-size: 0.6rem;
    padding: 1px 6px;
    border-radius: 3px;
    font-weight: 500;
    text-transform: uppercase;
    background: var(--bg-muted);
    color: var(--text-primary);
    white-space: nowrap;
  }

  /* Dragging state for ultra-compact */
  .card-container.ultra-compact.dragging {
    opacity: 0.5;
    transform: rotate(2deg);
  }
`;