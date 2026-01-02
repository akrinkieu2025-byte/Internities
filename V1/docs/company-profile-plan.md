# Company Profile Flow Plan

## Goals
- Companies can edit name, industry (broad presets + free-text "Other"), logo, and basic metadata (website, HQ).
- Logos stay private: stored in a private bucket, served via signed URLs, shown as a small round avatar.
- Dashboard stays unblocked; provide a clear entry point to edit/complete profile.

## Current State (as of plan)
- Bootstrap: `app/api/company/bootstrap/route.js` creates a company (name inferred from email domain) + admin membership for the profile.
- Profiles admin insert: `app/api/profiles/route.js` inserts id/email/role via service key.
- Dashboard: `app/company/page.js` shows roles and metrics; no profile edit link and no profile data display yet.
- Missing: company profile fields (industry, industry_other, logo_path, website, HQ) and APIs/UI to edit them.

## Data & Storage
- Table: extend `companies` (preferred for simplicity) with: `name` (editable overwrite), `industry`, `industry_other`, `logo_path`, `website`, `hq_location`, timestamps.
- Storage bucket: `company-logos-private` (private).
- Logo constraints: PNG/JPEG only; max 2 MB; square recommended; store path only.
- Access: generate signed URLs per view; default TTL 60 minutes.

## APIs
- GET `/api/company/profile`: return company profile for authenticated member (includes signed logo URL if present).
- PUT `/api/company/profile`: update `name`, `industry`, `industry_other`, `website`, `hq_location`, `logo_path` (after upload); enforce membership via auth helper.
- POST `/api/company/logo`: client uploads via signed URL or direct upload handler; validate type (PNG/JPEG) and size ≤ 2 MB; store to `company-logos-private`; return stored path and signed URL for immediate preview.

## Frontend UX
- Page `/company/profile`: editable form with fields for name overwrite, industry select, "Other" free-text, website, HQ location, logo upload with preview; show round avatar; simple inline error/toast.
- Industry presets (broad list): B2B SaaS, Marketplace, Fintech, Health/Medtech, Edtech, Climate/CleanTech, Cybersecurity, DevTools, AI/ML, Hardware/IoT, Logistics/Supply Chain, Manufacturing/Industrial, Media/Content, Gaming, Nonprofit/Impact, GovTech/Public Sector, Consumer Apps, Travel/Hospitality, PropTech, Bio/Pharma, Energy, Retail/eCommerce, Sports/Fitness, Automotive/Mobility, Food/AgTech, Telecom, Insurance/Insurtech, LegalTech, HR Tech, Analytics/Data, AdTech/MarTech, Other (with free-text).
- Dashboard entry: add a visible link/card on `app/company/page.js` to `/company/profile` (e.g., "Complete your company profile"); do not gate other actions.
- Signed URL refresh: refetch profile (or trigger a refresh) on page load or on expiry timer to keep the avatar working.

## Defaults & Constraints
- File types: PNG/JPEG only; max size 2 MB; no additional logo variants/sizes for now.
- Bucket: `company-logos-private`; signed URL TTL 60 minutes.
- Logging: keep minimal (Supabase defaults); no extra audit logging for now.

## Open Decisions / Next Steps
- Confirm staying with `companies` table vs. creating `company_profiles` table (default: extend `companies`).
- Optional: enforce square crop client-side; optional: allow GIF/SVG (default: no).
- Build order: (1) migration for new columns + bucket creation, (2) API routes GET/PUT/POST upload, (3) frontend page + dashboard link, (4) wire avatar into navbar/profile card if desired.
