import React from 'react';
import Card from '@/components/common/Card';
import { Target, UserCheck, GraduationCap, UserCog, BookOpen } from 'lucide-react';

const TeamSummary = ({ teamData }) => {
  return (
    <Card title="Team Summary" icon={Target}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Department</p>
            <p className="text-sm font-medium text-gray-900">{teamData.department || 'N/A'} - {teamData.section || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Domain</p>
            <p className="text-sm font-medium text-gray-900">{teamData.project?.domain || 'General'}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-100">
            <div className="flex items-center">
              <UserCheck className="w-4 h-4 text-primary-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Guide</span>
            </div>
            <span className="text-sm font-bold text-gray-900">{teamData.guide?.name || 'Unassigned'}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-100">
            <div className="flex items-center">
              <GraduationCap className="w-4 h-4 text-emerald-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Faculty</span>
            </div>
            <span className="text-sm font-bold text-gray-900">{teamData.faculty?.name || 'Unassigned'}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-100">
            <div className="flex items-center">
              <UserCog className="w-4 h-4 text-indigo-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Reviewer</span>
            </div>
            <span className="text-sm font-bold text-gray-900">{teamData.reviewer?.name || 'Unassigned'}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-start">
            <BookOpen className="w-5 h-5 text-gray-400 mr-2 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Project Objective</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {teamData.project?.description || 'No description provided for this project.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TeamSummary;
