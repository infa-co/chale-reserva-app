
export interface Property {
  id: string;
  user_id: string;
  name: string;
  location: string;
  capacity: number;
  default_daily_rate?: number;
  fixed_notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface PropertyStats {
  totalBookings: number;
  monthlyBookings: number;
  totalRevenue: number;
  monthlyRevenue: number;
  occupancyRate: number;
  averageDailyRate: number;
}
