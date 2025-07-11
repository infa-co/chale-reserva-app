
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import NewBooking from "./pages/NewBooking";
import BookingList from "./pages/BookingList";
import BookingDetails from "./pages/BookingDetails";
import Clients from "./pages/Clients";
import Auth from "./pages/Auth";
import MobileNav from "./components/MobileNav";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { BookingProvider } from "./contexts/BookingContext";

const queryClient = new QueryClient();

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
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/nova-reserva" element={<NewBooking />} />
                      <Route path="/reservas" element={<BookingList />} />
                      <Route path="/reserva/:id" element={<BookingDetails />} />
                      <Route path="/clientes" element={<Clients />} />
                    </Routes>
                    <MobileNav />
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
