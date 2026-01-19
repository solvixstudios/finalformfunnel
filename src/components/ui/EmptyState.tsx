import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'success' | 'warning' | 'error';
}

const variantStyles = {
  default: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-600',
  },
  success: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-600',
  },
  warning: {
    bg: 'bg-amber-100',
    text: 'text-amber-600',
  },
  error: {
    bg: 'bg-red-100',
    text: 'text-red-600',
  },
};

const EmptyState = ({
  icon,
  title,
  description,
  action,
  variant = 'default',
}: EmptyStateProps) => {
  const { bg, text } = variantStyles[variant];

  return (
    <div className="bg-white/50 backdrop-blur border border-slate-200 rounded-2xl p-16 text-center">
      <div className={`w-16 h-16 ${bg} rounded-xl flex items-center justify-center mx-auto mb-4`}>
        <div className={text}>{icon}</div>
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold inline-flex items-center gap-2 hover:shadow-lg transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
