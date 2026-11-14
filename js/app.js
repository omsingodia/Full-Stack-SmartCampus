// CampusCare - main script (used by every page)
// Each .html file has <body data-p="pagename">; this file draws that page.

const $ = (s) => document.querySelector(s),
  e = (s) =>
    String(s).replace(
      /[&<>"]/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]
    );
// ===== 1. APP STATE =====
let usersTab = 'admins';
let me = null,
  tab = 'lost',
  mode = 'in',
  gi = 0,
examTab = 'create',
examPublicTab = 'records',
editingExamId = null,
editingDutyId = null,
  communityOpen = false;
// ===== 2. STARTING DATA =====
// Real-world dynamic data store: accounts and records are created through proper registration and workflows.
const users = [];
const items = [];
const reps = [];
const teams = ['Maintenance team', 'Electrical team', 'Housekeeping team', 'Security Team'];
const groups = [];
const exams = [];
const examSeating = [];
const duty = [];
const examRequests = [];
const log = [];

// ===== 3. SAVING (browser storage) AND PAGE FILE NAMES =====

// ===== 3. SAVING (browser storage) AND PAGE FILE NAMES =====

const msgs = [];

const F = {
  home: 'index.html',
  about: 'about.html',
  contact: 'contact.html',
  login: 'login.html',
  dashboard: 'dashboard.html',
  lost: 'lost-found.html',
  reports: 'reports.html',
  community: 'community.html',
  exam: 'exams.html',
  users: 'users.html',
  security: 'security.html',
  data: 'data.html'
};

const KEY = 'campuscare-site-v1';

try {
  const z = JSON.parse(localStorage.getItem(KEY) || 'null');

  if (z) {
    for (const [a, k] of [
      [users, 'users'],
      [items, 'items'],
      [reps, 'reps'],
      [groups, 'groups'],
      [exams, 'exams'],
      [examSeating, 'examSeating'],
      [duty, 'duty'],
      [examRequests, 'examRequests'],
      [log, 'log'],
      [msgs, 'msgs']
    ]) {
      if (z[k]) {
        a.splice(0, a.length, ...z[k]);
      }
    }

    if (z.me) me = z.me;
  }
} catch (x) {
  console.error('Unable to load saved CampusCare data:', x);
}

// Migrate older exam records to the new structure.
exams.forEach((x, i) => {
  if (!x.id) x.id = Date.now() + i;
  if (!x.year) x.year = 3;
  if (!x.time) x.time = 'Not set';

  // Preserve old room and seat information during migration
  if (x.r || x.st) {
    const alreadyExists = examSeating.some(
      (seat) =>
        seat.examId === x.id &&
        seat.student === (x.student || me?.n)
    );

    if (!alreadyExists && (x.r || x.st)) {
      examSeating.push({
        id: Date.now() + i,
        year: x.year,
        examId: x.id,
        student: x.student || '',
        email: x.email || '',
        hall: x.r || '',
        seat: x.st || ''
      });
    }
  }
});

// Migrate older teacher duty records.
duty.forEach((x, i) => {
  if (!x.id) x.id = Date.now() + i;
  if (!x.hall) x.hall = x.r || '';
  if (!x.date) x.date = x.d || '';
  if (!x.time) x.time = 'Not set';
  if (!x.teacher) x.teacher = x.t || '';

  delete x.r;
  delete x.d;
  delete x.t;
});

const save = () => {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        users,
        items,
        reps,
        groups,
        exams,
        examSeating,
        duty,
        examRequests,
        log,
        msgs,
        me
      })
    );
    } catch (x) {
    console.error('Unable to save CampusCare data:', x);

    const t = $('#t');
    if (t) {
      t.textContent = 'Storage full. Please reduce uploaded file sizes.';
      t.className = 'on';
    }
  }
};



const sha = async (t) =>
  crypto.subtle
    ? [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)))]
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    : btoa(t);
// ===== 4. SMALL HELPERS =====
// rl = role name, staff = teacher or admin, cr = class representative, v = read an input box
const rl = () => (me ? me.r.split(' ')[0] : ''),
  staff = () => ['Teacher', 'Admin'].includes(rl()),
  cr = () => me && me.r.includes('CR'),
  v = (id) => ($('#' + id) || {}).value || '';
function toast(m) {
  save();
  const t = $('#t');
  t.textContent = m;
  t.className = 'on';
  setTimeout(() => (t.className = ''), 2600);
}
const L = (a, b) =>
  log.unshift([new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), a, b]);
const fld = (id, l, t = 'text', x = '') =>
  `<label for="${id}">${l}</label><input id="${id}" type="${t}" ${x}>`;
const opt = (a) => a.map((o) => `<option>${e(o)}</option>`).join('');
// The four main modules shown on the home page and dashboard
const mods = [
  ['lost', 'Lost &amp; found', 'Check the found list, or post what you lost.'],
  ['reports', 'Report system', 'Report damage or repairs and track the fix.'],
  ['community', 'Class community', 'Groups, announcements, notes and assignments.'],
  ['exam', 'Examinations', 'Your exam dates, rooms, seats and duties.']
];

// ===== 5. PAGES =====
// Each function returns the HTML of one page.
const V = {
  // --- Home page ---
  home: () => `<section class="hv"><div class="wrap hvi"><div><h1>One campus.<br>Everything in order.</h1><p>Lost belongings, campus issues, class groups and exams, managed in one calm place for students, teachers and the admin office.</p><div class="row"><a class="btn w" href="${me ? F.dashboard : F.login}">${me ? 'Open dashboard' : 'Log in'}</a><a class="btn wg" href="about.html">About CampusCare</a></div></div>
<svg viewBox="0 0 320 200" role="img" aria-label="Campus building" fill="none" stroke="#fff" stroke-width="1"><polygon points="30,76 160,20 290,76"/><line x1="40" y1="76" x2="280" y2="76"/><line x1="40" y1="84" x2="280" y2="84"/>${[0, 1, 2, 3, 4, 5].map((i) => `<line x1="${58 + i * 41}" y1="84" x2="${58 + i * 41}" y2="168"/><line x1="${70 + i * 41}" y1="84" x2="${70 + i * 41}" y2="168"/>`).join('')}<line x1="30" y1="168" x2="290" y2="168"/><line x1="18" y1="176" x2="302" y2="176"/><line x1="6" y1="184" x2="314" y2="184"/></svg></div></section>
<section class="wrap lst">${mods.map((m) => `<a class="ln" href="${F[me ? m[0] : 'login']}"><h3>${m[1]}</h3><p>${m[2]}</p><span>Explore</span></a>`).join('')}</section>
<section class="band"><div class="wrap cols"><div><h3>Students</h3><p>Post and track your own items and reports, join class groups and check your exam seat.</p></div><div><h3>Teachers</h3><p>Resolve lost and found cases, run class groups and see your exam duty.</p></div><div><h3>Admin office</h3><p>Manage users, roles, repair teams, exams and account security.</p></div></div></section>`,
  // --- About page ---
  about:
    () => `<h2>About CampusCare</h2><div class="two"><div class="card"><p>CampusCare replaces scattered WhatsApp groups and paper notices with one organised website for the campus.</p><p>It has four parts: Lost &amp; found, a Report system for campus issues, Class community, and Examinations. Everyone logs in once and sees only what their role allows.</p></div>
<div class="card"><h3>Who can do what</h3><p class="mut"><b>Students</b> post and track their own items and reports, join class groups and view exams.<br><b>Teachers</b> resolve lost &amp; found cases, run class groups and see their exam duty.<br><b>Admin</b> manages users, teams, exams and security.</p></div></div>`,
  // --- Contact page ---
  contact: () =>
    `<h2>Contact us</h2><div class="two"><div class="card">${fld('cn', 'Your name')}${fld('ce', 'Email', 'email')}<label for="cm">Message</label><textarea id="cm" rows="4"></textarea><p><button class="btn" onclick="sendMsg()">Send message</button></p></div><div class="card"><h3>Campus support</h3><p>Phone: <a href="tel:+911412000000">0141 200 0000</a><br>Hours: Mon to Sat, 9 AM to 5 PM<br>Office: Admin block, ground floor</p></div></div>`,
  // --- Login and sign up page ---

  // --- Login page: no public registration ---
  login: () =>
    `<div style="max-width:460px">
      <h2>Welcome to CampusCare</h2>
      <div class="tabs">
        <button class="on">Log in</button>
      </div>
      <div class="card">
        ${fld('le', 'Official campus email', 'email')}
<label for="lp">Password</label>
<div class="password-wrap">
  <input id="lp" type="password" autocomplete="current-password">
  <button type="button" class="password-toggle"
    onclick="togglePassword()"
    aria-label="Show password"
    title="Show password">
    <span id="password-eye">◉</span>
  </button>
</div>        <p><button class="btn" onclick="login()">Log in</button></p>
        <p class="mut">CampusCare accounts are provided by the college administration. Contact the admin office if you do not have your login credentials.</p>
      </div>
    </div>`,
  // --- Dashboard (all roles) ---
  dashboard:
    () => `<h2>Hello, ${e(me.n)}</h2><p class="mut">Signed in as ${e(me.r)}</p><div class="grid">${mods.map((m) => `<a class="card mod" href="${F[m[0]]}"><h3>${m[1]}</h3><p>${m[2]}</p></a>`).join('')}</div>
<div class="card" style="margin-top:16px"><h3>At a glance</h3><p class="mut">${items.filter((i) => i.s == 'Open').length} open lost &amp; found items. ${reps.filter((r) => r.s != 'Resolved').length} open campus reports. ${groups.length} class groups.</p></div>
${rl() == 'Admin' ? `<div class="card" style="margin-top:16px"><h3>Admin pages</h3><div class="row"><a class="btn g" href="users.html">Users &amp; roles</a><a class="btn g" href="security.html">Security log</a><a class="btn g" href="data.html">Data &amp; backup</a></div></div>` : ''}`,
  // --- Lost and found page ---
  
// --- Lost and found page ---
lost: () => {
 const list = items.filter((i) =>
  i.t === tab
);

  return `
    <h2>Lost &amp; found</h2>


    <div class="search-box">
  <input
    type="search"
    id="lostSearch"
    placeholder="Search item, place or posted by..."
    oninput="filterLostItems()"
  />
</div>
<p id="lostCount" class="mut"></p>



    <div class="tabs">
      <button class="${tab === 'lost' ? 'on' : ''}"
        onclick="tab='lost';render()">Lost</button>

      <button class="${tab === 'found' ? 'on' : ''}"
        onclick="tab='found';render()">Found</button>
    </div>

    <div class="two">
      <div class="card">

        ${list.length ? list.map((i) => `
          <div class="it"
  data-search="${e(`${i.n} ${i.p} ${i.by} ${i.s}`).toLowerCase()}">

            <div class="row">
              <b>${e(i.n)}</b>
              <span class="tag ${
                i.s === 'Resolved' ? 'ok' : ''
              }">${e(i.s)}</span>
            </div>

            ${i.img ? `
<img
  src="${e(i.img)}"
  alt="${e(i.n)}"
  onclick="showImage(this.src)"
  title="Click to view full image"
  style="width:100%;max-width:260px;height:180px;object-fit:contain;margin:12px 0;cursor:zoom-in;"
>
            ` : ''}

            <div class="mut">
              ${e(i.p)}. Posted by ${e(i.by)}
            </div>

            ${
              i.s === 'Open' ? `
                <div style="margin-top:12px">
                  <button class="btn s"
                    onclick="resolve(${i.id})">
                    I Resolved It
                  </button>
                </div>
              ` : ''
            }

            ${
              i.s === 'Pending Verification' ? `
                <p class="mut">
                  Handover proof submitted by ${e(i.rb)}.
                  Waiting for teacher/admin verification.
                </p>

                ${i.ph ? `
                  <img src="${e(i.ph)}"
                    alt="Handover proof"
                    onclick="showImage(this.src)"
                    style="width:100%;max-width:260px;height:180px;object-fit:contain;margin:8px 0;">
                ` : ''}

                ${staff() ? `
                  <button class="btn s"
                    onclick="verifyItem(${i.id})">
                    Verify &amp; Resolve
                  </button>
                ` : ''}
              ` : ''
            }

            ${
              i.s === 'Resolved' ? `
                <p class="mut">
                  Resolved by ${e(i.rb || 'User')}.
                  Verified by ${e(i.verifiedBy || 'Teacher/Admin')}.
                </p>
              ` : ''
            }

          </div>
        `).join('') : `
          <p class="mut">
            ${tab === 'lost'
              ? 'No lost items posted yet.'
              : 'No found items posted yet.'}
          </p>
        `}
      </div>

      <div class="card">
        <h3>Post a ${tab} item</h3>

        ${fld('in', 'Item')}
        ${fld('ip', 'Place')}

        <label class="mut" for="itemPhoto">
          Upload item photo (Required)
        </label>

        <input
          type="file"
          id="itemPhoto"
          accept="image/*"
          required
          style="width:100%;margin:10px 0 16px"
        >

        <p>
          <button class="btn" onclick="addItem()">
            Post ${tab} item
          </button>
        </p>

        <p class="mut">
          You can also tell a teacher in person. They will help open your case.
        </p>

        <p class="mut">
          <b>Photo Verification Required:</b>
          Please upload clear and genuine photographs of both parties
          with the item during handover, wherever possible.
          False or misleading images may be referred to the
          faculty/admin for verification and appropriate action.
        </p>
      </div>
    </div>
  `;
},

  // --- Report system page ---

