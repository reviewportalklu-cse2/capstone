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
            // Find individual attendance
            const studentAttendance = teamData.attendance.filter(a => a.studentId === student.id);
            const presentCount = studentAttendance.filter(a => a.status === 'Present').length;
            const totalAttendance = studentAttendance.length;
            const attendancePct = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

            // Find individual marks (Faculty)
            const studentMarks = teamData.facultyMarks.filter(m => m.studentId === student.id);
            const avgMarks = studentMarks.length > 0 ? Math.round(studentMarks.reduce((acc, m) => acc + (m.marks || 0), 0) / studentMarks.length) : 'N/A';

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
                    <Badge variant={attendancePct >= 75 ? 'success' : (attendancePct > 0 ? 'warning' : 'default')}>
                      {attendancePct}% ({presentCount}/{totalAttendance})
                    </Badge>
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
