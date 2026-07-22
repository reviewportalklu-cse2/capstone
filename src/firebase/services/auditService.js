import { FirestoreService } from './firestore';

const COLLECTION_NAME = 'auditLogs';

export const auditService = {
  getAll: async () => FirestoreService.getAll(COLLECTION_NAME),
  
  log: async (userId, action, entity, previousValue = null, updatedValue = null) => {
    try {
      await FirestoreService.create(COLLECTION_NAME, {
        userId,
        action,
        entity,
        previousValue,
        updatedValue,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("Failed to write audit log:", err);
    }
  }
};
