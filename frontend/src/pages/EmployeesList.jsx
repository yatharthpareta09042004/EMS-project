import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { 
  IoSearch, IoFilter, IoAdd, IoTrash, IoEye, 
  IoChevronBack, IoChevronForward, IoClose, IoArrowForward
} from 'react-icons/io5';

const EmployeesList = () => {
  const toast = useToast();
  const { user } = useAuth();
  
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [limit] = useState(10);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('full_name');
  const [sortOrder, setSortOrder] = useState('ASC');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'employee',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    salary: 50000,
    designation: '',
    departmentId: '',
    skillsInput: ''
  });

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const offset = (page - 1) * limit;
      const res = await apiClient.get('/employees', {
        params: {
          search,
          departmentId: deptFilter || undefined,
          limit,
          offset,
          sortBy,
          sortOrder
        }
      });
      if (res.data.status === 'success') {
        setEmployees(res.data.data.employees);
        setTotal(res.data.total);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load employee directory');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await apiClient.get('/employees/departments/list');
      if (res.data.status === 'success') {
        setDepartments(res.data.data.departments);
      }
    } catch (err) {
      console.error('Failed to load departments', err);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search, deptFilter, page, sortBy, sortOrder]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
    setPage(1);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you absolutely sure you want to delete this employee? This will purge their user account and all profiles.')) {
      return;
    }

    try {
      const res = await apiClient.delete(`/employees/${id}`);
      if (res.data.status === 'success') {
        toast.success('Employee deleted successfully');
        fetchEmployees();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete employee');
    }
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Parse skills: "React, Node.js" -> [{ name: 'React', proficiencyLevel: 'intermediate' }, ...]
      const parsedSkills = formData.skillsInput
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(name => ({
          name,
          proficiencyLevel: 'intermediate'
        }));

      const payload = {
        email: formData.email,
        password: formData.password,
        role: formData.role,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || null,
        address: formData.address || null,
        salary: parseFloat(formData.salary || 0),
        designation: formData.designation,
        departmentId: formData.departmentId ? parseInt(formData.departmentId) : null,
        skills: parsedSkills
      };

      const res = await apiClient.post('/employees', payload);
      if (res.data.status === 'success') {
        toast.success('Employee created successfully');
        setModalOpen(false);
        setFormData({
          email: '',
          password: '',
          role: 'employee',
          firstName: '',
          lastName: '',
          phone: '',
          address: '',
          salary: 50000,
          designation: '',
          departmentId: '',
          skillsInput: ''
        });
        fetchEmployees();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create employee profile');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Employee Directory</h2>
          <p className="text-xs text-slate-400">Search, manage, and audit corporate staffing credentials.</p>
        </div>
        {user?.role !== 'manager' && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-white shadow-glass-glow self-start md:self-auto"
          >
            <IoAdd className="text-sm" />
            Add New Employee
          </button>
        )}
      </div>

      {/* 2. Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl glass-panel border border-slate-800">
        
        {/* Search */}
        <div className="relative flex-grow">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500 pointer-events-none">
            <IoSearch />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, email, or designation..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-200 outline-none transition-all"
          />
        </div>

        {/* Dept Filter */}
        <div className="relative sm:w-64">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500 pointer-events-none">
            <IoFilter />
          </span>
          <select
            value={deptFilter}
            onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-200 outline-none transition-all appearance-none"
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

      </div>

      {/* 3. Table Catalog */}
      <div className="rounded-2xl glass-panel border border-slate-800 shadow-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-900/35 text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => handleSort('full_name')}>
                  Name {sortBy === 'full_name' && (sortOrder === 'ASC' ? '▲' : '▼')}
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => handleSort('designation')}>
                  Designation {sortBy === 'designation' && (sortOrder === 'ASC' ? '▲' : '▼')}
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => handleSort('department_name')}>
                  Department {sortBy === 'department_name' && (sortOrder === 'ASC' ? '▲' : '▼')}
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => handleSort('joined_date')}>
                  Joined Date {sortBy === 'joined_date' && (sortOrder === 'ASC' ? '▲' : '▼')}
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => handleSort('salary')}>
                  Salary {sortBy === 'salary' && (sortOrder === 'ASC' ? '▲' : '▼')}
                </th>
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
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500 font-medium">
                    No employees matching your criteria.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.employee_profile_id} className="hover:bg-slate-900/45 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-200">{emp.full_name}</div>
                      <div className="text-[10px] text-slate-500">{emp.email}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-medium">{emp.designation}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-lg bg-indigo-650/15 text-indigo-400 border border-indigo-500/20 font-medium text-[10px]">
                        {emp.department_name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{new Date(emp.joined_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-slate-300 font-semibold">${parseFloat(emp.salary).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/employees/${emp.employee_profile_id}`}
                          className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent hover:border-slate-800 transition-all"
                          title="View Details"
                        >
                          <IoEye />
                        </Link>
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => handleDelete(emp.employee_profile_id)}
                            className="p-2 rounded-xl text-rose-400 hover:text-rose-200 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/15 transition-all"
                            title="Delete"
                          >
                            <IoTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/10">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} employees
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 disabled:opacity-50"
              >
                <IoChevronBack />
              </button>
              <span className="text-xs text-slate-300 font-medium px-2">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 disabled:opacity-50"
              >
                <IoChevronForward />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Add Employee Slideover Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl glass-panel border border-slate-800 shadow-glass p-6 md:p-8 animate-zoom-in">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <IoClose className="w-6 h-6" />
            </button>
            
            <h3 className="text-lg font-bold text-white mb-1">Add New Employee User</h3>
            <p className="text-xs text-slate-400 mb-6">Seeds an authentication account and profile simultaneously.</p>

            <form onSubmit={handleCreateEmployee} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Account Details */}
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Account Credentials</h4>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-semibold tracking-wide text-slate-400">Email Address</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-200 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-semibold tracking-wide text-slate-400">Initial Password</label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-200 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-semibold tracking-wide text-slate-400">System Permission Role</label>
                    <select
                      value={formData.role}
                      onChange={e => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-200 outline-none"
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="hr">HR Personnel</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                </div>

                {/* Profile Details */}
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Profile Information</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-semibold tracking-wide text-slate-400">First Name</label>
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-200 outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-semibold tracking-wide text-slate-400">Last Name</label>
                      <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-200 outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-semibold tracking-wide text-slate-400">Designation / Job Title</label>
                    <input
                      type="text"
                      required
                      value={formData.designation}
                      onChange={e => setFormData({ ...formData, designation: e.target.value })}
                      placeholder="e.g. Senior Software Engineer"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-200 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-semibold tracking-wide text-slate-400">Department</label>
                    <select
                      value={formData.departmentId}
                      onChange={e => setFormData({ ...formData, departmentId: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-200 outline-none"
                    >
                      <option value="">Select Department</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* General details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800/40">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-semibold tracking-wide text-slate-400">Phone Number</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-200 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-semibold tracking-wide text-slate-400">Annual Base Salary ($)</label>
                    <input
                      type="number"
                      value={formData.salary}
                      onChange={e => setFormData({ ...formData, salary: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-200 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-semibold tracking-wide text-slate-400">Home Address</label>
                    <textarea
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      rows="3"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-200 outline-none resize-none"
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Skills inputs */}
              <div className="space-y-1.5 pt-4 border-t border-slate-800/40">
                <label className="text-[10px] uppercase font-semibold tracking-wide text-slate-400">Professional Skills (Comma Separated)</label>
                <input
                  type="text"
                  value={formData.skillsInput}
                  onChange={e => setFormData({ ...formData, skillsInput: e.target.value })}
                  placeholder="e.g. React, Node.js, PostgreSQL, Docker"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-200 outline-none"
                />
              </div>

              {/* Submit panel */}
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all shadow-glass-glow disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Complete Registration
                    <IoArrowForward className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default EmployeesList;
