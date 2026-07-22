import { FirestoreService } from './firestore';

export const marksService = {
  // guideMarks
  getGuideMarks: async () => FirestoreService.getAll('guideMarks'),
  addGuideMark: async (data) => FirestoreService.create('guideMarks', data),
  
  // facultyMarks
  getFacultyMarks: async () => FirestoreService.getAll('facultyMarks'),
  getFacultyMarksByFacultyId: async (facultyId) => FirestoreService.query('facultyMarks', [
    { field: 'facultyId', operator: '==', value: facultyId }
  ]),
  addFacultyMark: async (data) => FirestoreService.create('facultyMarks', data),
};
