const fs = require('fs');
const path = require('path');

console.log('=== PHASE XXXV FOOTER INTEGRATION VERIFICATION ===\n');

let allPassed = true;

// 1. Verify Footer.jsx exists
const footerPath = path.join(__dirname, '..', 'src', 'components', 'common', 'Footer.jsx');
if (!fs.existsSync(footerPath)) {
  console.error('FAIL: Footer.jsx does not exist at src/components/common/Footer.jsx');
  allPassed = false;
} else {
  console.log('PASS: src/components/common/Footer.jsx exists.');
}

const footerContent = fs.readFileSync(footerPath, 'utf8');

// 2. Check exact text content
const requiredStrings = [
  'Built & Designed by Ashrith Krishna',
  'Engineering ideas into meaningful digital experiences.',
  '© 2026 KLU CSE-2 Department. All Rights Reserved.',
  'View Portfolio',
  'https://myportfolio-eight-ecru-21.vercel.app/',
  'target="_blank"',
  'rel="noopener noreferrer"',
  'aria-label=',
  'text-primary-600'
];

requiredStrings.forEach(str => {
  if (footerContent.includes(str)) {
    console.log(`PASS: Found required string/attribute: "${str}"`);
  } else {
    console.error(`FAIL: Missing required string/attribute: "${str}"`);
    allPassed = false;
  }
});

// 3. Check for forbidden side-effects in Footer.jsx
const forbiddenHooks = ['useContext', 'useEffect', 'useState', 'db', 'firestore', 'firebase', 'DataContext', 'AuthContext', 'fetch', 'axios'];
forbiddenHooks.forEach(hook => {
  if (footerContent.includes(hook)) {
    console.error(`FAIL: Footer.jsx contains side-effect/dependency: "${hook}"`);
    allPassed = false;
  } else {
    console.log(`PASS: No "${hook}" found in Footer.jsx (Pure presentational component).`);
  }
});

// 4. Verify DashboardLayout.jsx integration
const layoutPath = path.join(__dirname, '..', 'src', 'components', 'layout', 'DashboardLayout.jsx');
const layoutContent = fs.readFileSync(layoutPath, 'utf8');

if (layoutContent.includes("import Footer from '@/components/common/Footer';") && layoutContent.includes('<Footer />')) {
  console.log('PASS: Footer component correctly imported and rendered in DashboardLayout.jsx.');
} else {
  console.error('FAIL: Footer component missing from DashboardLayout.jsx');
  allPassed = false;
}

// 5. Verify DashboardLayout usage across portal pages
const pagesDir = path.join(__dirname, '..', 'src', 'pages');
const roles = ['admin', 'student', 'guide', 'faculty', 'reviewer'];

roles.forEach(role => {
  const roleDir = path.join(pagesDir, role);
  if (fs.existsSync(roleDir)) {
    const files = fs.readdirSync(roleDir).filter(f => f.endsWith('.jsx'));
    const layoutUses = files.filter(f => {
      const c = fs.readFileSync(path.join(roleDir, f), 'utf8');
      return c.includes('DashboardLayout');
    });
    console.log(`PASS: ${role.toUpperCase()} portal has ${layoutUses.length} pages utilizing DashboardLayout.`);
  }
});

console.log('\n=== FINAL VERIFICATION RESULT ===');
if (allPassed) {
  console.log('ALL CHECKS PASSED SUCCESSFULLY.');
} else {
  console.error('SOME CHECKS FAILED.');
  process.exit(1);
}
