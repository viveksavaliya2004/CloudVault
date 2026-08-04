import React from 'react';
import { CheckCircle2, Shield, Zap, Server, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const UpgradePlan = () => {
  const plans = [
    {
      name: 'Free',
      price: '₹0',
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
      buttonStyle: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
    },
    {
      name: 'Pro',
      price: '₹799',
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
      buttonStyle: 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20'
    },
    {
      name: 'Business',
      price: '₹2,499',
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
      buttonStyle: 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white'
    }
  ];

  return (
    <div className="page-container py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto select-none text-left">
      <div className="text-center mb-10 sm:mb-16 space-y-3 sm:space-y-4">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight"
        >
          Simple, transparent pricing
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-sm sm:text-base lg:text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto"
        >
          No hidden fees. No surprise charges. Choose the plan that perfectly matches your storage needs and upgrade anytime as you grow.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
        {plans.map((plan, idx) => {
          const Icon = plan.icon;
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              key={plan.name}
              className={`relative flex flex-col justify-between p-6 sm:p-8 rounded-3xl border transition-all ${
                plan.isPopular 
                  ? 'border-primary/50 shadow-xl shadow-primary/10 bg-gradient-to-b from-primary/5 via-primary/[0.02] to-transparent ring-2 ring-primary/20' 
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-white text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md whitespace-nowrap">
                    Most Popular
                  </span>
                </div>
              )}

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2.5 rounded-2xl ${plan.isPopular ? 'bg-primary/20 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                </div>
                
                <p className="text-sm text-slate-500 dark:text-slate-400 min-h-[2.5rem] mb-6">
                  {plan.description}
                </p>

                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">{plan.price}</span>
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{plan.period}</span>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-6 mb-8">
                  <ul className="space-y-3.5">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Link to="/" className={`w-full text-center py-3 px-6 rounded-2xl font-bold transition-all text-sm ${plan.buttonStyle}`}>
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
        className="mt-12 sm:mt-16 text-center"
      >
        <Link to="/" className="inline-flex items-center text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-primary transition-colors">
          Return to Dashboard <ChevronRight className="w-4 h-4 ml-1" />
        </Link>
      </motion.div>
    </div>
  );
};

export default UpgradePlan;
