

## Bug Fixes for New Booking Form

### Problems Identified

1. **Cannot type spaces in text fields**: The `sanitizeString()` function in `src/lib/validation.ts` calls `.trim()` on every keystroke. When typing "João " (with a trailing space before the next word), `trim()` immediately removes it, making it impossible to type multi-word names, cities, etc.

2. **Booking date field is awkward**: The "Data da Reserva" input has both `min={currentDate}` and `max={currentDate}`, forcing exactly today's date but requiring the user to manually pick it. Since it should always be today, we should auto-set it and either hide the field or make it read-only.

3. **No inline validation errors**: Validation errors only appear as toast notifications on submit. The user wants inline warnings on the form with a "Salvar assim mesmo" button — friendly, non-blocking warnings.

---

### Plan

#### 1. Fix `sanitizeString` — allow spaces while typing
**File**: `src/lib/validation.ts`
- Change `sanitizeString` to only strip `<>` characters, without calling `.trim()`. Trimming should only happen at submission time, not on every keystroke.

#### 2. Simplify "Data da Reserva" field  
**File**: `src/components/forms/BookingDatesFormWithValidation.tsx`
- Remove the `min` and `max` constraints from the booking date input.
- Make the field read-only and display today's date formatted nicely, so the user doesn't need to interact with it at all.

**File**: `src/hooks/useBookingForm.ts`
- Keep the default value as today's date (already done).

#### 3. Add inline validation warnings with "Salvar assim mesmo"
**File**: `src/pages/NewBooking.tsx`
- Add a state for `warnings` (non-blocking issues) and `errors` (blocking issues).
- On submit, run validation and categorize issues:
  - **Blocking errors** (shown inline in red): missing guest name, missing check-in/check-out, check-out before check-in.
  - **Soft warnings** (shown inline in amber with "Salvar assim mesmo" button): missing phone, missing payment method, missing total value, date conflicts.
- Show a summary alert at the bottom of the form with the warnings list and a "Salvar assim mesmo" button that bypasses soft validations.
- If user clicks "Salvar assim mesmo", submit with current data ignoring warnings.

**Files touched**: 
- `src/lib/validation.ts` (1 line change)
- `src/components/forms/BookingDatesFormWithValidation.tsx` (simplify date field)
- `src/pages/NewBooking.tsx` (add inline warnings + "Salvar assim mesmo" flow)

