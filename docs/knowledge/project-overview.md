# AuditIQ Project Overview

## Why AuditIQ Was Built

AuditIQ was built to demonstrate a lightweight procurement audit workflow that can identify mismatches between core source documents and explain why those issues matter.

## Business Problem

Manual three-way matching is time-consuming and prone to inconsistency. Finance and audit teams need a way to quickly review Purchase Orders, Goods Receipt Notes, and Vendor Invoices for:

- quantity mismatches
- price variances
- missing documents
- duplicate invoice risk
- estimated financial exposure
- concise remediation guidance

## Current MVP Scope

The current repository contains Blueprint V1 only. The MVP focuses on a single analysis loop from upload to results.

## What Is Implemented

- Upload page for PO, GRN, and Invoice files
- Filename-based classification
- Structured data extraction fixtures
- Three-way matching across quantity, unit price, and amount
- Exception detection
- Financial exposure calculation
- Risk assessment
- Recommendation generation
- Explainability generation
- Results page for the stored snapshot
- Dashboard summary cards that reflect the latest stored analysis when available

## What Is Intentionally Not Implemented

- Real OCR or file-content parsing
- AI-powered document understanding
- Backend API or database persistence
- Authentication or access control
- Multi-session audit history
- Workflow automation beyond the current page flow
- Production integrations with ERP or document systems
- V2 feature work

