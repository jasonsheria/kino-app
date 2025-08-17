Owner onboarding flow and API endpoints

Overview
--------
This directory adds a simple owner onboarding experience to the application. It is intentionally front-end-first and uses a small OCR stub (`src/utils/ocr.js`) for pre-validation of uploaded identity documents.

Pages
-----
- `/owner/onboard` — initial choice screen (enter code or start application)
- `/owner/request` — multi-step application form with file upload and preview
- `/owner/dashboard` — owner dashboard with stats and quick actions
- `/owner/properties` — owner properties CRUD (localStorage demo)
- `/owner/messages` — owner messages (local demo)
- `/owner/wallet` — simple wallet UI (demo)

API endpoints (backend)
-----------------------
These frontend pages expect the backend to provide the following endpoints. They are not implemented in the demo but are recommended:

- POST `/api/owner/apply` — multipart/form-data to submit application and documents. Returns 201 and JSON { applicationId }
- GET `/api/owner/application/:id/status` — returns JSON { status: 'pending'|'approved'|'rejected', notes: string }
- POST `/api/owner/upload` — upload file endpoint (returns URL)
- POST `/webhooks/owner/verification` — optional webhook endpoint the verification service calls to notify status changes

Notes
-----
- The frontend uses `src/utils/ocr.js` as a stubbed OCR pre-check; replace it with a real OCR API (Tesseract, Google Vision, Azure Cognitive Services) on the server.
- Replace `localStorage` demos with real APIs when integrating.
