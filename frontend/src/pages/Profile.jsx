import React, { useRef, useState } from 'react';
import { User as UserIcon, Shield, Key, Laptop, Smartphone, Trash2, Camera, AlertCircle } from 'lucide-react';
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

  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdError, setPwdError] = useState('');

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  const storagePercentage = (user.storageUsed / user.storageLimit) * 100;

  return (
    <div className="page-container space-y-6 select-none text-left">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-primary" />
          <span>My Profile</span>
        </h1>
        <p className="text-xs text-slate-400">Configure your CloudVault identity, storage thresholds, and security parameters</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 space-y-6">
          <div className="premium-card p-6 flex flex-col md:flex-row gap-6 items-center md:items-start">
            <div className="relative group cursor-pointer flex-shrink-0" onClick={() => avatarInputRef.current?.click()}>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <div className="relative rounded-full overflow-hidden border-2 border-slate-200/60 dark:border-slate-800 shadow-md">
                <UserAvatar
                  name={user.name}
                  avatar={user.avatar}
                  size="lg"
                  className="group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-205">
                  <Camera className="w-6 h-6 text-white animate-pulse" />
                </div>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="flex-grow space-y-4 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-550 dark:text-slate-400">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="premium-input focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-550 dark:text-slate-400">Email Address</label>
                  <input
                    type="email"
                    required
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="premium-input focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Organization Role</label>
                <input
                  type="text"
                  disabled
                  value={user.role || 'user'}
                  className="premium-input bg-slate-50 dark:bg-slate-950/20 text-slate-400 cursor-not-allowed border-dashed"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="premium-button-primary py-2 px-5 text-xs font-semibold shadow-md shadow-primary/25 cursor-pointer"
                >
                  {updateProfileMutation.isPending ? 'Saving...' : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>

          <div className="premium-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Key className="w-4.5 h-4.5 text-primary animate-pulse" />
              <span>Change Password</span>
            </h3>
            <p className="text-xs text-slate-450 dark:text-slate-400">Update security keys to keep your cloud workspace safe</p>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {pwdError && (
                <div className="flex gap-2 items-center p-3 bg-red-500/5 dark:bg-red-500/10 border border-red-500/10 text-rose-500 text-xs rounded-xl">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{pwdError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Current Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="premium-input focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="premium-input focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Confirm Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="premium-input focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="premium-button-primary py-2 px-5 text-xs font-semibold shadow-md shadow-primary/25 cursor-pointer"
                >
                  {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="premium-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Shield className="w-4.5 h-4.5 text-primary" />
              <span>Storage Thresholds</span>
            </h3>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-405">Total capacity</span>
                <span className="text-slate-650 dark:text-slate-350">{Math.round(storagePercentage)}% Used</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                  style={{ width: `${storagePercentage}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                {formatBytes(user.storageUsed)} of {formatBytes(user.storageLimit)} allocated space used
              </p>
            </div>
          </div>

          <div className="premium-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Laptop className="w-4.5 h-4.5 text-primary" />
              <span>Active Sessions</span>
            </h3>
            <p className="text-xs text-slate-400">Devices currently logged into this CloudVault workspace</p>

            <div className="divide-y divide-slate-100 dark:divide-slate-850">
              {sessionsLoading ? (
                <div className="py-4 text-center text-xs text-slate-450">Loading sessions...</div>
              ) : (
                sessions.map((sess) => (
                  <div key={sess.id} className="flex items-center justify-between py-3 gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-lg flex-shrink-0 mt-0.5">
                        {sess.device.includes('Mac') || sess.device.includes('PC') ? (
                          <Laptop className="w-4 h-4 text-primary" />
                        ) : (
                          <Smartphone className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {sess.device}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                          {sess.ip} • {sess.location}
                        </p>
                        {sess.isCurrent && (
                          <span className="inline-block bg-primary/10 text-primary dark:text-primary-light text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full mt-1">
                            Current Device
                          </span>
                        )}
                      </div>
                    </div>

                    {!sess.isCurrent && (
                      <button
                        onClick={() => revokeSessionMutation.mutate(sess.id)}
                        className="p-1.5 hover:bg-red-500/10 text-slate-450 hover:text-danger rounded-lg transition-colors flex-shrink-0"
                        title="Revoke session access"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
export default Profile;
