import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFormImportExport } from '@/hooks/useFormImportExport';
import type { SavedForm } from '@/lib/firebase/types';
import type { FormConfig } from '@/stores/formStore';
import { useFormStore } from '@/stores/formStore';
import { AlertCircle, CheckCircle, FileText, Search, Sparkles, Upload, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { TemplateGrid } from '../PrebuiltConfigModal';
import { FormLoadingCard, FormLoadingCardSkeleton, FormLoadingEmptyState } from './FormLoadingCard';

interface FormLoadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  forms: SavedForm[];
  isLoading: boolean;
  onLoadForm: (form: SavedForm) => void;
  onLoadTemplate: (config: Partial<FormConfig>, name?: string) => void;
  onImportJson: (config: Partial<FormConfig>) => void;
  onRenameForm?: (id: string, name: string) => Promise<void>;
  onDeleteForm?: (id: string) => Promise<void>;
}

/**
 * Unified form load dialog with tabs for:
 * - Saved Forms (from Firebase)
 * - Templates (built-in and presets)
 * - JSON Import (file upload or paste)
 */
export const FormLoadDialog: React.FC<FormLoadDialogProps> = ({
  isOpen,
  onClose,
  forms,
  isLoading,
  onLoadForm,
  onLoadTemplate,
  onImportJson,
  onRenameForm,
  onDeleteForm,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'forms' | 'templates' | 'import'>('forms');

  // Use separate selectors to avoid infinite loops
  const updateSavedFormInList = useFormStore((state) => state.updateSavedFormInList);
  const removeFromSavedFormsList = useFormStore((state) => state.removeFromSavedFormsList);

  // Import JSON inline state
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [jsonText, setJsonText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  // Sort and filter forms by search query
  const sortedForms = useMemo(() => {
    let filtered = [...forms];

    if (searchQuery.trim()) {
      filtered = filtered.filter(form =>
        form.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (form.description && form.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt).getTime();
      return dateB - dateA;
    });
  }, [forms, searchQuery]);

  const handleImportSuccess = (config: FormConfig) => {
    onImportJson(config);
    setShowImportModal(false);
    onClose();
  };

  const { validateJsonContent, importFromFile } = useFormImportExport();

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    setIsImporting(true);
    setImportError(null);
    setImportSuccess(false);

    try {
      const result = await importFromFile(file);

      if (result.valid && result.config) {
        onImportJson(result.config);
        setImportSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setImportError(result.errors.join(', '));
      }
    } catch (err: any) {
      setImportError(err.message || 'Failed to import file');
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Handle JSON paste
  const handleJsonImport = () => {
    if (!jsonText.trim()) {
      setImportError('Please paste JSON content');
      return;
    }

    setIsImporting(true);
    setImportError(null);
    setImportSuccess(false);

    try {
      const result = validateJsonContent(jsonText);

      if (result.valid && result.config) {
        onImportJson(result.config);
        setImportSuccess(true);
        setTimeout(() => {
          setJsonText('');
          onClose();
        }, 1500);
      } else {
        setImportError(result.errors.join(', '));
      }
    } catch (err: any) {
      setImportError(err.message || 'Invalid JSON');
    } finally {
      setIsImporting(false);
    }
  };

  const handleLoadForm = (form: SavedForm) => {
    onLoadForm(form);
  };


  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
          onClose();
          setSearchQuery('');
          setActiveTab('forms');
        }
      }}>
        <DialogContent className="sm:max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200 flex-shrink-0 bg-white">
            <DialogTitle className="text-xl font-bold text-slate-900">Load Form</DialogTitle>
            <DialogDescription className="text-slate-600 mt-1">
              Browse your saved forms, choose from templates, or import JSON
            </DialogDescription>
          </div>

          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="flex-1 flex flex-col min-h-0">
            {/* Tab List */}
            <div className="px-6 pt-4 pb-3 bg-white border-b border-slate-200 flex-shrink-0">
              <TabsList className="w-full justify-start bg-transparent p-0 border-0 gap-6 h-auto">
                <TabsTrigger
                  value="forms"
                  className="rounded-none px-1 py-2.5 border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:bg-transparent bg-transparent gap-2 font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <FileText size={18} />
                  My Forms
                </TabsTrigger>
                <TabsTrigger
                  value="templates"
                  className="rounded-none px-1 py-2.5 border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:bg-transparent bg-transparent gap-2 font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <Sparkles size={18} />
                  Templates
                </TabsTrigger>
                <TabsTrigger
                  value="import"
                  className="rounded-none px-1 py-2.5 border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:bg-transparent bg-transparent gap-2 font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <Upload size={18} />
                  Import JSON
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Saved Forms Tab */}
            <TabsContent value="forms" className="flex-1 flex flex-col min-h-0 m-0 outline-none data-[state=inactive]:hidden">
              {/* Search Bar - Always Visible */}
              <div className="relative px-6 py-4 border-b border-slate-100 flex-shrink-0 bg-slate-50">
                <Search className="absolute left-9 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input
                  type="text"
                  placeholder={forms.length === 0 ? "No forms yet..." : "Search forms..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 bg-white"
                  disabled={forms.length === 0}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-9 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded hover:bg-slate-100"
                    title="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 p-6 bg-slate-50">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormLoadingCardSkeleton count={4} />
                  </div>
                ) : sortedForms.length === 0 && searchQuery ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                      <Search className="text-slate-400" size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No forms found</h3>
                    <p className="text-sm text-slate-500 max-w-sm">
                      No forms match "{searchQuery}". Try a different search term.
                    </p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-4 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      Clear search
                    </button>
                  </div>
                ) : forms.length === 0 ? (
                  <FormLoadingEmptyState hasSearchQuery={false} />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedForms.map((form) => (
                      <FormLoadingCard
                        key={form.id}
                        form={{
                          id: form.id,
                          name: form.name,
                          description: form.description,
                          updatedAt: form.updatedAt,
                          createdAt: form.createdAt,
                        }}
                        onClick={() => handleLoadForm(form)}
                        onRename={(name) => onRenameForm ? onRenameForm(form.id, name) : Promise.resolve()}
                        onDelete={() => onDeleteForm ? onDeleteForm(form.id) : Promise.resolve()}
                      />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="flex-1 flex flex-col min-h-0 m-0 outline-none overflow-y-auto bg-slate-50 data-[state=inactive]:hidden">
              <div className="p-6">
                <TemplateGrid
                  onApply={(config, name) => {
                    onLoadTemplate(config, name);
                    onClose();
                  }}
                />
              </div>
            </TabsContent>

            {/* Import JSON Tab - Horizontal Split */}
            <TabsContent value="import" className="flex-1 flex flex-col min-h-0 m-0 outline-none data-[state=inactive]:hidden">
              <div className="flex-1 flex gap-6 p-6 bg-slate-50 overflow-hidden">
                {/* Left Side - File Upload */}
                <div className="flex-1 flex flex-col">
                  <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <Upload size={20} className="text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">Upload JSON File</h3>
                        <p className="text-xs text-slate-500">Drag & drop or click to browse</p>
                      </div>
                    </div>

                    {/* Drop Zone */}
                    <div
                      onDrop={handleDragDrop}
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 border-2 border-dashed border-slate-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer flex flex-col items-center justify-center p-8 relative group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />

                      <div className="relative text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                          <Upload size={32} className="text-indigo-600" />
                        </div>

                        <h4 className="font-bold text-slate-900 mb-2">Drop your JSON file here</h4>
                        <p className="text-sm text-slate-500 mb-4">or click to browse your files</p>

                        <div className="flex items-center justify-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <code className="px-2 py-1 bg-slate-100 rounded font-mono">.json</code>
                          </span>
                          <span>•</span>
                          <span>Max 10MB</span>
                        </div>
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json,application/json"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Center Divider */}
                <div className="flex items-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-px h-20 bg-slate-300" />
                    <div className="w-12 h-12 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center shadow-sm">
                      <span className="text-xs font-bold text-slate-500">OR</span>
                    </div>
                    <div className="w-px h-20 bg-slate-300" />
                  </div>
                </div>

                {/* Right Side - Paste JSON */}
                <div className="flex-1 flex flex-col">
                  <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">Paste JSON</h3>
                        <p className="text-xs text-slate-500">Copy & paste your configuration</p>
                      </div>
                    </div>

                    {/* JSON Textarea */}
                    <textarea
                      value={jsonText}
                      onChange={(e) => { setJsonText(e.target.value); setImportError(null); }}
                      placeholder='{"version": 2, "fields": {...}, ...}'
                      className="flex-1 w-full p-4 border-2 border-slate-200 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none bg-slate-50 hover:bg-white transition-colors"
                      disabled={isImporting}
                    />

                    {/* Import Button */}
                    <button
                      onClick={handleJsonImport}
                      disabled={!jsonText.trim() || isImporting}
                      className="mt-4 w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isImporting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                          <span>Importing...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={18} />
                          <span>Import JSON</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Messages */}
              {(importError || importSuccess) && (
                <div className="px-6 pb-6">
                  {importError && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3 animate-in slide-in-from-top-2">
                      <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
                      <div className="flex-1">
                        <h4 className="font-bold text-red-900 mb-1">Import Failed</h4>
                        <p className="text-sm text-red-700">{importError}</p>
                      </div>
                    </div>
                  )}
                  {importSuccess && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center gap-3 animate-in slide-in-from-top-2">
                      <CheckCircle className="text-green-600" size={20} />
                      <div className="flex-1">
                        <h4 className="font-bold text-green-900">Import Successful!</h4>
                        <p className="text-sm text-green-700">Form imported and loaded successfully</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
};
