import { LitElement, html, svg } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';
import { sprintPointsChartStyles } from './sprint-points-chart-styles.js';

/**
 * Componente para mostrar la evolución de puntos por sprint.
 * @property {Array<Object>} sprints - Array de objetos sprint con {title, businessPoints, devPoints}
 * @property {Array<number>} bugsBySprint - Array con el número de bugs resueltos por sprint (índice = sprint)
 * @property {String} viewMode - Estado para controlar la vista y los botones para alternar entre ellas ('chart' o 'list')
 */
export class SprintPointsChart extends LitElement {
  static get properties() {
    return {
      sprints: { type: Array },
      /**
       * Número de bugs resueltos por sprint (índice = sprint)
       * @type {Array<number>}
       */
      bugsBySprint: { type: Array },
      viewMode: { type: String, reflect: true } // 'chart' o 'list'
    };
  }

  static get styles() {
    return sprintPointsChartStyles;
  }

  constructor() {
    super();
    this.sprints = [];
    this.bugsBySprint = [];
    this.viewMode = 'chart'; // Por defecto mostramos el gráfico
  }

  /**
   * Calcula la media de un array de números
   * @param {number[]} numbers - Array de números
   * @returns {number} La media de los números
   */
  calculateMean(numbers) {
    if (numbers.length === 0) return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  /**
   * Calcula la mediana de un array de números
   * @param {number[]} numbers - Array de números
   * @returns {number} La mediana de los números
   */
  calculateMedian(numbers) {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    }
    return sorted[middle];
  }

  /**
   * Calcula la moda de un array de números
   * @param {number[]} numbers - Array de números
   * @returns {number} La moda de los números
   */
  calculateMode(numbers) {
    if (numbers.length === 0) return 0;
    const counts = {};
    let maxCount = 0;
    let mode = numbers[0];

    numbers.forEach(num => {
      counts[num] = (counts[num] || 0) + 1;
      if (counts[num] > maxCount) {
        maxCount = counts[num];
        mode = num;
      }
    });

    return mode;
  }

  /**
   * Calcula la desviación estándar de un array de números
   * @param {number[]} numbers - Array de números
   * @returns {number} La desviación estándar
   */
  calculateStandardDeviation(numbers) {
    if (numbers.length === 0) return 0;
    const mean = this.calculateMean(numbers);
    const squareDiffs = numbers.map(value => {
      const diff = value - mean;
      return diff * diff;
    });
    const avgSquareDiff = this.calculateMean(squareDiffs);
    return Math.sqrt(avgSquareDiff);
  }

  /**
   * Calcula el coeficiente de variación (CV)
   * @param {number[]} numbers - Array de números
   * @returns {number} El coeficiente de variación
   */
  calculateCoefficientOfVariation(numbers) {
    if (numbers.length === 0) return 0;
    const mean = this.calculateMean(numbers);
    if (mean === 0) return 0;
    const stdDev = this.calculateStandardDeviation(numbers);
    return (stdDev / mean) * 100; // Retorna como porcentaje
  }

  /**
   * Calcula las estadísticas para los puntos de negocio y desarrollo
   * @returns {Object} Objeto con las estadísticas calculadas
   */
  calculateStats() {
    const businessPoints = this.sprints
      .filter(s => s.startDate && s.endDate && new Date(s.startDate) <= new Date())
      .map(s => s.businessPoints || 0);
    
    const devPoints = this.sprints
      .filter(s => s.startDate && s.endDate && new Date(s.startDate) <= new Date())
      .map(s => s.devPoints || 0);

    return {
      business: {
        mean: this.calculateMean(businessPoints),
        median: this.calculateMedian(businessPoints),
        mode: this.calculateMode(businessPoints),
        stdDev: this.calculateStandardDeviation(businessPoints),
        cv: this.calculateCoefficientOfVariation(businessPoints),
        min: Math.min(...businessPoints),
        max: Math.max(...businessPoints)
      },
      dev: {
        mean: this.calculateMean(devPoints),
        median: this.calculateMedian(devPoints),
        mode: this.calculateMode(devPoints),
        stdDev: this.calculateStandardDeviation(devPoints),
        cv: this.calculateCoefficientOfVariation(devPoints),
        min: Math.min(...devPoints),
        max: Math.max(...devPoints)
      }
    };
  }

