// Debug helper script for notification system
import { pushNotificationServicePromise } from './services/push-notification-service.js';

window.NotificationDebug = {
    // Check current user state
    checkUser() {
        return window.currentUser;
    },

    

    // Check if running in incognito mode
    async isIncognito() {
        try {
            if ('webkitRequestFileSystem' in window) {
                // Chrome
                return new Promise((resolve) => {
                    window.webkitRequestFileSystem(
                        window.TEMPORARY, 1,
                        () => resolve(false),
                        () => resolve(true)
                    );
                });
            } else if ('MozAppearance' in document.documentElement.style) {
                // Firefox
                return window.indexedDB === null;
            } else {
                // Other browsers
                return false;
            }
        } catch (error) {
            return false;
        }
    },

    // Test push notifications
    async testPushNotification() {
        try {
            const user = window.currentUser?.email || 'test@example.com';
// Check if push notifications are supported
            if ('Notification' in window) {
                const permission = await Notification.requestPermission();
if (permission === 'granted') {
                    const testNotification = {
                        id: 'test-' + Date.now(),
                        title: 'Test Push Notification',
                        message: 'Esta es una notificación de prueba para verificar las push notifications',
                        type: 'test',
                        url: window.location.href,
                        data: { test: true }
                    };
                    
                    // Send push notification directly
                    if ((await pushNotificationServicePromise)) {
                        await (await pushNotificationServicePromise).sendPushNotification(user, testNotification);
} else {
                        console.error('❌ PushNotificationService not found');
                    }
                } else {
                    console.warn('⚠️ Push notification permission denied');
                }
            } else {
                console.error('❌ Push notifications not supported');
            }
        } catch (error) {
            console.error('❌ Error testing push notification:', error);
        }
    },

    // Force push notifications to be sent (simulate inactive user)
    async forceTestPushNotification() {
        try {
            const user = window.currentUser?.email || 'test@example.com';
// Temporarily override isUserActive to return false
            const originalIsUserActive = (await pushNotificationServicePromise)?.isUserActive;
            if ((await pushNotificationServicePromise)) {
                (await pushNotificationServicePromise).isUserActive = () => false;
            }
            
            // Create a notification that should trigger push notification
            const testNotification = {
                title: 'Force Test Push Notification',
                message: 'Esta es una notificación forzada para verificar las push notifications',
                type: 'test',
                url: window.location.href,
                data: { test: true, forced: true }
            };
            
            if ((await pushNotificationServicePromise)) {
                await (await pushNotificationServicePromise).createNotification(user, testNotification);
} else {
                console.error('❌ PushNotificationService not found');
            }
            
            // Restore original function
            if ((await pushNotificationServicePromise) && originalIsUserActive) {
                (await pushNotificationServicePromise).isUserActive = originalIsUserActive;
            }
        } catch (error) {
            console.error('❌ Error testing force push notification:', error);
        }
    },

    // Check email sanitization
    sanitizeEmail(email) {
        let sanitized = email;
        // Si es un email completo, extraer solo la parte antes del @
        if (email.includes('@')) {
            sanitized = email.split('@')[0];
        }
        // Reemplazar puntos con guiones bajos
        sanitized = sanitized.replace(/\./g, '_');
return sanitized;
    },

    // Check Firebase path construction
    checkFirebasePath(email) {
        const sanitized = this.sanitizeEmail(email);
        const path = `notifications/${sanitized}`;
return path;
    },

    // Test notification creation
    async createTestNotification(userIdentifier = null) {
        const targetUser = userIdentifier || window.currentUser?.email;
        if (!targetUser) {
            console.error('🔔 No user identifier provided and no current user');
            return;
        }
if ((await pushNotificationServicePromise)) {
            try {
                const result = await (await pushNotificationServicePromise).createTestNotification(targetUser);
return result;
            } catch (error) {
                console.error('🔔 Error creating test notification:', error);
            }
        } else {
            console.error('🔔 pushNotificationService not available');
        }
    },

    // Test notification for a specific name
    async createTestNotificationForName(name) {
return await this.createTestNotification(name);
    },

    // Check notification bell component
    checkBell() {
        return document.querySelector('notification-bell');
    },

    // Manual Firebase query to check notifications
    async checkFirebaseNotifications(email = null) {
        const targetEmail = email || window.currentUser?.email;
        if (!targetEmail) {
            console.error('🔔 No email provided and no current user');
            return;
        }

        const sanitized = this.sanitizeEmail(targetEmail);
        const path = `notifications/${sanitized}`;
if (window.database && window.ref && window.get) {
            try {
                const notificationsRef = window.ref(window.database, path);
                const snapshot = await window.get(notificationsRef);
                return snapshot.val();
            } catch (error) {
                console.error('🔔 Error querying Firebase:', error);
            }
        } else {
            console.error('🔔 Firebase modules not available');
        }
    },

    // Full diagnostic
    async fullDiagnosis(email = null) {
const user = this.checkUser();
        const targetEmail = email || user?.email;
        
        if (!targetEmail) {
            console.error('🔔 No email available for diagnosis');
            return;
        }

        this.checkFirebasePath(targetEmail);
        this.checkBell();
const firebaseData = await this.checkFirebaseNotifications(targetEmail);
await this.createTestNotification(targetEmail);
return {
            user,
            targetEmail,
            firebaseData,
            bell: this.checkBell()
        };
    }
};

