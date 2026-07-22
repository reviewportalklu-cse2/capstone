import { FirestoreService } from './firestore';

const COLLECTION_NAME = 'users';

export const userService = {
  getUserRole: async (uid) => {
    const user = await FirestoreService.getById(COLLECTION_NAME, uid);
    return user ? user.role : null;
  },

  getUserById: async (uid) => {
    return FirestoreService.getById(COLLECTION_NAME, uid);
  },

  updateUserProfile: async (uid, data) => {
    return FirestoreService.update(COLLECTION_NAME, uid, data);
  },

  getAllUsers: async () => {
    return FirestoreService.getAll(COLLECTION_NAME);
  }
};
