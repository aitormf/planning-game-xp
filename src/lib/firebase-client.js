import { database, ref, onValue } from '../firebase/config.js';

export function getCards(callback) {
  const cardsRef = ref(database, 'cards');
  onValue(cardsRef, (snapshot) => {
    const data = snapshot.val() || {};
    const cards = Object.entries(data).map(([id, card]) => ({ id, ...card }));
    callback(cards);
  });
}
