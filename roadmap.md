# Access correction
- [ ] Confirm and explain the access failure.
- [ ] Centralize verified access and implement secure seven-day trials.
- [ ] Unify protected pages, feature access, signup and trial notices.
- [ ] Test access rules and verify available live flows; document unavailable authenticated checks.

# Security review
- [x] Restrict privileged functions; retain trigger execution and signed-in role lookup (database privileges verified).
- [x] Remove public avatar listing while preserving public profile image URLs.
- [x] Upgrade vulnerable dependencies (zero production advisories) and run 7 date/overlap plus 6 security tests.
- [x] Recheck database security and deployed calendar denial paths; public login renders without runtime errors.
- [ ] Resolve hosted OTP, leaked-password protection, and Postgres patch settings (requires Supabase dashboard controls unavailable here).
- [x] Review and remediate all 20 deep-scan findings: private export links, bounded provider imports, authorized scheduler, booking-bound guest messages, safe email markup, trusted returns, no personal log payloads.
- [ ] Verify authenticated signup/admin, guest delivery, secure-link copy and scheduler end-to-end (external unmanaged Supabase session unavailable; scheduler credential cannot be safely read or updated with available tools).