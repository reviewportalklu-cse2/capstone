import { FirestoreService } from './firestore';

const COLLECTION_NAME = 'students';

export const studentService = {
  getAll: async () => {
    return FirestoreService.getAll(COLLECTION_NAME);
  },

  getById: async (id) => {
    return FirestoreService.getById(COLLECTION_NAME, id);
  },

  create: async (data) => {
    return FirestoreService.create(COLLECTION_NAME, data);
  },

  update: async (id, data) => {
    return FirestoreService.update(COLLECTION_NAME, id, data);
  },

  delete: async (id) => {
    return FirestoreService.delete(COLLECTION_NAME, id);
  },

  getByGuideId: async (guideId) => {
    return FirestoreService.query(COLLECTION_NAME, [
      { field: 'guideId', operator: '==', value: guideId }
    ]);
  },

  getByFacultyId: async (facultyId) => {
    return FirestoreService.query(COLLECTION_NAME, [
      { field: 'facultyId', operator: '==', value: facultyId }
    ]);
  },

  getByReviewerId: async (reviewerId) => {
    return FirestoreService.query(COLLECTION_NAME, [
      { field: 'reviewerId', operator: '==', value: reviewerId }
    ]);
  }
};
