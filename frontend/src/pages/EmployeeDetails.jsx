import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { 
  IoPerson, IoCalendar, IoCard, IoDocumentAttach, 
  IoArrowBack, IoCheckmarkCircle, IoCloudUpload, IoDocument, IoHardwareChip
} from 'react-icons/io5';

const EmployeeDetails = () => {
  const { id } = useParams();
  const toast = useToast();
  const { user } = useAuth();
  
  const [employee, setEmployee] = useState(null);
  const [balances, setBalances] = useState([]);
  const [assets, setAssets] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tab State
  const [activeTab, setActiveTab] = useState('profile');
  
  // Document Upload State
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState('profile_photo');
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchAllDetails = async () => {
    setLoading(true);
    try {
      const [empRes, balancesRes, docRes] = await Promise.all([
        apiClient.get(`/employees/${id}`),
        apiClient.get(`/leaves/balances/employee/${id}`),
        apiClient.get(`/employees/${id}/documents`)
      ]);
      
      if (empRes.data.status === 'success') {
        setEmployee(empRes.data.data.employee);
      }
      if (balancesRes.data.status === 'success') {
        setBalances(balancesRes.data.data.balances);
      }
      if (docRes.data.status === 'success') {
        setDocuments(docRes.data.data.documents);
      }

      // Fetch assets if manager/HR/admin
      if (user?.role !== 'employee') {
        const assetsRes = await apiClient.get('/assets', {
          params: { search: empRes.data.data.employee.full_name }
        });
        if (assetsRes.data.status === 'success') {
          // Filter down to active ones for this employee
          const filtered = assetsRes.data.data.assets.filter(
            a => a.employee_profile_id === id && !a.returned_at
          );
          setAssets(filtered);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load employee details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllDetails();
  }, [id]);

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('documentType', docType);

    try {
      const res = await apiClient.post(`/employees/${id}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (res.data.status === 'success') {
        toast.success('Document uploaded successfully');
        setSelectedFile(null);
        // Refresh documents list
        const docRes = await apiClient.get(`/employees/${id}/documents`);
        setDocuments(docRes.data.data.documents);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-8 rounded-2xl glass-panel text-center">
        <p className="text-slate-400 text-sm">Employee profile not found.</p>
        <Link to="/employees" className="mt-4 inline-flex items-center gap-1 text-xs text-indigo-400 hover:underline">
          <IoArrowBack /> Go back to directory
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Overview', icon: <IoPerson /> },
    { id: 'leaves', label: 'Leave Balances', icon: <IoCalendar /> },
    { id: 'assets', label: 'Company Assets', icon: <IoHardwareChip />, hide: user?.role === 'employee' },
    { id: 'docs', label: 'Documents & Vault', icon: <IoDocumentAttach /> },
  ];

  const profilePhotoDoc = documents.find(d => d.document_type === 'profile_photo');
  const avatarUrl = profilePhotoDoc ? `/uploads/${profilePhotoDoc.file_name}` : null;

  return (
    <div className="space-y-6">
      
      {/* 1. Profile Ribbon Header */}
      <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-2xl glass-panel border border-slate-800 shadow-glass">
        
        {/* Profile Picture */}
        <div className="w-24 h-24 flex-shrink-0 rounded-2xl bg-indigo-950 border border-slate-700 overflow-hidden flex items-center justify-center text-4xl text-indigo-400">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            employee.first_name[0] + employee.last_name[0]
          )}
        </div>

        {/* Profile Description */}
        <div className="text-center md:text-left flex-grow space-y-1">
          <h2 className="text-2xl font-bold text-white">{employee.full_name}</h2>
          <p className="text-sm text-indigo-400 font-semibold">{employee.designation}</p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-slate-400 pt-1.5">
            <span>Email: <b>{employee.email}</b></span>
            <span className="hidden sm:inline">•</span>
            <span>Department: <b>{employee.department_name || 'Unassigned'}</b></span>
          </div>
        </div>

        {/* Action Button */}
        <Link 
          to="/employees" 
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
        >
          <IoArrowBack />
          Back to Directory
        </Link>
      </div>

      {/* 2. Tabs Selector Ribbon */}
      <div className="flex border-b border-slate-800 gap-6">
        {tabs.filter(t => !t.hide).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 pb-4 text-xs font-semibold tracking-wide uppercase transition-colors relative ${
              activeTab === tab.id ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.icon}
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full"></span>
            )}
          </button>
        ))}
      </div>

      {/* 3. Tab Contents Rendering */}
      <div className="mt-6">
        
        {/* TAB 1: OVERVIEW DETAILS */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card Left: Profile Cards */}
            <div className="md:col-span-2 p-6 rounded-2xl glass-panel border border-slate-800 space-y-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Employee Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-500">First Name</span>
                  <p className="font-semibold text-slate-200">{employee.first_name}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500">Last Name</span>
                  <p className="font-semibold text-slate-200">{employee.last_name}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500">Phone Number</span>
                  <p className="font-semibold text-slate-200">{employee.phone || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500">Joined Date</span>
                  <p className="font-semibold text-slate-200">{new Date(employee.joined_date).toLocaleDateString()}</p>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <span className="text-slate-500">Home Address</span>
                  <p className="font-semibold text-slate-200">{employee.address || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Card Right: Corporate parameters */}
            <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-6 h-fit">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Employment Details</h3>
              <div className="space-y-4 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-slate-800/40">
                  <span className="text-slate-500">Base Salary</span>
                  <span className="font-bold text-slate-200 text-sm">${parseFloat(employee.salary).toLocaleString()}/yr</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800/40">
                  <span className="text-slate-500">System Role</span>
                  <span className="font-semibold text-indigo-400 capitalize">{employee.role}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800/40">
                  <span className="text-slate-500">Status</span>
                  <span className="flex items-center gap-1 font-semibold text-emerald-400">
                    <IoCheckmarkCircle />
                    Active
                  </span>
                </div>
              </div>

              {/* Skills Display tags */}
              <div className="space-y-3 pt-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Expertise Skills</span>
                <div className="flex flex-wrap gap-1.5">
                  {employee.skills && employee.skills.length > 0 ? (
                    employee.skills.map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300">
                        {s.skill_name} ({s.proficiency})
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">No skills declared yet.</span>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: LEAVE BALANCES */}
        {activeTab === 'leaves' && (
          <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Annual Leave ledger ({new Date().getFullYear()})</h3>
              <p className="text-xs text-slate-500 mt-1">Leave balances are allocated at the beginning of each calendar year.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {balances.map(b => {
                const available = b.total_days - b.used_days - b.pending_days;
                return (
                  <div key={b.id} className="p-5 rounded-2xl border border-slate-800 bg-slate-900/20 shadow-inner space-y-4">
                    <span className="text-xs font-semibold text-slate-300">{b.leave_type_name}</span>
                    <div className="grid grid-cols-3 text-center gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[9px] uppercase font-semibold text-slate-500 block">Total</span>
                        <span className="text-base font-bold text-slate-200">{b.total_days}</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] uppercase font-semibold text-slate-500 block">Used</span>
                        <span className="text-base font-bold text-slate-200">{b.used_days}</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] uppercase font-semibold text-slate-500 block">Available</span>
                        <span className="text-base font-bold text-emerald-400">{available}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: COMPANY ASSETS */}
        {activeTab === 'assets' && (
          <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Hardware Devices & Access Keys</h3>
            
            {assets.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/10 rounded-2xl border border-slate-800/40">
                No active asset allocations registered for this profile.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {assets.map(asset => (
                  <div key={asset.asset_id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/30">
                    <div className="p-3 rounded-lg bg-indigo-600/10 text-indigo-400 text-lg">
                      <IoHardwareChip />
                    </div>
                    <div className="space-y-0.5 text-xs">
                      <h4 className="font-semibold text-slate-200">{asset.asset_name}</h4>
                      <p className="text-[10px] text-slate-400">Type: {asset.asset_type} • Serial: {asset.serial_number}</p>
                      <p className="text-[9px] text-slate-500">Allocated: {new Date(asset.allocated_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: DOCUMENTS & UPLOADS */}
        {activeTab === 'docs' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Upload form */}
            <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-6 h-fit">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Upload Credentials</h3>
              <form onSubmit={handleFileUpload} className="space-y-4 text-xs">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-semibold text-slate-500">Document Type</label>
                  <select
                    value={docType}
                    onChange={e => setDocType(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-200 outline-none"
                  >
                    <option value="profile_photo">Profile Photo (Image)</option>
                    <option value="resume">Resume (PDF / DOC)</option>
                    <option value="certificates">Academic / Tech Certificate</option>
                    <option value="aadhar_card">National ID (Aadhar Card)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-semibold text-slate-500">Select File</label>
                  <input
                    type="file"
                    onChange={e => setSelectedFile(e.target.files[0])}
                    className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600/10 file:text-indigo-400 file:cursor-pointer hover:file:bg-indigo-600/20"
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-50 active:scale-95 transition-all shadow-glass-glow disabled:opacity-50"
                >
                  <IoCloudUpload />
                  {uploading ? 'Uploading File...' : 'Upload Attachment'}
                </button>

              </form>
            </div>

            {/* List uploaded docs */}
            <div className="md:col-span-2 p-6 rounded-2xl glass-panel border border-slate-800 space-y-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Vault Files Ledger</h3>
              
              {documents.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/10 rounded-2xl border border-slate-800/40">
                  No documents uploaded to this employee vault.
                </div>
              ) : (
                <div className="divide-y divide-slate-800/40 text-xs">
                  {documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <IoDocument className="text-lg text-slate-500" />
                        <div>
                          <p className="font-semibold text-slate-200">{doc.file_name}</p>
                          <p className="text-[9px] text-indigo-400 font-medium capitalize">{doc.document_type.replace('_', ' ')} • {(doc.file_size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <a 
                        href={`/uploads/${doc.file_name}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-indigo-400 hover:underline"
                      >
                        Download File
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default EmployeeDetails;
