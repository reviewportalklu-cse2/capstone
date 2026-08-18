const fs = require('fs');
const path = require('path');

const components = [
  'TeamSummary',
  'TeamMembers',
  'EvaluationTimeline',
  'MarksAnalysis',
  'ReviewerHistory',
  'TeamAttendance',
  'TeamRemarks',
  'ProjectResources',
  'TeamNotifications',
  'TeamActivityTimeline'
];

const dir = path.join(__dirname, 'src/pages/admin/team-management/components');

components.forEach(name => {
  const content = `import React from 'react';
import Card from '@/components/common/Card';

const ${name} = ({ team, teamData, students }) => {
  return (
    <Card title="${name.replace(/([A-Z])/g, ' $1').trim()}">
      <div className="p-4 text-gray-500 text-sm">
        ${name} component placeholder.
      </div>
    </Card>
  );
};

export default ${name};
`;
  fs.writeFileSync(path.join(dir, `${name}.jsx`), content);
});

console.log('Components scaffolded');
