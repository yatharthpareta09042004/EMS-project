import React, { createContext, useContext, useState, useCallback } from 'react';
import { IoCheckmarkCircle, IoCloseCircle, IoInformationCircle, IoClose } from 'react-icons/io5';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <IoCheckmarkCircle className="w-5 h-5 text-emerald-400" />;
      case 'error':
        return <IoCloseCircle className="w-5 h-5 text-rose-400" />;
      default:
        return <IoInformationCircle className="w-5 h-5 text-indigo-400" />;
    }
  };

  const getBorderColor = (type) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/30';
      case 'error':
        return 'border-rose-500/30';
      default:
        return 'border-indigo-500/30';
    }
  };

  return (
    <ToastContext.Provider value={{ success: (msg) => addToast(msg, 'success'), error: (msg) => addToast(msg, 'error'), info: (msg) => addToast(msg, 'info') }}>
      {children}
      
      {/* Toast Render Portals Container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full">
        {toasts.map(({ id, message, type }) => (
          <div
            key={id}
            className={`flex items-start gap-3 p-4 rounded-xl border bg-slate-900/90 text-slate-100 shadow-glass backdrop-blur-md animate-slide-in duration-300 ${getBorderColor(type)}`}
          >
            <div className="flex-shrink-0 mt-0.5">{getIcon(type)}</div>
            <div className="flex-grow text-sm font-medium pr-2">{message}</div>
            <button
              onClick={() => removeToast(id)}
              className="flex-shrink-0 text-slate-400 hover:text-slate-100 transition-colors"
            >
              <IoClose className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
