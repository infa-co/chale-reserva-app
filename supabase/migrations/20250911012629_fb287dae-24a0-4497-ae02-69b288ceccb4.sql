-- Add birth_date and cpf columns to bookings table
ALTER TABLE public.bookings 
ADD COLUMN birth_date DATE,
ADD COLUMN cpf TEXT;