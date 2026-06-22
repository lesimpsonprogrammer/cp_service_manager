# CPSM — Client Portfolio Service Manager

CPSM is a standalone client portfolio service management product preview. It is designed to organize client onboarding, agreement packet initiation, portfolio status, service requests, shared documents, messages, and settings in one client-facing workspace.

## Current product state

This repository currently contains a static HTML/CSS/JavaScript preview that can be deployed to Vercel, GitHub Pages, Netlify, or any static host. It is not yet a production SaaS application and does not include backend authentication, database persistence, or secure document storage.

## Core files

- `index.html` — CPSM standalone landing page and product entry point.
- `login.html` — CPSM client log-in preview.
- `client-portal.html` — client dashboard after agreement acceptance.
- `cpsm-client-onboarding.html` — internal/admin-style client onboarding page for initiating client onboarding and agreement packets.
- `cpsm-agreements.html` — client agreement review and acceptance page for packets initiated through onboarding.
- `cpsm-portfolio.html` — portfolio status module.
- `cpsm-requests.html` — service request module.
- `cpsm-documents.html` — document access module.
- `cpsm-messages.html` — communication module.
- `cpsm-settings.html` — account, notification, and access settings module.
- `client-portfolio-menu.js` — shared CPSM navigation and drawer behavior.
- `cpsm-navigation.css` — CPSM navigation, onboarding, agreements, and module styling.
- `assets/cpsm-logo-horizontal.svg` — approved CPSM logo lockup used across navigation and login screens.

## Client onboarding flow

1. Open `cpsm-client-onboarding.html`.
2. Select **Initiate Client Onboarding**.
3. Enter the client email address, authorized signer name, and onboarding date.
4. CPSM creates a local agreement packet and marks the client as pending client acceptance.
5. Open `cpsm-agreements.html` for agreement review and acceptance.
6. After acceptance, the client can access `client-portal.html`.

## Preview storage

The current static preview uses browser storage:

- `localStorage.cpsmOnboardingClients` — client onboarding records.
- `localStorage.cpsmAgreementPacket` — currently active agreement packet.
- `localStorage.cpsmAgreementAcceptance` — agreement acceptance flags and timestamp.
- `sessionStorage.cpsmClientPortalPreview` — dashboard preview information.

These are placeholders until CPSM is connected to a backend database, authentication layer, and document storage service.

## Recommended next steps

1. Rename the GitHub repository from `cp_service_manager` to `cp-service-manager` for cleaner product naming.
2. Connect the repository to Vercel as the official CPSM deployment.
3. Convert the static prototype to a Next.js app when backend routing, authentication, role-based access, and database persistence are ready.
4. Add admin/client role separation so Client Onboarding is limited to internal users.
5. Replace browser storage with a real database model for clients, agreement packets, signatures, requests, documents, and messages.
