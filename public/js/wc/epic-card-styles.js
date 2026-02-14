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
    --description-color: #4caf50;
    --objective-color: #ffcc1b;
    --acceptanceCriteria-color: #2196f3;
    --notes-color: #ff9800;
  }

  :host(:hover) {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(236,62,149,0.3);
  }

  :host([selected]) {
    border: 2px solid #4a9eff;
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
    background: rgba(0,0,0,0.05);
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
    border-color: #80bdff;
    box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
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
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    height: 2.5rem;
    width: 10rem;
  }

  :host([expanded]) .save-button:hover {
    background: #0056b3;
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
    outline: 2px solid #4a9eff;
  }

  .copy-link-button:hover {
    background: rgba(0,0,0,0.05);
  }

  .copy-link-button.eye-icon {
    color: var(--text-muted);
  }

  .priority {
    font-size: 1.5em;
    font-weight: bold;
    color: #4a9eff;
    text-align: right;
  }

  .points {
    display: flex;
    gap: 8px;
    margin-top: 4px;
    justify-content: flex-end;
  }

  .business-points {
    background: #4caf50;
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 1rem;
  }

  .dev-points {
    background: #ff9800;
    color: white;
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
    background: #4a9eff;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 16px;
  }

  button:hover {
    background: #3a8eef;
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
    color: #d9534f;
    margin: 0;
    padding: 0;
  }

  .delete-button:hover {
    color: #c9302c;
    font-size:1 rem;
  }

  .inprogress {
    background: #ff9800;
  }

  .tovalidate {
    background: #ffeb3b;
  }

  .done {
    background: #2CFF1E;
    font-weight: bold;
  }

  .todo {
    background: #ec3e95;
    color: #fff;
  }


  .blocked {
    background: #ccc;
    opacity: 0.5;
    border-radius: 8px;
  }
  .expedit {
    background: #ec3e95;
    color: #fff;
    border-radius: 8px;
  }
  .expedit span:first-child {
    font-weight: bold;
    border: 1px solid #fff;
    border-radius: 4px;
  }

  .sprint {
    background-color: #151efb;
    color: white;
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
    background: #777;
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
  .status-todo { background-color: #ec3e95; color: white; padding: 4px 8px; border-radius: 4px; }
  .status-inprogress { background-color: #ff9800; color: white; padding: 4px 8px; border-radius: 4px; }
  .status-done { background-color: #2CFF1E; color: black; font-weight: bold; padding: 4px 8px; border-radius: 4px; }
  .status-blocked { background-color: #ccc; opacity: 0.5; padding: 4px 8px; border-radius: 4px; }
  .status-inreview { background-color: #ffeb3b; color: black; padding: 4px 8px; border-radius: 4px; }
  .status-testing { background-color: #2196f3; color: white; padding: 4px 8px; border-radius: 4px; }
  .status-tovalidate { background-color: #ffeb3b; color: black; padding: 4px 8px; border-radius: 4px; }
  .status-cancelled { background-color: #d9534f; color: white; padding: 4px 8px; border-radius: 4px; }

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
    border: 2px solid #ff4444 !important;
    box-shadow: 0 0 0 0.25rem rgba(255, 68, 68, 0.3) !important;
    background-color: rgba(255, 68, 68, 0.05) !important;
  }
  
  .invalid-field:focus {
    border-color: #ff4444 !important;
    box-shadow: 0 0 0 0.25rem rgba(255, 68, 68, 0.5) !important;
    background-color: rgba(255, 68, 68, 0.08) !important;
  }
`;

export const EpicCardStyles = [
  ThemeVariables,
  BaseCardStyles,
  BaseTabStyles,
  EpicCardSpecificStyles
];