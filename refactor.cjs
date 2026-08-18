const fs = require('fs');
const glob = require('glob');
const path = require('path');

const files = glob.sync('src/**/*.jsx').concat(glob.sync('src/**/*.js'));
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('useAdminStats')) {
    console.log('Modifying ' + file);
    content = content.replace(/import \{ useAdminStats \} from '@\/contexts\/AdminStatsContext';\n?/g, '');
    content = content.replace(/import \{ useData \} from '@\/contexts\/DataContext';\n?/g, '');
    content = "import { useData } from '@/contexts/DataContext';\n" + content;
    
    content = content.replace(/const \{.*?\} = useAdminStats\(\);/g, 'const { students = [], guides = [], faculty = [], reviewers = [], teams = [], projects = [], reviews = [], dataLoading: loading } = useData();\n  const data = { students, guides, faculty, reviewers, teams, projects, reviews };\n  const stats = { students: students.length, guides: guides.length, faculty: faculty.length, reviewers: reviewers.length, teams: teams.length, projects: projects.length, reviews: reviews.length };\n  const recentReviews = [...reviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);');
    
    fs.writeFileSync(file, content);
  }
});
