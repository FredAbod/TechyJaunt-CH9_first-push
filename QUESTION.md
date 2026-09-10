# Student Challenge: The "Ghost Student" Incident

**Read `app.js` carefully before you write a single line of code.**  
Copy-pasting an existing route will not pass this task. Some answers are **not** in the file — you are expected to research official Express and Mongoose docs.

---

A school admin is using your API. She reports this:

> "I created two students both named **Ada**. When I search by name I get a weird result. When I update Ada's age, Postman still shows the old age. When I look up a student with a fake id like `abc123`, the server crashes into a 500. When I look up a valid-looking id that does not exist, I still get 200. And when I delete someone who was never in the database, it still says 'deleted successfully'."

Your job is to **explain why** those things happen in the current code, then **extend** the API — without breaking the routes that already exist.

---

## Part A — Diagnose (written answers)

Answer each question in your own words. Quote the exact line(s) from `app.js` that prove your point.

1. `GET /get-student-by-name?name=Ada` uses `Student.find({ name })`.  
   If two Adas exist, what is the **shape of the JSON** the client actually receives?  
   Would `findOne` behave differently? When would you use each?

2. That same route is **case-sensitive** and requires an **exact** name.  
   What happens if the admin searches `ada` or `Ada ` (trailing space)?  
   Research how to make a MongoDB/Mongoose name search **case-insensitive** without fetching every student into Node and filtering in JavaScript.

3. `PUT /update-student/:id` uses `findByIdAndUpdate(..., { new: true })`.  
   The admin swears she still sees the old document. Give **two** possible reasons this can happen:
   - one that is about how she is **calling** the endpoint (params vs body, method, URL)
   - one that is about Mongoose **update options** (research `new`, `runValidators`, and what happens to fields she did **not** send in the body)

4. `GET /get-student/:id`
   - Valid ObjectId, student exists → ?
   - Valid ObjectId, student does **not** exist → what does `findById` return, and what status does your code send?
   - Invalid id such as `abc123` → why is this a **500** and not a **404**?  
   Research: `CastError` vs "document not found". They are not the same bug.

5. `mongoose.model("Student", studentSchema)`  
   What is the **actual collection name** in MongoDB Compass / `mongosh`?  
   (Hint: it is probably **not** `"Student"`.) Explain why that matters if someone writes a raw Mongo query against the wrong collection and thinks "the API is empty".

6. Why does `POST /create-student` fail (or save `undefined` fields) if the client forgets `Content-Type: application/json`?  
   Which **one line** in `app.js` is responsible for making `req.body` work at all?

---

## Part B — Build (code)

Keep every existing route working. Add the following. Do **not** invent extra routes beyond what is asked.

### 1. `GET /search-students`

The current name route is not good enough for a real search box.

- Read the search text from a **query** parameter named `q` (not a URL param, not the body).
- Match students whose `name` **or** `email` **or** `course` contains `q`, **case-insensitive**.
- If `q` is missing or empty, respond with **400** and a clear message. Do not return the whole database.
- Return an **array** (even if only one student matches). Status **200**.
- If none match, still return **200** with an empty array — not 404. Research why list/search endpoints usually do that.

### 2. Harden `GET /get-student/:id` (edit the existing route)

- If the id is not a valid MongoDB ObjectId → **400**, message explaining the id is invalid.  
  Research `mongoose.Types.ObjectId.isValid` — and also research why `isValid` alone is **not perfect**. Mention that limitation in a code comment.
- If the id is valid but no student exists → **404**, not 200 with `student: null`.
- Only return **200** when a real student is found.

### 3. `PATCH /students/:id/course`

The school does **not** want a full replace-all-fields update for this.

- Change **only** the `course` field.
- Send the new course in the JSON body as `{ "course": "..." }`.
- If `course` is missing or an empty string → **400**.
- If the student does not exist → **404**.
- The JSON response must contain the **updated** student (the new course must be visible). Research which Mongoose option makes that happen.
- Research `runValidators`. Turn it **on** for this update. Then add a `minlength` (or `enum`) on `course` in the schema so a 1-character course is rejected. Show that this rejection is **400**, not 500.

### 4. Unique email (schema + create route)

Right now two students can be created with the same email.

- Make `email` unique in the schema. Research whether just adding `unique: true` is enough, or whether you also need an index / what error Mongo throws on duplicate key (`11000`).
- On duplicate email, `POST /create-student` must respond **409 Conflict**, not 500.
- Creating a student with missing `name` or missing `email` must be **400**, not 200 with empty fields. Put `required: true` on those two schema paths.

### 5. Honest delete

Edit `DELETE /delete-student/:id`:

- Invalid id → **400**
- Valid id, no student → **404** ("already gone" is not a successful delete)
- Real delete → **200** (or **204** — pick one, and **justify** the status code in a short comment)

---

## Part C — Prove it (you must test)

Using Thunder Client / Postman / curl, submit screenshots or copied request+response for:

| # | What you test | What a passing result looks like |
|---|----------------|----------------------------------|
| 1 | Search `q=ada` finds both `Ada` and `ADA` | 200, array length 2+ |
| 2 | Search with no `q` | 400 |
| 3 | `GET /get-student/abc123` | 400, not 500 |
| 4 | `GET /get-student/` + a real-looking id that is not in the DB | 404, not 200 |
| 5 | `PATCH` course on a real student | body shows the **new** course |
| 6 | `PATCH` with `{ "course": "A" }` (too short) | 400 from validation, not 500 |
| 7 | Create two students with the same email | second request is 409 |
| 8 | Delete an id that does not exist | 404 |

---

## Constraints (read twice)

- Do not add `app.get("/get-student-by-name/:name")`. Query vs params is the whole point of Part B.1.
- Do not `Student.find()` the entire collection and then `.filter()` in JavaScript for the search. The database must do the matching.
- Do not change the port or the database name.
- Do not remove `express.json()`.
- Existing routes (`/create-student`, `/get-students`, `/get-student-by-name`, etc.) must still exist and still work.

---

## How you will be graded

| | Weight | You lose marks if... |
|---|--------|----------------------|
| Part A accuracy | 30% | You describe what you *wish* the code did, not what it actually does |
| Part B correctness | 45% | Wrong status codes, search is case-sensitive, update returns the old document |
| Research comments | 10% | No comment explaining `new`, `runValidators`, or why `isValid` is imperfect |
| Tests (Part C) | 15% | Code looks right but you never proved the 400/404/409 cases |

**Deadline:** submit the updated `app.js` plus your Part A write-up (can be at the top of this file, under a heading `## My answers`).
