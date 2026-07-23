import { db } from '../config';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';

export const FirestoreService = {
  async getAll(collectionName) {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  subscribeAll(collectionName, callback) {
    const colRef = collection(db, collectionName);
    const { onSnapshot } = require('firebase/firestore');
    return onSnapshot(colRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(data);
    });
  },

  async getById(collectionName, id) {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  },

  async create(collectionName, data) {
    const colRef = collection(db, collectionName);
    const docRef = await addDoc(colRef, data);
    return docRef.id;
  },

  async update(collectionName, id, data) {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, data);
  },

  async delete(collectionName, id) {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  },

  async query(collectionName, conditions) {
    // simple query wrapper
    // conditions = [{ field, operator, value }]
    const colRef = collection(db, collectionName);
    let q = colRef;
    conditions.forEach(cond => {
      q = query(q, where(cond.field, cond.operator, cond.value));
    });
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  subscribeQuery(collectionName, conditions, callback) {
    const colRef = collection(db, collectionName);
    let q = colRef;
    conditions.forEach(cond => {
      if (cond.operator === 'in') {
        q = query(q, where(cond.field, 'in', cond.value));
      } else {
        q = query(q, where(cond.field, cond.operator, cond.value));
      }
    });
    
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(data);
    });
  }
};
