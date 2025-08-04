
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { BookingProvider } from "./contexts/BookingContext";
import Auth from "./pages/Auth";
import ProtectedRoute from "./components/ProtectedRoute";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import MobileNav from "./components/MobileNav";

// Lazy load das páginas para melhor performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const NewBooking = lazy(() => import("./pages/NewBooking"));
const EditBooking = lazy(() => import("./pages/EditBooking"));
const OptimizedBookingList = lazy(() => import("./pages/OptimizedBookingList"));
const BookingDetails = lazy(() => import("./pages/BookingDetails"));
const OptimizedClients = lazy(() => import("./pages/OptimizedClients"));
const Properties = lazy(() => import("./pages/Properties"));
const PropertyDashboard = lazy(() => import("./pages/PropertyDashboard"));
const HistoricalBookings = lazy(() => import("./pages/HistoricalBookings"));


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos
      refetchOnWindowFocus: false,
    },
  },
});

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-600"></div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <BookingProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/*" element={
                <ProtectedRoute>
                  <div className="mobile-container pb-16">
                    <Suspense fallback={<LoadingSpinner />}>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/nova-reserva" element={<NewBooking />} />
                        <Route path="/editar-reserva/:id" element={<EditBooking />} />
                        <Route path="/reservas" element={<OptimizedBookingList />} />
                        <Route path="/reserva/:id" element={<BookingDetails />} />
                        <Route path="/clientes" element={<OptimizedClients />} />
                        <Route path="/meus-chales" element={<Properties />} />
                        <Route path="/chale/:id/dashboard" element={<PropertyDashboard />} />
                        <Route path="/historico-reservas" element={<HistoricalBookings />} />
                        
                      </Routes>
                    </Suspense>
                    <MobileNav />
                    <PWAInstallPrompt />
                  </div>
                </ProtectedRoute>
              } />
            </Routes>
          </BrowserRouter>
        </BookingProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