// --- Report system page ---

// --- Report system page ---

// --- Report system page ---



// --- Report system page ---
reports: () => {
  // Migrate old report statuses
  reps.forEach((r) => {
    if (r.s === 'In progress') {
      r.s = 'In Progress';
    }

    if (!r.tm && (r.s === 'Submitted' || r.s === 'Resolved')) {
      r.s = 'Pending Assignment';
    }

    if (r.tm && r.s === 'Submitted') {
      r.s = 'Assigned';
    }
  });

  save();

  const all = rl() === 'Admin';
const l = all ? reps : reps.filter((r) => r.byEmail === me.e || r.by === me.n);

  return `
    <h2>Report system</h2>

    <div class="two">

      <!-- LEFT COLUMN: ALL REPORTS -->
      <div class="card">
        <h3>${all ? 'All reports' : 'My reports'}</h3>

        <div class="search-box">
          <input
            type="search"
            id="reportSearch"
            placeholder="Search issue, place, status or user..."
            oninput="filterReports()"
          />
        </div>

        <p id="reportCount" class="mut">
          Showing ${l.length} reports
        </p>

        ${l.length ? `
          <div class="ov">
            <table>
              <tr>
                <th>Issue</th>
                <th>Place</th>
                <th>Photo</th>
                <th>Status</th>
                ${all ? '<th>Team</th>' : ''}
              </tr>

              ${l.map((r) => {
                const nextStatuses = {
                  'Pending Assignment': [],
                  'Assigned': ['In Progress'],
                  'In Progress': ['Resolved'],
                  'Resolved': []
                };

                return `
                  <tr data-search="${e(`${r.c} ${r.d} ${r.p} ${r.by} ${r.s} ${r.tm || ''}`).toLowerCase()}">

                    <td>
                      ${e(r.c)}: ${e(r.d)}
                      <div class="mut">by ${e(r.by)}</div>
                    </td>

                    <td>${e(r.p)}</td>

                    <td>
                      ${r.img ? `
                        <img
                          src="${e(r.img)}"
                          alt="Report photo"
                          onclick="showImage(this.src)"
                          title="Click to view full image"
                          style="width:100px;height:80px;object-fit:cover;border-radius:4px;cursor:zoom-in;"
                        >
                      ` : '<span class="mut">No photo</span>'}
                    </td>

                    <td>
                      ${all ? `
                        <select
                          onchange="updateReportStatus(${r.id}, this.value)"
                          ${!r.tm || r.s === 'Resolved' ? 'disabled' : ''}
                        >
                          <option value="${e(r.s)}" selected>
                            ${e(r.s)}
                          </option>

                          ${(nextStatuses[r.s] || []).map((s) => `
                            <option value="${s}">${s}</option>
                          `).join('')}
                        </select>
                      ` : `
                        <span class="tag ${r.s === 'Resolved' ? 'ok' : ''}">
                          ${e(r.s)}
                        </span>
                      `}
                    </td>

                    ${all ? `
                      <td>
                        <select
                          onchange="assignReportTeam(${r.id}, this.value)"
                          ${r.s === 'Resolved' ? 'disabled' : ''}
                        >
                          <option value="" ${!r.tm ? 'selected' : ''}>
                            Unassigned
                          </option>

                          ${teams.map((t) => `
                            <option
                              value="${e(t)}"
                              ${t === r.tm ? 'selected' : ''}
                            >${e(t)}</option>
                          `).join('')}
                        </select>
                      </td>
                    ` : ''}

                  </tr>
                `;
              }).join('')}
            </table>
          </div>

          <p id="noReports" class="mut" hidden>
            No matching reports found.
          </p>

        ` : '<p class="mut">No reports yet.</p>'}
      </div>

      <!-- RIGHT COLUMN: NEW REPORT + EMERGENCY HELP -->
      <div>

        <div class="card">
          <h3>New report</h3>

          <label for="rc">Type</label>
          <select id="rc">
            ${opt(['Maintenance', 'Damage', 'Vandalism', 'Littering', 'Safety'])}
          </select>

          ${fld('rp', 'Place')}

          <label for="rd">What happened</label>
          <textarea id="rd" rows="3"></textarea>

          <label for="rf">Photo (Optional)</label>
          <input
            id="rf"
            type="file"
            accept="image/*"
            style="width:100%;margin:8px 0 14px"
          >

          <p>
            <button class="btn" onclick="addRep()">
              Submit report
            </button>
          </p>
        </div>

        <div class="card emergency-box">
          <h3>Need Emergency Help?</h3>

          <p class="mut">
            For urgent campus safety or security issues,
            contact the campus support team directly.
          </p>

          <a class="btn" href="tel:+911412000000">
            Call Campus Support
          </a>
        </div>

      </div>

    </div>
  `;
},





  // --- Class community page ---

