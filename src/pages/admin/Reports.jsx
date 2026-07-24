import React, { useState, useEffect } from 'react';
import { reportService } from '../../firebase/services/reportService';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { Search, Download, FileText, Eye } from 'lucide-react';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setIsLoading(true);
    const unsub = FirestoreService.subscribeAll('reports', (data) => {
      setReports(data || []);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching reports:', error);
      setIsLoading(false);
    });
    
    return () => {
      if (unsub) unsub();
    };
  }, []);

  const filteredReports = reports.filter(report => 
    report.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.author?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { header: 'Report Name', accessor: 'title' },
    { header: 'Author', accessor: 'author' },
    { header: 'Date Generated', accessor: 'date' },
    { 
      header: 'Format', 
      accessor: 'format',
      render: (row) => (
        <Badge variant={row.format === 'PDF' ? 'danger' : row.format === 'CSV' ? 'success' : 'primary'}>
          {row.format || 'Document'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex space-x-3">
          <button className="text-primary-600 hover:text-primary-800 transition-colors" title="View"><Eye className="w-4 h-4" /></button>
          <button className="text-gray-600 hover:text-gray-800 transition-colors" title="Download"><Download className="w-4 h-4" /></button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">System Reports</h2>
          <p className="text-sm text-gray-500 mt-1">View and download administrative and academic reports</p>
        </div>
        <button className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
          <Download className="w-4 h-4 mr-2" />
          Export All
        </button>
      </div>

      <Card padding="p-0">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between bg-white/50">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search reports..." 
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {(!isLoading && filteredReports.length === 0 && searchTerm) ? (
          <EmptyState title="No reports found" description={`No reports match your search for "${searchTerm}"`} />
        ) : (!isLoading && reports.length === 0) ? (
          <div className="py-8">
            <EmptyState icon={FileText} title="No reports available" description="Reports will appear here once they are generated." />
          </div>
        ) : (
          <Table columns={columns} data={filteredReports} isLoading={isLoading} />
        )}
      </Card>
    </div>
  );
};

export default Reports;
