Output

# Data Governance Dashboard

A small web app that ingests raw datasets (CSV/Excel), automatically discovers their
structure, flags sensitive fields, runs data quality checks, and scores each dataset
for trust and business value — all browsable from a dashboard.

Built for the Proteccio Data Full Stack Developer assignment.

**Live app:** [add your deployed frontend URL here]
**Backend API:** [add your deployed backend URL here]

---

## Tech Stack

- **Backend:** Node.js + Express (plain JavaScript, not TypeScript — chose this for
  speed given the assignment timeline, and it kept the whole team on one comfortable
  stack)
- **Database:** PostgreSQL (hosted on Supabase), accessed via Prisma ORM
- **Frontend:** React (Vite), React Router, Axios, plain CSS (no Tailwind — kept
  dependencies minimal to reduce setup risk under time pressure)
- **File parsing:** `csv-parse` for CSV, `xlsx` (SheetJS) for Excel
- **Testing:** Node's built-in test runner (`node --test`)

---

## Project Structure

```
proteccio-assignment/
├── backend/
│   ├── src/
│   │   ├── routes/          # datasets.js - all API endpoints
│   │   ├── services/        # parser, classifier, quality, scoring logic
│   │   ├── prisma/          # schema.prisma - db models
│   │   └── index.js         # express app entry point
│   ├── tests/                # classifier + quality unit tests
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/            # Dashboard.jsx, DatasetDetail.jsx
│   │   ├── api/               # client.js - axios wrapper for backend calls
│   │   └── App.jsx
│   └── package.json
├── sample-data/               # sample CSV/Excel files for testing
└── README.md
```

---

## Setup & Run Locally

### Prerequisites
- Node.js 18+ installed
- A PostgreSQL database (this project was built/tested against a free Supabase
  Postgres instance — any Postgres works)

### 1. Backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` with:

```
PORT=5000
DATABASE_URL="your-pooled-postgres-connection-string"
DIRECT_URL="your-direct-postgres-connection-string"
```

> Note: `DIRECT_URL` is required separately from `DATABASE_URL` because Supabase's
> pooled connection (used for normal queries) doesn't support the direct connection
> Prisma needs to run migrations. See Prisma + Supabase docs if using a different
> Postgres provider.

Run the migration to create tables:

```bash
npx prisma migrate dev
```

Start the server:

```bash
npm run dev
```

Backend runs on `http://localhost:5000`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`. Make sure the backend is running first —
the frontend calls `http://localhost:5000/api` (see `src/api/client.js`; update this
URL if your backend runs elsewhere, e.g. after deployment).

### 3. Running tests

```bash
cd backend
npm test
```

Runs unit tests for the sensitivity classifier and data quality scoring logic (the
two areas judged most important to verify, since a wrong quality/classification
calculation silently produces wrong scores everywhere downstream).

---

## Assumptions Made

- **Only the first sheet of an Excel file is read.** Multi-sheet workbooks are not
  supported — kept scope tight per the assignment brief.
- **A dataset with headers but zero data rows is treated as "empty"** and rejected
  with a clear error, since there's nothing to run quality/classification checks on.
- **Duplicate row detection is exact-match only** — two rows are duplicates only if
  every field matches exactly (via JSON stringify comparison). Fuzzy/near-duplicate
  detection was out of scope.
- **Sensitivity classification uses regex/pattern matching** (column name heuristics
  + value pattern matching for email/phone), per the assignment's explicit
  instruction to use "simple pattern matching," not ML/AI. This intentionally
  trades some recall (e.g. it won't catch an email address embedded in a free-text
  "notes" column) for speed, zero cost, and deterministic/repeatable results — all
  of which matter more for an automated ingestion pipeline than marginal accuracy
  gains from an LLM-based classifier would.
- **No authentication / multi-user support**, per the assignment's explicit scope
  note.
- **File size limit set to 50MB** on uploads — large enough for realistic sample
  datasets (tested successfully with a 1,000,000+ row / ~15MB Excel file) without
  risking memory issues on free-tier hosting.

---

## Design Decisions & Trade-offs

### Scoring formulas
The assignment doesn't specify exact formulas for Trust Score and Value Score, so
these were designed deliberately:

- **Quality Score (0-100):** starts at 100, and subtracts weighted penalties for
  missing values (40% weight), duplicate rows (30%), and invalid values (30%).
  Missing data was weighted highest since it directly blocks classification and
  analysis, more so than duplicates or type mismatches.

- **Trust Score (0-100):** `qualityScore * 0.7 + classificationCompleteness * 0.3`.
  Reasoning: a dataset can be "clean" (high quality) but still not fully understood/
  governed if its columns haven't been reviewed for sensitivity — so trust
  intentionally penalizes unclassified columns even when quality is perfect.

- **Value Score:** combines a capped view-count score (5 points/view, capped at 70,
  so one heavily-viewed dataset doesn't dominate the scale) with a recency bonus
  (higher if viewed in the last 7 days, decaying after 30 days). This favors
  datasets that are both frequently *and* recently used, matching the brief's
  intent to flag low/no-activity datasets for archival.

These weights are reasonable starting points, not empirically tuned — in a real
production setting they'd likely be adjusted based on actual usage data and
stakeholder input on what "trustworthy" and "valuable" mean for their specific data.

### Why raw files are stored on disk, not in Postgres
Uploaded files are temporarily saved to `backend/uploads/` and parsed from there,
rather than storing raw file bytes in the database. Postgres is used only for the
structured, derived results (column names, types, scores) that the dashboard
actually queries and displays — this keeps the database fast and avoids bloating it
with binary blobs it doesn't need to serve normal requests.

### Manual override for sensitivity tags
Since regex-based classification can miss or misjudge columns, users can override
any column's tag via a dropdown on the dataset detail page. Overridden tags are
flagged (`isManualOverride: true`) so it's clear which tags were auto-detected vs.
human-verified — this distinction also feeds into the Trust Score calculation.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/datasets/upload` | Upload a CSV/Excel file; runs the full pipeline (parse → classify → quality check → score → save) |
| GET | `/api/datasets` | List all datasets (for the dashboard) |
| GET | `/api/datasets/:id` | Get one dataset with full column detail; increments view count and recalculates value score |
| PATCH | `/api/datasets/:id/columns/:columnId` | Manually override a column's sensitivity tag |

---

## Known Limitations / What I'd Improve With More Time

- No pagination on the dataset list — fine for a handful of datasets, would need
  it at scale.
- Duplicate detection loads the full dataset into memory to compare rows; for very
  large files (multi-GB) this would need a streaming/DB-level approach instead.
- Sensitivity classification could be extended with more column-name synonyms and
  broader value-pattern checks (e.g. detecting names/addresses by structure, not
  just column-name hints) to improve recall without needing AI.
- No automated deployment/CI pipeline — deployed manually to free-tier hosting for
  this assignment.
- Type inference and classification have known edge cases — e.g. some ID/date columns
  can be misclassified (e.g. `Date.parse()` being overly permissive with alphanumeric
  strings, or numeric dates loosely matching the phone regex). With more time, this
  would be tightened with stricter format validation before accepting a type/tag match.

---

## Deployment Notes

Free-tier hosting is used for both frontend and backend, per the assignment's
suggestion. **Free-tier backend/database services may "sleep" after a period of
inactivity and take 20-30 seconds to respond on the first request** — this is
expected behavior, not a bug, if the live demo feels slow on first load.
