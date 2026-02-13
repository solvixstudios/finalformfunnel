import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useFormStore } from '@/stores';
import { Eye, Settings2 } from 'lucide-react';
import { useState } from 'react';
import { BuilderEditor } from './FormTab/BuilderEditor';
import { BuilderPreview } from './FormTab/BuilderPreview';


interface FormTabProps {
  onSaveClick?: () => void;
  onLoadClick?: () => void;
  canSave?: boolean;
  showSaveSuccess?: boolean;
}

const FormTab = ({ onSaveClick, onLoadClick, canSave, showSaveSuccess }: FormTabProps) => {
  const formConfig = useFormStore((state) => state.formConfig);
  const setFormConfig = useFormStore((state) => state.setFormConfig);
  const editingSection = useFormStore((state) => state.editingSection);
  const editingField = useFormStore((state) => state.editingField);
  const setEditingSection = useFormStore((state) => state.setEditingSection);
  const setEditingField = useFormStore((state) => state.setEditingField);

  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const handleUpdateField = (key: string, value: any) => {
    setFormConfig({
      ...formConfig,
      fields: {
        ...formConfig.fields,
        [key]: {
          ...formConfig.fields[key],
          ...value,
        },
      },
    });
  };

  const handleLocationModeChangeWrapper = (mode: string) => {
    const newFields = { ...formConfig.fields };

    if (mode === 'free_text') {
      newFields.address = { ...newFields.address, visible: true, required: true };
      newFields.wilaya = { ...newFields.wilaya, visible: false, required: false };
      newFields.commune = { ...newFields.commune, visible: false, required: false };
    } else if (mode === 'single_dropdown') {
      newFields.address = { ...newFields.address, visible: false, required: false };
      newFields.wilaya = { ...newFields.wilaya, visible: true, required: true };
      newFields.commune = { ...newFields.commune, visible: false, required: false };
    } else if (mode === 'double_dropdown') {
      newFields.address = { ...newFields.address, visible: false, required: false };
      newFields.wilaya = { ...newFields.wilaya, visible: true, required: true };
      newFields.commune = { ...newFields.commune, visible: true, required: true };
    }

    setFormConfig({
      ...formConfig,
      locationInputMode: mode as any,
      fields: newFields,
    });
  };

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  if (isDesktop) {
    return (
      <div className="w-full flex overflow-hidden bg-white h-full">
        <BuilderEditor
          editingSection={editingSection}
          editingField={editingField}
          setEditingSection={setEditingSection}
          setEditingField={setEditingField}
          formConfig={formConfig}
          setFormConfig={setFormConfig}
          handleLocationModeChangeWrapper={handleLocationModeChangeWrapper}
          handleUpdateField={handleUpdateField}
          onLoadClick={onLoadClick}
        />



        {/* Preview */}
        <div className="flex-1 h-full min-w-0">
          <BuilderPreview
            formConfig={formConfig}
            previewWidth="100%"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white flex flex-col overflow-hidden">
      <div className="flex-1 overflow-hidden relative">
        <div className={`w-full h-full ${activeTab === 'editor' ? 'block' : 'hidden'}`}>
          <div className="flex w-full h-full">

            <BuilderEditor
              editingSection={editingSection}
              editingField={editingField}
              setEditingSection={setEditingSection}
              setEditingField={setEditingField}
              formConfig={formConfig}
              setFormConfig={setFormConfig}
              handleLocationModeChangeWrapper={handleLocationModeChangeWrapper}
              handleUpdateField={handleUpdateField}
              onLoadClick={onLoadClick}
            />
          </div>
        </div>
        <div className={`w-full h-full ${activeTab === 'preview' ? 'block' : 'hidden'}`}>
          <BuilderPreview
            formConfig={formConfig}
            previewWidth="100%"
          />
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="flex-shrink-0 bg-white border-t border-slate-200 flex pb-safe">
        <button
          onClick={() => setActiveTab('editor')}
          className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${activeTab === 'editor' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:bg-slate-50'
            }`}
        >
          <Settings2 size={20} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Éditeur</span>
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${activeTab === 'preview' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:bg-slate-50'
            }`}
        >
          <Eye size={20} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Aperçu</span>
        </button>
      </div>
    </div>
  );
};

export default FormTab;
