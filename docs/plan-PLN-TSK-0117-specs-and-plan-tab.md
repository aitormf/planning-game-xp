# Plan: PLN-TSK-0117 — Add Specs & Plan tab to each task card

## Contexto

Cada tarea necesita una pestaña "Specs & Plan" que muestre el contexto de negocio del proyecto (read-only) y un plan de implementación estructurado y editable. Esto permite que tanto devs como la IA (Claude Code vía MCP) tengan toda la información necesaria para implementar una tarea.

**Hallazgo clave**: TaskCard ya tiene propiedades `implementationPlan` (String) e `implementationNotes` (String) con tabs condicionales "Plan IA" y "Dev Notes", pero:
- Son read-only (`<pre>` sin edición)
- **No se persisten** (faltan en `getWCProps()`) — BUG existente
- Son strings planos, no estructurados

El plan es: reemplazar el tab condicional "Plan IA" por un tab permanente "Specs & Plan" con dos secciones, y arreglar la persistencia.

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `public/js/wc/TaskCard.js` | Reemplazar tab "Plan IA" por "Specs & Plan", nueva propiedad estructurada, render, persistencia |
| `public/js/wc/task-card-styles.js` | Estilos para las secciones de specs y plan |
| `tests/wc/task-card-specs-plan.test.js` | Tests para la nueva funcionalidad |

## Implementación

### 1. TaskCard.js — Cambiar propiedad `implementationPlan`

Reemplazar la propiedad `implementationPlan: { type: String }` por `implementationPlan: { type: Object }`.

El objeto tendrá esta estructura (retrocompatible con String para datos legacy):
```js
{
  approach: '',           // Enfoque técnico (texto libre)
  steps: [],              // [{description, files, status}] — status: pending|in_progress|done
  dataModelChanges: '',   // Cambios en modelo de datos
  apiChanges: '',         // Cambios en API
  risks: '',              // Riesgos identificados
  outOfScope: '',         // Fuera de alcance
  planStatus: 'pending'   // pending|proposed|validated|in_progress|completed
}
```

Constructor — inicializar con `null` (tab siempre visible pero muestra placeholder si vacío).

### 2. TaskCard.js — Reemplazar el tab condicional

**Eliminar** (L3068-3076):
```js
${this.implementationPlan ? html`
<color-tab name="implementationPlan" label="Plan IA" color="#9333ea">
  ...
</color-tab>
` : ''}
```

**Reemplazar por** (tab siempre visible):
```js
<color-tab name="specsAndPlan" label="Specs & Plan" color="#9333ea">
  ${this._renderSpecsAndPlanTab()}
</color-tab>
```

### 3. TaskCard.js — Método `_renderSpecsAndPlanTab()`

```js
_renderSpecsAndPlanTab() {
  const project = globalThis.projects?.[this.projectId];
  const businessContext = project?.businessContext || '';
  const projectDescription = project?.description || '';
  const plan = this._getNormalizedPlan();

  return html`
    <div class="specs-plan-container">
      <!-- SECCIÓN 1: Specs del proyecto (read-only) -->
      <details class="specs-section" ?open=${!!(businessContext || projectDescription)}>
        <summary class="specs-summary">Contexto del Proyecto</summary>
        <div class="specs-content">
          ${businessContext
            ? html`<div class="specs-block">
                <h4>Contexto de Negocio</h4>
                <div class="markdown-preview">${unsafeHTML(this._renderMarkdown(businessContext))}</div>
              </div>`
            : ''}
          ${projectDescription
            ? html`<div class="specs-block">
                <h4>Descripción del Proyecto</h4>
                <div class="markdown-preview">${unsafeHTML(this._renderMarkdown(projectDescription))}</div>
              </div>`
            : ''}
          ${!businessContext && !projectDescription
            ? html`<p class="empty-specs">No hay contexto de proyecto configurado.</p>`
            : ''}
        </div>
      </details>

      <!-- SECCIÓN 2: Plan de implementación (editable) -->
      <div class="plan-section">
        <div class="plan-header">
          <h4>Plan de Implementación</h4>
          <select class="plan-status-select" .value=${plan.planStatus}
            @change=${this._handlePlanStatusChange} ?disabled=${!this.canSave}>
            <option value="pending">Pendiente</option>
            <option value="proposed">Propuesto</option>
            <option value="validated">Validado</option>
            <option value="in_progress">En ejecución</option>
            <option value="completed">Completado</option>
          </select>
        </div>

        <div class="plan-field">
          <label>Enfoque técnico</label>
          <textarea .value=${plan.approach} @input=${(e) => this._updatePlanField('approach', e.target.value)}
            placeholder="Describe el enfoque técnico para resolver esta tarea" rows="3"
            ?disabled=${!this.canSave}></textarea>
        </div>

        <div class="plan-field">
          <label>Pasos de implementación</label>
          ${this._renderPlanSteps(plan.steps)}
          ${this.canSave ? html`
            <button type="button" class="add-step-btn" @click=${this._addPlanStep}>+ Añadir paso</button>
          ` : ''}
        </div>

        <div class="plan-two-col">
          <div class="plan-field">
            <label>Cambios en modelo de datos</label>
            <textarea .value=${plan.dataModelChanges} @input=${(e) => this._updatePlanField('dataModelChanges', e.target.value)}
              placeholder="Campos nuevos, migraciones..." rows="2" ?disabled=${!this.canSave}></textarea>
          </div>
          <div class="plan-field">
            <label>Cambios en API</label>
            <textarea .value=${plan.apiChanges} @input=${(e) => this._updatePlanField('apiChanges', e.target.value)}
              placeholder="Endpoints, Cloud Functions..." rows="2" ?disabled=${!this.canSave}></textarea>
          </div>
        </div>

        <div class="plan-two-col">
          <div class="plan-field">
            <label>Riesgos</label>
            <textarea .value=${plan.risks} @input=${(e) => this._updatePlanField('risks', e.target.value)}
              placeholder="Riesgos identificados" rows="2" ?disabled=${!this.canSave}></textarea>
          </div>
          <div class="plan-field">
            <label>Fuera de alcance</label>
            <textarea .value=${plan.outOfScope} @input=${(e) => this._updatePlanField('outOfScope', e.target.value)}
              placeholder="Lo que NO se hará" rows="2" ?disabled=${!this.canSave}></textarea>
          </div>
        </div>
      </div>
    </div>
  `;
}
```

