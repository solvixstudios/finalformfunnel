import isEqual from "react-fast-compare";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_FORM_CONFIG } from "../lib/constants";

export type FormConfig = typeof DEFAULT_FORM_CONFIG;
export type EditingSection = string | null;

export interface SavedFormSummary {
  id: string;
  name: string;
  description?: string;
  updatedAt: string;
}

export type FormStatus = "NEW_CLEAN" | "NEW_DRAFT" | "SAVED_CLEAN" | "SAVED_DRAFT";

interface FormStore {
  // State
  formConfig: FormConfig;
  editingSection: EditingSection;
  editingField: string | null;
  isDirty: boolean;
  formName: string;
  formId: string | null;
  isNewForm: boolean;
  savedFormsList: SavedFormSummary[];

  // Centralized save state
  isSaving: boolean;
  saveError: string | null;
  lastSavedAt: string | null;

  // Undo/Redo history
  history: FormConfig[];
  historyIndex: number;
  maxHistorySize: number;
  historyDebounceTimer: NodeJS.Timeout | null;

  // Loading states
  isLoadingFromFirebase: boolean;
  isLoadingTemplate: boolean;
  isImportingJson: boolean;
  importError: string | null;
  importWarnings: string[];

  // Internal tracking for dirty check
  savedState: {
    config: FormConfig;
    name: string;
  };

  // Computed
  hasUnsavedChanges: () => boolean;
  isNameDuplicate: (name: string, excludeId?: string | null) => boolean;
  isDraft: () => boolean;
  canSave: () => boolean;
  canUndo: () => boolean;
  canRedo: () => boolean;
  getFormStatus: () => FormStatus;

  // Actions
  setFormConfig: (config: FormConfig) => void;
  updateFormConfig: (partial: Partial<FormConfig>) => void;
  loadFormConfig: (config: Partial<FormConfig>) => void;
  applyTemplate: (config: Partial<FormConfig>) => void;
  resetFormConfig: () => void;
  resetToNewForm: () => void;
  setEditingSection: (section: EditingSection) => void;
  setEditingField: (field: string | null) => void;
  markDirty: () => void;
  markClean: () => void;
  discardChanges: () => void;
  setFormName: (name: string) => void;
  setFormId: (id: string | null) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  pushToHistory: (config: FormConfig) => void;
  clearHistory: () => void;

  // Saved forms list management
  setSavedFormsList: (forms: SavedFormSummary[]) => void;
  addToSavedFormsList: (form: SavedFormSummary) => void;
  updateSavedFormInList: (
    formId: string,
    updates: Partial<SavedFormSummary>,
  ) => void;
  removeFromSavedFormsList: (formId: string) => void;

  // Save state management
  startSaving: () => void;
  saveSuccess: (timestamp?: string) => void;
  saveFailure: (error: string) => void;
  setIsSaving: (saving: boolean) => void;
  setSaveError: (error: string | null) => void;

  // Loading state actions
  setIsLoadingFromFirebase: (loading: boolean) => void;
  setIsLoadingTemplate: (loading: boolean) => void;
  setIsImportingJson: (loading: boolean) => void;
  setImportError: (error: string | null) => void;
  setImportWarnings: (warnings: string[]) => void;
}

