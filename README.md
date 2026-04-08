# ClaimSense AI

AI-powered medical claim pre-submission validation engine built with Next.js 14.

## Overview

ClaimSense AI analyzes medical claims before submission to catch billing errors, reduce insurance denials, and maximize reimbursement. It uses OpenAI's GPT-4o-mini to detect ICD-CPT compatibility issues, missing modifiers, prior authorization requirements, place-of-service mismatches, and more — then suggests actionable fixes with one-click apply.

## Features

- **Single Claim Validator** — Enter claim fields manually, load a sample, and receive a full AI risk analysis with severity-graded errors and fix suggestions
- **Batch Upload** — Upload a CSV of claims; each is analyzed sequentially with a live progress bar and results table
- **Dashboard** — Session-level stats: claims analyzed, total errors, fix suggestions, fixes applied, risk distribution, and full claim history
- **Apply Fix** — One-click patch operations update the claim form; re-evaluate immediately to confirm improvement
- **Rate limiting** — 10 requests per minute per IP to prevent abuse

## Tech Stack

- [Next.js 14](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [OpenAI SDK](https://github.com/openai/openai-node) (`gpt-4o-mini`)
- [Zod](https://zod.dev/) for runtime schema validation
- [PapaParse](https://www.papaparse.com/) for CSV parsing

## Getting Started

### 1. Clone & install

```bash
git clone https://github.com/FaizAnwerKachhi/ClaimSense_AI-.git
cd ClaimSense_AI-
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Edit .env.local and set your OpenAI API key:
# OPENAI_API_KEY=sk-...
```

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Build for production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── claims/
│   │       └── analyze/
│   │           └── route.ts      # POST /api/claims/analyze
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                  # Main app page
├── components/
│   ├── Nav.tsx                   # Top navigation bar
│   ├── ClaimForm.tsx             # Claim entry form
│   ├── ResultsPanel.tsx          # Analysis results & fix cards
│   ├── BatchUpload.tsx           # CSV batch upload
│   └── Dashboard.tsx             # Session dashboard
└── lib/
    ├── schemas.ts                # Zod schemas & TypeScript types
    └── openai.ts                 # OpenAI client singleton
```

## API

### `POST /api/claims/analyze`

**Request body:**
```json
{
  "cpt": "99213",
  "icd": "J06.9",
  "icd2": "",
  "modifier": "",
  "units": "1",
  "billed_amount": "150.00",
  "pos": "11",
  "dos": "2024-01-15",
  "payer": "bcbs",
  "npi": "1234567890",
  "patient_id": "PT-001",
  "member_id": "MBR-123456",
  "dob": "1975-06-15",
  "prior_auth": "",
  "clinical_notes": "..."
}
```

**Response:**
```json
{
  "claim_id": "CS-4821",
  "risk_level": "Medium",
  "risk_score": 45,
  "risk_summary": "...",
  "errors": [...],
  "overall_assessment": "...",
  "avg_confidence": 78
}
```

## CSV Batch Format

Required columns: `cpt`, `icd`

Optional columns: `icd2`, `modifier`, `patient_id`, `member_id`, `dos`, `payer`, `billed_amount`, `prior_auth`, `clinical_notes`, `npi`, `pos`, `dob`, `units`

```csv
cpt,icd,icd2,modifier,patient_id,member_id,dos,payer,billed_amount,pos,npi
99213,J06.9,,25,PT-001,MBR-123,2024-01-15,bcbs,150.00,11,1234567890
99214,M54.5,,,,,,medicare,200.00,11,
```

## Environment Variables

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | Your OpenAI API key (required) |
| `DATABASE_URL` | Postgres connection string (optional, for future persistence) |

## Deployment (Vercel + optional Supabase/Neon)

### Deploy to Vercel

1. Push this repo to GitHub.
2. Import the repo in [Vercel](https://vercel.com/new).
3. Add environment variable in Vercel dashboard: `OPENAI_API_KEY=sk-...`
4. Click **Deploy** — Vercel auto-detects Next.js.

### Optional Postgres (Supabase or Neon)

If you want to persist analysis results in future:

1. Create a free database at [Supabase](https://supabase.com) or [Neon](https://neon.tech).
2. Copy the connection string to `DATABASE_URL` in your `.env.local` and in Vercel's environment variables.
3. (Prisma setup can be added in a future iteration — the current MVP uses in-memory state.)

## License

MIT
