import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import { generateFirebaseConfig } from '../../scripts/generateFirebaseConfig.js';

const baseEnv = {
  PUBLIC_FIREBASE_API_KEY: 'key',
  PUBLIC_FIREBASE_AUTH_DOMAIN: 'demo.firebaseapp.com',
  PUBLIC_FIREBASE_DATABASE_URL: 'https://demo-default-rtdb.europe-west1.firebasedatabase.app',
  PUBLIC_FIREBASE_PROJECT_ID: 'demo',
  PUBLIC_FIREBASE_STORAGE_BUCKET: 'demo.firebasestorage.app',
  PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '123456',
  PUBLIC_FIREBASE_APP_ID: '1:123456:web:abcdef'
};

describe('generateFirebaseConfig', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should inject PUBLIC_ORG_NAME into generated firebase-config.js', () => {
    const writeSpy = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

    generateFirebaseConfig({ ...baseEnv, PUBLIC_ORG_NAME: 'Geniova' });

    expect(writeSpy).toHaveBeenCalledTimes(1);
    const output = writeSpy.mock.calls[0][1];
    expect(output).toContain('window.orgName = "Geniova";');
  });

  it('should fallback to empty organization name when not configured', () => {
    const writeSpy = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

    generateFirebaseConfig(baseEnv);

    const output = writeSpy.mock.calls[0][1];
    expect(output).toContain('window.orgName = "";');
  });
});
