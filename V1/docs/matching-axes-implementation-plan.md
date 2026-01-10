# Matching Axes Implementation Plan

This file expands the radar/matching plan to map concrete changes across Supabase, API routes, and UI based on the Internities Matching Axes proposal paper.

## 1) Context & Current State
- Data model (Supabase): `skill_axes` (seeded 9 axes today, target expanded library), `radar_snapshots`, `radar_scores`, `radar_evidence`, `ai_threads`, `ai_messages`, `roles`, `role_answers` (see `supabase/migrations/20251220160716_init_company_workspace.sql`).
- Backend radar APIs:
  - Auto-generate initial radar: `app/api/roles/[id]/radar/auto/route.js` (OpenAI + heuristic fallback → inserts draft snapshot with scores, no weights yet).
  - Manual/dumb insert hook: `app/api/roles/[id]/radar/generate/route.js` (expects `radar` array, no AI call; draft snapshot).
  - Chat for rebalancing: `app/api/roles/[id]/radar/chat/route.js` (GET loads best snapshot; POST calls OpenAI with JSON schema for axes+scores; persists draft via `save`).
  - Save working radar: `app/api/roles/[id]/radar/save/route.js` (upserts draft snapshot with provided axes; enforces 6–10 axes, archived guard; currently ignores weights).
  - Confirm draft: `app/api/roles/[id]/radar/confirm/route.js` (promotes latest draft to confirmed, demotes prior confirmed to draft).
- Frontend radar chat: `app/company/roles/[id]/radar/chat/page.js` renders preview (`RadarChart`), chat, save. Entry button presumably from role detail page.
- Visualization: `components/RadarChart.js` renders axes + scores (no weights/min requirements displayed). Animation helper: `components/MatchRadarAnimation.js` (not yet wired into radar chat).
- Docs: `docs/radar-chat-plan.md` (high-level chat flow) already mostly implemented.

## 2) What the PDF defines (confirmed)
- Axis library is curated, versioned, and role-family aware (40–80 canonical axes across 6–8 families) with locale-specific variants; each axis carries id, name + synonyms, definition (what it measures and does not), scoring rubric (0–10 anchors), evidence types, assessment options, and typical roles.
- Company radar creation: AI proposes a role template; companies swap axes only within the library, set importance weights (0–5) and must-have vs nice-to-have flags, add rationales, and set evidence-based minimum requirements (e.g., GPA thresholds).
- Student radar per role: student owns scores for all library axes based on evidence (Q&A, CV parsing, uploads); when applying, the student radar is projected to the exact axis subset the company chose; high-weight missing axes trigger prompts for evidence; must-have unknown → not eligible.
- Scoring model: per axis store score 0–10, confidence 0–1, and reasoning referencing evidence; effective axis score `eff_i = s_i * c_i`; axis match compares student eff_i to company requirement (clamped) to derive an axis match % and overall match; missing data is explicit (unknown ≠ low, must-have unknown blocks eligibility, nice-to-have unknown down-weights).
- Evidence-first: support academic, portfolio, work, competitions, assessments, social proof; verification states (unverified, auto-verified, institution-verified, company-verified); anti-gaming via confidence weighting and change rate limiting.
- Matching pipeline: Stage 0 hard filters (visa, date, location, language), Stage 1 must-have gates, Stage 2 weighted axis score (Score × Confidence with weights), Stage 3 narrative alignment (axis rationale vs student reasoning), Stage 4 explainability (top reasons/gaps and how to improve).
- Governance: axis owners, monthly review of incoming axis requests, versioning and deprecation rules, bias/anti-gaming checks.

## 3) Gaps vs current implementation
- Axis library lacks metadata (synonyms, rubric, evidence types, versioning, locale, role-family hints); no governance/versioning machinery.
- Weights/min-required are unused in APIs/UI; no must-have vs nice-to-have flags or rationale capture.
- No student radar generation pipeline or projection of student scores to company axis subsets; no evidence objects with verification states.
- No match pipeline (hard filters, must-have gates, Score × Confidence), no per-axis/overall match storage, no narrative alignment.
- AI prompts are generic; not aligned to rubric/axis-library constraints; no bias/anti-gaming checks.
- UI covers radar editing chat only; no evidence upload/verification UX, no match run triggers, no match list/detail views.

## 4) Plan by Phase

### Phase 1 — Ground truth from PDF (now ingested)
1. Lock the rubric: score scale 0–10, confidence 0–1, eff_i = s_i * c_i; axis match clamps student eff to company requirement; overall match = weighted sum across role axes.
2. Freeze library rules: axes must come from curated, versioned library; allow locale variants; company edits only within that set; weights 0–5 and must-have flags apply.
3. Define evidence and verification states per axis; agree on minimum evidence prompts for high-weight axes and hard stops for must-have unknowns.
4. Finalize governance cadence (owner, review, deprecation) and bias/anti-gaming checks.
5. Define questionnaire structure: three sections for companies when creating a role — (a) Role Description (where/what/when/context), (b) Hard Criteria (eligibility gates like GPA minimum, visa/work auth, year of studies, language/location constraints), (c) Skills & Requirements (questions that feed the skill radar). For every question, surface a short example answer to guide users (content derived from the CSV guidance). These must be persisted distinctly for matching stages (hard filters vs radar scoring).

