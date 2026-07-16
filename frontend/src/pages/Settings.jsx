import React, { useState } from 'react';
import { Settings as SettingsIcon, Globe, Bell, ShieldAlert } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/Toast';

export const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();

  const [language, setLanguage] = useState('en');
  const [mfaEnabled, setMfaEnabled] = useState(false);
  
  const [notifyUploads, setNotifyUploads] = useState(true);
  const [notifyDeletes, setNotifyDeletes] = useState(true);
  const [notifyAccess, setNotifyAccess] = useState(false);

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
    toast.addToast(`Language updated to ${e.target.value === 'en' ? 'English' : e.target.value === 'es' ? 'Spanish' : 'French'}`, 'success');
  };

  const handleMfaToggle = () => {
    setMfaEnabled(prev => {
      const next = !prev;
      toast.addToast(next ? 'Two-Factor Authentication activated' : 'Two-Factor Authentication disabled', next ? 'success' : 'warning');
      return next;
    });
  };

  return (
    <div className="page-container space-y-6 select-none text-left">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-primary" />
          <span>System Settings</span>
        </h1>
        <p className="text-xs text-slate-400">Manage client preferences, system alerts, and workspace integrations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="premium-card p-6 space-y-6">
          <div className="space-y-3.5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Theme preferences</span>
            </h3>
            <p className="text-xs text-slate-400">Choose how CloudVault workspace appears on your device screen</p>
            
            <div className="grid grid-cols-2 gap-3.5 pt-1.5">
              <button
                onClick={() => theme === 'dark' && toggleTheme()}
                className={`flex flex-col gap-2 p-3.5 rounded-xl border text-left transition-all ${
                  theme === 'light'
                    ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/10'
                    : 'border-slate-200 dark:border-slate-800 text-slate-505 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <span className="text-xs font-bold">Light mode</span>
                <span className="text-[10px] opacity-75">Clean contrast, premium design aesthetics</span>
              </button>
              
              <button
                onClick={() => theme === 'light' && toggleTheme()}
                className={`flex flex-col gap-2 p-3.5 rounded-xl border text-left transition-all ${
                  theme === 'dark'
                    ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/10'
                    : 'border-slate-200 dark:border-slate-800 text-slate-505 hover:bg-slate-55 dark:hover:bg-slate-800/40'
                }`}
              >
                <span className="text-xs font-bold">Dark mode</span>
                <span className="text-[10px] opacity-75">Sleek glassmorphism, easy on the eyes</span>
              </button>
            </div>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-850" />

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Globe className="w-4.5 h-4.5 text-primary" />
              <span>Language Setting</span>
            </h3>
            <p className="text-xs text-slate-400">Choose primary language for workspace interface translations</p>
            
            <div className="pt-2">
              <select
                value={language}
                onChange={handleLanguageChange}
                className="premium-input bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 max-w-xs cursor-pointer font-medium"
              >
                <option value="en">English (US)</option>
                <option value="es">Español (Spanish)</option>
                <option value="fr">Français (French)</option>
                <option value="de">Deutsch (German)</option>
              </select>
            </div>
          </div>

        </div>

        <div className="space-y-6">
          <div className="premium-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Bell className="w-4.5 h-4.5 text-primary" />
              <span>Email Notifications</span>
            </h3>
            <p className="text-xs text-slate-400">Select which events trigger email alerts to your account</p>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Upload completions</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Receive digests of drag-and-drop actions</p>
                </div>
                <button
                  onClick={() => setNotifyUploads(!notifyUploads)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                    notifyUploads ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${
                      notifyUploads ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Recycle Bin warnings</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Alert me when items are scheduled for purge</p>
                </div>
                <button
                  onClick={() => setNotifyDeletes(!notifyDeletes)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                    notifyDeletes ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${
                      notifyDeletes ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Security warnings</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Alert me when unfamiliar active sessions connect</p>
                </div>
                <button
                  onClick={() => setNotifyAccess(!notifyAccess)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                    notifyAccess ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${
                      notifyAccess ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="premium-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-4.5 h-4.5 text-primary" />
              <span>Two-Factor Authentication</span>
            </h3>
            <p className="text-xs text-slate-400">Require authenticator tokens upon login for extra workspace protection</p>
            
            <div className="flex items-center justify-between pt-2.5">
              <div>
                <p className="text-xs font-semibold text-slate-850 dark:text-slate-250">2FA Verification</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Highly recommended for enterprise administrators</p>
              </div>
              <button
                onClick={handleMfaToggle}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                  mfaEnabled ? 'bg-success' : 'bg-slate-200 dark:bg-slate-800'
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${
                    mfaEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
export default Settings;
