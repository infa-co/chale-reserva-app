-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a cron job to trigger iCal synchronization every hour
SELECT cron.schedule(
  'trigger-ical-sync-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
        url:='https://lwmwwsthduvmuyhynwol.supabase.co/functions/v1/trigger-sync',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3bXd3c3RoZHV2bXV5aHlud29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxOTI2NTgsImV4cCI6MjA2Nzc2ODY1OH0.Sc8P_DeNMro27ZHGUyr8Pahlpz0_MVPFqGCyn_GRLZg"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);