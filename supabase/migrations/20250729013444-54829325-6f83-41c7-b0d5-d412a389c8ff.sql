-- Create table for iCal sync configurations
CREATE TABLE public.ical_syncs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  platform_name TEXT NOT NULL DEFAULT 'Airbnb',
  ical_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_frequency_hours INTEGER NOT NULL DEFAULT 6,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for external bookings from iCal
CREATE TABLE public.external_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ical_sync_id UUID NOT NULL REFERENCES public.ical_syncs(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL, -- UID from iCal
  summary TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  platform_name TEXT NOT NULL DEFAULT 'Airbnb',
  raw_ical_data TEXT, -- Store original iCal event data
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(ical_sync_id, external_id)
);

-- Enable RLS
ALTER TABLE public.ical_syncs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_bookings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ical_syncs
CREATE POLICY "Users can view their own iCal syncs" 
ON public.ical_syncs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own iCal syncs" 
ON public.ical_syncs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own iCal syncs" 
ON public.ical_syncs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own iCal syncs" 
ON public.ical_syncs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for external_bookings
CREATE POLICY "Users can view their own external bookings" 
ON public.external_bookings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own external bookings" 
ON public.external_bookings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own external bookings" 
ON public.external_bookings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own external bookings" 
ON public.external_bookings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_ical_syncs_user_id ON public.ical_syncs(user_id);
CREATE INDEX idx_ical_syncs_property_id ON public.ical_syncs(property_id);
CREATE INDEX idx_external_bookings_user_id ON public.external_bookings(user_id);
CREATE INDEX idx_external_bookings_sync_id ON public.external_bookings(ical_sync_id);
CREATE INDEX idx_external_bookings_dates ON public.external_bookings(start_date, end_date);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ical_syncs_updated_at
  BEFORE UPDATE ON public.ical_syncs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_external_bookings_updated_at
  BEFORE UPDATE ON public.external_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();