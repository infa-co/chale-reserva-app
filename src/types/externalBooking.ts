export interface ExternalBooking {
  id: string;
  user_id: string;
  ical_sync_id: string;
  external_id: string;
  summary: string;
  start_date: string;
  end_date: string;
  platform_name: string;
  raw_ical_data: string | null;
  created_at: string;
  updated_at: string;
}

export interface ICalSync {
  id: string;
  user_id: string;
  property_id: string | null;
  platform_name: string;
  ical_url: string;
  is_active: boolean;
  last_sync_at: string | null;
  sync_frequency_hours: number;
  created_at: string;
  updated_at: string;
}