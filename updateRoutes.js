const fs = require('fs');
const path = require('path');

function updateRoutes(file, imports, routes) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Check if already injected to avoid duplicates
    if (content.includes(imports[0].split(' ')[1])) return;
    
    const importStr = imports.map(i => import  from './';).join('\n');
    content = content.replace(/(import React from 'react';\nimport {.*?}.*?;\n)/, $1\n);
    
    const routesStr = routes.map(r =>       <Route path="" element={< />} />).join('\n');
    content = content.replace(/(<Routes>\n(?:.|\n)*?)(      <Route path="\*" element={<Navigate to="dashboard" replace \/> \/>)/, $1\n);
    
    fs.writeFileSync(file, content);
}

// Admin
updateRoutes(
    path.join(__dirname, 'src', 'pages', 'admin', 'AdminRoutes.jsx'),
    ['ProjectManagement', 'RoomManagement', 'ScheduleManagement', 'Reports'],
    [
        {path: 'projects', comp: 'ProjectManagement'},
        {path: 'rooms', comp: 'RoomManagement'},
        {path: 'schedules', comp: 'ScheduleManagement'},
        {path: 'reports', comp: 'Reports'}
    ]
);

// Guide
updateRoutes(
    path.join(__dirname, 'src', 'pages', 'guide', 'GuideRoutes.jsx'),
    ['MyProjects', 'Remarks', 'Meetings', 'ProgressTracking'],
    [
        {path: 'projects', comp: 'MyProjects'},
        {path: 'remarks', comp: 'Remarks'},
        {path: 'meetings', comp: 'Meetings'},
        {path: 'progress', comp: 'ProgressTracking'}
    ]
);

// Reviewer
updateRoutes(
    path.join(__dirname, 'src', 'pages', 'reviewer', 'ReviewerRoutes.jsx'),
    ['ReviewEvaluations', 'AssignedStudents'],
    [
        {path: 'evaluations', comp: 'ReviewEvaluations'},
        {path: 'students', comp: 'AssignedStudents'}
    ]
);

// Faculty
updateRoutes(
    path.join(__dirname, 'src', 'pages', 'faculty', 'FacultyRoutes.jsx'),
    ['EnterMarks', 'BulkMarks', 'StudentSearch'],
    [
        {path: 'marks', comp: 'EnterMarks'},
        {path: 'bulk-marks', comp: 'BulkMarks'},
        {path: 'search', comp: 'StudentSearch'}
    ]
);

// Student
updateRoutes(
    path.join(__dirname, 'src', 'pages', 'student', 'StudentRoutes.jsx'),
    ['MyProfile', 'MyProjectDetails', 'MyMarks', 'StudentRemarks'],
    [
        {path: 'profile', comp: 'MyProfile'},
        {path: 'project', comp: 'MyProjectDetails'},
        {path: 'marks', comp: 'MyMarks'},
        {path: 'remarks', comp: 'StudentRemarks'}
    ]
);
