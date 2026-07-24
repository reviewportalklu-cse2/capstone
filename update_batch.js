import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc, writeBatch } from "firebase/firestore";

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

async function updateBatches() {
  const colRef = collection(db, "students");
  const snap = await getDocs(colRef);
  
  let batchExec = writeBatch(db);
  let count = 0;
  let updatedCount = 0;
  
  snap.forEach(d => {
    const data = d.data();
    const batchVal = data.batch || data.Batch;
    
    if (!batchVal || batchVal === "" || batchVal === "2022-26" || batchVal === "N/A") {
      const docRef = doc(db, "students", d.id);
      batchExec.update(docRef, { batch: "CSE-2", Batch: "CSE-2" });
      count++;
      updatedCount++;
    }
    
    if (count === 450) {
      batchExec.commit();
      batchExec = writeBatch(db);
      count = 0;
    }
  });
  
  if (count > 0) {
    await batchExec.commit();
  }
  
  console.log(`Successfully updated ${updatedCount} students to batch 'CSE-2'`);
  process.exit(0);
}

updateBatches();
