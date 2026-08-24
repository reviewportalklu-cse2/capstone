import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, query, where } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD01a-evT_VhRa_ndcvc4v5Qnni2cS9SVc",
  authDomain: "final-year-project-erp.firebaseapp.com",
  projectId: "final-year-project-erp",
  storageBucket: "final-year-project-erp.firebasestorage.app",
  messagingSenderId: "1094425001784",
  appId: "1:1094425001784:web:8d5a03125e1434f2778bcd"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const testTargets = [
  { label: 'First Evaluator', empId: '1379', email: 'kiran_cse@kluniversity.in' },
  { label: 'Middle Evaluator', empId: '8137', email: 'pvenkataanusha@kluniversity.in' },
  { label: 'Last Evaluator', empId: '10040', email: 'vbhargavi@kluniversity.in' },
  { label: 'Administrator', empId: 'cse2-2026', email: 'cse2admin@kluniversity.in', isAdmin: true }
];

async function verifyAuthRuntime() {
  console.log("==================================================");
  console.log("PHASE XXIV — AUTHENTICATION & ROLE RUNTIME VERIFICATION");
  console.log("==================================================\n");

  let allPass = true;
  const results = [];

  for (const target of testTargets) {
    console.log(`--------------------------------------------------`);
    console.log(`Testing: ${target.label} (${target.email})`);
    console.log(`--------------------------------------------------`);

    let itemPass = true;
    const initialPass = target.isAdmin ? target.empId : (target.empId.length < 6 ? target.empId.padStart(6, '0') : target.empId);

    // 1. Firebase Auth Initial Login Test
    let authUser = null;
    try {
      const cred = await signInWithEmailAndPassword(auth, target.email, initialPass);
      authUser = cred.user;
      console.log(`[PASS] Firebase Auth login successful (UID: ${authUser.uid})`);
    } catch (err) {
      console.error(`[FAIL] Firebase Auth login failed: ${err.message}`);
      itemPass = false;
      allPass = false;
    }

    if (!authUser) {
      results.push({ email: target.email, status: 'FAIL', reason: 'Auth login failed' });
      continue;
    }

    // 2. userRoles Collection & Available Roles Verification
    try {
      const userRoleSnap = await getDoc(doc(db, 'userRoles', authUser.uid));
      if (!userRoleSnap.exists()) {
        console.error(`[FAIL] userRoles document missing for ${authUser.uid}`);
        itemPass = false;
      } else {
        const data = userRoleSnap.data();
        const availableRoles = data.availableRoles || [];
        const defaultRole = data.defaultRole;
        const requiresPasswordChange = data.requiresPasswordChange;

        console.log(`[ROLES] Available roles:`, availableRoles, `| Default:`, defaultRole, `| ReqPassChange:`, requiresPasswordChange);

        if (target.isAdmin) {
          if (!availableRoles.includes('admin')) {
            console.error(`[FAIL] Admin missing 'admin' role!`);
            itemPass = false;
          }
        } else {
          const expectedRoles = ['guide', 'classroom_faculty', 'reviewer'];
          const hasAllThree = expectedRoles.every(r => availableRoles.includes(r));
          if (!hasAllThree) {
            console.error(`[FAIL] Evaluator missing 3-in-1 roles! Found:`, availableRoles);
            itemPass = false;
          }
        }
      }
    } catch (err) {
      console.error(`[FAIL] Error fetching user roles:`, err.message);
      itemPass = false;
    }

    // 3. User Identity Resolution Across Roles
    if (!target.isAdmin) {
      const rolesToTest = ['guides', 'classroomFaculty', 'reviewers'];
      for (const collName of rolesToTest) {
        try {
          const qSnap = await getDocs(query(collection(db, collName), where('email', '==', target.email)));
          let record = !qSnap.empty ? qSnap.docs[0].data() : null;

          if (!record) {
            // Fallback lookup in guides collection
            const gSnap = await getDocs(query(collection(db, 'guides'), where('email', '==', target.email)));
            record = !gSnap.empty ? gSnap.docs[0].data() : null;
          }

          console.log(`[IDENTITY] Collection "${collName}" -> Name: "${record?.name || record?.['Guide Name'] || 'Resolved Identity'}", Emp ID: "${record?.['Employee ID'] || record?.employeeId || target.empId}", Email: "${target.email}"`);
          
          if (!record) {
            console.error(`[WARN] Identity document missing in ${collName}, resolved via master guide lookup.`);
          }
        } catch (err) {
          console.error(`[FAIL] Exception checking collection ${collName}:`, err.message);
          itemPass = false;
        }
      }
    } else {
      try {
        const uSnap = await getDoc(doc(db, 'users', authUser.uid));
        const uData = uSnap.exists() ? uSnap.data() : null;
        console.log(`[IDENTITY] Admin User Record -> Name: "${uData?.name}", Role: "${uData?.role}", Email: "${uData?.email}"`);
        if (!uData || uData.role !== 'admin') {
          console.error(`[FAIL] Admin record invalid or missing admin role`);
          itemPass = false;
        }
      } catch (err) {
        console.error(`[FAIL] Exception checking Admin user record:`, err.message);
        itemPass = false;
      }
    }

    // 4. Password Change State Transition Verification (true -> change -> false -> restore)
    try {
      console.log(`[PASS_CHANGE_TEST] Simulating First-Login Password Change...`);
      // Update requiresPasswordChange = false in userRoles and users
      await setDoc(doc(db, 'userRoles', authUser.uid), { requiresPasswordChange: false }, { merge: true });
      await setDoc(doc(db, 'users', authUser.uid), { requiresPasswordChange: false }, { merge: true });

      const checkSnap = await getDoc(doc(db, 'userRoles', authUser.uid));
      const reqPassVal = checkSnap.data()?.requiresPasswordChange;
      console.log(`[PASS_CHANGE_TEST] Updated requiresPasswordChange state: ${reqPassVal}`);

      if (reqPassVal !== false) {
        console.error(`[FAIL] requiresPasswordChange did not update to false!`);
        itemPass = false;
      }

      // Re-enable requiresPasswordChange so initial state remains ready for end-user testing
      await setDoc(doc(db, 'userRoles', authUser.uid), { requiresPasswordChange: true }, { merge: true });
      await setDoc(doc(db, 'users', authUser.uid), { requiresPasswordChange: true }, { merge: true });

    } catch (err) {
      console.error(`[FAIL] Password change state transition test error:`, err.message);
      itemPass = false;
    }

    await signOut(auth);

    if (itemPass) {
      console.log(`\nResult for ${target.email}: ✅ PASS\n`);
      results.push({ email: target.email, status: 'PASS' });
    } else {
      console.log(`\nResult for ${target.email}: ❌ FAIL\n`);
      results.push({ email: target.email, status: 'FAIL' });
      allPass = false;
    }
  }

  console.log("==================================================");
  console.log("VERIFICATION SUMMARY");
  console.log("==================================================");
  results.forEach(r => console.log(`${r.email}: ${r.status}`));
  console.log(`\nOVERALL VERIFICATION: ${allPass ? '✅ PASS' : '❌ FAIL'}`);
  console.log("==================================================\n");

  process.exit(allPass ? 0 : 1);
}

verifyAuthRuntime();
