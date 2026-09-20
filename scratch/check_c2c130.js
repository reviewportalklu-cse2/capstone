import dotenv from 'dotenv';
dotenv.config();

async function checkC2C130() {
  const { evaluationCenterService } = await import('../src/firebase/services/evaluationCenterService.js');
  const teams = await evaluationCenterService.getAllTeamsWithEvaluations();
  const c2c130 = teams.filter(t => JSON.stringify(t).includes('C2C-130'));
  console.log(`Found ${c2c130.length} matches for C2C-130:`);
  c2c130.forEach(t => console.log({
    id: t.id,
    teamId: t.teamId,
    guideMarks: t.guideMarks,
    facultyMarks: t.facultyMarks,
    review1Score: t.review1Score,
    finalScore: t.finalScore,
    approvalStage: t.approvalStage,
    evaluationsCount: t.evaluations?.length
  }));
}

checkC2C130().then(() => process.exit(0)).catch(console.error);
