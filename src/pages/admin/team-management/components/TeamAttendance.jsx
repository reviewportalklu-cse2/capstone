import React from 'react';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import { CalendarCheck, AlertCircle, Clock } from 'lucide-react';

const TeamAttendance = ({ teamData }) => {
  // Group attendance by review/week
  const attendanceEvents = [...new Set(teamData.attendance.map(a => a.reviewType || a.week))];

  return (
    <Card title="Attendance & Pending Evaluations" icon={CalendarCheck}>
      <div className="space-y-6">
        {attendanceEvents.length > 0 ? (
          attendanceEvents.map((event, idx) => {
            const eventRecords = teamData.attendance.filter(a => a.reviewType === event || a.week === event);
            
            return (
              <div key={idx} className="border border-gray-100 rounded-lg overflow-hidden">
                <div className="bg-gray-50 p-3 border-b border-gray-100 flex justify-between items-center">
                  <h4 className="font-bold text-gray-900">{event}</h4>
                  <span className="text-xs text-gray-500">{new Date(eventRecords[0].createdAt).toLocaleDateString()}</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {teamData.students.map(student => {
                    const record = eventRecords.find(r => r.studentId === student.id);
                    
                    let deadlineDate = null;
                    let isOverdue = false;
                    let pendingResolution = false;
                    
                    if (record && record.status === 'Absent') {
                      // Calculate 7-day deadline for pending evaluations
                      const createdDate = new Date(record.createdAt);
                      deadlineDate = new Date(createdDate.getTime() + 7 * 24 * 60 * 60 * 1000);
                      isOverdue = new Date() > deadlineDate;
                      pendingResolution = !record.evaluationCompleted; // Assume boolean field evaluationCompleted
                    }

                    return (
                      <div key={student.id} className="p-3 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{student.name}</span>
                          <span className="text-xs text-gray-500">{student.rollNumber || student.id}</span>
                        </div>
                        <div className="flex items-center gap-2 text-right">
                          {record ? (
                            <>
                              <Badge variant={record.status === 'Present' ? 'success' : 'danger'}>
                                {record.status}
                              </Badge>
                              {record.status === 'Absent' && (
                                pendingResolution ? (
                                  <div className="flex flex-col items-end">
                                    <Badge variant="warning" className="text-[10px] flex items-center gap-1">
                                      <Clock className="w-3 h-3" /> Pending Eval
                                    </Badge>
                                    <span className={`text-[10px] mt-1 ${isOverdue ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                                      Due: {deadlineDate.toLocaleDateString()}
                                    </span>
                                  </div>
                                ) : (
                                  <Badge variant="success" className="text-[10px]">
                                    Eval Completed
                                  </Badge>
                                )
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-gray-400 italic">No record</span>
                          )}
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
