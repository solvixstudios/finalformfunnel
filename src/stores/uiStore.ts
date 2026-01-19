import { create } from 'zustand';

interface UIStore {
  // Dashboard UI state
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;

  // Modal state
  saveFormModalOpen: boolean;
  connectStoreModalOpen: boolean;
  selectedFormModalOpen: boolean;
  activeModal: string | null;

  // Builder UI state (if needed)
  previewPanelWidth: number;
  builderView: 'editor' | 'preview' | 'split';

  // Actions
  toggleSidebar: () => void;
  setMobileMenu: (open: boolean) => void;
  openModal: (type: 'saveForm' | 'connectStore' | 'selectedForm') => void;
  closeModal: () => void;
  setPreviewPanelWidth: (width: number) => void;
  setBuilderView: (view: 'editor' | 'preview' | 'split') => void;
}

export const useUIStore = create<UIStore>((set) => ({
  // Initial state
  sidebarCollapsed: false,
  mobileMenuOpen: false,
  saveFormModalOpen: false,
  connectStoreModalOpen: false,
  selectedFormModalOpen: false,
  activeModal: null,
  previewPanelWidth: 400,
  builderView: 'split',

  // Actions
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setMobileMenu: (open) => set({ mobileMenuOpen: open }),

  openModal: (type) =>
    set(() => {
      const updates: Partial<UIStore> = { activeModal: type };
      if (type === 'saveForm') updates.saveFormModalOpen = true;
      else if (type === 'connectStore') updates.connectStoreModalOpen = true;
      else if (type === 'selectedForm') updates.selectedFormModalOpen = true;
      return updates;
    }),

  closeModal: () =>
    set({
      saveFormModalOpen: false,
      connectStoreModalOpen: false,
      selectedFormModalOpen: false,
      activeModal: null,
    }),

  setPreviewPanelWidth: (width) => set({ previewPanelWidth: width }),

  setBuilderView: (view) => set({ builderView: view }),
}));
