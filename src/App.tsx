
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
import MobileNav from "./components/MobileNav";
import { BookingProvider } from "./contexts/BookingContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BookingProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
        </BrowserRouter>
      </BookingProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
