# InvoiceLens

A private invoice-review workspace with document uploads, real PDF text extraction, browser-local OCR, editable fields, page-aware source highlights, approvals, server-generated audit history and JSON export.

## What is real

- PDF text is read from the uploaded document with PDF.js. PNG/JPEG/WEBP and scanned PDF pages can be read with English Tesseract OCR in the browser.
- No fixed values are substituted for an arbitrary invoice. If labels cannot be matched, the app says so and supports manual fields and drawn boxes.
- Extraction is heuristic, not a guarantee. Verify each field. OCR confidence measures recognition quality, not invoice correctness. No full line-item accounting or financial reconciliation is claimed.
- Saved reviews, original files and audit events live in an authenticated backend. Unsaved edits are marked and navigation warns before discarding them.
- The bundled sample PDF and test images are fictional, created for this project. No real customer or company records are included.

## Cloud deployment

The production adapter uses Supabase Auth, Postgres and a **private** Storage bucket. It does not need a separate Node compute service. PDF/OCR processing runs on the device; only authenticated file storage and reviews are sent to the configured backend. Tesseract engine assets are self-hosted; English language data is fetched from its public distribution on first use.

1. Have the backend owner review and apply `supabase/invoicelens.sql` in the intended project. It creates only `il_` objects and the private `invoicelens` bucket. Do not apply blindly to an existing project or grant public write access. Managed-storage quota-trigger compatibility must be verified on the target Supabase instance.
2. The checked `src/backend-config.json` contains the intentionally public browser configuration for the approved shared project. Override with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` when deploying elsewhere. These are public browser configuration, not service-role or database credentials. **Never put privileged keys in frontend code.**
3. Configure the exact production URL and auth redirect allowlist in Supabase Auth. Keep email confirmation enabled. Custom SMTP is not configured in the current deployment. Supabase default auth email is limited to project-team addresses and 2 messages per hour, so public sign-up confirmation and password-reset delivery are not ready. Existing provisioned account login was tested; that does not prove public onboarding. Configure and verify a suitable mail provider before opening registration. See https://supabase.com/docs/guides/auth/auth-smtp .
4. Run build, tests, cloud owner-isolation tests and real desktop/mobile checks before publishing.
5. Verify anon access is rejected and two accounts cannot access each other's records or stored files. RPC revisions prevent silent overwrites across tabs.

Supabase Free may pause after a week of inactivity. Free-tier quotas, email limits, lack of managed backups and changed vendor terms affect availability. This is not an always-on SLA. Export reviewed JSON regularly and keep the original invoices separately. JSON export is a review backup, not automatic restore or a backup of uploaded file bytes.

### Limits

10 MB per file, 100 PDF pages, 50 documents per account, 200 review fields per document and up to 5,000 retained audit events. Candidate cloud migration caps InvoiceLens storage at 100 MB/account and 400 MB total to preserve shared capacity. These limits must be verified after migration; free shared quotas remain the outer limit. OCR supports English only; layout matching is best-effort. Password-protected, malformed, very large or unusual PDFs may need preprocessing. No paid API is required.

## Local full-stack mode

Node 22.13+ includes the SQLite API used here (still marked experimental by Node 22).

```sh
npm ci
npm run build
# Create an account: pipe a password securely from your own secret manager.
node server/create-user.mjs USERNAME < /secure/path/to/password-file
npm start
# Open http://127.0.0.1:3001
```

Local mode defaults to closed registration. For **local testing only**, `ALLOW_REGISTRATION=1 npm start` enables registration. Do not put open test mode on the public internet. Use HTTPS and `NODE_ENV=production` for public cookie security, set `APP_ORIGIN` to the exact origin, bind only the intended interface with `HOST`, and store `DATABASE_PATH` on a durable, backed-up volume. SQLite on ephemeral/serverless disks is not durable hosting. Local mode does not send password-reset email; the cloud adapter supports email recovery.

For development use two terminals: `npm run dev:api` and `npm run dev`. Vite proxies `/api` to local port 3001. Set both cloud variables to empty strings for SQLite mode (`VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= npm run build`).

```sh
npm test             # reducer, coordinate, validation, persistence and extraction tests
npm run test:api     # auth, access isolation, conflict, validation, audit and restart persistence
npm run build
npm run lint
npx playwright install chromium
npm run test:e2e     # desktop/mobile real PDF + OCR browser workflows
```

### Architecture

- `src/Workspace.tsx`: authenticated document/review workflow
- `src/lib/extraction.ts`: document-derived field candidates and OCR
- `src/lib/supabase.ts`: production auth/database/private-file adapter
- `src/lib/api.ts`: local/cloud adapter boundary
- `server/`: optional same-origin Express + SQLite implementation
- `supabase/invoicelens.sql`: candidate cloud schema, RLS, audit RPC and quotas
- `e2e/`: synthetic fixtures and real browser tests

Original demo components are retained where useful; the active workspace does not use mock fields. No private production data belongs in this repository.
