import dotenv from 'dotenv';
dotenv.config();

async function testEvalCenter() {
  const { evaluationCenterService } = await import('../src/firebase/services/evaluationCenterService.js');
  const teams = await evaluationCenterService.getAllTeamsWithEvaluations();
  console.log(`Total teams returned: ${teams.length}`);
  const matching = teams.filter(t => JSON.stringify(t).toLowerCase().includes('t001') || JSON.stringify(t).toLowerCase().includes('team 1') || JSON.stringify(t).toLowerCase().includes('t-001') || JSON.stringify(t).toLowerCase().includes('c2c'));
  console.log("Matching teams count:", matching.length);
  matching.slice(0, 5).forEach(t => console.log({ id: t.id, teamId: t.teamId, title: t.title, guideMarks: t.guideMarks, facultyMarks: t.facultyMarks, review1Score: t.review1Score }));
}

testEvalCenter().then(() => process.exit(0)).catch(console.error);
