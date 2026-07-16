import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HardDrive, Settings, Trash2, Star, Share2, LayoutDashboard,
  Search, Bell, Moon, Sun, Menu, X, ChevronDown, User, LogOut, Upload, Shield
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useUserQuery, useLogoutMutation } from '../hooks/useAuth';
import { formatBytes } from '../services/mockData';
import { UploadModal } from '../components/UploadModal';
import { UserAvatar } from '../components/UI';

export const MainLayout = () => {
  const { theme, toggleTheme } = useTheme();
  const { data: user } = useUserQuery();
  const logoutMutation = useLogoutMutation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const storagePercentage = user ? (user.storageUsed / user.storageLimit) * 100 : 0;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/files?search=${encodeURIComponent(searchVal.trim())}`);
    } else {
      navigate('/files');
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'My Files', path: '/files', icon: HardDrive },
    { name: 'Favorites', path: '/favorites', icon: Star },
    { name: 'Shared', path: '/shared', icon: Share2 },
    { name: 'Recycle Bin', path: '/trash', icon: Trash2 },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => navigate('/login')
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slateBg-light dark:bg-slateBg-darker text-slate-800 dark:text-slate-200">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full bg-slateBg-light dark:bg-slateBg-darker transition-colors duration-200">
        <div className="flex h-16 items-center justify-between px-4 md:px-8">
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link to="/" className="flex items-center gap-2.5">
              <div className="bg-primary flex items-center justify-center p-2 rounded-xl text-white shadow-md shadow-primary/20">
                <Shield className="w-5 h-5 fill-white/10" />
              </div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                CloudVault
              </span>
            </Link>
          </div>

          <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative max-w-md w-full mx-8">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
            <input
              type="text"
              placeholder="Search files, folders..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100/50 dark:bg-slate-900 border-none rounded-xl focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none placeholder:text-slate-400"
            />
          </form>

          <div className="flex items-center gap-2 md:gap-3.5">
            <button
              onClick={() => setUploadModalOpen(true)}
              className="premium-button-primary py-2 px-3 md:px-4 text-xs md:text-sm font-semibold"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload</span>
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle Dark Mode"
            >
              {theme === 'dark' ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            <div className="relative">
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="p-2 text-slate-505 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Bell className="w-4.5 h-4.5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-danger"></span>
              </button>
              
              <AnimatePresence>
                {notificationOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setNotificationOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2.5 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-4 z-40"
                    >
                      <h4 className="font-semibold text-sm mb-3">Notifications</h4>
                      <div className="space-y-3">
                        <div className="flex gap-2 text-xs items-start">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-slate-850 dark:text-slate-200">Alex Rivera updated active profile settings.</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">10 mins ago</p>
                          </div>
                        </div>
                        <div className="flex gap-2 text-xs items-start">
                          <span className="h-1.5 w-1.5 rounded-full bg-success mt-1.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-slate-850 dark:text-slate-200">Storage warning: You have used 13% of storage capacity.</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">3 hours ago</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {user && (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <UserAvatar
                    name={user.name}
                    avatar={user.avatar}
                    size="sm"
                  />
                  <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:inline" />
                </button>

                <AnimatePresence>
                  {profileDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setProfileDropdownOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2.5 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1.5 z-40"
                      >
                        <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800">
                          <p className="text-xs font-semibold text-slate-850 dark:text-slate-205">{user.name}</p>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{user.email}</p>
                        </div>
                        <div className="p-1 space-y-0.5">
                          <Link
                            to="/profile"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80 rounded-xl transition-colors"
                          >
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>My Profile</span>
                          </Link>
                          <Link
                            to="/settings"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80 rounded-xl transition-colors"
                          >
                            <Settings className="w-3.5 h-3.5 text-slate-400" />
                            <span>Settings</span>
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-605 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-colors text-left"
                          >
                            <LogOut className="w-3.5 h-3.5 text-rose-500" />
                            <span>Logout</span>
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-grow flex relative">
        <aside className="hidden md:flex w-64 flex-col p-5 gap-6 select-none flex-shrink-0 bg-transparent">
          <nav className="flex flex-col gap-1.5">
            {navItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  isActive ? 'premium-sidebar-link-active' : 'premium-sidebar-link'
                }
              >
                <item.icon className="w-4.5 h-4.5" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto border-t border-slate-200/60 dark:border-slate-800/60 pt-5 space-y-3.5">
            {user && (
              <div className="space-y-2 px-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">Storage</span>
                  <span className="text-slate-605 dark:text-slate-300">
                    {Math.round(storagePercentage)}% Used
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-850 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                    style={{ width: `${storagePercentage}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  {formatBytes(user.storageUsed)} of {formatBytes(user.storageLimit)} used
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="md:hidden fixed inset-0 z-50 bg-slateBg-darker/60 backdrop-blur-xs"
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 20 }}
                className="md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 p-5 flex flex-col gap-6"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary flex items-center justify-center p-1.5 rounded-lg text-white">
                      <Shield className="w-4 h-4" />
                    </div>
                    <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      CloudVault
                    </span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSearchSubmit} className="flex items-center relative w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100/50 dark:bg-slate-900 border-none rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none placeholder:text-slate-400"
                  />
                </form>

                <nav className="flex flex-col gap-1">
                  {navItems.map(item => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        isActive ? 'premium-sidebar-link-active' : 'premium-sidebar-link'
                      }
                    >
                      <item.icon className="w-4.5 h-4.5" />
                      <span>{item.name}</span>
                    </NavLink>
                  ))}
                </nav>

                <div className="mt-auto border-t border-slate-200 dark:border-slate-850 pt-5 space-y-3">
                  {user && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-400">Storage</span>
                        <span className="text-slate-650 dark:text-slate-350">{Math.round(storagePercentage)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                          style={{ width: `${storagePercentage}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {formatBytes(user.storageUsed)} of {formatBytes(user.storageLimit)}
                      </p>
                    </div>
                  )}
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <main className="flex-grow overflow-y-auto bg-white dark:bg-slate-900 border-l border-t border-slate-200/80 dark:border-slate-800/80 md:rounded-tl-3xl shadow-xs transition-all duration-200">
          <Outlet />
        </main>
      </div>

      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        currentFolderId={null}
      />
    </div>
  );
};
export default MainLayout;
