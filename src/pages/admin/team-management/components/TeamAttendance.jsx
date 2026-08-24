import React from 'react';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import { CalendarCheck, AlertCircle, Clock } from 'lucide-react';

const TeamAttendance = ({ teamData }) => {
  const evalsWithAttendance = (teamData.evaluations || []).filter(e => e.attendance && Object.keys(e.attendance).length > 0);
  const rawAttendance = teamData.attendance || [];

  const evalEvents = evalsWithAttendance.map(e => ({
    name: `${e.reviewCycle || 'Review Cycle'} (${e.role ? e.role.toUpperCase() : 'EVALUATION'})`,
    date: e.submittedAt || e.updatedAt || e.createdAt,
    evalObj: e
  }));

  const rawEvents = [...new Set(rawAttendance.map(a => a.reviewType || a.week))].map(name => ({
    name,
    date: rawAttendance.find(a => (a.reviewType || a.week) === name)?.createdAt,
    records: rawAttendance.filter(a => (a.reviewType || a.week) === name)
  }));

  const allEvents = [...evalEvents, ...rawEvents];

  return (
    <Card title="Attendance & Evaluation History" icon={CalendarCheck}>
      <div className="space-y-6">
        {allEvents.length > 0 ? (
          allEvents.map((event, idx) => {
            return (
              <div key={idx} className="border border-gray-100 rounded-lg overflow-hidden">
                <div className="bg-gray-50 p-3 border-b border-gray-100 flex justify-between items-center">
                  <h4 className="font-bold text-gray-900">{event.name}</h4>
                  <span className="text-xs text-gray-500">{event.date ? new Date(event.date).toLocaleDateString() : 'Recorded'}</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {teamData.students.map(student => {
                    let status = 'Not Evaluated';
                    if (event.evalObj) {
                      status = event.evalObj.attendance[student.id] || 'Not Evaluated';
                    } else if (event.records) {
                      const rec = event.records.find(r => r.studentId === student.id);
                      status = rec ? rec.status : 'Not Evaluated';
                    }

                    const isAbsent = status === 'Absent';
                    const isPresent = status === 'Present';

                    return (
                      <div key={student.id} className="p-3 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{student.name}</span>
                          <span className="text-xs text-gray-500">{student.rollNumber || student.id}</span>
                        </div>
                        <div className="flex items-center gap-2 text-right">
                          {isPresent && <Badge variant="success">Present</Badge>}
                          {isAbsent && <Badge variant="danger">Absent</Badge>}
                          {!isPresent && !isAbsent && <span className="text-xs text-gray-400 italic">Not Evaluated</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 flex flex-col items-center justify-center">
            <AlertCircle className="w-8 h-8 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No attendance records found for this team.</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default TeamAttendance;
