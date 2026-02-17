
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Plus, Sparkles } from 'lucide-react';
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
 * Template grid component
 */
export function TemplateGrid({ onApply }: TemplateGridProps) {
  const handleLoadConfig = (preset: typeof CONFIG_PRESETS[0]) => {
    onApply(preset.config, preset.name);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
      {/* Start from Scratch Option */}
      <button
        onClick={() => onApply({}, 'New Form')}
        className="p-5 bg-white border-2 border-dashed border-slate-200 rounded-xl text-left hover:border-slate-900 hover:bg-slate-50 transition-all group relative overflow-hidden min-h-[160px] flex flex-col items-start"
      >
        <div className="relative flex-1 flex flex-col justify-between h-full w-full">
          <div>
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-4 group-hover:bg-slate-900 group-hover:text-white transition-colors">
              <Plus size={20} />
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-slate-900 transition-colors">
              Start from Scratch
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed max-w-[90%]">Build your form component by component.</p>
          </div>
          <div className="mt-4 text-[10px] font-bold text-slate-900 uppercase tracking-wide opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            Create Empty →
          </div>
        </div>
      </button>

      {/* Templates */}
      {CONFIG_PRESETS.map((preset) => (
        <button
          key={preset.id}
          onClick={() => handleLoadConfig(preset)}
          className="p-5 bg-white border border-slate-200 rounded-xl text-left hover:border-slate-400 hover:shadow-md transition-all group relative overflow-hidden min-h-[160px] flex flex-col"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex-1 flex flex-col h-full">
            <h4 className="text-sm font-bold text-slate-900 mb-2 group-hover:text-slate-900 transition-colors">
              {preset.name}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed flex-1">{preset.description}</p>
            <div className="mt-4 text-[10px] font-bold text-slate-900 uppercase tracking-wide opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-1">
              Use Template <Sparkles size={10} className="text-amber-500" />
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

/**
 * Modal wrapper for template selection
 * Uses standard Radix UI Dialog for proper z-index and portal handling
 */
export default function PrebuiltConfigModal({
  isOpen,
  onClose,
  onLoad,
}: PrebuiltConfigModalProps) {
  const handleApply = (config: Partial<typeof DEFAULT_FORM_CONFIG>) => {
    onLoad(config);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col p-0 rounded-2xl overflow-hidden bg-slate-50">
        <DialogHeader className="px-6 py-5 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center text-white shadow-lg shadow-slate-200">
              <Sparkles size={20} className="text-amber-300" />
            </div>
            <div className="text-left">
              <DialogTitle className="text-lg font-bold text-slate-900">Create New Form</DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Start from scratch or choose a high-converting template
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 custom-scroll">
          <TemplateGrid onApply={handleApply} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
