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
  Plug,
  ShoppingCart,
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
      id: 'orders',
      label: 'Orders',
      icon: <ShoppingCart size={20} />,
      path: '/dashboard/orders',
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
        "flex-1 flex flex-col bg-white shadow-2xl overflow-hidden border border-slate-200/60 relative transition-all duration-300",
        "h-screen lg:h-[calc(100vh-2rem)] lg:m-4 lg:ml-0 lg:rounded-[2rem]",
        "rounded-none m-0"
      )}>

        {/* Mobile Header */}
        <header className="lg:hidden h-14 glass border-b border-slate-200/60 flex items-center justify-between px-3 z-40 sticky top-0 safe-area-inset-top">
          <div className="flex items-center gap-2">
            <button onClick={() => setMobileMenuOpen(true)} className="p-2.5 -ml-1 text-slate-600 touch-target rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors">
              <Menu size={22} />
            </button>
            <span className="font-bold text-slate-900 text-sm">Final Form</span>
          </div>
          <div className="flex items-center gap-1.5">
            {actions}
          </div>
        </header>

        {/* Desktop Header (Actions Only) - Compact */}
        <header className="hidden lg:flex h-12 items-center justify-between px-5 z-40 shrink-0 gap-3 border-b border-slate-100">
          {/* Left Side: Breadcrumbs */}
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-1">
              {centerContent}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
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
          "flex-1 relative custom-scroll-thin",
          isBuilderPage ? "overflow-hidden" : "overflow-y-auto p-3 sm:p-5 lg:p-8"
        )}>
          <div className={cn("animate-fade-up", isBuilderPage && "h-full")}>
            {children}
          </div>
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
