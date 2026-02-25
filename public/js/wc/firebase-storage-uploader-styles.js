import { css } from 'https://cdn.jsdelivr.net/npm/lit@3.0.2/+esm';

export const firebaseStorageUploaderStyles = css`
  .thumbnail { 
    max-width: 80px; 
    max-height: 80px; 
    display: block; 
    margin: 0 auto; 
    margin-bottom: 8px;
  }
  
  .icon {
    font-size: 48px;
    color: var(--text-muted, #888);
    margin: 0 auto;
    margin-bottom: 8px;
  }
  
  .uploader { 
    display: flex; 
    flex-direction: column; 
    position: relative; 
  }
  
  button { 
    margin-top: 8px; 
  }
  
  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--modal-overlay-bg, rgba(0,0,0,0.6));
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
  }

  .loader {
    border: 4px solid var(--border-subtle, #374151);
    border-top: 4px solid var(--brand-primary, #3498db);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .uploaded-link {
    margin-top: 8px;
    font-size: 0.95em;
    word-break: break-all;
  }
  
    margin-top: 8px;
    padding: 8px;
    background: var(--bg-secondary, #f5f5f5);
    border-radius: 4px;
    font-size: 0.85em;
    color: var(--text-muted, #666);
    display: none;
    visibility: hidden;
    width: 0;
    height: 0;
    overflow: hidden;
  }
  
  .error-message {
    margin-top: 8px;
    padding: 8px;
    background: var(--status-error-bg);
    border: 1px solid var(--status-error-border);
    border-radius: 4px;
    color: var(--status-error-text);
    font-size: 0.9em;
  }
  
  dialog[open] {
    border: none;
    border-radius: 8px;
    box-shadow: var(--shadow-lg, 0 2px 16px rgba(0,0,0,0.2));
    padding: 0;
    background: var(--bg-primary, white);
    z-index: 1000;
    position: relative;
    top: -200px;
  }
  
  .modal-img {
    max-width: 75dvw;
    max-height: 75dvh;
    display: block;
  }
  
  .modal-close {
    position: absolute;
    top: 8px;
    right: 12px;
    background: var(--bg-primary, #fff);
    border: none;
    font-size: 1.5em;
    cursor: pointer;
    z-index: 2;
  }
  
  input[type="file"].hidden-input {
    display: none;
  }
  
  .select-file-btn {
    background: var(--brand-primary);
    color: var(--text-inverse);
    border: none;
    padding: 0.5rem 1.2rem;
    border-radius: 4px;
    font-size: 1em;
    cursor: pointer;
    margin-top: 8px;
    margin-bottom: 4px;
    transition: background 0.2s, color 0.2s;
    font-weight: 500;
    box-shadow: var(--shadow-sm);
  }

  .select-file-btn:hover:not(:disabled) {
    background: var(--brand-primary-hover);
  }

  .select-file-btn:disabled {
    background: var(--text-disabled);
    color: var(--text-muted);
    cursor: not-allowed;
  }
  
  .delete-file-btn {
    background: none;
    border: none;
    color: var(--color-error);
    font-size: 1.1em;
    margin-left: 8px;
    cursor: pointer;
    vertical-align: middle;
    padding: 0 4px;
    border-radius: 50%;
    transition: background 0.2s;
  }

  .delete-file-btn:hover {
    background: var(--status-error-bg);
  }
  
  .delete-confirm-modal {
    position: fixed;
    top: 0; 
    left: 0; 
    right: 0; 
    bottom: 0;
    background: rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  }
  
  .delete-confirm-content {
    background: var(--bg-primary, #fff);
    border-radius: 8px;
    box-shadow: var(--shadow-lg, 0 2px 16px rgba(0,0,0,0.2));
    padding: 2rem 2.5rem;
    text-align: center;
    min-width: 260px;
    position: relative;
  }
  
  .delete-confirm-content button {
    margin: 0 0.5rem;
    min-width: 80px;
  }
  
  .delete-confirm-title {
    font-weight: bold;
    color: var(--color-error);
    margin-bottom: 1rem;
    font-size: 1.1em;
  }
  
  .thumbnail-wrapper {
    position: relative;
    display: inline-block;
  }
  
  .thumbnail-wrapper .delete-file-btn {
    position: absolute;
    top: 2px;
    right: 2px;
    background: var(--bg-primary);
    border: none;
    color: var(--color-error);
    font-size: 1.1em;
    padding: 0 4px;
    border-radius: 50%;
    cursor: pointer;
    z-index: 2;
    transition: background 0.2s;
  }

  .thumbnail-wrapper .delete-file-btn:hover {
    background: var(--status-error-bg);
  }
`;