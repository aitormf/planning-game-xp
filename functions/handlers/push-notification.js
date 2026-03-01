/**
 * Handler for sendPushNotification Cloud Function.
 * Sends FCM push notifications when a new notification entry
 * is created in the Realtime Database.
 *
 * Extracted from functions/index.js during monolith refactor.
 */
'use strict';

/**
 * Handle a new notification event and send an FCM push notification.
 * @param {object} params - { userId, notificationId }
 * @param {object} notificationData - The notification payload from RTDB
 * @param {object} deps - { db, messaging, logger }
 * @returns {Promise<string|null>} FCM message ID or null
 */
async function handlePushNotification(params, notificationData, deps) {
  const { userId, notificationId } = params;
  const { db, messaging, logger } = deps;

  // Allow disabling during bulk imports
  if (process.env.SKIP_PUSH_ON_IMPORT) {
    logger.info('SKIP_PUSH_ON_IMPORT active, notification ignored');
    return null;
  }

  logger.info('New notification created:', {
    userId,
    notificationId,
    title: notificationData.title,
  });

  // Get user's FCM token
  const userTokenSnapshot = await db.ref(`userTokens/${userId}`).once('value');
  const userTokenData = userTokenSnapshot.val();

  if (!userTokenData || !userTokenData.token) {
    logger.warn('No FCM token found for user:', userId);
    return null;
  }

  const fcmToken = userTokenData.token;
  logger.info('Found FCM token for user:', userId);

  // Prepare FCM message
  const message = {
    token: fcmToken,
    notification: {
      title: notificationData.title || 'Nueva notificación',
      body: notificationData.message || 'Tienes una nueva actualización',
    },
    data: {
      notificationId: notificationId,
      type: notificationData.type || 'info',
      projectId: notificationData.projectId || '',
      taskId: notificationData.taskId || '',
      bugId: notificationData.bugId || '',
      timestamp: String(notificationData.timestamp || Date.now()),
      ...(notificationData.data && typeof notificationData.data === 'object'
        ? Object.fromEntries(
            Object.entries(notificationData.data).map(([k, v]) => [k, String(v)])
          )
        : {}),
    },
    android: {
      priority: 'high',
      notification: {
        icon: 'stock_ticker_update',
        color: '#4a9eff',
        sound: 'default',
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
    webpush: {
      headers: {
        Urgency: 'high',
      },
      notification: {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        requireInteraction: true,
        actions: [
          {
            action: 'open',
            title: 'Abrir',
          },
        ],
      },
    },
  };

  // Send FCM message
  try {
    const response = await messaging.send(message);

    logger.info('Push notification sent successfully:', {
      userId,
      notificationId,
      messageId: response,
    });

    return response;
  } catch (error) {
    logger.error('Error sending push notification:', error);

    // Don't throw to avoid function retries for invalid tokens
    if (
      error.code === 'messaging/registration-token-not-registered' ||
      error.code === 'messaging/invalid-registration-token'
    ) {
      logger.warn('Invalid or expired FCM token, should clean up:', error.code);
    }

    return null;
  }
}

module.exports = { handlePushNotification };
