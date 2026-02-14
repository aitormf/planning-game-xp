/**
 * Utilidades de testing para facilitar la creación de tests
 */

/**
 * Crea un mock de Firebase para tests
 * @returns {Object} Mock de Firebase
 */
export function createFirebaseMock() {
  return {
    database: vi.fn(() => ({
      ref: vi.fn(() => ({
        get: vi.fn(),
        set: vi.fn(),
        update: vi.fn(),
        remove: vi.fn(),
        onValue: vi.fn(),
        off: vi.fn()
      })),
      get: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      onValue: vi.fn(),
      off: vi.fn()
    })),
    firestore: vi.fn(() => ({
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn(),
          set: vi.fn(),
          update: vi.fn(),
          delete: vi.fn()
        })),
        add: vi.fn(),
        where: vi.fn(),
        orderBy: vi.fn(),
        limit: vi.fn(),
        get: vi.fn()
      })),
      doc: vi.fn(() => ({
        get: vi.fn(),
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
      }))
    })),
    auth: vi.fn(() => ({
      onAuthStateChanged: vi.fn(),
      currentUser: {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User'
      },
      signInWithPopup: vi.fn(),
      signOut: vi.fn()
    }))
  };
}

/**
 * Crea datos de prueba para cards
 * @param {string} type - Tipo de card (task, bug, sprint, epic)
 * @param {Object} overrides - Propiedades adicionales
 * @returns {Object} Datos de card de prueba
 */
export function createTestCard(type = 'task', overrides = {}) {
  const baseCard = {
    cardId: `test-${type}-${Date.now()}`,
    title: `Test ${type} card`,
    description: `Test description for ${type} card`,
    status: 'To Do',
    createdBy: 'test@example.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  switch (type) {
    case 'task':
      return {
        ...baseCard,
        cardType: 'task-card',
        businessPoints: 5,
        devPoints: 3,
        sprintId: 'sprint-1',
        epicId: 'epic-1',
        assignedTo: 'developer@example.com',
        blocked: false,
        startDate: null,
        desiredDate: null,
        ...overrides
      };
    case 'bug':
      return {
        ...baseCard,
        cardType: 'bug-card',
        bugpriorityList: 1,
        severity: 'High',
        steps: 'Test steps',
        expected: 'Expected behavior',
        actual: 'Actual behavior',
        assignedTo: 'developer@example.com',
        ...overrides
      };
    case 'sprint':
      return {
        ...baseCard,
        cardType: 'sprint-card',
        startDate: '2024-01-01',
        endDate: '2024-01-15',
        goal: 'Test sprint goal',
        velocity: 0,
        ...overrides
      };
    case 'epic':
      return {
        ...baseCard,
        cardType: 'epic-card',
        epicId: `epic-${Date.now()}`,
        businessValue: 100,
        ...overrides
      };
    default:
      return { ...baseCard, ...overrides };
  }
}

/**
 * Crea un mock de proyecto para tests
 * @param {Object} overrides - Propiedades adicionales
 * @returns {Object} Datos de proyecto de prueba
 */
export function createTestProject(overrides = {}) {
  return {
    projectId: 'test-project',
    name: 'Test Project',
    description: 'Test project description',
    createdBy: 'admin@example.com',
    createdAt: new Date().toISOString(),
    status: 'active',
    ...overrides
  };
}

/**
 * Simula una respuesta exitosa de Firebase
 * @param {any} data - Datos a retornar
 * @returns {Object} Mock de respuesta exitosa
 */
export function createFirebaseSuccessResponse(data) {
  return {
    exists: () => true,
    val: () => data,
    key: 'test-key'
  };
}

/**
 * Simula una respuesta fallida de Firebase
 * @param {string} errorMessage - Mensaje de error
 * @returns {Object} Mock de respuesta fallida
 */
export function createFirebaseErrorResponse(errorMessage = 'Test error') {
  return {
    exists: () => false,
    val: () => null,
    error: new Error(errorMessage)
  };
}

/**
 * Espera a que el DOM se actualice
 * @returns {Promise} Promise que se resuelve después de un tick
 */
export function waitForDOMUpdate() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Simula un evento del DOM
 * @param {HTMLElement} element - Elemento que dispara el evento
 * @param {string} eventType - Tipo de evento
 * @param {Object} detail - Detalles del evento
 */
export function dispatchEvent(element, eventType, detail = {}) {
  const event = new CustomEvent(eventType, { detail, bubbles: true });
  element.dispatchEvent(event);
}

/**
 * Crea un mock de URL para tests
 * @param {string} projectId - ID del proyecto
 * @param {string} section - Sección
 * @param {string} baseUrl - URL base
 */
export function mockURL(projectId = 'test-project', section = 'tasks', baseUrl = 'http://localhost:3000') {
  const search = projectId ? `?projectId=${projectId}` : '';
  const hash = section ? `#${section}` : '';
  
  Object.defineProperty(window, 'location', {
    value: {
      href: `${baseUrl}${search}${hash}`,
      search,
      hash,
      pathname: '/',
      origin: baseUrl
    },
    writable: true
 });
}

/**
 * Limpia todos los mocks después de cada test
 */
export function cleanupMocks() {
  vi.clearAllMocks();
  vi.clearAllTimers();
}

/**
 * Crea un mock de sinsole para tests
 * @returns {Object} Mock de sinsole
 */
export function createSinsoleMock() {
  return {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
  };
} 