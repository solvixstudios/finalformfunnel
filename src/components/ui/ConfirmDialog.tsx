import { AlertCircle, Loader2 } from 'lucide-react';
import { useI18n } from '../../lib/i18n/i18nContext';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  isDangerous = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const { t, dir } = useI18n();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in"
      dir={dir}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95">
        <div className="p-6">
          {isDangerous && (
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={24} className="text-red-600" />
            </div>
          )}
          <h2 className="text-lg font-bold text-slate-900 text-center mb-2">{title}</h2>
          <p className="text-sm text-slate-600 text-center">{message}</p>
        </div>
        <div className="p-4 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold disabled:opacity-50"
          >
            {cancelText || t('dashboard.integrations.cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all disabled:opacity-50 ${
              isDangerous
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {confirmText || t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
