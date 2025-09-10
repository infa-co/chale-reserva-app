-- Remove the existing status constraint that only allows 'confirmed', 'pending', 'cancelled'
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

-- Add new constraint that includes all valid status values
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('requested', 'pending', 'confirmed', 'checked_in', 'active', 'checked_out', 'completed', 'cancelled'));