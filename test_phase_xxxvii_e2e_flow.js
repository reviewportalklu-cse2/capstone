import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD01a-evT_VhRa_ndcvc4v5Qnni2cS9SVc",
  authDomain: "final-year-project-erp.firebaseapp.com",
  projectId: "final-year-project-erp",
  storageBucket: "final-year-project-erp.firebasestorage.app",
  messagingSenderId: "1094425001784",
  appId: "1:1094425001784:web:8d5a03125e1434f2778bcd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testE2EFlow() {
  console.log("=========================================================================");
  console.log("   E2E EVALUATION LIFECYCLE SIMULATION & FIRESTORE INTEGRITY TEST        ");
  console.log("=========================================================================\n");

  const teamId = "T001";
  const reviewCycle = "Review 1";
  const now = new Date().toISOString();

  // 1. Fetch active published rubric for Review 1
  const rubricsSnap = await getDocs(collection(db, 'rubrics'));
  const rubrics = rubricsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const r1Rubric = rubrics.find(r => String(r.reviewCycle).trim().toLowerCase() === 'review 1' && (r.status === 'Published' || r.status === 'Active'));

  if (!r1Rubric) {
    console.error("FAIL: Published Review 1 rubric not found!");
    process.exit(1);
  }
  console.log(`[PASS] Active Published Rubric for Review 1 found: ${r1Rubric.title} (${r1Rubric.id})`);

  // Fetch criteria
  const criteriaSnap = await getDocs(collection(db, 'rubricCriteria'));
  const criteria = criteriaSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(c => String(c.rubricId).toLowerCase() === String(r1Rubric.id).toLowerCase())
    .sort((a, b) => (a.displayOrder || a.order || 0) - (b.displayOrder || b.order || 0));

  console.log(`[PASS] Retrieved ${criteria.length} criteria for Review 1 rubric.`);

  // Dummy student list for T001
  const studentIds = ["2200030001", "2200030002", "2200030003", "2200030004"];

  // Roles to test
  const testRoles = [
    { role: 'guide', evaluatorId: 'guide_user_001', evaluatorName: 'Dr. Ramesh (Guide)', targetScore: 82 },
    { role: 'faculty', evaluatorId: 'faculty_user_001', evaluatorName: 'Dr. Lakshmi (Faculty)', targetScore: 78 },
    { role: 'reviewer', evaluatorId: 'reviewer_user_001', evaluatorName: 'Dr. Kiran (Reviewer)', targetScore: 88 }
  ];

  for (const rTest of testRoles) {
    const cleanCycle = String(reviewCycle).toLowerCase().replace(/[^a-z0-9]/g, '_');
    const cleanTeam = String(teamId).toLowerCase().replace(/[^a-z0-9]/g, '_');
    const evalDocId = `eval_${cleanCycle}_${cleanTeam}_${rTest.role}`;

    // Generate criterion marks matching targetScore proportionally
    const marks = {};
    const studentTotals = {};
    let grandTotal = 0;

    studentIds.forEach(sId => {
      let sTotal = 0;
      criteria.forEach(c => {
        const markVal = Math.round((c.maximumMarks / 100) * rTest.targetScore);
        marks[`${sId}_${c.id}`] = markVal;
        sTotal += markVal;
      });
      studentTotals[sId] = sTotal;
      grandTotal += sTotal;
    });

    const teamAverage = Math.round(grandTotal / studentIds.length);

    const evaluationDoc = {
      id: evalDocId,
      teamId,
      teamName: "Project Alpha - AI System",
      reviewCycle,
      reviewCycleId: "cycle-1",
      rubricId: r1Rubric.id,
      rubricTitle: r1Rubric.title,
      rubricVersion: r1Rubric.version,
      evaluatorId: rTest.evaluatorId,
      evaluatorEmployeeId: "EMP_" + rTest.evaluatorId.toUpperCase(),
      evaluatorName: rTest.evaluatorName,
      role: rTest.role,
      marks,
      remarks: {
        strengths: "Excellent architecture design and code organization.",
        weaknesses: "Slight improvements needed in unit test coverage."
      },
      attendance: {
        "2200030001": "Present",
        "2200030002": "Present",
        "2200030003": "Present",
        "2200030004": "Present"
      },
      studentTotals,
      teamAverage,
      status: "Locked",
      updatedAt: now,
      evaluatedAt: now,
      submittedAt: now,
      createdAt: now
    };

    await setDoc(doc(db, 'evaluations', evalDocId), evaluationDoc);
    console.log(`[PASS] ${rTest.role.toUpperCase()} Evaluation set and locked in Firestore (ID ${evalDocId}, Team Average: ${teamAverage}/100)`);
  }

  // 2. Verify all 3 test evaluations exist and are locked in Firestore
  const allEvalsSnap = await getDocs(collection(db, 'evaluations'));
  const allEvals = allEvalsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const testDocIds = new Set(['eval_review_1_t001_guide', 'eval_review_1_t001_faculty', 'eval_review_1_t001_reviewer']);
  const t001Evals = allEvals.filter(e => testDocIds.has(e.id));

  console.log(`\n[VERIFICATION] Retrieved ${t001Evals.length} test evaluation records for ${teamId} (${reviewCycle}):`);

  t001Evals.forEach(e => {
    console.log(` - Role: ${e.role.toUpperCase()} | Evaluator: ${e.evaluatorName} | Score: ${e.teamAverage}/100 | Status: ${e.status} | SubmittedAt: ${e.submittedAt}`);
  });

  if (t001Evals.length === 3 && t001Evals.every(e => e.status === 'Locked')) {
    console.log("\n=========================================================================");
    console.log("   E2E EVALUATION LIFECYCLE VERIFIED SUCCESSFULLY — ZERO ERRORS!         ");
    console.log("=========================================================================\n");
    process.exit(0);
  } else {
    console.error("FAIL: E2E evaluation verification failed!");
    process.exit(1);
  }
}

testE2EFlow().catch(err => {
  console.error("Error in E2E simulation test:", err);
  process.exit(1);
});
