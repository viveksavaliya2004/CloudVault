import React, { useState } from 'react';
import { Navigate, Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useUserQuery, useLogoutMutation } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { Loader } from '../components/UI';
import {
  Shield, LogOut, Moon, Sun, Users, HardDrive, Database,
  BarChart2, ListTodo, Ban, Menu, X, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminLayout = () => {
  const { data: user, isLoading } = useUserQuery();
  const logoutMutation = useLogoutMutation();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slateBg-light dark:bg-slateBg-darker transition-colors duration-300">
        <Loader size="lg" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => navigate('/admin/login')
    });
  };

  const sidebarItems = [
    { key: 'users', label: 'Users', icon: Users },
    { key: 'files', label: 'Files', icon: HardDrive },
    { key: 'storage', label: 'Storage', icon: Database },
    { key: 'analytics', label: 'Analytics', icon: BarChart2 },
    { key: 'logs', label: 'Audit Logs', icon: ListTodo },
    { key: 'blocked', label: 'Blocked Users', icon: Ban },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300">

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* Left: Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link to="/admin" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/20">
                <Shield className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-base text-slate-900 dark:text-white">CloudVault</span>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold ml-1.5">Admin</span>
              </div>
            </Link>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {user.name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <span className="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-200">{user.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-40 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{user.email}</p>
                      </div>
                      <div className="p-1.5">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 py-4 text-center transition-colors duration-300">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          &copy; {new Date().getFullYear()} CloudVault Administration Panel
        </p>
      </footer>
    </div>
  );
};

export default AdminLayout;
