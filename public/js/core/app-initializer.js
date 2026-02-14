import { showModal } from '@manufosela/app-modal';
import { showSlideNotification } from '../wc/SlideNotification.js';

document.addEventListener('show-slide-notification', (e) => {
  showSlideNotification(e.detail.options);
});

document.addEventListener('show-modal', (e) => {
  showModal(e.detail.options);
});
