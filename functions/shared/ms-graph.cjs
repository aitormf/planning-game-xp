/**
 * MS Graph API utility functions for Firebase Cloud Functions.
 * Extracted from functions/index.js during monolith refactor.
 *
 * Provides MSAL configuration, access token acquisition, and email sending
 * via the Microsoft Graph API. All external dependencies are injected.
 */
'use strict';

const axios = require('axios');
const { ConfidentialClientApplication } = require('@azure/msal-node');

/**
 * Build MSAL configuration object from provided credentials.
 * @param {object} deps - { msClientId, msClientSecret, msTenantId }
 * @returns {object} MSAL configuration
 */
function getMsalConfig(deps) {
  const { msClientId, msClientSecret, msTenantId } = deps;
  return {
    auth: {
      clientId: msClientId,
      clientSecret: msClientSecret,
      authority: `https://login.microsoftonline.com/${msTenantId}`
    }
  };
}

/**
 * Get MS Graph API access token using client credentials flow.
 * @param {object} deps - { msClientId, msClientSecret, msTenantId, logger }
 * @returns {Promise<string>} Access token
 */
async function getGraphAccessToken(deps) {
  const { logger } = deps;
  try {
    const msalConfig = getMsalConfig(deps);
    const cca = new ConfidentialClientApplication(msalConfig);

    const clientCredentialRequest = {
      scopes: ['https://graph.microsoft.com/.default']
    };

    const response = await cca.acquireTokenByClientCredential(clientCredentialRequest);
    return response.accessToken;
  } catch (error) {
    logger.error('Error getting MS Graph access token:', error);
    throw error;
  }
}

/**
 * Send email using MS Graph API.
 *
 * Blocks sending on emulator. Guards against localhost URLs in production
 * and sends an alert to IT if detected.
 *
 * @param {string} accessToken - MS Graph access token
 * @param {string[]} toEmails - Recipient email addresses
 * @param {string} subject - Email subject
 * @param {string} htmlContent - Email HTML body
 * @param {object} deps - { msFromEmail, msAlertEmail, logger }
 */
async function sendEmail(accessToken, toEmails, subject, htmlContent, deps) {
  const { msFromEmail, msAlertEmail, logger } = deps;

  // Block email sending on emulator to prevent localhost URLs and test noise
  if (process.env.FUNCTIONS_EMULATOR === 'true') {
    logger.info(`[EMULATOR] Email blocked — to: ${toEmails.join(', ')}, subject: "${subject}"`);
    return;
  }

  // Guard: block emails containing localhost URLs in production and alert IT
  if (htmlContent.includes('localhost')) {
    const alertSubject = '[ALERTA] Cloud Function intentó enviar email con localhost';
    const alertBody = `<p>Una Cloud Function intentó enviar un email con URLs localhost en producción.</p>
      <p><strong>Destinatarios originales:</strong> ${toEmails.join(', ')}</p>
      <p><strong>Asunto original:</strong> ${subject}</p>
      <p><strong>PUBLIC_APP_URL actual:</strong> ${process.env.PUBLIC_APP_URL || '(no definida)'}</p>
      <p>El email original fue bloqueado. Revisar la configuración de <code>functions/.env</code>.</p>`;

    logger.error(`Email blocked: contains localhost URLs. Subject: "${subject}", to: ${toEmails.join(', ')}`);

    try {
      const alertData = {
        message: {
          subject: alertSubject,
          body: { contentType: 'HTML', content: alertBody },
          toRecipients: [{ emailAddress: { address: msAlertEmail || msFromEmail } }]
        },
        saveToSentItems: true
      };
      await axios.post(
        `https://graph.microsoft.com/v1.0/users/${msFromEmail}/sendMail`,
        alertData,
        { headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
      );
      logger.info(`Alert email sent to ${msAlertEmail || msFromEmail}`);
    } catch (alertError) {
      logger.error('Failed to send alert email:', alertError.message);
    }

    throw new Error('Email blocked: contains localhost URLs. Alert sent to IT.');
  }

  try {
    const emailData = {
      message: {
        subject: subject,
        body: {
          contentType: 'HTML',
          content: htmlContent
        },
        toRecipients: toEmails.map(email => ({
          emailAddress: { address: email }
        }))
      },
      saveToSentItems: true
    };

    await axios.post(
      `https://graph.microsoft.com/v1.0/users/${msFromEmail}/sendMail`,
      emailData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    logger.info(`Email sent successfully to: ${toEmails.join(', ')}`);
  } catch (error) {
    logger.error('Error sending email:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  getMsalConfig,
  getGraphAccessToken,
  sendEmail,
};
