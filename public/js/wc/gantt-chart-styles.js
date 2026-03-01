import { css } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';

export const GanttChartStyles = css`
  :host {
    display: block;
    width: 100%;
  }
  .chart-container {
    overflow-x: auto;
  }
  .task-bar {
    cursor: pointer;
  }
  .tooltip {
    position: absolute;
    padding: 8px;
    background: var(--bg-primary, white);
    border: 1px solid var(--border-color, #ccc);
    border-radius: 4px;
    pointer-events: none;
    font-size: 14px;
    box-shadow: var(--shadow-md, 0 2px 4px rgba(0,0,0,0.1));
    color: var(--text-primary, inherit);
  }
  .current-date-line {
    stroke: var(--color-error, #f43f5e);
    stroke-width: 2;
    stroke-dasharray: 4;
  }
  text {
    fill: var(--text-primary, currentColor);
  }
  .x-axis text {
    fill: var(--text-secondary, currentColor);
  }
  .x-axis line, .x-axis path {
    stroke: var(--border-color, currentColor);
  }
`;