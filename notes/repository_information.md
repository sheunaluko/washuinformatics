# Repository Information

## Overview
WashU GIM Informatics — clinical tools and applications from the Division of General Internal Medicine at Washington University in St. Louis.

## Tech Stack
- **Framework:** Next.js 16 (App Router, TypeScript)
- **Styling:** Tailwind CSS 4 with WashU brand color tokens
- **Deployment:** Azure Static Web Apps (hybrid Next.js rendering)
- **CI/CD:** GitHub Actions (`.github/workflows/azure-swa.yml`)

## Agent / AI Coding Notes
- This project uses Next.js 16 which may have breaking changes from earlier versions. Consult `node_modules/next/dist/docs/` for current API reference before writing code.
- The `@/*` path alias maps to `./src/*` (configured in `tsconfig.json`).

## Environment Variables
- `HIPAA_GPT5_URL` — HIPAA-compliant LLM endpoint URL
- `HIPAA_GPT5_KEY` — API key for the HIPAA endpoint
- Set locally in `.env.local`, in Azure SWA via Application Settings

## Key Conventions
- All LLM calls route through `src/lib/client_llm_gateway.ts` which translates Chat Completions format to Responses API format via `src/lib/adapter.ts`
- The API route at `/api/secureLlm` is a generic proxy — no translation logic, just forwards to the HIPAA endpoint
- User-configurable settings persist in localStorage
- Shared components live in `src/components/`, shared utilities in `src/lib/`
