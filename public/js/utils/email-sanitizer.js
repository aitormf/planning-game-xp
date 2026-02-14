/**
 * Email sanitization utility for Firebase keys
 * 
 * Firebase keys cannot contain certain characters including: . # $ [ ] /
 * This utility provides consistent email sanitization across all services.
 */

/**
 * Sanitizes an email for use as a Firebase key (simple replacement method)
 * @param {string} email - The email to sanitize
 * @param {boolean} useOnlyPrefix - If true, only use the part before @ (default: true)
 * @returns {string} - Sanitized email safe for Firebase keys
 */
export function sanitizeEmailForFirebase(email, useOnlyPrefix = true) {
    if (!email || typeof email !== 'string') {
        console.warn('⚠️ Invalid email provided to sanitizer:', email);
        return '';
    }
    
    let sanitized = email;
    
    // If useOnlyPrefix is true (default), extract only the part before @
    if (useOnlyPrefix && email.includes('@')) {
        sanitized = email.split('@')[0];
    }
    
    // Replace all Firebase-forbidden characters with underscores
    // Firebase keys cannot contain: . # $ [ ] /
    sanitized = sanitized.replace(/[.#$[\]/]/g, '_');
    
    return sanitized;
}

/**
 * Encodes an email for Firebase storage using character substitution
 * This method preserves the full email structure for decoding
 * @param {string} email - The email to encode
 * @returns {string} - Encoded email safe for Firebase keys
 */
export function encodeEmailForFirebase(email) {
    if (!email || typeof email !== 'string') {
        console.warn('⚠️ Invalid email provided to encoder:', email);
        return '';
    }
    
    // Encode: @ → |, . → !, # → -
    return email.replace(/@/g, '|').replace(/\./g, '!').replace(/#/g, '-');
}

/**
 * Decodes an email that was encoded with encodeEmailForFirebase
 * @param {string} encodedEmail - The encoded email key
 * @returns {string} - Original email address
 */
export function decodeEmailFromFirebase(encodedEmail) {
    if (!encodedEmail || typeof encodedEmail !== 'string') {
        console.warn('⚠️ Invalid encoded email provided to decoder:', encodedEmail);
        return '';
    }
    
    // Decode: | → @, ! → ., - → #
    return encodedEmail.replace(/\|/g, '@').replace(/!/g, '.').replace(/-/g, '#');
}

/**
 * Legacy function for backward compatibility
 * @param {string} email - The email to sanitize
 * @returns {string} - Sanitized email
 * @deprecated Use sanitizeEmailForFirebase instead
 */
export function sanitizeEmail(email) {
    return sanitizeEmailForFirebase(email, true);
}

/**
 * Validates if a string is safe for Firebase keys
 * @param {string} key - The key to validate
 * @returns {boolean} - True if the key is safe for Firebase
 */
export function isFirebaseSafeKey(key) {
    if (!key || typeof key !== 'string') {
        return false;
    }
    
    // Check for forbidden characters
    const forbiddenChars = /[.#$[\]/]/;
    return !forbiddenChars.test(key);
}