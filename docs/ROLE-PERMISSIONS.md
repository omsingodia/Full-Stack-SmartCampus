# CampusCare role and permission matrix

This document records the agreed product permissions. API enforcement must be tested before public deployment.

## Platform layer
- Platform Owner: creates and suspends campus workspaces and creates the first campus administrator.
- Campus data is scoped to the resolved campus tenant. Campus users cannot choose or override tenant IDs.

## Campus roles
| Module / action | Campus Admin | Teacher | Student CR | Student |
|---|---|---|---|---|
| Dashboard | Campus overview | Assigned/teaching data | Own class data | Own data |
| User management | Full campus user management | No | No | No |
| Lost & Found | View/manage all campus posts | View/create/manage own | View/create/manage own | View/create/manage own |
| Reports | View all, assign to support departments, update status | Submit/view own | Submit/view own | Submit/view own |
| Communities: create/edit/delete | No | Yes, own communities | No | No |
| Communities: manage members | No | Yes, own communities | Add students only | No |
| Communities: announcements | Yes, announcements only | As community permissions allow | No | No |
| Communities: notes | No | Yes | Yes | Yes |
| Communities: assignments | No | Yes | Yes | No |
| Communities: discussions | No | Yes | Yes | Yes |
| Exams: create/edit/delete and seating | Yes | No | No | No |
| Exams: assigned duty view | No | Yes | No | No |
| Exams: class/student schedule | Campus view | Assigned view | Own class view | Own schedule |
| Profile | Own profile; campus user administration separately | Own | Own | Own |

## Notes
- Admin is not allowed to create, edit or delete communities or manage community membership.
- Reports are routed to support departments/teams, not teachers.
- Resolved Lost & Found posts should not show active claim/action controls to ordinary users.
- Image uploads must be authenticated and tenant-scoped on both upload and retrieval.
- This is the intended permission contract. Confirm every endpoint and UI action against it with automated integration tests before onboarding real campuses.
