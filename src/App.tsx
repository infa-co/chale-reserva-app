import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { BookingProvider } from "./contexts/BookingContext";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Index from "./pages/Index";
import ProtectedRoute from "./components/ProtectedRoute";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import MobileNav from "./components/MobileNav";

// Import das páginas diretamente para resolver problemas de dynamic import
import Dashboard from "./pages/Dashboard";
import HistoricalBookings from "./pages/HistoricalBookings";
import { FeatureRestriction } from "./components/FeatureRestriction";
const NewBooking = lazy(() => import("./pages/NewBooking"));
const EditBooking = lazy(() => import("./pages/EditBooking"));
import OptimizedBookingList from "./pages/OptimizedBookingList";
const BookingDetails = lazy(() => import("./pages/BookingDetails"));
const OptimizedClients = lazy(() => import("./pages/OptimizedClients"));
const Properties = lazy(() => import("./pages/Properties"));
const PropertyDashboard = lazy(() => import("./pages/PropertyDashboard"));
import Settings from "./pages/Settings";
import Payment from "./pages/Payment";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCanceled from "./pages/PaymentCanceled";
import Onboarding from "./pages/Onboarding";

const AssignBookings = lazy(() => import("./pages/AssignBookings"));

// Legal pages
const Terms = lazy(() => import("./pages/legal/Terms"));
const Privacy = lazy(() => import("./pages/legal/Privacy"));
const Support = lazy(() => import("./pages/legal/Support"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes  
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-600"></div>
  </div>
);

const ProtectedShell = () => (
  <ProtectedRoute>
    <BookingProvider>
      <div className="mobile-container pb-16">
        <Suspense fallback={<LoadingSpinner />}>
          <Outlet />
        </Suspense>
        <MobileNav />
        <PWAInstallPrompt />
      </div>
    </BookingProvider>
  </ProtectedRoute>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-canceled" element={<PaymentCanceled />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            
            {/* Landing page */}
            <Route path="/" element={<Navigate to="/site" replace />} />
            <Route path="/site" element={<Index />} />

              <Route element={<ProtectedShell />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/nova-reserva" element={<NewBooking />} />
                <Route path="/editar-reserva/:id" element={<EditBooking />} />
                <Route path="/reservas" element={<OptimizedBookingList />} />
                <Route path="/reserva/:id" element={<BookingDetails />} />
                <Route path="/clientes" element={<OptimizedClients />} />
                <Route path="/meus-chales" element={<Properties />} />
                <Route path="/chale/:id/dashboard" element={<PropertyDashboard />} />
                <Route path="/historico-reservas" element={
                  <FeatureRestriction
                    feature="hasHistoricalBookings"
                    featureName="registro de reservas passadas"
                    description="Registre e gerencie histórico de hóspedes anteriores"
                  >
                    <HistoricalBookings />
                  </FeatureRestriction>
                } />
                <Route path="/configuracoes" element={<Settings />} />
                <Route path="/atribuir-reservas" element={<AssignBookings />} />
              </Route>

              {/* Legal pages - accessible without authentication */}
              <Route path="/legal/terms" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Terms />
                </Suspense>
              } />
              <Route path="/legal/privacy" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Privacy />
                </Suspense>
              } />
              <Route path="/legal/support" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Support />
                </Suspense>
              } />
            </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;