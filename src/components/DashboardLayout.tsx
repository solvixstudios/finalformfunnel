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
import { cn } from '@/lib/utils';
import {
  FileText,
  FolderOpen,
  LayoutGrid,
  Loader2,
  Menu,
  Save,
  ShoppingCart,
  Tag,
  Ticket,
  Truck,
  Plug
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { HeaderActionsProvider, useHeaderActions } from '../contexts/HeaderActionsContext';
import { GoogleUser } from '../lib/authGoogle';
import { useI18n } from '../lib/i18n/i18nContext';
import { useFormStore } from '../stores';
import { DesktopSidebar, MobileMenu } from './Sidebar';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

interface DashboardLayoutProps {
  user: GoogleUser;
  currentPage: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

const DashboardLayoutContent = ({
  user,
  currentPage,
  onNavigate,
  onLogout,
  children,
}: DashboardLayoutProps) => {

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { dir } = useI18n();
  const { actions, centerContent, onSaveBeforeLeave } = useHeaderActions();
  const hasUnsavedChanges = useFormStore((state) => state.hasUnsavedChanges);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [isSavingBeforeLeave, setIsSavingBeforeLeave] = useState(false);
  const pendingActionRef = React.useRef<(() => void) | null>(null);

  // Determine if we are in the Builder view
  const isBuilderPage = currentPage === '/dashboard/forms/edit/new' || (currentPage.startsWith('/dashboard/forms/edit/') && currentPage.length > 22);

  const protectedNavigate = (path: string, action?: () => void) => {
    if (path === currentPage && !action) return;

    if (hasUnsavedChanges()) {
      pendingActionRef.current = () => {
        const markClean = useFormStore.getState().markClean;
        const setFormId = useFormStore.getState().setFormId;
        markClean();
        setFormId(null);
        if (action) action();
        onNavigate(path);
      };
      setShowUnsavedDialog(true);
    } else {
      if (action) action();
      onNavigate(path);
    }
  };

  const handleSaveAndLeave = async () => {
    if (!onSaveBeforeLeave) return;
    setIsSavingBeforeLeave(true);
    try {
      await onSaveBeforeLeave();
      // After save, navigate
      if (pendingActionRef.current) {
        // Don't clear form — it was saved. Just navigate.
        const markClean = useFormStore.getState().markClean;
        markClean();
        // Extract only the navigate call from the pending action
        const setFormId = useFormStore.getState().setFormId;
        setFormId(null);
        pendingActionRef.current();
      }
      setShowUnsavedDialog(false);
      pendingActionRef.current = null;
    } catch (error) {
      console.error("Save before leave failed:", error);
      // Keep dialog open so user can choose another option
    } finally {
      setIsSavingBeforeLeave(false);
    }
  };

  const navItems: NavItem[] = useMemo(() => [
    {
      id: 'home',
      label: 'Home',
      icon: <LayoutGrid size={20} />,
      path: '/dashboard/home',
    },
    {
      id: 'forms',
      label: 'Forms',
      icon: <FolderOpen size={20} />,
      path: '/dashboard/forms',
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: <ShoppingCart size={20} />,
      path: '/dashboard/orders',
    },
    {
      id: 'offers',
      label: 'Offers',
      icon: <Tag size={20} />,
      path: '/dashboard/rules/offers',
    },
    {
      id: 'shipping',
      label: 'Shipping',
      icon: <Truck size={20} />,
      path: '/dashboard/rules/shipping',
    },
    {
      id: 'coupons',
      label: 'Coupons',
      icon: <Ticket size={20} />,
      path: '/dashboard/rules/coupons',
    },
    {
      id: 'integrations',
      label: 'Integrations',
      icon: <Plug size={20} />,
      path: '/dashboard/integrations',
    },
  ], []);

  return (
    <div className="h-screen w-screen overflow-hidden bg-white flex font-sans" dir={dir}>

      {/* Desktop Sidebar - Extracted Component */}
      <DesktopSidebar
        user={user}
        currentPage={currentPage}
        onNavigate={protectedNavigate}
        onLogout={onLogout}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">

        {/* Mobile Header */}
        <header className="lg:hidden h-14 bg-white/95 backdrop-blur-sm border-b border-[#E2DCCF] flex items-center justify-between px-4 z-40 sticky top-0 safe-area-inset-top shadow-sm">
          <div className="flex items-center gap-2">
            <button onClick={() => setMobileMenuOpen(true)} className="p-2 -ml-1 text-slate-600 rounded-lg hover:bg-slate-100 active:bg-slate-200 transition-colors">
              <Menu size={20} />
            </button>
            <span className="font-bold text-slate-900 text-sm">Final Form</span>
          </div>
          <div className="flex items-center gap-2">
            {actions}
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:flex h-14 items-center justify-between px-6 lg:px-8 z-40 shrink-0 gap-4 border-b border-[#E2DCCF] bg-white/95 backdrop-blur-sm shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]">
          {/* Left Side: Breadcrumbs */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-1 min-w-0 truncate">
              {centerContent}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {actions}
          </div>
        </header>

        {/* Mobile Menu - Extracted Component */}
        <MobileMenu
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          navItems={navItems}
          currentPage={currentPage}
          onNavigate={(path) => protectedNavigate(path, () => setMobileMenuOpen(false))}
          onLogout={onLogout}
        />

        {/* Page Content */}
        <main className={cn(
          "flex-1 relative custom-scroll-thin bg-[#F8F5F1]",
          isBuilderPage ? "overflow-hidden" : "overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
        )}>
          <div className={cn("animate-fade-up", isBuilderPage && "h-full")}>
            {children}
          </div>
        </main>

        {/* Unsaved Changes Dialog */}
        <AlertDialog open={showUnsavedDialog} onOpenChange={(open) => { if (!isSavingBeforeLeave) setShowUnsavedDialog(open); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
              <AlertDialogDescription>
                You have unsaved changes. What would you like to do?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-2">
              <AlertDialogCancel disabled={isSavingBeforeLeave}>Stay</AlertDialogCancel>
              <AlertDialogAction
                disabled={isSavingBeforeLeave}
                onClick={() => {
                  if (pendingActionRef.current) pendingActionRef.current();
                  setShowUnsavedDialog(false);
                  pendingActionRef.current = null;
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Leave & Discard
              </AlertDialogAction>
              {onSaveBeforeLeave && (
                <button
                  onClick={handleSaveAndLeave}
                  disabled={isSavingBeforeLeave}
                  className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-semibold h-10 px-4 bg-[#FF5A1F] text-white hover:bg-[#E04D1A] transition-colors disabled:opacity-50"
                >
                  {isSavingBeforeLeave ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  Save & Leave
                </button>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </div>
  );
};

const DashboardLayout = (props: DashboardLayoutProps) => {
  return (
    <HeaderActionsProvider>
      <DashboardLayoutContent {...props} />
    </HeaderActionsProvider>
  );
};

export default DashboardLayout;
