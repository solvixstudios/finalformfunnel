import { BuilderSkeleton } from '@/components/FormLoading/BuilderSkeleton';
import { FormLoadDialog } from '@/components/FormLoading/FormLoadDialog';
import { PreviewInternalHeader } from '@/components/FormTab/components/PreviewInternalHeader';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import FormTab from '../components/FormTab';
import { useHeaderActions } from '../contexts/HeaderActionsContext';
import { useSavedForms } from '../lib/firebase/hooks';
import { getExportData, loadFormWithValidation } from '../lib/formManagement';
import { useI18n } from '../lib/i18n/i18nContext';
import { useFormStore } from '../stores';

interface BuildPageProps {
  userId: string;
}

const BuildPage = ({ userId }: BuildPageProps) => {
  const { formId: routeFormId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const { t, dir } = useI18n();
  const { saveForm, updateForm, deleteForm, forms, loading: formsLoading } = useSavedForms(userId);
  const formConfig = useFormStore((state) => state.formConfig);
  const formName = useFormStore((state) => state.formName);
  const formId = useFormStore((state) => state.formId);
  const isDirty = useFormStore((state) => state.isDirty);
  const isDraft = useFormStore((state) => state.isDraft);
  const hasUnsavedChanges = useFormStore((state) => state.hasUnsavedChanges);
  const canUndo = useFormStore((state) => state.canUndo);
  const canRedo = useFormStore((state) => state.canRedo);
  const undo = useFormStore((state) => state.undo);
  const redo = useFormStore((state) => state.redo);
  const setFormName = useFormStore((state) => state.setFormName);
  const setFormId = useFormStore((state) => state.setFormId);
  const markClean = useFormStore((state) => state.markClean);
  const setSavedFormsList = useFormStore((state) => state.setSavedFormsList);
  const isNameDuplicate = useFormStore((state) => state.isNameDuplicate);
  const isSaving = useFormStore((state) => state.isSaving);
  const startSaving = useFormStore((state) => state.startSaving);
  const saveSuccessAction = useFormStore((state) => state.saveSuccess);
  const saveFailure = useFormStore((state) => state.saveFailure);
  const canSave = useFormStore((state) => state.canSave());
  const { setActions, setTitleActions, setCenterContent } = useHeaderActions();
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [formDescription, setFormDescription] = useState('');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [formStatus, setFormStatus] = useState<'draft' | 'published'>('draft');

  // Handle route based loading
  useEffect(() => {
    // Determine if we need to load a form
    if (routeFormId && routeFormId !== 'new') {
      const targetForm = forms.find(f => f.id === routeFormId);

      // If form exists and isn't already loaded (or loaded incorrectly)
      if (targetForm) {
        if (formId !== routeFormId) {
          // Load it
          loadFormWithValidation(targetForm, {
            onSuccess: () => {
              // Silent success or toast? Silent is better for route navigation
            }
          });
        }
        // Form ID in URL but not found in list (and list is loaded)
        // Redirect to new
      } else if (!formsLoading) {
        // Form ID in URL but not found in list (and list is loaded)
        // Redirect to new
        toast.error("Form not found or has been deleted");
        navigate('/dashboard/build/new');
      }
    } else if (routeFormId === 'new') {
      // Ensure we are in NEW state
      // Check if we need to reset (if we have an ID currently)
      if (formId) {
        useFormStore.getState().resetToNewForm();
      }
    }
  }, [routeFormId, forms, formsLoading, formId, navigate]);

  // Sync form status from loaded form
  useEffect(() => {
    if (formId) {
      const currentForm = forms.find(f => f.id === formId);
      if (currentForm?.status) {
        setFormStatus(currentForm.status);
      }
    } else {
      setFormStatus('draft'); // New forms start as draft
    }
  }, [formId, forms]);

  // Sync forms list to store for duplicate checking
  useEffect(() => {
    if (forms && forms.length > 0) {
      const formsSummary = forms.map((f) => ({
        id: f.id,
        name: f.name,
        description: f.description,
        updatedAt: f.updatedAt || f.createdAt,
      }));
      setSavedFormsList(formsSummary);

      // Unique Naming Fix:
      // If we are on a NEW form and it's clean (untouched), ensure the name is unique against the newly loaded list.
      // This covers the case where we came from another page and savedFormsList was empty at creation time.
      const state = useFormStore.getState();

      // ONLY if route is 'new' or undefined (though main router points here only if build params exist ?)
      // Actually we should only do this auto-rename if we are truly in a new form flow
      if (routeFormId === 'new' && state.isNewForm && !state.isDirty) {
        const nameExists = (n: string) => formsSummary.some(
          f => f.name.trim().toLowerCase() === n.trim().toLowerCase()
        );

        if (nameExists(state.formName)) {
          const baseName = "New Form";
          let candidate = baseName;
          let counter = 1;

          while (nameExists(candidate)) {
            candidate = `${baseName} (${counter})`;
            counter++;
          }

          if (candidate !== state.formName) {
            state.setFormName(candidate);
            state.markClean(); // Keep it clean/draft with the new name
          }
        }
      }
    }
  }, [forms, setSavedFormsList, routeFormId]);

  // Use memoized wrapper to pass formConfig to getExportData
  const exportDataMemoized = useCallback(() => getExportData(formConfig), [formConfig]);

  // Format timestamp to relative time
  const getRelativeTime = (timestamp: string | null) => {
    if (!timestamp) return null;
    const now = new Date();
    const saved = new Date(timestamp);
    const diff = now.getTime() - saved.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return saved.toLocaleDateString();
  };

  const handleLoadForm = (form: any) => {
    // Check for unsaved changes
    if (hasUnsavedChanges()) {
      setPendingAction(() => () => {
        // Load form validation and markClean are handled inside loadFormWithValidation
        loadFormWithValidation(form, {
          onSuccess: () => {
            setShowLoadModal(false);
          },
        });
      });
      setShowUnsavedChangesDialog(true);
      return;
    }

    loadFormWithValidation(form, {
      onSuccess: () => {
        setShowLoadModal(false);
        setSearchQuery('');
      },
    });
  };

  const handleLoadTemplate = (config: any) => {
    // Check for unsaved changes
    const loadTemplate = () => {
      // Use loadFormWithValidation to ensure consistent normalization and validation
      // Templates get a unique ID that will be set to null to mark as new form
      const result = loadFormWithValidation(
        {
          config,
          name: 'New Template',
          id: 'temp-' + Date.now(),
        },
        {
          showWarnings: true,
          showSuccessToast: false,
          onSuccess: () => {
            // Set to null to mark as new form
            setFormId(null);
            setShowLoadModal(false);
            toast.success('Template loaded successfully');
          },
        }
      );

      if (!result.success) {
        toast.error('Failed to load template');
      }
    };

    if (hasUnsavedChanges()) {
      setPendingAction(() => loadTemplate);
      setShowUnsavedChangesDialog(true);
    } else {
      loadTemplate();
    }
  };

  const handleImportJson = (config: any) => {
    // Check for unsaved changes
    const importJson = () => {
      // Use loadFormWithValidation to ensure consistent normalization and validation
      // Imports get a unique ID that will be set to null to mark as new form
      const result = loadFormWithValidation(
        {
          config,
          name: 'Imported Form',
          id: 'import-' + Date.now(),
        },
        {
          showWarnings: true,
          showSuccessToast: false,
          onSuccess: () => {
            // Set to null to mark as new form
            setFormId(null);
            setShowLoadModal(false);
            toast.success('Form imported successfully');
          },
        }
      );

      if (!result.success) {
        toast.error('Failed to import form');
      }
    };

    if (hasUnsavedChanges()) {
      setPendingAction(() => importJson);
      setShowUnsavedChangesDialog(true);
    } else {
      importJson();
    }
  };

  const handleRenameForm = async (id: string, newName: string) => {
    if (!newName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    // Check duplicate excluding self
    if (isNameDuplicate(newName, id)) {
      toast.error("A form with this name already exists");
      return;
    }

    try {
      await updateForm(id, { name: newName.trim() });
      toast.success("Form renamed successfully");

      // If we are currently editing this form, update the local name state
      if (formId === id) {
        setFormName(newName.trim());
      }
    } catch (err: any) {
      toast.error("Failed to rename form");
      console.error(err);
    }
  };

  const handleDeleteForm = async (id: string) => {
    try {
      await deleteForm(id);
      toast.success("Form deleted successfully");

      // If currently loaded form was deleted, we treat it as an unsaved new form now? 
      // Or just keep working on it but it's no longer linked to the ID.
      // Better UX: Detach ID so hitting save creates a new one.
      if (formId === id) {
        setFormId(null);
        toast.info("The loaded form was deleted. Saving will create a new form.");
      }
    } catch (err: any) {
      toast.error("Failed to delete form");
      console.error(err);
    }
  };




  // Handle save form (both new and update)
  const handleSaveForm = useCallback(async () => {
    // Name validation is already done in the header input
    // But we should double check before saving
    if (!formName.trim()) {
      toast.error(t('common.name') + ' is required');
      return;
    }
    // Name duplicate check
    // If we have a formId, we exclude it from the check (logic is handled in store)
    if (isNameDuplicate(formName, formId)) {
      toast.error('A form with this name already exists');
      return;
    }

    // Prevent double-click saves
    if (isSaving) {
      return;
    }

    startSaving();
    setShowSaveSuccess(false);
    try {
      if (formId) {
        // Update existing form
        await updateForm(formId, {
          name: formName.trim(),
          description: formDescription.trim(),
          config: exportDataMemoized(),
        });
        markClean();
        // Clear history to prevent undoing past the save point
        useFormStore.getState().clearHistory();
        toast.success(`"${formName}" updated successfully!`);
      } else {
        // Save new form
        const savedForm = await saveForm(formName.trim(), formDescription.trim(), exportDataMemoized());
        setFormName(savedForm.name);
        setFormId(savedForm.id);
        markClean();
        // Clear history for the new saved state
        useFormStore.getState().clearHistory();
        toast.success(`"${formName}" saved successfully!`);

        // Update URL to the new ID
        navigate(`/dashboard/build/${savedForm.id}`, { replace: true });
      }
      // Show success indicator briefly
      setShowSaveSuccess(true);
      saveSuccessAction();
      setTimeout(() => setShowSaveSuccess(false), 2000);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to save form';
      toast.error(errorMessage);
      console.error('Save error:', err);
      saveFailure(errorMessage);
    }
  }, [formName, formDescription, formId, updateForm, saveForm, exportDataMemoized, setFormName, setFormId, markClean, isNameDuplicate, t, navigate, isSaving, startSaving, saveSuccessAction, saveFailure]);

  // Handle publish/unpublish form
  const handlePublish = useCallback(async () => {
    if (!formId) {
      toast.error('Please save the form first before publishing.');
      return;
    }

    const newStatus = formStatus === 'published' ? 'draft' : 'published';
    try {
      await updateForm(formId, { status: newStatus });
      setFormStatus(newStatus);
      if (newStatus === 'published') {
        toast.success('Form published! It can now be assigned to stores.');
      } else {
        toast.info('Form unpublished. It will no longer appear in store assignments.');
      }
    } catch (error) {
      toast.error('Failed to update form status.');
      console.error(error);
    }
  }, [formId, formStatus, updateForm]);


  // Set Header Actions (Center: Form Controls, Right: Publish)
  useEffect(() => {
    setCenterContent(
      <PreviewInternalHeader
        onLoadClick={() => setShowLoadModal(true)}
        onSaveClick={handleSaveForm}
        canSave={canSave}
        showSaveSuccess={showSaveSuccess}
      />
    );

    setActions(
      <div className="flex items-center gap-2">
        {formStatus === 'published' && (
          <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
            Published
          </span>
        )}
        <Button
          onClick={handlePublish}
          disabled={!formId}
          variant="default"
          className={formStatus === 'published'
            ? "gap-2 bg-slate-600 hover:bg-slate-700 text-white transition-all duration-200 hover:scale-105 active:scale-95"
            : "gap-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:shadow-indigo-300/50 transition-all duration-200 hover:scale-105 active:scale-95 group"
          }
        >
          {formStatus === 'published' ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              <span className="font-bold">Unpublish</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="font-bold">Publish</span>
            </>
          )}
        </Button>
      </div>
    );

    // Clear title actions to keep breadcrumb clean
    setTitleActions(null);

    return () => {
      setCenterContent(null);
      setActions(null);
      setTitleActions(null);
    };
  }, [setActions, setTitleActions, setCenterContent, handleSaveForm, canSave, showSaveSuccess, formId, formStatus, handlePublish]);


  // Browser navigation guard - warn on page close/refresh with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = ''; // Required for Chrome
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Register keyboard shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input or contenteditable element
      const target = e.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true';

      if (isInputField) {
        return; // Don't trigger shortcuts while typing
      }

      // Ctrl+Z or Cmd+Z for Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo()) {
          undo();
        }
      }

      // Ctrl+Y or Cmd+Shift+Z for Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (canRedo()) {
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo]);

  // Determine if we are initializing (mismatch between route and store)
  const shouldLoadSpecificForm = routeFormId && routeFormId !== 'new';
  const isMismatch = shouldLoadSpecificForm && formId !== routeFormId;
  const shouldResetToNew = routeFormId === 'new' && formId !== null;
  const isInitializing = isMismatch || shouldResetToNew;

  return (
    <div className="h-full flex flex-col" dir={dir}>
      {isInitializing ? (
        <BuilderSkeleton />
      ) : (
        <div className="flex-1 overflow-hidden relative">
          <FormTab
            onSaveClick={handleSaveForm}
            onLoadClick={() => setShowLoadModal(true)}
            canSave={canSave}
            showSaveSuccess={showSaveSuccess}
          />
        </div>
      )}




      {/* Unified Load Dialog */}
      <FormLoadDialog
        isOpen={showLoadModal}
        onClose={() => setShowLoadModal(false)}
        forms={forms}
        isLoading={formsLoading}
        onLoadForm={handleLoadForm}
        onLoadTemplate={handleLoadTemplate}
        onImportJson={handleImportJson}
        onRenameForm={handleRenameForm}
        onDeleteForm={handleDeleteForm}
      />

      <AlertDialog open={showUnsavedChangesDialog} onOpenChange={setShowUnsavedChangesDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to continue? Your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowUnsavedChangesDialog(false);
                if (pendingAction) {
                  pendingAction();
                  setPendingAction(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};


export default BuildPage;
