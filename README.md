# WashU GIM Informatics

Clinical tools and applications from the Division of General Internal Medicine at Washington University in St. Louis.

## Applications

### VigilMD
AI-powered clinical decision support for internal medicine. Analyzes patient H&P notes to surface overlooked insights — medication interactions, lab recommendations, imaging suggestions, and diagnosis review. Generates structured handoffs for cross-covering physicians.

### Note Converter
Converts progress notes into discharge summaries using AI. Applies 22 clinical transformation principles (tense conversion, narrative restructuring, placeholder insertion) with configurable verbosity levels.

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS 4 |
| Hosting | Azure Static Web Apps (hybrid rendering) |
| CI/CD | GitHub Actions |
| LLM Backend | HIPAA-compliant GPT endpoint (Azure-hosted) |

## Architecture Overview

### System Architecture

```
Browser (Client)
=================

 +--------------+  +----------------+  +---------------+
 |  VigilMD     |  | Note Converter |  | Landing Page  |
 | - Analyze    |  | - Convert      |  | - App Cards   |
 | - Handoff    |  | - Verbosity    |  |               |
 | - Settings   |  | - Settings     |  |               |
 +------+-------+  +-------+--------+  +---------------+
        |                  |
        +--------+---------+
                 |
                 v
 +-------------------------------+
 | client_llm_gateway.ts        |  <-- Single LLM entry point
 | + adapter.ts                 |  <-- Format translation
 +---------------+---------------+
                 |
                 |  fetch POST /api/secureLlm
                 |
=======================================  Network boundary
                 |
                 v
Azure Static Web Apps
======================

 +-------------------------------+
 | /api/secureLlm (route.ts)    |  <-- Generic proxy
 | - Passthrough only           |  <-- Adds auth header
 | - No translation logic       |  <-- Returns raw response
 +---------------+---------------+
                 |
=======================================  Network boundary
                 |
                 v
HIPAA-Compliant LLM Endpoint
==============================

 +-------------------------------+
 | Azure-hosted GPT             |
 | (OpenAI Responses API)       |
 | - BAA-covered                |
 | - No PHI stored              |
 +-------------------------------+
```

### Data Flow — LLM Request Lifecycle

```
1. User action (e.g. "Analyze" button)
        │
2. App builds Chat Completions-format request
   { model, messages: [{role, content}], response_format? }
        │
3. client_llm_gateway.ts → adapter.ts: toResponsesAPI()
   Translates to Responses API format:
   { model, input: [{type:"message", role, content}], text?: {format:...} }
        │
4. fetch POST /api/secureLlm  (same-origin, no CORS)
        │
5. route.ts adds Authorization header, proxies to HIPAA endpoint
        │
6. HIPAA endpoint processes request, returns Responses API response
        │
7. route.ts returns raw response to client
        │
8. adapter.ts: fromResponsesAPI() extracts output_text
        │
9. Gateway returns { content, structured?, raw }
```

### Security Architecture

```
Security Boundaries
====================

Client (Browser)
  - No PHI stored persistently
  - localStorage: user preferences only (conciseness settings, UI examples)
  - All clinical data transient (component state)

API Route (/api/secureLlm)
  - Stateless proxy -- no logging, no storage
  - Secrets server-side only (env vars: HIPAA_GPT5_URL, HIPAA_GPT5_KEY)
  - Adds Authorization bearer token
  - No request/response transformation

HIPAA LLM Endpoint
  - BAA-covered Azure deployment
  - No PHI retained after response
  - Usage tracked (token counts only, no content)
```

**Key security properties:**
- **No PHI at rest** — clinical data exists only in browser memory during the session. No server-side logging or storage of patient data.
- **Secrets isolation** — API keys are server-side environment variables, never exposed to the client.
- **Minimal proxy** — the API route is a stateless passthrough. It adds the auth header and forwards the request unchanged. No request bodies are logged or stored.
- **HIPAA-compliant LLM** — the upstream GPT endpoint is deployed under a Business Associate Agreement (BAA) on Azure infrastructure with no PHI retention.
- **Same-origin API** — the `/api/secureLlm` route runs on the same domain as the frontend, eliminating CORS and reducing attack surface.

## Directory Structure

```
src/
├── app/
│   ├── layout.tsx                # Root layout (Navbar, fonts)
│   ├── page.tsx                  # Landing page
│   ├── globals.css               # Tailwind + WashU brand tokens
│   ├── vigilmd/                  # VigilMD application
│   ├── note-converter/           # Note Converter application
│   ├── how-it-works/            # Architecture & docs viewer
│   └── api/secureLlm/route.ts   # LLM proxy endpoint
├── lib/
│   ├── client_llm_gateway.ts    # LLM call interface
│   ├── adapter.ts               # Request/response format translation
│   ├── user_examples.ts         # User example storage + prompt injection
│   ├── logger.ts                # Console logger
│   └── debug.ts                 # Debug store
└── components/
    ├── Navbar.tsx               # Shared navigation
    ├── AppCard.tsx              # Landing page cards
    └── UserExamplesEditor.tsx   # Shared examples editor
```

## Development

```bash
# Install dependencies
npm install

# Create env file with HIPAA endpoint credentials
cp .env.local.example .env.local
# Edit .env.local with your HIPAA_GPT5_URL and HIPAA_GPT5_KEY

# Run dev server
npm run dev

# Type check
npm run build
```

## Deployment

Deployed via GitHub Actions to Azure Static Web Apps on push to `main`. Environment variables (`HIPAA_GPT5_URL`, `HIPAA_GPT5_KEY`) must be configured in Azure SWA Application Settings.
