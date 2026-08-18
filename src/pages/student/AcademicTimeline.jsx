import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { studentNavigation } from '@/constants/navigation';
import Card from '@/components/common/Card';
import { useStudentAnalytics } from '@/hooks/useStudentAnalytics';
import { Loader2, Calendar, Target, BookOpen, Users, Clock, History } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';

const AcademicTimeline = () => {
  const { getStudentTimeline, dataLoading } = useStudentAnalytics();
  const timelineEvents = getStudentTimeline();

  if (dataLoading) {
    return (
      <DashboardLayout navigationItems={studentNavigation} title="Academic Timeline">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  const getEventIcon = (type) => {
    switch(type) {
      case 'team': return <Users className="w-5 h-5 text-blue-600" />;
      case 'project': return <Target className="w-5 h-5 text-emerald-600" />;
      case 'evaluation': return <BookOpen className="w-5 h-5 text-amber-600" />;
      case 'reviewer': return <History className="w-5 h-5 text-purple-600" />;
      default: return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getEventColor = (type) => {
    switch(type) {
      case 'team': return 'bg-blue-100 border-blue-200';
      case 'project': return 'bg-emerald-100 border-emerald-200';
      case 'evaluation': return 'bg-amber-100 border-amber-200';
      case 'reviewer': return 'bg-purple-100 border-purple-200';
      default: return 'bg-gray-100 border-gray-200';
    }
  };

  return (
    <DashboardLayout navigationItems={studentNavigation} title="Academic Timeline">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
            <History className="w-6 h-6 text-primary-600" /> Academic Timeline
          </h1>
          <p className="text-gray-600">A chronological record of your academic capstone journey, including team formation, reviews, and reviewer assignments.</p>
        </div>

        <Card className="shadow-sm">
          {timelineEvents && timelineEvents.length > 0 ? (
            <div className="relative border-l-2 border-gray-200 ml-4 py-4 space-y-8">
              {timelineEvents.map((event, index) => (
                <div key={index} className="relative pl-8">
                  {/* Timeline Dot */}
                  <span className={`absolute -left-[17px] top-1 h-8 w-8 rounded-full ring-4 ring-white flex items-center justify-center border ${getEventColor(event.type)}`}>
                    {getEventIcon(event.type)}
                  </span>
                  
                  <div className="bg-gray-50 border border-gray-100 p-4 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
                      <h4 className="text-lg font-bold text-gray-900">{event.title}</h4>
                      <span className="text-sm font-medium text-gray-500 flex items-center gap-1 mt-1 sm:mt-0 bg-white px-2 py-1 rounded border border-gray-200">
                        <Calendar className="w-3 h-3" /> {new Date(event.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700">{event.details}</p>
                  </div>
                </div>
              ))}
              
              {/* Start Node */}
              <div className="relative pl-8 pt-4">
                <span className="absolute -left-[9px] top-5 h-4 w-4 bg-gray-300 rounded-full ring-4 ring-white border border-gray-400"></span>
                <p className="text-sm text-gray-500 font-bold uppercase tracking-widest ml-2">Journey Started</p>
              </div>
            </div>
          ) : (
            <div className="py-12">
              <EmptyState 
                icon={History}
                title="No Events Recorded"
                description="Your academic timeline will automatically populate as your journey progresses."
              />
            </div>
          )}
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default AcademicTimeline;
