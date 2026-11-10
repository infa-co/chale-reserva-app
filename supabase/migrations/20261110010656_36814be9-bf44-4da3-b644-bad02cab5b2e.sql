CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_check_out_after_check_in CHECK (check_out > check_in);
ALTER TABLE public.bookings ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (property_id WITH =, daterange(check_in, check_out, '[)') WITH &&)
  WHERE (status <> 'cancelled' AND property_id IS NOT NULL);