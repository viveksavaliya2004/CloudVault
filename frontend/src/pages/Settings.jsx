import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings as SettingsIcon, Globe, Bell, ShieldAlert, Sun, Moon, Check, Loader2, Upload, Trash2, Shield, Info } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/Toast';
import { apiService } from '../services/api';

// Toggle switch component
const ToggleSwitch = ({ enabled, onToggle, loading = false }) => (
  <button
    onClick={onToggle}
    disabled={loading}
    className={`relative w-11 h-6 rounded-full p-0.5 transition-all duration-300 focus:outline-none cursor-pointer disabled:opacity-50 ${
      enabled
        ? 'bg-gradient-to-r from-indigo-500 to-violet-500 shadow-md shadow-indigo-500/25'
        : 'bg-slate-200 dark:bg-slate-700'
    }`}
  >
    <motion.div
      layout
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center ${
        enabled ? 'ml-auto' : 'ml-0'
      }`}
    >
      {loading ? (
        <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />
      ) : enabled ? (
        <Check className="w-3 h-3 text-indigo-500" />
      ) : null}
    </motion.div>
  </button>
);

// Notification row component
const NotificationRow = ({ icon: Icon, title, description, enabled, onToggle, loading, color = '#6366f1' }) => (
  <motion.div
    whileHover={{ x: 2 }}
    className="flex items-center justify-between py-4 group"
  >
    <div className="flex items-center gap-3.5">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}12` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{title}</p>
        <p className="text-[11px] font-medium text-slate-400 mt-0.5">{description}</p>
      </div>
    </div>
    <ToggleSwitch enabled={enabled} onToggle={onToggle} loading={loading} />
  </motion.div>
);

export const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingField, setSavingField] = useState(null);

  // Fetch settings from backend on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await apiService.user.getSettings();
        setSettings(response.data);
      } catch (err) {
        console.error('Failed to load settings', err);
        // Fallback defaults
        setSettings({
          theme: theme,
          language: 'en',
          notifyUploads: true,
          notifyDeletes: true,
          notifyAccess: false,
          mfaEnabled: false,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Save a single setting field to backend
  const saveSetting = async (field, value) => {
    setSavingField(field);
    try {
      await apiService.user.updateSettings({ [field]: value });
      setSettings(prev => ({ ...prev, [field]: value }));
      toast.addToast('Setting saved', 'success');
    } catch (err) {
      toast.addToast('Failed to save setting', 'error');
    } finally {
      setSavingField(null);
    }
  };

  const handleThemeToggle = (selectedTheme) => {
    if (theme !== selectedTheme) {
      toggleTheme();
    }
    saveSetting('theme', selectedTheme);
  };

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    saveSetting('language', lang);
  };

  if (loading || !settings) {
    return (
      <div className="page-container flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          <p className="text-xs font-bold text-slate-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container space-y-8 select-none text-left max-w-4xl mx-auto pb-12">

      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <SettingsIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Settings</h1>
            <p className="text-xs font-medium text-slate-400">Manage your preferences, notifications & security</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ===== APPEARANCE CARD ===== */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/80 p-6"
        >
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
            </div>
            Appearance
          </h3>

          <p className="text-xs font-medium text-slate-400 mb-4">Choose how CloudVault looks on your screen</p>

          <div className="grid grid-cols-2 gap-3">
            {/* Light Mode Card */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleThemeToggle('light')}
              className={`relative flex flex-col gap-3 p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                theme === 'light'
                  ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 ring-4 ring-indigo-500/10'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {theme === 'light' && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                <Sun className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Light</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Clean & bright</p>
              </div>
            </motion.button>

            {/* Dark Mode Card */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleThemeToggle('dark')}
              className={`relative flex flex-col gap-3 p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 ring-4 ring-indigo-500/10'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {theme === 'dark' && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shadow-sm">
                <Moon className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Dark</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Easy on the eyes</p>
              </div>
            </motion.button>
          </div>

        </motion.div>

        {/* ===== NOTIFICATIONS CARD ===== */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/80 p-6"
        >
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Bell className="w-3.5 h-3.5 text-blue-500" />
            </div>
            Notifications
          </h3>
          <p className="text-xs font-medium text-slate-400 mb-2">Choose which events trigger email alerts</p>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            <NotificationRow
              icon={Upload}
              title="Upload completions"
              description="Get notified when files finish uploading"
              enabled={settings.notifyUploads}
              onToggle={() => saveSetting('notifyUploads', !settings.notifyUploads)}
              loading={savingField === 'notifyUploads'}
              color="#6366f1"
            />
            <NotificationRow
              icon={Trash2}
              title="Recycle Bin warnings"
              description="Alert when items are scheduled for deletion"
              enabled={settings.notifyDeletes}
              onToggle={() => saveSetting('notifyDeletes', !settings.notifyDeletes)}
              loading={savingField === 'notifyDeletes'}
              color="#f59e0b"
            />
            <NotificationRow
              icon={Shield}
              title="Security alerts"
              description="Notify on unfamiliar login activity"
              enabled={settings.notifyAccess}
              onToggle={() => saveSetting('notifyAccess', !settings.notifyAccess)}
              loading={savingField === 'notifyAccess'}
              color="#ef4444"
            />
          </div>
        </motion.div>

        {/* ===== SECURITY CARD (full width) ===== */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/80 p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Two-Factor Authentication</h3>
                <p className="text-xs font-medium text-slate-400 mt-0.5">Add an extra layer of security to your account</p>
              </div>
            </div>
            <ToggleSwitch
              enabled={settings.mfaEnabled}
              onToggle={() => {
                const next = !settings.mfaEnabled;
                saveSetting('mfaEnabled', next);
                toast.addToast(
                  next ? '2FA has been activated' : '2FA has been disabled',
                  next ? 'success' : 'warning'
                );
              }}
              loading={savingField === 'mfaEnabled'}
            />
          </div>

          <AnimatePresence>
            {settings.mfaEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200/50 dark:border-emerald-500/10">
                  <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">2FA is Active</p>
                    <p className="text-[11px] font-medium text-emerald-600/70 dark:text-emerald-400/60 mt-1 leading-relaxed">
                      Your account is protected with two-factor authentication. You'll be asked for a verification code each time you log in from a new device.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

      </div>
    </div>
  );
};
export default Settings;
