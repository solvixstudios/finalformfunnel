import { Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { Preset, presetManager } from '../lib/presetManager';

interface PresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onLoad: (data: unknown) => void;
  onSave: (data: unknown, type: 'form' | 'offers' | 'shipping') => void;
}

export default function PresetModal({
  isOpen,
  onClose,
  activeTab,
  onLoad,
  onSave,
}: PresetModalProps) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDesc, setSaveDesc] = useState('');

  if (!isOpen) return null;

  const typeMap = {
    offers: 'offers' as const,
    shipping: 'shipping' as const,
    form: 'form' as const,
  };

  const presetType = typeMap[activeTab as keyof typeof typeMap] || 'form';

  const loadPresets = () => {
    const allPresets = presetManager.getAllPresets();
    setPresets(allPresets[presetType]);
  };

  const handleLoadPreset = (preset: Preset) => {
    onLoad(preset.data);
    onClose();
  };

  const handleSavePreset = () => {
    if (!saveName.trim()) {
      alert('Please enter a preset name');
      return;
    }

    const saved = presetManager.savePreset(presetType, saveName, onSave?.(null, presetType), saveDesc);
    if (saved) {
      setSaveName('');
      setSaveDesc('');
      setShowSaveForm(false);
      loadPresets();
    }
  };

  const handleDeletePreset = (presetId: string) => {
    if (confirm('Delete this preset?')) {
      presetManager.deletePreset(presetId);
      loadPresets();
    }
  };


  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">
            {presetType.charAt(0).toUpperCase() + presetType.slice(1)} Presets
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {/* Presets List */}
          {presets.length > 0 && !showSaveForm && (
            <div className="space-y-2">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between hover:border-slate-300 transition-all"
                >
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-900">{preset.name}</h4>
                    {preset.description && (
                      <p className="text-xs text-slate-500 mt-1">{preset.description}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-2">
                      Updated: {new Date(preset.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLoadPreset(preset)}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => handleDeletePreset(preset.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {presets.length === 0 && !showSaveForm && (
            <div className="text-center py-12">
              <p className="text-slate-500 text-sm">No presets saved yet</p>
            </div>
          )}

          {/* Save Form */}
          {showSaveForm && (
            <div className="space-y-4 max-w-md mx-auto py-4">
              <h4 className="text-sm font-bold text-slate-900">Save New Preset</h4>
              <input
                type="text"
                placeholder="Preset name"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              />
              <textarea
                placeholder="Description (optional)"
                value={saveDesc}
                onChange={(e) => setSaveDesc(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSavePreset}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors"
                >
                  Save Preset
                </button>
                <button
                  onClick={() => setShowSaveForm(false)}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 py-4 flex gap-2">
          {!showSaveForm && (
            <button
              onClick={() => {
                setShowSaveForm(true);
                loadPresets();
              }}
              className="ml-auto flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors"
            >
              <Plus size={14} /> Save Current
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
