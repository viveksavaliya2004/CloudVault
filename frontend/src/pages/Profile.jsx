import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User as UserIcon, Shield, Key, Laptop, Smartphone, Trash2, Camera, AlertCircle, Database, Server, LayoutDashboard, Eye, EyeOff, CheckCircle2, HardDrive, FileText, FolderOpen, Zap, ArrowUpRight, Mail, Edit3 } from 'lucide-react';
import { useUserQuery, useUpdateProfileMutation, useChangePasswordMutation, useUploadAvatarMutation, useSessionsQuery, useRevokeSessionMutation } from '../hooks/useAuth';
import { Skeleton, UserAvatar } from '../components/UI';
import { formatBytes } from '../services/mockData';

// Animated circular progress ring for storage
const StorageRing = ({ percentage, used, total }) => {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const color = percentage > 85 ? '#ef4444' : percentage > 60 ? '#f59e0b' : '#6366f1';

  return (
    <div className="relative flex items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
        {/* Track */}
        <circle cx="70" cy="70" r={radius} fill="none" stroke="currentColor" strokeWidth="10"
          className="text-slate-100 dark:text-slate-800/80" />
        {/* Progress */}
        <motion.circle cx="70" cy="70" r={radius} fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, type: 'spring' }}
          className="text-2xl font-black text-slate-900 dark:text-white"
        >
          {Math.round(percentage)}%
        </motion.span>
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Used</span>
      </div>
    </div>
  );
};

