import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, Mail, ArrowLeft, CheckCircle2, ShieldCheck, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import { useForgotPasswordMutation, useResetPasswordMutation } from '../hooks/useAuth';

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Enter Email, 2: Enter OTP & New Password

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const forgotPasswordMutation = useForgotPasswordMutation();
  const resetPasswordMutation = useResetPasswordMutation();

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

  const handleSendOtp = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    forgotPasswordMutation.mutate(email, {
      onSuccess: () => {
        setStep(2);
      },
      onError: (err) => {
        setErrorMsg(err.response?.data?.message || 'Failed to send OTP code.');
      }
    });
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!otp.trim() || otp.length !== 6) {
      setErrorMsg('Please enter a valid 6-digit OTP code.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    resetPasswordMutation.mutate(
      { email, otp, newPassword },
      {
        onSuccess: () => {
          navigate('/login');
        },
        onError: (err) => {
          setErrorMsg(err.response?.data?.message || 'Failed to reset password.');
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-slateBg-light dark:bg-slateBg-darker flex flex-col justify-center py-12 sm:px-6 lg:px-8 select-none">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-4">
          <div className="bg-primary flex items-center justify-center p-3.5 rounded-2xl text-white shadow-lg shadow-primary/20">
            <Shield className="w-7 h-7 fill-white/10" />
          </div>
        </div>
        <h2 className="text-center text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Forgot Password
        </h2>
        <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
          {step === 1 
            ? "Enter your account email to receive a 6-digit verification code" 
            : `We sent a 6-digit OTP to ${email}`}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 py-8 px-6 shadow-xl border border-slate-200/60 dark:border-slate-800 rounded-3xl"
        >
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-rose-500 text-xs rounded-xl flex items-center gap-2"
            >
              <span>{errorMsg}</span>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form 
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSendOtp} 
                className="space-y-6"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="premium-input pl-10 bg-slate-50 dark:bg-slate-950/50"
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={forgotPasswordMutation.isPending}
                  className="w-full premium-button-primary py-3 text-sm font-semibold rounded-xl shadow-lg shadow-primary/25 cursor-pointer flex items-center justify-center gap-2"
                >
                  {forgotPasswordMutation.isPending ? 'Sending Code...' : 'Send Verification OTP'}
                  <ShieldCheck className="w-4 h-4" />
                </motion.button>

                <div className="text-center pt-2">
                  <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-primary transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                  </Link>
                </div>
              </motion.form>
            ) : (
              <motion.form 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleResetPassword} 
                className="space-y-5"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    6-Digit OTP Code
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                      className="premium-input pl-10 tracking-widest font-mono text-base font-bold bg-slate-50 dark:bg-slate-950/50"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Check backend server console if testing locally</p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      New Password
                    </label>
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-primary text-xs hover:text-primary-dark transition-colors flex items-center gap-1"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="premium-input pl-10 bg-slate-50 dark:bg-slate-950/50"
                    />
                  </div>

                  {/* Password strength indicator */}
                  {newPassword.length > 0 && (
                    <div className="pt-2 space-y-2">
                      <div className="flex gap-1.5 h-1.5 w-full">
                        {[1, 2, 3, 4].map((level) => (
                          <div 
                            key={level} 
                            className={`flex-1 rounded-full transition-colors duration-500 ${pwdStrength.score >= level ? pwdStrength.color : 'bg-slate-100 dark:bg-slate-800'}`}
                          />
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <div className="flex items-center gap-1 text-[10px]">
                          <CheckCircle2 className={`w-3 h-3 ${newPassword.length >= 8 ? 'text-emerald-500' : 'text-slate-300'}`} />
                          <span className={newPassword.length >= 8 ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-400'}>8+ chars</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px]">
                          <CheckCircle2 className={`w-3 h-3 ${/[0-9]/.test(newPassword) ? 'text-emerald-500' : 'text-slate-300'}`} />
                          <span className={/[0-9]/.test(newPassword) ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-400'}>Number</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="premium-input pl-10 bg-slate-50 dark:bg-slate-950/50"
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={resetPasswordMutation.isPending}
                  className="w-full premium-button-primary py-3 text-sm font-semibold rounded-xl shadow-lg shadow-primary/25 cursor-pointer"
                >
                  {resetPasswordMutation.isPending ? 'Resetting Password...' : 'Reset Password & Sign In'}
                </motion.button>

                <div className="flex items-center justify-between pt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    Change Email
                  </button>
                  <Link to="/login" className="font-semibold text-primary hover:underline">
                    Back to Sign In
                  </Link>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
