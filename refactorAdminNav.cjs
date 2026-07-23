const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'src', 'pages', 'admin');
const files = fs.readdirSync(adminDir).filter(f => f.endsWith('.jsx'));

// Also include evaluation-center/EvaluationCenter.jsx
const additionalFiles = [
  path.join(adminDir, 'evaluation-center', 'EvaluationCenter.jsx')
];

const allFiles = [...files.map(f => path.join(adminDir, f)), ...additionalFiles];

allFiles.forEach(file => {
  if (file.includes('AdminDashboard.jsx') || file.includes('AdminRoutes.jsx')) return;
  if (!fs.existsSync(file)) return;
  
  let content = fs.readFileSync(file, 'utf-8');
  
  if (content.includes("import { adminNavigation } from '@/constants/navigation';")) {
    content = content.replace(
      "import { adminNavigation } from '@/constants/navigation';",
      "import { useAdminNavigation } from '@/hooks/useAdminNavigation';"
    );
    
    // Find the component declaration to inject the hook
    // Usually const ComponentName = () => { or const ComponentName = () => {
    const componentRegex = /const\s+([A-Z][a-zA-Z0-9_]*)\s*=\s*\([^)]*\)\s*=>\s*{/;
    const match = content.match(componentRegex);
    if (match) {
      const injectString = `${match[0]}\n  const navigationItems = useAdminNavigation();\n`;
      content = content.replace(match[0], injectString);
    }
    
    // Replace the prop passing
    content = content.replace(/navigationItems={adminNavigation}/g, "navigationItems={navigationItems}");
    
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`Updated ${file}`);
  }
});
