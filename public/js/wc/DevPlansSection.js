/**
 * DevPlansSection Component
 * Container for Dev Plans, Plan Proposals, and Task Generator sub-tabs.
 * Uses <color-tabs> to organize the three sub-sections.
 */
import { LitElement, html } from 'https://cdn.jsdelivr.net/npm/lit@3.0.2/+esm';
import { DevPlansSectionStyles } from './dev-plans-section-styles.js';
import './PlanProposalsList.js';
import './DevPlansList.js';

export class DevPlansSection extends LitElement {
  static get properties() {
    return {
      projectId: { type: String, attribute: 'project-id' }
    };
  }

  static get styles() {
    return [DevPlansSectionStyles];
  }

  constructor() {
    super();
    this.projectId = '';
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('generate-plan-from-proposal', this._handleGenerateFromProposal);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('generate-plan-from-proposal', this._handleGenerateFromProposal);
  }

  /**
   * Handle event from proposals list to switch to plans tab and start generation
   */
  _handleGenerateFromProposal(e) {
    const { proposalId, title, description } = e.detail;
    const tabs = this.shadowRoot.querySelector('color-tabs');
    if (tabs) {
      tabs.setActiveTab('plans');
    }
    const plansList = this.shadowRoot.querySelector('dev-plans-list');
    if (plansList) {
      plansList.openCreatorFromProposal(proposalId, title, description);
    }
  }

  render() {
    return html`
      <div class="dev-plans-section">
        <color-tabs active-tab="proposals">
          <color-tab name="proposals" label="Proposals" color="var(--brand-primary, #3b82f6)">
            <plan-proposals-list .projectId=${this.projectId}></plan-proposals-list>
          </color-tab>
          <color-tab name="plans" label="Plans" color="var(--brand-secondary, #ec3e95)">
            <dev-plans-list .projectId=${this.projectId}></dev-plans-list>
          </color-tab>
          <color-tab name="generator" label="Task Generator" color="var(--color-success, #4caf50)">
            <ai-document-uploader .projectId=${this.projectId}></ai-document-uploader>
          </color-tab>
        </color-tabs>
      </div>
    `;
  }
}

customElements.define('dev-plans-section', DevPlansSection);
