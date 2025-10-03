
export interface Booking {
  id: string;
  user_id: string;
  property_id?: string; // Adicionando property_id como opcional
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
  birth_date?: string;
  cpf?: string;
  created_at: string;
  updated_at?: string;
  is_historical?: boolean;
  historical_registration_date?: string;
  guest_email?: string; // Email para enviar confirmação ao hóspede
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
