# CampusCare multi-campus SaaS architecture

## Product model
- CampusCare Platform Owner: creates and suspends campus workspaces.
- Campus workspace: one university/campus tenant (e.g. SKIT), with its own users, communities, reports, lost-and-found records, exams and files.
- Campus Admin: administers only their campus.
- Teacher, Student CR and Student: operate only inside their campus and assigned academic group.

## Campus addressing
- Production tenant URL: `https://<campus-slug>.campuscare.in`.
- A campus can later map a verified custom domain (e.g. `portal.university.edu`).
- Local development can send `X-Campus-Slug: <slug>`; the login screen stores this selection.
- Never accept a tenant ID from a normal user's request body. The server resolves the tenant from the verified hostname or campus slug.

## Isolation
Every campus-owned MongoDB collection has an immutable `tenantId`. The tenant-scope Mongoose plugin adds the active tenant to reads, updates, deletes, counts and aggregations, and rejects writes without tenant context. Platform collections (`Campus`, `PlatformUser`) are deliberately outside campus scope.
Campus users are unique by `{ tenantId, email }`, allowing the same email to be used by different campuses without sharing accounts.

## First-time setup
1. Configure `server/.env` from `.env.example`.
2. Set a long random `JWT_SECRET` (32+ random bytes), MongoDB Atlas URI, allowed frontend URL, and root domain.
3. Run `npm run platform:create-owner` once to create the global platform owner.
4. Start the API and open `/platform`.
5. Sign in as the Platform Owner and create a campus (e.g. name `SKIT`, institution `Swami Keshvanand Institute of Technology`, slug `skit`) and its first campus Admin.
6. DNS: point `*.campuscare.in` and `campuscare.in` to the frontend host; point API host to backend; configure TLS and backend `CLIENT_URL`.
7. Students and staff use the campus URL or enter its campus code on the login screen.

## Existing single-campus database migration
For a database already containing the original single-campus CampusCare data:
1. Create the Platform Owner first.
2. Set `LEGACY_CAMPUS_NAME`, `LEGACY_CAMPUS_INSTITUTION`, and `LEGACY_CAMPUS_SLUG` in `.env`.
3. Back up MongoDB Atlas.
4. Run `npm run tenant:migrate-legacy` once. It assigns old records to one campus and replaces the global users-email index with a tenant-scoped index.
5. Verify record counts and logins before reopening traffic.

## Important production work still required before public university onboarding
This repository contains the first multi-tenant foundation, not a completed audited SaaS release. Before accepting real institutions:
- Finish integration/API tests for every role and every tenant boundary, including GridFS file access and Socket.IO.
- Configure secure authentication cookies/refresh-token rotation, email verification, password reset, MFA for Platform Owner/Admin, and account recovery.
- Add billing/subscription, campus onboarding approval, audit logs, backups/PITR, monitoring/alerting, rate limits per tenant, data retention and incident response.
- Configure cloud object storage or tenant-checked GridFS, antivirus/content scanning and file size/type limits.
- Add verified custom-domain ownership checks and automated TLS/domain provisioning.
- Complete accessibility, load, penetration, dependency and restore tests.
- Do not expose a production tenant until the above checks pass.
