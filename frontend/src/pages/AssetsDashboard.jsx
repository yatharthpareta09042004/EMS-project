import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { 
  IoHardwareChip, IoAdd, IoPersonAdd, IoReturnDownBack, IoSearch, 
  IoFilter, IoClose, IoChevronBack, IoChevronForward, IoTime
} from 'react-icons/io5';

const AssetsDashboard = () => {
  const toast = useToast();
  const { user } = useAuth();

  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals state
  const [addAssetModalOpen, setAddAssetModalOpen] = useState(false);
  const [assignAssetModalOpen, setAssignAssetModalOpen] = useState(false);
  const [returnAssetModalOpen, setReturnAssetModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  // Form states
  const [newAsset, setNewAsset] = useState({ name: '', assetType: 'Laptop', serialNumber: '' });
  const [allocation, setAllocation] = useState({ employeeProfileId: '', conditionOnAllocation: '' });
  const [returnCondition, setReturnCondition] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      if (user?.role === 'employee') {
        const res = await apiClient.get('/assets/me');
        if (res.data.status === 'success') {
          setAssets(res.data.data.assets);
        }
      } else {
        const res = await apiClient.get('/assets', {
          params: { search, status: statusFilter || undefined, assetType: typeFilter || undefined }
        });
        if (res.data.status === 'success') {
          setAssets(res.data.data.assets);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load asset inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeesList = async () => {
    if (user?.role === 'employee') return;
    try {
      const res = await apiClient.get('/employees', { params: { limit: 100 } });
      if (res.data.status === 'success') {
        setEmployees(res.data.data.employees);
      }
    } catch (err) {
      console.error('Failed to load employees for asset matching', err);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [search, statusFilter, typeFilter]);

  useEffect(() => {
    fetchEmployeesList();
  }, []);

  const handleAddAsset = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiClient.post('/assets', newAsset);
      if (res.data.status === 'success') {
        toast.success('Asset registered successfully');
        setAddAssetModalOpen(false);
        setNewAsset({ name: '', assetType: 'Laptop', serialNumber: '' });
        fetchAssets();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add asset');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAllocateAsset = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiClient.put(`/assets/${selectedAsset.asset_id}/allocate`, allocation);
      if (res.data.status === 'success') {
        toast.success('Asset successfully allocated');
        setAssignAssetModalOpen(false);
        setAllocation({ employeeProfileId: '', conditionOnAllocation: '' });
        fetchAssets();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to allocate asset');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturnAsset = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiClient.put(`/assets/${selectedAsset.asset_id}/return`, {
        conditionOnReturn: returnCondition
      });
      if (res.data.status === 'success') {
        toast.success('Asset returned successfully');
        setReturnAssetModalOpen(false);
        setReturnCondition('');
        fetchAssets();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to return asset');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'allocated':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'under_repair':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Asset Registry</h2>
          <p className="text-xs text-slate-400">Track and allocate corporate laptops, network access tokens, and cards.</p>
        </div>
        
        {user?.role !== 'employee' && user?.role !== 'manager' && (
          <button
            onClick={() => setAddAssetModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-white shadow-glass-glow self-start sm:self-auto"
          >
            <IoAdd className="text-sm" />
            Add New Asset
          </button>
        )}
      </div>

      {user?.role === 'employee' ? (
        /* Employee view: show cards of assigned hardware */
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 shadow-glass">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Assigned Company Assets</h3>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
          ) : assets.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/10 rounded-2xl border border-slate-800/40">
              No assets are currently allocated to your account.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {assets.map(asset => (
                <div key={asset.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/15">
                  <div className="p-3 rounded-lg bg-indigo-600/10 text-indigo-400 text-lg border border-indigo-500/10">
                    <IoHardwareChip />
                  </div>
                  <div className="space-y-0.5 text-xs">
                    <h4 className="font-bold text-slate-200">{asset.name}</h4>
                    <p className="text-[10px] text-slate-400">Type: {asset.asset_type} • Serial: {asset.serial_number}</p>
                    <p className="text-[9px] text-indigo-400/80">Condition: {asset.condition_on_allocation}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Admin/Manager/HR list directory */
        <div className="space-y-6">
          
          {/* Filters Panel */}
          <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl glass-panel border border-slate-800">
            <div className="relative flex-grow">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500 pointer-events-none">
                <IoSearch />
              </span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by asset name or serial number..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-slate-250 outline-none"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="pl-3 pr-8 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-300 outline-none"
              >
                <option value="">All Statuses</option>
                <option value="available">Available</option>
                <option value="allocated">Allocated</option>
                <option value="under_repair">Under Repair</option>
              </select>
              
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="pl-3 pr-8 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-300 outline-none"
              >
                <option value="">All Types</option>
                <option value="Laptop">Laptop</option>
                <option value="Monitor">Monitor</option>
                <option value="Mouse">Mouse</option>
                <option value="Access Card">Access Card</option>
                <option value="ID Card">ID Card</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl glass-panel border border-slate-800 shadow-glass overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-900/30 text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                    <th className="px-6 py-4">Asset Detail</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Serial Number</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Current Allocation</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                        <div className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
                      </td>
                    </tr>
                  ) : assets.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-slate-500 font-medium">
                        No assets catalogued matching criteria.
                      </td>
                    </tr>
                  ) : (
                    assets.map(asset => (
                      <tr key={asset.asset_id} className="hover:bg-slate-900/45 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-200">{asset.asset_name}</td>
                        <td className="px-6 py-4 text-slate-400">{asset.asset_type}</td>
                        <td className="px-6 py-4 text-slate-300 font-mono font-medium">{asset.serial_number}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-semibold capitalize ${getStatusStyle(asset.asset_status)}`}>
                            {asset.asset_status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {asset.allocated_to_name ? (
                            <div>
                              <div className="font-semibold text-slate-300">{asset.allocated_to_name}</div>
                              <div className="text-[9px] text-slate-500">Since {new Date(asset.allocated_at).toLocaleDateString()}</div>
                            </div>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {asset.asset_status === 'available' && user?.role !== 'manager' && (
                              <button
                                onClick={() => { setSelectedAsset(asset); setAssignAssetModalOpen(true); }}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/15"
                                title="Allocate"
                              >
                                <IoPersonAdd /> Assign
                              </button>
                            )}
                            {asset.asset_status === 'allocated' && user?.role !== 'manager' && (
                              <button
                                onClick={() => { setSelectedAsset(asset); setReturnAssetModalOpen(true); }}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/15"
                                title="Return"
                              >
                                <IoReturnDownBack /> Return
                              </button>
                            )}
                            {asset.asset_status !== 'available' && asset.asset_status !== 'allocated' && (
                              <span className="text-[10px] text-slate-500">Under Repair</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* MODAL 1: ADD ASSET */}
      {addAssetModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl glass-panel border border-slate-800 p-6 shadow-glass animate-zoom-in">
            <button onClick={() => setAddAssetModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <IoClose className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Register Asset Item</h3>
            <form onSubmit={handleAddAsset} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-semibold text-slate-500">Asset Name</label>
                <input
                  type="text"
                  required
                  value={newAsset.name}
                  onChange={e => setNewAsset({ ...newAsset, name: e.target.value })}
                  placeholder="e.g. MacBook Pro M3"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-905 border border-slate-800 text-slate-200 outline-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-semibold text-slate-500">Asset Type</label>
                  <select
                    value={newAsset.assetType}
                    onChange={e => setNewAsset({ ...newAsset, assetType: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-905 border border-slate-800 text-slate-200 outline-none"
                  >
                    <option value="Laptop">Laptop</option>
                    <option value="Monitor">Monitor</option>
                    <option value="Mouse">Mouse</option>
                    <option value="Access Card">Access Card</option>
                    <option value="ID Card">ID Card</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-semibold text-slate-500">Serial Number</label>
                  <input
                    type="text"
                    required
                    value={newAsset.serialNumber}
                    onChange={e => setNewAsset({ ...newAsset, serialNumber: e.target.value })}
                    placeholder="e.g. SN-981-88"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-905 border border-slate-800 text-slate-200 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-glass-glow disabled:opacity-50"
              >
                {submitting ? 'Registering...' : 'Register Asset Item'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ASSIGN ASSET */}
      {assignAssetModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl glass-panel border border-slate-800 p-6 shadow-glass animate-zoom-in">
            <button onClick={() => setAssignAssetModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <IoClose className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Assign Asset Allocation</h3>
            <p className="text-[10px] text-slate-500 mb-4">Device: <b>{selectedAsset?.asset_name} ({selectedAsset?.serial_number})</b></p>
            
            <form onSubmit={handleAllocateAsset} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-semibold text-slate-500">Assign To Employee</label>
                <select
                  required
                  value={allocation.employeeProfileId}
                  onChange={e => setAllocation({ ...allocation, employeeProfileId: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-905 border border-slate-800 text-slate-200 outline-none"
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.employee_profile_id} value={emp.employee_profile_id}>
                      {emp.full_name} ({emp.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-semibold text-slate-500">Condition on Allocation</label>
                <textarea
                  required
                  value={allocation.conditionOnAllocation}
                  onChange={e => setAllocation({ ...allocation, conditionOnAllocation: e.target.value })}
                  placeholder="e.g. Brand new condition, sealed box."
                  rows="3"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-905 border border-slate-800 text-slate-200 outline-none resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-glass-glow"
              >
                {submitting ? 'Allocating...' : 'Confirm Device Allocation'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RETURN ASSET */}
      {returnAssetModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl glass-panel border border-slate-800 p-6 shadow-glass animate-zoom-in">
            <button onClick={() => setReturnAssetModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <IoClose className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Process Device Return</h3>
            <p className="text-[10px] text-slate-500 mb-4">Device: <b>{selectedAsset?.asset_name} ({selectedAsset?.serial_number})</b></p>
            
            <form onSubmit={handleReturnAsset} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-semibold text-slate-500">Condition on Return</label>
                <textarea
                  required
                  value={returnCondition}
                  onChange={e => setReturnCondition(e.target.value)}
                  placeholder="e.g. Returned with normal wear and tear, no chassis damage."
                  rows="3"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-905 border border-slate-800 text-slate-200 outline-none resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-glass-glow"
              >
                {submitting ? 'Processing Return...' : 'Confirm Return Closure'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AssetsDashboard;
