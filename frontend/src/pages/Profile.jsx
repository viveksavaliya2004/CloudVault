import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User as UserIcon, Shield, Key, Laptop, Smartphone, Trash2, Camera, AlertCircle, Database, Settings, Server, LayoutDashboard, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useUserQuery, useUpdateProfileMutation, useChangePasswordMutation, useUploadAvatarMutation, useSessionsQuery, useRevokeSessionMutation } from '../hooks/useAuth';
import { Skeleton, UserAvatar } from '../components/UI';
import { formatBytes } from '../services/mockData';

export const Profile = () => {
  const avatarInputRef = useRef(null);

  const { data: user, isLoading: userLoading } = useUserQuery();
  const { data: sessions = [], isLoading: sessionsLoading } = useSessionsQuery();

  const updateProfileMutation = useUpdateProfileMutation();
  const changePasswordMutation = useChangePasswordMutation();
  const uploadAvatarMutation = useUploadAvatarMutation();
  const revokeSessionMutation = useRevokeSessionMutation();

  const [activeTab, setActiveTab] = useState('overview');

  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Password strength calculation
  const getStrength = (pwd) => {
    let score = 0;
    if (!pwd) return { score: 0, label: '', color: 'bg-slate-200 dark:bg-slate-800' };
    if (pwd.length > 7) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    
    if (score <= 1) return { score, label: 'Weak', color: 'bg-rose-500' };
    if (score === 2) return { score, label: 'Fair', color: 'bg-amber-500' };
    if (score === 3) return { score, label: 'Good', color: 'bg-emerald-400' };
    return { score, label: 'Strong', color: 'bg-emerald-500' };
  };

  const pwdStrength = getStrength(newPassword);

  React.useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfileEmail(user.email);
    }
  }, [user]);

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    if (!profileName.trim() || !profileEmail.trim()) return;
    updateProfileMutation.mutate({ name: profileName, email: profileEmail });
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPwdError('');

    if (newPassword.length < 6) {
      setPwdError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('Passwords do not match');
      return;
    }

    changePasswordMutation.mutate({ oldPassword, newPassword }, {
      onSuccess: () => {
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    });
  };

  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      uploadAvatarMutation.mutate(e.target.files[0]);
    }
  };

  if (userLoading || !user) {
    return (
      <div className="page-container space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-full max-w-md rounded-xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  const storagePercentage = (user.storageUsed / user.storageLimit) * 100;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'sessions', label: 'Active Sessions', icon: Server },
  ];

  return (
    <div className="page-container space-y-8 select-none text-left max-w-5xl mx-auto">
      {/* Header section with glassmorphism */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8 border border-primary/10 shadow-sm"
      >
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center md:items-start">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative group cursor-pointer flex-shrink-0" 
            onClick={() => avatarInputRef.current?.click()}
          >
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <div className="relative rounded-full overflow-hidden border-4 border-white/60 dark:border-slate-800 shadow-xl">
              <UserAvatar
                name={user.name}
                avatar={user.avatar}
                size="xl"
                className="w-24 h-24"
              />
              <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Camera className="w-8 h-8 text-white" />
              </div>
            </div>
          </motion.div>

          <div className="text-center md:text-left mt-2 flex-grow">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
              {user.name}
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {user.email}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Interactive Tabs Menu */}
      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
                isActive 
                  ? 'text-primary dark:text-primary-light' 
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="activeTabProfile"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary dark:bg-primary-light"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Area */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* Profile Details Form */}
              <div className="premium-card p-6 shadow-sm border border-slate-200/50 dark:border-slate-800/50">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                  <UserIcon className="w-4.5 h-4.5 text-primary" />
                  <span>Personal Details</span>
                </h3>
                
                <form onSubmit={handleProfileSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Full Name</label>
                    <input
                      type="text"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="premium-input bg-slate-50 dark:bg-slate-900 focus:ring-primary/30 focus:border-primary transition-all duration-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Email Address</label>
                    <input
                      type="email"
                      required
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      className="premium-input bg-slate-50 dark:bg-slate-900 focus:ring-primary/30 focus:border-primary transition-all duration-300"
                    />
                  </div>

                  <div className="pt-4 flex justify-end">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      className="premium-button-primary py-2.5 px-6 text-sm font-semibold shadow-lg shadow-primary/25 cursor-pointer rounded-xl"
                    >
                      {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </motion.button>
                  </div>
                </form>
              </div>

              {/* Storage Thresholds */}
              <div className="premium-card p-6 shadow-sm border border-slate-200/50 dark:border-slate-800/50 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                    <Database className="w-4.5 h-4.5 text-primary" />
                    <span>Workspace Storage</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Current capacity and allocations</p>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-500">Total capacity</span>
                      <span className="text-slate-900 dark:text-white">{Math.round(storagePercentage)}% Used</span>
                    </div>
                    
                    {/* Animated Progress Bar */}
                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${storagePercentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                      />
                    </div>
                    
                    <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                      <span>{formatBytes(user.storageUsed)} Used</span>
                      <span>{formatBytes(user.storageLimit)} Total</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-primary/5 rounded-xl border border-primary/10">
                  <p className="text-xs text-primary/80 dark:text-primary-light/80 leading-relaxed font-medium">
                    Upgrade to CloudVault Pro for unlimited storage and priority bandwidth. 
                    <Link to="/upgrade" className="ml-1 text-primary font-bold hover:underline">Learn more</Link>
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div
              key="security"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="premium-card p-6 md:p-8 max-w-2xl mx-auto shadow-sm border border-slate-200/50 dark:border-slate-800/50">
                <div className="text-center mb-8">
                  <div className="inline-flex p-3 bg-primary/10 rounded-full mb-3">
                    <Key className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Change Password
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Ensure your account is using a long, random password to stay secure.
                  </p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  {pwdError && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex gap-2 items-center p-3 bg-red-500/5 dark:bg-red-500/10 border border-red-500/10 text-rose-500 text-xs rounded-xl"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{pwdError}</span>
                    </motion.div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex justify-between">
                      Current Password
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-primary hover:text-primary-dark transition-colors flex items-center gap-1"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="premium-input bg-slate-50 dark:bg-slate-900 focus:ring-primary/30 focus:border-primary transition-all duration-300"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">New Password</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="premium-input bg-slate-50 dark:bg-slate-900 focus:ring-primary/30 focus:border-primary transition-all duration-300"
                    />
                    
                    {/* Password Strength Indicator */}
                    <AnimatePresence>
                      {newPassword.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }} 
                          animate={{ opacity: 1, height: 'auto' }} 
                          exit={{ opacity: 0, height: 0 }}
                          className="pt-2 space-y-3"
                        >
                          <div className="flex gap-1.5 h-1.5 w-full">
                            {[1, 2, 3, 4].map((level) => (
                              <div 
                                key={level} 
                                className={`flex-1 rounded-full transition-colors duration-500 ${pwdStrength.score >= level ? pwdStrength.color : 'bg-slate-100 dark:bg-slate-800'}`}
                              />
                            ))}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 className={`w-3.5 h-3.5 ${newPassword.length >= 8 ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`} />
                              <span className={`text-[10px] ${newPassword.length >= 8 ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-400'}`}>8+ characters</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 className={`w-3.5 h-3.5 ${/[0-9]/.test(newPassword) ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`} />
                              <span className={`text-[10px] ${/[0-9]/.test(newPassword) ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-400'}`}>Contains a number</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 className={`w-3.5 h-3.5 ${/[A-Z]/.test(newPassword) ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`} />
                              <span className={`text-[10px] ${/[A-Z]/.test(newPassword) ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-400'}`}>Uppercase letter</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 className={`w-3.5 h-3.5 ${/[^A-Za-z0-9]/.test(newPassword) ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`} />
                              <span className={`text-[10px] ${/[^A-Za-z0-9]/.test(newPassword) ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-400'}`}>Special character</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Confirm Password</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="premium-input bg-slate-50 dark:bg-slate-900 focus:ring-primary/30 focus:border-primary transition-all duration-300"
                    />
                  </div>

                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={changePasswordMutation.isPending || (newPassword.length > 0 && pwdStrength.score < 2)}
                      className={`premium-button-primary py-2.5 px-6 text-sm font-semibold shadow-lg cursor-pointer rounded-xl w-full md:w-auto transition-all ${newPassword.length > 0 && pwdStrength.score < 2 ? 'opacity-50 grayscale cursor-not-allowed' : 'shadow-primary/25'}`}
                    >
                      {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {activeTab === 'sessions' && (
            <motion.div
              key="sessions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="premium-card p-6 shadow-sm border border-slate-200/50 dark:border-slate-800/50">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Laptop className="w-4.5 h-4.5 text-primary" />
                      <span>Active Sessions</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review devices currently authenticated to your account.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {sessionsLoading ? (
                    <div className="py-8 text-center text-sm font-medium text-slate-450 animate-pulse">Loading secure sessions...</div>
                  ) : sessions.length === 0 ? (
                    <div className="py-8 text-center text-sm font-medium text-slate-450">No active sessions found.</div>
                  ) : (
                    sessions.map((sess, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={sess.id} 
                        className="group flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="p-3 bg-white dark:bg-slate-800 shadow-sm text-slate-500 dark:text-slate-400 rounded-xl flex-shrink-0">
                            {sess.device && (sess.device.includes('Mac') || sess.device.includes('Windows') || sess.device.includes('PC')) ? (
                              <Laptop className="w-5 h-5 text-primary" />
                            ) : (
                              <Smartphone className="w-5 h-5 text-primary" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                                {sess.device || 'Unknown Device'}
                              </p>
                              {sess.isCurrent && (
                                <span className="inline-block bg-primary/10 text-primary dark:text-primary-light text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                                  Current
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                              {sess.location || sess.ip || 'Unknown IP'} 
                              {sess.lastActive && ` • Last active: ${new Date(sess.lastActive).toLocaleDateString()}`}
                            </p>
                          </div>
                        </div>

                        {!sess.isCurrent && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => revokeSessionMutation.mutate(sess.id)}
                            className="opacity-0 group-hover:opacity-100 p-2 bg-red-500/10 text-rose-600 hover:bg-red-500/20 rounded-lg transition-all flex-shrink-0"
                            title="Revoke session access"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        )}
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
export default Profile;
