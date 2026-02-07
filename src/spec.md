# Specification

## Summary
**Goal:** Deliver an MVP smart queue and feedback management system with a user-facing app, an admin/staff management area, and stable, deterministic backend queue/feedback persistence.

**Planned changes:**
- Backend: data models + APIs to create/list services; join/leave a service queue; fetch a user’s queue status (position + state); fetch a service queue snapshot with deterministic FIFO ordering persisted in stable storage.
- Backend: admin/staff queue controls to advance/serve next, mark no-show/cancel, and clear a service queue with admin-only authorization (allowlisted principals).
- Backend: feedback APIs to submit service feedback (rating + optional comment + timestamp) and list feedback per service (newest first) with stable persistence.
- Frontend: user flow to select a service, join queue, view live-refreshed queue status via polling + manual refresh, and leave queue.
- Frontend: feedback flow to select a service, submit rating + optional comment, show actionable English errors, and show a confirmation state on success.
- Frontend: admin/staff area to select service, view ordered queue entries, perform queue actions, and review feedback; hide/disable admin features for unauthorized users with a clear English message.
- Frontend: cohesive creative visual theme (no blue/purple as primary brand colors) across Queue, Feedback, and Admin views.
- Frontend: add required generated static images under `frontend/public/assets/generated` and render logo in header and hero on landing/home.

**User-visible outcome:** Users can join a service queue, see their current position/status with periodic refresh, leave the queue, and submit feedback; authorized staff can manage queues (advance/no-show/cancel/clear) and review feedback per service in an admin area.
