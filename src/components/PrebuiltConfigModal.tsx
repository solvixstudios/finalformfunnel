import { Sparkles, X } from 'lucide-react';
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
    onLoad(config); // The parent passes 'applyTemplate' or similar here?
    // Wait, the parent of PrebuiltConfigModal is probably passing 'applyTemplate' logic or 'loadFormConfig'.
    // We should change the interface semantic or ensure the parent passes the right function.
    // The props say "onLoad".
    // I will check where PrebuiltConfigModal is used.
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Prebuilt Config Presets</h3>
              <p className="text-xs text-slate-500">Choose a preconfigured form for your use case</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <TemplateGrid onApply={handleApply} />
        </div>
      </div>
    </div>
  );
}
