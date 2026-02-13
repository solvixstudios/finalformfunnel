import { Plus, Sparkles, X } from 'lucide-react';
import { CONFIG_PRESETS } from '../lib/configPresets';
import { DEFAULT_FORM_CONFIG } from '../lib/constants';

interface PrebuiltConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (config: Partial<typeof DEFAULT_FORM_CONFIG>) => void;
}

interface TemplateGridProps {
  onApply: (config: Partial<typeof DEFAULT_FORM_CONFIG>, name?: string) => void;
}

/**
 * Template grid component - can be used standalone without modal wrapper
 */
export function TemplateGrid({ onApply }: TemplateGridProps) {
  const handleLoadConfig = (preset: typeof CONFIG_PRESETS[0]) => {
    onApply(preset.config, preset.name);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {/* Start from Scratch Option */}
      <button
        onClick={() => onApply({}, 'New Form')}
        className="p-5 bg-white border-2 border-dashed border-slate-200 rounded-xl text-left hover:border-indigo-400 hover:bg-slate-50 transition-all group relative overflow-hidden min-h-[140px] flex flex-col"
      >
        <div className="relative flex-1 flex flex-col justify-between h-full">
          <div>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mb-3 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
              <Plus size={16} />
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-indigo-700 transition-colors">
              Start from Scratch
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">Build your form component by component.</p>
          </div>
          <div className="mt-3 text-[10px] font-bold text-indigo-600 uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity">
            Create Empty →
          </div>
        </div>
      </button>

      {/* Templates */}
      {CONFIG_PRESETS.map((preset) => (
        <button
          key={preset.id}
          onClick={() => handleLoadConfig(preset)}
          className="p-5 bg-white border border-slate-200 rounded-xl text-left hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-100/50 transition-all group relative overflow-hidden min-h-[140px] flex flex-col"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex-1 flex flex-col">
            <h4 className="text-sm font-bold text-slate-900 mb-2 group-hover:text-indigo-700 transition-colors">
              {preset.name}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed flex-1">{preset.description}</p>
            <div className="mt-3 text-[10px] font-bold text-indigo-600 uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity">
              Use Template →
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

/**
 * Modal wrapper for template selection (backward compatibility)
 */
export default function PrebuiltConfigModal({
  isOpen,
  onClose,
  onLoad,
}: PrebuiltConfigModalProps) {
  if (!isOpen) return null;

  const handleApply = (config: Partial<typeof DEFAULT_FORM_CONFIG>) => {
    onLoad(config);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-5xl h-full max-h-[90vh] sm:max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100 bg-white/50 backdrop-blur-sm shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200/50">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">Create New Form</h3>
              <p className="text-xs text-slate-500 hidden sm:block">Choose a validated high-converting template</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 custom-scroll">
          <TemplateGrid onApply={handleApply} />
        </div>
      </div>
    </div>
  );
}
