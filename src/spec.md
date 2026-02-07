# Specification

## Summary
**Goal:** Add a frontend-only Local Storage Mode that runs the queue and feedback features end-to-end using browser localStorage, including token generation, live updates, and staff call/complete actions.

**Planned changes:**
- Add a clearly labeled Local Storage Mode toggle/config option that switches queue + feedback operations from canister calls to localStorage-backed logic.
- Define and implement a versioned, namespaced (e.g., `sqfm:`) localStorage schema; load local data on app start and reflect it in the UI without page refresh.
- Implement per-service, human-friendly token number generation for queue entries in Local Storage Mode, persisting token counters across reloads.
- Implement live queue display behavior in Local Storage Mode for both user and staff/admin views (auto-updating when entries change).
- Add/enable staff/admin controls in Local Storage Mode for “Next customer call” and “Service completion,” supporting statuses: waiting, served/completed, cancelled, no-show.
- Persist feedback submissions (rating 1–5 + optional comment + timestamp + service id) in localStorage in Local Storage Mode and list them in the existing staff/admin feedback review UI (newest-first or otherwise clearly ordered).
- Add developer documentation describing Local Storage Mode, localStorage keys/payloads, token generation, status meanings, and how to reset local data for testing (via UI and/or browser devtools).

**User-visible outcome:** Users and staff can run queueing and feedback entirely in the browser (even if the backend is unavailable) by enabling Local Storage Mode, with token numbers, live queue updates, staff call/complete flow, and reviewable feedback.
