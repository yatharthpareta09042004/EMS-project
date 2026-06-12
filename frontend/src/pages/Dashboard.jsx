import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { useToast } from '../context/ToastContext';
import { 
  IoPeople, IoBriefcase, IoCode, IoHourglass, IoCheckmarkCircle, 
  IoCloseCircle, IoHardwareChip, IoCash 
} from 'react-icons/io5';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area, LineChart, Line
} from 'recharts';

const Dashboard = () => {
  const toast = useToast();
  
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, chartsRes] = await Promise.all([
          apiClient.get('/dashboard/stats'),
          apiClient.get('/dashboard/charts')
        ]);
        
        if (statsRes.data.status === 'success') {
          setStats(statsRes.data.data.cards);
        }
        if (chartsRes.data.status === 'success') {
          setCharts(chartsRes.data.data);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load dashboard metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Cards layout configurations
  const cardItems = [
    { label: 'Total Employees', value: stats?.totalEmployees || 0, icon: <IoPeople />, color: 'from-blue-500/10 to-indigo-500/5', border: 'border-blue-500/20', iconColor: 'text-blue-400' },
    { label: 'Departments', value: stats?.totalDepartments || 0, icon: <IoBriefcase />, color: 'from-emerald-500/10 to-teal-500/5', border: 'border-emerald-500/20', iconColor: 'text-emerald-400' },
    { label: 'Skills Registry', value: stats?.totalSkills || 0, icon: <IoCode />, color: 'from-purple-500/10 to-pink-500/5', border: 'border-purple-500/20', iconColor: 'text-purple-400' },
    { label: 'Salary Expense', value: `$${(stats?.salaryExpense || 0).toLocaleString()}`, icon: <IoCash />, color: 'from-amber-500/10 to-yellow-500/5', border: 'border-amber-500/20', iconColor: 'text-amber-400' },
    { label: 'Pending Leaves', value: stats?.pendingLeaves || 0, icon: <IoHourglass />, color: 'from-amber-500/10 to-orange-500/5', border: 'border-orange-500/20', iconColor: 'text-orange-400' },
    { label: 'Approved Leaves', value: stats?.approvedLeaves || 0, icon: <IoCheckmarkCircle />, color: 'from-emerald-500/10 to-green-500/5', border: 'border-green-500/20', iconColor: 'text-green-400' },
    { label: 'Rejected Leaves', value: stats?.rejectedLeaves || 0, icon: <IoCloseCircle />, color: 'from-rose-500/10 to-pink-500/5', border: 'border-rose-500/20', iconColor: 'text-rose-400' },
    { label: 'Total Assets', value: stats?.totalAssets || 0, icon: <IoHardwareChip />, color: 'from-sky-500/10 to-cyan-500/5', border: 'border-sky-500/20', iconColor: 'text-sky-400' },
  ];

  // Pie colors
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Analytics Dashboard</h2>
        <p className="text-xs text-slate-400">Overview of enterprise metrics, human resources, and hardware distribution.</p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {cardItems.map((item, index) => (
          <div 
            key={index}
            className={`flex items-center justify-between p-5 rounded-2xl border bg-gradient-to-br ${item.color} ${item.border} shadow-glass`}
          >
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">{item.label}</span>
              <p className="text-xl md:text-2xl font-bold text-slate-100">{item.value}</p>
            </div>
            <div className={`p-3 rounded-xl bg-slate-900/60 border border-slate-800 ${item.iconColor} text-lg md:text-xl shadow-inner`}>
              {item.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        
        {/* Chart 1: Department Share (Pie Chart) */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 shadow-glass">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 tracking-wider uppercase">Employee Departmental Spread</h3>
          <div className="h-72">
            {charts?.deptDistribution?.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">No data found</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts?.deptDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="department"
                    label
                  >
                    {charts?.deptDistribution?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Salary Expenses (Area Chart) */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 shadow-glass">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 tracking-wider uppercase">Salary Expenses by Department ($)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.salaryDistribution}>
                <defs>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="department" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="expense" stroke="#6366f1" fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Assets Status (Bar Chart) */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 shadow-glass">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 tracking-wider uppercase">Corporate Assets Distribution</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.assetDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="type" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }} />
                <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]}>
                  {charts?.assetDistribution?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Leaves Timeline (Line Chart) */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 shadow-glass">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 tracking-wider uppercase">Leaves Requests Timeline</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts?.leavesTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }} />
                <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
