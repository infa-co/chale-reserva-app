
export interface Booking {
  id: string;
  guestName: string;
  phone: string;
  email?: string;
  city?: string;
  state?: string;
  bookingDate: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalValue: number;
  paymentMethod: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  state?: string;
  tags: string[];
  bookings: Booking[];
  totalBookings: number;
  totalRevenue: number;
}
