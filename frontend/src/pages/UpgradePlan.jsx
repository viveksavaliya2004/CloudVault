import React from 'react';
import { CheckCircle2, Shield, Zap, Server, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const UpgradePlan = () => {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: '/forever',
      description: 'Perfect for individuals just getting started with cloud storage.',
      features: [
        '5 GB of secure storage',
        'Standard upload speeds',
        'Basic file sharing',
        'Community support',
      ],
      icon: Shield,
      isPopular: false,
      buttonText: 'Current Plan',
      buttonStyle: 'premium-button bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
    },
    {
      name: 'Pro',
      price: '$9',
      period: '/month',
      description: 'Ideal for professionals needing more space and advanced features.',
      features: [
        '100 GB of secure storage',
        'Priority bandwidth and upload speeds',
        'Advanced link sharing controls',
        'Priority email support',
        'Automatic file versioning'
      ],
      icon: Zap,
      isPopular: true,
      buttonText: 'Upgrade to Pro',
      buttonStyle: 'premium-button-primary'
    },
    {
      name: 'Business',
      price: '$29',
      period: '/month',
      description: 'Built for teams requiring massive storage and admin controls.',
      features: [
        '2 TB of secure storage',
        'Unlimited upload/download bandwidth',
        'Team management and roles',
        '24/7 dedicated phone support',
        'Advanced security and audit logs'
      ],
      icon: Server,
      isPopular: false,
      buttonText: 'Contact Sales',
      buttonStyle: 'premium-button bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-900 dark:hover:bg-white'
    }
  ];

  return (
    <div className="page-container py-12 max-w-6xl mx-auto select-none text-left">
      <div className="text-center mb-16 space-y-4">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight"
        >
          Simple, transparent pricing
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto"
        >
          No hidden fees. No surprise charges. Choose the plan that perfectly matches your storage needs and upgrade anytime as you grow.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {plans.map((plan, idx) => {
          const Icon = plan.icon;
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              key={plan.name}
              className={`relative flex flex-col p-8 rounded-3xl border ${
                plan.isPopular 
                  ? 'border-primary/50 shadow-xl shadow-primary/10 bg-gradient-to-b from-primary/5 to-transparent' 
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-primary text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-xl ${plan.isPopular ? 'bg-primary/20 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                </div>
                
                <p className="text-sm text-slate-500 dark:text-slate-400 h-10 mb-6">
                  {plan.description}
                </p>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900 dark:text-white">{plan.price}</span>
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{plan.period}</span>
                </div>
              </div>

              <div className="flex-grow">
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link to="/" className={`w-full text-center py-3 px-6 rounded-xl font-bold transition-all ${plan.buttonStyle}`}>
                {plan.buttonText}
              </Link>
            </motion.div>
          );
        })}
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-16 text-center"
      >
        <Link to="/" className="inline-flex items-center text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-primary transition-colors">
          Return to Dashboard <ChevronRight className="w-4 h-4 ml-1" />
        </Link>
      </motion.div>
    </div>
  );
};

export default UpgradePlan;
