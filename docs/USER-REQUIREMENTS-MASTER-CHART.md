# CampusCare — Master Requirements & Acceptance Chart

This chart is the acceptance baseline consolidated from the user's instructions. Existing modules must be retained; changes are additive unless explicitly approved.

## Product / SaaS
| ID | Requirement | Acceptance condition |
|---|---|---|
| SaaS-01 | Multi-university product | Platform Owner can create, activate, suspend and inspect campuses. |
| SaaS-02 | Tenant isolation | Every campus-owned read/write, upload, download, search, count, export and socket event is scoped to the authenticated campus. Cross-campus tests must prove denial. |
| SaaS-03 | Campus identity | Login identifies campus by campus code or verified campus domain; token tenant must match request tenant. |
| SaaS-04 | Platform vs campus roles | Platform Owner/Support are separate from campus Admin/Teacher/Student CR/Student. |
| SaaS-05 | Subscription lifecycle | Plans, billing, subscription status, limits and renewal workflow. (Not yet implemented.) |
| SaaS-06 | University onboarding | Campus application, verification/approval, domain verification and initial Admin provisioning. (Not yet implemented.) |

## Campus roles & pages
| Module | Platform Owner | Admin | Teacher | Student CR | Student |
|---|---|---|---|---|---|
| Campus management | Create/manage campuses | No | No | No | No |
| User management | No campus-user management | Full campus user management | No | No | No |
| Dashboard | Platform metrics | Campus-wide overview | Assigned classes/data | Own class data | Own data |
| Communities: view | No campus community access by default | View all (read-only except announcements) | Own/assigned communities | Joined class communities | Joined class communities |
| Communities: create/edit/delete | No | No | Create and fully manage own communities | No | No |
| Communities: add/remove members | No | No | Manage members in own communities | Add students in own class community; no remove/manage settings | No |
| Community posts | No | Announcements only | Notes, Assignments, Discussions, Announcements | Notes, Assignments, Discussions | Notes, Discussions |
| Lost & Found | No | Full moderation | View/create/manage own posts and claims | View/create/manage own posts and claims | View/create/manage own posts and claims |
| Reports | No | View all, assign to support department/team, update status | Submit/view own reports | Submit/view own reports | Submit/view own reports |
| Examinations | No | Create/edit/delete exams, assign duties, manage candidates and seating | View assigned exams/duties | View class exam information | View own timetable/seating |
| Profile | No | Own profile; manage other accounts through User Management | Own profile | Own profile | Own profile |
| Help | No | Available | Available | Available | Available |

## Community structure
- Year groups: 1st, 2nd, 3rd, 4th year.
- Communities are scoped by year + course + section.
- Teacher-created community owner has full control over that community.
- Teacher initially adds students and CRs; CR may add students in their own matching class community.
- Admin can view all communities and publish Announcements only; Admin cannot create/delete/edit communities or manage members.
- Student may publish Notes and Discussions; Student may not publish Assignments.

## Reports workflow
- Categories: Maintenance, Damage, Vandalism, Littering, Safety (additional existing categories may remain for backward compatibility).
- All campus users may submit a report and view their own reports.
- Admin alone sees all reports, assigns them to a support department/team, and updates status.
- Reports are assigned to support teams/departments, not teachers.
- Image attachments must be supported and tenant-scoped.

## Retain existing product areas
- Public Home, About, Contact pages.
- Login and authenticated navigation.
- Dashboard, Lost & Found, Reports, Communities, Examinations, User Management, Profile, Help.
- Search/filter controls, image upload/preview, and existing working flows must not be removed.

## Release gates (must all pass before calling production-ready)
1. Frontend production build and lint.
2. Backend unit + integration tests.
3. Role matrix API tests for every action above.
4. Two-campus isolation tests for CRUD, aggregate/count, GridFS, search, export and Socket.IO.
5. Migration dry-run + backup/restore test against a staging database.
6. Security review: auth/token tenant binding, rate limits, input validation, upload validation, audit trail, secrets and CORS.
7. Deployment smoke tests on staging, then production DNS/TLS/monitoring/backups.

**Status note:** This chart is the target specification, not a claim that every item is already implemented. Items explicitly marked “Not yet implemented” remain open.