  /**
   * Genera los datos para los ticks del eje Y.
   * @param {number} yTicks - Número de divisiones del eje Y.
   * @param {number} yStep - Valor de cada división.
   * @param {function} yScale - Función para escalar valores Y.
   * @returns {Array<{ yVal: number, yPos: number }>} Array con valores y posiciones.
   */
  _getYAxisTickData(yTicks, yStep, yScale) {
    const tickData = [];
    for (let i = 0; i <= yTicks; i++) {
      const yVal = i * yStep;
      const yPos = yScale(yVal);
      tickData.push({ yVal, yPos });
    }
    return tickData;
  }

  updated(changedProperties) {
  }

  render() {
    if (!this.sprints || this.sprints.length === 0) {
      return html`<div class="chart-container">No hay datos de sprints.</div>`;
    }
const stats = this.calculateStats();
    const sprints = this.sprints;
    const width = 800;
    const height = 450;
    const margin = { top: 60, right: 20, bottom: 40, left: 60 };

    const maxPoints = Math.max(
      ...sprints.map(s => Math.max(s.businessPoints || 0, s.devPoints || 0)),
      ...(this.bugsBySprint || []).map(bugs => Number(bugs) || 0),
      10
    );
    const yMax = Math.ceil(maxPoints / 10) * 10;
    const yTicks = 5;
    const yStep = yMax / yTicks;

    const xStep = (width - margin.left - margin.right) / (sprints.length - 1 || 1);
    const yScale = p => height - margin.bottom - ((p / yMax) * (height - margin.top - margin.bottom));

    const tickData = this._getYAxisTickData(yTicks, yStep, yScale);

    const businessLine = sprints.map((s, i) => {
      if (!s.startDate || !s.endDate || new Date(s.startDate) > new Date()) return null;
      return `${margin.left + i * xStep},${yScale(s.businessPoints || 0)}`;
    }).filter(Boolean).join(' ');

    const devLine = sprints.map((s, i) => {
      if (!s.startDate || !s.endDate || new Date(s.startDate) > new Date()) return null;
      return `${margin.left + i * xStep},${yScale(s.devPoints || 0)}`;
    }).filter(Boolean).join(' ');
    
    return html`
      <div class="chart-container">
        <div class="chart-header">
          <div class="chart-title">Puntos por Sprint</div>
        </div>

        <div class="chart-content">
          <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
            <!-- Leyenda -->
            <g transform="translate(${margin.left}, ${margin.top - 40})">
              <line x1="0" y1="0" x2="30" y2="0" stroke="#36a2eb" stroke-width="2" />
              <text x="40" y="4" fill="#666">Puntos Negocio</text>
              
              <line x1="180" y1="0" x2="210" y2="0" stroke="#ff6384" stroke-width="2" />
              <text x="220" y="4" fill="#666">Puntos Desarrollo</text>
              
              <circle cx="380" cy="0" r="6" fill="#4CAF50" stroke="white" stroke-width="2" />
              <text x="390" y="4" fill="#666">Bugs</text>
            </g>

            <!-- Eje Y -->
            <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="#ccc" />
            ${tickData.map(tick => html`
              <g>
                <line x1="${margin.left - 5}" y1="${tick.yPos}" x2="${margin.left}" y2="${tick.yPos}" stroke="#ccc" />
                <text x="${margin.left - 10}" y="${tick.yPos}" text-anchor="end" dominant-baseline="middle" fill="#666">${tick.yVal}</text>
              </g>
            `)}
            
            <!-- Eje X -->
            <line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" stroke="#ccc" />
            ${sprints.map((sprint, i) => {
              const x = margin.left + i * xStep;
              return html`
                <g>
                  <line x1="${x}" y1="${height - margin.bottom}" x2="${x}" y2="${height - margin.bottom + 5}" stroke="#ccc" />
                  <text x="${x}" y="${height - margin.bottom + 20}" text-anchor="middle" fill="#666">${sprint.title}</text>
                </g>
              `;
            })}

            <!-- Líneas de puntos -->
            <polyline points="${businessLine}" fill="none" stroke="#36a2eb" stroke-width="2" />
            <polyline points="${devLine}" fill="none" stroke="#ff6384" stroke-width="2" />

            <!-- Puntos de negocio -->
            ${sprints.map((sprint, i) => {
              if (!sprint.startDate || !sprint.endDate || new Date(sprint.startDate) > new Date()) return '';
              const x = margin.left + i * xStep;
              const y = yScale(sprint.businessPoints || 0);
              return svg`
                <g>
                  <circle cx="${x}" cy="${y}" r="6" fill="#36a2eb" stroke="white" stroke-width="2" />
                  <text x="${x}" y="${y - 10}" text-anchor="middle" fill="#36a2eb" font-weight="bold">${sprint.businessPoints || 0}</text>
                </g>
              `;
            })}

            <!-- Puntos de desarrollo -->
            ${sprints.map((sprint, i) => {
              if (!sprint.startDate || !sprint.endDate || new Date(sprint.startDate) > new Date()) return '';
              const x = margin.left + i * xStep;
              const y = yScale(sprint.devPoints || 0);
              return svg`
                <g>
                  <circle cx="${x}" cy="${y}" r="6" fill="#ff6384" stroke="white" stroke-width="2" />
                  <text x="${x}" y="${y - 10}" text-anchor="middle" fill="#ff6384" font-weight="bold">${sprint.devPoints || 0}</text>
                </g>
              `;
            })}

            <!-- Puntos de bugs -->
            ${this.bugsBySprint?.map((bugs, i) => {
              const sprint = sprints[i];
              if (!sprint.startDate || !sprint.endDate || new Date(sprint.startDate) > new Date()) return '';
              const x = margin.left + i * xStep;
              const y = yScale(bugs);
              return svg`
                <g>
                  <circle cx="${x}" cy="${y}" r="6" fill="#4CAF50" stroke="white" stroke-width="2" />
                  <text x="${x}" y="${y - 10}" text-anchor="middle" fill="#4CAF50" font-weight="bold">${bugs}</text>
                </g>
              `;
            })}
          </svg>

          <div class="stats-container">
            <div class="stats-section">
              <h4>Puntos de Negocio</h4>
              <div class="stat-group business">
                <div class="stat-item" title="Valor promedio de los puntos de negocio en todos los sprints">
                  <span class="stat-label">Media:</span>
                  <span class="stat-value">${stats.business.mean.toFixed(1)}</span>
                </div>
                <div class="stat-item" title="Valor que divide la distribución de puntos en dos partes iguales">
                  <span class="stat-label">Mediana:</span>
                  <span class="stat-value">${stats.business.median.toFixed(1)}</span>
                </div>
                <div class="stat-item" title="Valor que aparece con más frecuencia en los puntos de negocio">
                  <span class="stat-label">Moda:</span>
                  <span class="stat-value">${stats.business.mode.toFixed(1)}</span>
                </div>
                <div class="stat-item" title="Medida de la dispersión de los puntos respecto a su media">
                  <span class="stat-label">Desv. Estándar:</span>
                  <span class="stat-value">${stats.business.stdDev.toFixed(1)}</span>
                </div>
                <div class="stat-item" title="Porcentaje que indica la variabilidad relativa de los puntos">
                  <span class="stat-label">Coef. Variación:</span>
                  <span class="stat-value">${stats.business.cv.toFixed(1)}%</span>
                </div>
                <div class="stat-item" title="Diferencia entre el valor máximo y mínimo de puntos">
                  <span class="stat-label">Rango:</span>
                  <span class="stat-value">${stats.business.min} - ${stats.business.max}</span>
                </div>
              </div>
            </div>

            <div class="stats-section">
              <h4>Puntos de Desarrollo</h4>
              <div class="stat-group development">
                <div class="stat-item" title="Valor promedio de los puntos de desarrollo en todos los sprints">
                  <span class="stat-label">Media:</span>
                  <span class="stat-value">${stats.dev.mean.toFixed(1)}</span>
                </div>
                <div class="stat-item" title="Valor que divide la distribución de puntos en dos partes iguales">
                  <span class="stat-label">Mediana:</span>
                  <span class="stat-value">${stats.dev.median.toFixed(1)}</span>
                </div>
                <div class="stat-item" title="Valor que aparece con más frecuencia en los puntos de desarrollo">
                  <span class="stat-label">Moda:</span>
                  <span class="stat-value">${stats.dev.mode.toFixed(1)}</span>
                </div>
                <div class="stat-item" title="Medida de la dispersión de los puntos respecto a su media">
                  <span class="stat-label">Desv. Estándar:</span>
                  <span class="stat-value">${stats.dev.stdDev.toFixed(1)}</span>
                </div>
                <div class="stat-item" title="Porcentaje que indica la variabilidad relativa de los puntos">
                  <span class="stat-label">Coef. Variación:</span>
                  <span class="stat-value">${stats.dev.cv.toFixed(1)}%</span>
                </div>
                <div class="stat-item" title="Diferencia entre el valor máximo y mínimo de puntos">
                  <span class="stat-label">Rango:</span>
                  <span class="stat-value">${stats.dev.min} - ${stats.dev.max}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('sprint-points-chart', SprintPointsChart);
