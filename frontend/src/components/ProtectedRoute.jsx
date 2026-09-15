import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-[#070B09] flex flex-col items-center justify-center text-[#F1F3EF] font-body">
        <div className="flex flex-col items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="w-8 h-8 rounded-full border-2 border-[#72D6A0]/20 border-t-[#72D6A0] animate-spin" />
            <span className="material-symbols-outlined absolute text-[16px] text-[#72D6A0]">
              shield_lock
            </span>
          </div>
          <span className="font-mono text-xs text-[#8D9A93] tracking-wider uppercase">
            Verifying session...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
