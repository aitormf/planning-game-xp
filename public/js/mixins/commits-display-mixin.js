/**
 * Mixin for displaying commits in card components
 * Provides shared functionality for TaskCard and BugCard
 */
import { html } from 'https://cdn.jsdelivr.net/npm/lit@3.0.2/+esm';
import { format, parseISO, isValid } from 'https://cdn.jsdelivr.net/npm/date-fns@3.6.0/+esm';

/**
 * Mixin that adds commits display functionality to a LitElement class
 * @param {typeof LitElement} superClass - The class to extend
 * @returns {typeof LitElement} - Extended class with commits functionality
 */
export const CommitsDisplayMixin = (superClass) => class extends superClass {
  static get properties() {
    return {
      ...super.properties,
      commits: { type: Array }
    };
  }

  constructor() {
    super();
    this.commits = [];
  }

  /**
   * Get the commits array safely
   * @returns {Array} Array of commit objects
   */
  _getCommitsArray() {
    return Array.isArray(this.commits) ? this.commits : [];
  }

  /**
   * Get commits tab label with count badge
   * @returns {string} Label for the commits tab
   */
  _getCommitsTabLabel() {
    const count = this._getCommitsArray().length;
    if (count > 0) {
      return `Commits (${count})`;
    }
    return 'Commits';
  }

  /**
   * Format a commit date for display
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date
   */
  _formatCommitDate(dateString) {
    if (!dateString) return '';
    try {
      const date = parseISO(dateString);
      if (isValid(date)) {
        return format(date, 'dd/MM/yyyy HH:mm');
      }
    } catch {
      // If parsing fails, try to show at least the date part
      if (dateString.includes('T')) {
        return dateString.split('T')[0];
      }
    }
    return dateString;
  }

  /**
   * Truncate commit hash for display
   * @param {string} hash - Full commit hash
   * @returns {string} Truncated hash (first 7 characters)
   */
  _truncateHash(hash) {
    if (!hash || typeof hash !== 'string') return '';
    return hash.substring(0, 7);
  }

  /**
   * Render the commits panel content
   * @returns {TemplateResult} Lit HTML template
   */
  renderCommitsPanel() {
    const commits = this._getCommitsArray();

    if (commits.length === 0) {
      return html`
        <div class="commits-panel">
          <div class="no-commits">
            No hay commits asociados a esta tarjeta.
          </div>
        </div>
      `;
    }

    // Sort commits by date (most recent first)
    const sortedCommits = [...commits].sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      return dateB - dateA;
    });

    return html`
      <div class="commits-panel">
        <ul class="commits-list">
          ${sortedCommits.map(commit => html`
            <li class="commit-item">
              <div class="commit-header">
                <span class="commit-hash" title="${commit.hash}">${this._truncateHash(commit.hash)}</span>
                <span class="commit-date">${this._formatCommitDate(commit.date)}</span>
              </div>
              <div class="commit-message">${commit.message}</div>
              <div class="commit-author">👤 ${commit.author}</div>
            </li>
          `)}
        </ul>
      </div>
    `;
  }
};
