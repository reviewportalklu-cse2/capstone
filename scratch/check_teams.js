import dotenv from 'dotenv';
dotenv.config();

async function check() {
  const { FirestoreService } = await import('../src/firebase/services/firestore.js');
  const teams = await FirestoreService.getAll('teams');
  console.log('Sample 10 team IDs in teams collection:');
  teams.slice(0, 10).forEach(t => console.log(t.id, t.teamId, t.name));
  const t001 = teams.find(t => String(t.id || t.teamId).toLowerCase().includes('001') || String(t.name).toLowerCase().includes('001'));
  console.log('Match for 001 in teams:', t001 ? t001.id : 'NONE');
  const t052 = teams.find(t => String(t.id || t.teamId).toLowerCase().includes('052') || String(t.name).toLowerCase().includes('052'));
  console.log('Match for 052 in teams:', t052 ? t052.id : 'NONE');
  const t1 = teams.find(t => t.id === 'T001' || t.id === 'T01' || t.id === 'T1' || t.teamId === 'T001');
  console.log('Match for T001 exact:', t1 ? t1.id : 'NONE');
}

check().then(() => process.exit(0)).catch(console.error);
