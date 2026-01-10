## Plan: Company Workspace MVP Blueprint

Deliver phased guidance covering architecture, Supabase schema/RLS, APIs, AI scaffolding, and UI so the Company Workspace can move from data foundations to radar-driven role publishing while enforcing strict public/private separation and Matching Option A.

### Key Diffs vs Previous Plan
- Supabase CLI migrations only; seed `skill_axes` table and reference axis keys in AI contract.
- `role_questions` now carry `visibility` (`public`/`private`) plus `section` for wizard grouping; `role_answers` normalized (int/text/json).
- Added student-safe projections via `roles_public_view` and `role_public_answers_view` to expose only published public data.
- Radar schema updated for Option A: `radar_snapshots`, `radar_scores` (target score, weight, min threshold, confidence), `radar_evidence` with immutable history; confirm/publish gating.
- RLS tightened: students limited to views, companies own CRUD, service role only via server routes.
- API surface extended for create role, save answers, radar generate/chat/confirm, publish, plus student read APIs.
- AI JSON schema locked to `skill_axes.axis_key`, includes evidence-aware reasoning and anti-hallucination instructions.
- Matching formula defined (weights + penalties for min thresholds) with per-axis explanations.

### Phase Plan
1. **Phase 0 – Foundations**: Document system architecture, finalize Supabase CLI workflow, env handling, and versioned migration strategy.
2. **Phase 1 – Data Layer**: Ship migrations for companies/members, roles, role_questions, role_answers, `skill_axes` (seeded), radar tables, ai_threads/messages, student-safe views.
3. **Phase 2 – Security & RLS**: Apply RLS policies for company ownership, restrict students to views, ensure service-role bypass via server functions only.
4. **Phase 3 – API Layer**: Implement Next.js API routes/Edge Functions for role lifecycle + radar generation/chat/confirm/publish + public read endpoints, wiring Supabase admin client + AI provider.
5. **Phase 4 – UI & Workflows**: Build Company dashboard metrics, Active Roles list, six-step wizard, radar editor w/ chat + manual sliders, role detail page; integrate Chart.js/Recharts component for overlays.
6. **Phase 5 – Matching Analytics**: Implement Option A matching service, store match explanations, expose match % in company pipeline; prep student radar flow for future sprint.

### Data Model & Migration Summary (Supabase CLI SQL)
- `skill_axes`: seeded enum-like table storing axis_key/display/description (analytical, communication, leadership, execution, creativity, technical, commercial, ownership, domain) for AI contract.
- `companies`, `company_members`: map Supabase profiles to organizations; enforce unique company per profile (owner) and membership roles.
- `roles`: includes company_id, public fields (title/division/location/dates/description/responsibilities/requirements/comp ranges) plus status enum (`draft`,`radar_draft`,`confirmed`,`published`,`archived`).
- `role_questions`: `visibility` enum (`public`,`private`) + `section` (`public_basics`,`public_q`,`private_q`) for wizard grouping and enforcement.
- `role_answers`: normalized table with `answer_value_int`, `answer_text`, `answer_json`, unique(role_id, question_id).
- `radar_snapshots`: subject_type (`role`/`student`), subject_id, optional `role_id`, `source` (`ai_initial`,`ai_chat`,`manual_edit`), `status` (`draft`,`confirmed`), immutable history.
- `radar_scores`: one row per snapshot/axis with `score_0_100` (target for roles or student score), `weight_0_1`, `min_required_0_100`, `confidence_0_1`, `reason`; weights/mins null for student snapshots.
- `radar_evidence`: textual justification referencing questionnaire/doc/chat evidence per axis.
- `ai_threads` + `ai_messages`: capture chat instructions and AI responses, linking messages to generated snapshots.
- `roles_public_view`, `role_public_answers_view`: expose only published roles + public answers for student queries; future `student_radar_view` can mirror pattern.

### RLS Highlights
- Enable RLS on all base tables.
- Policy: company members (via `company_members.profile_id = auth.uid()`) can select/insert/update/delete their own `roles`, `role_answers`, `radar_snapshots`, `radar_scores`, `ai_threads/messages`.
- Policy: students/authenticated users granted `select` ONLY on `roles_public_view` and `role_public_answers_view`; remove direct `select` from base tables for non-service roles.
- `skill_axes` readable by all authenticated (no writes) for UI reference.
- Service role (used in server routes/edge functions) bypasses RLS; ensure never exposed client-side.

