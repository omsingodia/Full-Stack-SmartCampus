CampusCare website - readable source

FOLDER MAP
index.html, about.html, contact.html, login.html   public pages
dashboard.html, lost-found.html, reports.html,
community.html, exams.html                          pages for logged-in users
users.html, security.html, data.html                admin-only pages
css/style.css   all design (12 commented sections)
js/app.js       all logic (7 commented sections: state, data, saving,
                helpers, pages, actions, drawing the page)



LOGINS
admin@campus.edu  / admin123   (Admin)
meera@campus.edu  / teacher123 (Teacher)
aarav@campus.edu  / campus@123 (Student)
rohan@campus.edu  / student123 (Student, CR)
New sign-ups start as Student. Admin changes roles on the Users page.
Admin password reset sets the temporary password campus@123.

NOTE: data is saved in each visitor's own browser, not on a server.
