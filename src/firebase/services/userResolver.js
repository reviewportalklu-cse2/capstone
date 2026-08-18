import { FirestoreService } from './firestore';
import { getEntityKeys } from '@/utils/relationshipResolver';

const ROLE_COLLECTION_MAP = {
  'student': 'students',
  'guide': 'guides',
  'classroom_faculty': 'classroomFaculty',
  'faculty': 'classroomFaculty',
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
      // 1. Query by lowercase 'email'
      let domainRecords = await FirestoreService.query(collectionName, [
        { field: 'email', operator: '==', value: email }
      ]);

      // 2. Query by capitalized 'Email'
      if (domainRecords.length === 0) {
        domainRecords = await FirestoreService.query(collectionName, [
          { field: 'Email', operator: '==', value: email }
        ]);
      }

      // 3. Query by uid
      if (domainRecords.length === 0 && firebaseUser.uid) {
        domainRecords = await FirestoreService.query(collectionName, [
          { field: 'uid', operator: '==', value: firebaseUser.uid }
        ]);
      }

      // 4. Case-insensitive & normalized key fallback search
      if (domainRecords.length === 0) {
        const allRecords = await FirestoreService.getAll(collectionName);
        const emailPrefix = email ? email.split('@')[0].toLowerCase() : '';
        const searchKeys = [email, firebaseUser.uid, firebaseUser.displayName, emailPrefix].filter(Boolean).flatMap(k => getEntityKeys(k));

        const match = allRecords.find(r => {
          const rEmail = String(r.email || r.Email || '').toLowerCase();
          const rPrefix = rEmail.includes('@') ? rEmail.split('@')[0] : '';
          if (rEmail && rEmail === email.toLowerCase()) return true;
          if (rPrefix && emailPrefix && rPrefix === emailPrefix) return true;
          if (r.id === firebaseUser.uid || r.uid === firebaseUser.uid) return true;
          const rKeys = getEntityKeys(r);
          return searchKeys.some(k => rKeys.includes(k));
        });
        if (match) domainRecords = [match];
      }

      let domainRecord = domainRecords[0];

      // 5. Safe Fallback if no specific collection record exists yet
      if (!domainRecord) {
        const fallbackName = firebaseUser.displayName || (email ? email.split('@')[0].toUpperCase() : 'User');
        domainRecord = {
          id: firebaseUser.uid,
          name: fallbackName,
          email: email,
          department: 'Computer Science & Engineering'
        };
      }

      // Standardize the returned domain user
      return {
        id: domainRecord.id || firebaseUser.uid,
        firebaseUser,
        role,
        domainId: domainRecord.id || firebaseUser.uid,
        email: domainRecord.email || domainRecord.Email || email,
        employeeId: domainRecord['Employee ID'] || domainRecord.employeeId || null,
        rollNumber: domainRecord['Roll Number'] || domainRecord.rollNumber || null,
        name: domainRecord.name || domainRecord['Student Name'] || domainRecord['Guide Name'] || domainRecord['Faculty Name'] || domainRecord['Reviewer Name'] || domainRecord.Name || firebaseUser.displayName || email.split('@')[0].toUpperCase(),
        department: domainRecord.department || domainRecord.Department || 'Computer Science & Engineering',
        assignedBatch: domainRecord.assignedBatch || domainRecord['Assigned Batch'] || '2026',
        profile: domainRecord
      };

    } catch (error) {
      console.error(`Error resolving user ${email}:`, error);
      const fallbackName = firebaseUser.displayName || (email ? email.split('@')[0].toUpperCase() : 'User');
      return {
        id: firebaseUser.uid,
        firebaseUser,
        role,
        domainId: firebaseUser.uid,
        email: email,
        name: fallbackName,
        profile: { id: firebaseUser.uid, name: fallbackName, email: email }
      };
    }
  }
};
