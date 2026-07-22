import { FirestoreService } from './firestore';

const COLLECTION_NAME = 'schedules';

export const scheduleService = {
  getAll: async () => FirestoreService.getAll(COLLECTION_NAME),
  getById: async (id) => FirestoreService.getById(COLLECTION_NAME, id),
  create: async (data) => FirestoreService.create(COLLECTION_NAME, data),
  update: async (id, data) => FirestoreService.update(COLLECTION_NAME, id, data),
  delete: async (id) => FirestoreService.delete(COLLECTION_NAME, id),
  getByReviewerId: async (reviewerId) => FirestoreService.query(COLLECTION_NAME, [{ field: 'reviewerId', operator: '==', value: reviewerId }]),
};
