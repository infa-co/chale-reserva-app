# Architecture rules
- AuthProvider owns one user-scoped access query; useAccess, protected routes, and plan restrictions consume it to avoid divergent access decisions.
- Resolve paid, trial, manual and existing administrator access in check-subscription after JWT verification; never trust client storage for entitlements.
- Initialize trial access through a protected profile-insert trigger so clients cannot extend their own trial or grant access.
- Keep access evaluation pure in the edge shared access module and cover entitlement boundaries with executable tests.- Booking dates are date-only strings; read/format them only via src/lib/dates (never new Date('YYYY-MM-DD') or toISOString) to avoid UTC day shifts.
- Stay overlap rules ([check_in, check_out), cancelled ignored, Airbnb iCal included) live in src/lib/bookingConflicts; forms check via useStayConflict so UI and DB stay consistent.
