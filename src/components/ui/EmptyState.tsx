import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string | React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'success' | 'warning' | 'error' | 'ghost';
  className?: string;
  compact?: boolean;
}

const variantStyles = {
  default: {
    wrapper: 'bg-slate-50',
    bg: 'bg-white shadow-sm border border-slate-100',
    icon: 'text-slate-500',
    button: 'bg-slate-900 hover:bg-slate-800 text-white shadow-md',
  },
  success: {
    wrapper: 'bg-emerald-50/50',
    bg: 'bg-emerald-100/50 border border-emerald-200/50',
    icon: 'text-emerald-600',
    button: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md',
  },
  warning: {
    wrapper: 'bg-amber-50/50',
    bg: 'bg-amber-100/50 border border-amber-200/50',
    icon: 'text-amber-600',
    button: 'bg-amber-600 hover:bg-amber-700 text-white shadow-md',
  },
  error: {
    wrapper: 'bg-red-50/50',
    bg: 'bg-red-100/50 border border-red-200/50',
    icon: 'text-red-500',
    button: 'bg-red-600 hover:bg-red-700 text-white shadow-md',
  },
  ghost: {
    wrapper: 'bg-transparent border border-dashed border-slate-200',
    bg: 'bg-slate-50',
    icon: 'text-slate-400',
    button: 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm',
  },
};

const EmptyState = ({
  icon,
  title,
  description,
  action,
  variant = 'default',
  className,
  compact = false,
}: EmptyStateProps) => {
  const styles = variantStyles[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        "flex flex-col items-center justify-center text-center w-full rounded-3xl",
        compact ? "py-8 px-6" : "py-16 px-8",
        styles.wrapper,
        className
      )}
    >
      <div
        className={cn(
          "rounded-2xl flex items-center justify-center mb-5 shrink-0 transition-transform hover:scale-105 duration-300",
          compact ? "w-12 h-12" : "w-16 h-16",
          styles.bg
        )}
      >
        <div className={cn(compact ? "scale-75" : "scale-100", styles.icon)}>
          {icon}
        </div>
      </div>

      <h3 className={cn("font-bold text-slate-900 mb-2 tracking-tight", compact ? "text-base" : "text-xl")}>
        {title}
      </h3>

      <p className={cn("text-slate-500 leading-relaxed mb-6", compact ? "text-xs max-w-[240px]" : "text-sm max-w-[320px]")}>
        {description}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className={cn(
            "rounded-full font-bold inline-flex items-center gap-2 transition-all active:scale-95 hover:-translate-y-0.5",
            compact ? "h-9 px-5 text-xs" : "h-11 px-6 text-sm",
            styles.button
          )}
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
};

export default EmptyState;
