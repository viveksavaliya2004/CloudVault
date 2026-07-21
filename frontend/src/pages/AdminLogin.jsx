import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Key, Mail, ArrowRight, Moon, Sun, Eye, EyeOff } from 'lucide-react';
import { useLoginMutation, useLogoutMutation, useUserQuery } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { useTheme } from '../context/ThemeContext';

export const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeField, setActiveField] = useState(null);

  const { data: user } = useUserQuery();
  const loginMutation = useLoginMutation();
  const logoutMutation = useLogoutMutation();
  const { addToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  }, [user, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    loginMutation.mutate({ email: email.trim(), password }, {
      onSuccess: (response) => {
        const loggedUser = response.data.user;
        if (loggedUser && loggedUser.role === 'admin') {
          addToast('Welcome back, Administrator!', 'success');
          navigate('/admin');
        } else {
          addToast('Access Denied. Only administrators can access this portal.', 'error');
          logoutMutation.mutate();
        }
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30 p-4 transition-colors duration-300">

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-5 right-5 z-50 p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-400/15 dark:bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] bg-violet-400/10 dark:bg-violet-600/8 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-[420px] relative z-10"
      >
        {/* Card */}
        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl dark:shadow-2xl rounded-2xl p-8 space-y-7">

          {/* Logo and Header */}
          <div className="flex flex-col items-center text-center space-y-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25 dark:shadow-indigo-500/15"
            >
              <Shield className="w-7 h-7 text-white" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Admin Console
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Sign in to manage your CloudVault platform
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                Email
              </label>
              <div
                className={`relative flex items-center rounded-xl border-2 transition-all duration-200 ${
                  activeField === 'email'
                    ? 'border-indigo-500 dark:border-indigo-400 bg-white dark:bg-slate-800 shadow-sm shadow-indigo-500/10'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60'
                }`}
              >
                <Mail className={`w-4 h-4 ml-3.5 flex-shrink-0 transition-colors ${activeField === 'email' ? 'text-indigo-500' : 'text-slate-400'}`} />
                <input
                  type="email"
                  required
                  placeholder="admin@cloudvault.com"
                  value={email}
                  onFocus={() => setActiveField('email')}
                  onBlur={() => setActiveField(null)}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-3 text-sm bg-transparent border-none text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                Password
              </label>
              <div
                className={`relative flex items-center rounded-xl border-2 transition-all duration-200 ${
                  activeField === 'password'
                    ? 'border-indigo-500 dark:border-indigo-400 bg-white dark:bg-slate-800 shadow-sm shadow-indigo-500/10'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60'
                }`}
              >
                <Key className={`w-4 h-4 ml-3.5 flex-shrink-0 transition-colors ${activeField === 'password' ? 'text-indigo-500' : 'text-slate-400'}`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onFocus={() => setActiveField('password')}
                  onBlur={() => setActiveField(null)}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-3 text-sm bg-transparent border-none text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="px-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/25 dark:shadow-indigo-600/15 transition-all duration-200 disabled:opacity-60"
            >
              {loginMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-slate-400 dark:text-slate-500 pt-2">
            Authorized personnel only. Contact IT for access.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
