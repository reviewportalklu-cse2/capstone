import { FirestoreService } from './firestore';

const COLLECTION_NAME = 'notifications';

export const notificationService = {
  getAll: async () => FirestoreService.getAll(COLLECTION_NAME),
  getById: async (id) => FirestoreService.getById(COLLECTION_NAME, id),
  create: async (data) => FirestoreService.create(COLLECTION_NAME, data),
  update: async (id, data) => FirestoreService.update(COLLECTION_NAME, id, data),
  delete: async (id) => FirestoreService.delete(COLLECTION_NAME, id),
  getByUserId: async (userId) => FirestoreService.query(COLLECTION_NAME, [
    { field: 'userId', operator: '==', value: userId }
  ]),
  subscribeByUserId: (userId, callback) => FirestoreService.subscribeQuery(COLLECTION_NAME, [
    { field: 'targetRole', operator: 'in', value: ['all', userId] } // Fallback for simple broadcast
  ], callback),
  subscribeToBroadcasts: (role, callback) => FirestoreService.subscribeQuery(COLLECTION_NAME, [
    { field: 'targetRole', operator: 'in', value: ['all', role] }
  ], callback)
};
