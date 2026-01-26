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
  Globe,
  LogOut,
  Menu,
  Package,
  Plug,
  User,
  X,
  Zap
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import packageJson from '../../package.json';
import { HeaderActionsProvider, useHeaderActions } from '../contexts/HeaderActionsContext';
import { GoogleUser } from '../lib/authGoogle';
import { useI18n } from '../lib/i18n/i18nContext';
import { Language } from '../lib/i18n/translations';
import { useFormStore } from '../stores';

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const { t, language, setLanguage, dir } = useI18n();
  const { actions, centerContent } = useHeaderActions();
  const formName = useFormStore((state) => state.formName);
  const formId = useFormStore((state) => state.formId);
  const hasUnsavedChanges = useFormStore((state) => state.hasUnsavedChanges);
  const setFormName = useFormStore((state) => state.setFormName);
  const resetToNewForm = useFormStore((state) => state.resetToNewForm);
  const setEditingSection = useFormStore((state) => state.setEditingSection);
  const isNameDuplicate = useFormStore((state) => state.isNameDuplicate);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const pendingActionRef = React.useRef<(() => void) | null>(null);

  // Determine if we are in the Builder view (specifically editing a form)
  const isBuilderPage = currentPage === '/dashboard/build/new' || (currentPage.startsWith('/dashboard/build/') && currentPage.length > 17);

  const protectedNavigate = (path: string, action?: () => void) => {
    if (path === currentPage && !action) return;

    if (hasUnsavedChanges()) {
      pendingActionRef.current = () => {
        const markClean = useFormStore.getState().markClean;
        const setFormId = useFormStore.getState().setFormId;
        markClean();
        setFormId(null); // Force reload from server next time we visit a form
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

  const isActive = (path: string) => {
    if (path === '/dashboard/forms') {
      return currentPage.startsWith('/dashboard/forms') || currentPage.startsWith('/dashboard/build');
    }
    return currentPage === path;
  };

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
  ];

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 flex flex-col font-sans" dir={dir}>

      {/* Top Fixed Header */}
      <header className="relative flex-none h-14 w-full bg-white border-b border-slate-200 z-50 flex items-center justify-between px-4 lg:px-5">
        <div className="flex items-center gap-3">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Zap size={18} className="text-white fill-white" />
            </div>
            <span className="hidden md:block font-bold text-slate-900 tracking-tight">
              {language === 'ar' ? 'فاينل' : 'Final'}
            </span>
          </div>
        </div>

        {/* Center Content Actions */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl px-4 pointer-events-none">
          <div className="pointer-events-auto flex justify-center">
            {centerContent}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {actions}
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 bg-white border-r border-slate-200 flex flex-col lg:translate-x-0 pt-14 lg:pt-0",
          sidebarCollapsed ? "lg:w-[60px]" : "lg:w-56",
          mobileMenuOpen ? "translate-x-0 w-56 shadow-xl" : "-translate-x-full"
        )}
        >
          {/* Sidebar Toggle (Desktop Only) */}
          <div className="hidden lg:flex items-center justify-end p-2 border-b border-slate-100 h-10">
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-md transition-colors">
              <Menu size={16} />
            </button>
          </div>

          <div className="flex-1 flex flex-col overflow-y-auto py-3 gap-0.5 px-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => protectedNavigate(item.path, () => setMobileMenuOpen(false))}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium",
                  isActive(item.path)
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  sidebarCollapsed && "justify-center px-0 py-2.5"
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <span className={isActive(item.path) ? "text-indigo-600" : "text-slate-400"}>
                  {item.icon}
                </span>
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            ))}
          </div>

          {/* Sidebar Footer */}
          <div className="p-2 border-t border-slate-100 flex flex-col gap-1">
            {/* Version Badge */}
            {!sidebarCollapsed && (
              <div className="px-3 py-1 text-[10px] text-slate-400 font-mono">
                v{packageJson.version}
              </div>
            )}
            <button
              onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 relative",
                sidebarCollapsed && "justify-center"
              )}
            >
              <Globe size={18} className="text-slate-400" />
              {!sidebarCollapsed && <span className="flex-1 text-left">{languages.find(l => l.code === language)?.name}</span>}

              {languageMenuOpen && (
                <div className="absolute bottom-full left-0 w-full mb-2 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden py-1 min-w-[140px] z-50">
                  {languages.map(l => (
                    <div
                      key={l.code}
                      onClick={(e) => {
                        e.stopPropagation();
                        setLanguage(l.code);
                        setLanguageMenuOpen(false);
                      }}
                      className="px-3 py-2 hover:bg-indigo-50 cursor-pointer flex items-center gap-2 transition-colors text-sm"
                    >
                      <span>{l.flag}</span>
                      <span>{l.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </button>

            <div className="h-px bg-slate-100 mx-2" />

            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className={cn(
                "flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-100 relative",
                sidebarCollapsed && "justify-center"
              )}
            >
              <div className="w-7 h-7 rounded-full bg-slate-200 border border-white shadow-sm overflow-hidden shrink-0">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <User size={14} className="m-1.5 text-slate-500" />
                )}
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 text-left min-w-0">
                  <div className="font-medium text-xs text-slate-900 truncate">{user.displayName}</div>
                  <div className="text-[10px] text-slate-500 truncate">{user.email}</div>
                </div>
              )}

              {userMenuOpen && (
                <div className="absolute bottom-full left-0 w-[200px] mb-2 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden py-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                    <div className="font-medium text-sm text-slate-900">{user.displayName}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{user.email}</div>
                  </div>
                  <div
                    onClick={(e) => { e.stopPropagation(); onLogout(); }}
                    className="px-4 py-2.5 hover:bg-red-50 text-red-600 cursor-pointer flex items-center gap-2 text-sm font-medium"
                  >
                    <LogOut size={14} />
                    {t('nav.signOut')}
                  </div>
                </div>
              )}
            </button>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
        )}

        {/* Main Content Viewer - SCROLLABLE */}
        <main className={cn(
          "flex-1 bg-slate-100 relative",
          isBuilderPage ? "overflow-hidden" : "overflow-y-auto"
        )}>
          <div className={cn(
            "min-h-full mx-auto",
            isBuilderPage ? "p-0 h-full max-w-none" : "p-4 lg:p-6 max-w-[1600px]"
          )}>
            {children}
          </div>
        </main>

      </div>

      {/* Unsaved Changes Confirmation Dialog */}
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
