import { css } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';

export const SprintTheme = css`
  :host {
    /* Colores específicos para sprints */
    --description-color: var(--color-green-500, #4caf50);
    --retrospective-color: var(--color-green-500, #4caf50);
    --notes-color: var(--color-orange-500, #ff9800);
    --video-color: var(--color-info, #2196f3);
    --history-color: var(--status-expedited, #9c27b0);

    display:flex;
    flex-direction: column;
    background: var(--bg-white);
    box-shadow: var(--shadow-heavy);
    cursor: pointer;
    transition: transform var(--transition-fast);
    box-sizing: border-box;
    border-radius: var(--radius-lg);
  }

  :host(:hover) {
    transform: translateY(-2px);
    box-shadow: var(--card-shadow-hover, 0 4px 8px rgba(236,62,149,0.3));
  }

  :host([expanded]) {
    cursor: default;
    border: 0;
    border-radius: 0;
    padding:1rem;
  }

  /* Status específicos */
  .status {
    padding: 4px 8px;
    border-radius: var(--radius-sm);
    background: var(--bg-muted);
    font-size: var(--font-size-sm);
  }

  .priority {
    font-size: var(--font-size-xxxl);
    font-weight: bold;
    color: var(--primary-color);
    text-align: right;
  }

  /* Points styling */
  .points {
    display: flex;
    gap: 8px;
    margin-top: 4px;
    justify-content: flex-end;
  }

  .business-points {
    background: var(--accent-color);
    color: var(--text-white);
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
  }

  .dev-points {
    background: var(--warning-color);
    color: var(--text-white);
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
  }

  h3 {
    margin: 0 0 8px 0;
    color: var(--text-primary);
    flex-grow: 1;
    height: 3.5rem;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dates {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    margin-top: 8px;
  }

  .expanded-content {
    display: none;
  }

  :host([expanded]) .expanded-content {
    display: flex;
    flex-direction: column;
    padding: var(--spacing-md);
  }

  input[type="number"] {
    max-width: 10rem;
  }

  select {
    font-size: var(--font-size-xl);
    padding: 0 var(--spacing-md) 0 0;
  }

  .labelNumber {
    display: flex;
    align-items: center;
  }

  .groupContainer {
    display: flex;
    gap: var(--spacing-sm);
    height: 2.5rem;
    align-items: center;
  }

  .groupContainer input[type=number] {
    max-width: 3rem;
  }

  /* Blocked container específico */
  .blockedContainer {
    display: grid;
    grid-template-columns: 1fr 2fr 2fr;
    gap: 3rem;
    padding: 0 var(--spacing-md);
    height: 6rem;
    align-items: flex-start;
  }

  .blockedContainerChild {
    display: grid;
    grid-template-columns: 2rem auto;
    gap: 0px;
    align-items: flex-start;
  }

  .blockedContainerChild label {
    min-width: 9rem;
    font-weight: bold;
    margin-top: 0.7rem;
    text-align: left;
  }

  .blockedContainerChild > div {
    display: flex;
    flex-direction: column;
    grid-column: span 2;
  }

  .blockedContainerChild input[type="checkbox"] {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    cursor: pointer;
    margin: 0.8rem 0;
  }

  .blockedDetails {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    align-items: center;
    transition: opacity 0.3s ease-in-out;
  }

  .blockedDetails.hidden {
    opacity: 0;
    height: 0;
    overflow: hidden;
    visibility: hidden;
    pointer-events: none;
  }

  .blockedContainerChild .blockedDetails {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-left: 10px;
  }

  .blockedContainerChild input[type="text"] {
    padding: 5px;
    border: 1px solid var(--border-default, #ccc);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
  }

  .blockedContainerChild p {
    margin: 0;
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }

  .blockedWho {
    margin: 0;
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }

  .title {
    border: 0;
    font-size: var(--font-size-xxxl);
    text-align: center;
  }

  .cardid {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }

  .cardidexpanded {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    position: absolute;
    text-align: center;
    left: 40%;
  }

  .hidden {
    opacity: 0;
    height: 0;
    overflow: hidden;
    transition: opacity 1s ease-in-out;
  }

  /* Copy link button */
  .copy-link-button {
    background: transparent;
    border: none;
    box-shadow: none;
    color: inherit;
    font-size: 1rem;
    cursor: pointer;
    padding: 0;
    margin: 0;
    transition: background var(--transition-fast);
  }

  .copy-link-button:focus {
    outline: 2px solid var(--primary-color);
  }

  .copy-link-button:hover {
    background: var(--hover-overlay, rgba(0,0,0,0.05));
  }

  .copy-link-button.eye-icon {
    color: var(--text-secondary);
  }

  /* Status específicos de sprint */
  .inprogress {
    background: var(--warning-color);
  }

  .tovalidate {
    background: var(--status-to-validate, #ffeb3b);
  }

  .done {
    background: var(--status-done, #2CFF1E);
    font-weight: bold;
  }

  .todo {
    background: var(--secondary-color);
    color: var(--text-white);
  }

  .blocked {
    background: var(--status-blocked, #ccc);
    opacity: 0.5;
    border-radius: var(--radius-lg);
  }

  .expedit {
    background: var(--secondary-color);
    color: var(--text-white);
    border-radius: var(--radius-lg);
  }

  .expedit span:first-child {
    font-weight: bold;
    border: 1px solid var(--text-white);
    border-radius: var(--radius-sm);
  }

  .sprint {
    background-color: var(--brand-primary, #151efb);
    color: var(--text-white);
    padding: 3px;
    border-radius: var(--radius-sm);
  }

  .card-header {
    gap:0;
  }

  .sprint-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
    margin: 0;
    padding: 0 1rem;
    font-size: 0.9rem;
    justify-items: center;
    height:2rem;
  }

  .to-validate-counter {
    color: var(--text-muted, #666);
    font-weight: bold;
  }

  .next-sprint-btn {
    background: var(--color-info, #4a9eff);
    color: var(--text-inverse, white);
    border: none;
    padding: 0.5rem;
    margin-top:0!important;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.7rem;
    display: none;
  }

  /* ========================================
     Sprint Card - Tab Styles
     ======================================== */

  /* Tab buttons - colores de fondo cuando están activos */
  .tab-button.tab-retrospective.active {
    background: var(--retrospective-color) !important;
    color: var(--text-inverse, white) !important;
    border-color: var(--retrospective-color) !important;
  }

  .tab-button.tab-notes.active {
    background: var(--notes-color) !important;
    color: var(--text-inverse, white) !important;
    border-color: var(--notes-color) !important;
  }

  .tab-button.tab-video.active {
    background: var(--video-color) !important;
    color: var(--text-inverse, white) !important;
    border-color: var(--video-color) !important;
  }

  .tab-button.tab-history.active {
    background: var(--history-color) !important;
    color: var(--text-inverse, white) !important;
    border-color: var(--history-color) !important;
  }

  /* Tab buttons - hover states */
  .tab-button.tab-retrospective:hover:not(.active) {
    background: var(--hover-overlay, rgba(76, 175, 80, 0.2)) !important;
    border-color: var(--retrospective-color) !important;
  }

  .tab-button.tab-notes:hover:not(.active) {
    background: var(--hover-overlay, rgba(255, 152, 0, 0.2)) !important;
    border-color: var(--notes-color) !important;
  }

  .tab-button.tab-video:hover:not(.active) {
    background: var(--hover-overlay, rgba(33, 150, 243, 0.2)) !important;
    border-color: var(--video-color) !important;
  }

  .tab-button.tab-history:hover:not(.active) {
    background: var(--hover-overlay, rgba(156, 39, 176, 0.2)) !important;
    border-color: var(--history-color) !important;
  }

  /* Tab content borders matching active tab */
  .tab-content.ta-retrospective {
    border: 3px solid var(--retrospective-color) !important;
    border-top: none !important;
  }

  .tab-content.ta-notes {
    border: 3px solid var(--notes-color) !important;
    border-top: none !important;
  }

  .tab-content.ta-video {
    border: 3px solid var(--video-color) !important;
    border-top: none !important;
  }

  .tab-content.ta-history {
    border: 3px solid var(--history-color) !important;
    border-top: none !important;
  }

  /* Ensure tab buttons have visible borders in inactive state */
  :host([expanded]) .tab-button {
    border: 1px solid var(--border-default, #ccc) !important;
    border-bottom: none !important;
  }
`;
