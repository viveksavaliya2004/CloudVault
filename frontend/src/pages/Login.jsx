import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Key, Mail, User, ArrowRight } from 'lucide-react';
import { useLoginMutation, useRegisterMutation } from '../hooks/useAuth';

export const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [activeField, setActiveField] = useState(null);
  
  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    if (isRegister) {
      if (!name.trim()) return;
      registerMutation.mutate({ name: name.trim(), email: email.trim(), password }, {
        onSuccess: () => {
          setIsRegister(false);
          setName('');
        }
      });
    } else {
      loginMutation.mutate({ email: email.trim(), password }, {
        onSuccess: () => navigate('/')
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slateBg-light dark:bg-slateBg-darker p-4 text-slate-800 dark:text-slate-200 select-none">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full filter blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/10 rounded-full filter blur-3xl" />
      </div>

      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="w-full max-w-md bg-white/70 dark:bg-slate-900/60 border border-slate-205 dark:border-slate-800 shadow-2xl rounded-3xl backdrop-blur-md overflow-hidden relative z-10 p-8 space-y-6 text-left"
      >
        <div className="flex flex-col items-center text-center space-y-3">
          <motion.div 
            whileHover={{ scale: 1.06, rotate: 8 }}
            whileTap={{ scale: 0.95 }}
            className="bg-primary flex items-center justify-center p-3.5 rounded-2xl text-white shadow-lg shadow-primary/20 cursor-pointer"
          >
            <Shield className="w-6 h-6 fill-white/10" />
          </motion.div>
          <div>
            <motion.h1 
              layout="position"
              className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
            >
              CloudVault Drive
            </motion.h1>
            <motion.p 
              layout="position"
              className="text-xs text-slate-400 dark:text-slate-500 mt-1"
            >
              {isRegister ? 'Create an account to host your secure cloud documents' : 'Enter credentials to access your secure cloud drive storage'}
            </motion.p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence initial={false} mode="sync">
            {isRegister && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-1.5 overflow-hidden"
              >
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Full Name</label>
                <div 
                  className={`relative rounded-xl border transition-all duration-200 ${
                    activeField === 'name' 
                      ? 'border-primary ring-2 ring-primary/20 bg-white dark:bg-slate-900' 
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20'
                  }`}
                >
                  <User className={`w-4 h-4 absolute left-3.5 top-3.5 transition-colors ${activeField === 'name' ? 'text-primary' : 'text-slate-400'}`} />
                  <input
                    type="text"
                    required
                    placeholder="Alex Rivera"
                    value={name}
                    onFocus={() => setActiveField('name')}
                    onBlur={() => setActiveField(null)}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-transparent border-none focus:outline-none outline-none"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div layout="position" className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Email Address</label>
            <div 
              className={`relative rounded-xl border transition-all duration-200 ${
                activeField === 'email' 
                  ? 'border-primary ring-2 ring-primary/20 bg-white dark:bg-slate-900' 
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20'
              }`}
            >
              <Mail className={`w-4 h-4 absolute left-3.5 top-3.5 transition-colors ${activeField === 'email' ? 'text-primary' : 'text-slate-400'}`} />
              <input
                type="email"
                required
                placeholder="you@company.com"
                value={email}
                onFocus={() => setActiveField('email')}
                onBlur={() => setActiveField(null)}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-transparent border-none focus:outline-none outline-none"
              />
            </div>
          </motion.div>

          <motion.div layout="position" className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Password</label>
            <div 
              className={`relative rounded-xl border transition-all duration-200 ${
                activeField === 'password' 
                  ? 'border-primary ring-2 ring-primary/20 bg-white dark:bg-slate-900' 
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20'
              }`}
            >
              <Key className={`w-4 h-4 absolute left-3.5 top-3.5 transition-colors ${activeField === 'password' ? 'text-primary' : 'text-slate-400'}`} />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onFocus={() => setActiveField('password')}
                onBlur={() => setActiveField(null)}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-transparent border-none focus:outline-none outline-none"
              />
            </div>
          </motion.div>

          <motion.div layout="position" className="pt-2">
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              type="submit"
              disabled={loginMutation.isPending || registerMutation.isPending}
              className="w-full premium-button-primary py-2.5 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>
                {isRegister
                  ? registerMutation.isPending
                    ? 'Registering...'
                    : 'Create Account'
                  : loginMutation.isPending
                  ? 'Signing in...'
                  : 'Sign In'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        </form>

        <motion.div layout="position" className="text-center text-xs text-slate-500 select-none">
          {isRegister ? (
            <p>
              Already have an account?{' '}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setEmail('');
                  setPassword('');
                }}
                className="text-primary hover:underline font-semibold cursor-pointer"
              >
                Sign In
              </motion.button>
            </p>
          ) : (
            <p>
              Don't have an account?{' '}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setEmail('');
                  setPassword('');
                }}
                className="text-primary hover:underline font-semibold cursor-pointer"
              >
                Create Account
              </motion.button>
            </p>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};
export default Login;
