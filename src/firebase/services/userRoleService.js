import { FirestoreService } from './firestore.js';
import { getEntityKeys } from '../../utils/relationshipResolver.js';

const COLLECTION_NAME = 'userRoles';

const ROLE_PRIORITY = ['admin', 'guide', 'classroom_faculty', 'reviewer', 'student'];

export const userRoleService = {
  /**
   * Auto-discover user roles by matching email across domain collections
   */
  discoverRoles: async (email) => {
    if (!email) return ['student'];
    const emailLower = email.toLowerCase();
    const emailPrefix = emailLower.includes('@') ? emailLower.split('@')[0] : emailLower;
    const searchKeys = [emailLower, emailPrefix].flatMap(k => getEntityKeys(k));
    const discovered = new Set();

    const collectionsToCheck = [
      { collection: 'users', role: 'admin', checkAdminRole: true },
      { collection: 'guides', role: 'guide' },
      { collection: 'classroomFaculty', role: 'classroom_faculty' },
      { collection: 'reviewers', role: 'reviewer' },
      { collection: 'students', role: 'student' }
    ];

    await Promise.all(
      collectionsToCheck.map(async ({ collection, role, checkAdminRole }) => {
        try {
          // Query by lowercase 'email'
          let records = await FirestoreService.query(collection, [
            { field: 'email', operator: '==', value: emailLower }
          ]);

          // Fallback query by 'Email'
          if (records.length === 0) {
            records = await FirestoreService.query(collection, [
              { field: 'Email', operator: '==', value: emailLower }
            ]);
          }

          // Fallback search across all records in collection using normalized keys & username prefix
          if (records.length === 0) {
            const all = await FirestoreService.getAll(collection);
            records = all.filter(r => {
              const rEmail = String(r.email || r.Email || '').toLowerCase();
              const rPrefix = rEmail.includes('@') ? rEmail.split('@')[0] : '';
              if (rEmail && rEmail === emailLower) return true;
              if (rPrefix && emailPrefix) {
                if (rPrefix === emailPrefix) return true;
                if (rPrefix.replace(/0+/g, '') === emailPrefix.replace(/0+/g, '')) return true;
              }
              const rKeys = getEntityKeys(r);
              return searchKeys.some(k => rKeys.includes(k));
            });
          }

          if (records.length > 0) {
            if (checkAdminRole) {
              const isAdmin = records.some(r => r.role === 'admin');
              if (isAdmin) discovered.add('admin');
            } else {
              discovered.add(role);
            }
          }
        } catch (err) {
          console.warn(`Role discovery check failed for ${collection}:`, err);
        }
      })
    );

    const rolesArray = Array.from(discovered);
    if (rolesArray.some(r => ['guide', 'classroom_faculty', 'reviewer'].includes(r))) {
      if (!rolesArray.includes('guide')) rolesArray.push('guide');
      if (!rolesArray.includes('classroom_faculty')) rolesArray.push('classroom_faculty');
      if (!rolesArray.includes('reviewer')) rolesArray.push('reviewer');
    }
    if (rolesArray.length === 0) {
      rolesArray.push('student');
    }

    // Sort by priority order
    rolesArray.sort((a, b) => ROLE_PRIORITY.indexOf(a) - ROLE_PRIORITY.indexOf(b));

    return rolesArray;
  },

  /**
   * Fetch user roles from userRoles collection or auto-discover
   */
  getUserRoles: async (uid, email) => {
    if (!uid) return { availableRoles: ['student'], defaultRole: 'student', requiresPasswordChange: false };

    try {
      const [userRoleDoc, userDoc] = await Promise.all([
        FirestoreService.getById(COLLECTION_NAME, uid),
        FirestoreService.getById('users', uid)
      ]);

      let availableRoles = [...(userRoleDoc?.availableRoles || [])];

      // Merge with users document
      if (userDoc?.role && !availableRoles.includes(userDoc.role)) {
        availableRoles.push(userDoc.role);
      }
      if (userDoc?.availableRoles && Array.isArray(userDoc.availableRoles)) {
        userDoc.availableRoles.forEach(r => {
          if (!availableRoles.includes(r)) availableRoles.push(r);
        });
      }

      // If user has staff/evaluator/admin roles, strip accidental 'student' entry
      const hasStaffRole = availableRoles.some(r => ['admin', 'guide', 'classroom_faculty', 'faculty', 'reviewer'].includes(r));
      if (hasStaffRole && availableRoles.length > 1) {
        availableRoles = availableRoles.filter(r => r !== 'student');
      }

      // Auto-discover if empty or solely student
      if (availableRoles.length === 0 || (!hasStaffRole && availableRoles.includes('student'))) {
        const discoveredRoles = await userRoleService.discoverRoles(email);
        if (discoveredRoles.length > 0) {
          discoveredRoles.forEach(r => {
            if (!availableRoles.includes(r)) availableRoles.push(r);
          });
          if (availableRoles.some(r => ['admin', 'guide', 'classroom_faculty', 'faculty', 'reviewer'].includes(r))) {
            availableRoles = availableRoles.filter(r => r !== 'student');
          }
        }
      }

      if (availableRoles.length === 0) {
        availableRoles = ['student'];
      }

      // Determine defaultRole using priority order
      const defaultRole = userRoleService.getDefaultRole(availableRoles);
      const reqPass = userRoleDoc?.requiresPasswordChange === true || userDoc?.requiresPasswordChange === true;

      // Sync back to userRoles in Firestore if it was missing or out of sync
      const needsSync = !userRoleDoc || 
        JSON.stringify(userRoleDoc.availableRoles?.slice().sort()) !== JSON.stringify(availableRoles.slice().sort()) ||
        userRoleDoc.defaultRole !== defaultRole;

      if (needsSync) {
        try {
          await userRoleService.syncUserRoles(uid, email, availableRoles, defaultRole);
        } catch (syncErr) {
          console.warn("[USER_ROLE_SERVICE] Background sync notice:", syncErr);
        }
      }

      return {
        availableRoles,
        defaultRole,
        requiresPasswordChange: reqPass
      };
    } catch (err) {
      console.error(`Error in getUserRoles for ${uid}:`, err);
      return { availableRoles: ['student'], defaultRole: 'student', requiresPasswordChange: false };
    }
  },

  /**
   * Validate if a given role is inside the user's available roles
   */
  validateRoleAccess: (role, availableRoles = []) => {
    if (!role) return false;
    return availableRoles.includes(role);
  },

  /**
   * Get default role based on priority
   */
  getDefaultRole: (availableRoles = []) => {
    if (availableRoles.length === 0) return 'student';
    for (const priorityRole of ROLE_PRIORITY) {
      if (availableRoles.includes(priorityRole)) return priorityRole;
    }
    return availableRoles[0];
  },

  /**
   * Sync/Create the userRoles Firestore document
   */
  syncUserRoles: async (uid, email, availableRoles, defaultRole) => {
    if (!uid) return;
    try {
      const payload = {
        uid,
        email: email ? email.toLowerCase() : '',
        availableRoles,
        defaultRole: defaultRole || availableRoles[0] || 'student',
        updatedAt: new Date().toISOString()
      };
      await FirestoreService.set(COLLECTION_NAME, uid, payload, { merge: true });
    } catch (err) {
      console.error(`Error syncing userRoles for ${uid}:`, err);
    }
  }
};