export const useFormStore = create<FormStore>()(
  persist(
    (set, get) => ({
      // Initial state
      formConfig: DEFAULT_FORM_CONFIG,
      editingSection: null,
      editingField: null,
      isDirty: false,
      formName: "New Form",
      formId: null,
      isNewForm: true,
      savedFormsList: [],

      // Centralized save state
      isSaving: false,
      saveError: null,
      lastSavedAt: null,

      // Undo/Redo history
      history: [DEFAULT_FORM_CONFIG],
      historyIndex: 0,
      maxHistorySize: 50,
      historyDebounceTimer: null,

      // Loading states
      isLoadingFromFirebase: false,
      isLoadingTemplate: false,
      isImportingJson: false,
      importError: null,
      importWarnings: [],

      // Internal tracking for dirty check
      savedState: {
        config: DEFAULT_FORM_CONFIG,
        name: "New Form",
      },

      // Computed selectors
      isDraft: () => {
        const state = get();
        return !state.formId || state.isDirty;
      },

      getFormStatus: () => {
        const state = get();
        if (state.isNewForm || !state.formId) {
          return state.isDirty ? "NEW_DRAFT" : "NEW_CLEAN";
        }
        return state.isDirty ? "SAVED_DRAFT" : "SAVED_CLEAN";
      },

      canSave: () => {
        const state = get();
        // Allow saving if sticky or if name changed, etc.
        // Also allow saving if it is a NEW form (even if clean) so users can reserve the name
        if (state.isNewForm) return state.formName.trim().length > 0;

        return state.isDirty && !state.isSaving && state.formName.trim().length > 0;
      },

      canUndo: () => {
        const state = get();
        return state.historyIndex > 0;
      },

      canRedo: () => {
        const state = get();
        return state.historyIndex < state.history.length - 1;
      },

      // Actions
      setFormConfig: (config) => {
        set((state) => {
          // Use fast-deep-compare to check if content actually changed
          const isConfigChanged = !isEqual(config, state.savedState.config);
          const isNameChanged = state.formName !== state.savedState.name;
          const isDirty = isConfigChanged || isNameChanged;

          return { formConfig: config, isDirty };
        });
        // Push to history (debounced)
        const { pushToHistory } = get();
        pushToHistory(config);
      },

      updateFormConfig: (partial) => {
        set((state) => {
          const newConfig = { ...state.formConfig, ...partial };

          // Fast comparison
          const isConfigChanged = !isEqual(newConfig, state.savedState.config);
          const isNameChanged = state.formName !== state.savedState.name;
          const isDirty = isConfigChanged || isNameChanged;

          return {
            formConfig: newConfig,
            isDirty,
          };
        });
        // Push to history (debounced)
        const state = get();
        const { pushToHistory } = state;
        pushToHistory(state.formConfig);
      },

      loadFormConfig: (config) => {
        // Use deep merge helper to preserve nested structure while merging imported config
        const deepMerge = (defaults: any, imported: any, depth = 0): any => {
          if (depth > 10) return imported; // Prevent infinite recursion
          const merged = { ...defaults };
          for (const key in imported) {
            if (Object.prototype.hasOwnProperty.call(imported, key)) {
              const defaultValue = defaults[key];
              const importedValue = imported[key];
              // If both are objects (not arrays or null), recurse
              if (
                defaultValue &&
                typeof defaultValue === "object" &&
                !Array.isArray(defaultValue) &&
                importedValue &&
                typeof importedValue === "object" &&
                !Array.isArray(importedValue)
              ) {
                merged[key] = deepMerge(defaultValue, importedValue, depth + 1);
              } else {
                merged[key] = importedValue;
              }
            }
          }
          return merged;
        };

        const fullConfig = deepMerge(DEFAULT_FORM_CONFIG, config) as FormConfig;
        set((state) => ({
          formConfig: fullConfig,
          isDirty: false,
          isNewForm: false, // Loaded forms are not new
          savedState: {
            config: fullConfig,
            name: state.formName,
          },
          // Reset history on load
          history: [fullConfig],
          historyIndex: 0,
        }));
      },

      applyTemplate: (config) => {
        // Deep merge helper (duplicated for now to avoid scope issues or need to refactor)
        const deepMerge = (defaults: any, imported: any, depth = 0): any => {
          if (depth > 10) return imported;
          const merged = { ...defaults };
          for (const key in imported) {
            if (Object.prototype.hasOwnProperty.call(imported, key)) {
              const defaultValue = defaults[key];
              const importedValue = imported[key];
              if (
                defaultValue &&
                typeof defaultValue === "object" &&
                !Array.isArray(defaultValue) &&
                importedValue &&
                typeof importedValue === "object" &&
                !Array.isArray(importedValue)
              ) {
                merged[key] = deepMerge(defaultValue, importedValue, depth + 1);
              } else {
                merged[key] = importedValue;
              }
            }
          }
          return merged;
        };

        const fullConfig = deepMerge(DEFAULT_FORM_CONFIG, config) as FormConfig;
        // Apply template: Update config, SET DIRTY, keep name/id, PUSH to history
        set((state) => ({
          formConfig: fullConfig,
          isDirty: true,
          // Do NOT reset savedState, so we know we Drifted from it
        }));

        // Push to history
        const { pushToHistory } = get();
        pushToHistory(fullConfig);
      },

      resetFormConfig: () =>
        set({
          formConfig: DEFAULT_FORM_CONFIG,
          editingSection: null,
          isDirty: false,
          savedState: {
            config: DEFAULT_FORM_CONFIG,
            name: "New Form",
          },
          // Also reset history
          history: [DEFAULT_FORM_CONFIG],
          historyIndex: 0,
        }),

      resetToNewForm: () => {
        const state = get();

        // Generate unique name
        const baseName = "New Form";
        let newName = baseName;
        let counter = 1;

        // Helper to check if name exists in saved list
        const nameExists = (n: string) =>
          state.savedFormsList.some(
            (f) => f.name.trim().toLowerCase() === n.toLowerCase(),
          );

        // While name exists, increment counter
        while (nameExists(newName)) {
          newName = `${baseName} (${counter})`;
          counter++;
        }

        set({
          formConfig: DEFAULT_FORM_CONFIG,
          editingSection: null,
          isDirty: false, // Explicitly false for new form
          isNewForm: true, // Mark as new form
          formName: newName,
          formId: null,
          savedState: {
            config: DEFAULT_FORM_CONFIG,
            name: newName,
          },
          // Reset history so there's no "undo" to a previous form
          history: [DEFAULT_FORM_CONFIG],
          historyIndex: 0,
        });
      },

      setEditingSection: (section) => set({ editingSection: section }),
      setEditingField: (field) => set({ editingField: field }),

      // Manually forcing dirty is rarely needed now, but keeping for compatibility
      markDirty: () => set({ isDirty: true }),

      markClean: () =>
        set((state) => ({
          isDirty: false,
          savedState: {
            config: state.formConfig,
            name: state.formName,
          },
        })),

      discardChanges: () =>
        set((state) => ({
          isDirty: false,
          formConfig: state.savedState.config,
          formName: state.savedState.name,
        })),

      setFormName: (name) =>
        set((state) => {
          // Check if name change affects dirty state relative to saved state
          const isConfigChanged = !isEqual(
            state.formConfig,
            state.savedState.config,
          );
          const isNameChanged = name !== state.savedState.name;
          const isDirty = isConfigChanged || isNameChanged;

          return { formName: name, isDirty };
        }),

      setFormId: (id) => set({ formId: id, isNewForm: !id }),

      hasUnsavedChanges: () => {
        const state = get();
        // Even if dirty, if it's a new form and effectively untouched (isDirty checks against default), it's fine.
        // But isDirty already checks against default.
        return state.isDirty;
      },

      isNameDuplicate: (name: string, excludeId?: string | null) => {
        const state = get();
        const normalizedName = name.trim().toLowerCase();
        return state.savedFormsList.some(
          (form) =>
            form.name.trim().toLowerCase() === normalizedName &&
            form.id !== excludeId,
        );
      },

      // Saved forms list management
      setSavedFormsList: (forms) => set({ savedFormsList: forms }),

      addToSavedFormsList: (form) =>
        set((state) => ({
          savedFormsList: [...state.savedFormsList, form],
        })),

      updateSavedFormInList: (formId, updates) =>
        set((state) => ({
          savedFormsList: state.savedFormsList.map((f) =>
            f.id === formId ? { ...f, ...updates } : f,
          ),
        })),

      removeFromSavedFormsList: (formId) =>
        set((state) => ({
          savedFormsList: state.savedFormsList.filter((f) => f.id !== formId),
        })),

      // Undo/Redo
      undo: () => {
        const state = get();
        // Clear any pending history updates to prevent race conditions
        if (state.historyDebounceTimer) {
          clearTimeout(state.historyDebounceTimer);
          set({ historyDebounceTimer: null });
        }

        if (state.historyIndex > 0) {
          const newIndex = state.historyIndex - 1;
          const prevConfig = state.history[newIndex];

          // Re-evaluate dirty state
          const isConfigChanged = !isEqual(prevConfig, state.savedState.config);
          const isNameChanged = state.formName !== state.savedState.name;
          const isDirty = isConfigChanged || isNameChanged;

          set({
            formConfig: prevConfig,
            historyIndex: newIndex,
            isDirty,
          });
        }
      },

      redo: () => {
        const state = get();
        // Clear any pending history updates
        if (state.historyDebounceTimer) {
          clearTimeout(state.historyDebounceTimer);
          set({ historyDebounceTimer: null });
        }

        if (state.historyIndex < state.history.length - 1) {
          const newIndex = state.historyIndex + 1;
          const nextConfig = state.history[newIndex];

          // Re-evaluate dirty state
          const isConfigChanged = !isEqual(nextConfig, state.savedState.config);
          const isNameChanged = state.formName !== state.savedState.name;
          const isDirty = isConfigChanged || isNameChanged;

          set({
            formConfig: nextConfig,
            historyIndex: newIndex,
            isDirty,
          });
        }
      },

      pushToHistory: (config) => {
        const state = get();

        // Clear existing debounce timer
        if (state.historyDebounceTimer) {
          clearTimeout(state.historyDebounceTimer);
        }

        // Debounce history pushes (500ms for better UX)
        const timer = setTimeout(() => {
          const currentState = get();

          // Truncate future history if we're not at the end
          const newHistory = currentState.history.slice(
            0,
            currentState.historyIndex + 1,
          );

          // Add new config
          newHistory.push(config);

          // Limit history size (circular buffer)
          if (newHistory.length > currentState.maxHistorySize) {
            newHistory.shift();
          }

          set({
            history: newHistory,
            historyIndex: newHistory.length - 1,
            historyDebounceTimer: null,
          });
        }, 500);

        set({ historyDebounceTimer: timer });
      },

      clearHistory: () => {
        const state = get();
        if (state.historyDebounceTimer) {
          clearTimeout(state.historyDebounceTimer);
        }
        set({
          history: [state.formConfig],
          historyIndex: 0,
          historyDebounceTimer: null,
        });
      },

      // Save state management
      startSaving: () => set({ isSaving: true, saveError: null }),

      saveSuccess: (timestamp) =>
        set({
          isSaving: false,
          saveError: null,
          lastSavedAt: timestamp || new Date().toISOString(),
          isNewForm: false, // No longer a new form after save
        }),

      saveFailure: (error) =>
        set({
          isSaving: false,
          saveError: error,
        }),

      // Legacy helpers (keeping for compatibility)
      setIsSaving: (saving) => set({ isSaving: saving }),
      setSaveError: (error) => set({ saveError: error }),

      // Loading state actions
      setIsLoadingFromFirebase: (loading) => set({ isLoadingFromFirebase: loading }),
      setIsLoadingTemplate: (loading) => set({ isLoadingTemplate: loading }),
      setIsImportingJson: (loading) => set({ isImportingJson: loading }),
      setImportError: (error) => set({ importError: error }),
      setImportWarnings: (warnings) => set({ importWarnings: warnings }),
    }),
    {
      name: "form-store",
      // Persist formConfig, formName, formId, savedState, isDirty, and lastSavedAt
      partialize: (state) => ({
        formConfig: state.formConfig,
        formName: state.formName,
        formId: state.formId,
        savedState: state.savedState,
        isDirty: state.isDirty,
        isNewForm: state.isNewForm,
      }),
    },
  ),
);

