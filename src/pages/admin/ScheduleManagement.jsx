import React, { useState, useEffect } from 'react';
import { scheduleService } from '../../firebase/services/scheduleService';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { Plus, Search, Edit2, Trash2, Calendar } from 'lucide-react';

const ScheduleManagement = () => {
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setIsLoading(true);
      const data = await scheduleService.getAll();
      setSchedules(data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSchedules = schedules.filter(schedule => 
    schedule.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    schedule.facultyName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { header: 'Title', accessor: 'title' },
    { header: 'Faculty', accessor: 'facultyName' },
    { header: 'Date', accessor: 'date' },
    { header: 'Time', accessor: 'time' },
    { 
      header: 'Type', 
      accessor: 'type',
      render: (row) => (
        <Badge variant={row.type === 'Exam' ? 'danger' : row.type === 'Lecture' ? 'primary' : 'default'}>
          {row.type || 'General'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex space-x-3">
          <button className="text-primary-600 hover:text-primary-800 transition-colors"><Edit2 className="w-4 h-4" /></button>
          <button className="text-danger hover:text-danger/80 transition-colors"><Trash2 className="w-4 h-4" /></button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Schedule Management</h2>
          <p className="text-sm text-gray-500 mt-1">Manage academic calendars, exams, and classes</p>
        </div>
        <button className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
          <Plus className="w-4 h-4 mr-2" />
          Create Schedule
        </button>
      </div>

      <Card padding="p-0">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between bg-white/50">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search schedules..." 
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {(!isLoading && filteredSchedules.length === 0 && searchTerm) ? (
          <EmptyState title="No schedules found" description={`No schedules match your search for "${searchTerm}"`} />
        ) : (!isLoading && schedules.length === 0) ? (
          <div className="py-8">
            <EmptyState icon={Calendar} title="No schedules yet" description="Get started by creating a new schedule." actionText="Create Schedule" />
          </div>
        ) : (
          <Table columns={columns} data={filteredSchedules} isLoading={isLoading} />
        )}
      </Card>
    </div>
  );
};

export default ScheduleManagement;
