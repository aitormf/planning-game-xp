import { createInterface } from 'readline';

/**
 * Create a readline interface for interactive prompts.
 * Uses stderr for prompts so stdout stays clean for MCP protocol.
 */
function createRL() {
  return createInterface({
    input: process.stdin,
    output: process.stderr
  });
}

/**
 * Ask a question and return the answer.
 * @param {string} question - Prompt text
 * @param {object} [options]
 * @param {string} [options.defaultValue] - Default if user presses Enter
 * @param {function} [options.validate] - Validation function, returns error string or null
 * @returns {Promise<string>}
 */
export async function ask(question, { defaultValue, validate } = {}) {
  const rl = createRL();
  const suffix = defaultValue ? ` [${defaultValue}]` : '';

  return new Promise((resolve) => {
    const prompt = () => {
      rl.question(`${question}${suffix}: `, async (answer) => {
        const value = answer.trim() || defaultValue || '';

        if (validate) {
          const error = await validate(value);
          if (error) {
            process.stderr.write(`  ❌ ${error}\n`);
            prompt();
            return;
          }
        }

        rl.close();
        resolve(value);
      });
    };
    prompt();
  });
}

/**
 * Ask a yes/no question.
 * @param {string} question - Prompt text
 * @param {boolean} [defaultYes=true] - Default answer
 * @returns {Promise<boolean>}
 */
export async function confirm(question, defaultYes = true) {
  const hint = defaultYes ? 'Y/n' : 'y/N';
  const answer = await ask(`${question} (${hint})`, {
    defaultValue: defaultYes ? 'y' : 'n'
  });
  return answer.toLowerCase().startsWith('y');
}

/**
 * Ask the user to select from a list of options.
 * @param {string} question - Prompt text
 * @param {Array<{label: string, value: string}>} options - Choices
 * @param {string} [defaultValue] - Default selection value
 * @returns {Promise<string>} Selected value
 */
export async function select(question, options, defaultValue) {
  process.stderr.write(`\n${question}\n`);
  options.forEach((opt, i) => {
    const marker = opt.value === defaultValue ? ' (default)' : '';
    process.stderr.write(`  ${i + 1}. ${opt.label}${marker}\n`);
  });

  const answer = await ask('Select option', {
    defaultValue: defaultValue
      ? String(options.findIndex(o => o.value === defaultValue) + 1)
      : '1',
    validate: (val) => {
      const num = parseInt(val, 10);
      if (isNaN(num) || num < 1 || num > options.length) {
        return `Enter a number between 1 and ${options.length}`;
      }
      return null;
    }
  });

  const index = parseInt(answer, 10) - 1;
  return options[index].value;
}

/**
 * Ask the user to select multiple options from a list.
 * @param {string} question - Prompt text
 * @param {Array<{label: string, value: string}>} options - Choices
 * @returns {Promise<string[]>} Selected values
 */
export async function multiSelect(question, options) {
  process.stderr.write(`\n${question}\n`);
  options.forEach((opt, i) => {
    process.stderr.write(`  ${i + 1}. ${opt.label}\n`);
  });

  const answer = await ask('Select (comma-separated, or "all")', {
    defaultValue: 'all',
    validate: (val) => {
      if (val.toLowerCase() === 'all') return null;
      const parts = val.split(',').map(s => s.trim());
      for (const part of parts) {
        const num = parseInt(part, 10);
        if (isNaN(num) || num < 1 || num > options.length) {
          return `Each value must be a number between 1 and ${options.length}`;
        }
      }
      return null;
    }
  });

  if (answer.toLowerCase() === 'all') {
    return options.map(o => o.value);
  }

  const indices = answer.split(',').map(s => parseInt(s.trim(), 10) - 1);
  return [...new Set(indices)].map(i => options[i].value);
}

/**
 * Print a section header.
 * @param {string} title
 */
export function printHeader(title) {
  process.stderr.write(`\n${'─'.repeat(50)}\n`);
  process.stderr.write(`  ${title}\n`);
  process.stderr.write(`${'─'.repeat(50)}\n\n`);
}

/**
 * Print a success message.
 * @param {string} message
 */
export function printSuccess(message) {
  process.stderr.write(`  ✅ ${message}\n`);
}

/**
 * Print an error message.
 * @param {string} message
 */
export function printError(message) {
  process.stderr.write(`  ❌ ${message}\n`);
}

/**
 * Print a warning message.
 * @param {string} message
 */
export function printWarning(message) {
  process.stderr.write(`  ⚠️  ${message}\n`);
}

/**
 * Print an info message.
 * @param {string} message
 */
export function printInfo(message) {
  process.stderr.write(`  ℹ️  ${message}\n`);
}
