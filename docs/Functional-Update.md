# CampusCare Functional Update

## Included changes
- Authenticated navigation now shows only campus modules; Home redirects to Dashboard and About/Contact are public-only.
- Active navigation links receive the existing white text and underline treatment.
- Search controls are available in Lost & Found, Campus Support reports, Class Community, Examinations, and Users & Roles.
- Campus reports are routed to a support team based on category (Electrical, Maintenance, Housekeeping, Furniture, Security, or General Support). Teacher assignment has been removed from the Reports UI and route.
- Closed reports no longer show In Progress or Resolve actions.
- Lost & Found staff can mark eligible items Resolved; pending claims must be reviewed first.
- Class communities are discoverable by signed-in users; students can join before participating. Existing role-based posting permissions remain.
- Examinations now has Create, Students, and Teachers sections for Admin; students get Year 1–4 grouping; teachers see their assigned duties; Admin can view the teacher directory and manage duties.
- Exam creation supports a native date and time picker, optional teacher assignment, hall assignment, and seating-chart image upload.
- Seating-chart images are stored in MongoDB with the exam and can be viewed by authenticated users.
- Admin can assign/update student seating and change teacher duty assignments.
- Admin user management includes account creation and password reset.

## Deployment
- Frontend root directory remains `client`.
- Backend root directory remains `server`.
- Do not upload or commit `server/.env`. Configure secrets in Render environment variables.
- `server/.env.example` is safe to keep in version control.

## Validation
- Backend JavaScript files passed `node --check`.
- A full Vite build was not run in this environment because npm dependencies were not available offline.