### 4. TaskCard.js — Helpers del plan

```js
_getNormalizedPlan() {
  if (!this.implementationPlan) {
    return { approach: '', steps: [], dataModelChanges: '', apiChanges: '', risks: '', outOfScope: '', planStatus: 'pending' };
  }
  // Legacy: si es string (datos viejos del MCP), migrar
  if (typeof this.implementationPlan === 'string') {
    return { approach: this.implementationPlan, steps: [], dataModelChanges: '', apiChanges: '', risks: '', outOfScope: '', planStatus: 'proposed' };
  }
  return { approach: '', steps: [], dataModelChanges: '', apiChanges: '', risks: '', outOfScope: '', planStatus: 'pending', ...this.implementationPlan };
}

_updatePlanField(field, value) {
  const plan = this._getNormalizedPlan();
  plan[field] = value;
  this.implementationPlan = { ...plan };
}

_handlePlanStatusChange(e) {
  this._updatePlanField('planStatus', e.target.value);
}

_addPlanStep() {
  const plan = this._getNormalizedPlan();
  plan.steps = [...plan.steps, { description: '', files: '', status: 'pending' }];
  this.implementationPlan = { ...plan };
}

_updatePlanStep(index, field, value) {
  const plan = this._getNormalizedPlan();
  plan.steps = plan.steps.map((s, i) => i === index ? { ...s, [field]: value } : s);
  this.implementationPlan = { ...plan };
}

_removePlanStep(index) {
  const plan = this._getNormalizedPlan();
  plan.steps = plan.steps.filter((_, i) => i !== index);
  this.implementationPlan = { ...plan };
}

_renderPlanSteps(steps) {
  if (!steps || steps.length === 0) {
    return html`<div class="empty-steps">No hay pasos definidos</div>`;
  }
  return html`
    <div class="plan-steps-list">
      ${steps.map((step, i) => html`
        <div class="plan-step ${step.status}">
          <div class="step-header">
            <span class="step-number">#${i + 1}</span>
            <select .value=${step.status} @change=${(e) => this._updatePlanStep(i, 'status', e.target.value)}
              ?disabled=${!this.canSave}>
              <option value="pending">Pendiente</option>
              <option value="in_progress">En curso</option>
              <option value="done">Hecho</option>
            </select>
            ${this.canSave ? html`
              <button type="button" class="remove-step-btn" @click=${() => this._removePlanStep(i)}>×</button>
            ` : ''}
          </div>
          <textarea .value=${step.description} @input=${(e) => this._updatePlanStep(i, 'description', e.target.value)}
            placeholder="Descripción del paso" rows="2" ?disabled=${!this.canSave}></textarea>
          <input type="text" .value=${step.files || ''} @input=${(e) => this._updatePlanStep(i, 'files', e.target.value)}
            placeholder="Ficheros afectados (separados por comas)" ?disabled=${!this.canSave} />
        </div>
      `)}
    </div>
  `;
}
```

### 5. TaskCard.js — Imports adicionales

Añadir al inicio (junto a los imports existentes):
```js
import { unsafeHTML } from 'https://cdn.jsdelivr.net/npm/lit-html@3.0.2/directives/unsafe-html.js';
import { marked } from 'https://cdn.jsdelivr.net/npm/marked@15/+esm';
```

