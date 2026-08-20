import { FirestoreService } from './firestore';
import { getEntityKeys } from '@/utils/relationshipResolver';

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
    if (!uid) return { availableRoles: ['student'], defaultRole: 'student' };

    try {
      const userRoleDoc = await FirestoreService.getById(COLLECTION_NAME, uid);

      if (userRoleDoc && userRoleDoc.availableRoles && userRoleDoc.availableRoles.length > 0) {
        return {
          availableRoles: userRoleDoc.availableRoles,
          defaultRole: userRoleDoc.defaultRole || userRoleDoc.availableRoles[0]
        };
      }

      // Auto-discover roles if doc missing or empty
      const discoveredRoles = await userRoleService.discoverRoles(email);
      const defaultRole = userRoleService.getDefaultRole(discoveredRoles);

      // Persist to userRoles collection asynchronously
      await userRoleService.syncUserRoles(uid, email, discoveredRoles, defaultRole);

      return {
        availableRoles: discoveredRoles,
        defaultRole
      };
    } catch (err) {
      console.error(`Error in getUserRoles for ${uid}:`, err);
      return { availableRoles: ['student'], defaultRole: 'student' };
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
      await FirestoreService.set(COLLECTION_NAME, uid, payload);
    } catch (err) {
      console.error(`Error syncing userRoles for ${uid}:`, err);
    }
  }
};