// Stat tile with animated counter
const StatTile = ({ icon: Icon, label, value, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    whileHover={{ y: -3, transition: { duration: 0.2 } }}
    className="group relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/80 p-4 cursor-default"
  >
    <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500`} style={{ background: color }} />
    <div className="relative z-10">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}15` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <p className="text-lg font-black text-slate-900 dark:text-white">{value}</p>
      <p className="text-[11px] font-semibold text-slate-400 mt-0.5">{label}</p>
    </div>
  </motion.div>
);

// Premium floating label input
const FloatingInput = ({ label, icon: Icon, type = 'text', value, onChange, placeholder, required = false, rightElement }) => {
  const [focused, setFocused] = useState(false);

  return (
    <div className="space-y-2">
      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block pl-0.5">
        {label}
      </label>
      <div className={`relative flex items-center rounded-2xl border transition-all duration-250 ${
        focused
          ? 'border-indigo-500 dark:border-indigo-400 ring-4 ring-indigo-500/10 bg-white dark:bg-slate-900'
          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
      }`}>
        {Icon && (
          <Icon className={`w-4 h-4 ml-4 flex-shrink-0 transition-colors duration-200 ${focused ? 'text-indigo-500' : 'text-slate-400'}`} />
        )}
        <input
          type={type}
          required={required}
          placeholder={placeholder}
          value={value}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={onChange}
          className="w-full px-3.5 py-3 text-sm font-medium bg-transparent border-none text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
        {rightElement}
      </div>
    </div>
  );
};

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
  const [isEditing, setIsEditing] = useState(false);

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
    updateProfileMutation.mutate({ name: profileName, email: profileEmail }, {
      onSuccess: () => setIsEditing(false)
    });
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
    { id: 'sessions', label: 'Sessions', icon: Server },
  ];

  return (
    <div className="page-container space-y-0 select-none text-left max-w-5xl mx-auto pb-12">

      {/* ===== HERO HEADER WITH GRADIENT ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden rounded-3xl mb-8"
      >
        {/* Gradient background - two-color mix */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900" />
        {/* Subtle mesh accents */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-blue-500/12 rounded-full blur-[100px]" />
          <div className="absolute -bottom-16 left-[20%] w-60 h-60 bg-sky-500/8 rounded-full blur-[80px]" />
          <div className="absolute top-[30%] left-[60%] w-40 h-40 bg-blue-400/6 rounded-full blur-[60px]" />
        </div>

        <div className="relative z-10 px-8 py-10 md:py-12">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-end">
            {/* Avatar */}
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
              <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl shadow-black/20 ring-4 ring-white/10">
                <UserAvatar
                  name={user.name}
                  avatar={user.avatar}
                  size="xl"
                  className="w-full h-full"
                />
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-full">
                  <Camera className="w-7 h-7 text-white drop-shadow-lg" />
                </div>
              </div>
            </motion.div>

            {/* User info */}
            <div className="text-center md:text-left flex-grow mb-1">
              <motion.h1
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl md:text-3xl font-black text-white tracking-tight"
              >
                {user.name}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-sm font-medium text-white/60 mt-1"
              >
                {user.email}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-3 flex items-center justify-center md:justify-start gap-2"
              >
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-[11px] font-bold text-white/80 border border-white/10">
                  <Zap className="w-3 h-3 text-amber-300" />
                  {user.role === 'admin' ? 'Administrator' : 'Free Plan'}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 backdrop-blur-sm text-[11px] font-bold text-emerald-300 border border-emerald-400/15">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </span>
              </motion.div>
            </div>

            {/* Quick action */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setActiveTab('overview'); setIsEditing(true); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 text-white text-xs font-bold transition-all cursor-pointer mb-1"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Profile
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* ===== TAB NAVIGATION ===== */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900/80 rounded-2xl mb-8 max-w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ===== TAB CONTENT ===== */}
      <AnimatePresence mode="wait">
        {/* ---------- OVERVIEW ---------- */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >


            {/* Main Content: Profile + Storage */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

              {/* Profile Form Card (3 col) */}
              <div className="lg:col-span-3 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/80 p-6 md:p-7">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-indigo-500" />
                    </div>
                    Personal Details
                  </h3>
                  {!isEditing && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white text-[11px] font-bold transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      Edit
                    </motion.button>
                  )}
                </div>

                {isEditing ? (
                  <form onSubmit={handleProfileSubmit} className="space-y-5">
                    <FloatingInput
                      label="Full Name"
                      icon={UserIcon}
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="Enter your name"
                      required
                    />
                    <FloatingInput
                      label="Email Address"
                      icon={Mail}
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                    />

                    <div className="flex items-center gap-3 pt-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                      </motion.button>
                      <button
                        type="button"
                        onClick={() => { setIsEditing(false); setProfileName(user.name); setProfileEmail(user.email); }}
                        className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-5">
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                        <UserIcon className="w-4.5 h-4.5 text-indigo-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{user.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
                      <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4.5 h-4.5 text-violet-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account Status</p>
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">Verified & Active</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Storage Card (2 col) */}
              <div className="lg:col-span-2 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/80 p-6 md:p-7 flex flex-col">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-xl bg-pink-500/10 flex items-center justify-center">
                    <Database className="w-4 h-4 text-pink-500" />
                  </div>
                  Storage Usage
                </h3>

                {/* Circular Gauge */}
                <div className="flex-grow flex items-center justify-center py-2">
                  <StorageRing percentage={storagePercentage} used={user.storageUsed} total={user.storageLimit} />
                </div>

                {/* Storage breakdown */}
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-500">Used</span>
                    <span className="font-black text-slate-900 dark:text-white">{formatBytes(user.storageUsed)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-500">Available</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">{formatBytes(user.storageLimit - user.storageUsed)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-slate-500">Total</span>
                    <span className="font-black text-slate-900 dark:text-white">{formatBytes(user.storageLimit)}</span>
                  </div>
                </div>

                {/* Upgrade CTA */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="mt-4 p-4 bg-gradient-to-r from-indigo-500/8 to-violet-500/8 rounded-xl border border-indigo-500/10 cursor-pointer"
                >
                  <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 leading-relaxed">
                    ⚡ Upgrade to <span className="font-black">CloudVault Pro</span> for unlimited storage
                    <Link to="/upgrade" className="ml-1 underline underline-offset-2 hover:text-indigo-500">Learn more →</Link>
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ---------- SECURITY ---------- */}
        {activeTab === 'security' && (
          <motion.div
            key="security"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <div className="max-w-2xl mx-auto rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/80 p-6 md:p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  className="inline-flex p-3.5 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 rounded-2xl mb-4"
                >
                  <Key className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </motion.div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Change Password
                </h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1.5 max-w-sm mx-auto">
                  Ensure your account uses a strong, unique password to stay secure.
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                {pwdError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex gap-2 items-center p-3.5 bg-red-500/5 dark:bg-red-500/10 border border-red-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{pwdError}</span>
                  </motion.div>
                )}

                <FloatingInput
                  label="Current Password"
                  icon={Key}
                  type={showPassword ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="px-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />

                <FloatingInput
                  label="New Password"
                  icon={Shield}
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />

                {/* Password Strength Indicator */}
                <AnimatePresence>
                  {newPassword.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3"
                    >
                      <div className="flex gap-1.5 h-1.5 w-full">
                        {[1, 2, 3, 4].map((level) => (
                          <motion.div
                            key={level}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: level * 0.1 }}
                            className={`flex-1 rounded-full origin-left transition-colors duration-500 ${pwdStrength.score >= level ? pwdStrength.color : 'bg-slate-100 dark:bg-slate-800'}`}
                          />
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500">
                          Strength: <span className={`${pwdStrength.score >= 3 ? 'text-emerald-500' : pwdStrength.score >= 2 ? 'text-amber-500' : 'text-rose-500'}`}>{pwdStrength.label}</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        {[
                          { test: newPassword.length >= 8, label: '8+ characters' },
                          { test: /[0-9]/.test(newPassword), label: 'Contains number' },
                          { test: /[A-Z]/.test(newPassword), label: 'Uppercase letter' },
                          { test: /[^A-Za-z0-9]/.test(newPassword), label: 'Special character' },
                        ].map((rule, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <CheckCircle2 className={`w-3.5 h-3.5 transition-colors ${rule.test ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`} />
                            <span className={`text-[10px] font-semibold ${rule.test ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>{rule.label}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <FloatingInput
                  label="Confirm New Password"
                  icon={Shield}
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={changePasswordMutation.isPending || (newPassword.length > 0 && pwdStrength.score < 2)}
                    className={`w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg transition-all cursor-pointer ${newPassword.length > 0 && pwdStrength.score < 2 ? 'opacity-40 grayscale cursor-not-allowed' : 'shadow-indigo-600/25'}`}
                  >
                    {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* ---------- SESSIONS ---------- */}
        {activeTab === 'sessions' && (
          <motion.div
            key="sessions"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/80 p-6">
              <div className="mb-6">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Laptop className="w-4 h-4 text-amber-500" />
                  </div>
                  Active Sessions
                </h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 ml-10">
                  Devices currently signed in to your account.
                </p>
              </div>

              <div className="space-y-3">
                {sessionsLoading ? (
                  <div className="py-12 text-center text-sm font-bold text-slate-400 animate-pulse">Loading sessions...</div>
                ) : sessions.length === 0 ? (
                  <div className="py-12 text-center">
                    <Server className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-400">No active sessions found.</p>
                  </div>
                ) : (
                  sessions.map((sess, idx) => (
                    <motion.div
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.06 }}
                      key={sess.id}
                      className="group flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100/70 dark:hover:bg-slate-800/50 transition-all duration-200"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center flex-shrink-0 border border-slate-100 dark:border-slate-700">
                          {sess.device && (sess.device.includes('Mac') || sess.device.includes('Windows') || sess.device.includes('PC')) ? (
                            <Laptop className="w-5 h-5 text-indigo-500" />
                          ) : (
                            <Smartphone className="w-5 h-5 text-violet-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                              {sess.device || 'Unknown Device'}
                            </p>
                            {sess.isCurrent && (
                              <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                Current
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            {sess.location || sess.ip || 'Unknown IP'}
                            {sess.lastActive && ` • ${new Date(sess.lastActive).toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>

                      {!sess.isCurrent && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => revokeSessionMutation.mutate(sess.id)}
                          className="opacity-0 group-hover:opacity-100 p-2.5 bg-red-500/8 text-rose-500 hover:bg-red-500/15 rounded-xl transition-all flex-shrink-0 cursor-pointer"
                          title="Revoke session"
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
  );
};
export default Profile;
