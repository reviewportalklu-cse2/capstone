import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentService } from '@/firebase/services/studentService';
import { evaluationCenterService } from '@/firebase/services/evaluationCenterService';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import EmptyState from '@/components/common/EmptyState';
import { ArrowLeft, User, GraduationCap, Award, Calendar, History, Loader2 } from 'lucide-react';

const StudentEvaluationDetails = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
  }, [studentId]);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const allStudents = await studentService.getAll();
      const currentStudent = allStudents.find(s => s.id === studentId || s.uid === studentId || s.rollNumber === studentId);
      
      if (currentStudent) {
        setStudent(currentStudent);
        const teams = await evaluationCenterService.getAllTeamsWithEvaluations();
        const matchedTeam = teams.find(t => t.id === currentStudent.projectId || t.teamId === currentStudent.projectId || t.members.some(m => m.id === currentStudent.id || m.uid === currentStudent.uid));
        setTeam(matchedTeam);
      }
    } catch (err) {
      console.error("Failed to load student evaluation details:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!student) {
    return (
      <EmptyState
        title="Student Profile Not Found"
        description="The requested student evaluation record could not be retrieved."
        actionText="Back to Teams"
        onAction={() => navigate('/admin/evaluation-center/teams')}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Back Header */}
      <div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Team Details
        </Button>
      </div>

      {/* Student Banner */}
      <Card className="p-6 bg-white border-l-4 border-primary-600 shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary-100 text-primary-700 font-black text-xl flex items-center justify-center">
              {student.name ? student.name.charAt(0) : 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
                <Badge variant="primary">Roll: {student.rollNumber || student.id}</Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {student.email} • Dept: {student.department || 'CSE'} • Sec: {student.section || 'A'} • Batch: {student.batch || 'CSE-2'}
              </p>
            </div>
          </div>

          {team && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-right">
              <div className="text-xs text-gray-500 font-medium">Assigned Team</div>
              <div className="text-sm font-bold text-primary-700">{team.teamId} - {team.teamName}</div>
            </div>
          )}
        </div>
      </Card>

      {/* Mentors & Project Context */}
      {team && (
        <Card className="p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary-600" /> Mentors & Assessment Context
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-gray-500">Project Guide</div>
              <div className="font-bold text-gray-900 text-sm">{team.guideName}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-gray-500">Panel Reviewer</div>
              <div className="font-bold text-gray-900 text-sm">{team.reviewerName}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-gray-500">Faculty Panel</div>
              <div className="font-bold text-gray-900 text-sm">{team.facultyPanelName}</div>
            </div>
          </div>
        </Card>
      )}

      {/* Marks & Grade Summary */}
      {team && (
        <Card className="p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-primary-600" /> Consolidated Marks & Weightage Breakdown
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center mb-6">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500">Guide (20%)</div>
              <div className="text-base font-bold text-gray-900">{team.guideMarks}/20</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500">Faculty (20%)</div>
              <div className="text-base font-bold text-gray-900">{team.facultyMarks}/20</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500">Review 1 (20%)</div>
              <div className="text-base font-bold text-gray-900">{team.review1Score}/100</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500">Review 2 (20%)</div>
              <div className="text-base font-bold text-gray-900">{team.review2Score}/100</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500">Review 3 (20%)</div>
              <div className="text-base font-bold text-gray-900">{team.review3Score}/100</div>
            </div>
          </div>

          <div className="p-4 bg-primary-50 border border-primary-200 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs text-primary-800 font-bold uppercase tracking-wider">Final Aggregated Score</div>
              <div className="text-2xl font-black text-primary-900">{team.finalScore} / 100 ({team.percentage}%)</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 rounded-lg bg-white font-extrabold text-primary-700 border border-primary-200 text-sm">
                Grade: {team.grade}
              </span>
              <span className={`px-3 py-1.5 rounded-lg font-extrabold text-sm ${team.passStatus === 'Pass' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                {team.passStatus}
              </span>
            </div>
          </div>
        </Card>
      )}

    </div>
  );
};

export default StudentEvaluationDetails;
