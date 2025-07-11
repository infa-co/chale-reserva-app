
export interface Booking {
  id: string;
  user_id: string;
  guest_name: string;
  phone: string;
  email?: string;
  city?: string;
  state?: string;
  booking_date: string;
  check_in: string;
  check_out: string;
  nights: number;
  total_value: number;
  payment_method: string;
  status: 'requested' | 'pending' | 'confirmed' | 'checked_in' | 'active' | 'checked_out' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  state?: string;
  tags: string[];
  total_bookings: number;
  total_revenue: number;
  created_at: string;
  updated_at?: string;
}
