import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import type { FormConfig } from '@/stores/formStore';
import { Sparkles } from 'lucide-react';
import React from 'react';
import { TemplateGrid } from '../PrebuiltConfigModal';

interface FormLoadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTemplate: (config: Partial<FormConfig>, name?: string) => void;
}

/**
 * Template Picker Dialog
 * Simplified dialog to choose a starting template
 */
export const FormLoadDialog: React.FC<FormLoadDialogProps> = ({
  isOpen,
  onClose,
  onLoadTemplate,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex-shrink-0 bg-white">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
              <Sparkles size={18} />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900">Choose a Template</DialogTitle>
          </div>
          <DialogDescription className="text-slate-600">
            Start with a professionally designed template
          </DialogDescription>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
          <TemplateGrid
            onApply={(config, name) => {
              onLoadTemplate(config, name);
              onClose();
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
