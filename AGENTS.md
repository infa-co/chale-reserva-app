# Architecture rules
- AuthProvider owns one user-scoped access query; useAccess, protected routes, and plan restrictions consume it to avoid divergent access decisions.
- Resolve paid, trial, manual and existing administrator access in check-subscription after JWT verification; never trust client storage for entitlements.
- Initialize trial access through a protected profile-insert trigger so clients cannot extend their own trial or grant access.
- Keep access evaluation pure in the edge shared access module and cover entitlement boundaries with executable tests.- Booking dates are date-only strings; read/format them only via src/lib/dates (never new Date('YYYY-MM-DD') or toISOString) to avoid UTC day shifts.
- Stay overlap rules ([check_in, check_out), cancelled ignored, Airbnb iCal included) live in src/lib/bookingConflicts; forms check via useStayConflict so UI and DB stay consistent.
- Privileged role lookup lives in the non-exposed private schema; public wrappers are invoker-only and privileged trigger functions deny browser execution to prevent role escalation.
- Calendar exports require a property-bound HMAC link and expose availability only; calendar imports allow recognized HTTPS provider hosts and validate every redirect to prevent data exposure and SSRF.
- Edge diagnostics never serialize personal data; payment return origins and email HTML use shared security helpers to prevent untrusted redirects and markup injection.

- iCal import parsing, the sync window and the "echo" rule (a platform block fully covered by the chalé's own bookings is not imported) live in supabase/functions/_shared/ical.ts and are covered by src/lib/icalSync.test.ts; sync-ical upserts by UID and only then deletes what left the feed.
- The hourly pg_cron job authenticates to trigger-sync with the database-only secret checked by verify_ical_cron_secret; never put the service role key in a migration.
