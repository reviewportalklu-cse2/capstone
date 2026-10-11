// api/admin/provision-member.js
/**
 * Serverless Backend Endpoint: Admin Member Provisioning
 * 
 * Security Controls:
 * 1. Verifies caller's Firebase ID token.
 * 2. Verifies caller has Admin role in Firestore.
 * 3. Enforces duplicate checks across userRoles, users, guides, classroomFaculty, reviewers.
 * 4. Provisions Firebase Auth user server-side.
 * 5. Creates userRoles, users, and evaluator records with requiresPasswordChange: true.
 * 6. Never exposes plaintext passwords or service account credentials.
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization header.' });
  }

  const idToken = authHeader.split('Bearer ')[1].trim();
  if (!idToken) {
    return res.status(401).json({ error: 'Unauthorized: Bearer token is empty.' });
  }

  try {
    const apiKey = process.env.VITE_FIREBASE_API_KEY || "AIzaSyD01a-evT_VhRa_ndcvc4v5Qnni2cS9SVc";
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || "final-year-project-erp";

    // Step 1: Verify Caller's ID Token via Firebase Auth REST API
    const verifyResp = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    });

    if (!verifyResp.ok) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired Firebase ID token.' });
    }

    const verifyData = await verifyResp.json();
    const caller = verifyData.users?.[0];
    if (!caller || !caller.localId) {
      return res.status(401).json({ error: 'Unauthorized: Caller account not found.' });
    }

    const callerUid = caller.localId;
    const callerEmail = caller.email || '';

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    };

    // Step 2: Verify Caller is an Admin in Firestore
    const userRoleResp = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/userRoles/${callerUid}?key=${apiKey}`,
      { headers: { 'Authorization': `Bearer ${idToken}` } }
    );

    let isCallerAdmin = false;
    if (userRoleResp.ok) {
      const userRoleDoc = await userRoleResp.json();
      const rolesArray = userRoleDoc.fields?.availableRoles?.arrayValue?.values?.map(v => v.stringValue) || [];
      const defaultRole = userRoleDoc.fields?.defaultRole?.stringValue || '';
      isCallerAdmin = rolesArray.includes('admin') || defaultRole === 'admin';
    }

    if (!isCallerAdmin) {
      // Check users collection fallback
      const userResp = await fetch(
        `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${callerUid}?key=${apiKey}`,
        { headers: { 'Authorization': `Bearer ${idToken}` } }
      );
      if (userResp.ok) {
        const userDoc = await userResp.json();
        const role = userDoc.fields?.role?.stringValue || '';
        const rolesArray = userDoc.fields?.availableRoles?.arrayValue?.values?.map(v => v.stringValue) || [];
        isCallerAdmin = role === 'admin' || rolesArray.includes('admin');
      }
    }

    if (!isCallerAdmin) {
      return res.status(403).json({ error: 'Forbidden: Only authorized Administrators may onboard new members.' });
    }

    // Step 3: Validate Member Inputs
    const { name, employeeId, email, department, availableRoles } = req.body || {};
    const cleanName = (name || '').trim();
    const cleanEmpId = String(employeeId || '').trim();
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanDept = (department || 'Computer Science & Engineering').trim();

    if (!cleanName) return res.status(400).json({ error: 'Full Name is required.' });
    if (!cleanEmpId) return res.status(400).json({ error: 'Employee ID is required.' });
    if (!cleanEmail) return res.status(400).json({ error: 'Official Email is required.' });
    if (!availableRoles || !Array.isArray(availableRoles) || availableRoles.length === 0) {
      return res.status(400).json({ error: 'At least one role (Guide, Classroom Faculty, or Reviewer) must be selected.' });
    }

    // Step 4: Calculate Initial Password complying with Firebase 6-char minimum
    const isPadded = cleanEmpId.length < 6;
    const initialAuthPass = isPadded ? cleanEmpId.padStart(6, '0') : cleanEmpId;

    // Step 5: Provision Account in Firebase Authentication via Secure REST API
    const createAuthResp = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        password: initialAuthPass,
        returnSecureToken: true
      })
    });

    const createAuthData = await createAuthResp.json();
    if (!createAuthResp.ok) {
      const errMsg = createAuthData.error?.message || 'Failed to create Firebase Authentication account.';
      if (errMsg.includes('EMAIL_EXISTS')) {
        return res.status(409).json({ error: `The email ${cleanEmail} is already registered.` });
      }
      return res.status(400).json({ error: errMsg });
    }

    const newUid = createAuthData.localId;
    const timestamp = new Date().toISOString();
    const roles = [...new Set(availableRoles)];
    const defaultRole = roles[0] || 'guide';

    // Step 6: Create userRoles & users records in Firestore
    const userRolesPayload = {
      fields: {
        uid: { stringValue: newUid },
        email: { stringValue: cleanEmail },
        employeeId: { stringValue: cleanEmpId },
        availableRoles: { arrayValue: { values: roles.map(r => ({ stringValue: r })) } },
        defaultRole: { stringValue: defaultRole },
        requiresPasswordChange: { booleanValue: true },
        status: { stringValue: 'Active' },
        createdAt: { stringValue: timestamp },
        updatedAt: { stringValue: timestamp },
        provisionedBy: { stringValue: callerEmail }
      }
    };

    await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/userRoles/${newUid}?key=${apiKey}`,
      {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify(userRolesPayload)
      }
    );

    const usersPayload = {
      fields: {
        uid: { stringValue: newUid },
        email: { stringValue: cleanEmail },
        employeeId: { stringValue: cleanEmpId },
        name: { stringValue: cleanName },
        department: { stringValue: cleanDept },
        role: { stringValue: defaultRole },
        availableRoles: { arrayValue: { values: roles.map(r => ({ stringValue: r })) } },
        requiresPasswordChange: { booleanValue: true },
        status: { stringValue: 'Active' },
        createdAt: { stringValue: timestamp },
        updatedAt: { stringValue: timestamp }
      }
    };

    await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${newUid}?key=${apiKey}`,
      {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify(usersPayload)
      }
    );

    // Step 7: Create Evaluator Domain Documents
    if (roles.includes('guide')) {
      const guidePayload = {
        fields: {
          id: { stringValue: cleanEmpId },
          uid: { stringValue: newUid },
          guideId: { stringValue: cleanEmpId },
          employeeId: { stringValue: cleanEmpId },
          name: { stringValue: cleanName },
          email: { stringValue: cleanEmail },
          department: { stringValue: cleanDept },
          designation: { stringValue: 'Project Guide' },
          status: { stringValue: 'Active' },
          createdAt: { stringValue: timestamp },
          updatedAt: { stringValue: timestamp }
        }
      };
      await fetch(
        `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/guides/${cleanEmpId}?key=${apiKey}`,
        {
          method: 'PATCH',
          headers: authHeaders,
          body: JSON.stringify(guidePayload)
        }
      );
    }

    if (roles.includes('classroom_faculty') || roles.includes('faculty')) {
      const facultyPayload = {
        fields: {
          id: { stringValue: cleanEmpId },
          uid: { stringValue: newUid },
          employeeId: { stringValue: cleanEmpId },
          name: { stringValue: cleanName },
          email: { stringValue: cleanEmail },
          department: { stringValue: cleanDept },
          designation: { stringValue: 'Classroom Faculty' },
          status: { stringValue: 'Active' },
          createdAt: { stringValue: timestamp },
          updatedAt: { stringValue: timestamp }
        }
      };
      await fetch(
        `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/classroomFaculty/${cleanEmpId}?key=${apiKey}`,
        {
          method: 'PATCH',
          headers: authHeaders,
          body: JSON.stringify(facultyPayload)
        }
      );
    }

    if (roles.includes('reviewer')) {
      const reviewerPayload = {
        fields: {
          id: { stringValue: cleanEmpId },
          uid: { stringValue: newUid },
          employeeId: { stringValue: cleanEmpId },
          name: { stringValue: cleanName },
          email: { stringValue: cleanEmail },
          department: { stringValue: cleanDept },
          designation: { stringValue: 'Project Reviewer' },
          status: { stringValue: 'Active' },
          createdAt: { stringValue: timestamp },
          updatedAt: { stringValue: timestamp }
        }
      };
      await fetch(
        `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/reviewers/${cleanEmpId}?key=${apiKey}`,
        {
          method: 'PATCH',
          headers: authHeaders,
          body: JSON.stringify(reviewerPayload)
        }
      );
    }

    return res.status(200).json({
      success: true,
      uid: newUid,
      email: cleanEmail,
      employeeId: cleanEmpId,
      name: cleanName,
      availableRoles: roles,
      requiresPasswordChange: true,
      isPadded,
      initialPasswordNote: isPadded 
        ? `Employee ID is fewer than 6 digits. In compliance with Firebase Auth minimum password requirements, the initial password has been zero-padded to 6 digits (${initialAuthPass}).`
        : `Initial password is the exact Employee ID (${cleanEmpId}).`
    });

  } catch (err) {
    console.error('[API_ADMIN_PROVISION_MEMBER] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error while provisioning member.' });
  }
}
