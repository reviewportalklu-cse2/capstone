import React, { useState, useEffect } from 'react';
import { roomService } from '../../firebase/services/roomService';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { Plus, Search, Edit2, Trash2, Home } from 'lucide-react';

const RoomManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      const data = await roomService.getAll();
      setRooms(data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRooms = rooms.filter(room => 
    room.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.building?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.capacity?.toString().includes(searchTerm)
  );

  const columns = [
    { header: 'Room Name', accessor: 'name' },
    { header: 'Building', accessor: 'building' },
    { header: 'Capacity', accessor: 'capacity' },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (row) => (
        <Badge variant={row.status === 'Available' ? 'success' : row.status === 'Maintenance' ? 'warning' : 'danger'}>
          {row.status || 'Available'}
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
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Room Management</h2>
          <p className="text-sm text-gray-500 mt-1">Manage university classrooms, labs, and halls</p>
        </div>
        <button className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
          <Plus className="w-4 h-4 mr-2" />
          Add Room
        </button>
      </div>

      <Card padding="p-0">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between bg-white/50">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search rooms..." 
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {(!isLoading && filteredRooms.length === 0 && searchTerm) ? (
          <EmptyState title="No rooms found" description={`No rooms match your search for "${searchTerm}"`} />
        ) : (!isLoading && rooms.length === 0) ? (
          <div className="py-8">
            <EmptyState icon={Home} title="No rooms yet" description="Get started by adding a new room." actionText="Add Room" />
          </div>
        ) : (
          <Table columns={columns} data={filteredRooms} isLoading={isLoading} />
        )}
      </Card>
    </div>
  );
};

export default RoomManagement;
