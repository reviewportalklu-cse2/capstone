import React from 'react';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import { Users, Mail, Phone, Hash } from 'lucide-react';

const TeamMembers = ({ teamData }) => {
  return (
    <Card title="Team Members" icon={Users}>
      <div className="space-y-4">
        {teamData.students.length > 0 ? (
          teamData.students.map((student) => {
            // Find individual attendance from evaluations + raw attendance
            const evals = teamData.evaluations || [];
            let presentCount = 0;
            let absentCount = 0;
            let latestStatus = null;

            evals.forEach(e => {
              if (e.attendance && e.attendance[student.id]) {
                const st = e.attendance[student.id];
                if (!latestStatus) latestStatus = st;
                if (st === 'Present') presentCount++;
                if (st === 'Absent') absentCount++;
              }
            });

            const rawAttendance = (teamData.attendance || []).filter(a => a.studentId === student.id);
            rawAttendance.forEach(a => {
              const st = a.status || a.attendance;
              if (st === 'Present') presentCount++;
              if (st === 'Absent') absentCount++;
              if (!latestStatus) latestStatus = st;
            });

            const totalAttendance = presentCount + absentCount;
            const attendancePct = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : null;

            // Find individual marks (Faculty)
            const facultyEval = evals.find(e => e.role === 'faculty' || e.role === 'classroom_faculty');
            const studentTotalMark = facultyEval?.studentTotals?.[student.id];
            const avgMarks = studentTotalMark !== undefined ? studentTotalMark : (teamData.facultyMarks?.find(m => m.studentId === student.id)?.marks ?? 'N/A');

            return (
              <div key={student.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:border-gray-200 hover:bg-gray-100/50">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg border border-primary-200">
                    {student.name ? student.name.charAt(0) : 'S'}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{student.name}</h4>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      <span className="flex items-center"><Hash className="w-3 h-3 mr-1" /> {student.rollNumber || student.id}</span>
                      {student.email && <span className="flex items-center"><Mail className="w-3 h-3 mr-1" /> {student.email}</span>}
                      {student.phone && <span className="flex items-center"><Phone className="w-3 h-3 mr-1" /> {student.phone}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 items-center">
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-gray-400">Attendance</p>
                    {totalAttendance > 0 ? (
                      <Badge variant={latestStatus === 'Present' ? 'success' : 'danger'}>
                        {latestStatus} ({attendancePct}%)
                      </Badge>
                    ) : (
                      <Badge variant="default" className="text-xs font-semibold">Not Evaluated</Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-gray-400">Faculty Marks</p>
                    <span className="text-lg font-bold text-gray-900">{avgMarks}</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-gray-500 text-sm">
            No members have been assigned to this team yet.
          </div>
        )}
      </div>
    </Card>
  );
};

export default TeamMembers;
