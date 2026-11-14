const test = require("node:test");
const assert = require("node:assert/strict");

test("campus slug validation rules", () => {
  const validSlugs = ["skit", "manipal-jaipur", "iit-delhi", "campus123"];
  const invalidSlugs = ["SKIT", "campus_name", "campus name", "-leading", "trailing-", "special@char"];

  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  for (const s of validSlugs) {
    assert.ok(slugRegex.test(s), `Expected '${s}' to be a valid slug`);
  }

  for (const s of invalidSlugs) {
    assert.ok(!slugRegex.test(s), `Expected '${s}' to be an invalid slug`);
  }
});

test("student registration field constraints", () => {
  const validateStudentInput = (body) => {
    const { name, email, password } = body;
    if (!name || !email || !password) return { valid: false, error: "Missing required fields" };
    if (password.length < 8) return { valid: false, error: "Password must be at least 8 characters" };
    if (!/^\S+@\S+\.\S+$/.test(email)) return { valid: false, error: "Invalid email" };
    return { valid: true };
  };

  assert.equal(validateStudentInput({ name: "Aarav", email: "aarav@skit.ac.in", password: "short" }).valid, false);
  assert.equal(validateStudentInput({ name: "", email: "aarav@skit.ac.in", password: "securepassword123" }).valid, false);
  assert.equal(validateStudentInput({ name: "Aarav", email: "invalid-email", password: "securepassword123" }).valid, false);
  assert.equal(validateStudentInput({ name: "Aarav", email: "aarav@skit.ac.in", password: "securepassword123" }).valid, true);
});

test("community post-type role permissions enforcement", () => {
  const permissions = {
    Teacher: ["Announcement", "Notes", "Assignment", "Discussion"],
    Admin: ["Announcement"],
    "Student CR": ["Notes", "Discussion"],
    Student: ["Notes", "Discussion"]
  };

  // Student CR must NOT have Assignment permissions
  assert.ok(!permissions["Student CR"].includes("Assignment"));
  // Student must NOT have Assignment permissions
  assert.ok(!permissions["Student"].includes("Assignment"));
  // Admin must ONLY have Announcement permissions
  assert.deepEqual(permissions["Admin"], ["Announcement"]);
  // Teacher has full post-type permissions
  assert.ok(permissions["Teacher"].includes("Assignment"));
  assert.ok(permissions["Teacher"].includes("Notes"));
  assert.ok(permissions["Teacher"].includes("Announcement"));
  assert.ok(permissions["Teacher"].includes("Discussion"));
});
