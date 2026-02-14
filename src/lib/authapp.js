import { signInWithPopup } from 'firebase/auth';
import { auth, microsoftProvider } from '@firebase/config.js';

// Authentication
async function authenticate() {
  try {
    await signInWithPopup(auth, microsoftProvider);
  } catch (error) {
    console.error('[Auth] Authentication error:', error.code, error.message);

    // Detect OAuth provider configuration errors (expired credentials, invalid config)
    const isProviderError =
      error.code === 'auth/invalid-credential' ||
      error.code === 'auth/operation-not-allowed' ||
      error.code === 'auth/internal-error' ||
      (error.message && error.message.includes('400'));

    if (isProviderError) {
      showSlideNotification({
        message: 'Error de autenticación. Si el problema persiste, contacta al administrador (posibles credenciales de la APP expiradas).',
        type: 'error',
        timetohide: 8000
      });
    } else if (error.code === 'auth/popup-closed-by-user') {
      // User closed the popup, no need to show error
      return;
    } else if (error.code === 'auth/cancelled-popup-request') {
      // Multiple popups, ignore
      return;
    } else {
      showSlideNotification({
        message: 'Error de autenticación. Por favor, inténtalo de nuevo.',
        type: 'error'
      });
    }
  }
}

// Initialize auth state listener
auth.onAuthStateChanged((user) => {
  if (user) {
    authContainer.classList.add('hidden');
    appContainer.classList.remove('hidden');
    initializeApp();
  } else {
    authContainer.classList.remove('hidden');
    appContainer.classList.add('hidden');
  }
});