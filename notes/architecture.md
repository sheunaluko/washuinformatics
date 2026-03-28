# Architecture

## Directory Structure

```
washuinformatics/
├── .github/workflows/azure-swa.yml   # CI/CD for Azure Static Web Apps
├── notes/                            # Design references and documentation
├── public/                           # Static assets
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Root layout (Navbar, fonts, metadata)
│   │   ├── page.tsx                  # Landing page — app cards grid
│   │   ├── globals.css               # Tailwind + WashU brand color tokens
│   │   │
│   │   ├── vigilmd/                  # VigilMD app
│   │   │   ├── page.tsx
│   │   │   ├── VigilMDApp.tsx        # App shell + settings toggle
│   │   │   ├── VigilMD.tsx           # Main widget (analyze, handoff)
│   │   │   ├── DashboardCard.tsx     # Insight result card
│   │   │   ├── HandoffDisplay.tsx    # Handoff renderer
│   │   │   ├── PromptEditor.tsx      # Settings (conciseness levels + examples)
│   │   │   └── lib/
│   │   │       ├── prompts.ts        # Prompt templates + generation
│   │   │       ├── hp.ts            # H&P generation prompt
│   │   │       ├── handoff_prompt.ts # Handoff prompt + conciseness config
│   │   │       ├── schemas.ts       # Zod schemas (handoff response)
│   │   │       └── util.ts          # LLM call wrappers (generate, analyze, handoff)
│   │   │
│   │   ├── note-converter/           # Note Converter app
│   │   │   ├── page.tsx
│   │   │   ├── NoteConverter.tsx     # Main component (input/output split)
│   │   │   ├── Settings.tsx          # Settings (user examples)
│   │   │   └── lib/
│   │   │       ├── instructions.ts   # 22 transformation principles
│   │   │       └── constants.ts      # Verbosity labels/guidance
│   │   │
│   │   └── api/secureLlm/
│   │       └── route.ts              # Generic HIPAA proxy (POST passthrough)
│   │
│   ├── lib/
│   │   ├── client_llm_gateway.ts     # Single LLM entry point (all apps use this)
│   │   ├── adapter.ts               # Chat Completions <-> Responses API translation
│   │   ├── user_examples.ts         # Shared user examples storage + prompt injection
│   │   ├── logger.ts                # Simple console logger
│   │   └── debug.ts                 # Debug store (window.__debug__)
│   │
│   └── components/
│       ├── Navbar.tsx               # Top nav with WashU branding
│       ├── AppCard.tsx              # Landing page app card
│       └── UserExamplesEditor.tsx   # Shared examples editor (used by both apps)
│
├── staticwebapp.config.json          # Azure SWA navigation fallback
├── .env.local.example                # Template for env vars
└── package.json
```

## Data Flow

### LLM Call Path
```
Browser (client component)
  → client_llm_gateway.ts: llmCall()
    → adapter.ts: toResponsesAPI() — translates Chat Completions → Responses API
    → fetch POST /api/secureLlm
      → route.ts: generic proxy → fetch HIPAA_GPT5_URL
      → returns raw Responses API response
    → adapter.ts: fromResponsesAPI() — unwraps to content string
  → returns { content, structured?, raw }
```

### User Examples Flow
```
UserExamplesEditor → localStorage (per app, per category)
                   ↓
App loads examples → buildExamplesBlock() → appended to LLM prompt
```

## WashU Brand Colors

| Token | Hex | Usage |
|-------|-----|-------|
| washu-red | #BA0C2F | Primary, active toggles, VigilMD accent |
| washu-red-dark | #971B2F | Hover states, gradients |
| washu-green | #215732 | Secondary, action buttons |
| washu-teal | #007D8A | Note Converter accent, input focus |
| washu-coral | #FF6D6A | Imaging cards, warm accents |

## Adding a New App

1. Create `src/app/<app-name>/page.tsx` and main component
2. Add an `AppCard` entry in `src/app/page.tsx`
3. Use `llmCall()` from `src/lib/client_llm_gateway.ts` for LLM calls
4. Use `UserExamplesEditor` for user-configurable examples
5. Follow the settings toggle pattern (gear icon → swap view)
