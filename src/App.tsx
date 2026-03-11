import { Toaster as Sonner } from "@/components/ui/sonner";
import { ConnectionStatusBanner } from "@/components/ConnectionStatusBanner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/plus-jakarta-sans/800.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { getStoredUser, GoogleUser, onAuthStateChange, signOutUser } from "./lib/authGoogle";
import { checkOnboardingStatus } from "./hooks/useOnboarding";
import { I18nProvider } from "./lib/i18n/i18nContext";
import { useFormStore } from "./stores";
import { AssignmentsProvider } from "./contexts/AssignmentsContext";

// Lazy load pages for better performance
const Landing = lazy(() => import("./pages/Landing"));
const EditFormPage = lazy(() => import("./pages/EditFormPage"));
const FormsPage = lazy(() => import("./pages/FormsPage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const OrdersPage = lazy(() => import("./pages/OrdersPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const DashboardLayout = lazy(() => import("./components/DashboardLayout"));
const GoogleLoginPage = lazy(() => import("./components/GoogleLoginPage"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const FormConfigAPI = lazy(() => import("./pages/api/FormConfigAPI"));
const OffersPage = lazy(() => import("./pages/rules/OffersPage"));
const ShippingPage = lazy(() => import("./pages/rules/ShippingPage"));
const CouponsPage = lazy(() => import("./pages/rules/CouponsPage"));
const IntegrationsPage = lazy(() => import("./pages/IntegrationsPage"));
const StoresPage = lazy(() => import("./pages/StoresPage"));

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-[#F8F7F5] flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

// Optimized QueryClient with better defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const AppContent = () => {
  const [user, setUser] = useState<GoogleUser | null>(getStoredUser());
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  // Form config is now managed in Zustand store (useFormStore)
  const navigate = useNavigate();
  const location = useLocation();

  // Monitor auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (authUser) => {
      setUser(authUser);
      setIsCheckingAuth(false);

      // Check onboarding status for authenticated users
      if (authUser) {
        const completed = await checkOnboardingStatus(authUser.id);
        setNeedsOnboarding(!completed);
      }
    });

    return () => unsubscribe();
  }, []);

  // Set initial checking to false after a delay if no listener fired
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCheckingAuth(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await signOutUser();
      setUser(null);
      navigate("/dashboard/forms");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [navigate]);

  const handleLoginSuccess = useCallback(async (newUser: GoogleUser) => {
    setUser(newUser);
    const completed = await checkOnboardingStatus(newUser.id);
    if (!completed) {
      setNeedsOnboarding(true);
      navigate('/onboarding');
    } else {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleNavigate = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  const handleLoadForm = useCallback((config: Record<string, any>) => {
    useFormStore.getState().loadFormConfig(config);
    navigate('/dashboard/forms');
  }, [navigate]);

  if (isCheckingAuth) {
    return <LoadingSpinner />;
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public API Routes - No authentication required */}
        <Route path="/api/form-config" element={<FormConfigAPI />} />

        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route
          path="/auth"
          element={
            user ? (
              needsOnboarding ? <Navigate to="/onboarding" replace /> : <Navigate to="/dashboard" replace />
            ) : (
              <GoogleLoginPage onLoginSuccess={handleLoginSuccess} />
            )
          }
        />

        {/* Onboarding route — only for authenticated users who haven't completed it */}
        <Route
          path="/onboarding"
          element={
            !user ? (
              <Navigate to="/auth" replace />
            ) : (
              <OnboardingPage
                userId={user.id}
                onComplete={() => {
                  setNeedsOnboarding(false);
                  navigate('/dashboard');
                }}
              />
            )
          }
        />

        {/* Protected Dashboard Routes */}
        {user && (
          <Route
            path="/dashboard/*"
            element={
              needsOnboarding ? (
                <Navigate to="/onboarding" replace />
              ) : (
                <DashboardLayout
                  user={user}
                  currentPage={location.pathname}
                  onNavigate={handleNavigate}
                  onLogout={handleLogout}
                  onUserUpdate={setUser}
                >
                  <AssignmentsProvider userId={user.id}>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Routes>
                        <Route
                          path="home"
                          element={<HomePage userId={user.id} />}
                        />
                        <Route
                          path="forms"
                          element={<FormsPage />}
                        />
                        <Route
                          path="forms/edit"
                          element={<Navigate to="/dashboard/forms" replace />}
                        />
                        <Route
                          path="forms/edit/:formId"
                          element={<EditFormPage userId={user.id} />}
                        />
                        <Route
                          path="integrations"
                          element={<IntegrationsPage userId={user.id} />}
                        />

                        <Route
                          path="orders"
                          element={<OrdersPage userId={user.id} />}
                        />
                        <Route
                          path="stores"
                          element={<StoresPage userId={user.id} />}
                        />
                        <Route path="rules/offers" element={<OffersPage userId={user.id} />} />
                        <Route path="rules/shipping" element={<ShippingPage userId={user.id} />} />
                        <Route path="rules/coupons" element={<CouponsPage userId={user.id} />} />
                        <Route path="profile" element={<ProfilePage user={user} />} />
                        <Route path="settings" element={<SettingsPage user={user} onUserUpdate={setUser} />} />
                        <Route path="" element={<Navigate to="/dashboard/home" replace />} />
                        <Route path="*" element={<Navigate to="/dashboard/home" replace />} />
                      </Routes>
                    </Suspense>
                  </AssignmentsProvider>
                </DashboardLayout>
              )
            }
          />
        )}

        {/* Redirect unauthenticated users from dashboard to auth */}
        {!user && (
          <Route
            path="/dashboard/*"
            element={<Navigate to="/auth" replace />}
          />
        )}

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};



const App = () => {
  return (
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            <Sonner />
            <ConnectionStatusBanner />
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </I18nProvider>
  );
};

export default App;
