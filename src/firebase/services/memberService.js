import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { firebaseConfig, auth } from '../config.js';
import { FirestoreService } from './firestore.js';
import { auditService } from './auditService.js';

export const memberService = {
  /**
   * Verify whether the currently active caller possesses Administrator privileges
   */
  verifyCallerIsAdmin: async () => {
    const caller = auth.currentUser;
    if (!caller) {
      throw new Error("Unauthorized: You must be authenticated as an Administrator to perform this action.");
    }
    const [callerRoleDoc, callerUserDoc] = await Promise.all([
      FirestoreService.getById('userRoles', caller.uid),
      FirestoreService.getById('users', caller.uid)
    ]);
    const isCallerAdmin = 
      callerRoleDoc?.availableRoles?.includes('admin') ||
      callerRoleDoc?.defaultRole === 'admin' ||
      callerUserDoc?.role === 'admin' ||
      callerUserDoc?.availableRoles?.includes('admin');

    if (!isCallerAdmin) {
      throw new Error("Forbidden: You do not have Administrator permissions to manage evaluator members.");
    }
    return caller;
  },

  /**
   * Check if email or employee ID already exists across collections
   */
  checkDuplicate: async (email, employeeId) => {
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanEmpId = String(employeeId || '').trim();

    // 1. Check userRoles
    const allRoles = await FirestoreService.getAll('userRoles');
    const existingRoleByEmail = allRoles.find(r => (r.email && r.email.toLowerCase().trim() === cleanEmail));
    if (existingRoleByEmail) {
      throw new Error(`A member with email ${cleanEmail} already exists in the portal.`);
    }
    const existingRoleByEmpId = allRoles.find(r => (r.employeeId && String(r.employeeId).trim() === cleanEmpId));
    if (existingRoleByEmpId) {
      throw new Error(`A member with Employee ID ${cleanEmpId} already exists in the portal.`);
    }

    // 2. Check users
    const allUsers = await FirestoreService.getAll('users');
    const existingUserByEmail = allUsers.find(u => (u.email && u.email.toLowerCase().trim() === cleanEmail));
    if (existingUserByEmail) {
      throw new Error(`A user account with email ${cleanEmail} already exists.`);
    }
    const existingUserByEmpId = allUsers.find(u => (u.employeeId && String(u.employeeId).trim() === cleanEmpId));
    if (existingUserByEmpId) {
      throw new Error(`A member with Employee ID ${cleanEmpId} already exists.`);
    }

    // 3. Check guides
    const allGuides = await FirestoreService.getAll('guides');
    const existingGuideByEmail = allGuides.find(g => (g.email && g.email.toLowerCase().trim() === cleanEmail) || (g.Email && g.Email.toLowerCase().trim() === cleanEmail));
    if (existingGuideByEmail) {
      throw new Error(`A guide with email ${cleanEmail} already exists.`);
    }
    const existingGuideByEmpId = allGuides.find(g => String(g.employeeId || g['Employee ID'] || g.guideId || g.id || '').trim() === cleanEmpId);
    if (existingGuideByEmpId) {
      throw new Error(`A guide with Employee ID ${cleanEmpId} already exists.`);
    }

    // 4. Check classroomFaculty
    const allFaculty = await FirestoreService.getAll('classroomFaculty');
    const existingFacultyByEmail = allFaculty.find(f => (f.email && f.email.toLowerCase().trim() === cleanEmail) || (f.Email && f.Email.toLowerCase().trim() === cleanEmail));
    if (existingFacultyByEmail) {
      throw new Error(`A faculty member with email ${cleanEmail} already exists.`);
    }
    const existingFacultyByEmpId = allFaculty.find(f => String(f.employeeId || f['Employee ID'] || f.id || '').trim() === cleanEmpId);
    if (existingFacultyByEmpId) {
      throw new Error(`A faculty member with Employee ID ${cleanEmpId} already exists.`);
    }

    // 5. Check reviewers
    const allReviewers = await FirestoreService.getAll('reviewers');
    const existingReviewerByEmail = allReviewers.find(r => (r.email && r.email.toLowerCase().trim() === cleanEmail) || (r.Email && r.Email.toLowerCase().trim() === cleanEmail));
    if (existingReviewerByEmail) {
      throw new Error(`A reviewer with email ${cleanEmail} already exists.`);
    }
    const existingReviewerByEmpId = allReviewers.find(r => String(r.employeeId || r['Employee ID'] || r.id || '').trim() === cleanEmpId);
    if (existingReviewerByEmpId) {
      throw new Error(`A reviewer with Employee ID ${cleanEmpId} already exists.`);
    }

    return true;
  },

  /**
   * Provision a new faculty/evaluator member:
   * 1. Validate caller admin authorization
   * 2. Validate inputs and duplicate check
   * 3. Delegate to trusted backend API with caller ID token if available,
   *    or execute verified admin client provisioning with complete audit trail
   * 4. Enforce requiresPasswordChange: true
   * 5. Never store or expose plaintext password in Firestore
   */
  createMember: async ({ name, employeeId, email, department, availableRoles }) => {
    // Step 0: Verify Caller Administrator Privileges
    const caller = await memberService.verifyCallerIsAdmin();

    const cleanName = (name || '').trim();
    const cleanEmpId = String(employeeId || '').trim();
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanDept = (department || 'Computer Science & Engineering').trim();

    if (!cleanName) throw new Error('Full Name is required.');
    if (!cleanEmpId) throw new Error('Employee ID is required.');
    if (!cleanEmail) throw new Error('Official Email is required.');
    if (!availableRoles || availableRoles.length === 0) {
      throw new Error('At least one role (Guide, Classroom Faculty, or Reviewer) must be selected.');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      throw new Error('Please enter a valid email address.');
    }

    // Step 1: Duplicate check across all domain collections
    await memberService.checkDuplicate(cleanEmail, cleanEmpId);

    // Initial password rule:
    // Firebase Auth strictly requires at least 6 characters.
    // If employeeId < 6 characters (e.g. 1379), zero-pad to 6 characters.
    const isPadded = cleanEmpId.length < 6;
    const initialAuthPass = isPadded ? cleanEmpId.padStart(6, '0') : cleanEmpId;
    const initialPasswordNote = isPadded
      ? `Employee ID is fewer than 6 digits. Due to Firebase Authentication password policy, the initial password has been zero-padded to 6 digits (${initialAuthPass}).`
      : `Initial password is the exact Employee ID (${cleanEmpId}).`;

    // Step 2: Attempt Trusted Serverless Backend Endpoint with Caller's ID Token
    try {
      const idToken = await caller.getIdToken();
      const backendResp = await fetch('/api/admin/provision-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          name: cleanName,
          employeeId: cleanEmpId,
          email: cleanEmail,
          department: cleanDept,
          availableRoles
        })
      });

      if (backendResp.ok) {
        const backendResult = await backendResp.json();
        console.log('[MEMBER_PROVISION] Provisioned successfully via trusted backend function.');
        return backendResult;
      }
      // If 403 or 400 or 409, throw the actual server error
      if (backendResp.status === 403 || backendResp.status === 400 || backendResp.status === 409) {
        const errorData = await backendResp.json();
        throw new Error(errorData.error || 'Server rejected member provisioning.');
      }
    } catch (backendErr) {
      // If server returned a business/permission error, propagate it directly
      if (backendErr.message && !backendErr.message.includes('fetch') && !backendErr.message.includes('404')) {
        throw backendErr;
      }
      console.info('[MEMBER_PROVISION] Backend API route not reachable in current host environment, using verified admin client execution.');
    }

    // Fallback: Provision Firebase Auth user via dedicated secondary app instance
    const tempAppName = `member-provision-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = getAuth(tempApp);

    let uid = null;
    try {
      const cred = await createUserWithEmailAndPassword(tempAuth, cleanEmail, initialAuthPass);
      uid = cred.user.uid;
      await signOut(tempAuth);
    } catch (authErr) {
      console.error('[MEMBER_PROVISION] Firebase Auth creation failed:', authErr);
      if (authErr.code === 'auth/email-already-in-use') {
        throw new Error(`The email ${cleanEmail} is already registered in Firebase Authentication.`);
      }
      if (authErr.code === 'auth/invalid-email') {
        throw new Error(`The email address ${cleanEmail} is not valid.`);
      }
      throw new Error(authErr.message || 'Failed to create Firebase Authentication account.');
    } finally {
      try {
        await deleteApp(tempApp);
      } catch (e) {}
    }

    const timestamp = new Date().toISOString();
    const roles = [...new Set(availableRoles)];
    const defaultRole = roles[0] || 'guide';

    // Step 3: Create userRoles record
    await FirestoreService.set('userRoles', uid, {
      uid,
      email: cleanEmail,
      employeeId: cleanEmpId,
      availableRoles: roles,
      defaultRole,
      requiresPasswordChange: true,
      status: 'Active',
      createdAt: timestamp,
      updatedAt: timestamp
    });

    // Step 4: Create users record
    await FirestoreService.set('users', uid, {
      uid,
      email: cleanEmail,
      employeeId: cleanEmpId,
      name: cleanName,
      department: cleanDept,
      role: defaultRole,
      availableRoles: roles,
      requiresPasswordChange: true,
      status: 'Active',
      phone: '',
      createdAt: timestamp,
      updatedAt: timestamp
    });

    // Step 5: Sync to evaluator domain collections
    if (roles.includes('guide')) {
      await FirestoreService.set('guides', cleanEmpId, {
        id: cleanEmpId,
        uid,
        guideId: cleanEmpId,
        employeeId: cleanEmpId,
        'Employee ID': cleanEmpId,
        name: cleanName,
        email: cleanEmail,
        department: cleanDept,
        designation: 'Project Guide',
        assignedStudents: [],
        assignedTeams: [],
        status: 'Active',
        phone: '',
        createdAt: timestamp,
        updatedAt: timestamp
      });
    }

    if (roles.includes('classroom_faculty') || roles.includes('faculty')) {
      await FirestoreService.set('classroomFaculty', cleanEmpId, {
        id: cleanEmpId,
        uid,
        employeeId: cleanEmpId,
        'Employee ID': cleanEmpId,
        name: cleanName,
        email: cleanEmail,
        department: cleanDept,
        designation: 'Classroom Faculty',
        status: 'Active',
        phone: '',
        createdAt: timestamp,
        updatedAt: timestamp
      });
    }

    if (roles.includes('reviewer')) {
      await FirestoreService.set('reviewers', cleanEmpId, {
        id: cleanEmpId,
        uid,
        employeeId: cleanEmpId,
        'Employee ID': cleanEmpId,
        name: cleanName,
        email: cleanEmail,
        department: cleanDept,
        designation: 'Reviewer',
        status: 'Active',
        phone: '',
        createdAt: timestamp,
        updatedAt: timestamp
      });
    }

    // Step 6: Log audit
    try {
      await auditService.log(
        'admin',
        'MEMBER_PROVISIONED',
        'Member',
        null,
        {
          uid,
          email: cleanEmail,
          employeeId: cleanEmpId,
          name: cleanName,
          roles
        }
      );
    } catch (auditErr) {
      console.warn('[MEMBER_PROVISION] Audit log notice:', auditErr);
    }

    return {
      uid,
      name: cleanName,
      employeeId: cleanEmpId,
      email: cleanEmail,
      department: cleanDept,
      availableRoles: roles,
      requiresPasswordChange: true,
      isPadded,
      initialPasswordNote
    };
  },

  /**
   * Fetch all onboarded faculty/evaluator members
   */
  getAllMembers: async () => {
    const [allUsers, allRoles, allGuides, allFaculty, allReviewers] = await Promise.all([
      FirestoreService.getAll('users'),
      FirestoreService.getAll('userRoles'),
      FirestoreService.getAll('guides'),
      FirestoreService.getAll('classroomFaculty'),
      FirestoreService.getAll('reviewers')
    ]);

    const memberMap = new Map();

    // 1. Process userRoles
    allRoles.forEach(r => {
      // Exclude students and generic admins from members list
      const roles = r.availableRoles || [r.defaultRole || 'student'];
      const isEvaluator = roles.some(role => ['guide', 'classroom_faculty', 'faculty', 'reviewer'].includes(role));
      if (!isEvaluator) return;

      const key = (r.email || r.uid || '').toLowerCase().trim();
      if (!key) return;

      memberMap.set(key, {
        id: r.uid || r.id,
        uid: r.uid || r.id,
        email: r.email,
        employeeId: r.employeeId ? String(r.employeeId).trim() : '',
        availableRoles: roles,
        defaultRole: r.defaultRole || roles[0],
        requiresPasswordChange: r.requiresPasswordChange === true,
        status: r.status || 'Active',
        createdAt: r.createdAt || r.updatedAt,
        updatedAt: r.updatedAt
      });
    });

    // 2. Enhance with users collection data (name, department, phone)
    allUsers.forEach(u => {
      const emailKey = (u.email || '').toLowerCase().trim();
      const existing = memberMap.get(emailKey) || (u.uid ? memberMap.get(u.uid.toLowerCase()) : null);

      const roles = u.availableRoles || (u.role ? [u.role] : []);
      const isEvaluator = roles.some(role => ['guide', 'classroom_faculty', 'faculty', 'reviewer'].includes(role));

      if (existing) {
        existing.name = existing.name || u.name;
        existing.department = existing.department || u.department;
        existing.phone = existing.phone || u.phone;
        existing.employeeId = existing.employeeId || (u.employeeId ? String(u.employeeId).trim() : '');
        if (u.requiresPasswordChange !== undefined) {
          existing.requiresPasswordChange = existing.requiresPasswordChange || u.requiresPasswordChange === true;
        }
      } else if (isEvaluator && emailKey) {
        memberMap.set(emailKey, {
          id: u.uid || u.id,
          uid: u.uid || u.id,
          email: u.email,
          name: u.name,
          employeeId: u.employeeId ? String(u.employeeId).trim() : '',
          department: u.department || 'Computer Science & Engineering',
          availableRoles: roles,
          defaultRole: u.role || roles[0],
          requiresPasswordChange: u.requiresPasswordChange === true,
          status: u.status || 'Active',
          phone: u.phone || '',
          createdAt: u.createdAt,
          updatedAt: u.updatedAt
        });
      }
    });

    // 3. Enhance with guides collection
    allGuides.forEach(g => {
      const emailKey = String(g.email || g.Email || '').toLowerCase().trim();
      if (!emailKey) return;
      const existing = memberMap.get(emailKey);
      const empId = g.employeeId || g['Employee ID'] || g.guideId || g.id;
      if (existing) {
        existing.name = existing.name || g.name || g.Name;
        existing.department = existing.department || g.department || g.Department;
        existing.employeeId = existing.employeeId || (empId ? String(empId).trim() : '');
        if (!existing.availableRoles.includes('guide')) existing.availableRoles.push('guide');
      } else {
        memberMap.set(emailKey, {
          id: g.uid || g.id,
          uid: g.uid || g.id,
          email: emailKey,
          name: g.name || g.Name,
          employeeId: empId ? String(empId).trim() : '',
          department: g.department || g.Department || 'Computer Science & Engineering',
          availableRoles: ['guide'],
          defaultRole: 'guide',
          requiresPasswordChange: false,
          status: g.status || 'Active',
          phone: g.phone || '',
          createdAt: g.createdAt,
          updatedAt: g.updatedAt
        });
      }
    });

    // 4. Enhance with classroomFaculty
    allFaculty.forEach(f => {
      const emailKey = String(f.email || f.Email || '').toLowerCase().trim();
      if (!emailKey) return;
      const existing = memberMap.get(emailKey);
      const empId = f.employeeId || f['Employee ID'] || f.id;
      if (existing) {
        existing.name = existing.name || f.name || f.Name;
        existing.department = existing.department || f.department || f.Department;
        existing.employeeId = existing.employeeId || (empId ? String(empId).trim() : '');
        if (!existing.availableRoles.includes('classroom_faculty') && !existing.availableRoles.includes('faculty')) {
          existing.availableRoles.push('classroom_faculty');
        }
      }
    });

    // 5. Enhance with reviewers
    allReviewers.forEach(r => {
      const emailKey = String(r.email || r.Email || '').toLowerCase().trim();
      if (!emailKey) return;
      const existing = memberMap.get(emailKey);
      const empId = r.employeeId || r['Employee ID'] || r.id;
      if (existing) {
        existing.name = existing.name || r.name || r.Name;
        existing.department = existing.department || r.department || r.Department;
        existing.employeeId = existing.employeeId || (empId ? String(empId).trim() : '');
        if (!existing.availableRoles.includes('reviewer')) {
          existing.availableRoles.push('reviewer');
        }
      }
    });

    const members = Array.from(memberMap.values()).map(m => ({
      ...m,
      name: m.name || m.email.split('@')[0],
      department: m.department || 'Computer Science & Engineering',
      availableRoles: [...new Set(m.availableRoles || ['guide'])]
    }));

    return members.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  },

  /**
   * Update member details safely
   */
  updateMember: async (uid, { name, department, availableRoles, status }) => {
    // Enforce Admin authorization
    await memberService.verifyCallerIsAdmin();
    if (!uid) throw new Error('Member ID is required.');
    const timestamp = new Date().toISOString();
    const updatePayload = {
      updatedAt: timestamp
    };
    if (name) updatePayload.name = name.trim();
    if (department) updatePayload.department = department.trim();
    if (status) updatePayload.status = status;
    if (availableRoles && availableRoles.length > 0) {
      updatePayload.availableRoles = [...new Set(availableRoles)];
      updatePayload.role = availableRoles[0];
      updatePayload.defaultRole = availableRoles[0];
    }

    // Update users & userRoles
    await FirestoreService.set('users', uid, updatePayload, { merge: true });
    await FirestoreService.set('userRoles', uid, updatePayload, { merge: true });

    // Find and update across guides, classroomFaculty, reviewers by uid or email
    const userDoc = await FirestoreService.getById('users', uid);
    const empId = userDoc?.employeeId;
    const cleanEmail = userDoc?.email;
    const memberName = updatePayload.name || userDoc?.name || '';
    const memberDept = updatePayload.department || userDoc?.department || 'Computer Science & Engineering';

    if (empId) {
      const cleanEmpId = String(empId).trim();
      const roleUpdate = {
        name: memberName,
        department: memberDept,
        status: updatePayload.status || 'Active',
        updatedAt: timestamp
      };

      if (availableRoles) {
        if (availableRoles.includes('guide')) {
          try {
            await FirestoreService.set('guides', cleanEmpId, {
              id: cleanEmpId,
              uid,
              guideId: cleanEmpId,
              employeeId: cleanEmpId,
              'Employee ID': cleanEmpId,
              email: cleanEmail,
              designation: 'Project Guide',
              ...roleUpdate
            }, { merge: true });
          } catch (e) {
            console.warn('[MEMBER_UPDATE] Failed to update guide doc:', e);
          }
        }
        if (availableRoles.includes('classroom_faculty') || availableRoles.includes('faculty')) {
          try {
            await FirestoreService.set('classroomFaculty', cleanEmpId, {
              id: cleanEmpId,
              uid,
              employeeId: cleanEmpId,
              'Employee ID': cleanEmpId,
              email: cleanEmail,
              designation: 'Classroom Faculty',
              ...roleUpdate
            }, { merge: true });
          } catch (e) {
            console.warn('[MEMBER_UPDATE] Failed to update classroomFaculty doc:', e);
          }
        }
        if (availableRoles.includes('reviewer')) {
          try {
            await FirestoreService.set('reviewers', cleanEmpId, {
              id: cleanEmpId,
              uid,
              employeeId: cleanEmpId,
              'Employee ID': cleanEmpId,
              email: cleanEmail,
              designation: 'Reviewer',
              ...roleUpdate
            }, { merge: true });
          } catch (e) {
            console.warn('[MEMBER_UPDATE] Failed to update reviewer doc:', e);
          }
        }
      } else {
        try { await FirestoreService.set('guides', cleanEmpId, roleUpdate, { merge: true }); } catch (e) {}
        try { await FirestoreService.set('classroomFaculty', cleanEmpId, roleUpdate, { merge: true }); } catch (e) {}
        try { await FirestoreService.set('reviewers', cleanEmpId, roleUpdate, { merge: true }); } catch (e) {}
      }
    }

    return true;
  }
};
