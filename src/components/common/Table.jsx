import React, { useState, useMemo } from 'react';
import { Inbox, Search, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';

const Table = ({ columns, data = [], keyField = 'id', isLoading = false, enableSearch = true, enablePagination = true, itemsPerPage = 5 }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Handle Sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filter & Sort Data
  const processedData = useMemo(() => {
    let filteredData = [...data];

    // Search
    if (searchTerm) {
      const lowercasedSearch = searchTerm.toLowerCase();
      filteredData = filteredData.filter((item) => {
        return Object.values(item).some(
          (val) => String(val).toLowerCase().includes(lowercasedSearch)
        );
      });
    }

    // Sort
    if (sortConfig.key !== null) {
      filteredData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredData;
  }, [data, searchTerm, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const currentData = enablePagination 
    ? processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : processedData;

  // Reset to page 1 on search
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="w-full">
      {enableSearch && (
        <div className="mb-4 relative max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm bg-white">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-surface-dim border-b border-gray-100">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  scope="col"
                  className={`px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider sticky top-0 ${column.accessor ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''}`}
                  onClick={() => column.accessor && handleSort(column.accessor)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.header}</span>
                    {sortConfig.key === column.accessor && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 text-primary-500" /> : <ChevronDown className="h-4 w-4 text-primary-500" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    <span className="text-sm font-semibold text-gray-500">Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : currentData.length > 0 ? (
              currentData.map((row, rowIndex) => (
                <tr 
                  key={row[keyField] || rowIndex} 
                  className="hover:bg-primary-50/50 transition-colors duration-200 ease-in-out group"
                >
                  {columns.map((column, colIndex) => (
                    <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                      {column.render ? column.render(row, rowIndex) : row[column.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-400 space-y-4">
                    <div className="bg-gray-50 p-4 rounded-full shadow-inner">
                      <Inbox className="h-10 w-10 text-gray-300" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-500">No records found</p>
                      <p className="text-xs font-medium text-gray-400 mt-1">Adjust your search or filters to find what you're looking for.</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {enablePagination && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <div className="text-sm text-gray-500 font-medium">
            Showing <span className="font-semibold text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(currentPage * itemsPerPage, processedData.length)}</span> of <span className="font-semibold text-gray-900">{processedData.length}</span> results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;
