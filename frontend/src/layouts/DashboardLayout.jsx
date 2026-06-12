import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { 
  IoGrid, IoPeople, IoCalendar, IoGift, IoDocumentText, 
  IoLogOut, IoMenu, IoNotifications, IoChevronDown, IoClose,
  IoCheckmarkCircle, IoTime, IoPersonCircle
} from 'react-icons/io5';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <IoGrid />, roles: ['admin', 'hr', 'manager'] },
    { name: 'Employees', path: '/employees', icon: <IoPeople />, roles: ['admin', 'hr', 'manager'] },
    { name: 'Leaves', path: '/leaves', icon: <IoCalendar />, roles: ['admin', 'hr', 'manager', 'employee'] },
    { name: 'Assets', path: '/assets', icon: <IoGift />, roles: ['admin', 'hr', 'manager', 'employee'] },
    { name: 'Reports', path: '/reports', icon: <IoDocumentText />, roles: ['admin', 'hr', 'manager'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(user?.role));

  const formatRole = (role) => {
    if (!role) return '';
    return role.toUpperCase();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      
      {/* 1. SIDEBAR NAVIGATION */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 glass-panel border-r border-slate-800 transition-transform duration-300 transform md:relative md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-wider">
            <span className="text-2xl">🏢</span>
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">ENTERPRISE EMS</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white md:hidden">
            <IoClose className="w-6 h-6" />
          </button>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive 
                    ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/20 text-indigo-400 border border-indigo-500/20 shadow-glass-glow' 
                    : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200 border border-transparent'
                }`}
              >
                <span className={`text-lg transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`}>
                  {item.icon}
                </span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Account Action */}
        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-rose-400 bg-rose-500/10 border border-rose-500/15 hover:bg-rose-500/20 active:scale-95 transition-all duration-200"
          >
            <IoLogOut className="text-lg" />
            Logout Account
          </button>
        </div>
      </div>

      {/* 2. MAIN APP CONTENT CONTAINER */}
      <div className="flex flex-col flex-1 overflow-hidden">
        
        {/* Top Navbar */}
        <header className="flex items-center justify-between h-16 px-6 glass-panel border-b border-slate-800">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-white focus:outline-none">
              <IoMenu className="w-6 h-6" />
            </button>
            <h1 className="text-sm font-semibold text-slate-400 hidden md:block">
              Welcome back, <span className="text-slate-200">{user?.email}</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            
            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button 
                onClick={() => {
                  setNotifDropdownOpen(!notifDropdownOpen);
                  setProfileDropdownOpen(false);
                }}
                className="relative p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 transition-all border border-transparent hover:border-slate-800"
              >
                <IoNotifications className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-indigo-600 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifDropdownOpen && (
                <div className="absolute right-0 mt-3 w-80 rounded-2xl glass-panel border border-slate-800 shadow-glass overflow-hidden z-[100]">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                    <span className="font-semibold text-xs text-slate-300">Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-[10px] text-indigo-400 hover:underline">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        No notifications.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div 
                          key={n.id} 
                          onClick={() => {
                            if (!n.is_read) markRead(n.id);
                          }}
                          className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-slate-905 transition-colors border-b border-slate-800/40 last:border-b-0 ${
                            !n.is_read ? 'bg-indigo-600/5' : ''
                          }`}
                        >
                          <div className="mt-0.5 text-indigo-400">
                            {!n.is_read ? <IoTime /> : <IoCheckmarkCircle className="text-slate-500" />}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <p className="text-xs text-slate-200 pr-2">{n.message}</p>
                            <span className="text-[9px] text-slate-500">{new Date(n.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => {
                  setProfileDropdownOpen(!profileDropdownOpen);
                  setNotifDropdownOpen(false);
                }}
                className="flex items-center gap-2.5 p-1 px-2.5 rounded-xl border border-slate-850 hover:bg-slate-900/40 transition-colors"
              >
                <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/20">
                  <IoPersonCircle className="w-6 h-6" />
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-xs font-semibold text-slate-300">{user?.email.split('@')[0]}</p>
                  <span className="text-[10px] text-slate-500 block -mt-0.5">{formatRole(user?.role)}</span>
                </div>
                <IoChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-3 w-56 rounded-2xl glass-panel border border-slate-800 shadow-glass overflow-hidden z-[100] p-1">
                  <div className="px-4 py-3 border-b border-slate-800/55 mb-1">
                    <p className="text-xs text-slate-400">Logged in as</p>
                    <p className="text-xs font-bold text-slate-200 truncate">{user?.email}</p>
                  </div>
                  
                  {/* View Employee details if role is standard employee */}
                  {user?.role === 'employee' && (
                    <Link
                      to="/leaves"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 transition-colors"
                    >
                      My Leave Portal
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 w-full text-left px-3.5 py-2.5 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <IoLogOut className="text-sm" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Page Content viewport */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

    </div>
  );
};

export default DashboardLayout;
