import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Layouts
import DashboardLayout from '../layouts/DashboardLayout';
import AuthLayout from '../layouts/AuthLayout';

// Pages
import LoginPage from '../pages/LoginPage';
import Dashboard from '../pages/Dashboard';
import EmployeesList from '../pages/EmployeesList';
import EmployeeDetails from '../pages/EmployeeDetails';
import LeavesDashboard from '../pages/LeavesDashboard';
import AssetsDashboard from '../pages/AssetsDashboard';
import Reports from '../pages/Reports';

// Route guards
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 gap-4">
        {/* Loading Spinner */}
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-xs font-semibold tracking-wider text-slate-400">LOADING ENTERPRISE DATA PORTAL...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // If not allowed, redirect employees to their dedicated page
    if (user.role === 'employee') {
      return <Navigate to="/leaves" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* 1. Public Authentication Route */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* 2. Protected Enterprise Routes */}
      <Route element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        
        {/* Admin/HR/Manager only dashboard home */}
        <Route path="/" element={
          <ProtectedRoute allowedRoles={['admin', 'hr', 'manager']}>
            <Dashboard />
          </ProtectedRoute>
        } />

        {/* Employees directory */}
        <Route path="/employees" element={
          <ProtectedRoute allowedRoles={['admin', 'hr', 'manager']}>
            <EmployeesList />
          </ProtectedRoute>
        } />

        <Route path="/employees/:id" element={
          <ProtectedRoute allowedRoles={['admin', 'hr', 'manager', 'employee']}>
            <EmployeeDetails />
          </ProtectedRoute>
        } />

        {/* Leaves management - accessible by all but behavior is customized */}
        <Route path="/leaves" element={<LeavesDashboard />} />

        {/* Assets management */}
        <Route path="/assets" element={<AssetsDashboard />} />

        {/* Reports module - managers/HR only */}
        <Route path="/reports" element={
          <ProtectedRoute allowedRoles={['admin', 'hr', 'manager']}>
            <Reports />
          </ProtectedRoute>
        } />

      </Route>

      {/* 3. Catch-all Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
