import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { useToast } from '../context/ToastContext';
import { IoDocumentText, IoCloudDownload, IoList } from 'react-icons/io5';

const Reports = () => {
  const toast = useToast();

  const [reportType, setReportType] = useState('employee'); // employee, department, leave, asset, salary
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/dashboard/reports', {
        params: { reportType }
      });
      if (res.data.status === 'success') {
        setData(res.data.data.report);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [reportType]);

  // Client-Side CSV Compiler & Download trigger
  const exportToCSV = () => {
    if (data.length === 0) {
      toast.error('No data available to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvRows = [];

    // 1. Add headers row
    csvRows.push(headers.join(','));

    // 2. Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        const escaped = ('' + (row[header] || '')).replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    // 3. Trigger download
    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportType}_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`${reportType.toUpperCase()} report exported successfully to CSV`);
  };

  const getReportHeaders = () => {
    switch (reportType) {
      case 'employee':
        return ['First Name', 'Last Name', 'Email', 'Designation', 'Department', 'Joined Date'];
      case 'department':
        return ['Name', 'Description', 'Total Employees', 'Salary Budget'];
      case 'leave':
        return ['Employee Name', 'Department', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status'];
      case 'asset':
        return ['Asset Name', 'Type', 'Serial Number', 'Status', 'Allocated To', 'Allocated Date'];
      case 'salary':
        return ['First Name', 'Last Name', 'Designation', 'Department', 'Annual Salary'];
      default:
        return [];
    }
  };

  const tabs = [
    { id: 'employee', label: 'Employees Catalog' },
    { id: 'department', label: 'Departments Budget' },
    { id: 'leave', label: 'Time-Off Log' },
    { id: 'asset', label: 'Hardware Inventory' },
    { id: 'salary', label: 'Salary Ledger' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Reports Center</h2>
          <p className="text-xs text-slate-400">Compile database audits and export spreadsheets locally.</p>
        </div>
        
        <button
          onClick={exportToCSV}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-white shadow-glass-glow self-start sm:self-auto"
        >
          <IoCloudDownload />
          Export Report to CSV
        </button>
      </div>

      {/* Selector Ribbon */}
      <div className="flex flex-wrap border-b border-slate-800 gap-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id)}
            className={`flex items-center gap-2 pb-4 text-xs font-semibold tracking-wide uppercase transition-colors relative ${
              reportType === tab.id ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <IoDocumentText />
            {tab.label}
            {reportType === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full"></span>
            )}
          </button>
        ))}
      </div>

      {/* Spreadsheet Tables */}
      <div className="rounded-2xl glass-panel border border-slate-800 shadow-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-900/30 text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                {getReportHeaders().map((header, idx) => (
                  <th key={idx} className="px-6 py-4">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={getReportHeaders().length} className="px-6 py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={getReportHeaders().length} className="px-6 py-8 text-center text-slate-500 font-medium">
                    No ledger records found for this report type.
                  </td>
                </tr>
              ) : (
                data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/45 transition-colors">
                    {Object.keys(row).map((key, valIdx) => {
                      const val = row[key];
                      return (
                        <td key={valIdx} className="px-6 py-4 text-slate-300 font-medium">
                          {key === 'salary' || key === 'total_salary' || key === 'total_payroll' || key === 'total_payroll_cost' ? (
                            `$${parseFloat(val || 0).toLocaleString()}`
                          ) : key === 'joined_date' || key === 'allocated_at' || key === 'start_date' || key === 'end_date' ? (
                            new Date(val).toLocaleDateString()
                          ) : (
                            '' + (val || '-')
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Reports;