// --- Optimized Selectors ---
import { useShallow } from "zustand/react/shallow";

export const useFormConfig = () => useFormStore((state) => state.formConfig);
export const useFormName = () => useFormStore((state) => state.formName);
export const useIsDirty = () => useFormStore((state) => state.isDirty);

// Actions selector - stable reference
export const useFormActions = () =>
  useFormStore(
    useShallow((state) => ({
      setFormConfig: state.setFormConfig,
      updateFormConfig: state.updateFormConfig,
      loadFormConfig: state.loadFormConfig,
      applyTemplate: state.applyTemplate,
      resetFormConfig: state.resetFormConfig,
      resetToNewForm: state.resetToNewForm,
      setEditingSection: state.setEditingSection,
      setEditingField: state.setEditingField,
      markDirty: state.markDirty,
      markClean: state.markClean,
      discardChanges: state.discardChanges,
      setFormName: state.setFormName,
      setFormId: state.setFormId,
      undo: state.undo,
      redo: state.redo,
      pushToHistory: state.pushToHistory,
      clearHistory: state.clearHistory,
      startSaving: state.startSaving,
      saveSuccess: state.saveSuccess,
      saveFailure: state.saveFailure,
      setIsSaving: state.setIsSaving,
    })),
  );

// Computed selectors
export const useFormStatus = () => useFormStore((state) => state.getFormStatus());
export const useCanSave = () => useFormStore((state) => state.canSave());
export const useHistoryStatus = () =>
  useFormStore(
    useShallow((state) => ({
      canUndo: state.canUndo(),
      canRedo: state.canRedo(),
    })),
  );

export const useSaveState = () =>
  useFormStore(
    useShallow((state) => ({
      isSaving: state.isSaving,
      saveError: state.saveError,
      lastSavedAt: state.lastSavedAt,
    })),
  );
