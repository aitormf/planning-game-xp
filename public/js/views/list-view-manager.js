import { ListRenderer } from '../renderers/list-renderer.js';

export class ListViewManager {
  constructor(cardService, firebaseService, cardRenderer) {
    this.cardService = cardService;
    this.firebaseService = firebaseService;
    this.cardRenderer = cardRenderer;
    this.listRenderer = new ListRenderer();
    this.unsubscribe = null;
  }

  renderListView(projectId, section, config) {
    const container = document.getElementById(`${section}List`);

    if (container) {
      this.subscribeToCards(projectId, section, config);
    }
  }

  subscribeToCards(projectId, section, config) {
    // Usar vistas optimizadas para reducir transferencia de datos
    const viewType = section === 'tasks' ? 'task-list' :
      section === 'bugs' ? 'bug-list' :
        section === 'proposals' ? 'proposal-list' : null;

    if (!viewType) {
      console.error(`Unknown section: ${section}`);
      return;
    }

    const pathCards = `/views/${viewType}/${projectId}`;

    if (this.unsubscribe) {
      this.unsubscribe();
    }

    this.unsubscribe = this.firebaseService.subscribeToPath(pathCards, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const cards = Object.entries(data).reduce((acc, [id, card]) => {
          acc[id] = {
            ...card,
            cardType: config.projectCardElement[section],
            group: section,
            section: section
          };
          return acc;
        }, {});

        this.listRenderer.renderListView(
          document.getElementById(`${section}CardsList`),
          cards,
          config
        );
      }
    });
  }

  cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    if (this.listRenderer) {
      this.listRenderer.cleanup();
    }
  }
}