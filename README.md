# CampusCare — Multi-University Campus Management SaaS

CampusCare is an existing React/Vite + Express + MongoDB application being developed into a multi-tenant SaaS platform for universities and colleges. This repository must be extended in place: preserve existing pages, modules, APIs, models and working flows. Do not replace the application with a new template or start a parallel project.

## Product goal

One CampusCare platform serves multiple independent universities. Each campus has its own users, academic structure, communities, reports, Lost & Found records, exams, files and notifications. Cross-campus access must be denied at the backend and verified by automated tests.

## Account hierarchy

CampusCare has a platform-level **Platform Owner** and four campus-level roles: **Campus Admin, Teacher, Student CR, Student**.

### Platform Owner
- Separate Platform Console; creates, configures, activates, suspends and manages university tenants.
- Provisions the first Campus Admin for each tenant.
- Manages platform-level configuration and (when implemented) subscriptions, plans, billing and verified domains.
- Does not automatically browse private campus/student records. Any exceptional support access must be separately authorized and audited.

### Campus Admin
- Manages users in their own campus: create, view, edit, deactivate/reactivate, role assignment, academic mapping and secure account reset.
- Manages departments, courses/programs, academic years, sections, Teacher assignments and Student CR assignments.
- Campus-wide dashboard and reports.
- Lost & Found moderation for their campus.
- Reports: view all campus reports, assign to departments/support teams and update status.
- Examinations: create/edit/delete exams, manage candidates, seating plans and Teacher duties.
- Communities: view all and post Announcements only.
- **Cannot** create/edit/delete communities, manage community membership, or post Notes, Assignments or Discussions.

### Teacher
- Views assigned classes, sections, students and relevant dashboard data.
- Creates communities for authorized classes/sections.
- Fully manages communities they own: edit/delete, add/remove members, add students and Student CRs.
- Shares Notes, Assignments and Discussions in authorized communities.
- Views assigned examination duties.
- Submits reports and views only their own reports.
- Manages own profile.

### Student CR
- Views own class/section and authorized class community.
- Can add students to their matching class community when authorized.
- Can share Notes and Discussions.
- Cannot create/edit/delete communities, change settings, remove members or share Assignments.
- Views authorized class exam information and own reports.

### Student
- Views own dashboard, profile, academic details, timetable, exam schedule and seating.
- Views joined communities.
- Can share Notes and Discussions; cannot share Assignments or manage community membership.
- Uses Lost & Found, creates/manages own posts and claims.
- Submits reports and views own reports.
- Cannot access another user's private data or another campus.

## Permission matrix

| Action | Platform Owner | Campus Admin | Teacher | Student CR | Student |
|---|---|---|---|---|---|
| Create/manage campus tenant | Yes | No | No | No | No |
| Campus user management | No by default | Own campus | No | No | No |
| View dashboard | Platform metrics | Campus-wide | Assigned data | Own class | Own data |
| Create community | No | No | Authorized | No | No |
| Edit/delete community | No | No | Own communities | No | No |
| Manage members | No | No | Own communities | Add students only | No |
| Announcements | No | Yes | Only if explicitly enabled | No | No |
| Notes | No | No | Yes | Yes | Yes |
| Assignments | No | No | Yes | No | No |
| Discussions | No | No | Yes | Yes | Yes |
| Submit report | No | Yes | Yes | Yes | Yes |
| View all reports | No | Own campus | No | No | No |
| Assign reports to support team | No | Yes | No | No | No |
| Update report status | No | Yes | No | No | No |
| Manage all Lost & Found | No | Own campus | Own posts | Own posts | Own posts |
| Create/manage exams & seating | No | Own campus | No unless explicitly delegated | No | No |
| View exam duties | No | Yes | Assigned duties | No | No |
| View exam schedule/seating | No | Yes | Assigned scope | Own class | Own record |

All permissions must be enforced server-side. Hiding a button in React is not authorization.

## Campus structure and communities

Each university configures departments, programs/courses, academic year, year group (normally 1st–4th), section, roll numbers, Teacher assignments and CR assignments.

Communities are organized by **year → course/program → section**, for example `2nd Year → BTech CSE → Section A`. Each community is tied to exactly one campus and has an owner, academic scope, members and post permissions.

Community post types:
- **Announcements:** Campus Admin.
- **Notes:** Teacher, Student CR and Student.
- **Assignments:** Teacher only.
- **Discussions:** Teacher, Student CR and Student.

## Product modules to preserve and complete

### Lost & Found
Create Lost/Found posts with title, description, category, date, campus location and optional images. Support search/filter, post details, owner editing, claims, claim review and resolution. Resolved posts remain in history but normal claim actions are hidden. Admin can moderate all records in their campus.

