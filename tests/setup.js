/**
 * Configuración inicial para los tests
 * Configura el entorno de testing y mocks globales
 */

import fs from 'fs';
import path from 'path';

const firebaseConfigPath = path.resolve(process.cwd(), 'public/firebase-config.js');

if (!globalThis.__firebaseConfigSnapshot) {
  if (fs.existsSync(firebaseConfigPath)) {
    globalThis.__firebaseConfigSnapshot = fs.readFileSync(firebaseConfigPath, 'utf8');
  } else {
    globalThis.__firebaseConfigSnapshot = null;
  }

  const restoreFirebaseConfig = () => {
    try {
      if (globalThis.__firebaseConfigSnapshot !== null && fs.existsSync(firebaseConfigPath)) {
        const current = fs.readFileSync(firebaseConfigPath, 'utf8');
        if (current !== globalThis.__firebaseConfigSnapshot) {
          fs.writeFileSync(firebaseConfigPath, globalThis.__firebaseConfigSnapshot, 'utf8');
        }
      }
    } catch (error) {
      console.error('Error restaurando firebase-config.js tras tests:', error);
    }
  };

  process.on('exit', restoreFirebaseConfig);
  process.on('SIGINT', () => {
    restoreFirebaseConfig();
    process.exit(130);
  });
  process.on('SIGTERM', () => {
    restoreFirebaseConfig();
    process.exit(143);
  });
  process.on('uncaughtException', (error) => {
    restoreFirebaseConfig();
    throw error;
  });
}

// Mock de Firebase para tests
global.firebase = {
  database: () => ({}),
  firestore: () => ({}),
  auth: () => ({
    onAuthStateChanged: () => ({}),
    currentUser: null
  })
};

// Mock de console para evitar logs en tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};

// Mock de document.body.dataset
Object.defineProperty(document.body, 'dataset', {
  value: {
    userEmail: 'test@example.com'
  },
  writable: true
});

// Variables globales del proyecto mínimas necesarias (sin tocar window)
global.globalSprintList = {};
global.globalDeveloperList = [];
global.globalStakeholders = [];
global.globalBugPriorityList = [];
global.globalRelEmailUser = {};
global.statusTasksList = [];
global.statusBugList = [];
global.userAdminEmails = [];
global.projects = {};
global.projectList = {};

// Mock de CustomEvent
global.CustomEvent = class CustomEvent extends Event {
  constructor(type, options = {}) {
    super(type, options);
    this.detail = options.detail;
  }
};

// Mock de fetch
global.fetch = vi.fn();

// Mock de localStorage
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

// Mock de sessionStorage
global.sessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}; 
