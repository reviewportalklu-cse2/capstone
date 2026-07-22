import { FirestoreService } from './firestore';

const COLLECTION_NAME = 'projects';

export const projectService = {
  getAll: async () => FirestoreService.getAll(COLLECTION_NAME),
  getById: async (id) => FirestoreService.getById(COLLECTION_NAME, id),
  create: async (data) => FirestoreService.create(COLLECTION_NAME, data),
  update: async (id, data) => FirestoreService.update(COLLECTION_NAME, id, data),
  delete: async (id) => FirestoreService.delete(COLLECTION_NAME, id),
  getProjectsByGuide: async (guideId) => FirestoreService.query(COLLECTION_NAME, [{ field: 'guideId', operator: '==', value: guideId }]),
  getByStudentId: async (studentId) => FirestoreService.query(COLLECTION_NAME, [{ field: 'studentId', operator: '==', value: studentId }]),
};
