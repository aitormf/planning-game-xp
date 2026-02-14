const normalizeEmail = (email) => (email || '').toString().trim().toLowerCase();

let cachedEmail = null;
let cachedIsSuperAdmin = false;

/**
 * Check if user is the SuperAdmin (only ONE, defined in .env)
 * NOTE: /data/superAdminEmails in database is DEPRECATED and no longer used
 */
export async function isCurrentUserSuperAdmin(targetEmail) {
  const email = normalizeEmail(targetEmail || document.body.dataset.userEmail || window.currentUser?.email);
  if (!email) return false;

  if (email === cachedEmail) {
    return cachedIsSuperAdmin;
  }

  try {
    const { superAdminEmail } = await import(/* @vite-ignore */ `${window.location.origin}/firebase-config.js`);

    const normalizedSuperAdmin = normalizeEmail(superAdminEmail);
    cachedEmail = email;
    cachedIsSuperAdmin = normalizedSuperAdmin && email === normalizedSuperAdmin;
    return cachedIsSuperAdmin;
  } catch (error) {
    console.warn('⚠️ super-admin-check: error resolving super admin', error);
  }

  cachedEmail = email;
  cachedIsSuperAdmin = false;
  return false;
}

export { normalizeEmail };
