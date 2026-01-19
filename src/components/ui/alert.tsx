import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useState, useEffect } from 'react';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  type: AlertType;
  title?: string;
  message: string;
  onClose?: () => void;
  dismissible?: boolean;
  autoClose?: number; // milliseconds
}

const alertConfig = {
  success: {
    icon: CheckCircle,
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-800',
    iconColor: 'text-emerald-600',
  },
  error: {
    icon: AlertCircle,
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    iconColor: 'text-red-600',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    iconColor: 'text-amber-600',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    iconColor: 'text-blue-600',
  },
};

const Alert = ({
  type,
  title,
  message,
  onClose,
  dismissible = true,
  autoClose,
}: AlertProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const config = alertConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  if (!isVisible) return null;

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  return (
    <div
      className={`${config.bg} ${config.border} border rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-4`}
    >
      <Icon size={20} className={`${config.iconColor} mt-0.5 flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        {title && <h4 className={`font-semibold ${config.text} mb-1`}>{title}</h4>}
        <p className={`text-sm ${config.text} opacity-90`}>{message}</p>
      </div>
      {dismissible && (
        <button
          onClick={handleClose}
          className={`${config.text} opacity-50 hover:opacity-100 transition-opacity mt-0.5 flex-shrink-0`}
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
};

export default Alert;