### API / Server Functions (Next.js App Router)
- `POST /api/roles`: validate auth user is company member, create draft role.
- `POST /api/roles/:id/answers`: upsert answers per question, enforce question visibility server-side.
- `POST /api/roles/:id/radar/generate`: fetch role data + answers, call AI with structured prompt, insert new `radar_snapshot` (`ai_initial`,`draft`) + scores/evidence.
- `POST /api/roles/:id/radar/chat`: append user message to `ai_threads`, call AI to adjust, create NEW snapshot (`ai_chat`,`draft`)—never mutate previous snapshot.
- `POST /api/roles/:id/radar/confirm`: ensure latest draft snapshot exists, set status `confirmed` (and optionally mark others `draft`).
- `POST /api/roles/:id/publish`: require confirmed snapshot; set role status `published`, `posted_at` timestamp.
- `GET /api/public/roles` + `GET /api/public/roles/:id`: read from `roles_public_view` + `role_public_answers_view` only for student consumption.
- All endpoints run server-side using Supabase admin client; csrf/auth handled via Supabase session passed from client.

### AI Prompt Contract
- System prompt: emphasize use of `skill_axes.axis_key` list only, reference questionnaire/private answers responsibly, avoid hallucination.
- Input payload: role basics, public answers, private answers, current snapshot (for chat adjustments), change request summary.
- Output schema:
```
{
	"radar": [
		{
			"axis_key": "analytical", // must exist in skill_axes
			"score_0_100": 85,
			"weight_0_1": 0.9,
			"min_required_0_100": 70,
			"confidence_0_1": 0.82,
			"reason": "Referencing answer: ..."
		}
	],
	"notes": "optional"
}
```
- Anti-hallucination clauses: cite questionnaire text; if evidence weak, lower confidence and avoid inflating scores; never invent unseen data.
- Server validates JSON schema + axis keys before persisting snapshot.

### Radar Versioning Rules
- AI generation, AI chat, and manual sliders each insert a new `radar_snapshot` (`draft`) + scores/evidence; previous snapshots immutable.
- Confirm action marks exactly one snapshot `confirmed`; publish allowed only when confirmed snapshot exists for role.
- `radar_snapshots` track `created_by` (company member) for auditing; AI snapshots store service profile or null.

### Matching Option A Formula
- For confirmed role snapshot axes: `target_score`, `weight`, `min_required`.
- For student snapshot axes: `student_score` stored in `radar_scores` rows where `subject_type='student'`.
- Normalize weights: `w_i = weight_i / Σ weight` (skip axes missing student score → treat as `student_score=0`).
- Axis match:
	- if `student_score < min_required` (and min defined) → axis_match = 0.
	- else `axis_match = 1 - |student_score - target_score| / 100`, clamped [0,1].
- Overall match percent: `match_percent = 100 * Σ (w_i * axis_match_i)`.
- Store per-axis explanation objects `{axis_key, target, student, weight, min_required, match_ratio, explanation}` for pipeline UI.

### UI & Component Checklist
- `app/company/page.tsx`: server component fetching metrics (draft/radar_draft/confirmed/published counts) + Active Roles list (title/division/status/created_at/posted_at + actions).
- Role wizard components (`RoleBasicsStep`, `PublicQuestionsStep`, `PrivateQuestionsStep`, `RadarDraftStep`, `RadarChatStep`, `ConfirmPublishStep`) saving via server actions or API routes.
- `RadarEditor`: Chart.js/Recharts overlay showing role target vs student sample; manual sliders trigger `manual_edit` snapshot creation; chat panel bound to `ai_threads`.
- Role detail page: public preview (mirrors `roles_public_view`), private answers, radar history timeline.
- Student-facing browse page (later) consumes `/api/public/roles` derived from views, ensuring no private leakage.

### Further Considerations
1. Document Supabase CLI commands (`supabase migration new`, `supabase db push`) + env var handling (`SUPABASE_SERVICE_ROLE_KEY` server-only).
2. Lock v1 axis metadata now; future axis additions go through new migrations + AI prompt updates to keep contracts stable.
