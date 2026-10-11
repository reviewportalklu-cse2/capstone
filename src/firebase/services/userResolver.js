import { FirestoreService } from './firestore.js';
import { getEntityKeys } from '../../utils/relationshipResolver.js';

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

      // 4. Fetch userDoc & userRoleDoc early to guide employeeId resolution
      let userRoleDoc = null;
      let userDoc = null;
      if (firebaseUser.uid) {
        try {
          userRoleDoc = await FirestoreService.getById('userRoles', firebaseUser.uid);
          userDoc = await FirestoreService.getById('users', firebaseUser.uid);
        } catch (e) {
          // Non-blocking fetch
        }
      }
      if (!userDoc && email) {
        try {
          const userMatches = await FirestoreService.query('users', [{ field: 'email', operator: '==', value: email.toLowerCase() }]);
          if (userMatches.length > 0) userDoc = userMatches[0];
        } catch (e) {}
      }

      // 5. If not found in primary collection by email/uid, check by employeeId if known
      const knownEmpId = userDoc?.employeeId || userRoleDoc?.employeeId;
      if (domainRecords.length === 0 && knownEmpId) {
        const empStr = String(knownEmpId).trim();
        const docById = await FirestoreService.getById(collectionName, empStr);
        if (docById) {
          domainRecords = [docById];
        } else {
          const empMatches = await FirestoreService.query(collectionName, [
            { field: 'employeeId', operator: '==', value: empStr }
          ]);
          if (empMatches.length > 0) domainRecords = empMatches;
        }
      }

      // 6. Fallback search across evaluator collections: STRICTLY match user's actual email or UID
      if (domainRecords.length === 0) {
        const collectionsToTry = [collectionName, 'guides', 'classroomFaculty', 'reviewers', 'users'].filter((c, idx, arr) => arr.indexOf(c) === idx);
        for (const targetColl of collectionsToTry) {
          const allRecords = await FirestoreService.getAll(targetColl);
          const emailLower = email ? email.toLowerCase().trim() : '';

          const match = allRecords.find(r => {
            const rEmail = String(r.email || r.Email || '').toLowerCase().trim();
            if (rEmail && rEmail === emailLower) return true;
            if (firebaseUser.uid && (r.id === firebaseUser.uid || r.uid === firebaseUser.uid)) return true;
            if (knownEmpId && (String(r.employeeId || r['Employee ID'] || r.id || '') === String(knownEmpId))) return true;
            return false;
          });
          if (match) {
            domainRecords = [match];
            break;
          }
        }
      }

      let domainRecord = domainRecords[0];

      // 7. Safe Fallback to userDoc or basic authenticated identity if no specific domain record
      if (!domainRecord) {
        const fallbackName = userDoc?.name || firebaseUser.displayName || (email ? email.split('@')[0].toUpperCase() : 'User');
        domainRecord = userDoc || {
          id: firebaseUser.uid,
          name: fallbackName,
          email: email,
          department: userDoc?.department || 'Computer Science & Engineering'
        };
      }

      // Resolve employee ID safely as string
      const rawEmployeeId = domainRecord?.['Employee ID'] ?? domainRecord?.employeeId ?? userRoleDoc?.employeeId ?? userDoc?.employeeId;
      const employeeId = rawEmployeeId != null && String(rawEmployeeId).trim() !== '' ? String(rawEmployeeId).trim() : null;

      const phone = domainRecord?.phone || domainRecord?.Phone || domainRecord?.['Phone Number'] || userDoc?.phone || '';
      const department = domainRecord?.department || domainRecord?.Department || userDoc?.department || 'Computer Science & Engineering';
      const designation = domainRecord?.designation || domainRecord?.Designation || (role === 'guide' ? 'Project Guide' : (role === 'reviewer' ? 'Reviewer' : 'Faculty'));
      const availableRoles = userRoleDoc?.availableRoles || userDoc?.availableRoles || [role];

      // Standardize the returned domain user
      return {
        id: domainRecord.id || firebaseUser.uid,
        firebaseUser,
        role,
        domainId: domainRecord.id || firebaseUser.uid,
        email: domainRecord.email || domainRecord.Email || email,
        employeeId,
        rollNumber: domainRecord['Roll Number'] || domainRecord.rollNumber || null,
        name: domainRecord.name || domainRecord['Student Name'] || domainRecord['Guide Name'] || domainRecord['Faculty Name'] || domainRecord['Reviewer Name'] || domainRecord.Name || userDoc?.name || firebaseUser.displayName || email.split('@')[0].toUpperCase(),
        department,
        designation,
        phone,
        availableRoles,
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