### Phase 2 — Data model updates (Supabase migrations)
Add migrations to encode the PDF rules and the three-part questionnaire while reusing `radar_*` where possible:
- Extend `skill_axes` (or add `skill_axis_versions`) with: axis_type (hard/soft/style/motivation/constraint), role_families[], locale, synonyms[], rubric_json (0–10 anchors), evidence_types[], assessment_options, version, status, owner, deprecated_at, typical_roles, definition, not_definition. Consider a `skill_axis_localizations` table for locale-specific names/definitions.
- Add `axis_library_requests` for company-suggested axes with review state and reviewer fields (supports governance cadence).
- Add `role_axis_configs` (role_id FK, axis_id FK, weight_0_5, must_have bool, rationale text, min_required_0_100, version tag, created_by) so role radar requirements are explicit and versioned; keep linkage to `radar_snapshots` for historical scores.
- Add `student_skill_evidence` (candidate_id, axis_id, evidence_type, url/path, verification_state, verifier, confidence_hint, created_at) and extend `radar_evidence` to reference verification state; keep `ai_messages` for logging reasoning.
- For student radars, reuse `radar_snapshots`/`radar_scores` with `subject_type = 'student'`; add view `student_axis_scores_view` that joins latest verified evidence and computed score/confidence per axis.
- Add `match_runs` (id, role_id, candidate_id, source, status, model_used, created_by, created_at, overall_match_0_100, confidence_0_1, stage_summaries jsonb) and `match_results` (match_run_id FK, axis_id FK, role_score_req_0_10, student_score_0_10, student_confidence_0_1, eff_student, weight_0_1, must_have, axis_match_0_100, gap, rationale text, evidence jsonb). Index `(role_id, candidate_id)` and `(match_run_id)`.
- RLS: mirror company membership for role data; candidates see only their own evidence/match results (if student-facing); reviewers/verifiers gated by role.
- Add questionnaire tables/fields to separate the three sections: (a) `role_questionnaire_sections` or extend `role_questions` with `section` enums (`role_description`, `hard_criteria`, `skills_requirements`), (b) store responses in `role_answers` with section linkage, and (c) add `role_hard_criteria` table for normalized gates (gpa_min, visa_required, work_auth, year_of_study_min/max, location, language). Ensure these feed Stage 0/1 filters and remain distinct from radar axes.
 - Add questionnaire tables/fields to separate the three sections: (a) `role_questionnaire_sections` for section intros, (b) `role_questions` keyed to sections (`role_description`, `hard_criteria`, `skills_requirements`), (c) `role_answers` storing responses with section linkage, and (d) `role_hard_criteria` for normalized gates (gpa_min, visa_required, work_auth, year_of_study_min/max, location, language). Ensure these feed Stage 0/1 filters and remain distinct from radar axes. Seed questions from CSVs in `docs/questionnaire-stage-0.csv`, `docs/questionnaire-stage-1.csv`, `docs/questionnaire-stage-2.csv`.

### Phase 3 — Backend services
1. **Axis library + governance**
   - Add endpoints for listing axes (with locale/filter by role family), fetching rubric/evidence types, and submitting `axis_library_requests` for review; admin/reviewer endpoints to approve/version.
2. **Radar generation aligned to PDF**
   - Update `radar/auto` and `radar/generate` to populate weight_0_5, must_have, min_required_0_100, rationale; enforce axis count from templates; normalize weights to sum=1 for scoring while storing raw 0–5.
   - Update chat prompt/schema in `radar/chat` to include axis metadata and to request evidence-aware rationales; sanitize and persist weights/min-required/confidence.
3. **Questionnaire handling**
   - Add API to fetch and submit the three-section questionnaire for role creation: Role Description (context), Hard Criteria (eligibility gates), Skills & Requirements (radar-driving questions). Persist hard criteria into dedicated fields/tables and ensure they drive Stage 0/1 filters.
   - Validate hard criteria server-side (e.g., GPA numeric, visa/work auth enums, year-of-study range) and keep them separate from radar axes.
4. **Student radar creation**
   - Add pipeline to compute student axis scores from Q&A, CV parsing, and evidence uploads; store in `radar_snapshots` (`student` subject) + `radar_scores` with score_0_100 mapped to 0–10 scale and confidence_0_1.
   - Add evidence ingestion endpoints with verification state transitions (unverified → auto/institution/company verified) and hooks to update confidence.
5. **Match computation endpoints**
   - Add `app/api/roles/[id]/matches/run` (or `/api/match/roles/[id]`) to execute the multi-stage pipeline: Stage 0 filters, Stage 1 must-have gates (reject if unknown/fail), Stage 2 weighted axis match using eff_i = s_i * c_i and clamping to company requirement, Stage 3 narrative alignment (LLM), Stage 4 explanation generation. Persist `match_runs` + `match_results` and explanation summary.
   - Add list endpoint `/api/roles/[id]/matches` and detail endpoint `/api/roles/[id]/matches/[runId]` with per-axis breakdown, evidence references, and flags for unknown axes.
