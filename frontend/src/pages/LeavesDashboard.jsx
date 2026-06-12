import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { 
  IoCalendar, IoHourglass, IoCheckmarkCircle, IoCloseCircle, 
  IoAdd, IoCheckmark, IoClose, IoChatboxEllipses, IoList
} from 'react-icons/io5';

const LeavesDashboard = () => {
  const toast = useToast();
  const { user } = useAuth();

  const [balances, setBalances] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Leave Form State
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Tab State (For Managers/HR)
  const [viewTab, setViewTab] = useState('my-leaves'); // my-leaves, approvals

  // Approval Modal State
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [approveAction, setApproveAction] = useState('approve'); // approve, reject
  const [comments, setComments] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const typesRes = await apiClient.get('/leaves/types');
      if (typesRes.data.status === 'success') {
        setLeaveTypes(typesRes.data.data.leaveTypes);
      }

      // Fetch my leave balances
      const balancesRes = await apiClient.get('/leaves/balances/me');
      if (balancesRes.data.status === 'success') {
        setBalances(balancesRes.data.data.balances);
      }

      // Fetch applications list depending on current tab
      await fetchApplicationsList();
    } catch (err) {
      console.error(err);
      toast.error('Failed to load leave records');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicationsList = async () => {
    try {
      let params = {};
      
      // If we are looking at approvals, we fetch all pending items in the system
      if (viewTab === 'approvals') {
        params.status = undefined; // fetch all, including history or pending
      }

      const appsRes = await apiClient.get('/leaves/applications', { params });
      if (appsRes.data.status === 'success') {
        setApplications(appsRes.data.data.applications);
      }
    } catch (err) {
      console.error('Failed to load leave applications', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [viewTab]);

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!leaveTypeId || !startDate || !endDate || !reason) {
      toast.error('Please fill out all fields');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.post('/leaves/applications/apply', {
        leaveTypeId: parseInt(leaveTypeId),
        startDate,
        endDate,
        reason
      });

      if (res.data.status === 'success') {
        toast.success('Leave application submitted successfully');
        setLeaveTypeId('');
        setStartDate('');
        setEndDate('');
        setReason('');
        // Refresh
        fetchDashboardData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const openApprovalModal = (appId, action) => {
    setSelectedAppId(appId);
    setApproveAction(action);
    setComments('');
    setApprovalModalOpen(true);
  };

  const handleProcessLeave = async () => {
    setActionLoading(true);
    try {
      const res = await apiClient.put(`/leaves/applications/${selectedAppId}/approve`, {
        action: approveAction, // approve, reject
        comments
      });

      if (res.data.status === 'success') {
        toast.success(`Leave request successfully ${approveAction}ed`);
        setApprovalModalOpen(false);
        fetchApplicationsList();
        
        // Refresh balance if active
        const balancesRes = await apiClient.get('/leaves/balances/me');
        if (balancesRes.data.status === 'success') {
          setBalances(balancesRes.data.data.balances);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process leave approval');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400"><IoCheckmarkCircle /> Approved</span>;
      case 'rejected':
        return <span className="flex items-center gap-1 text-[10px] font-semibold text-rose-400"><IoCloseCircle /> Rejected</span>;
      case 'pending_manager':
        return <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400"><IoHourglass /> Pending Manager</span>;
      case 'pending_hr':
        return <span className="flex items-center gap-1 text-[10px] font-semibold text-indigo-400"><IoHourglass /> Pending HR</span>;
      default:
        return <span className="text-slate-400">{status}</span>;
    }
  };

  const canApprove = (app) => {
    if (app.status === 'pending_manager' && user?.role === 'manager') return true;
    if (app.status === 'pending_hr' && (user?.role === 'hr' || user?.role === 'admin')) return true;
    // Admin bypass
    if (user?.role === 'admin' && app.status.startsWith('pending')) return true;
    return false;
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Leave Planner</h2>
          <p className="text-xs text-slate-400">Request annual time-off and audit team vacancy approvals.</p>
        </div>

        {/* Tab Selector for Approvers */}
        {user?.role !== 'employee' && (
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl w-fit">
            <button
              onClick={() => setViewTab('my-leaves')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                viewTab === 'my-leaves' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              My Leaves
            </button>
            <button
              onClick={() => setViewTab('approvals')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                viewTab === 'approvals' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Team Approvals
            </button>
          </div>
        )}
      </div>

      {viewTab === 'my-leaves' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left Panel: Apply & Balances */}
          <div className="space-y-6">
            
            {/* 1. Apply Leave Form */}
            <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4 shadow-glass">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Apply for Leave</h3>
              <form onSubmit={handleApplyLeave} className="space-y-4 text-xs">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-semibold text-slate-400">Leave Type</label>
                  <select
                    value={leaveTypeId}
                    onChange={e => setLeaveTypeId(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-200 outline-none"
                    required
                  >
                    <option value="">Select Leave Type</option>
                    {leaveTypes.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-semibold text-slate-400">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-200 outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-semibold text-slate-400">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-200 outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-semibold text-slate-400">Reason for Request</label>
                  <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    rows="3"
                    placeholder="Provide description..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-200 outline-none resize-none"
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-50 active:scale-95 transition-all shadow-glass-glow disabled:opacity-50"
                >
                  <IoAdd className="text-sm" />
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>

              </form>
            </div>

            {/* 2. Balances Quick View */}
            <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-4">
              <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Leave Balances</h3>
              <div className="space-y-3">
                {balances.map(b => (
                  <div key={b.id} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-800/40 last:border-b-0">
                    <span className="text-slate-400">{b.leave_type_name}</span>
                    <span className="font-bold text-slate-200">{b.total_days - b.used_days - b.pending_days} available</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Panel: Applications History List */}
          <div className="md:col-span-2 p-6 rounded-2xl glass-panel border border-slate-800 shadow-glass">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Leave Applications History</h3>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
              </div>
            ) : applications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/10 rounded-2xl border border-slate-800/40">
                You have not submitted any leave applications yet.
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map(app => (
                  <div key={app.leave_application_id} className="p-4 rounded-xl border border-slate-800 bg-slate-900/15 flex justify-between items-start">
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">{app.leave_type_name}</span>
                        <span>•</span>
                        <span className="text-slate-400">{app.requested_days} Days</span>
                      </div>
                      <p className="text-slate-400">{new Date(app.start_date).toLocaleDateString()} to {new Date(app.end_date).toLocaleDateString()}</p>
                      <p className="text-[10px] text-slate-500 italic">" {app.reason} "</p>
                    </div>
                    <div>{getStatusBadge(app.status)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      ) : (
        /* Team Approvals Panel (For Admin/HR/Manager) */
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 shadow-glass">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Pending Team Leaves</h3>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
          ) : applications.filter(a => a.status.startsWith('pending')).length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/10 rounded-2xl border border-slate-800/40">
              No pending leave approvals in your queue right now.
            </div>
          ) : (
            <div className="space-y-4">
              {applications.filter(a => a.status.startsWith('pending')).map(app => (
                <div key={app.leave_application_id} className="p-5 rounded-xl border border-slate-850 bg-slate-900/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{app.employee_name}</span>
                      <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[9px] text-indigo-400">{app.department_name}</span>
                    </div>
                    <p className="text-slate-300 font-semibold">{app.leave_type_name} ({app.requested_days} Days)</p>
                    <p className="text-slate-400">{new Date(app.start_date).toLocaleDateString()} to {new Date(app.end_date).toLocaleDateString()}</p>
                    <p className="text-[10px] text-slate-500 italic mt-1 bg-slate-905 p-2 rounded-lg border border-slate-800/30">" {app.reason} "</p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <div className="text-right hidden sm:block mr-2">
                      <p className="text-[10px] text-slate-500">Currently pending at</p>
                      {getStatusBadge(app.status)}
                    </div>

                    {canApprove(app) ? (
                      <>
                        <button
                          onClick={() => openApprovalModal(app.leave_application_id, 'approve')}
                          className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition-all"
                        >
                          <IoCheckmark /> Approve
                        </button>
                        <button
                          onClick={() => openApprovalModal(app.leave_application_id, 'reject')}
                          className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 transition-all"
                        >
                          <IoClose /> Reject
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-medium">Locked (Needs other role approval)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Approval dialog comments Modal */}
      {approvalModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl glass-panel border border-slate-800 shadow-glass p-6 animate-zoom-in">
            <button onClick={() => setApprovalModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <IoClose className="w-5 h-5" />
            </button>
            
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
              Confirm {approveAction === 'approve' ? 'Approval' : 'Rejection'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">You can provide optional reviewer feedback notes below.</p>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-semibold text-slate-500">Reviewer Notes</label>
                <textarea
                  value={comments}
                  onChange={e => setComments(e.target.value)}
                  rows="3"
                  placeholder="Enter comments..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-905 border border-slate-800 text-slate-200 outline-none resize-none"
                ></textarea>
              </div>

              <button
                onClick={handleProcessLeave}
                disabled={actionLoading}
                className={`flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl font-semibold text-xs text-white transition-all shadow-glass-glow ${
                  approveAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {actionLoading ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Confirm Review Action
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LeavesDashboard;
