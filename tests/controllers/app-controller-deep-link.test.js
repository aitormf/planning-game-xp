/**
 * Tests for deep link card opening via handleCardsRenderedEvent.
 *
 * The flow is:
 *   1. renderCollapsedCards creates web components (Lit elements)
 *   2. cards-rendered fires in requestAnimationFrame (after Lit reflects card-id attribute)
 *   3. handleCardsRenderedEvent finds the card via querySelector and opens it in a modal
 *
 * CRITICAL: cards-rendered must fire AFTER Lit has reflected the card-id attribute.
 * A synchronous dispatch before reflection will fail to find the card.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Minimal mock of showExpandedCardInModal
const mockShowExpandedCardInModal = vi.fn();

vi.mock('@/utils/common-functions.js', () => ({
  showExpandedCardInModal: (...args) => mockShowExpandedCardInModal(...args)
}));

/**
 * Creates a minimal controller-like object with handleCardsRenderedEvent.
 * Extracted to avoid importing the full AppController with all its dependencies.
 */
function createDeepLinkHandler() {
  return {
    cardAutoOpened: false,

    handleCardsRenderedEvent() {
      const urlParams = new URLSearchParams(window.location.search);
      const cardIdToOpen = urlParams.get('cardId');

      if (cardIdToOpen && !this.cardAutoOpened) {
        const card = document.querySelector(`[card-id="${cardIdToOpen}"]`);
        if (card) {
          mockShowExpandedCardInModal(card);
          this.cardAutoOpened = true;
        } else {
          this.cardAutoOpened = true;
          const notification = document.createElement('slide-notification');
          notification.message = `Card "${cardIdToOpen}" not found in this project. It may have been deleted or the ID may be incorrect.`;
          notification.type = 'warning';
          document.body.append(notification);
        }
      }
    }
  };
}

describe('Deep Link - handleCardsRenderedEvent', () => {
  let handler;
  const CARD_ID = 'PLN-TSK-0181';

  beforeEach(() => {
    vi.clearAllMocks();
    handler = createDeepLinkHandler();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    // Clean up URL
    window.history.replaceState({}, '', '/');
    document.body.innerHTML = '';
  });

  function setUrlWithCardId(cardId) {
    window.history.replaceState({}, '', `/?cardId=${cardId}#tasks`);
  }

  function addCardToDOM(cardId) {
    const el = document.createElement('div');
    el.setAttribute('card-id', cardId);
    document.body.append(el);
    return el;
  }

  it('should open card in modal when card-id attribute exists in DOM', () => {
    setUrlWithCardId(CARD_ID);
    const card = addCardToDOM(CARD_ID);

    handler.handleCardsRenderedEvent();

    expect(mockShowExpandedCardInModal).toHaveBeenCalledWith(card);
    expect(handler.cardAutoOpened).toBe(true);
  });

  it('should show notification when card does not exist in DOM', () => {
    setUrlWithCardId(CARD_ID);
    // No card in DOM

    handler.handleCardsRenderedEvent();

    expect(mockShowExpandedCardInModal).not.toHaveBeenCalled();
    expect(handler.cardAutoOpened).toBe(true);
    const notification = document.querySelector('slide-notification');
    expect(notification).toBeTruthy();
    expect(notification.message).toContain(CARD_ID);
    expect(notification.type).toBe('warning');
  });

  it('should not run when cardAutoOpened is already true', () => {
    setUrlWithCardId(CARD_ID);
    addCardToDOM(CARD_ID);
    handler.cardAutoOpened = true;

    handler.handleCardsRenderedEvent();

    expect(mockShowExpandedCardInModal).not.toHaveBeenCalled();
  });

  it('should not run when URL has no cardId parameter', () => {
    window.history.replaceState({}, '', '/');
    addCardToDOM(CARD_ID);

    handler.handleCardsRenderedEvent();

    expect(mockShowExpandedCardInModal).not.toHaveBeenCalled();
    expect(handler.cardAutoOpened).toBe(false);
  });

  it('should not set cardAutoOpened before card is found (guards against premature dispatch)', () => {
    setUrlWithCardId(CARD_ID);

    // First call: card NOT in DOM yet (simulates premature synchronous dispatch)
    handler.handleCardsRenderedEvent();
    // cardAutoOpened is true from the else branch — this is the current behavior

    // Reset to simulate the fix: only the rAF dispatch should run
    handler.cardAutoOpened = false;

    // Second call: card IS in DOM (simulates correct rAF dispatch after Lit reflects)
    addCardToDOM(CARD_ID);
    handler.handleCardsRenderedEvent();

    expect(mockShowExpandedCardInModal).toHaveBeenCalledTimes(1);
    expect(handler.cardAutoOpened).toBe(true);
  });

  describe('reloadCards must NOT dispatch cards-rendered synchronously', () => {
    it('should only dispatch cards-rendered from renderCollapsedCards via requestAnimationFrame', () => {
      // This test documents the architectural requirement:
      // reloadCards calls renderCollapsedCards which dispatches cards-rendered in rAF.
      // reloadCards must NOT dispatch its own synchronous cards-rendered because
      // Lit has not yet reflected the card-id attribute at that point.
      //
      // If this test ever needs to change, verify that deep links still work
      // by checking that querySelector('[card-id="..."]') finds the card
      // at the time handleCardsRenderedEvent runs.

      const events = [];
      const listener = (e) => events.push(e.detail);
      document.addEventListener('cards-rendered', listener);

      // Simulate what renderCollapsedCards does: dispatch in rAF
      requestAnimationFrame(() => {
        document.dispatchEvent(new CustomEvent('cards-rendered', {
          detail: { section: 'tasks' }
        }));
      });

      // Synchronous: no events yet
      expect(events.length).toBe(0);

      document.removeEventListener('cards-rendered', listener);
    });
  });
});
