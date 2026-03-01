import { css } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';
import { ThemeVariables, BaseCardStyles, BaseTabStyles } from '../ui/styles/index.js';

const EpicCardSpecificStyles = css`
  *, *::before, *::after {
    box-sizing: border-box;
  }

  :host {
    background: var(--card-bg);
    box-shadow: var(--card-shadow);
    cursor: pointer;
    transition: transform 0.2s;
    width: 300px;
    max-width: 300px;
    box-sizing: border-box;
    border-radius: 8px;
    --description-color: var(--tab-description-color, #ec4899);
    --objective-color: var(--color-warning, #f59e0b);
    --acceptanceCriteria-color: var(--tab-acceptance-criteria-color, #3b82f6);
    --notes-color: var(--tab-notes-color, #f97316);
  }

  :host(:hover) {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px var(--card-shadow-hover, rgba(236,62,149,0.3));
  }

  :host([selected]) {
    border: 2px solid var(--brand-primary, #6366f1);
  }

  :host([expanded]) {
    width: 100%;
    max-width: 100%;
    margin: 0;
    box-shadow: none;
    border-radius: 0;
  }

  :host([expanded]) .card-header {
    position: relative;
    top: 0;
    left: 0;
    right: 0;
    height: auto;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
    z-index: 3;
    background: var(--bg-primary);
    margin-bottom: 1rem;
    padding: 1rem;
  }

  :host([expanded]) .ownersContainer,
  :host([expanded]) .ownersContainerChild {
    padding: 0 1rem;
  }

  :host([expanded]) .tabs {
    display: flex;
    gap: 0.5rem;
    padding: 0 1rem;
    background: var(--bg-tertiary);
  }

  :host([expanded]) .tab-button {
    padding: 0.75rem 1.5rem;
    border: 1px solid transparent;
    border-bottom: none;
    border-radius: 4px 4px 0 0;
    background: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
    margin-bottom: -1px;
    transition: all 0.2s ease;
  }

  :host([expanded]) .tab-button:hover {
    background: var(--hover-overlay, rgba(0,0,0,0.05));
  }

  :host([expanded]) .tab-button.active {
    background: var(--bg-primary);
    border-color: var(--border-subtle);
    border-bottom-color: var(--bg-primary);
    color: var(--text-primary);
    font-weight: 600;
  }

  :host([expanded]) .tab-content {
    padding: 0 1rem;
    background: var(--bg-tertiary);
    border:0;
  }

  :host([expanded]) .tab-content textarea {
    width: 100%;
    min-height: 120px;
    padding: 0.5rem 1rem;
    border: 0;
    border-radius: 4px;
    font-size: 1rem;
    resize: vertical;
    box-sizing: border-box;
  }

  :host([expanded]) .tab-content textarea:focus {
    outline: none;
    border-color: var(--border-focus, #6366f1);
    box-shadow: var(--focus-ring, 0 0 0 0.2rem rgba(99,102,241,.25));
  }

  :host([expanded]) .dates-group {
    display: flex;
    gap: 1rem;
    margin: 0;
    padding: 1rem;
    align-items: flex-end;
  }

  :host([expanded]) .dates-group .field-group {
    flex: 1;
  }

  :host([expanded]) .card-footer {
    display: flex;
    justify-content: center;
    padding: 1rem;
    margin: 0;
    border: none;
  }

  :host([expanded]) .save-button {
    padding: 0.5rem 2rem;
    background: var(--brand-primary, #6366f1);
    color: var(--text-inverse, white);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    height: 2.5rem;
    width: 10rem;
  }

  :host([expanded]) .save-button:hover {
    background: var(--brand-primary-hover, #4f46e5);
  }

  :host([expanded]) .save-button:disabled {
    background: var(--text-disabled);
    cursor: not-allowed;
  }

  .status {
    padding: 4px 8px;
    border-radius: 4px;
    background: var(--bg-tertiary);
    font-size: 0.8em;
  }

  .copy-link-button {
    background: transparent;
    border: none;
    box-shadow: none;
    color: inherit;
    font-size: 1.3em;
    cursor: pointer;
    padding: 0;
    margin: 0;
    transition: background 0.2s;
  }

  .copy-link-button:focus {
    outline: 2px solid var(--brand-primary, #6366f1);
  }

  .copy-link-button:hover {
    background: var(--hover-overlay, rgba(0,0,0,0.05));
  }

  .copy-link-button.eye-icon {
    color: var(--text-muted);
  }

  .priority {
    font-size: 1.5em;
    font-weight: bold;
    color: var(--brand-primary, #6366f1);
    text-align: right;
  }

  .points {
    display: flex;
    gap: 8px;
    margin-top: 4px;
    justify-content: flex-end;
  }

  .business-points {
    background: var(--color-success, #10b981);
    color: var(--text-inverse, white);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 1rem;
  }

  .dev-points {
    background: var(--color-warning, #f59e0b);
    color: var(--text-inverse, white);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 1rem;
  }

  h3 {
    margin: 0 0 8px 0;
    color: var(--text-primary);
    flex-grow: 1;
    height: 4.5rem;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dates {
    font-size: 0.8em;
    color: var(--text-muted);
    margin-top: 8px;
  }

  .expanded-content {
    display: none;
  }

  :host([expanded]) .expanded-content {
    display: flex;
    flex-direction: column;
    padding: 1rem;
  }

  input {
    padding: 0.5rem;
    margin: 0.2rem 0;
    border: 1px solid var(--input-border);
    border-radius: 4px;
    background: var(--input-bg);
    color: var(--text-primary);
  }

  input[type="number"] {
    max-width: 10rem;
  }

  select {
    font-size: 1.2rem;
    margin-top: 0.6rem;
  }

  .labelNumber {
    display:flex;
    align-items: center;
  }

  button {
    background: var(--brand-primary, #6366f1);
    color: var(--text-inverse, white);
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 16px;
  }

  button:hover {
    background: var(--brand-primary-hover, #4f46e5);
  }

  label {
    font-weight: bold;
  }

  .developerContainer {
    display: grid;
    grid-template-columns: 2fr 3fr 2fr 2fr; /* cuatro columnas */
    gap: 1rem; /* Espaciado entre elementos */
    padding: 0 1rem;
    height: 4rem;
    align-items: flex-start;
  }
  .developerContainer .groupContainer {
    display: flex;
    gap:0.5rem;
    height: 2.5rem;
    align-items: center;
  }

  .developerContainer .groupContainer select {
    max-width: 12rem;
  }
  .developerContainer .groupContainer input[type=number] {
    max-width: 3rem;
  }

  .ownersContainer {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3rem; /* Espaciado entre elementos */
    padding: 0 1rem;
    height: 6rem;
    align-items: flex-start;
  }

  .ownersContainerChild {
    display: grid;
    grid-template-columns: 7rem auto; /* dos columnas para label y select */
    gap: 0px; /* Espaciado entre elementos */
    align-items: flex-start;
  }

  .ownersContainerChild label {
    min-width: 9rem; /* Fija el ancho del label */
    font-weight: bold;
    margin-top: 0.7rem;
    text-align: left;
  }

  .ownersContainerChild > div {
    display:flex;
    flex-direction: column;
    grid-column: span 2; /* Ocupa las dos columnas */
  }

  .ownersContainerChild input[type="checkbox"] {
    width: 20px;
    height: 20px;
    flex-shrink: 0; /* Evita que el checkbox cambie de tamaño */
  }

  .blockedDetails {
    display: grid;
    grid-template-columns: 1fr 1fr; /* Dos columnas iguales para los detalles */
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

  .ownersContainerChild input[type="checkbox"] {
    cursor: pointer;
    margin: 0.8rem 0;
  }

  .ownersContainerChild .blockedDetails {
    display: flex;
    gap: 8px; /* Espaciado entre los campos */
    align-items: center; /* Alinear elementos */
    margin-left: 10px; /* Espacio adicional si es necesario */
  }

  .ownersContainerChild input[type="text"] {
    padding: 5px;
    border: 1px solid var(--input-border);
    border-radius: 4px;
    font-size: 1rem;
    background: var(--input-bg);
    color: var(--text-primary);
  }

  .ownersContainerChild p {
    margin: 0;
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .blockedWho {
    margin:0;
    font-size: 0.8em;
    color: var(--text-muted);
  }

  .title {
    border:0;
    font-size: 1.5em;
    text-align: center;
    width: 100%;
  }

  .cardid {
    font-size: 0.8em;
    color: var(--text-muted);
  }

  .cardidexpanded {
    font-size: 0.8em;
    color: var(--text-muted);
    text-align: left;
    width: 8rem;
  }

  .hidden {
    opacity: 0;
    height: 0;
    overflow: hidden;
    transition: opacity 1s ease-in-out;
  }

  .card-actions {
    display: flex;
    margin: 0;
    padding: 0;
  }

  .card-actions button {
    font-size: 1rem;
  }

  .delete-button {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.5rem;
    color: var(--color-error, #f43f5e);
    margin: 0;
    padding: 0;
  }

  .delete-button:hover {
    color: var(--color-error-hover, #e11d48);
    font-size:1 rem;
  }

  .inprogress {
    background: var(--status-in-progress, #3b82f6);
  }

  .tovalidate {
    background: var(--status-to-validate, #f59e0b);
  }

  .done {
    background: var(--status-done, #10b981);
    font-weight: bold;
  }

  .todo {
    background: var(--status-todo, #94a3b8);
    color: var(--text-inverse, #fff);
  }


  .blocked {
    background: var(--status-blocked, #f43f5e);
    opacity: 0.5;
    border-radius: 8px;
  }
  .expedit {
    background: var(--status-expedited, #8b5cf6);
    color: var(--text-inverse, #fff);
    border-radius: 8px;
  }
  .expedit span:first-child {
    font-weight: bold;
    border: 1px solid var(--text-inverse, #fff);
    border-radius: 4px;
  }

  .sprint {
    background-color: var(--brand-primary, #6366f1);
    color: var(--text-inverse, white);
    padding: 3px;
    border-radius: 4px;
  }

  /* tabs */
  .tabs {
    display: flex;
    gap: 10px;
  }
  .tab-button {
    padding: 10px 15px;
    cursor: pointer;
    border: none;
    border-radius: 5px 5px 0 0;
    font-size: 1.2rem;
  }
  .tab-button.active {
    color: white;
    font-weight: bold;
  }
  .tab-button:hover {
    background: var(--bg-muted, #777);
  }
  .tab-content {
    border: 0;
    padding: 0;
    background: var(--bg-primary);
    border-radius: 0 0 5px 5px;
    font-size: 1.2rem;
  }
  textarea {
    width: 100%;
    height: 120px;
    font-size: 1.2rem;
    border: 0;
    box-sizing: border-box;
  }
  textarea:focus {
    outline: none;
  }

  .description {
    background-color: var(--description-color);
  }
  .objective {
    background-color: var(--objective-color);
  }
  .acceptancecriteria {
    background-color: var(--acceptanceCriteria-color);
  }
  .notes {
    background-color: var(--notes-color);
  }

  .epic-compact-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.95em;
    margin-top: 0.5rem;
  }
  .epic-compact-table td.label {
    font-weight: bold;
    text-align: right;
    padding-right: 0.5em;
    width: 50%;
    color: var(--text-secondary);
    background: var(--bg-secondary);
  }
  .epic-compact-table td {
    padding: 2px 4px;
    text-align: left;
    background: var(--bg-primary);
  }

  .epic-tasks-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
    font-size: 0.95em;
    background-color: var(--table-row-bg);
    color: var(--text-primary);
  }
  .epic-tasks-table th,
  .epic-tasks-table td {
    border: 1px solid var(--border-subtle);
    padding: 10px;
    text-align: left;
    color: var(--text-primary);
  }
  .epic-tasks-table th {
    background-color: var(--table-header-bg);
    color: var(--text-primary);
    font-weight: bold;
    font-size: 1em;
  }
  .epic-tasks-table tbody tr {
    background-color: var(--table-row-bg);
    color: var(--text-primary);
  }
  .epic-tasks-table tbody tr:nth-child(even) {
    background-color: var(--table-row-alt-bg);
    color: var(--text-primary);
  }
  .epic-tasks-table tbody tr:hover {
    background-color: var(--bg-tertiary);
    color: var(--text-primary);
  }
  .status-todo { background-color: var(--status-todo, #94a3b8); color: var(--status-todo-text, white); padding: 4px 8px; border-radius: 4px; }
  .status-inprogress { background-color: var(--status-in-progress, #3b82f6); color: var(--status-in-progress-text, white); padding: 4px 8px; border-radius: 4px; }
  .status-done { background-color: var(--status-done, #10b981); color: var(--status-done-text, white); font-weight: bold; padding: 4px 8px; border-radius: 4px; }
  .status-blocked { background-color: var(--status-blocked, #f43f5e); color: var(--status-blocked-text, white); opacity: 0.5; padding: 4px 8px; border-radius: 4px; }
  .status-inreview { background-color: var(--status-to-validate, #f59e0b); color: var(--status-to-validate-text, white); padding: 4px 8px; border-radius: 4px; }
  .status-testing { background-color: var(--status-in-progress, #3b82f6); color: var(--status-in-progress-text, white); padding: 4px 8px; border-radius: 4px; }
  .status-tovalidate { background-color: var(--status-to-validate, #f59e0b); color: var(--status-to-validate-text, white); padding: 4px 8px; border-radius: 4px; }
  .status-cancelled { background-color: var(--color-error, #f43f5e); color: var(--text-inverse, white); padding: 4px 8px; border-radius: 4px; }

  /* Stakeholder tags */
  .stakeholder-tag {
    background: var(--secondary-color);
    color: white;
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    font-size: 0.8em;
    font-weight: 500;
  }

  .epic-compact-table td {
    padding: 2px 4px;
    vertical-align: top;
  }

  .epic-compact-table td:first-child {
    width: 40%;
    font-weight: bold;
    color: var(--text-secondary);
  }

  .invalid-field {
    border: 2px solid var(--color-error, #f43f5e) !important;
    box-shadow: var(--focus-ring-error, 0 0 0 0.25rem rgba(244, 63, 94, 0.3)) !important;
    background-color: var(--color-error-light, rgba(244, 63, 94, 0.05)) !important;
  }

  .invalid-field:focus {
    border-color: var(--color-error, #f43f5e) !important;
    box-shadow: var(--focus-ring-error, 0 0 0 0.25rem rgba(244, 63, 94, 0.5)) !important;
    background-color: var(--color-error-light, rgba(244, 63, 94, 0.08)) !important;
  }
`;

export const EpicCardStyles = [
  ThemeVariables,
  BaseCardStyles,
  BaseTabStyles,
  EpicCardSpecificStyles
];