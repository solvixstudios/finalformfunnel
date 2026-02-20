import { BuilderSkeleton } from '@/components/FormLoading/BuilderSkeleton';
import { FormLoadDialog } from '@/components/FormLoading/FormLoadDialog';
import { PageHeader } from '@/components/GlobalHeader/PageHeader';
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
import { useWhatsAppProfiles } from '@/lib/firebase/whatsappHooks';
import { useGoogleSheets } from '@/lib/firebase/sheetsHooks';
import { FolderOpen, RotateCcw, RotateCw, Save } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import FormTab from '../components/FormTab';
import { syncFormChanges } from '../lib/sync';

import { useConnectedStores, useFormAssignments, useSavedForms } from '../lib/firebase/hooks';
import { getExportData, loadFormWithValidation, normalizeImportedConfig, validateFormConfig } from '../lib/formManagement';
import { useI18n } from '../lib/i18n/i18nContext';
import { useFormStore } from '../stores';

interface EditFormPageProps {
  userId: string;
}

const EditFormPage = ({ userId }: EditFormPageProps) => {
  const { formId: routeFormId } = useParams<{ formId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, dir } = useI18n();
  const { saveForm, updateForm, deleteForm, forms, loading: formsLoading } = useSavedForms(userId);
  const { assignments } = useFormAssignments(userId);
  const { stores } = useConnectedStores(userId);
  const { profiles: waProfiles } = useWhatsAppProfiles(userId);
  const { sheets: gsSheets } = useGoogleSheets(userId);
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
  const [showLoadModal, setShowLoadModal] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [formDescription, setFormDescription] = useState('');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [formStatus, setFormStatus] = useState<'draft' | 'published'>('draft');

  // Ref to track form ID we just saved - prevents reload after save
  const justSavedFormIdRef = useRef<string | null>(null);

  // State to prevent flashing of previous context
  const [isContextReady, setIsContextReady] = useState(false);

  // Handle route based loading and context reset
  useEffect(() => {
    // Reset context immediately on mount/route change to prevent flash
    // We do this before any other logic
    if (routeFormId && routeFormId !== 'new') {
      useFormStore.getState().setEditingSection(null);
      setIsContextReady(true);
    } else if (routeFormId === 'new') {
      useFormStore.getState().setEditingSection(null);
      setIsContextReady(true);
    } else {
      useFormStore.getState().setEditingSection(null);
      setIsContextReady(true);
    }

    // Skip if we just saved this form (prevents flash after save)
    if (justSavedFormIdRef.current) {
      if (justSavedFormIdRef.current === routeFormId || justSavedFormIdRef.current === formId) {
        return;
      }
    }

    // Determine if we need to load a form
    if (routeFormId && routeFormId !== 'new') {
      const targetForm = forms.find(f => f.id === routeFormId);

      // If form exists
      if (targetForm) {
        // Only load if store doesn't already have this form loaded
        if (formId !== routeFormId) {
          loadFormWithValidation(targetForm, {
            onSuccess: () => {
              // Silent success
            }
          });
        }
      } else if (!formsLoading) {
        toast.error("Form not found or has been deleted");
        navigate('/dashboard/forms/edit/new');
      }
    } else if (routeFormId === 'new') {
      if (formId) {
        useFormStore.getState().resetToNewForm();
      }


    }
  }, [routeFormId, forms, formsLoading, formId, navigate, searchParams]);

  // Block rendering until context is ready
  if (!isContextReady && !formsLoading) {
    return <BuilderSkeleton />;
  }

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

      // Skip auto-rename if we just saved (prevents name from changing after save)
      // Also clear the ref here once forms list has synced
      if (justSavedFormIdRef.current) {
        // Check if the just-saved form is now in the list
        const justSavedExists = formsSummary.some(f => f.id === justSavedFormIdRef.current);
        if (justSavedExists) {
          // Clear ref now that forms list has synced
          justSavedFormIdRef.current = null;
        }
        return;
      }

      if (isSaving) {
        return;
      }

      // Unique Naming Fix:
      // If we are on a NEW form and it's clean (untouched), ensure the name is unique
      const state = useFormStore.getState();

      if (routeFormId === 'new' && state.isNewForm && !state.isDirty && !formId) {
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
            state.markClean();
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forms, setSavedFormsList, routeFormId]);

  // Use memoized wrapper to pass formConfig to getExportData
  const exportDataMemoized = useCallback(() => getExportData(formConfig, waProfiles, gsSheets), [formConfig, waProfiles, gsSheets]);

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

  const handleLoadTemplate = (config: any, templateName?: string) => {
    // Check for unsaved changes ONLY if we are starting fresh or replacing entirely.
    // If we are applying to existing form, we usually just want to apply it.
    // BUT applying a template is a destructive action for the CONFIG.
    // If user has unsaved changes to their CURRENT config, they might want to know.
    // However, since we push to history, they can UNDO.
    // So showing "Unsaved Changes" dialog blocking the template application is maybe annoying if we have Undo.
    // But let's stick to safety: if they have unsaved chagnes, warn them.

    const applyTemplateLogic = () => {
      // 1. Normalize and Validate
      const normalized = normalizeImportedConfig(config);
      const validation = validateFormConfig(normalized);

      if (validation.warnings.length > 0) {
        validation.warnings.forEach(w => toast.warning(w));
      }

      if (!validation.valid) {
        toast.error(`Cannot apply template: ${validation.errors.join(", ")}`);
        return;
      }

      // 2. Determine Mode
      if (formId) {
        // Mode: Apply to Existing Form (Keep ID, Name, History)
        useFormStore.getState().applyTemplate(normalized);
        toast.success("Template applied! You can Undo if needed.");
        setShowLoadModal(false);
      } else {
        // Mode: Start New Form with Template
        // Use existing loader to reset state
        const nameToUse = templateName || 'New Template';
        const result = loadFormWithValidation(
          {
            config: normalized,
            name: nameToUse,
            id: 'temp-' + Date.now(),
          },
          {
            showWarnings: false, // Already showed above
            showSuccessToast: false,
            onSuccess: () => {
              setFormId(null);
              setShowLoadModal(false);
              toast.success('Template loaded successfully');
            },
          }
        );
        if (!result.success) {
          toast.error(result.error || "Failed to load");
        }
      }
    };

    if (hasUnsavedChanges()) {
      setPendingAction(() => applyTemplateLogic);
      setShowUnsavedChangesDialog(true);
    } else {
      applyTemplateLogic();
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
      let savedFormId = formId;

      if (formId) {
        // Update existing form
        await updateForm(formId, {
          name: formName.trim(),
          description: formDescription.trim(),
          config: exportDataMemoized(),
          type: formConfig.type || 'product',
        });
        markClean();
        // Clear history to prevent undoing past the save point
        useFormStore.getState().clearHistory();
        toast.success(`"${formName}" updated successfully!`);
      } else {
        // Save new form
        const savedForm = await saveForm(formName.trim(), formDescription.trim(), exportDataMemoized(), formConfig.type || 'product');
        setFormName(savedForm.name);
        setFormId(savedForm.id);
        savedFormId = savedForm.id;

        markClean();
        // Clear history for the new saved state
        useFormStore.getState().clearHistory();
        toast.success(`"${formName}" saved successfully!`);

        // Set ref BEFORE navigate to prevent effects from reloading
        justSavedFormIdRef.current = savedForm.id;

        // Update URL to the new ID
        navigate(`/dashboard/forms/edit/${savedForm.id}`, { replace: true });
      }

      // AUTO-SYNC: Sync changes to active Shopify assignments via centralized service
      if (savedFormId) {
        const activeAssignments = assignments.filter(a => a.formId === savedFormId && a.isActive);

        if (activeAssignments.length > 0) {
          const toastId = toast.loading(`Syncing to ${activeAssignments.length} destination(s)...`);

          // CRITICAL: Read fresh config from store to avoid stale useCallback closure
          // exportDataMemoized() could capture a previous render's formConfig
          const freshConfig = getExportData(useFormStore.getState().formConfig, waProfiles, gsSheets);

          console.log('[SyncDebug] Syncing config with addons:', {
            pixelData: freshConfig.addons?.pixelData?.length || 0,
            tiktokPixelData: freshConfig.addons?.tiktokPixelData?.length || 0,
            sheets: freshConfig.addons?.sheets?.length || 0,
          });

          const result = await syncFormChanges({
            formId: savedFormId,
            formName: formName.trim(),
            formConfig: freshConfig,
            assignments,
            stores,
          });

          toast.dismiss(toastId);

          if (result.failedCount === 0 && result.successCount > 0) {
            toast.success(`✓ Synced to ${result.successCount} destination(s)`);
          } else if (result.successCount > 0) {
            toast.warning(`Synced ${result.successCount}/${result.totalCount} (${result.failedCount} failed)`);
          } else if (result.failedCount > 0) {
            toast.error(`Failed to sync to Shopify`);
          }
        }
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
  }, [formName, formDescription, formId, updateForm, saveForm, exportDataMemoized, setFormName, setFormId, markClean, isNameDuplicate, t, navigate, isSaving, startSaving, saveSuccessAction, saveFailure, assignments, stores]);






  // Calculate publish stats
  const activeAssignments = assignments.filter(a => a.formId === formId && a.isActive);
  const storeCount = activeAssignments.filter(a => a.assignmentType === 'store').length;
  const productCount = activeAssignments.filter(a => a.assignmentType === 'product').length;

  // titleComponent is now handled by editable breadcrumb

  const headerActions = (
    <div className="flex items-center gap-4">
      {/* History Controls - Only visible when there's history to navigate */}
      {(canUndo() || canRedo()) && (
        <div className="flex items-center p-1 bg-slate-100 rounded-lg mr-2">
          <button
            onClick={undo}
            disabled={!canUndo()}
            className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-500 transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw size={14} />
          </button>
          <div className="w-px h-3 bg-slate-200 mx-0.5"></div>
          <button
            onClick={redo}
            disabled={!canRedo()}
            className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-500 transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <RotateCw size={14} />
          </button>
        </div>
      )}

      {canSave ? (
        /* Editing State */
        <div className="flex items-center gap-3 animate-in fade-in duration-200">
          <Button
            onClick={handleSaveForm}
            size="sm"
            variant="brand"
            className="gap-2 transition-all hover:shadow-md active:scale-95"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={14} />
            )}
            <span className="font-semibold text-xs tracking-wide">Save</span>
          </Button>
        </div>
      ) : (
        /* Saved/Live State */
        <div className="flex items-center gap-4 animate-in fade-in duration-300">
          {(storeCount > 0 || productCount > 0) && (
            <div className="flex flex-col items-end text-xs">
              <span className="font-bold text-slate-800">Live on</span>
              <div className="flex gap-1 text-slate-500 font-medium">
                {storeCount > 0 && <span>{storeCount} Store{storeCount !== 1 ? 's' : ''}</span>}
                {storeCount > 0 && productCount > 0 && <span>•</span>}
                {productCount > 0 && <span>{productCount} Product{productCount !== 1 ? 's' : ''}</span>}
              </div>
            </div>
          )}

          {showSaveSuccess && (
            <span className="text-xs font-bold text-green-600 bg-green-50 border border-green-100 px-3 py-1 rounded-full animate-in fade-in">
              Saved
            </span>
          )}


        </div>
      )}
    </div>
  );



  // ... (navigation guards) ...

  // Determine if we are initializing (mismatch between route and store)
  const shouldLoadSpecificForm = routeFormId && routeFormId !== 'new';
  const isMismatch = shouldLoadSpecificForm && formId !== routeFormId;
  const shouldResetToNew = routeFormId === 'new' && formId !== null;
  // Don't show skeleton if we just saved (smooth transition)
  // Check if we have a just-saved ref OR if formId matches what we just saved
  const isJustSaved = justSavedFormIdRef.current !== null && (
    justSavedFormIdRef.current === routeFormId ||
    justSavedFormIdRef.current === formId
  );
  const isInitializing = (isMismatch || shouldResetToNew) && !isJustSaved;

  // Section mapping - using labels that match SECTION_LABELS from data/labels.ts
  const sectionLabels: Record<string, string> = {
    global_design: "Global Design",
    sections_list: "Sections Editor",
    packs_manager: "Packs & Offers",
    shipping_manager: "Shipping Rates",
    promo_code_manager: "Promo Code",
    thank_you: "Thank You Page",
    addons: "Addons",

    // Editor Sections - matching SECTION_LABELS from data/labels.ts
    header: "Header",
    variants: "Variantes / Modèles",
    shipping: "Formulaire Livraison",
    delivery: "Type de Livraison",
    offers: "Liste des Offres",
    promoCode: "Code Promo",
    summary: "Résumé de commande",
    cta: "Bouton d'action",
    urgencyText: "Urgence - Texte",
    urgencyQuantity: "Urgence - Stock",
    urgencyTimer: "Urgence - Timer",
    trustBadges: "Badges de Confiance",
  };

  const editingSection = useFormStore((state) => state.editingSection);
  const setEditingSection = useFormStore((state) => state.setEditingSection);

  // Sections that belong to "Sections Editor"
  const SECTION_EDITOR_SUBSECTIONS = [
    'header', 'variants', 'offers', 'shipping', 'delivery',
    'promoCode', 'summary', 'cta', 'urgencyText', 'urgencyQuantity',
    'urgencyTimer', 'trustBadges'
  ];

  const breadcrumbs: import('@/components/GlobalHeader/PageHeader').BreadcrumbItemType[] = [];

  // Smart back button handler - navigates up one level at a time
  const handleBackClick = () => {
    if (editingSection) {
      // If we are in a subsection of Sections Editor, go back to Sections Editor
      if (SECTION_EDITOR_SUBSECTIONS.includes(editingSection)) {
        setEditingSection('sections_list');
      } else {
        // Direct child of root (e.g. Global Design, Sections Editor itself)
        setEditingSection(null);
      }
    } else {
      // At root - go back to forms list
      navigate('/dashboard/forms');
    }
  };

  // 1. Form Name (Root Builder Home) - now the first item since back button handles navigation
  breadcrumbs.push({
    label: formName,
    editable: true, // Always allow edit mode access 
    doubleClickToEdit: true, // REQUIRE double click to edit
    // Single click behavior:
    onClick: (e) => {
      // If we are deep, single click goes back to root.
      if (editingSection) {
        setEditingSection(null);
      }
      // If at root, single click does nothing (waiting for double click to edit)
    },
    onEdit: (value: string) => {
      setFormName(value);
    },
    onBlur: () => {
      if (!formName.trim()) {
        const savedName = useFormStore.getState().savedState.name;
        setFormName(savedName || 'Untitled Form');
      }
    }
  });

  // 3. Intermediate: Sections Editor (if applicable)
  if (editingSection && SECTION_EDITOR_SUBSECTIONS.includes(editingSection)) {
    breadcrumbs.push({
      label: sectionLabels['sections_list'],
      onClick: () => setEditingSection('sections_list')
    });
  }

  // 4. Current Section
  if (editingSection) {
    breadcrumbs.push({
      label: sectionLabels[editingSection] || 'Editor',
      editable: false
    });
  }

  return (
    <div className="h-full flex flex-col" dir={dir}>
      <PageHeader
        title={formName}
        breadcrumbs={breadcrumbs}
        icon={FolderOpen}
        onBack={handleBackClick}
        actions={headerActions}
      />
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

      {/* Unified Load Dialog (Template Picker) */}
      <FormLoadDialog
        isOpen={showLoadModal}
        onClose={() => setShowLoadModal(false)}
        onLoadTemplate={handleLoadTemplate}
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
              variant="danger"
              onClick={() => {
                setShowUnsavedChangesDialog(false);
                if (pendingAction) {
                  pendingAction();
                  setPendingAction(null);
                }
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


    </div>
  );
};


export default EditFormPage;
