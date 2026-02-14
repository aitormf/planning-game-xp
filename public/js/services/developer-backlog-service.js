import { database, ref, get, set, runDbTransaction, onValue } from '../../firebase-config.js';
const normalize = (value) => (value || '').toString().trim();
const isValidKey = (value) => {
  const key = normalize(value);
  return !!key && !/[.#$\[\]]/.test(key);
};
const dedupeOrder = (order) => {
  const list = Array.isArray(order) ? order : [];
  const result = [];
  for (const key of list) {
    if (key && !result.includes(key)) {
      result.push(key);
    }
  }
  return result;
};

export const developerBacklogService = {
  buildCardKey(projectId, cardType, cardId) {
    return [
      normalize(projectId) || 'unknown',
      normalize(cardType) || 'card',
      normalize(cardId) || 'no-id'
    ].join('|');
  },

  async addItem(developerId, cardData) {
    const devKey = normalize(developerId);
    if (!isValidKey(devKey)) throw new Error('developerId is required');

    const cardKey = cardData.cardKey || this.buildCardKey(cardData.projectId, cardData.cardType, cardData.cardId);
    if (!cardKey) throw new Error('cardKey is required');
    const payload = {
      cardKey,
      cardId: cardData.cardId,
      firebaseId: cardData.firebaseId || cardData.firebaseKey || '',
      projectId: cardData.projectId,
      cardType: cardData.cardType,
      title: cardData.title || cardData.cardId || '',
      status: cardData.status || 'To Do',
      addedBy: cardData.addedBy || '',
      addedAt: new Date().toISOString()
    };

    await runDbTransaction(ref(database, `/developerBacklogs/${devKey}`), (current) => {
      const next = current && typeof current === 'object' ? { ...current } : {};
      const items = next.items && typeof next.items === 'object' ? { ...next.items } : {};
      items[cardKey] = payload;

      const order = dedupeOrder(next.order);
      if (!order.includes(cardKey)) {
        order.push(cardKey);
      }

      return {
        ...next,
        items,
        order
      };
    });
return cardKey;
  },

  async removeItem(developerId, cardKey) {
    const devKey = normalize(developerId);
    if (!isValidKey(devKey) || !cardKey) return;

    await runDbTransaction(ref(database, `/developerBacklogs/${devKey}`), (current) => {
      if (!current || typeof current !== 'object') return current;

      const next = { ...current };
      const items = next.items && typeof next.items === 'object' ? { ...next.items } : {};
      if (items[cardKey]) {
        delete items[cardKey];
      }

      const order = dedupeOrder(next.order).filter((key) => key && key !== cardKey);

      return {
        ...next,
        items,
        order
      };
    });
},

  async reorder(developerId, newOrder) {
    const devKey = normalize(developerId);
    if (!isValidKey(devKey) || !Array.isArray(newOrder)) return;
    if (newOrder.some(k => !k)) return;

    const sanitized = dedupeOrder(newOrder);
    await set(ref(database, `/developerBacklogs/${devKey}/order`), sanitized);
},

  async updateIfExists(developerId, cardData) {
    const devKey = normalize(developerId);
    if (!isValidKey(devKey)) return;
    const cardKey = cardData.cardKey || this.buildCardKey(cardData.projectId, cardData.cardType, cardData.cardId);
    const itemRef = ref(database, `/developerBacklogs/${devKey}/items/${cardKey}`);
    const snap = await get(itemRef);
    if (!snap.exists()) return;

    const current = snap.val() || {};
    const updated = {
      ...current,
      title: cardData.title || current.title || cardData.cardId || '',
      status: cardData.status || current.status || 'To Do',
      projectId: cardData.projectId || current.projectId,
      cardType: cardData.cardType || current.cardType,
      cardId: cardData.cardId || current.cardId,
      firebaseId: cardData.firebaseId || cardData.firebaseKey || current.firebaseId || '',
      cardKey
    };

    await set(itemRef, updated);
},

  subscribe(callback) {
    const backlogRef = ref(database, '/developerBacklogs');
    return onValue(backlogRef, (snapshot) => {
      const data = snapshot.exists() ? snapshot.val() : {};
      callback(data || {});
    });
  }
};

export default developerBacklogService;