// --- Class community page ---
community: () => {
  const teacher = rl() === 'Teacher';
  const admin = rl() === 'Admin';
  const representative = cr();
  const student = rl() === 'Student' && !representative;

  // COMMUNITY OVERVIEW
  if (!communityOpen) {
    return `
      <h2>Class community</h2>

      <div class="search-box">
        <input
          type="search"
          id="communitySearch"
          placeholder="Search class, section or teacher..."
          oninput="filterCommunities()"
        >
      </div>

      <p id="communityCount" class="mut">
        ${groups.length} communities available
      </p>

      <div class="grid" id="communityGrid">
        ${groups.map((g, i) => `
          <div class="card community-card"
            data-search="${e(`${g.n} ${g.owner || ''}`).toLowerCase()}">

            <h3>${e(g.n)}</h3>

            <p class="mut">
              ${g.m.length} members
              ${g.owner ? ` · Teacher: ${e(g.owner)}` : ''}
            </p>

            <div class="row" style="margin-top:12px">
  <button class="btn s"
    onclick="openCommunity(${i})">
    Open Community
  </button>

  ${teacher ? `
    <button class="btn s g"
      onclick="deleteCommunity(${i})">
      Delete
    </button>
  ` : ''}
</div>
          </div>
        `).join('')}
      </div>

      ${teacher ? `
        <div class="card" style="margin-top:20px">
          <h3>Create a new community</h3>
          ${fld('newGroupName', 'Class and section name')}
          <p>
            <button class="btn" onclick="createCommunity()">
              Create Community
            </button>
          </p>
        </div>
      ` : ''}
    `;
  }

  // SELECTED COMMUNITY
  const g = groups[gi];

  if (!g) {
    communityOpen = false;
    return V.community();
  }

  let postTypes = [];

  if (teacher) {
    postTypes = ['Announcement', 'Notes', 'Assignment', 'Discussion'];
  } else if (admin || representative) {
    postTypes = ['Announcement'];
  } else if (student) {
    postTypes = ['Notes', 'Discussion'];
  }

  return `
    <h2>Class community</h2>

    <button class="btn g s" onclick="communityOpen=false;render()">
      ← All Communities
    </button>

    <h3 style="margin-top:22px">${e(g.n)}</h3>

    <div class="tabs">
      <button class="on">Feed</button>
    </div>

    <div class="two">

      <!-- FEED -->
      <div class="card">
        <h3>Community Feed</h3>

        <div class="search-box">
          <input
            type="search"
            id="communityPostSearch"
            placeholder="Search posts, notes or announcements..."
            oninput="filterCommunityPosts()"
          >
        </div>

        <div id="communityPosts">
          ${g.p.length ? g.p.map((p, i) => `
            <div class="it community-post"
              data-search="${e(`${p.k} ${p.x} ${p.b} ${p.fileName || ''}`).toLowerCase()}">

              <span class="tag">${e(p.k)}</span>
              <b>${e(p.b)}</b>

              <p>${e(p.x)}</p>

              ${p.fileData ? `
                <p>
                  <a href="${p.fileData}"
                    download="${e(p.fileName || 'community-file')}">
                    <icon name="download"/> ${e(p.fileName || 'Download attachment')}
                  </a>
                </p>
              ` : ''}

              ${(teacher || p.b === me.n) ? `
                <button class="btn s g"
                  onclick="deleteCommunityPost(${gi}, ${i})">
                  Delete post
                </button>
              ` : ''}
            </div>
          `).join('') : '<p class="mut">No posts yet.</p>'}
        </div>

        <p id="noCommunityPosts" class="mut" hidden>
          No matching posts found.
        </p>

        ${postTypes.length ? `
          <div style="margin-top:20px;border-top:1px solid #ddd;padding-top:18px">
            <h3>Write a post</h3>

            <label for="communityPostType">Post type</label>
            <select id="communityPostType"
              onchange="toggleCommunityFile()">
              ${opt(postTypes)}
            </select>

            <label for="communityPostText">Message / Description</label>
            <textarea id="communityPostText" rows="3"
              placeholder="Write here..."></textarea>

            <div id="communityFileArea" style="display:none;margin-top:12px">
              <label for="communityFile">Attach notes or assignment file</label>
              <input type="file" id="communityFile"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,image/*">
            </div>

            <p>
              <button class="btn" onclick="addCommunityPost()">
                Publish
              </button>
            </p>
          </div>
        ` : ''}
      </div>

      <!-- MEMBERS -->
      <div class="card">
        <h3>Members (${g.m.length})</h3>

        ${g.m.map((member, i) => `
          <div class="row" style="justify-content:space-between;margin:8px 0">
            <span>${e(member)}</span>

            ${teacher ? `
              <button class="btn s g"
                onclick="removeCommunityMember(${gi}, ${i})">
                Remove
              </button>
            ` : ''}
          </div>
        `).join('')}

        ${(teacher || representative) ? `
          <div style="margin-top:20px">
            <h3>Add a student</h3>
            <input id="communityMember"
              placeholder="Enter registered student name or email">

            <p>
              <button class="btn s"
                onclick="addCommunityMember()">
                Add to group
              </button>
            </p>

            ${representative && !teacher ? `
              <p class="mut">CR access: add students to this community.</p>
            ` : ''}
          </div>
        ` : ''}
      </div>

    </div>
  `;
},

  // --- Examination page ---
  // --- Examination page ---
  // --- Examination page ---
    // --- Examination page ---
  exam: () => {
    const role = rl();
    const isAdmin = role === 'Admin';
    const isTeacher = role === 'Teacher';
    const isStudent = role.startsWith('Student');

    const mySeats = examSeating.filter(s => s.email === me.e);
    const myDuties = duty.filter(d => d.teacher === me.n);
    const myRequests = examRequests.filter(r => r.email === me.e);

    // Visual year-wise timetable / seating chart
    const timetable = [1, 2, 3, 4].map(year => {
      const yearExams = exams
        .filter(x => Number(x.year) === year)
        .sort((a, b) => String(a.d).localeCompare(String(b.d)));

      return `
        <section class="card" style="margin-top:16px">
          <h3>Year ${year} Examination Timetable</h3>
          ${yearExams.length ? `
            <div class="ov">
              <table>
                <tr>
                  <th>Subject</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Hall</th>
                  <th>Student Seating</th>
                </tr>
                ${yearExams.map(x => {
                  const seats = examSeating.filter(s => s.examId === x.id);
                  return `
                    <tr>
                      <td><b>${e(x.s)}</b></td>
                      <td>${e(x.d)}</td>
                      <td>${e(x.time)}</td>
                      <td>
                        ${[...new Set(seats.map(s => s.hall).filter(Boolean))]
                          .map(e).join(', ') || 'Not assigned'}
                      </td>
                      <td>${seats.length} students assigned</td>
                    </tr>
                  `;
                }).join('')}
              </table>
            </div>
          ` : '<p class="mut">No exams created for this year.</p>'}
        </section>
      `;
    }).join('');

    const records = `
      <div class="card">
        <h3>All Examination Records</h3>

        <div class="search-box">
          <input type="search" id="examRecordSearch"
            placeholder="Search subject, date, time or year..."
            oninput="filterExamRecords()">
        </div>

        <p class="mut" id="examRecordCount">
          Showing ${exams.length} examination records
        </p>

        <div class="ov">
          <table id="examRecordTable">
            <tr>
              <th>Subject</th>
              <th>Date</th>
              <th>Time</th>
              <th>Year</th>
            </tr>
            ${exams.map(x => `
              <tr data-search="${e(`${x.s} ${x.d} ${x.time} ${x.year}`).toLowerCase()}">
                <td>${e(x.s)}</td>
                <td>${e(x.d)}</td>
                <td>${e(x.time)}</td>
                <td>Year ${e(x.year)}</td>
              </tr>
            `).join('')}
          </table>
        </div>

        <p id="noExamRecords" class="mut" hidden>
          No matching examination records found.
        </p>
      </div>

      <div class="card" style="margin-top:18px">
        <h3>Complete Year-wise Examination Timetable</h3>
        <p class="mut">
          Official examination schedule and seating overview for all four years.
        </p>
        ${timetable}
      </div>

      ${isAdmin ? `
        <div class="card emergency-box" style="margin-top:18px">
          <h3>Reported Examination Mistakes</h3>
          <p class="mut">
            Review reports submitted by students and teachers.
            Each report includes the reporter, issue and submission date.
          </p>

          ${examRequests.length ? examRequests.map(r => `
            <div class="it">
              <div class="row" style="justify-content:space-between;flex-wrap:wrap">
                <b>${e(r.person || r.student || 'Unknown user')}</b>
                <span class="tag">${e(r.role || 'Student')}</span>
              </div>

              <p><b>Exam:</b> ${e(r.subject || 'General examination issue')}</p>
              <p><b>Reported mistake:</b> ${e(r.message || '')}</p>
              <p class="mut">
                <b>Email:</b> ${e(r.email || 'Not available')}<br>
                <b>Reported on:</b> ${e(r.date || 'Date not available')}
              </p>

              <span class="tag ${r.status === 'Resolved' ? 'ok' : ''}">
                ${e(r.status || 'Pending')}
              </span>

              ${r.status !== 'Resolved' ? `
                <button class="btn s" onclick="resolveExamRequest(${r.id})">
                  Mark Resolved
                </button>
              ` : `
                <p class="mut">
                  Resolved by ${e(r.resolvedBy || 'Admin')}
                  ${r.resolvedAt ? `on ${e(r.resolvedAt)}` : ''}
                </p>
              `}
            </div>
          `).join('') : `
            <p class="mut">No examination mistakes reported yet.</p>
          `}
        </div>
      ` : `
        <div class="card emergency-box" style="margin-top:18px">
          <h3>Report an Examination Mistake</h3>
          <p class="mut">
            Found an incorrect subject, date, time, hall, seat or duty?
            Submit the details here for Admin review.
          </p>

          <label for="correctionExam">Select examination</label>
          <select id="correctionExam">
            <option value="">General examination issue</option>
            ${exams.map(x => `
              <option value="${x.id}">
                ${e(x.s)} — ${e(x.d)}
              </option>
            `).join('')}
          </select>

          <label for="correctionMessage">Describe the mistake</label>
          <textarea id="correctionMessage" rows="4"
            placeholder="Explain what is incorrect..."></textarea>

          <button class="btn" onclick="requestExamCorrection()">
            Submit Mistake Report
          </button>

          <hr>
          <h3>My Submitted Reports</h3>

          ${myRequests.length ? myRequests.map(r => `
            <div class="it">
              <b>${e(r.subject || 'General examination issue')}</b>
              <p>${e(r.message)}</p>
              <p class="mut">Submitted: ${e(r.date || '')}</p>
              <span class="tag ${r.status === 'Resolved' ? 'ok' : ''}">
                ${e(r.status || 'Pending')}
              </span>
              ${r.resolvedAt ? `
                <p class="mut">Resolved on: ${e(r.resolvedAt)}</p>
              ` : ''}
            </div>
          `).join('') : `
            <p class="mut">You have not submitted any reports yet.</p>
          `}
        </div>
      `}
    `;

    return `
      <h2>Examinations</h2>

      ${isAdmin ? `
        <div class="tabs">
          <button class="${examTab === 'create' ? 'on' : ''}"
            onclick="examTab='create';render()">Create Exam</button>
          <button class="${examTab === 'students' ? 'on' : ''}"
            onclick="examTab='students';render()">Students</button>
          <button class="${examTab === 'teachers' ? 'on' : ''}"
            onclick="examTab='teachers';render()">Teachers</button>
          <button class="${examTab === 'records' ? 'on' : ''}"
            onclick="examTab='records';render()">Records &amp; Mistakes</button>
        </div>
      ` : `
        <div class="tabs">
          <button class="${examPublicTab === 'records' ? 'on' : ''}"
            onclick="examPublicTab='records';render()">Records &amp; Mistakes</button>
          <button class="${examPublicTab === 'personal' ? 'on' : ''}"
            onclick="examPublicTab='personal';render()">
            My ${isTeacher ? 'Duty' : 'Exams'}
          </button>
        </div>
      `}

      ${isAdmin && examTab === 'create' ? `
<div class="card" id="examCreateForm">
  <h3>${editingExamId !== null ? 'Edit Examination' : 'Create New Examination'}</h3>         
          ${fld('examSubject', 'Subject')}
          ${fld('examDate', 'Exam Date', 'date')}
          ${fld('examTime', 'Exam Time', 'time')}

          <label for="examYear">Academic Year</label>
          <select id="examYear">
            ${[1,2,3,4].map(y => `<option value="${y}">Year ${y}</option>`).join('')}
          </select>

<button class="btn" onclick="createExam()">
  ${editingExamId !== null ? 'Update Examination' : 'Create Examination'}
</button>

${editingExamId !== null ? `
  <button class="btn g" onclick="editingExamId=null;render()">
    Cancel Editing
  </button>
` : ''}        </div>

        <div class="card" style="margin-top:18px">
  <h3>AI-Assisted Seating Chart Import</h3>
  <p class="mut">
    Upload the official examination seating chart. CampusCare will read
    the roll numbers, examination halls and seat numbers for review.
  </p>

  <label for="aiSeatExam">Select Examination</label>
  <select id="aiSeatExam">
    ${exams.map(x => `
      <option value="${x.id}">
        ${e(x.s)} — ${e(x.d)}
      </option>
    `).join('')}
  </select>

  <label for="seatingChartFile">Upload Seating Chart (PDF, JPG, PNG)</label>
  <input
    type="file"
    id="seatingChartFile"
    accept=".pdf,.png,.jpg,.jpeg,image/*,application/pdf"
    style="width:100%;margin:10px 0 16px"
  >

  <button class="btn" onclick="readSeatingChart()">
    Analyze Seating Chart
  </button>

  <p id="seatingOcrStatus" class="mut"></p>

  <div id="seatingOcrPreview" style="margin-top:16px"></div>
</div>

        <div class="card" id="teacherDutyForm" style="margin-top:18px">
  <h3>${editingDutyId !== null ? 'Edit Teacher Examination Duty' : 'Assign Teacher Examination Duty'}</h3>

          <label for="dutyTeacher">Select Teacher</label>
          <select id="dutyTeacher">
            ${users.filter(u => u.r === 'Teacher' && !u.off).map(u => `
              <option value="${e(u.n)}">${e(u.n)}</option>
            `).join('')}
          </select>

          <label for="dutyExam">Select Examination</label>
          <select id="dutyExam">
            ${exams.map(x => `
              <option value="${x.id}">${e(x.s)} — ${e(x.d)}</option>
            `).join('')}
          </select>

          ${fld('dutyHall', 'Assigned Hall')}
<label for="dutyType">Select Duty Type</label>
<select id="dutyType">
  <option value="Chief Superintendent">Chief Superintendent</option>
  <option value="Invigilator">Invigilator</option>
  <option value="Assistant Invigilator">Assistant Invigilator</option>
  <option value="Flying Squad">Flying Squad</option>
  <option value="Relieving Staff">Relieving Staff</option>
</select>
          <button class="btn" onclick="assignExamDuty()">
  ${editingDutyId !== null ? 'Update Teacher Duty' : 'Assign Teacher Duty'}
</button>

${editingDutyId !== null ? `
  <button class="btn g" onclick="editingDutyId=null;render()">
    Cancel Editing
  </button>
` : ''}
        </div>

        <div class="card" style="margin-top:18px">
          <h3>Manage Created Examinations</h3>
          <div class="search-box">
  <input type="search" id="manageExamSearch"
    placeholder="Search subject, date or year..."
    oninput="filterManageExams()">
</div>

<p class="mut" id="manageExamCount">
  Showing ${exams.length} examinations
</p>
          ${exams.length ? exams.map(x => `
            <div class="it manage-exam-row"
  data-search="${e(`${x.s} ${x.d} ${x.time} ${x.year}`).toLowerCase()}">
  <b>${e(x.s)}</b>
              <p class="mut">Year ${e(x.year)} · ${e(x.d)} · ${e(x.time)}</p>
              <button class="btn s" onclick="editExam(${x.id})">Edit</button>
              <button class="btn s g" onclick="deleteExam(${x.id})">Delete</button>
            </div>
          `).join('') : '<p class="mut">No examinations created yet.</p>'}
        </div>
        <div class="card" style="margin-top:18px">
  <h3>Manage Teacher Duties</h3>
<div class="search-box">
  <input type="search" id="manageDutySearch"
    placeholder="Search teacher, subject, hall or duty..."
    oninput="filterManageDuties()">
</div>

<p class="mut" id="manageDutyCount">
  Showing ${duty.length} teacher duties
</p>
  ${duty.length ? duty.map(d => {
    const exam = exams.find(x => x.id === d.examId);

    return `
    <div class="it manage-duty-row"
  data-search="${e(`${d.teacher} ${exam?.s || ''} ${exam?.d || d.date || ''} ${d.hall} ${d.type || ''}`).toLowerCase()}">
  <b>${e(d.teacher)}</b>
        <p>${e(exam?.s || 'Examination')}</p>
        <p class="mut">
          ${e(exam?.d || d.date || 'Date not set')}
          · ${e(exam?.time || d.time || '')}
          · ${e(d.hall)}
          · ${e(d.type || 'Invigilator')}
        </p>

        <button class="btn s" onclick="editExamDuty(${d.id})">
          Edit
        </button>

        <button class="btn s g" onclick="deleteExamDuty(${d.id})">
          Delete
        </button>
      </div>
    `;
  }).join('') : `
    <p class="mut">No teacher duties assigned yet.</p>
  `}
</div>
      ` : ''}

      ${isAdmin && examTab === 'students' ? `
        <div class="card">
          <h3>Student Examination Seating</h3>

          <div class="search-box">
            <input type="search" id="studentSeatSearch"
              placeholder="Search student, email, subject, hall or seat..."
              oninput="filterStudentSeats()">
          </div>

          <p class="mut" id="studentSeatCount">
            Showing ${examSeating.length} seating records
          </p>

          <div class="ov">
            <table id="studentSeatTable">
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Subject</th>
                <th>Year</th>
                <th>Hall</th>
                <th>Seat</th>
              </tr>
              ${examSeating.map(s => {
                const x = exams.find(a => a.id === s.examId);
                return `
                  <tr data-search="${e(`${s.student} ${s.email} ${x?.s || ''} ${s.year} ${s.hall} ${s.seat}`).toLowerCase()}">
                    <td>${e(s.student)}</td>
                    <td>${e(s.email)}</td>
                    <td>${e(x?.s || 'Exam unavailable')}</td>
                    <td>Year ${e(s.year)}</td>
                    <td>${e(s.hall)}</td>
                    <td>${e(s.seat)}</td>
                  </tr>
                `;
              }).join('')}
            </table>
          </div>

          <p id="noStudentSeats" class="mut" hidden>
            No matching student seating records found.
          </p>
        </div>
      ` : ''}

      ${isAdmin && examTab === 'teachers' ? `
        <div class="card">
          <h3>All Teacher Examination Duties</h3>

          <div class="search-box">
            <input type="search" id="teacherDutySearch"
              placeholder="Search teacher, exam, date, hall or duty..."
              oninput="filterTeacherDuties()">
          </div>

          <p class="mut" id="teacherDutyCount">
            Showing ${duty.length} teacher duties
          </p>

          <div class="ov">
            <table id="teacherDutyTable">
              <tr>
                <th>Teacher</th>
                <th>Subject</th>
                <th>Date</th>
                <th>Hall</th>
                <th>Duty</th>
              </tr>
              ${duty.map(d => {
                const x = exams.find(a => a.id === d.examId);
                return `
                  <tr data-search="${e(`${d.teacher} ${x?.s || ''} ${x?.d || d.date || ''} ${d.hall} ${d.type || ''}`).toLowerCase()}">
                    <td>${e(d.teacher)}</td>
                    <td>${e(x?.s || 'Exam unavailable')}</td>
                    <td>${e(x?.d || d.date || 'Not set')}</td>
                    <td>${e(d.hall)}</td>
                    <td>${e(d.type || 'Invigilator')}</td>
                  </tr>
                `;
              }).join('')}
            </table>
          </div>

          <p id="noTeacherDuties" class="mut" hidden>
            No matching teacher duties found.
          </p>
        </div>
      ` : ''}

      ${isAdmin && examTab === 'records' ? records : ''}

      ${!isAdmin && examPublicTab === 'records' ? records : ''}

      ${!isAdmin && examPublicTab === 'personal' && isStudent ? `
        <div class="card">
          <h3>My Examination Schedule</h3>
          ${mySeats.length ? `
            <div class="ov"><table>
              <tr><th>Subject</th><th>Date</th><th>Time</th><th>Hall</th><th>Seat</th></tr>
              ${mySeats.map(s => {
                const x = exams.find(a => a.id === s.examId);
                return x ? `
                  <tr>
                    <td>${e(x.s)}</td>
                    <td>${e(x.d)}</td>
                    <td>${e(x.time)}</td>
                    <td>${e(s.hall)}</td>
                    <td>${e(s.seat)}</td>
                  </tr>
                ` : '';
              }).join('')}
            </table></div>
          ` : '<p class="mut">No seating assigned yet.</p>'}
        </div>
      ` : ''}

      ${!isAdmin && examPublicTab === 'personal' && isTeacher ? `
        <div class="card">
          <h3>My Examination Duties</h3>
          ${myDuties.length ? myDuties.map(d => {
            const x = exams.find(a => a.id === d.examId);
            return `
              <div class="it">
                <b>${e(x?.s || 'Examination')}</b>
                <p>${e(x?.d || d.date || 'Date not set')} · ${e(x?.time || d.time || '')}</p>
                <p>Hall: ${e(d.hall)} · Duty: ${e(d.type || 'Invigilator')}</p>
              </div>
            `;
          }).join('') : '<p class="mut">No duties assigned yet.</p>'}
        </div>
      ` : ''}
    `;
  },

  // --- Admin: users and roles ---
   // --- Admin: users and roles ---

users: () => {
  const tabs = [
    ['admins', 'Admins'],
    ['teachers', 'Teachers'],
    ['students', 'Students']
  ];

  const list = users.filter((u) => {
    if (usersTab === 'admins') return u.r === 'Admin';
    if (usersTab === 'teachers') return u.r === 'Teacher';
    return ['Student', 'Student (CR)'].includes(u.r);
  });

  return `
    <h2>Users &amp; roles</h2>

    <div class="tabs">
      ${tabs.map(([id, label]) => `
        <button
          class="${usersTab === id ? 'on' : ''}"
          onclick="usersTab='${id}';render()"
        >
          ${label}
        </button>
      `).join('')}
    </div>

    <div style="margin-top:24px">
      <h3>
        ${
          usersTab === 'admins'
            ? 'Admin accounts'
            : usersTab === 'teachers'
              ? 'Teacher accounts'
              : 'Student accounts'
        }
      </h3>

      <div class="row" style="margin-bottom:14px">
        <input
          id="userSearch"
          type="search"
          placeholder="Search by name, email or role..."
          oninput="filterUsers()"
          style="width:100%"
        >
      </div>

      <p class="mut" id="userCount">
        Showing ${list.length} accounts
      </p>

      <div class="card ov">
        <table id="userTable">
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Account</th>
          </tr>

          ${list.map((u) => {
            const i = users.indexOf(u);

            return `
              <tr data-search="${e(
                `${u.n} ${u.e} ${u.r}`
              ).toLowerCase()}">
                <td>${e(u.n)}</td>
                <td>${e(u.e)}</td>
                <td>
                  ${
                    usersTab === 'admins'
                      ? 'Admin'
                      : `
                        <select onchange="setRole(${i},this.value)">
                          ${['Student','Student (CR)','Teacher']
                            .map(r => `
                              <option ${r === u.r ? 'selected' : ''}>
                                ${r}
                              </option>
                            `).join('')}
                        </select>
                      `
                  }
                </td>
                <td>
                  ${
                    usersTab === 'admins'
                      ? 'View only'
                      : `
                        <button class="btn s g"
                          onclick="resetPw(${i})">
                          Reset password
                        </button>

                        <button class="btn s g"
                          onclick="toggleAcc(${i})">
                          ${u.off ? 'Restore' : 'Revoke'}
                        </button>
                      `
                  }
                </td>
              </tr>
            `;
          }).join('')}
        </table>

        <p id="noUsers" class="mut" hidden>
          No matching users found.
        </p>
      </div>
    </div>
  `;
},
  

 
// --- Admin: security log ---
security: () => `
  <h2>Security log</h2>

  <div class="search-box">
    <input
      type="search"
      id="securitySearch"
      placeholder="Search by user, time or action..."
      oninput="filterSecurityLogs()"
    />
  </div>

  <p id="securityCount">Showing ${log.length} security logs</p>

  <div class="card ov">
    <table id="securityTable">
      <tr>
        <th>Time</th>
        <th>Who</th>
        <th>Action</th>
      </tr>

      ${log.map((l) => `
        <tr data-search="${e(`${l[0]} ${l[1]} ${l[2]}`).toLowerCase()}">
          <td>${e(l[0])}</td>
          <td>${e(l[1])}</td>
          <td>${e(l[2])}</td>
        </tr>
      `).join('')}
    </table>

    <p id="noSecurityLogs" hidden>No matching security logs found.</p>
  </div>

  <p class="mut">
    Passwords are hashed. Admins can reset or revoke accounts
    but can never read a password.
  </p>
`,
// --- Admin: data and backup ---
  data: () =>
    `<h2>Data &amp; backup</h2><div class="grid">${[
      ['users', users.length],
      ['lost_items', items.length],
      ['reports', reps.length],
      ['groups', groups.length],
      ['exams', exams.length],
      ['duty_roster', duty.length],
      ['contact_messages', msgs.length]
    ]
      .map((t) => `<div class="card"><h3>${t[0]}</h3><p class="mut">${t[1]} records</p></div>`)
      .join(
        ''
      )}</div><p><button class="btn" onclick="L(me.n,'Backup created');toast('Backup created')">Create backup</button></p>`
};


async function addRep() {
  if (!v('rp').trim() || !v('rd').trim()) {
    return toast('Add the place and details.');
  }

  const file = $('#rf')?.files?.[0];
  let photo = '';

  if (file) {
    if (!file.type.startsWith('image/')) {
      return toast('Please select a valid image.');
    }

    if (file.size > 5 * 1024 * 1024) {
      return toast('Image must be smaller than 5 MB.');
    }

    try {
      photo = await readImage(file);
    } catch (error) {
      return toast('Unable to read the photo.');
    }
  }

const report = {
  id: Date.now(),
  c: v('rc'),
  p: v('rp').trim(),
  d: v('rd').trim(),
  by: me.n,
  byEmail: me.e,
  s: 'Pending Assignment',
  tm: '',
  img: photo
};

  reps.unshift(report);

  L(me.n, 'Submitted report: ' + report.c);
  save();

  toast('Report submitted successfully');
  render();
}



function filterReports() {
  const query = v('reportSearch').trim().toLowerCase();

  const rows = document.querySelectorAll(
    '.two .card tr[data-search]'
  );

  let visible = 0;

  rows.forEach((row) => {
    const match = row.dataset.search.includes(query);
    row.hidden = !match;

    if (match) visible++;
  });

  const count = $('#reportCount');
  const empty = $('#noReports');

  if (count) {
    count.textContent = `Showing ${visible} reports`;
  }

  if (empty) {
    empty.hidden = visible !== 0;
  }
}



function assignReportTeam(id, team) {
  if (rl() !== 'Admin') {
    return toast('Admin access required.');
  }

  const report = reps.find((r) => r.id == id);

  if (!report || report.s === 'Resolved') return;

  report.tm = team;

  if (team) {
    report.s = 'Assigned';
  } else {
    report.s = 'Pending Assignment';
  }

  L(me.n, 'Team assignment updated for report: ' + id);

  save();

  toast(team ? 'Team assigned successfully' : 'Team assignment removed');

  render();
}



function updateReportStatus(id, status) {
  if (rl() !== 'Admin') {
    return toast('Admin access required.');
  }

  const report = reps.find((r) => r.id == id);

  if (!report || report.s === 'Resolved') return;

  if (!report.tm) {
    report.s = 'Pending Assignment';
    save();
    toast('Assign a team first.');
    render();
    return;
  }

  const allowed = {
    'Assigned': ['In Progress'],
    'In Progress': ['Resolved']
  };

  if (!allowed[report.s]?.includes(status)) {
    toast('Invalid report status transition.');
    render();
    return;
  }

  report.s = status;

  L(me.n, 'Report status changed to ' + status);

  save();

  toast('Status updated');

  render();
}





function filterLostItems() {
  const query = v('lostSearch').trim().toLowerCase();

  const cards = document.querySelectorAll(
    '.card .it[data-search]'
  );

  let visible = 0;

  cards.forEach((card) => {
    const match = card.dataset.search.includes(query);
    card.hidden = !match;
    if (match) visible++;
  });

  const count = $('#lostCount');
  if (count) count.textContent = `Showing ${visible} items`;
}

function filterSecurityLogs() {
  const query = v('securitySearch').trim().toLowerCase();

  const rows = document.querySelectorAll(
    '#securityTable tr[data-search]'
  );

  let visible = 0;

  rows.forEach((row) => {
    const match = row.dataset.search.includes(query);

    row.hidden = !match;

    if (match) visible++;
  });

  const count = $('#securityCount');
  const empty = $('#noSecurityLogs');

  if (count) {
    count.textContent = `Showing ${visible} security logs`;
  }

  if (empty) {
    empty.hidden = visible !== 0;
  }
}

function filterUsers() {
  const query = v('userSearch').trim().toLowerCase();
  const rows = document.querySelectorAll(
    '#userTable tr[data-search]'
  );

  let visible = 0;

  rows.forEach((row) => {
    const match = row.dataset.search.includes(query);

    row.hidden = !match;

    if (match) visible++;
  });

  const count = $('#userCount');
  const empty = $('#noUsers');

  if (count) {
    count.textContent = `Showing ${visible} accounts`;
  }

  if (empty) {
    empty.hidden = visible !== 0;
  }
}

// ===== EXAMINATION SEARCH FILTERS =====

function filterExamRecords() {
  const query = v('examRecordSearch').trim().toLowerCase();
  const rows = document.querySelectorAll('#examRecordTable tr[data-search]');
  let visible = 0;

  rows.forEach(row => {
    const match = row.dataset.search.includes(query);
    row.hidden = !match;
    if (match) visible++;
  });

  const count = $('#examRecordCount');
  const empty = $('#noExamRecords');

  if (count) count.textContent = `Showing ${visible} examination records`;
  if (empty) empty.hidden = visible !== 0;
}

function filterStudentSeats() {
  const query = v('studentSeatSearch').trim().toLowerCase();
  const rows = document.querySelectorAll('#studentSeatTable tr[data-search]');
  let visible = 0;

  rows.forEach(row => {
    const match = row.dataset.search.includes(query);
    row.hidden = !match;
    if (match) visible++;
  });

  const count = $('#studentSeatCount');
  const empty = $('#noStudentSeats');

  if (count) count.textContent = `Showing ${visible} seating records`;
  if (empty) empty.hidden = visible !== 0;
}

function filterTeacherDuties() {
  const query = v('teacherDutySearch').trim().toLowerCase();
  const rows = document.querySelectorAll('#teacherDutyTable tr[data-search]');
  let visible = 0;

  rows.forEach(row => {
    const match = row.dataset.search.includes(query);
    row.hidden = !match;
    if (match) visible++;
  });

  const count = $('#teacherDutyCount');
  const empty = $('#noTeacherDuties');

  if (count) count.textContent = `Showing ${visible} teacher duties`;
  if (empty) empty.hidden = visible !== 0;
}

// Search inside Manage Created Examinations
function filterManageExams() {
  const query = v('manageExamSearch').trim().toLowerCase();
  const rows = document.querySelectorAll('.manage-exam-row');
  let count = 0;

  rows.forEach(row => {
    const match = row.dataset.search.includes(query);
    row.hidden = !match;
    if (match) count++;
  });

  const label = $('#manageExamCount');
  if (label) label.textContent = `Showing ${count} examinations`;
}

// Search inside Manage Teacher Duties
function filterManageDuties() {
  const query = v('manageDutySearch').trim().toLowerCase();
  const rows = document.querySelectorAll('.manage-duty-row');
  let count = 0;

  rows.forEach(row => {
    const match = row.dataset.search.includes(query);
    row.hidden = !match;
    if (match) count++;
  });

  const label = $('#manageDutyCount');
  if (label) label.textContent = `Showing ${count} teacher duties`;
}
// ===== EDIT AND DELETE EXAMINATIONS =====
function editExam(id) {
  if (rl() !== 'Admin') {
    return toast('Admin access required.');
  }

  const exam = exams.find(x => x.id === id);
  if (!exam) return toast('Examination not found.');

  editingExamId = id;
  examTab = 'create';

  render();

  // Fill the existing examination details
  $('#examSubject').value = exam.s || '';
  $('#examDate').value = /^\d{4}-\d{2}-\d{2}$/.test(exam.d)
    ? exam.d
    : '';

   $('#examTime').value = /^\d{2}:\d{2}$/.test(exam.time)
    ? exam.time
    : '';

  $('#examYear').value = String(exam.year || 1);

  $('#examCreateForm')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });

  toast('Edit the details and click Update Examination.');
}

function editExamDuty(id) {
  if (rl() !== 'Admin') {
    return toast('Admin access required.');
  }

  const d = duty.find(x => x.id === id);
  if (!d) return toast('Teacher duty not found.');

  editingDutyId = id;
  editingExamId = null;
  examTab = 'create';

  render();

  const teacherField = $('#dutyTeacher');
  const examField = $('#dutyExam');
  const hallField = $('#dutyHall');
  const typeField = $('#dutyType');

  if (teacherField) teacherField.value = d.teacher;
  if (examField) examField.value = String(d.examId);
  if (hallField) hallField.value = d.hall || '';
  if (typeField) typeField.value = d.type || 'Invigilator';

  $('#teacherDutyForm')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
}

function deleteExamDuty(id) {
  if (rl() !== 'Admin') {
    return toast('Admin access required.');
  }

  const index = duty.findIndex(d => d.id === id);
  if (index === -1) return toast('Teacher duty not found.');

  if (!confirm('Are you sure you want to delete this teacher duty?')) {
    return;
  }

  duty.splice(index, 1);

  L(me.n, 'Deleted examination teacher duty');
  save();
  toast('Teacher duty deleted successfully');
  render();
}

function deleteExam(id) {
  if (rl() !== 'Admin') {
    return toast('Admin access required.');
  }

  const exam = exams.find(x => x.id === id);
  if (!exam) return toast('Examination not found.');

  if (!confirm(
    `Delete ${exam.s}? Its student seating and teacher duties will also be deleted.`
  )) return;

  exams.splice(exams.indexOf(exam), 1);

  for (let i = examSeating.length - 1; i >= 0; i--) {
    if (examSeating[i].examId === id) examSeating.splice(i, 1);
  }

  for (let i = duty.length - 1; i >= 0; i--) {
    if (duty[i].examId === id) duty.splice(i, 1);
  }

  L(me.n, 'Deleted examination: ' + exam.s);
  save();
  toast('Examination and linked assignments deleted');
  render();
}

// ===== AI-ASSISTED SEATING CHART OCR =====

let seatingImportRows = [];
let seatingImportExamId = null;

// Load OCR/PDF libraries only when needed
function loadExternalScript(src) {
  return new Promise((resolve, reject) => {
    const existing = [...document.scripts].find(s => s.src === src);
    if (existing) {
      if (existing.dataset.loaded === 'yes') return resolve();
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.onload = () => {
      script.dataset.loaded = 'yes';
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function getSeatingChartText(file, status) {
  const isPDF = file.type === 'application/pdf' ||
    file.name.toLowerCase().endsWith('.pdf');

  await loadExternalScript(
    'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'
  );

  let pages = [];

  if (isPDF) {
    await loadExternalScript(
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
    );

    const pdfjs = window.pdfjsLib;
    if (!pdfjs) throw new Error('PDF reader could not be loaded.');

    pdfjs.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const data = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data }).promise;

    if (pdf.numPages > 30) {
      throw new Error('PDF has too many pages. Upload a PDF with up to 30 pages.');
    }

    for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
      status.textContent = `Preparing PDF page ${pageNo} of ${pdf.numPages}...`;

      const page = await pdf.getPage(pageNo);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: ctx, viewport }).promise;
      pages.push(canvas);
    }
  } else {
    const image = new Image();
    const imageUrl = URL.createObjectURL(file);

    try {
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
        image.src = imageUrl;
      });

      const canvas = document.createElement('canvas');
      const scale = Math.min(2, 2400 / image.width);

      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);

      canvas.getContext('2d').drawImage(
        image, 0, 0, canvas.width, canvas.height
      );

      pages.push(canvas);
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  }

  const worker = await Tesseract.createWorker('eng');

  try {
    let completeText = '';

    for (let i = 0; i < pages.length; i++) {
      status.textContent =
        `Reading chart page ${i + 1} of ${pages.length}...`;

      const result = await worker.recognize(pages[i]);
      completeText += '\n' + result.data.text;
    }

    return completeText;
  } finally {
    await worker.terminate();
  }
}


// Read uploaded chart and prepare editable preview
async function readSeatingChart() {
  if (rl() !== 'Admin') {
    return toast('Admin access required.');
  }

  const file = $('#seatingChartFile')?.files?.[0];
  const examId = Number(v('aiSeatExam'));
  const exam = exams.find(x => x.id === examId);
  const status = $('#seatingOcrStatus');
  const preview = $('#seatingOcrPreview');

  if (!file || !exam) {
    return toast('Select an examination and upload its seating chart.');
  }

  const allowed = [
    'application/pdf',
    'image/jpeg',
    'image/png'
  ];

  if (!allowed.includes(file.type) && !/\.(pdf|jpg|jpeg|png)$/i.test(file.name)) {
    return toast('Only PDF, JPG and PNG files are supported.');
  }

  if (file.size > 15 * 1024 * 1024) {
    return toast('File size must be below 15 MB.');
  }

  status.textContent = 'Starting chart recognition...';
  preview.innerHTML = '';

  try {
    const text = await getSeatingChartText(file, status);

    seatingImportExamId = examId;
    seatingImportRows = parseSeatingChartText(text);

    if (!seatingImportRows.length) {
      preview.innerHTML = `
        <p class="mut">
          No seating rows could be confidently identified.
          Check the chart quality and try a clearer file.
        </p>
        <label>Recognized text — review manually</label>
        <textarea id="seatingRawText" rows="10"
          style="width:100%">${e(text)}</textarea>
      `;
      status.textContent = 'Recognition completed; manual review required.';
      return;
    }

    renderSeatingImportPreview();
    status.textContent =
      `Recognition completed. ${seatingImportRows.length} possible records found.`;
  } catch (error) {
    console.error(error);
    status.textContent = 'Chart recognition failed.';
    toast(error.message || 'Unable to read the uploaded chart.');
  }
}


// Initial text parser. Admin can correct every field in the preview.
function parseSeatingChartText(text) {
  const lines = text
    .split(/\r?\n/)
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const rows = [];

  lines.forEach(line => {
    // Looks for roll-number-like numeric identifiers in each OCR line.
    const rollMatch = line.match(/\b\d{4,12}\b/);
    if (!rollMatch) return;

    const rollNo = rollMatch[0];
    const rest = line.replace(rollNo, ' ').trim();

    // Common seat patterns: A-01, B14, 12, Seat 12, etc.
    const seatMatch = rest.match(
      /\b(?:seat\s*)?([A-Z]{1,3}[- ]?\d{1,3}|\d{1,3})\b/i
    );

    // Common hall patterns: Hall 1, Room 204, Block A, etc.
    const hallMatch = line.match(
      /\b(?:hall|room|block|centre|center)\s*[-:#]?\s*[A-Z0-9-]+\b/i
    );

    rows.push({
      rollNo,
      hall: hallMatch ? hallMatch[0] : '',
      seat: seatMatch ? seatMatch[1] : '',
      raw: line
    });
  });

  // Remove duplicate roll numbers from OCR output.
  const unique = new Map();
  rows.forEach(row => {
    if (!unique.has(row.rollNo)) unique.set(row.rollNo, row);
  });

  return [...unique.values()];
}


// Match extracted roll numbers to student accounts and show editable rows.
function renderSeatingImportPreview() {
  const preview = $('#seatingOcrPreview');
  if (!preview) return;

  preview.innerHTML = `
    <h3>Review Extracted Seating Records</h3>
    <p class="mut">
      Verify roll numbers, student matches, halls and seats before publishing.
    </p>

    <div class="ov">
      <table>
        <tr>
          <th>Roll Number</th>
          <th>Student Account</th>
          <th>Hall</th>
          <th>Seat</th>
        </tr>

        ${seatingImportRows.map((row, index) => {
          const matches = users.filter(u =>
            u.r.startsWith('Student') &&
            !u.off &&
            String(u.rollNo || '').trim().toLowerCase() ===
              row.rollNo.toLowerCase()
          );

          return `
            <tr>
              <td>
                <input id="ocrRoll${index}" value="${e(row.rollNo)}">
              </td>
              <td>
                <select id="ocrStudent${index}">
                  <option value="">Select matched student</option>
                  ${matches.map(u => `
                    <option value="${e(u.e)}">${e(u.n)} (${e(u.e)})</option>
                  `).join('')}
                </select>
                ${matches.length ? '' : '<span class="mut">No roll number match</span>'}
              </td>
              <td>
                <input id="ocrHall${index}" value="${e(row.hall)}">
              </td>
              <td>
                <input id="ocrSeat${index}" value="${e(row.seat)}">
              </td>
            </tr>
          `;
        }).join('')}
      </table>
    </div>

    <button class="btn" onclick="publishSeatingImport()">
      Publish Verified Seating
    </button>
  `;
}


// Save only after Admin review.
function publishSeatingImport() {
  if (rl() !== 'Admin') {
    return toast('Admin access required.');
  }

  const exam = exams.find(x => x.id === seatingImportExamId);
  if (!exam || !seatingImportRows.length) {
    return toast('No seating chart is ready to publish.');
  }

  const approved = [];
  const usedRolls = new Set();
  const usedSeats = new Set();

  for (let i = 0; i < seatingImportRows.length; i++) {
    const rollNo = v('ocrRoll' + i).trim();
    const email = v('ocrStudent' + i);
    const hall = v('ocrHall' + i).trim();
    const seat = v('ocrSeat' + i).trim();

    const student = users.find(u =>
      u.e === email && u.r.startsWith('Student') && !u.off
    );

    if (!rollNo || !student || !hall || !seat) {
      return toast(`Please complete or match seating row ${i + 1}.`);
    }

    const rollKey = rollNo.toLowerCase();
    const seatKey = `${hall.toLowerCase()}|${seat.toLowerCase()}`;

    if (usedRolls.has(rollKey)) {
      return toast(`Duplicate roll number: ${rollNo}`);
    }

    if (usedSeats.has(seatKey)) {
      return toast(`Duplicate seat: ${hall} / ${seat}`);
    }

    usedRolls.add(rollKey);
    usedSeats.add(seatKey);

    approved.push({
      id: Date.now() + i,
      year: exam.year,
      examId: exam.id,
      rollNo,
      student: student.n,
      email: student.e,
      hall,
      seat
    });
  }

  // Replace only seating for the selected exam.
  for (let i = examSeating.length - 1; i >= 0; i--) {
    if (examSeating[i].examId === exam.id) {
      examSeating.splice(i, 1);
    }
  }

  examSeating.push(...approved);

  L(me.n, `Published ${approved.length} seating records for ${exam.s}`);
  save();

  seatingImportRows = [];
  seatingImportExamId = null;

  toast(`${approved.length} student seating records published.`);
  render();
}
// ===== EXAMINATION ACTION FUNCTIONS =====

// 1. Admin creates a new examination
function createExam() {
  if (rl() !== 'Admin') {
    return toast('Admin access required.');
  }

  const subject = v('examSubject').trim();
  const date = v('examDate');
  const time = v('examTime');
  const year = Number(v('examYear'));

  if (!subject || !date || !time) {
    return toast('Please fill all examination details.');
  }

  if (![1, 2, 3, 4].includes(year)) {
    return toast('Select a valid year.');
  }

  // Update existing exam
  if (editingExamId !== null) {
    const exam = exams.find(x => x.id === editingExamId);

    if (!exam) {
      editingExamId = null;
      return toast('Examination not found.');
    }

    exam.s = subject;
    exam.d = date;
    exam.time = time;
    exam.year = year;

    examSeating
      .filter(s => s.examId === editingExamId)
      .forEach(s => s.year = year);

    duty
      .filter(d => d.examId === editingExamId)
      .forEach(d => d.year = year);

    L(me.n, 'Updated examination: ' + subject);

    editingExamId = null;
    save();
    toast('Examination updated successfully');
    render();
    return;
  }

  // Create new exam
  exams.push({
    id: Date.now(),
    year,
    s: subject,
    d: date,
    time
  });

  L(me.n, 'Created examination: ' + subject);
  save();
  toast('Examination created successfully');
  render();
}


// 2. Admin assigns a hall and seat to a student
function assignExamSeat() {
  if (rl() !== 'Admin') {
    return toast('Admin access required.');
  }

  const examId = Number(v('seatExam'));
  const email = v('seatStudent');
  const hall = v('seatHall').trim();
  const seat = v('seatNumber').trim();

  const exam = exams.find(x => x.id === examId);
  const student = users.find(
    u => u.e === email && u.r.startsWith('Student') && !u.off
  );

  if (!exam || !student || !hall || !seat) {
    return toast('Please fill all seating details.');
  }

  // Prevent assigning the same seat to two students in the same exam and hall
  const occupied = examSeating.find(
    s =>
      s.examId === examId &&
      s.hall.toLowerCase() === hall.toLowerCase() &&
      s.seat.toLowerCase() === seat.toLowerCase() &&
      s.email !== email
  );

  if (occupied) {
    return toast('This seat is already assigned to another student.');
  }

  // Update existing assignment instead of creating duplicates
  const existing = examSeating.find(
    s => s.examId === examId && s.email === email
  );

  if (existing) {
    existing.hall = hall;
    existing.seat = seat;
    existing.year = exam.year;
    existing.student = student.n;
  } else {
    examSeating.push({
      id: Date.now(),
      year: exam.year,
      examId,
      student: student.n,
      email: student.e,
      hall,
      seat
    });
  }

  L(me.n, 'Assigned exam seat to ' + student.n);
  save();
  toast('Student hall and seat assigned successfully');
  render();
}


// 3. Admin assigns examination duty to a teacher
function assignExamDuty() {
  if (rl() !== 'Admin') {
    return toast('Admin access required.');
  }

  const teacherName = v('dutyTeacher');
  const examId = Number(v('dutyExam'));
  const hall = v('dutyHall').trim();
  const type = v('dutyType');

  const teacher = users.find(
    u => u.n === teacherName && u.r === 'Teacher' && !u.off
  );

  const exam = exams.find(x => x.id === examId);

  if (!teacher || !exam || !hall || !type) {
    return toast('Please fill all teacher duty details.');
  }

  // Update existing duty
  if (editingDutyId !== null) {
    const existing = duty.find(d => d.id === editingDutyId);

    if (!existing) {
      editingDutyId = null;
      return toast('Teacher duty not found.');
    }

    existing.teacher = teacherName;
    existing.examId = examId;
    existing.year = exam.year;
    existing.hall = hall;
    existing.type = type;

    editingDutyId = null;

    L(me.n, 'Updated teacher examination duty');
    save();
    toast('Teacher duty updated successfully');
    render();
    return;
  }

  // Avoid duplicate assignment for the same teacher and exam
  const duplicate = duty.find(
    d => d.examId === examId && d.teacher === teacherName
  );

  if (duplicate) {
    return toast('This teacher already has duty for this exam. Use Edit instead.');
  }

  duty.push({
    id: Date.now(),
    examId,
    year: exam.year,
    teacher: teacherName,
    hall,
    type
  });

  L(me.n, 'Assigned examination duty to ' + teacherName);
  save();
  toast('Teacher duty assigned successfully');
  render();
}


// 4. Student submits an examination correction request
function requestExamCorrection() {
  if (!['Student', 'Teacher'].includes(rl())) {
    return toast('Student or Teacher access required.');
  }

  const selectedExam = v('correctionExam');
  const examId = selectedExam ? Number(selectedExam) : null;
  const message = v('correctionMessage').trim();

  const exam = examId
    ? exams.find(x => x.id === examId)
    : null;

  if (examId && !exam) {
    return toast('Selected examination not found.');
  }

  if (!message) {
    return toast('Please describe the examination mistake.');
  }

  const alreadyPending = examRequests.some(r =>
    r.email === me.e &&
    r.examId === examId &&
    r.status === 'Pending'
  );

  if (alreadyPending) {
    return toast('You already have a pending report for this examination.');
  }

  const report = {
    id: Date.now(),
    examId,
    person: me.n,
    student: me.n,
    role: rl(),
    email: me.e,
    subject: exam ? exam.s : 'General Examination Issue',
    message,
    status: 'Pending',
    date: new Date().toLocaleString()
  };

  examRequests.unshift(report);

  L(me.n, 'Reported examination mistake: ' + report.subject);
  save();
  toast('Mistake report submitted successfully');
  render();
}


// 5. Admin resolves a student's correction request
function resolveExamRequest(id) {
  if (rl() !== 'Admin') {
    return toast('Admin access required.');
  }

  const request = examRequests.find(r => r.id === id);

  if (!request) {
    return toast('Correction request not found.');
  }

  if (request.status === 'Resolved') {
    return toast('This request is already resolved.');
  }

  request.status = 'Resolved';
  request.resolvedBy = me.n;
  request.resolvedAt = new Date().toLocaleString();

  L(me.n, 'Resolved exam correction request: ' + id);
  save();
  toast('Correction request marked as resolved');
  render();
}
// ===== 6. ACTIONS (what the buttons do) =====

function togglePassword() {
  const input = $('#lp');
  const eye = $('#password-eye');
  const button = $('.password-toggle');

  if (!input || !eye) return;

  const show = input.type === 'password';

  input.type = show ? 'text' : 'password';
  eye.textContent = show ? '◎' : '◉';
  button.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  button.title = show ? 'Hide password' : 'Show password';
}

async function login() {
  const em = v('le').trim().toLowerCase();
  const pw = v('lp');

  if (!em || !pw) {
    return toast('Enter your official email and password.');
  }

  const h = await sha(pw);
  const u = users.find((x) => x.e.toLowerCase() === em && x.h === h);

  if (!u) {
    return toast('Email or password is incorrect.');
  }

  if (u.off) {
    return toast('This account is inactive. Contact the admin office.');
  }

  me = { n: u.n, e: u.e, r: u.r };

  L(em, 'Logged in');
  save();
  location.href = F.dashboard;
}

function setRole(i, r) {
  if (rl() !== 'Admin') {
    return toast('Admin access required.');
  }

  const u = users[i];

  if (!u || u.r === 'Admin') {
    return toast('Admin accounts cannot be modified.');
  }

  if (!['Student', 'Student (CR)', 'Teacher'].includes(r)) {
    return toast('Invalid role.');
  }

  u.r = r;

  L(me.n, 'Role changed: ' + u.n + ' to ' + r);

  toast('Role updated');
  render();
}
async function resetPw(i) {
  if (rl() !== 'Admin') {
    return toast('Admin access required.');
  }

  const u = users[i];

  if (!u || u.r === 'Admin') {
    return toast('Admin accounts cannot be modified.');
  }

  u.h = await sha('campus@123');

  L(me.n, 'Password reset: ' + u.e);

  toast('Temporary password set: campus@123');
}
function toggleAcc(i) {
  if (rl() !== 'Admin') {
    return toast('Admin access required.');
  }

  const u = users[i];

  if (!u || u.r === 'Admin') {
    return toast('Admin accounts cannot be modified.');
  }

  if (u.e === me.e) {
    return toast('You cannot revoke your own account.');
  }

  u.off = !u.off;

  L(
    me.n,
    (u.off ? 'Access revoked: ' : 'Access restored: ') + u.e
  );

  toast(u.off ? 'Access revoked' : 'Access restored');

  render();
}
function sendMsg() {
  if (!v('cn') || !v('cm')) return toast('Add your name and a message.');
  msgs.unshift({ n: v('cn'), e: v('ce'), m: v('cm'), d: new Date().toLocaleString() });
  toast('Message sent. We reply within 2 working days.');
  render();
}
function out() {
  me = null;
  save();
  location.href = F.home;
}

async function addItem() {
  const name = v('in').trim();
  const place = v('ip').trim();
  const photoInput = $('#itemPhoto');
  const file = photoInput?.files?.[0];

  if (!name) return toast('Add the item name.');
  if (!file) return toast('Please upload an item photo.');

  if (!file.type.startsWith('image/')) {
    return toast('Please select a valid image.');
  }

  if (file.size > 5 * 1024 * 1024) {
    return toast('Image must be smaller than 5 MB.');
  }

  try {
    const photo = await readImage(file);

    items.unshift({
      id: Date.now(),
      t: tab,
      n: name,
      p: place || 'Not given',
      by: me.n,
      s: 'Open',
      img: photo
    });

    L(me.n, 'Posted ' + tab + ' item: ' + name);
    toast('Item posted successfully');
    render();
  } catch (err) {
    toast('Unable to read image. Try another photo.');
  }
}

async function resolve(id) {
  const item = items.find((x) => x.id == id);

  if (!item || item.s !== 'Open') {
    return toast('This item is not available for verification.');
  }

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';

  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return toast('Please select a valid image.');
    }

    if (file.size > 5 * 1024 * 1024) {
      return toast('Image must be smaller than 5 MB.');
    }

    try {
      item.ph = await readImage(file);
      item.s = 'Pending Verification';
      item.rb = me.n;

      L(me.n, 'Submitted handover proof: ' + item.n);
      toast('Proof submitted. Waiting for teacher/admin verification.');
      render();
    } catch (err) {
      toast('Unable to read image.');
    }
  };

  input.click();
}

function verifyItem(id) {
  if (!staff()) {
    return toast('Teacher/Admin access required.');
  }

  const item = items.find((x) => x.id == id);

  if (!item || item.s !== 'Pending Verification') {
    return toast('No pending verification found.');
  }

  item.s = 'Resolved';
  item.verifiedBy = me.n;

  L(me.n, 'Verified and resolved: ' + item.n);
  toast('Item successfully verified and resolved.');
  render();
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);

    reader.readAsDataURL(file);
  });
}

function showImage(src) {
  if (!src) return;

  // Remove an already-open image viewer
  document.getElementById('imageViewer')?.remove();

  const viewer = document.createElement('div');
  viewer.id = 'imageViewer';

  viewer.style.cssText = `
    position:fixed;
    inset:0;
    background:rgba(0,0,0,0.88);
    display:flex;
    align-items:center;
    justify-content:center;
    z-index:99999;
    padding:25px;
    cursor:zoom-out;
  `;

  const img = document.createElement('img');
  img.src = src;
  img.alt = 'Full size preview';

  img.style.cssText = `
    max-width:95vw;
    max-height:90vh;
    width:auto;
    height:auto;
    object-fit:contain;
    border-radius:6px;
    cursor:default;
    box-shadow:0 10px 40px rgba(0,0,0,0.4);
  `;

  const close = document.createElement('button');
  close.textContent = '✕';
  close.style.cssText = `
    position:absolute;
    top:20px;
    right:25px;
    background:#fff;
    color:#000;
    border:0;
    border-radius:50%;
    width:38px;
    height:38px;
    font-size:20px;
    cursor:pointer;
  `;

  viewer.appendChild(img);
  viewer.appendChild(close);
  document.body.appendChild(viewer);

  viewer.onclick = () => viewer.remove();
  close.onclick = () => viewer.remove();
  img.onclick = (event) => event.stopPropagation();
}



function assign(id, team) {
  assignReportTeam(id, team);
}


// --- Community navigation and search ---
function openCommunity(index) {
  gi = index;
  communityOpen = true;
  render();
}

function filterCommunities() {
  const query = v('communitySearch').trim().toLowerCase();
  const cards = document.querySelectorAll('.community-card');
  let visible = 0;

  cards.forEach((card) => {
    const match = card.dataset.search.includes(query);
    card.hidden = !match;
    if (match) visible++;
  });

  const count = $('#communityCount');
  if (count) count.textContent = `Showing ${visible} communities`;
}

function filterCommunityPosts() {
  const query = v('communityPostSearch').trim().toLowerCase();
  const posts = document.querySelectorAll('.community-post');
  let visible = 0;

  posts.forEach((post) => {
    const match = post.dataset.search.includes(query);
    post.hidden = !match;
    if (match) visible++;
  });

  const empty = $('#noCommunityPosts');
  if (empty) empty.hidden = visible !== 0;
}

function toggleCommunityFile() {
  const type = v('communityPostType');
  const area = $('#communityFileArea');

  if (area) {
    area.style.display =
      ['Notes', 'Assignment'].includes(type) ? 'block' : 'none';
  }
}

// --- Create and manage communities ---
function createCommunity() {
  if (rl() !== 'Teacher') {
    return toast('Only teachers can create communities.');
  }

  const name = v('newGroupName').trim();

  if (!name) return toast('Enter a community name.');

  if (groups.some((g) => g.n.toLowerCase() === name.toLowerCase())) {
    return toast('This community already exists.');
  }

  groups.push({
    n: name,
    owner: me.n,
    m: [],
    p: []
  });

  L(me.n, 'Created community: ' + name);
  save();
  toast('Community created');
  render();
}

function deleteCommunity(index) {
  if (rl() !== 'Teacher') {
    return toast('Only teachers can delete communities.');
  }

  if (!groups[index]) return;

  if (!confirm('Delete this community and all its posts?')) return;

  const name = groups[index].n;
  groups.splice(index, 1);

  gi = 0;
  communityOpen = false;

  L(me.n, 'Deleted community: ' + name);
  save();
  toast('Community deleted');
  render();
}

// --- Add and remove community members ---
function addCommunityMember() {
  if (!cr() && rl() !== 'Teacher') {
    return toast('You do not have permission to add students.');
  }

  const value = v('communityMember').trim().toLowerCase();
  if (!value) return toast('Enter a student name or email.');

  const user = users.find((u) =>
    (u.n.toLowerCase() === value || u.e.toLowerCase() === value) &&
    u.r.startsWith('Student') &&
    !u.off
  );

  if (!user) {
    return toast('Registered active student not found.');
  }

  const group = groups[gi];

  if (group.m.includes(user.n)) {
    return toast('Student is already in this community.');
  }

  group.m.push(user.n);

  L(me.n, 'Added ' + user.n + ' to ' + group.n);
  save();
  toast('Student added to community');
  render();
}

function removeCommunityMember(groupIndex, memberIndex) {
  if (rl() !== 'Teacher') {
    return toast('Only teachers can remove members.');
  }

  const group = groups[groupIndex];
  if (!group || !group.m[memberIndex]) return;

  const name = group.m[memberIndex];
  group.m.splice(memberIndex, 1);

  L(me.n, 'Removed ' + name + ' from ' + group.n);
  save();
  toast('Student removed');
  render();
}

// --- Publish community posts and notes ---
async function addCommunityPost() {
  const type = v('communityPostType');
  const message = v('communityPostText').trim();

  const teacher = rl() === 'Teacher';
  const admin = rl() === 'Admin';
  const representative = cr();
  const student = rl() === 'Student' && !representative;

  const permissions = {
    Teacher: ['Announcement', 'Notes', 'Assignment', 'Discussion'],
    CR: ['Announcement'],
    Student: ['Notes', 'Discussion'],
    Admin: ['Announcement']
  };

  const role = teacher ? 'Teacher'
    : admin ? 'Admin'
    : representative ? 'CR'
    : student ? 'Student' : '';

  if (!permissions[role]?.includes(type)) {
    return toast('You do not have permission for this post type.');
  }

  if (!message) return toast('Write a message or description.');

  const needsFile = ['Notes', 'Assignment'].includes(type);
  const file = needsFile ? $('#communityFile')?.files?.[0] : null;

  if (needsFile && !file) {
    return toast('Please attach the file.');
  }

  let fileData = '';
  let fileName = '';

  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      return toast('File must be smaller than 5 MB.');
    }

    try {
      fileData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });

      fileName = file.name;
    } catch (error) {
      return toast('Unable to read the attachment.');
    }
  }

  groups[gi].p.unshift({
    k: type,
    x: message,
    b: me.n,
    fileName,
    fileData,
    date: new Date().toLocaleString()
  });

  L(me.n, 'Posted ' + type + ' in ' + groups[gi].n);
  save();
  toast(type + ' published successfully');
  render();
}

// --- Delete community posts ---
function deleteCommunityPost(groupIndex, postIndex) {
  const group = groups[groupIndex];
  const post = group?.p?.[postIndex];

  if (!post) return;

  const teacher = rl() === 'Teacher';
  const ownPost = post.b === me.n;

  if (!teacher && !ownPost) {
    return toast('You can only delete your own posts.');
  }

  if (rl() === 'Admin' && post.k !== 'Announcement') {
    return toast('Admin can manage only their own announcements.');
  }

  if (!confirm('Delete this post?')) return;

  group.p.splice(postIndex, 1);

  L(me.n, 'Deleted a community post in ' + group.n);
  save();
  toast('Post deleted');
  render();
}

// ===== 7. DRAW THE PAGE =====
// Checks login and role, builds the menu, then shows the page content.
function render() {
  if (me) {
    const u = users.find((x) => x.e == me.e);
    me = !u || u.off ? null : { n: u.n, e: u.e, r: u.r };
  }
  save();
  const h = document.body.dataset.p || 'home',
    pub = ['home', 'about', 'contact', 'login'];
  if (!me && !pub.includes(h)) return location.replace(F.login);
  if (me && h == 'login') return location.replace(F.dashboard);
  if (['users', 'security', 'data'].includes(h) && rl() != 'Admin')
    return location.replace(F.dashboard);
  const ln = me
    ? [
        ['dashboard', 'Dashboard'],
        ['lost', 'Lost &amp; found'],
        ['reports', 'Reports'],
        ['community', 'Community'],
        ['exam', 'Exams']
      ].concat(
        rl() == 'Admin'
          ? [
              ['users', 'Users'],
              ['security', 'Security'],
              ['data', 'Data']
            ]
          : []
      )
    : [
        ['home', 'Home'],
        ['about', 'About'],
        ['contact', 'Contact'],
        ['login', 'Login']
      ];
  $('#nv').innerHTML =
    ln.map((l) => `<a href="${F[l[0]]}" class="${l[0] == h ? 'on' : ''}">${l[1]}</a>`).join('') +
    (me ? '<a href="#" onclick="out();return false">Log out</a>' : '');
  const c = (V[h] || V.home)();
  $('#m').innerHTML = h == 'home' ? c : `<div class="wrap">${c}</div>`;
  save();
}
render();
