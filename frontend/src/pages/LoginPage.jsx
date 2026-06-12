import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { IoMail, IoLockClosed, IoArrowForward, IoBriefcase } from 'react-icons/io5';

const LoginPage = () => {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter your email and password');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.email}!`);
      if (user.role === 'employee') {
        navigate('/leaves');
      } else {
        navigate('/');
      }
    } catch (err) {
      toast.error(err || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (roleEmail) => {
    setEmail(roleEmail);
    setPassword('password123');
  };

  const quickRoles = [
    { label: 'Admin', email: 'admin@company.com', color: 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30' },
    { label: 'HR', email: 'hr@company.com', color: 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30' },
    { label: 'Manager', email: 'manager@company.com', color: 'bg-amber-600/20 text-amber-400 border-amber-500/30' },
    { label: 'Employee', email: 'employee@company.com', color: 'bg-sky-600/20 text-sky-400 border-sky-500/30' },
  ];

  return (
    <div className="w-full p-8 rounded-2xl glass-panel border border-slate-800 shadow-glass glass-card-glow text-center">
      {/* Brand Logo Header */}
      <div className="flex flex-col items-center gap-2 mb-8">
        <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white text-2xl shadow-glass-glow">
          🏢
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white mt-2">Enterprise Portal</h2>
        <p className="text-xs text-slate-400">Sign in to manage your workspace credentials</p>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-5 text-left">
        
        {/* Email Field */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Corporate Email</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500 pointer-events-none">
              <IoMail />
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. name@company.com"
              className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-200 placeholder-slate-600 outline-none transition-all"
              required
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Password</label>
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500 pointer-events-none">
              <IoLockClosed />
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-200 placeholder-slate-600 outline-none transition-all"
              required
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all shadow-glass-glow disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              Sign In to Account
              <IoArrowForward className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Quick Access seeding (for demo and review) */}
      <div className="mt-8 pt-6 border-t border-slate-800/80">
        <span className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase block mb-3">
          Developer Quick Access Roles
        </span>
        <div className="grid grid-cols-2 gap-2">
          {quickRoles.map((role) => (
            <button
              key={role.label}
              onClick={() => handleQuickFill(role.email)}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border hover:bg-slate-900 active:scale-95 transition-all ${role.color}`}
            >
              <IoBriefcase className="w-3 h-3" />
              {role.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