6. **Validation & anti-gaming**
   - Enforce axis validity, weight normalization, must-have semantics, and missing-data handling (unknown ≠ 0; must-have unknown → not eligible; nice-to-have unknown → down-weight).
   - Log AI responses and decisions in `ai_messages`; add rate limiting on self-reported evidence changes unless new proof is added.

### Phase 4 — Frontend changes
1. **Axis library UX**
   - Add axis picker with search/filter by role family and locale; show rubric, evidence types, and version badges; allow axis request submission.
2. **Role questionnaire & radar editing**
   - Build/create role flow with three sections: Role Description, Hard Criteria (eligibility gates UI for GPA, visa/work auth, year of studies, location/language), and Skills & Requirements (radar-driving questions + axis picker). Persist sections separately; surface validations for hard criteria.
   - Display example answers inline for each question (pulled from the CSV guidance) to set expectations for format and depth.
   - Extend `app/company/roles/[id]/radar/chat/page.js` to display weights (0–5), must-have flags, min-required, and rationales; show normalization warnings and missing-data prompts for high-weight axes.
   - Update `RadarChart` to optionally visualize weights (stroke opacity/size) and min-required markers; add toggle to show confidence overlays.
   - Allow clicking an axis name to open a small definition popover/modal showing the axis definition and not-definition (from the axis library metadata) to improve clarity.
3. **Student evidence & radar**
   - Add student-side flows (or internal tooling) for evidence upload with verification state, quick Q&A, and micro-assessment placeholders; show confidence and verification badges per axis.
4. **Matching UI**
   - Pages: `/company/roles/[id]/matches` list with overall score, last run, status/gates; `/company/roles/[id]/matches/[runId]` detail with overlay radar (role vs student), axis gap table, rationale/evidence links, and “request more evidence”/“message candidate” CTAs.
   - Buttons on role page to run/refresh match and view latest matches; show blocked state when must-have unknown.
5. **Feedback & error states**
   - Explicit banners for hard stops (must-have unknown), soft penalties (nice-to-have unknown), AI fallback reasons, and verification pending states; toasts for save/match runs.

### Phase 5 — Testing, observability, and rollout
- Unit tests: sanitize/validation helpers in `radar/chat` and `radar/save`; weight normalization; match formula pure functions.
- Integration tests: API routes for authz/validation; match endpoint happy/failure paths.
- UI tests: radar chat save flow, match list rendering, error banners.
- Telemetry: log OpenAI errors, match run durations, number of axes, weight sum, fallback usage; store in `ai_messages` or separate table.
- Migration rollout: apply Supabase migration in staging first; backfill existing confirmed snapshots into `role_matching_configs` default rows; re-run `radar/auto` where needed to populate weights.

## 5) File/Component Touchpoints
- Supabase: new migrations under `supabase/migrations/` for axis metadata/versioning, axis requests, role axis configs, evidence verification, match_runs/results views; extend `skill_axes` columns.
- Backend: update `app/api/roles/[id]/radar/{auto,generate,chat,save,confirm}/route.js` for weights/must-have/min/confidence; add axis library endpoints; add match run/list/detail endpoints; evidence upload/verification endpoints; add helpers for weight normalization and scoring (Score × Confidence clamp logic).
- Frontend: `app/company/roles/[id]/radar/chat/page.js` (weights/must-have UI), `components/RadarChart.js` (weights/min/confidence), `components/MatchRadarAnimation.js` (overlay role vs student), role detail pages (axis picker, match CTAs), new match pages, student evidence upload UI.
- Lib: extend `lib/fetchWithAuth.js`/`lib/apiAuth.js` for new endpoints; add pure scoring/validation helpers shared by API and UI.

## 6) Open Points to Clarify (minor)
- Document how weights (0–5) map to weight_0_1 for scoring and storage.
- Decide on canonical axis count bounds per role (PDF implies ~10 axes; current system enforces 6–10).
- Confirm student-facing surface scope for MVP (evidence upload + verification vs internal tooling first).
- Define narrative alignment output format (short bullet reasons vs free text) and where to store it.

## 7) Next Actions
1. Confirm the overall match normalization and weight mapping with PM (due to PDF formatting glitch) and set the canonical axis count bounds.
2. Draft migrations for axis metadata/versioning, axis requests, role axis configs, evidence verification, and match runs/results; review with data/ML owner.
3. Update radar APIs and prompts to include weights/must-have/min/confidence and axis metadata; add match run/list/detail endpoints.
4. Ship frontend updates for axis picker, weights/must-have UI, evidence upload, and match views; wire CTAs from role pages.
5. Add scoring/validation helpers and basic tests for weight normalization, must-have gating, and Score × Confidence calculations.
