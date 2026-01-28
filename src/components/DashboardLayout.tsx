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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const { t, language, setLanguage, dir } = useI18n();
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
    <div className="h-screen w-screen overflow-hidden bg-[#FAFAFA] flex font-sans" dir={dir}>

      {/* --- Floating Sidebar (Desktop) --- */}
      <motion.aside
        initial={false}
        animate={sidebarCollapsed ? "collapsed" : "expanded"}
        variants={{
          expanded: {
            width: 256, // w-64
            transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
          },
          collapsed: {
            width: 80, // w-[80px]
            transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.05 }
          }
        }}
        className={cn(
          "hidden lg:flex fixed left-4 top-4 bottom-4 z-50 bg-[#0F172A] text-white rounded-[2rem] shadow-2xl flex-col py-6 overflow-hidden"
        )}
        onMouseEnter={() => setSidebarCollapsed(false)}
        onMouseLeave={() => setSidebarCollapsed(true)}
      >
        {/* Logo Area */}
        <div className="flex items-center gap-3 mb-8 h-10 px-4 shrink-0 overflow-hidden">
          <motion.div
            layout
            className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20 z-20 relative"
          >
            <Zap size={20} className="text-white fill-white" />
          </motion.div>

          <motion.div
            variants={{
              expanded: { opacity: 1, x: 0, transition: { delay: 0.1, duration: 0.2 } },
              collapsed: { opacity: 0, x: -10, transition: { duration: 0.1 } }
            }}
            className="font-bold text-lg tracking-tight whitespace-nowrap overflow-hidden"
          >
            {language === 'ar' ? 'فاينل' : 'Final Form'}
          </motion.div>
        </div>

        {/* Nav Items */}
        <div className="flex-1 flex flex-col gap-2 w-full px-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => protectedNavigate(item.path)}
              className={cn(
                "group flex items-center gap-3 px-3.5 py-3.5 rounded-full text-sm font-medium transition-colors relative overflow-hidden shrink-0",
                isActive(item.path)
                  ? "bg-white/10 text-white shadow-inner"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <span className={cn("relative z-10 shrink-0 transition-transform duration-300 group-hover:scale-110", isActive(item.path) ? "text-orange-400" : "")}>
                {item.icon}
              </span>

              <motion.span
                variants={{
                  expanded: { opacity: 1, x: 0, display: "block", transition: { delay: 0.1 } },
                  collapsed: { opacity: 0, x: -10, transitionEnd: { display: "none" } }
                }}
                className="relative z-10 whitespace-nowrap"
              >
                {item.label}
              </motion.span>

              {/* Active Indicator Dot - Only show when expanded to avoid clutter in collapsed */}
              {isActive(item.path) && (
                <motion.div
                  variants={{
                    expanded: { opacity: 1, scale: 1 },
                    collapsed: { opacity: 0, scale: 0 }
                  }}
                  className="absolute right-4 w-1.5 h-1.5 bg-orange-400 rounded-full"
                />
              )}
            </button>
          ))}
        </div>

        {/* Footer Area: User + Plan */}
        {/* Footer Area: User + Plan (Unified) */}
        <div className="mt-auto flex flex-col gap-4 w-full px-3">
          <motion.div
            layout
            initial={false}
            animate={sidebarCollapsed ? "collapsed" : "expanded"}
            variants={{
              expanded: {
                borderRadius: "1rem", // rounded-2xl 
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                transition: { duration: 0.3 }
              },
              collapsed: {
                borderRadius: "2rem", // rounded-full
                backgroundColor: "rgba(255, 255, 255, 0.0)", // Transparent or subtle
                transition: { duration: 0.3 }
              }
            }}
            className="overflow-hidden relative group"
          >
            {/* Unified Dropdown Trigger and Avatar Area */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "w-full flex items-center relative transition-all duration-300 outline-none",
                    sidebarCollapsed ? "justify-center p-0 h-12" : "p-3 gap-3"
                  )}
                >
                  {/* Avatar & Ring Container */}
                  <div className="relative shrink-0 flex items-center justify-center">
                    <div className="w-9 h-9 rounded-full bg-slate-800 border border-white/10 overflow-hidden relative z-20">
                      {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <User size={16} className="m-2 text-slate-500" />}
                    </div>

                    {/* Plan Usage Ring - Visible ONLY when collapsed */}
                    <motion.svg
                      variants={{
                        expanded: { opacity: 0, scale: 0.8 },
                        collapsed: { opacity: 1, scale: 1, transition: { delay: 0.2 } }
                      }}
                      className="absolute w-11 h-11 -rotate-90 z-10 pointer-events-none"
                      viewBox="0 0 36 36"
                    >
                      <path
                        className="text-white/10"
                        strokeWidth="2"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-orange-500 drop-shadow-[0_0_2px_rgba(249,115,22,0.8)]"
                        strokeDasharray="85, 100"
                        strokeWidth="2"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </motion.svg>
                  </div>

                  {/* User Info Text */}
                  <motion.div
                    variants={{
                      expanded: { opacity: 1, x: 0, width: "auto", display: "block", transition: { delay: 0.2 } },
                      collapsed: { opacity: 0, x: -10, width: 0, transitionEnd: { display: "none" } }
                    }}
                    className="text-left overflow-hidden whitespace-nowrap flex-1"
                  >
                    <div className="text-sm font-medium truncate text-white">{user.displayName}</div>
                    <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
                  </motion.div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="right" className="w-60 rounded-xl bg-slate-900 border-slate-800 text-slate-200 p-2 ml-4">
                <div className="px-2 py-1.5 mb-1 border-b border-white/10">
                  <p className="font-bold text-white text-sm">{user.displayName}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="rounded-lg focus:bg-white/10 focus:text-white data-[state=open]:bg-white/10">
                    <Globe size={16} className="mr-2" />
                    <span>Language</span>
                    <span className="ml-auto text-xs text-slate-400 uppercase">{language}</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="bg-slate-900 border-slate-800 text-slate-200 rounded-xl p-1">
                    {languages.map(l => (
                      <DropdownMenuItem
                        key={l.code}
                        onClick={() => setLanguage(l.code)}
                        className={cn("rounded-lg focus:bg-white/10 focus:text-white cursor-pointer", language === l.code && "bg-orange-500/10 text-orange-400")}
                      >
                        <span className="mr-2 text-base">{l.flag}</span>
                        {l.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuItem
                  onClick={onLogout}
                  className="rounded-lg text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer mt-1"
                >
                  <LogOut size={16} className="mr-2" />
                  {t('nav.signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Plan Details (Expanded Only) */}
            <motion.div
              variants={{
                expanded: { opacity: 1, height: "auto", transition: { delay: 0.3 } },
                collapsed: { opacity: 0, height: 0, transition: { duration: 0.1 } }
              }}
              className="px-3 pb-3 overflow-hidden"
            >
              <div className="h-px w-full bg-white/5 my-2" />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">Pro Plan</span>
                    <span className="text-[10px] text-slate-400">Renews Feb 28</span>
                  </div>
                  <span className="text-[10px] font-mono text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded">Active</span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Usage</span>
                    <span className="text-white">85%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "85%" }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.4)]"
                    />
                  </div>
                </div>

                <button className="w-full py-1.5 mt-1 bg-white/5 hover:bg-white/10 text-slate-200 rounded-lg text-[10px] font-medium transition-colors border border-white/5">
                  Manage Subscription
                </button>
              </div>
            </motion.div>
          </motion.div>
        </div>

      </motion.aside>


      {/* --- Main Content Area --- */}
      <div className={cn(
        "flex-1 flex flex-col h-full transition-all duration-300",
        // Desktop margin is now static to accommodate the COLLAPSED sidebar width + margins
        // Sidebar expands OVER content, so we don't increase margin on expand
        "lg:ml-[112px]"
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
        <header className="hidden lg:flex h-16 items-center justify-between px-6 z-40 shrink-0 gap-4">

          {/* Left Side: Breadcrumbs */}
          <div className="flex items-center gap-4 flex-1">
            <div className="flex-1">
              {centerContent}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {actions}
            {/* User and Language moved to Sidebar */}
          </div>
        </header>

        {/* Mobile Menu Overlay */}
        {
          mobileMenuOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
              <div className="absolute inset-y-0 left-0 w-64 bg-slate-900 text-white p-6 shadow-2xl flex flex-col">
                <div className="flex justify-between items-center mb-8">
                  <div className="font-bold text-xl">Final Form</div>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1 bg-white/10 rounded-lg"><X size={20} /></button>
                </div>
                <div className="space-y-2">
                  {navItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => protectedNavigate(item.path, () => setMobileMenuOpen(false))}
                      className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors", isActive(item.path) ? "bg-orange-600 text-white" : "text-slate-400 hover:bg-white/10")}
                    >
                      {item.icon} {item.label}
                    </button>
                  ))}
                </div>
                <div className="mt-auto pt-6 border-t border-white/10">
                  <button onClick={onLogout} className="flex items-center gap-3 text-red-400 font-medium px-4 py-2 hover:bg-white/5 rounded-xl w-full">
                    <LogOut size={18} /> Sign Out
                  </button>
                </div>
              </div>
            </div>
          )
        }

        {/* Page Content */}
        <main className={cn(
          "flex-1 relative",
          isBuilderPage ? "overflow-hidden rounded-tl-2xl bg-white shadow-[-10px_-10px_30px_-10px_rgba(0,0,0,0.05)] border-l border-t border-slate-200/60" : "overflow-y-auto p-6 lg:p-10"
        )}>
          {children}
        </main>

        {/* Unsaved Changes Dialog */}
        < AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog} >
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
