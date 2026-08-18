const fs = require('fs');
const path = require('path');

const filesToRefactor = [
  'src/pages/admin/evaluation-center/EvaluationAnalytics.jsx',
  'src/pages/admin/evaluation-center/TeamEvaluations.jsx',
  'src/pages/admin/evaluation-center/PendingTracker.jsx',
  'src/pages/admin/evaluation-center/EvaluationTimelineView.jsx'
];

filesToRefactor.forEach(relPath => {
  const filePath = path.join('C:/Users/hp/Desktop/Capstone', relPath);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace import
  content = content.replace(/import \{ evaluationCenterService \} from '[^']+';/, "import { useEvaluationCenterData } from '@/hooks/useEvaluationCenterData';");

  // Replace fetch logic
  content = content.replace(/const \[teams, setTeams\] = useState\(\[\]\);\s*const \[(loading|isLoading), (setLoading|setIsLoading)\] = useState\(true\);\s*useEffect\(\(\) => \{\s*fetch[a-zA-Z]+\(\);\s*\}, \[\]\);\s*const fetch[a-zA-Z]+ = async \(\) => \{\s*(setLoading|setIsLoading)\(true\);\s*try \{\s*const data = await evaluationCenterService\.getAllTeamsWithEvaluations\(\);\s*setTeams\(data\);\s*\} catch \([^)]*\) \{\s*console\.error\([^)]*\);\s*\} finally \{\s*(setLoading|setIsLoading)\(false\);\s*\}\s*\};/, "const { getTeamsWithEvaluations, dataLoading: $1 } = useEvaluationCenterData();\n  const teams = getTeamsWithEvaluations();");

  fs.writeFileSync(filePath, content);
  console.log(`Refactored ${relPath}`);
});
