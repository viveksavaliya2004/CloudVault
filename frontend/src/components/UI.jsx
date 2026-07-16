import React from 'react';
import { ChevronRight, Folder, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

// Loader Component
export const Loader = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  };
  return (
    <div className="flex items-center justify-center">
      <div className={`animate-spin rounded-full border-t-primary border-slate-200 dark:border-slate-800 ${sizeClasses[size]}`}></div>
    </div>
  );
};

// Skeleton Screen Component
export const Skeleton = ({ className = 'h-4 w-full' }) => {
  return (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-lg ${className}`}></div>
  );
};

// Breadcrumbs Navigator
export const Breadcrumb = ({ items, onNavigate }) => {
  return (
    <nav className="flex items-center gap-1.5 py-2 overflow-x-auto scrollbar-none text-sm text-slate-500 dark:text-slate-400 font-medium">
      <button
        onClick={() => onNavigate(null)}
        className="hover:text-primary dark:hover:text-white transition-colors whitespace-nowrap"
      >
        CloudVault
      </button>
      {items.map((item, idx) => (
        <React.Fragment key={item.id || 'root-crumb'}>
          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-700 flex-shrink-0" />
          <button
            onClick={() => onNavigate(item.id)}
            disabled={idx === items.length - 1}
            className={`hover:text-primary dark:hover:text-white transition-colors whitespace-nowrap ${
              idx === items.length - 1 ? 'text-slate-800 dark:text-slate-100 font-semibold cursor-default' : ''
            }`}
          >
            {item.name}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
};

// Empty State Component
export const EmptyState = ({ title, description, icon, action }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/30 dark:bg-slate-900/10 backdrop-blur-xs min-h-[300px]"
    >
      <div className="p-4 bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 rounded-2xl mb-4">
        {icon || <Folder className="w-10 h-10" />}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">{description}</p>
      {action && (
        <button onClick={action.onClick} className="premium-button-primary">
          {action.label}
        </button>
      )}
    </motion.div>
  );
};

// Error State Component
export const ErrorState = ({ message, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-rose-500/5 border border-rose-500/10 text-center">
      <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
      <h3 className="text-base font-semibold text-rose-800 dark:text-rose-400 mb-1">Something went wrong</h3>
      <p className="text-sm text-rose-600 dark:text-rose-500 max-w-md mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="premium-button-secondary border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-950/60 dark:text-rose-400 dark:hover:bg-rose-950/20">
          Try Again
        </button>
      )}
    </div>
  );
};
// User Initials Avatar Component (Google Drive Style fallback)
export const UserAvatar = ({ name = 'User', avatar = '', size = 'md', className = '' }) => {
  const firstLetter = name.trim().charAt(0).toUpperCase() || 'U';

  const colors = [
    'bg-blue-600 text-white',
    'bg-red-500 text-white',
    'bg-amber-500 text-white',
    'bg-emerald-600 text-white',
    'bg-indigo-600 text-white',
    'bg-purple-600 text-white',
    'bg-rose-500 text-white',
    'bg-teal-600 text-white',
  ];

  const getHashColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px] rounded-full',
    sm: 'w-8.5 h-8.5 text-xs rounded-full',
    md: 'w-10 h-10 text-sm font-semibold rounded-full',
    lg: 'w-24 h-24 text-3xl font-bold rounded-full',
  };

  const [imageError, setImageError] = React.useState(false);

  const hasAvatar = avatar && avatar.trim() !== '' && !imageError;

  if (hasAvatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className={`object-cover border border-slate-200 dark:border-slate-800 rounded-full ${sizeClasses[size] || sizeClasses.md} ${className}`}
        onError={() => setImageError(true)}
      />
    );
  }

  const colorClass = getHashColor(name);

  return (
    <div
      className={`flex items-center justify-center font-bold select-none ${colorClass} ${sizeClasses[size] || sizeClasses.md} ${className}`}
      title={name}
    >
      {firstLetter}
    </div>
  );
};

export default Loader;
