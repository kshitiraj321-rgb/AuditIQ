# AuditIQ

AuditIQ is a Next.js application for three-way document analysis across Purchase Orders, Goods Receipt Notes, and Vendor Invoices.

## Project Overview

Finance and audit teams often review procurement documents manually to catch mismatches, exception patterns, and exposure risk. This process is slow, repetitive, and hard to standardize. 

AuditIQ provides a lightweight, automated web-based workflow that accepts these three documents, runs them through a deterministic analysis pipeline, and presents the resulting exceptions, financial exposure, risk scores, recommendations, and explainability narratives in a structured dashboard.

## Documentation Navigation

This repository functions as a self-contained knowledge base. For all deep technical, architectural, and governance details, please navigate to the respective documentation hubs:

- **[Knowledge Index](docs/knowledge/README.md):** The main directory for all project knowledge.
- **[Governance & Source of Truth](docs/governance/SOURCE_OF_TRUTH.md):** Defines authority hierarchies, data contracts, and golden rules.
- **[Architecture](docs/architecture/):** System design, pipelines, engines, and technical baselines.
- **[Audits](docs/audits/):** Validation reports and milestone completion audits.
- **[Releases](docs/releases/):** Release notes and stable tag documentation.

## Setup Instructions & Developer Onboarding

*(Setup instructions and detailed developer onboarding are maintained alongside the codebase. Standard Next.js operations apply: `npm install` and `npm run dev`.)*

For architectural understanding before contributing, review the [System Architecture](docs/architecture/architecture.md) and [Technical Baseline](docs/architecture/AuditIQ_Technical_Baseline_V1.md).

## Repository Overview

```text
.
├── docs/
│   ├── architecture/
│   ├── audits/
│   ├── decisions/
│   ├── governance/
│   ├── knowledge/
│   ├── releases/
│   └── roadmap/
├── public/
├── src/
│   ├── app/
│   └── lib/
├── eslint.config.mjs
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

*For detailed capabilities, implementations, and future roadmaps, please follow the [Knowledge Index](docs/knowledge/README.md).*
