import React, { useRef, useState } from 'react';
import { AlertCircle, Copy, Download, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useFormImportExport } from '@/hooks/useFormImportExport';
import type { FormConfig } from '@/stores/formStore';
import { cn } from '@/lib/utils';

interface ImportJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (config: FormConfig) => void;
}

/**
 * Modal for importing forms from JSON files or text
 * Provides file upload, text paste, and validation
 */
export const ImportJsonModal: React.FC<ImportJsonModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'file' | 'paste'>('file');
  const [jsonText, setJsonText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [showValidationResult, setShowValidationResult] = useState(false);

  const { validateJsonContent, importFromFile } = useFormImportExport();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const result = await importFromFile(file);
      setValidationResult(result);
      setShowValidationResult(true);

      if (result.valid && result.config) {
        onImportSuccess(result.config);
        handleClose();
      }
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePaste = () => {
    if (!jsonText.trim()) return;

    setIsProcessing(true);
    try {
      const result = validateJsonContent(jsonText);
      setValidationResult(result);
      setShowValidationResult(true);

      if (result.valid && result.config) {
        onImportSuccess(result.config);
        handleClose();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInputRef.current.files = dataTransfer.files;
        handleFileSelect({ target: fileInputRef.current } as any);
      }
    }
  };

  const handleClose = () => {
    setJsonText('');
    setValidationResult(null);
    setShowValidationResult(false);
    setActiveTab('file');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose();
    }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Form from JSON</DialogTitle>
          <DialogDescription>
            Upload a JSON file or paste JSON content to import a form configuration
          </DialogDescription>
        </DialogHeader>

        {showValidationResult && validationResult ? (
          <div className="space-y-4">
            {validationResult.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex gap-3 mb-2">
                  <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={18} />
                  <div>
                    <h4 className="font-semibold text-red-900 mb-2">Import Errors</h4>
                    <ul className="space-y-1 text-sm text-red-800">
                      {validationResult.errors.map((error: string, i: number) => (
                        <li key={i}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {validationResult.warnings.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex gap-3 mb-2">
                  <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                  <div>
                    <h4 className="font-semibold text-amber-900 mb-2">Warnings</h4>
                    <ul className="space-y-1 text-sm text-amber-800">
                      {validationResult.warnings.map((warning: string, i: number) => (
                        <li key={i}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tabs */}
            <div className="flex gap-2 border-b">
              <button
                onClick={() => setActiveTab('file')}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                  activeTab === 'file'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                )}
              >
                Upload File
              </button>
              <button
                onClick={() => setActiveTab('paste')}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                  activeTab === 'paste'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                )}
              >
                Paste JSON
              </button>
            </div>

            {/* File Upload Tab */}
            {activeTab === 'file' && (
              <div className="space-y-4">
                <div
                  onDrop={handleDragDrop}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mx-auto mb-3 text-slate-400" size={32} />
                  <h3 className="font-semibold text-slate-900 mb-1">
                    Drag and drop your JSON file here
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    or click to select a file (max 10MB)
                  </p>
                  <Button variant="outline" size="sm">
                    Select File
                  </Button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileSelect}
                    disabled={isProcessing}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            {/* Paste Tab */}
            {activeTab === 'paste' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Paste JSON content
                  </label>
                  <textarea
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    placeholder='{"version": 2, "fields": {...}}'
                    className="w-full h-40 p-3 border border-slate-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    disabled={isProcessing}
                  />
                </div>

                <Button
                  onClick={handlePaste}
                  disabled={!jsonText.trim() || isProcessing}
                  className="w-full"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Download size={16} className="mr-2" />
                      Import JSON
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
