import { css } from 'https://cdn.jsdelivr.net/npm/lit@3.0.2/+esm';

/**
 * Estilos CSS reutilizables para el sistema de notas genérico
 * Puede ser usado en cualquier web component que implemente notas
 */
export const NotesStyles = css`
  /* Estilos para la nueva interfaz de notas */
  :host([expanded]) .tab-content.ta-notes .notes-panel {
    height: auto !important;
    min-height: 200px;
    max-height: 400px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  
  .notes-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 0.25rem;
    box-sizing: border-box;
  }
  
  .notes-actions {
    display: flex;
    justify-content: center;
    padding: 0.5rem 0 0.25rem 0;
  }
  
  .new-note-input {
    width: 100%;
    min-height: 60px;
    max-width: 100%;
    box-sizing: border-box;
    padding: 0.5rem;
    border: 1px solid #ced4da;
    border-radius: 0.25rem;
    font-family: inherit;
    font-size: 0.9rem;
    resize: vertical;
  }
  
  .new-note-input:focus {
    outline: none;
    border-color: #4a9eff;
    box-shadow: 0 0 0 0.2rem rgba(74, 158, 255, 0.25);
  }
  
  .add-note-btn {
    padding: 0.25rem 0.5rem;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 0.8rem;
  }
  
  .add-note-btn:hover {
    background: #0056b3;
  }
  
  .notes-table-container {
    flex: 1;
    overflow-y: auto;
    border: 1px solid #dee2e6;
    border-radius: 0.25rem;
  }
  
  .notes-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
    background: white;
  }
  
  .notes-table thead {
    position: sticky;
    top: 0;
    background: #343a40;
    z-index: 1;
  }
  
  .notes-table th {
    padding: 0.5rem;
    text-align: left;
    border: 1px solid #495057;
    font-weight: bold;
    color: white;
  }
  
  .notes-table td {
    padding: 0.5rem;
    border: 1px solid #dee2e6;
    vertical-align: top;
    text-align: left;
  }
  
  .notes-table tbody tr:hover {
    background-color: #f8f9fa;
  }
  
  .note-author-cell {
    width: 20%;
    font-weight: 500;
    color: #495057;
  }
  
  .note-content-cell {
    width: 55%;
    white-space: pre-wrap;
    word-break: break-word;
  }
  
  .note-date-cell {
    width: 15%;
    font-size: 0.8rem;
    color: #6c757d;
  }
  
  .note-actions-cell {
    width: 10%;
    text-align: left;
    padding: 0.25rem 0;
  }
  
  .actions-header {
    width: 10%;
  }
  
  .edit-note-btn {
    background: none !important;
    border: none !important;
    cursor: pointer;
    font-size: 0.75rem !important;
    padding: 0.1rem !important;
    margin: 0 !important;
    line-height: 1;
    border-radius: 0.15rem;
    transition: background 0.2s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px !important;
    min-width: 20px !important;
    max-width: 20px !important;
    height: 20px !important;
    min-height: 20px !important;
    max-height: 20px !important;
    box-sizing: border-box !important;
  }
  
  .edit-note-btn:hover {
    background: #e9ecef !important;
  }
  
  .no-notes {
    text-align: center;
    color: #6c757d;
    font-style: italic;
    padding: 2rem 1rem;
  }
  
  /* Estilos para el modal de notas */
  .note-modal-content {
    padding: 1.5rem;
  }
  
  .note-modal-content h3 {
    margin: 0 0 1.5rem 0;
    color: #333;
  }
  
  .note-modal-fields {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .note-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .note-field label {
    font-weight: 500;
    color: #495057;
    font-size: 0.9rem;
  }
  
  .note-modal-textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ced4da;
    border-radius: 0.25rem;
    font-family: inherit;
    font-size: 0.9rem;
    resize: vertical;
    min-height: 100px;
  }
  
  .note-modal-input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ced4da;
    border-radius: 0.25rem;
    font-size: 0.9rem;
    background-color: #e9ecef;
    color: #495057;
  }
  
  .note-modal-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }
  
  .save-note-btn, .cancel-note-btn, .delete-note-btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 0.9rem;
  }
  
  .save-note-btn {
    background: #28a745;
    color: white;
  }
  
  .save-note-btn:hover {
    background: #218838;
  }
  
  .cancel-note-btn {
    background: #6c757d;
    color: white;
  }
  
  .cancel-note-btn:hover {
    background: #5a6268;
  }
  
  .delete-note-btn {
    background: #dc3545;
    color: white;
  }
  
  .delete-note-btn:hover {
    background: #c82333;
  }
`;