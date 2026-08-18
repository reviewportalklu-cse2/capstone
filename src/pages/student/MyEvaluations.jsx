import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { studentNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import { useStudentAnalytics } from '@/hooks/useStudentAnalytics';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Calendar, ChevronRight, CheckCircle, Loader2 } from 'lucide-react';

const MyEvaluations = () => {
  const { getStudentEvaluations, dataLoading } = useStudentAnalytics();
  const navigate = useNavigate();
  const evaluations = getStudentEvaluations();

  if (dataLoading) {
    return (
      <DashboardLayout navigationItems={studentNavigation} title="My Evaluations">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigationItems={studentNavigation} title="My Evaluations">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-primary-900 to-primary-800 p-8 rounded-xl shadow-lg text-white">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <BookOpen className="w-8 h-8" /> Evaluation History
          </h1>
          <p className="text-primary-100">Chronological record of all your submitted formal reviews.</p>
        </div>

        {evaluations && evaluations.length > 0 ? (
          <div className="space-y-4">
            {evaluations.map((ev, index) => (
              <Card key={ev.id || index} className="hover:shadow-md transition-shadow border-l-4 border-l-primary-500">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-bold text-gray-900">{ev.cycleName}</h3>
                      <Badge variant="success">Completed</Badge>
                    </div>
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> {new Date(ev.date).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex flex-col md:flex-row items-center gap-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 uppercase font-semibold">Total Score</p>
                      <p className="text-2xl font-black text-gray-900">{ev.totalScore}</p>
                    </div>
                    
                    <Button 
                      variant="primary"
                      onClick={() => navigate(`/student/evaluations/${ev.id}`)}
                      className="w-full md:w-auto"
                    >
                      View Details <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="py-12 border-dashed border-2">
            <EmptyState 
              icon={CheckCircle}
              title="No Evaluations Found"
              description="You have not been evaluated for any review cycles yet."
            />
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyEvaluations;
