# AI Chat Skill Radar Plan

## Goal
Enable a “Master the skill radar” flow on any role (any status) where users can chat with an AI (model 5.2) to adjust radar axes and weightings, preview the updated radar, and save changes.

## Entry Point
- Placement: Role detail page (`/company/roles/[id]`) shows a button “Master the skill radar.” Available regardless of role status (draft/confirmed/published/archived) but saving may be limited to non-archived.
- Click opens a dedicated page (e.g., `/company/roles/[id]/radar/chat`).

## Page Layout
- Two-column layout:
  - Left: current radar visualization (existing `RadarChart` or new minimal view) reflecting the in-progress version from the chat session.
  - Right: chat panel anchored to model 5.2 with an intro blurb explaining capabilities (suggest weights, axes, rebalance for a role profile; ask for rationale; keep axes concise).
- CTA row below chat: “Save the new skill radar” (writes changes) and “Discard” (back to role page).

## Data Model & State
- Radar data per role: already stored in `radar_snapshots` and `radar_scores` tables. We will:
  - Load latest snapshot for the role (prefer confirmed > draft > newest) as starting point.
  - Maintain an in-session working copy (axes + weights) updated from chat responses.
  - On save, persist as a new draft snapshot (or update draft) and corresponding scores/weights.
- Save rules:
  - If role is archived, disable save (view-only chat) or require un-archive first.
  - For published/confirmed roles, saving creates/updates a draft snapshot; publish flow can later confirm/promote.

## API/Backend
- New route: `POST /api/roles/[id]/radar/chat` to send chat messages to model 5.2 with current radar context (axes, weights, role metadata). Returns assistant message and a structured radar update proposal (axes, weights, rationale).
- New route: `POST /api/roles/[id]/radar/save` to persist the working radar (create/update draft snapshot + scores). Ensures membership and non-archived status.
- Authz: reuse `assertCompanyMemberForRole` and profile gating; respect bucket/DB as today.
- Model prompt includes:
  - Role title/notes
  - Current axes + weights
  - Constraints: keep 6–10 axes, weights sum to 1.0, concise names, rationale per change.

## Frontend Flow
- On load: fetch current radar snapshot + scores; set working state.
- Chat panel:
  - System intro text and initial assistant message describing what the user can ask.
  - User sends messages; we POST to chat API; assistant replies with text + structured payload (axes/weights).
  - When structured payload present, update left radar preview with proposed state; keep a “current working” version.
- Save button: calls save API with the working radar state; on success, show toast and navigate back to role page (or stay with confirmation).
- Discard: navigate back without saving.

## UX Copy (suggested)
- Button: “Master the skill radar”
- Intro: “Tell the AI what kind of candidate you need, and it will rebalance the radar. Ask for fewer axes, different weights, or rewrite axis labels. When ready, save the updated radar.”
- Save CTA: “Save the new skill radar”
- Secondary: “Discard and go back”

## Validation & Constraints
- Axis count 6–10; enforce unique keys; weights normalized to 1.0; scores remain 0–100 if present.
- For archived roles: disable save; show notice.
- For published/confirmed roles: save to draft snapshot, do not overwrite confirmed/published until a later confirm/publish step.

## Tracking & Errors
- Show inline errors for chat API or save API failures.
- Loading spinners for chat requests and save action.

## Next Steps (implementation order)
1) Add backend chat route (model 5.2) and save route for radar draft updates.
2) Add frontend page `/company/roles/[id]/radar/chat` with preview + chat + save.
3) Wire “Master the skill radar” button into role detail page.
4) Enforce constraints (weights, axis count) client-side before save.
5) Add toasts/alerts and disabled state for archived roles.
