/**
 * @fileoverview Cloud Function handler that mirrors RTDB card data to Firestore.
 *
 * RTDB path: /cards/{projectId}/{section}/{cardId}
 * Firestore path: projects/{projectId}/{cardType}/{cardId}
 *
 * Where cardType is derived from section:
 *   TASKS_{projectId} → tasks
 *   BUGS_{projectId} → bugs
 *   EPICS_{projectId} → epics
 *   PROPOSALS_{projectId} → proposals
 *   SPRINTS_{projectId} → sprints
 *   QA_{projectId} → qa
 */

const SECTION_TO_COLLECTION = {
  TASKS: 'tasks',
  BUGS: 'bugs',
  EPICS: 'epics',
  PROPOSALS: 'proposals',
  SPRINTS: 'sprints',
  QA: 'qa'
};

/**
 * Extract the card type collection name from a section key like "TASKS_PlanningGame".
 * @param {string} section - e.g., "TASKS_PlanningGame"
 * @returns {string|null} - e.g., "tasks" or null if not recognized
 */
function sectionToCollection(section) {
  const prefix = section.split('_')[0];
  return SECTION_TO_COLLECTION[prefix] || null;
}

/**
 * Handle RTDB card write → Firestore mirror.
 *
 * @param {Object} params - { projectId, section, cardId }
 * @param {Object|null} beforeData - Data before the write (null on create)
 * @param {Object|null} afterData - Data after the write (null on delete)
 * @param {Object} deps - { firestore, logger }
 * @returns {Promise<void>}
 */
async function handleSyncCardToFirestore(params, beforeData, afterData, deps) {
  const { projectId, section, cardId } = params;
  const { firestore, logger } = deps;

  const collection = sectionToCollection(section);
  if (!collection) {
    return;
  }

  const firestoreDocRef = firestore
    .collection('projects')
    .doc(projectId)
    .collection(collection)
    .doc(cardId);

  try {
    if (afterData === null) {
      // Card deleted in RTDB → delete in Firestore
      await firestoreDocRef.delete();
      logger.info(`[sync] Deleted Firestore: projects/${projectId}/${collection}/${cardId}`);
    } else if (beforeData === null) {
      // Card created in RTDB → create in Firestore
      await firestoreDocRef.set(afterData);
      logger.info(`[sync] Created Firestore: projects/${projectId}/${collection}/${cardId}`);
    } else {
      // Card updated in RTDB → overwrite in Firestore
      await firestoreDocRef.set(afterData);
      logger.info(`[sync] Updated Firestore: projects/${projectId}/${collection}/${cardId}`);
    }
  } catch (error) {
    logger.error(`[sync] Error syncing to Firestore: projects/${projectId}/${collection}/${cardId}`, {
      error: error.message
    });
  }
}

/**
 * Handle RTDB project write → Firestore mirror.
 *
 * @param {Object} params - { projectId }
 * @param {Object|null} beforeData - Data before the write
 * @param {Object|null} afterData - Data after the write
 * @param {Object} deps - { firestore, logger }
 * @returns {Promise<void>}
 */
async function handleSyncProjectToFirestore(params, beforeData, afterData, deps) {
  const { projectId } = params;
  const { firestore, logger } = deps;

  const firestoreDocRef = firestore.collection('projects').doc(projectId);

  try {
    if (afterData === null) {
      await firestoreDocRef.delete();
      logger.info(`[sync] Deleted Firestore project: ${projectId}`);
    } else {
      await firestoreDocRef.set(afterData);
      logger.info(`[sync] Synced Firestore project: ${projectId}`);
    }
  } catch (error) {
    logger.error(`[sync] Error syncing project to Firestore: ${projectId}`, {
      error: error.message
    });
  }
}

module.exports = {
  handleSyncCardToFirestore,
  handleSyncProjectToFirestore,
  sectionToCollection
};
