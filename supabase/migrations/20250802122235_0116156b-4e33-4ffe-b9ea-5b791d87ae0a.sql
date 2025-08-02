-- Add fields for historical bookings tracking
ALTER TABLE public.bookings 
ADD COLUMN is_historical boolean NOT NULL DEFAULT false,
ADD COLUMN historical_registration_date timestamp with time zone DEFAULT NULL;

-- Create index for better performance when filtering historical bookings
CREATE INDEX idx_bookings_historical ON public.bookings(is_historical, user_id);

-- Create index for historical registration date queries
CREATE INDEX idx_bookings_historical_registration ON public.bookings(historical_registration_date) WHERE historical_registration_date IS NOT NULL;