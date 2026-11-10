# Access correction
- [ ] Confirm and explain the access failure.
- [ ] Centralize verified access and implement secure seven-day trials.
- [ ] Unify protected pages, feature access, signup and trial notices.
- [ ] Test access rules and verify available live flows; document unavailable authenticated checks.

# Security review
- [ ] Restrict privileged functions without breaking signup, trials, or administrator access.
- [ ] Remove public avatar listing while preserving profile photos.
- [ ] Upgrade vulnerable dependencies and run regression tests.
- [ ] Recheck database security and public denial paths.
- [ ] Resolve hosted OTP, leaked-password protection, and Postgres patch settings (requires Supabase dashboard controls unavailable here).
- [ ] Review deep-scan results when the background scan completes.