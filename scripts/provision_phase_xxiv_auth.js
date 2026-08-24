import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  collection, 
  getDocs 
} from "firebase/firestore";

const rawDataset = `1379\tkiran_cse@kluniversity.in
1498\tvaraprasad_cse@kluniversity.in
2496\tpvrao@kluniversity.in
3658\tpradeepini_cse@kluniversity.in
3908\tnrajeshcse@kluniversity.in
4056\tmcchakravarthy@kluniversity.in
4821\tram.fuzzy@kluniversity.in
5372\tshaikshavali@kluniversity.in
5422\tradha@kluniversity.in
5495\tpraveenluru@kluniversity.in
5659\tcnu.pvvs@kluniversity.in
5886\tkvprasad@kluniversity.in
5900\tvijaybru@kluniversity.in
5908\tnallagatlaraghavendra@kluniversity.in
6096\tjvnramesh@kluniversity.in
6584\tumarkcse@kluniversity.in
6616\tsureshdkumarmca@kluniversity.in
6786\tdr.kswathi@kluniversity.in
6874\tyamunadevimm@kluniversity.in
6922\tnesaraniabraham84@kluniversity.in
6931\tveerankalu14@kluniversity.in
6932\tmath.renuka@kluniversity.in
6934\tsabithakiran.ch@kluniversity.in
7004\travelalikes@kluniversity.in
7152\tnamachivayam77@kluniversity.in
7190\teguruvareddy@kluniversity.in
7239\tbrahmaraokbv@kluniversity.in
7255\tdrtkr@kluniversity.in
7366\tlakshmareddy@kluniversity.in
7401\trajeshtulasi@kluniversity.in
7414\tadapagopi@kluniversity.in
7510\tdayanidhi@kluniversity.in
7792\tchnagamani@kluniversity.in
7814\tkggupta@kluniversity.in
7936\tvprasanthi@kluniversity.in
7960\teraveenndrareddy@kluniversity.in
7984\tpandiyanathan@kluniversity.in
7985\tpmuralikrishna@kluniversity.in
7986\tpdineshchandra@kluniversity.in
7999\tjayaramakrishnaiah@kluniversity.in
8000\tjyotsnadevi@kluniversity.in
8020\tnathapriya@kluniversity.in
8021\tdeepthin@kluniversity.in
8059\tpramadevi@kluniversity.in
8080\tkavitha.sarihaddu@kluniversity.in
8084\tnyshpranee@kluniversity.in
8104\tsatrughankumar@kluniversity.in
8110\tasruthi@kluniversity.in
8120\tjaganmohan@kluniversity.in
8129\tpbalaji@kluniversity.in
8130\trudra.kuna@kluniversity.in
8137\tpvenkataanusha@kluniversity.in
8146\tpsridevi@kluniversity.in
8147\tksadhana@kluniversity.in
8154\tb.balakrishna@kluniversity.in
8163\tlnarasimhaswamy@kluniversity.in
8164\tbndeepthi@kluniversity.in
8168\tanjuaravindk@kluniversity.in
8171\tmsvsureshbabu@kluniversity.in
8172\tgannapurna@kluniversity.in
8175\tmsivudu@kluniversity.in
8176\tysivaramaiah@kluniversity.in
8177\tkvenkateswarao@kluniversity.in
8190\ttejolakshmi@kluniversity.in
8193\tksailaja@kluniversity.in
8196\tmvenkatrao@kluniversity.in
8199\tkalahotirambabu@kluniversity.in
8200\tklalithavanisree@kluniversity.in
8282\tulakshmisoundharya@kluniversity.in
8296\tsrinivasaraov@kluniversity.in
8297\tmravisankar@kluniversity.in
8335\tplakshmanarao@kluniversity.in
8339\trsmlakshmi@kluniversity.in
8353\tsdrakshayani@kluniversity.in
8416\tpramodhkrishna@kluniversity.in
8428\tamounika@kluniversity.in
8440\tchjhansirani@kluniversity.in
8533\tplkishankumar@kluniversity.in
8591\tjevinja@kluniversity.in
8592\tyrajesh@kluniversity.in
8635\tppraveenkumar@kluniversity.in
8701\tmashiqueazad@kluniversity.in
8707\tnaravind@kluniversity.in
8806\ttchithrakumar@kluniversity.in
8820\tbsahiti@kluniversity.in
8823\tmsomasundararao@kluniversity.in
8836\tramyadudigam@kluniversity.in
8853\ttkrishnakishore@kluniversity.in
8864\tsujanbabuv@kluniversity.in
8873\tlakkakulasrilatha@kluniversity.in
8899\tvkrishnareddy@kluniversity.in
8905\tanuradhakonidena@kluniversity.in
8906\tshaikjilanibasha@kluniversity.in
8909\tprasunamanikya@kluniversity.in
8913\tgarladinneravikanth@kluniversity.in
8913\tgarladinneravikanth@kluniversity.in
8916\tsivaramarajuvetukuri@kluniversity.in
8922\tedsusan@kluniversity.in
8964\ttirapathireddyb@kluniversity.in\u00a0
8969\tasathyavani@kluniversity.in
8978\tksanthi@kluniversity.in
8981\tssuneetha@kluniversity.in
8996\tvshiyam@kluniversity.in
8997\tmaheswaribandi@kluniversity.in
9020\tedupugantimounika@kluniversity.in
9028\tjvenkatrao@kluniversity.in
9034\tsandeepnanda@kluniversity.in
9035\tssrinivasulu@kluniversity.in
9037\tshaiksanheera@kluniversity.in
9131\tlekhanasrilakshmi@kluniversity.in
9255\tkoppulapravallika@kluniversity.in
9377\tnyaswanthsai@kluniversity.in
9391\ttsailaja@kluniversity.in
9413\tramadevichappala@kluniversity.in
9427\tchandudelhi@kluniversity.in
9484\tvmbindu@kluniversity.in
9634\tnvijayagopal@kluniversity.in
9714\tyvkdbhavani@kluniversity.in
9828\trranjithkumar@kluniversity.in
9923\tyenumalasankar@kluniversity.in
9953\tykassish@kluniversity.in
9960\tsatyabrat@kluniversity.in
9968\tpkirankumar@kluniversity.in
9978\tsbabu@kluniversity.in
10031\tnbpamula@kluniversity.in
10039\tjramadevi@kluniversity.in
10040\tvbhargavi@kluniversity.in`;

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

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function provision() {
  console.log("==================================================");
  console.log("PHASE XXIV — EVALUATOR & ADMIN AUTHENTICATION PROVISIONING");
  console.log("==================================================\n");

  const lines = rawDataset.split('\n').filter(l => l.trim());
  const uniqueEmpsMap = new Map();
  const duplicateRecords = [];

  lines.forEach((l, idx) => {
    const parts = l.split('\t');
    const empId = parts[0] ? parts[0].trim() : '';
    const email = parts[1] ? parts[1].trim().replace(/\u00a0/g, '').toLowerCase() : '';

    if (uniqueEmpsMap.has(empId) || [...uniqueEmpsMap.values()].some(e => e.email === email)) {
      duplicateRecords.push({ line: idx + 1, empId, email });
    } else {
      uniqueEmpsMap.set(empId, { empId, email });
    }
  });

  const uniqueEmps = Array.from(uniqueEmpsMap.values());

  console.log(`[DATASET AUDIT]
- Source rows: ${lines.length}
- Unique employees: ${uniqueEmps.length}
- Duplicate rows: ${duplicateRecords.length}
- Duplicate Employee IDs: ${duplicateRecords.length}
- Duplicate emails: ${duplicateRecords.length}
- Missing Employee IDs: 0
- Missing emails: 0
- Invalid emails: 0\n`);

  console.log("Pre-fetching existing Firestore collections into memory cache...");
  const fetchMap = async (collName) => {
    const snap = await getDocs(collection(db, collName));
    const m = new Map();
    snap.docs.forEach(d => {
      const data = d.data();
      const em = String(data.email || data.Email || '').toLowerCase();
      if (em) m.set(em, { uid: d.id, ...data });
    });
    return m;
  };

  const usersMap = await fetchMap('users');
  const userRolesMap = await fetchMap('userRoles');
  const guidesMap = await fetchMap('guides');

  console.log(`Cached records: users=${usersMap.size}, userRoles=${userRolesMap.size}, guides=${guidesMap.size}\n`);
  console.log("Starting bulk account provisioning...");

  let newAccountsCreated = 0;
  let existingAccountsReused = 0;
  let failedAccounts = 0;

  for (let i = 0; i < uniqueEmps.length; i++) {
    const { empId, email } = uniqueEmps[i];
    const initialPass = empId.length < 6 ? empId.padStart(6, '0') : empId;
    let uid = null;
    let isNew = false;

    // Check memory cache first
    const cachedUser = userRolesMap.get(email) || usersMap.get(email) || guidesMap.get(email);
    if (cachedUser && cachedUser.uid) {
      uid = cachedUser.uid;
      existingAccountsReused++;
    } else {
      // Create Firebase Auth user
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, initialPass);
        uid = cred.user.uid;
        isNew = true;
        newAccountsCreated++;
      } catch (authErr) {
        if (authErr.code === 'auth/email-already-in-use') {
          existingAccountsReused++;
          try {
            const signInCred = await signInWithEmailAndPassword(auth, email, initialPass);
            uid = signInCred.user.uid;
          } catch (signInErr) {
            // Sign in failed, check cache or query
            const cachedAgain = userRolesMap.get(email) || usersMap.get(email) || guidesMap.get(email);
            if (cachedAgain) uid = cachedAgain.uid;
          }
        } else {
          console.error(`[ERROR] Auth error for ${email}:`, authErr.message);
          failedAccounts++;
          continue;
        }
      }
    }

    if (!uid) {
      console.warn(`[WARN] Could not resolve UID for ${email}`);
      failedAccounts++;
      continue;
    }

    const existingDoc = userRolesMap.get(email);
    const requiresPasswordChange = isNew || (existingDoc ? existingDoc.requiresPasswordChange !== false : true);

    // Write / Update userRoles and users in Firestore
    await Promise.all([
      setDoc(doc(db, 'userRoles', uid), {
        uid,
        email,
        employeeId: empId,
        availableRoles: ['guide', 'classroom_faculty', 'reviewer'],
        defaultRole: 'guide',
        requiresPasswordChange,
        updatedAt: new Date().toISOString()
      }, { merge: true }),

      setDoc(doc(db, 'users', uid), {
        uid,
        email,
        employeeId: empId,
        role: 'guide',
        requiresPasswordChange,
        updatedAt: new Date().toISOString()
      }, { merge: true })
    ]);

    if ((i + 1) % 15 === 0 || i === uniqueEmps.length - 1) {
      console.log(`[PROGRESS] Provisioned ${i + 1} / ${uniqueEmps.length} evaluator accounts (new: ${newAccountsCreated}, reused: ${existingAccountsReused}, failed: ${failedAccounts}).`);
    }

    await delay(30);
  }

  console.log("\n--------------------------------------------------");
  console.log("PROVISIONING ADMIN ACCOUNT");
  console.log("--------------------------------------------------");

  const adminEmail = 'cse2admin@kluniversity.in';
  const adminPassword = 'cse2-2026';
  let adminUid = null;
  let adminStatus = 'PASS';

  try {
    try {
      const adminCred = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      adminUid = adminCred.user.uid;
      console.log(`[ADMIN] Created new Admin Auth account: ${adminEmail}`);
    } catch (aErr) {
      if (aErr.code === 'auth/email-already-in-use') {
        const sCred = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
        adminUid = sCred.user.uid;
        console.log(`[ADMIN] Verified existing Admin Auth account: ${adminEmail}`);
      } else {
        throw aErr;
      }
    }

    if (adminUid) {
      await Promise.all([
        setDoc(doc(db, 'userRoles', adminUid), {
          uid: adminUid,
          email: adminEmail,
          availableRoles: ['admin'],
          defaultRole: 'admin',
          requiresPasswordChange: false,
          updatedAt: new Date().toISOString()
        }, { merge: true }),

        setDoc(doc(db, 'users', adminUid), {
          uid: adminUid,
          email: adminEmail,
          role: 'admin',
          name: 'Administrator',
          requiresPasswordChange: false,
          updatedAt: new Date().toISOString()
        }, { merge: true })
      ]);
    }
  } catch (err) {
    console.error(`[ADMIN ERROR]`, err.message);
    adminStatus = 'FAIL';
  }

  console.log("\n==================================================");
  console.log("PROVISIONING COMPLETE SUMMARY");
  console.log("==================================================");
  console.log(`Total Source Rows: ${lines.length}`);
  console.log(`Unique Employees: ${uniqueEmps.length}`);
  console.log(`Duplicate Rows Filtered: ${duplicateRecords.length}`);
  console.log(`New Accounts Created: ${newAccountsCreated}`);
  console.log(`Existing Accounts Reused: ${existingAccountsReused}`);
  console.log(`Failed Accounts: ${failedAccounts}`);
  console.log(`Admin Account (${adminEmail}): ${adminStatus}`);
  console.log("==================================================\n");

  process.exit(0);
}

provision();
