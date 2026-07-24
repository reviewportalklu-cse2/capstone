import { FirestoreService } from './firestore';

const ROLE_COLLECTION_MAP = {
  'student': 'students',
  'guide': 'guides',
  'classroom_faculty': 'classroomFaculty',
  'reviewer': 'reviewers',
  'admin': 'users' // Admins don't have a domain record typically, so we use their auth user record
};

export const userResolver = {
  /**
   * Resolves a Firebase Authenticated user into their corresponding domain record.
   *
   * @param {Object} firebaseUser - The authenticated user from Firebase Auth
   * @param {string} role - The role of the user (e.g., 'student', 'guide')
   * @returns {Object|null} - The resolved domain user object, or null if not found
   */
  resolveCurrentUser: async (firebaseUser, role) => {
    if (!firebaseUser || !role) return null;

    const email = firebaseUser.email;
    const collectionName = ROLE_COLLECTION_MAP[role];

    if (!collectionName) {
      console.warn(`No collection mapping found for role: ${role}`);
      return null;
    }

    if (role === 'admin') {
      return {
        firebaseUser,
        role: 'admin',
        domainId: firebaseUser.uid,
        email: email,
        name: 'Administrator'
      };
    }

    try {
      // 1. Try querying by lowercase 'email'
      let domainRecords = await FirestoreService.query(collectionName, [
        { field: 'email', operator: '==', value: email }
      ]);

      // 2. If not found, try querying by capitalized 'Email' (since Excel imports might use this)
      if (domainRecords.length === 0) {
        domainRecords = await FirestoreService.query(collectionName, [
          { field: 'Email', operator: '==', value: email }
        ]);
      }

      if (domainRecords.length === 0) {
        console.warn(`No domain record found for ${email} in collection ${collectionName}`);
        return null;
      }

      const domainRecord = domainRecords[0];

      // Standardize the returned domain user
      return {
        firebaseUser,
        role,
        domainId: domainRecord.id,
        email: domainRecord.email || domainRecord.Email,
        employeeId: domainRecord['Employee ID'] || domainRecord.employeeId || null,
        rollNumber: domainRecord['Roll Number'] || domainRecord.rollNumber || null,
        name: domainRecord.name || domainRecord['Student Name'] || domainRecord['Guide Name'] || domainRecord['Faculty Name'] || domainRecord['Reviewer Name'] || domainRecord.Name,
        profile: domainRecord // Expose full profile just in case
      };

    } catch (error) {
      console.error(`Error resolving user ${email}:`, error);
      return null;
    }
  }
};
