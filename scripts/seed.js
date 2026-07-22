import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID?.replace(/,+$/, '')
};

if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'your_api_key_here') {
  console.error("ERROR: Firebase configuration is missing or using placeholder values.");
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const createdStudents = [];
const createdGuides = [];
const createdReviewers = [];
const createdFaculty = [];

const timestamp = new Date().toISOString();

// Helper to safely get or create Auth user and return UID
const getOrCreateAuthUser = async (email, password) => {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return cred.user.uid;
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return cred.user.uid;
    }
    throw error;
  }
};

const runSeeder = async () => {
  console.log("Starting Phase X.2 Database Seeding...\n");

  // 1. Create Admin
  console.log("Creating Admin...");
  try {
    const uid = await getOrCreateAuthUser('admin@university.edu', 'Admin@123');
    const adminData = {
      uid,
      name: 'System Administrator',
      email: 'admin@university.edu',
      role: 'admin',
      department: 'Administration',
      phone: '1234567890',
      status: 'Active',
      createdAt: timestamp,
      updatedAt: timestamp
    };
    await setDoc(doc(db, 'users', uid), adminData);
    await setDoc(doc(db, 'admins', uid), adminData);
    console.log("✅ Admin Created / Synced");
  } catch (error) {
    console.error("Failed to create Admin:", error.message);
  }

  // 2. Create Faculty (10)
  console.log("Creating Faculty...");
  for (let i = 1; i <= 10; i++) {
    const index = i.toString().padStart(2, '0');
    const email = `faculty${index}@university.edu`;
    const batchAssigned = i <= 5 ? 'A1' : 'A2';
    try {
      const uid = await getOrCreateAuthUser(email, 'Faculty@123');
      const data = {
        uid, name: `Faculty ${index}`, email, role: 'classroom_faculty',
        department: 'Computer Science', phone: `55510000${index}`, status: 'Active',
        createdAt: timestamp, updatedAt: timestamp,
        assignedStudents: [], internalMarks: [],
        assignedBatch: batchAssigned
      };
      await setDoc(doc(db, 'users', uid), { uid, name: data.name, email, role: data.role, department: data.department, phone: data.phone, status: data.status, createdAt: timestamp, updatedAt: timestamp });
      await setDoc(doc(db, 'classroomFaculty', uid), data);
      createdFaculty.push(data);
      console.log(`✅ Faculty ${index} Synced`);
    } catch (error) { console.error(`Failed Faculty ${index}:`, error.message); }
  }

  // 3. Create Reviewers (10)
  console.log("Creating Reviewers...");
  for (let i = 1; i <= 10; i++) {
    const index = i.toString().padStart(2, '0');
    const email = `reviewer${index}@university.edu`;
    try {
      const uid = await getOrCreateAuthUser(email, 'Reviewer@123');
      const data = {
        uid, name: `Reviewer ${index}`, email, role: 'reviewer',
        department: 'External', phone: `55520000${index}`, status: 'Active',
        createdAt: timestamp, updatedAt: timestamp,
        assignedBatches: ['A1', 'A2'], assignedStudents: []
      };
      await setDoc(doc(db, 'users', uid), { uid, name: data.name, email, role: data.role, department: data.department, phone: data.phone, status: data.status, createdAt: timestamp, updatedAt: timestamp });
      await setDoc(doc(db, 'reviewers', uid), data);
      createdReviewers.push(data);
      console.log(`✅ Reviewer ${index} Synced`);
    } catch (error) { console.error(`Failed Reviewer ${index}:`, error.message); }
  }

  // 4. Create Guides (10)
  console.log("Creating Guides...");
  for (let i = 1; i <= 10; i++) {
    const index = i.toString().padStart(2, '0');
    const email = `guide${index}@university.edu`;
    try {
      const uid = await getOrCreateAuthUser(email, 'Guide@123');
      const data = {
        uid, name: `Guide ${index}`, email, role: 'guide',
        department: 'Computer Science', phone: `55530000${index}`, status: 'Active',
        createdAt: timestamp, updatedAt: timestamp,
        assignedStudents: [], assignedProjects: []
      };
      await setDoc(doc(db, 'users', uid), { uid, name: data.name, email, role: data.role, department: data.department, phone: data.phone, status: data.status, createdAt: timestamp, updatedAt: timestamp });
      await setDoc(doc(db, 'guides', uid), data);
      createdGuides.push(data);
      console.log(`✅ Guide ${index} Synced`);
    } catch (error) { console.error(`Failed Guide ${index}:`, error.message); }
  }

  // 5. Create Rooms & Review Schedules
  console.log("Creating Rooms & Schedules...");
  const rooms = [
    { roomNumber: 'Lab 401', capacity: 30, building: 'Block A', status: 'Available' },
    { roomNumber: 'Lab 402', capacity: 30, building: 'Block A', status: 'Available' },
    { roomNumber: 'Seminar Hall 1', capacity: 100, building: 'Block B', status: 'Available' }
  ];
  for (const r of rooms) { await setDoc(doc(db, 'rooms', r.roomNumber), { ...r, createdAt: timestamp, updatedAt: timestamp }); }

  const reviewSchedules = [
    { id: 'rev-01', title: 'Review 1: Synopsis', date: '2026-08-15', batch: 'A1', type: 'Internal', status: 'Completed' },
    { id: 'rev-02', title: 'Review 2: Architecture', date: '2026-09-20', batch: 'A1', type: 'External', status: 'Scheduled' },
    { id: 'rev-03', title: 'Review 3: Final Presentation', date: '2026-11-10', batch: 'A1', type: 'External', status: 'Scheduled' }
  ];
  for (const s of reviewSchedules) { await setDoc(doc(db, 'reviewSchedules', s.id), { ...s, createdAt: timestamp, updatedAt: timestamp }); }
  console.log("✅ Rooms & Schedules Created");

  // 6. Create Students (10) and Projects
  console.log("Creating Students and Projects...");
  
  // Mapping logic: Guides 0, 1, 2 get 2 students each. Guides 3, 4, 5, 6 get 1 student each. Guides 7, 8, 9 get 0.
  const guideAssignments = [0, 0, 1, 1, 2, 2, 3, 4, 5, 6]; 
  
  const techStacks = [
    ['React', 'Node.js', 'Firebase'],
    ['Python', 'Django', 'PostgreSQL'],
    ['Flutter', 'Firebase'],
    ['Vue.js', 'Express', 'MongoDB']
  ];

  for (let i = 0; i < 10; i++) {
    const studentIdx = i + 1;
    const index = studentIdx.toString().padStart(2, '0');
    const email = `student${index}@university.edu`;
    const batch = studentIdx <= 5 ? 'A1' : 'A2';
    
    const assignedGuide = createdGuides[guideAssignments[i]];
    const assignedReviewer = createdReviewers[i % 5]; // First 5 reviewers handle students
    const assignedFaculty = createdFaculty[batch === 'A1' ? 0 : 5]; // Faculty 01 for A1, Faculty 06 for A2

    try {
      const uid = await getOrCreateAuthUser(email, 'Student@123');
      
      const studentData = {
        uid, name: `Student ${index}`, email, role: 'student',
        department: 'Computer Science', phone: `55540000${index}`, status: 'Active',
        rollNumber: `221FA040${index}`, batch, section: 'S1', teamName: `Team Alpha ${index}`,
        projectTitle: studentIdx % 2 === 0 ? `AI Based Smart Attendance System v${studentIdx}` : `IoT Home Automation v${studentIdx}`,
        guideId: assignedGuide?.uid || '', reviewerId: assignedReviewer?.uid || '', facultyId: assignedFaculty?.uid || '',
        roomNumber: 'Lab 401',
        createdAt: timestamp, updatedAt: timestamp
      };

      await setDoc(doc(db, 'users', uid), { uid, name: studentData.name, email, role: studentData.role, department: studentData.department, phone: studentData.phone, status: studentData.status, createdAt: timestamp, updatedAt: timestamp });
      await setDoc(doc(db, 'students', uid), studentData);
      
      // Update Guide document with student
      if (assignedGuide) {
        assignedGuide.assignedStudents.push(uid);
        await setDoc(doc(db, 'guides', assignedGuide.uid), assignedGuide);
      }
      // Update Faculty document with student
      if (assignedFaculty) {
        assignedFaculty.assignedStudents.push(uid);
        await setDoc(doc(db, 'classroomFaculty', assignedFaculty.uid), assignedFaculty);
      }
      
      // Create Project
      const projectRef = doc(collection(db, 'projects'));
      await setDoc(projectRef, {
        projectId: projectRef.id,
        title: studentData.projectTitle,
        description: `This is a comprehensive enterprise project utilizing modern web and mobile architecture for solving real-world problems. Lead by ${studentData.name}.`,
        technologies: techStacks[i % techStacks.length],
        repositoryLink: `https://github.com/university/capstone-${index}`,
        teamName: studentData.teamName,
        studentId: uid,
        guideId: studentData.guideId,
        reviewerId: studentData.reviewerId,
        status: 'In Progress',
        currentMilestone: 'Architecture Design',
        createdAt: timestamp,
        updatedAt: timestamp
      });

      // Create Review 1 (Synopsis)
      await setDoc(doc(collection(db, 'reviews')), {
        reviewId: `rev1-${uid}`,
        studentId: uid,
        projectId: projectRef.id,
        reviewerId: studentData.reviewerId,
        scheduleId: 'rev-01',
        title: 'Review 1: Synopsis',
        status: 'Evaluated',
        marks: 22,
        maxMarks: 25,
        remarks: 'Excellent problem statement. Proceed with architecture.',
        createdAt: timestamp,
        updatedAt: timestamp
      });

      // Create Review 2 (Architecture)
      await setDoc(doc(collection(db, 'reviews')), {
        reviewId: `rev2-${uid}`,
        studentId: uid,
        projectId: projectRef.id,
        reviewerId: studentData.reviewerId,
        scheduleId: 'rev-02',
        title: 'Review 2: Architecture',
        status: 'Pending',
        createdAt: timestamp,
        updatedAt: timestamp
      });

      // Create Review 3 (Final)
      await setDoc(doc(collection(db, 'reviews')), {
        reviewId: `rev3-${uid}`,
        studentId: uid,
        projectId: projectRef.id,
        reviewerId: studentData.reviewerId,
        scheduleId: 'rev-03',
        title: 'Review 3: Final Presentation',
        status: 'Pending',
        createdAt: timestamp,
        updatedAt: timestamp
      });

      // Create Guide Marks & Faculty Marks
      await setDoc(doc(collection(db, 'guideMarks')), { studentId: uid, guideId: studentData.guideId, marks: 45, total: 50, createdAt: timestamp });
      await setDoc(doc(collection(db, 'facultyMarks')), { studentId: uid, facultyId: studentData.facultyId, marks: 35, total: 40, createdAt: timestamp });
      
      // Create Guide Remark / Milestone
      await setDoc(doc(collection(db, 'remarks')), { studentId: uid, authorId: studentData.guideId, text: 'Architecture diagrams look solid. Ensure DB normalization.', type: 'Guidance', createdAt: timestamp });
      
      // Generate Notification
      await setDoc(doc(collection(db, 'notifications')), { 
        title: 'Upcoming Review', 
        message: 'Review 2: Architecture is scheduled for next week.', 
        userId: uid,
        type: 'alert', 
        read: false,
        createdAt: timestamp 
      });

      console.log(`✅ Student ${index} & Relational Data Synced`);
    } catch (error) { console.error(`Failed Student ${index}:`, error.message); }
  }

  console.log("\n🎉 Database Seeding Phase X.2 Completed successfully!");
  process.exit(0);
};

runSeeder();
