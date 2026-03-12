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
import { cn } from '@/lib/utils';
import {
  Crown,
  FileText,
  FolderOpen,
  LayoutGrid,
  Loader2,
  Menu,
  Save,
  Settings,
  ShoppingCart,
  Store,
  Tag,
  Ticket,
  Truck,
  Plug,
  X
} from 'lucide-react';
import React, { lazy, useMemo, useState } from 'react';
import { HeaderActionsProvider, useHeaderActions } from '../contexts/HeaderActionsContext';
import { GoogleUser } from '../lib/authGoogle';
import { useI18n } from '../lib/i18n/i18nContext';
import { useFormStore } from '../stores';
import { useSubscription } from '../hooks/useSubscription';
import { DesktopSidebar, MobileMenu } from './Sidebar';
import PlanPickerDialog from './PlanPickerDialog';

const PlanUpgradeBanner = lazy(() => import('./PlanUpgradeBanner'));

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

export interface NavGroup {
  title: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  pinBottom?: boolean;
  items: NavItem[];
}

interface DashboardLayoutProps {
  user: GoogleUser;
  currentPage: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  onUserUpdate?: (user: GoogleUser) => void;
  children: React.ReactNode;
}

const DashboardLayoutContent = ({
  user,
  currentPage,
  onNavigate,
  onLogout,
  onUserUpdate,
  children,
}: DashboardLayoutProps) => {

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const { dir } = useI18n();
  const { actions, centerContent, onSaveBeforeLeave } = useHeaderActions();
  const hasUnsavedChanges = useFormStore((state) => state.hasUnsavedChanges);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [isSavingBeforeLeave, setIsSavingBeforeLeave] = useState(false);
  const pendingActionRef = React.useRef<(() => void) | null>(null);
  const sub = useSubscription(user.id, user.email, user.displayName);

  // Determine if we are in the Builder view
  const isBuilderPage = currentPage === '/dashboard/forms/edit/new' || (currentPage.startsWith('/dashboard/forms/edit/') && currentPage.length > 22);

  // Check if user is on free plan to show the upgrade banner
  const isFreePlan = !user.email; // placeholder: real check happens in the lazy-loaded banner
  // We always render the banner and let it handle its own visibility via useSubscription

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

  const navGroups: NavGroup[] = useMemo(() => [
    {
      title: "YOUR SPACE",
      items: [
        { id: 'home', label: 'Home', icon: <LayoutGrid size={20} />, path: '/dashboard/home' },
        { id: 'forms', label: 'Forms', icon: <FolderOpen size={20} />, path: '/dashboard/forms' },
        { id: 'orders', label: 'Orders', icon: <ShoppingCart size={20} />, path: '/dashboard/orders' },
        { id: 'stores', label: 'Stores', icon: <Store size={20} />, path: '/dashboard/stores' },
      ]
    },
    {
      title: "RULES",
      collapsible: true,
      defaultExpanded: true,
      items: [
        { id: 'offers', label: 'Offers', icon: <Tag size={20} />, path: '/dashboard/rules/offers' },
        { id: 'shipping', label: 'Shipping', icon: <Truck size={20} />, path: '/dashboard/rules/shipping' },
        { id: 'coupons', label: 'Coupons', icon: <Ticket size={20} />, path: '/dashboard/rules/coupons' },
      ]
    },
    {
      title: "EXTENSIONS",
      collapsible: true,
      defaultExpanded: true,
      items: [
        { id: 'integrations', label: 'Integrations', icon: <Plug size={20} />, path: '/dashboard/integrations' },
      ]
    },
    {
      title: "",
      pinBottom: true,
      items: [
        { id: 'subscription', label: 'Subscription', icon: <Crown size={20} />, path: '/dashboard/subscription' },
        { id: 'settings', label: 'Settings', icon: <Settings size={20} />, path: '/dashboard/settings' },
      ]
    }
  ], []);

  return (
    <div className="h-screen w-screen overflow-hidden bg-white flex font-sans" dir={dir}>

      {/* Desktop Sidebar - Extracted Component */}
      <DesktopSidebar
        user={user}
        currentPage={currentPage}
        onNavigate={protectedNavigate}
        onLogout={onLogout}
        navGroups={navGroups}
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
          navGroups={navGroups}
          currentPage={currentPage}
          onNavigate={(path) => protectedNavigate(path, () => setMobileMenuOpen(false))}
          onLogout={onLogout}
        />

        {/* Plan Upgrade Banner — shown for all users, self-hides if not on free plan */}
        {!isBuilderPage && (
          <React.Suspense fallback={null}>
            <PlanUpgradeBanner onUpgrade={() => setShowPlanPicker(true)} />
          </React.Suspense>
        )}

        {/* Page Content */}
        <main className={cn(
          "flex-1 relative custom-scroll-thin bg-[#F8F5F1] flex flex-col",
          isBuilderPage ? "overflow-hidden" : "overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
        )}>
          <div className={cn("animate-fade-up flex-1 flex flex-col w-full min-h-full", isBuilderPage && "h-full")}>
            {React.isValidElement(children) && typeof children.type !== 'string'
              ? React.cloneElement(children as React.ReactElement<any>, { ...(onUserUpdate ? { onUserUpdate } : {}) })
              : children}
          </div>
        </main>

        {/* Unsaved Changes Dialog */}
        <AlertDialog open={showUnsavedDialog} onOpenChange={(open) => { if (!isSavingBeforeLeave) setShowUnsavedDialog(open); }}>
          <AlertDialogContent>
            <button
              onClick={() => setShowUnsavedDialog(false)}
              disabled={isSavingBeforeLeave}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
            <AlertDialogHeader>
              <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
              <AlertDialogDescription>
                You have unsaved changes. Do you want to save them before leaving?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-2 sm:justify-end mt-4">
              <AlertDialogAction
                disabled={isSavingBeforeLeave}
                onClick={() => {
                  if (pendingActionRef.current) pendingActionRef.current();
                  setShowUnsavedDialog(false);
                  pendingActionRef.current = null;
                }}
                className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-200"
              >
                Discard
              </AlertDialogAction>
              {onSaveBeforeLeave && (
                <Button
                  onClick={handleSaveAndLeave}
                  disabled={isSavingBeforeLeave}
                  className="h-10 px-4 font-semibold gap-2"
                >
                  {isSavingBeforeLeave ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  Save & Leave
                </Button>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Plan Picker Popup — triggered from upgrade banner */}
        <PlanPickerDialog
          open={showPlanPicker}
          onClose={() => setShowPlanPicker(false)}
          currentPlanId={sub.currentPlan.id}
          subscriptionStatus={sub.subscription?.status}
          ordersThisMonth={sub.ordersThisMonth}
          monthlyOrderLimit={sub.currentPlan.monthlyOrders}
          onSubmitPlanRequest={sub.submitPlanRequest}
        />

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
