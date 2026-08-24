import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateTeamPDF = (team) => {
  if (!team) return;

  const doc = new jsPDF();
  const title = `Team Workspace Report - ${team.teamId || team.id || 'Team'}`;

  // Header Banner
  doc.setFillColor(30, 41, 59); // dark slate
  doc.rect(0, 0, 210, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 18);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString()} | KL CSE Capstone System`, 14, 25);

  let y = 38;

  // SECTION 1: Team & Project Overview
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("1. Team & Project Overview", 14, y);
  y += 6;

  doc.autoTable({
    startY: y,
    head: [['Team ID', 'Project Title', 'Domain', 'Batch', 'Section', 'Department', 'Status']],
    body: [[
      team.teamId || team.id || 'N/A',
      team.projectTitle || team.project?.title || 'No Project',
      team.department || 'CSE',
      team.batch || '2026',
      team.section || 'A',
      team.department || 'CSE',
      team.status || 'Active'
    ]],
    theme: 'grid',
    headStyles: { fillStyle: 'F', fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8 }
  });

  y = doc.lastAutoTable.finalY + 10;

  // SECTION 2: Staff Mentors & Reviewer
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("2. Assigned Staff Mentors & Reviewer", 14, y);
  y += 6;

  doc.autoTable({
    startY: y,
    head: [['Role', 'Name', 'Email', 'Department']],
    body: [
      ['Assigned Guide', team.guideName || team.guide?.name || 'Unassigned', team.guide?.email || 'N/A', team.guide?.department || 'CSE'],
      ['Classroom Faculty', team.facultyName || team.faculty?.name || 'Unassigned', team.faculty?.email || 'N/A', team.faculty?.department || 'CSE'],
      ['Current Reviewer', team.reviewerName || team.reviewer?.name || 'Unassigned', team.reviewer?.email || 'N/A', 'Review Panel']
    ],
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8 }
  });

  y = doc.lastAutoTable.finalY + 10;

  // SECTION 3: Student Members
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("3. Student Members", 14, y);
  y += 6;

  const memberRows = (team.members || team.students || []).map((s, idx) => [
    idx + 1,
    s.rollNumber || s.rollNo || s.id || 'N/A',
    s.name || 'Unknown',
    s.email || 'N/A',
    s.status || 'Active'
  ]);

  doc.autoTable({
    startY: y,
    head: [['#', 'Roll Number', 'Name', 'Email', 'Status']],
    body: memberRows.length > 0 ? memberRows : [['1', 'N/A', 'No members linked', 'N/A', 'N/A']],
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8 }
  });

  y = doc.lastAutoTable.finalY + 10;

  // SECTION 4: Marks Summary
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("4. Evaluation & Marks Summary", 14, y);
  y += 6;

  doc.autoTable({
    startY: y,
    head: [['Guide Marks', 'Faculty Marks', 'Reviewer Marks', 'Average Total Score', 'Grade Status']],
    body: [[
      team.guideScore !== null && team.guideScore !== undefined ? `${team.guideScore} / 100` : 'Not Submitted',
      team.facultyScore !== null && team.facultyScore !== undefined ? `${team.facultyScore} / 100` : 'Not Submitted',
      team.reviewerScore !== null && team.reviewerScore !== undefined ? `${team.reviewerScore} / 100` : 'Not Submitted',
      team.avgMarks !== null && team.avgMarks !== undefined ? `${team.avgMarks} / 100` : 'Not Evaluated',
      team.avgMarks >= 75 ? 'Distinction (Green)' : team.avgMarks >= 50 ? 'Satisfactory (Yellow)' : 'Needs Improvement (Red)'
    ]],
    theme: 'grid',
    headStyles: { fillColor: [245, 158, 11], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8 }
  });

  doc.save(`team_workspace_${team.teamId || team.id || 'report'}.pdf`);
};
