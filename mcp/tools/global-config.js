import { z } from 'zod';
import { getDatabase } from '../firebase-adapter.js';

export const VALID_CONFIG_TYPES = ['agents', 'prompts', 'instructions'];
export const VALID_CATEGORIES = ['development', 'planning', 'qa', 'documentation', 'architecture'];

export const listGlobalConfigSchema = z.object({
  type: z.enum(['agents', 'prompts', 'instructions']).describe('Config type'),
  category: z.string().optional().describe('Filter by category')
});

export const getGlobalConfigSchema = z.object({
  type: z.enum(['agents', 'prompts', 'instructions']).describe('Config type'),
  configId: z.string().describe('Config ID (the Firebase key)')
});

export const createGlobalConfigSchema = z.object({
  type: z.enum(['agents', 'prompts', 'instructions']).describe('Config type'),
  name: z.string().describe('Config name'),
  description: z.string().optional().describe('Config description'),
  content: z.string().optional().describe('Config content'),
  category: z.string().optional().describe('Category (default: "development")')
});

export const updateGlobalConfigSchema = z.object({
  type: z.enum(['agents', 'prompts', 'instructions']).describe('Config type'),
  configId: z.string().describe('Config ID'),
  updates: z.record(z.unknown()).describe('Fields to update')
});

export const deleteGlobalConfigSchema = z.object({
  type: z.enum(['agents', 'prompts', 'instructions']).describe('Config type'),
  configId: z.string().describe('Config ID')
});

export async function listGlobalConfig({ type, category }) {
  const db = getDatabase();
  const configsRef = db.ref(`global/${type}`);
  const snapshot = await configsRef.once('value');
  const configsData = snapshot.val();

  if (!configsData) {
    return { content: [{ type: 'text', text: `No ${type} found.` }] };
  }

  let configs = Object.entries(configsData).map(([configId, config]) => ({
    configId,
    ...config
  }));

  if (category) {
    configs = configs.filter(c => c.category === category);
  }

  configs.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  const summary = configs.map(c => ({
    configId: c.configId,
    name: c.name,
    description: c.description || '',
    category: c.category || 'development',
    createdAt: c.createdAt,
    createdBy: c.createdBy
  }));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(summary, null, 2)
    }]
  };
}

export async function getGlobalConfig({ type, configId }) {
  const db = getDatabase();
  const configRef = db.ref(`global/${type}/${configId}`);
  const snapshot = await configRef.once('value');

  if (!snapshot.exists()) {
    return { content: [{ type: 'text', text: `Config "${configId}" not found in ${type}.` }] };
  }

  const config = {
    configId,
    type,
    ...snapshot.val()
  };

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(config, null, 2)
    }]
  };
}

export async function createGlobalConfig({ type, name, description, content, category }) {
  const db = getDatabase();

  const configCategory = category || 'development';
  if (!VALID_CATEGORIES.includes(configCategory)) {
    throw new Error(`Invalid category "${configCategory}". Valid categories: ${VALID_CATEGORIES.join(', ')}`);
  }

  const configsRef = db.ref(`global/${type}`);
  const newConfigRef = configsRef.push();
  const configId = newConfigRef.key;
  const now = new Date().toISOString();

  const configData = {
    name,
    description: description || '',
    content: content || '',
    category: configCategory,
    createdAt: now,
    createdBy: 'geniova-mcp',
    updatedAt: now,
    updatedBy: 'geniova-mcp'
  };

  await newConfigRef.set(configData);

  await saveConfigHistory(db, type, configId, configData, 'create');

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        message: `${type.slice(0, -1)} created successfully`,
        configId,
        type,
        name,
        category: configCategory
      }, null, 2)
    }]
  };
}

export async function updateGlobalConfig({ type, configId, updates }) {
  const db = getDatabase();
  const configRef = db.ref(`global/${type}/${configId}`);

  const snapshot = await configRef.once('value');
  if (!snapshot.exists()) {
    throw new Error(`Config "${configId}" not found in ${type}.`);
  }

  if (updates.category !== undefined && !VALID_CATEGORIES.includes(updates.category)) {
    throw new Error(`Invalid category "${updates.category}". Valid categories: ${VALID_CATEGORIES.join(', ')}`);
  }

  const protectedFields = ['configId', 'type', 'createdAt', 'createdBy'];
  const protectedFieldsInUpdate = protectedFields.filter(field => field in updates);
  for (const field of protectedFieldsInUpdate) {
    throw new Error(`Cannot update protected field: "${field}"`);
  }

  updates.updatedAt = new Date().toISOString();
  updates.updatedBy = 'geniova-mcp';

  await configRef.update(updates);

  const updatedSnapshot = await configRef.once('value');
  const updatedConfig = updatedSnapshot.val();

  await saveConfigHistory(db, type, configId, updatedConfig, 'update');

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        message: `${type.slice(0, -1)} updated successfully`,
        config: { configId, type, ...updatedConfig }
      }, null, 2)
    }]
  };
}

export async function deleteGlobalConfig({ type, configId }) {
  const db = getDatabase();
  const configRef = db.ref(`global/${type}/${configId}`);

  const snapshot = await configRef.once('value');
  if (!snapshot.exists()) {
    throw new Error(`Config "${configId}" not found in ${type}.`);
  }

  const configData = snapshot.val();

  const trashRef = db.ref(`global-trash/${type}/${configId}`);
  await trashRef.set({
    ...configData,
    deletedAt: new Date().toISOString(),
    deletedBy: 'geniova-mcp'
  });

  await saveConfigHistory(db, type, configId, configData, 'delete');

  await configRef.remove();

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        message: `${type.slice(0, -1)} deleted successfully`,
        configId,
        type
      }, null, 2)
    }]
  };
}

async function saveConfigHistory(db, type, configId, configData, action) {
  try {
    const historyRef = db.ref(`global-history/${type}/${configId}`);
    const newHistoryRef = historyRef.push();

    await newHistoryRef.set({
      name: configData.name,
      description: configData.description,
      content: configData.content,
      category: configData.category,
      timestamp: new Date().toISOString(),
      changedBy: 'geniova-mcp',
      action: action
    });
  } catch (error) {
    console.error('Error saving config history:', error);
  }
}
