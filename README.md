# AuditIQ

**The intelligent three-way matching and audit intelligence platform for enterprise procurement.**

> Built for hackathon demonstration. Blueprint V3 — June 2026.

---

## Live Demo

> _Add your Vercel URL here after deployment._

## Demo Video

> _Add your demo video link here._

---

## Problem

Finance and audit teams lose countless hours manually comparing Purchase Orders, Goods Receipt Notes, and Vendor Invoices. This process is repetitive, error-prone, and does not scale.

When mismatches occur — in price, quantity, or dates — investigators have no tooling to understand *why* the mismatch happened or *what to do next*. Organizations are left with hidden financial exposure, delayed vendor payments, and unresolved procurement risk.

---

## Solution

AuditIQ automates the full procurement audit workflow end-to-end.

Upload three documents. AuditIQ extracts all relevant fields using AI, performs a deterministic three-way match, and flags every exception with severity, financial exposure, and a clear remediation path. Instead of just highlighting errors, AuditIQ provides a guided investigation workspace with plain-English explanations and an AI assistant for case analysis.

Blueprint V3 extends this with executive-level vendor, department, and organization intelligence — shifting from reactive auditing to predictive risk management.

---

## Features

### Blueprint V1 — Core Audit Engine
- **AI Extraction** — AI reads PDF documents and outputs structured data (vendor, quantity, unit price, total amount, dates, document numbers)
- **Three-Way Matching** — Deterministic cross-document match across PO, GRN, and Vendor Invoice
- **Exception Detection** — Six exception types: Quantity Mismatch, Price Variance, Missing PO, Missing GRN, Duplicate Invoice, Timeline Deviation
- **Risk Scoring** — Composite severity and financial exposure calculation per exception
- **Recommendations** — Actionable next steps linked directly to each exception

### Blueprint V2 — Investigation Layer
- **Explainability** — Human-readable root cause narratives per exception
- **Root Cause Analysis** — Evidence chains with confidence levels (Proven / Probable)
- **Investigation Workspace** — Priority rail + deep-dive panel for structured exception review
- **AI Assistant** — Guided case analysis with exception-aware context

### Blueprint V3 — Executive Intelligence
- **Predictive Risk** — Risk trend analysis across audit history
- **Vendor Intelligence** — Vendor reliability scoring and exception frequency tracking
- **Department Intelligence** — Exposure aggregation by department
- **Organization Intelligence** — Organization-wide risk dashboard
- **Executive Command Center** — Natural language query interface for executive reporting

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4 |
| Language | TypeScript 5 |
| AI | OpenAI API (via Vercel AI SDK) |
| PDF Processing | pdfjs-dist |
| Schema Validation | Zod |
| Icons | Lucide React |

---

## Architecture

```text
Upload (PDF)
      ↓
AI Extraction (OpenAI)
      ↓
Three-Way Match Engine
      ↓
Exception Detection Engine
      ↓
Risk Scoring Engine
      ↓
Explainability Engine
      ↓
Investigation Workspace (UI)
      ↓
Executive Intelligence (Blueprint V3)
```

---

## Screenshots

| View | Description |
|------|-------------|
| Upload Workspace | Document upload zone with auto-classification |
| Dashboard | Live KPI summary with exception overview and executive brief |
| Results Console | Exception priority rail, root cause, financial impact, AI assistant |
| Executive Command Center | Vendor, department, and organization intelligence |

> _Screenshots to be added after deployment._

---

## Installation

```bash
# Clone the repository
git clone https://github.com/your-org/auditiq.git
cd auditiq

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Set OPENAI_API_KEY in .env.local

# Start development server
npm run dev
```

The application runs at `http://localhost:3000`.

**Note:** AI extraction requires a valid `OPENAI_API_KEY`. Without it, the platform falls back to demonstration data and clearly labels all fallback fields in the UI.

---

## Folder Structure

```text
.
├── docs/                        # Project documentation and governance
│   ├── architecture/            # System design and technical baselines
│   ├── audits/                  # Validation reports
│   ├── governance/              # Source of truth and authority hierarchy
│   ├── releases/                # Release notes per milestone
│   ├── JUDGES_README.md         # One-minute judge overview
│   └── HACKATHON_RELEASE_v3.0.1.md
├── public/                      # Static assets
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── api/                 # API routes (extraction)
│   │   ├── page.tsx             # Dashboard
│   │   ├── upload/              # Upload Workspace
│   │   ├── results/             # Results Console
│   │   └── command-center/      # Executive Command Center
│   ├── components/              # Shared UI components
│   └── lib/                     # Business logic engines
│       ├── exceptionEngine.ts
│       ├── extractor.ts
│       ├── riskEngine.ts
│       ├── explainabilityEngine.ts
│       └── assistant/
├── package.json
└── tailwind.config.ts
```

---

## Future Roadmap

**Blueprint V4** — Continuous Intelligence
- Continuous anomaly detection across rolling audit cycles
- Automated vendor notification and remediation workflows
- ERP system integrations (SAP, Oracle, NetSuite)
- Multi-currency and multi-entity support
- Live audit trail with tamper-evident logging

---

## License

MIT License

## Documentation Hub
*   **[AuditIQ Master Project Bible](docs/knowledge/AuditIQ_Master_Project_Bible.md)**
*   **[Blueprint V1](docs/knowledge/Blueprint_V1.md)**
*   **[Blueprint V2](docs/knowledge/Blueprint_V2.md)**
*   **[Golden Rules](docs/governance/AUDITIQ_GOLDEN_RULE.md)**
*   **[Source of Truth](docs/governance/SOURCE_OF_TRUTH.md)**
*   **[Release Process](docs/governance/Release_Process.md)**
*   **[AI Agent Guidelines](docs/governance/AI_AGENT_GUIDELINES.md)**
*   **[Pipeline Architecture](docs/architecture/Pipeline_Architecture.md)**
*   **[Engine Architecture](docs/architecture/Engine_Architecture.md)**
