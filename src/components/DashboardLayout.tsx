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
  FolderOpen,
  Menu,
  Package,
  Plug,
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
  const { actions, centerContent } = useHeaderActions();
  const hasUnsavedChanges = useFormStore((state) => state.hasUnsavedChanges);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const pendingActionRef = React.useRef<(() => void) | null>(null);

  // Determine if we are in the Builder view
  const isBuilderPage = currentPage === '/dashboard/build/new' || (currentPage.startsWith('/dashboard/build/') && currentPage.length > 17);

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

  const navItems: NavItem[] = useMemo(() => [
    {
      id: 'forms',
      label: 'Forms',
      icon: <FolderOpen size={20} />,
      path: '/dashboard/forms',
    },
    {
      id: 'integrations',
      label: 'Integrations',
      icon: <Plug size={20} />,
      path: '/dashboard/integrations',
    },
    {
      id: 'products',
      label: 'Products',
      icon: <Package size={20} />,
      path: '/dashboard/products',
    },
  ], []);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#FAFAFA] flex font-sans" dir={dir}>

      {/* Desktop Sidebar - Extracted Component */}
      <DesktopSidebar
        user={user}
        currentPage={currentPage}
        onNavigate={protectedNavigate}
        onLogout={onLogout}
      />

      {/* --- Main Content Area --- */}
      <div className={cn(
        "flex-1 flex flex-col h-[calc(100vh-2rem)] m-4 ml-0 bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200/60 relative transition-all duration-300"
      )}>

        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-4 z-40 sticky top-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(true)} className="p-2 -ml-2 text-slate-600">
              <Menu size={24} />
            </button>
            <span className="font-bold text-slate-900">Final Form</span>
          </div>
          <div className="flex items-center gap-2">
            {actions}
          </div>
        </header>

        {/* Desktop Header (Actions Only) */}
        <header className="hidden lg:flex h-16 items-center justify-between px-8 z-40 shrink-0 gap-4 border-b border-slate-100">
          {/* Left Side: Breadcrumbs */}
          <div className="flex items-center gap-4 flex-1">
            <div className="flex-1">
              {centerContent}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
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
          "flex-1 relative",
          isBuilderPage ? "overflow-hidden" : "overflow-y-auto p-8"
        )}>
          {children}
        </main>

        {/* Unsaved Changes Dialog */}
        <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
              <AlertDialogDescription>
                You have unsaved changes. Leaving this page will discard them. Are you sure?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Stay</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (pendingActionRef.current) pendingActionRef.current();
                  setShowUnsavedDialog(false);
                  pendingActionRef.current = null;
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Leave & Discard
              </AlertDialogAction>
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
