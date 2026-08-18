const fs = require('fs');
const path = require('path');

const refactorStudentFile = (relPath) => {
  const filePath = path.join('C:/Users/hp/Desktop/Capstone', relPath);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(/import \{ studentService \} from '[^']+';/, "import { useData } from '@/contexts/DataContext';");
  
  // A generic replacement for simple fetch patterns isn't easy, so I'll just skip the automated regex
  // and print them to fix manually.
  
};
