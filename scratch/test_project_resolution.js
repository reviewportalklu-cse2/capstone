import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

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

async function testResolution() {
  const getColl = async (name) => {
    const snap = await getDocs(collection(db, name));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  };

  const [projects, teams, students, guides, faculty, reviewers] = await Promise.all([
    getColl('projects'),
    getColl('teams'),
    getColl('students'),
    getColl('guides'),
    getColl('classroomFaculty'),
    getColl('reviewers')
  ]);

  console.log(`Loaded ${projects.length} projects, ${teams.length} teams, ${students.length} students, ${guides.length} guides, ${faculty.length} faculty, ${reviewers.length} reviewers.`);

  const start = Date.now();

  // Create fast lookup maps
  const teamByProjId = new Map();
  const teamByTeamId = new Map();
  teams.forEach(t => {
    if (t.projectId) teamByProjId.set(String(t.projectId).toLowerCase(), t);
    if (t.id) teamByTeamId.set(String(t.id).toLowerCase(), t);
    if (t.teamId) teamByTeamId.set(String(t.teamId).toLowerCase(), t);
  });

  const studentsByTeamId = new Map();
  const studentsByProjId = new Map();
  students.forEach(s => {
    const tId = String(s.teamId || s.team || '').toLowerCase();
    if (tId) {
      if (!studentsByTeamId.has(tId)) studentsByTeamId.set(tId, []);
      studentsByTeamId.get(tId).push(s);
    }
    const pId = String(s.projectId || '').toLowerCase();
    if (pId) {
      if (!studentsByProjId.has(pId)) studentsByProjId.set(pId, []);
      studentsByProjId.get(pId).push(s);
    }
  });

  const guideById = new Map(guides.map(g => [String(g.id || g.guideId || g.employeeId).toLowerCase(), g.name || g['Guide Name']]));
  const facultyById = new Map(faculty.map(f => [String(f.id || f.facultyId || f.employeeId).toLowerCase(), f.name || f['Faculty Name']]));
  const reviewerById = new Map(reviewers.map(r => [String(r.id || r.reviewerId || r.employeeId).toLowerCase(), r.name || r['Reviewer Name']]));

  const resolved = projects.map(p => {
    const pId = String(p.id || p.projectId || p['Project ID'] || '').toLowerCase();
    const teamId = String(p.teamId || '').toLowerCase();
    const team = teamByProjId.get(pId) || teamByTeamId.get(teamId) || null;
    
    const assignedStudents = studentsByProjId.get(pId) || (team ? studentsByTeamId.get(String(team.id || team.teamId).toLowerCase()) : []) || [];
    
    const gId = String(p.guideId || team?.guideId || assignedStudents[0]?.guideId || '').toLowerCase();
    const guideName = p.guideName || team?.guideName || guideById.get(gId) || 'Unassigned';

    const fId = String(p.facultyId || team?.facultyId || assignedStudents[0]?.facultyId || '').toLowerCase();
    const facultyName = p.facultyName || team?.facultyName || facultyById.get(fId) || 'Unassigned';

    const rId = String(p.reviewerId || team?.reviewerId || assignedStudents[0]?.reviewerId || '').toLowerCase();
    const reviewerName = p.reviewerName || team?.reviewerName || reviewerById.get(rId) || 'Unassigned';

    const teamName = p.teamName || team?.teamName || team?.name || (team ? `Team ${team.teamId || team.id}` : 'Unassigned');

    return {
      id: p.id || p.projectId,
      title: p.projectTitle || p.title || p.name || 'Untitled Project',
      teamName,
      studentCount: assignedStudents.length,
      guideName,
      facultyName,
      reviewerName,
      status: p.status || 'Active'
    };
  });

  const duration = Date.now() - start;
  console.log(`Resolved ${resolved.length} projects in ${duration} ms!`);
  console.log("Sample resolved project [0]:", JSON.stringify(resolved[0], null, 2));
  console.log("Sample resolved project [1]:", JSON.stringify(resolved[1], null, 2));
  console.log("Sample resolved project [500]:", JSON.stringify(resolved[500], null, 2));

  process.exit(0);
}

testResolution().catch(err => {
  console.error("Test resolution failed:", err);
  process.exit(1);
});
