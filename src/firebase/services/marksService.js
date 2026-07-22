import { FirestoreService } from './firestore';

export const marksService = {
  // guideMarks
  getGuideMarks: async () => FirestoreService.getAll('guideMarks'),
  getGuideMarksByGuideId: async (guideId) => FirestoreService.query('guideMarks', [
    { field: 'guideId', operator: '==', value: guideId }
  ]),
  getGuideMarksByStudentId: async (studentId) => FirestoreService.query('guideMarks', [
    { field: 'studentId', operator: '==', value: studentId }
  ]),
  addGuideMark: async (data) => FirestoreService.create('guideMarks', data),
  updateGuideMark: async (id, data) => FirestoreService.update('guideMarks', id, data),
  
  // facultyMarks
  getFacultyMarks: async () => FirestoreService.getAll('facultyMarks'),
  getFacultyMarksByFacultyId: async (facultyId) => FirestoreService.query('facultyMarks', [
    { field: 'facultyId', operator: '==', value: facultyId }
  ]),
  getFacultyMarksByStudentId: async (studentId) => FirestoreService.query('facultyMarks', [
    { field: 'studentId', operator: '==', value: studentId }
  ]),
  addFacultyMark: async (data) => FirestoreService.create('facultyMarks', data),
};