### Reports
Categories: Maintenance, Damage, Vandalism, Littering, Safety. Users submit title, description, category, location, severity/priority if configured, and optional images. Submitters see only their own reports. Campus Admin sees all campus reports, assigns to support departments/teams (e.g. Facilities, Housekeeping, IT, Security), updates status and resolves. Reports are private by default, especially Safety reports.

### Examinations
Admin creates/edits/cancels exams, manages eligible students, assigns Teacher duties, manages venues and seating plans/charts, and publishes schedules. Teachers view assigned duties. CRs view authorized class schedules/seating. Students view only their own exam schedule, venue and seat. OCR seating-chart extraction is optional unless implemented and tested; manual seating must work.

### User Management
Campus Admin creates/edits/views/deactivates/reactivates campus users, assigns roles and academic mappings, assigns Teachers and CRs, imports validated CSV files, and initiates secure invitations/password resets. Users cannot elevate their own role. An Admin cannot manage another campus.

### Dashboard, profile and navigation
Separate dashboards for Platform Owner, Admin, Teacher, CR and Student. Every user edits only permitted own-profile fields and changes their own password securely. Public pages include Home, About, Contact, Help and Login. Authenticated navigation is role-aware, but backend routes always enforce access.

## Multi-tenant architecture and security

Every campus-owned document must have a required immutable `tenantId` referencing its Campus. Platform-level records (Campus registry, PlatformUser, plans/billing) are separate.

Tenant identity must be resolved from a verified campus slug/domain and authenticated user's membership. Never trust a client-provided campus ID alone.

Isolation must cover Mongoose queries, counts, aggregates, updates/deletes, bulk operations, raw collection access, GridFS metadata and downloads, Socket.IO rooms/events, search, caches, exports, analytics, notifications and background jobs. Cross-campus attempts must fail closed.

Security requirements:
- Modern password hashing; never store plaintext passwords.
- Secure token/session handling, expiry and revocation.
- Rate limiting and input validation.
- Strict CORS allowlist and TLS in production.
- Secure file type/size validation, private storage and authorized downloads.
- Audit logs for privileged actions.
- Secret management; `.env` must never be committed.
- Backups, restore drills, retention policy and incident response.

## SaaS capabilities

For commercial operation, implement university onboarding/approval, verified custom domains, configurable plans, monthly/yearly subscriptions, payment gateway, invoices, renewals, failed-payment/grace-period/suspension flows, plan limits, data export and tenant offboarding. Do not simulate a payment or claim an integration works without real configured credentials and tests.

## Current technology and project layout

- Frontend: React, Vite, React Router (`client/`).
- Backend: Node.js, Express (`server/`).
- Database: MongoDB with Mongoose.
- Realtime: Socket.IO.
- File storage: GridFS foundation.
- Deployment configuration: Vercel (`client/vercel.json`) and Render (`render.yaml`).

Keep the existing folder structure and extend it in place.

## Local setup

1. Install a supported Node.js LTS version.
2. Configure `server/.env` using `server/.env.example`. Set a valid `MONGODB_URI`, strong `JWT_SECRET`, `CLIENT_URL`, and required platform owner values where applicable.
3. Never paste secrets into GitHub, issue trackers, screenshots or chat.
4. Install backend dependencies: `cd server && npm install`.
5. Start backend: `npm run dev`.
6. In a second terminal install/start frontend: `cd client && npm install && npm run dev`.
7. Open the local Vite URL shown in the terminal (normally `http://localhost:5173`).

MongoDB Atlas transactions require a replica-set-capable deployment. If campus provisioning uses transactions, test it against an appropriate MongoDB deployment. Do not use production student data for local tests.

## Account provisioning

There are no built-in universal demo credentials and no hardcoded users. The Platform Owner setup script is `server/scripts/createPlatformOwner.js` and is invoked with `npm run platform:create-owner` from `server/`. It requires `MONGODB_URI`, `PLATFORM_OWNER_NAME`, `PLATFORM_OWNER_EMAIL` and `PLATFORM_OWNER_PASSWORD` in `server/.env`; the script enforces a long password. After login, the Platform Owner provisions a campus and its first Admin. Campus Admin then creates Teachers, Student CRs and Students.

Never guess credentials. If a password is lost, use a secure password reset/rotation procedure.

## Verification and release gates

A feature is complete only when backend implementation, UI workflow, server-side authorization, tests and relevant integration checks exist.

Before production:
1. Frontend production build and lint pass.
2. Backend unit and integration tests pass.
3. Every role's allowed and denied API actions are tested.
4. Two-campus isolation tests cover CRUD, aggregate/count, search, files, exports and Socket.IO.
5. Migration dry-run and backup/restore are tested on staging.
6. Security review has no unresolved critical/high findings.
7. Staging end-to-end tests pass.
8. Production TLS, domains, monitoring, backups and rollback are verified.

**This README is the product target and acceptance specification. It is not a claim that every listed feature is already implemented or production-certified.**
