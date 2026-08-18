const fs = require('fs');
const path = require('path');

const refactorFile = (relPath, importRegex, serviceName, stateName, fetchName) => {
  const filePath = path.join('C:/Users/hp/Desktop/Capstone', relPath);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace import
  content = content.replace(importRegex, "import { useData } from '@/contexts/DataContext';");
  // Fix React import if needed
  content = content.replace(/import React, \{ useState, useEffect \} from 'react';/, "import React, { useState } from 'react';");

  // Build the block to replace
  const stateRegex = new RegExp(`const \\[(?:${stateName}), set[A-Z][a-zA-Z]+\\] = useState\\(\\[\\]\\);\\s*const \\[(?:isLoading|loading), (?:setIsLoading|setLoading)\\] = useState\\(true\\);\\s*useEffect\\(\\(\\) => \\{\\s*(?:${fetchName})\\(\\);\\s*\\}, \\[\\]\\);\\s*const (?:${fetchName}) = async \\(\\) => \\{[\\s\\S]*?\\};`);
  
  const replacement = `const { ${stateName}, dataLoading: isLoading } = useData();`;
  content = content.replace(stateRegex, replacement);

  fs.writeFileSync(filePath, content);
  console.log(`Refactored ${relPath}`);
};

refactorFile('src/pages/admin/RoomManagement.jsx', /import \{ roomService \} from '.*';/, 'roomService', 'rooms', 'fetchRooms');
refactorFile('src/pages/admin/ScheduleManagement.jsx', /import \{ scheduleService \} from '.*';/, 'scheduleService', 'schedules', 'fetchSchedules');