Añadir método (reutilizar patrón de ProjectForm):
```js
_renderMarkdown(text) {
  if (!text) return '';
  return marked.parse(text);
}
```

### 6. TaskCard.js — Fix persistencia en `getWCProps()`

En `getWCProps()` (~L3223), antes de la línea `};`, añadir:
```js
implementationPlan: this.implementationPlan || null,
implementationNotes: this.implementationNotes || '',
```

### 7. task-card-styles.js — Estilos nuevos

```css
/* Specs & Plan tab */
.specs-plan-container {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.specs-section {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.specs-summary {
  padding: 8px 12px;
  background: #f9fafb;
  font-weight: 600;
  font-size: 0.9em;
  cursor: pointer;
  color: #374151;
}

.specs-content {
  padding: 12px;
}

.specs-block {
  margin-bottom: 12px;
}

.specs-block h4 {
  margin: 0 0 4px 0;
  font-size: 0.85em;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.specs-block .markdown-preview {
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 8px;
  background: #fafafa;
  font-size: 0.85em;
  line-height: 1.5;
  max-height: 200px;
  overflow-y: auto;
}

.empty-specs {
  color: #9ca3af;
  font-style: italic;
  font-size: 0.9em;
  padding: 8px;
}

/* Plan section */
.plan-section {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.plan-header h4 {
  margin: 0;
  font-size: 0.95em;
  color: #374151;
}

.plan-status-select {
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.85em;
}

.plan-field {
  margin-bottom: 10px;
}

.plan-field label {
  display: block;
  font-size: 0.8em;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.plan-field textarea,
.plan-field input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.85em;
  font-family: inherit;
  box-sizing: border-box;
  resize: vertical;
}

.plan-two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

/* Plan steps */
.plan-steps-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.plan-step {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px;
  background: #fafafa;
}

.plan-step.done {
  border-color: #86efac;
  background: #f0fdf4;
}

.plan-step.in_progress {
  border-color: #93c5fd;
  background: #eff6ff;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.step-number {
  font-weight: 700;
  font-size: 0.85em;
  color: #6b7280;
}

.step-header select {
  padding: 2px 6px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.8em;
}

.remove-step-btn {
  margin-left: auto;
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  font-size: 1.2em;
  padding: 0 4px;
}

.add-step-btn {
  margin-top: 4px;
  padding: 4px 10px;
  background: #f3f4f6;
  border: 1px dashed #d1d5db;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85em;
  color: #6b7280;
}

.add-step-btn:hover {
  background: #e5e7eb;
}

.empty-steps {
  color: #9ca3af;
  font-style: italic;
  font-size: 0.85em;
  padding: 8px;
  text-align: center;
}
```

### 8. Retrocompatibilidad con datos MCP existentes

El MCP ya escribe `implementationPlan` como String (texto plano). La función `_getNormalizedPlan()` maneja esto:
- Si es `null` → plan vacío
- Si es `string` → migra a `{ approach: string, planStatus: 'proposed' }`
- Si es `object` → usa directamente

**No se necesita migración de datos** — la normalización es lazy en el render.

### 9. MCP — Sin cambios necesarios

`get_card` ya devuelve `implementationPlan` tal cual esté en Firebase. `update_card` ya acepta cualquier valor. El MCP puede escribir un objeto estructurado o un string — TaskCard maneja ambos.

## Tests

**tests/wc/task-card-specs-plan.test.js** (nuevo):
- `_getNormalizedPlan()` retorna plan vacío por defecto
- `_getNormalizedPlan()` migra string legacy a objeto
- `_getNormalizedPlan()` preserva objeto existente
- `_updatePlanField()` actualiza campo específico
- `_addPlanStep()` añade paso
- `_removePlanStep()` elimina paso
- `_updatePlanStep()` actualiza paso específico
- `getWCProps()` incluye `implementationPlan` e `implementationNotes` (fix del bug)
- `_renderMarkdown()` retorna HTML

## Orden de ejecución

1. Estilos (task-card-styles.js)
2. Imports + `_renderMarkdown` (TaskCard.js)
3. Helpers del plan (TaskCard.js)
4. Render del tab (TaskCard.js)
5. Fix persistencia en `getWCProps()` (TaskCard.js)
6. Tests
7. `npm test`

## Verificación

1. `npm test` — todos pasan
2. Dev + emulator — abrir tarea en vista expandida:
   - Tab "Specs & Plan" siempre visible
   - Sección "Contexto del Proyecto" muestra businessContext y description (read-only, colapsable)
   - Sección "Plan de implementación" con campos editables
   - Pasos de implementación: añadir, editar, cambiar estado, eliminar
   - Guardar persiste `implementationPlan` como objeto en Firebase
3. Tarea con `implementationPlan` string legacy → se muestra en campo "Enfoque técnico"
4. MCP `get_card` → devuelve `implementationPlan` como objeto
