import { FirestoreService } from './firestore';

const COLLECTION_NAME = 'meetings';

export const meetingService = {
  getAll: async () => FirestoreService.getAll(COLLECTION_NAME),
  getById: async (id) => FirestoreService.getById(COLLECTION_NAME, id),
  create: async (data) => FirestoreService.create(COLLECTION_NAME, data),
  update: async (id, data) => FirestoreService.update(COLLECTION_NAME, id, data),
  delete: async (id) => FirestoreService.delete(COLLECTION_NAME, id),
  
  getByGuideId: async (guideId) => {
    try {
      return await FirestoreService.query(COLLECTION_NAME, [
        { field: 'guideId', operator: '==', value: guideId }
      ]);
    } catch (error) {
      console.error("Error getting meetings by guideId: ", error);
      throw error;
    }
  },

  getByTeamId: async (teamId) => {
    try {
      return await FirestoreService.query(COLLECTION_NAME, [
        { field: 'teamId', operator: '==', value: teamId }
      ]);
    } catch (error) {
      console.error("Error getting meetings by teamId: ", error);
      throw error;
    }
  }
};
