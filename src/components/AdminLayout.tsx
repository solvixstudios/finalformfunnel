/**
 * AdminLayout
 * Separate layout for admin routes. Email-gated to solvixalgerie@gmail.com.
 * Renders an "Access Denied" page if the logged-in user isn't the admin.
 */

import { cn } from '@/lib/utils';
import { ADMIN_EMAIL } from '@/data/plans';
import { GoogleUser } from '@/lib/authGoogle';
import { Shield, LayoutDashboard, LogOut, Users, Settings, ArrowLeft } from 'lucide-react';
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface AdminLayoutProps {
  user: GoogleUser;
  onLogout: () => void;
  children: React.ReactNode;
}

const AdminLayout = ({ user, onLogout, children }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Email gate
  if (user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen bg-[#F8F5F1] flex items-center justify-center font-sans p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
            <Shield className="text-red-500" size={28} />
          </div>
          <h1 className="text-2xl font-black text-[#4A443A] mb-2">Access Denied</h1>
          <p className="text-[#908878] font-medium text-sm mb-6">
            This page is restricted to platform administrators. You don't have permission to access this page.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#4A443A] text-white rounded-lg text-sm font-bold hover:bg-[#3A352C] transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'requests', label: 'Requests', icon: <LayoutDashboard size={18} />, path: '/admin' },
    { id: 'users', label: 'Users', icon: <Users size={18} />, path: '/admin/users' },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} />, path: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-[#F8F5F1] font-sans flex">
      {/* Sidebar */}
      <aside className="w-[240px] bg-[#1A1714] text-white flex flex-col shrink-0 h-screen sticky top-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FF5A1F] flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-black tracking-tight text-white">Admin Panel</p>
              <p className="text-[10px] font-medium text-white/40">Final Form</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.15em] px-2 mb-2">Management</p>
          {navItems.map((item) => {
            const isActive = item.id === 'requests'
              ? location.pathname === '/admin'
              : location.pathname.startsWith(item.path);
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-semibold transition-all",
                  isActive
                    ? "bg-[#FF5A1F] text-white shadow-lg shadow-[#FF5A1F]/30"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                )}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}

          {/* Back to Dashboard */}
          <div className="pt-4 mt-3 border-t border-white/10">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-semibold text-white/30 hover:text-white/70 hover:bg-white/5 transition-all"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </button>
          </div>
        </nav>

        {/* User & Logout */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/60 text-xs font-bold">
                {user.displayName?.charAt(0) || 'A'}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{user.displayName}</p>
              <p className="text-[10px] text-white/40 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold text-white/40 hover:text-white hover:bg-white/5 transition-all"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
