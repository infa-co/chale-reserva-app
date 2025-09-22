import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
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
import TestUsers from "./pages/TestUsers";
const AssignBookings = lazy(() => import("./pages/AssignBookings"));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-600"></div>
  </div>
);

const ProtectedShell = () => (
  <ProtectedRoute>
    <div className="mobile-container pb-16">
      <Suspense fallback={<LoadingSpinner />}>
        <Outlet />
      </Suspense>
      <MobileNav />
      <PWAInstallPrompt />
    </div>
  </ProtectedRoute>
);

function App() {
  return (
    <>
      <AuthProvider>
        <BookingProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/payment" element={<Payment />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-canceled" element={<PaymentCanceled />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/test-users" element={<TestUsers />} />
              
              {/* Redirect root to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              <Route element={<ProtectedShell />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/nova-reserva" element={<NewBooking />} />
                <Route path="/editar-reserva/:id" element={<EditBooking />} />
                <Route path="/reservas" element={<OptimizedBookingList />} />
                <Route path="/reserva/:id" element={<BookingDetails />} />
                <Route path="/clientes" element={<OptimizedClients />} />
                <Route path="/meus-chales" element={<Properties />} />
                <Route path="/chale/:id/dashboard" element={<PropertyDashboard />} />
                <Route path="/historico-reservas" element={<HistoricalBookings />} />
                <Route path="/configuracoes" element={<Settings />} />
                <Route path="/atribuir-reservas" element={<AssignBookings />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </BookingProvider>
      </AuthProvider>
    </>
  );
}

export default App;