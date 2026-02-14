/**
 * Utility function to show a modal for editing acceptance criteria scenarios (Given/When/Then)
 * Shared by TaskCard, BugCard, and ProposalCard
 */

/**
 * Opens a modal to create or edit a scenario
 * @param {Object} options - Configuration options
 * @param {Object|null} options.existing - Existing scenario data { given, when, then } or null for new
 * @param {boolean} options.isNew - Whether this is a new scenario
 * @param {Function} options.onSave - Callback with { given, when, then } when saved
 */
export function openScenarioModal({ existing = null, isNew = false, onSave }) {
  const scenario = existing || { given: '', when: '', then: '' };

  // Color scheme for each field type
  const fieldColors = {
    given: { bg: '#e8f5e9', border: '#4caf50', accent: '#2e7d32' },
    when: { bg: '#e3f2fd', border: '#2196f3', accent: '#1565c0' },
    then: { bg: '#fff3e0', border: '#ff9800', accent: '#e65100' }
  };

  const formContainer = document.createElement('div');
  formContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    width: 100%;
    min-width: 450px;
    max-width: 550px;
    padding: 0.5rem;
    text-align: left;
    box-sizing: border-box;
  `.replace(/\s+/g, ' ').trim();

  const createField = (labelText, keyword, value, colors) => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      background: ${colors.bg};
      padding: 1rem;
      border-radius: 8px;
      border-left: 4px solid ${colors.border};
    `.replace(/\s+/g, ' ').trim();

    const labelContainer = document.createElement('div');
    labelContainer.style.cssText = 'display: flex; align-items: center; gap: 0.5rem;';

    const badge = document.createElement('span');
    badge.textContent = keyword;
    badge.style.cssText = `
      background: ${colors.accent};
      color: white;
      padding: 0.25rem 0.6rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    `.replace(/\s+/g, ' ').trim();

    const label = document.createElement('span');
    label.textContent = labelText;
    label.style.cssText = `
      font-weight: 500;
      color: #4a5568;
      font-size: 0.9rem;
    `.replace(/\s+/g, ' ').trim();

    labelContainer.appendChild(badge);
    labelContainer.appendChild(label);

    const textarea = document.createElement('textarea');
    textarea.style.cssText = `
      width: 100%;
      min-height: 80px;
      padding: 0.875rem;
      font-size: 0.95rem;
      font-family: inherit;
      line-height: 1.5;
      border: 2px solid ${colors.border}40;
      border-radius: 6px;
      resize: vertical;
      box-sizing: border-box;
      background: white;
      color: #1a202c;
      transition: border-color 0.2s, box-shadow 0.2s;
    `.replace(/\s+/g, ' ').trim();
    textarea.placeholder = `Describe ${labelText.toLowerCase()}...`;
    textarea.value = value || '';

    // Focus styles
    textarea.addEventListener('focus', () => {
      textarea.style.borderColor = colors.border;
      textarea.style.boxShadow = `0 0 0 3px ${colors.border}30`;
      textarea.style.outline = 'none';
    });
    textarea.addEventListener('blur', () => {
      textarea.style.borderColor = `${colors.border}40`;
      textarea.style.boxShadow = 'none';
    });

    wrapper.appendChild(labelContainer);
    wrapper.appendChild(textarea);

    return { wrapper, textarea };
  };

  const dadoField = createField('el contexto inicial', 'Dado', scenario.given, fieldColors.given);
  const cuandoField = createField('la acción ejecutada', 'Cuando', scenario.when, fieldColors.when);
  const entoncesField = createField('el resultado esperado', 'Entonces', scenario.then, fieldColors.then);

  formContainer.appendChild(dadoField.wrapper);
  formContainer.appendChild(cuandoField.wrapper);
  formContainer.appendChild(entoncesField.wrapper);

  document.dispatchEvent(new CustomEvent('show-modal', {
    detail: {
      options: {
        title: isNew ? '✨ Nuevo escenario' : '📝 Editar escenario',
        message: '',
        contentElement: formContainer,
        maxWidth: '620px',
        button1Text: '💾 Guardar',
        button2Text: 'Cancelar',
        button1Action: () => {
          if (onSave) {
            onSave({
              given: dadoField.textarea.value.trim(),
              when: cuandoField.textarea.value.trim(),
              then: entoncesField.textarea.value.trim(),
              raw: ''
            });
          }
        },
        button2Action: () => { }
      }
    }
  }));
}
