<!--
  DEV.to publish notes (delete this block before posting):
  - Title: Stop Dumping Everything in app.js — Express MVC for Beginners
  - Tags: webdev, express, mongodb, beginners, javascript
  - Cover: messy one-file vs clean folders (or a "this is fine" office meme)
  - Where you see 🖼️, paste a GIF like you did in the Prisma article
    https://dev.to/fredabod/a-simple-crud-app-with-prisma-express-and-postgresql-4on4
-->

# Stop Dumping Everything in `app.js` — Express, Mongoose, and a Clean MVC Folder

So you built a CRUD API. It works. Postman is green. You are feeling like a backend engineer.

Then you open `app.js`.

Database connection. Schema. Create. Read. Update. Delete. Hello World. All in **one file**. Scrolling that thing feels like opening a WhatsApp group that never went on mute 😭

In this article I will take you step by step through how we split a student API into a folder structure that actually makes sense. Same app. Same MongoDB. Same routes. Just… not a crime scene anymore.

We are building (well, **re-organising**) a school student API with:

- **Express** — the school gate
- **Mongoose** — the person who talks to the records cupboard
- **MongoDB** — the cupboard itself

By the end you will know *why* a request never talks to MongoDB directly, and what each of these files is for:

```
app.js
config/db.js
models/students.models.js
controllers/students.controller.js
routes/students.routes.js
```

---

## Prerequisites

Make sure you have Node.js, npm, and MongoDB running on your machine.

> I hope you already have a working Express + Mongoose CRUD 😉😉😉  
> If you don't… you have to 😎  
> This article is about **structure**, not "what is `app.post`".

If you are coming from my Prisma + PostgreSQL post, relax. Different database, same idea: don't put the whole school inside one office.

---

## Let's Dive Right In

🖼️ **Meme break:** diving / "let's go" / jumping into the pool GIF

---

## Step 1: The problem — one fat `app.js`

At first, one file is cute. You are learning. You paste a route, it works, you paste another, it also works. Life is good.

Then you add "get student by name". Then "get by email". Then update. Then delete. Then your friend asks "where is the schema again?" and you Ctrl+F through 200 lines like a detective.

That file is doing **four jobs at once**:

1. Starting the server
2. Connecting to MongoDB
3. Describing what a student looks like
4. Handling every request

That is like one person being the gatekeeper, the teacher, the registrar, *and* the person with the cupboard key. Possible? Yes. A good idea when the school grows? Absolutely not.

🖼️ **Meme break:** "this is fine" dog in a burning office / messy desk

---

## Step 2: Think of it like a school office

This is the whole article in one picture. A request walks through the building. It does **not** teleport into MongoDB.

```
  Client (Postman)
        │
        ▼
  app.js              ← front gate. "Are you speaking JSON? Cool. Students office is that way."
        │
        ▼
  routes              ← the list of doors. "Ah, POST /create-student. Clerk!"
        │
        ▼
  controllers         ← the clerk actually does the work
        │
        ▼
  models              ← the form every student must fill
        │
        ▼
  MongoDB             ← the cupboard. Writes Ada. Gives her an _id.
        │
        ▼
  back the same way to Postman
```

**In words:** the client never talks to MongoDB. It talks to Express. Express asks the router which door was knocked. The router calls a controller. The controller uses the Student model. The model talks to MongoDB. The answer travels back the same way.

If you remember only one sentence from this article, remember that one.

---

## Step 3: Make the folders

From your project root:

```
mkdir config models controllers routes
```

Your project should look like this:

```
techySchoolApp/
├── app.js
├── config/
│   └── db.js
├── models/
│   └── students.models.js
├── controllers/
│   └── students.controller.js
└── routes/
    └── students.routes.js
```

Each folder has **one job**. If you catch yourself saving a student inside `app.js` again, slap your own hand. Gently. We are learning 😁

---

## Step 4: The cupboard key — `config/db.js`

This file does one thing. Knock on MongoDB's door.

```javascript
const mongoose = require("mongoose");

const databaseConnection = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/techSchoolApp");
    console.log("Database connected successfully");
  } catch (error) {
    console.log("Database connection failed", error);
  }
};

module.exports = databaseConnection;
```

That's it. No routes. No schema. No "Student created successfully". Just the key.

> Tiny gotcha: Mongoose will name the collection `students` (plural, lowercase), not `"Student"`.  
> If you open Compass and look for a collection called `Student`, you will think the API is empty. It is not. You are just in the wrong cupboard 😅

---

## Step 5: The form — `models/students.models.js`

Before we save Ada, we need a form that says what a student even *is*.

```javascript
const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: String,
  age: Number,
  email: String,
  phone: String,
  address: String,
  course: String,
  institution: String,
});

const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
```

This file should **not** send `res.json(...)`. It does not know HTTP. It only knows: "a student has a name, an age, an email…"

Think of it as the attendance register. The clerk (controller) fills it. The register itself does not talk to visitors at the gate.

---

## Step 6: The clerk — `controllers/students.controller.js`

This is where the actual work lives. Unpack the request. Call the model. Send a reply.

I will show create + list first so you can test before we dump the whole file on you. Stretch your fingers later, not now 😉

```javascript
const Student = require("../models/students.models");

const createStudent = async (req, res) => {
  const { name, age, email, phone, address, course, institution } = req.body;
  try {
    const student = new Student({
      name,
      age,
      email,
      phone,
      address,
      course,
      institution,
    });
    await student.save();
    return res
      .status(200)
      .json({ message: "Student created successfully", student });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getStudents = async (req, res) => {
  try {
    const students = await Student.find();
    return res
      .status(200)
      .json({ message: "Students fetched successfully", students });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { createStudent, getStudents };
```

See the pattern?

- `req` comes in
- we talk to `Student`
- `res` goes out

The controller is allowed to know HTTP. The model is not. Don't mix them. Mixing them is how `app.js` got fat in the first place.

---

## Step 7: The doors — `routes/students.routes.js`

Routes are a menu. They should be boring. Boring is good.

```javascript
const express = require("express");
const router = express.Router();
const {
  createStudent,
  getStudents,
} = require("../controllers/students.controller");

router.post("/create-student", createStudent);
router.get("/get-students", getStudents);

module.exports = router;
```

Read that out loud: "when someone POSTs `/create-student`, call `createStudent`."

That is all a route file should say. If you start writing `Student.find()` in here, you have put the clerk at the door. Send them back to the office.

---

## Step 8: The front gate — a slim `app.js`

Now `app.js` can finally be short. This is the whole point.

```javascript
const express = require("express");
const databaseConnection = require("./config/db");
const studentsRoutes = require("./routes/students.routes");
const app = express();

const port = 4555;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.use("/students", studentsRoutes);

app.listen(port, () => {
  databaseConnection();
  console.log(`Server is running on port ${port}`);
});
```

Three important lines, don't skip them:

1. **`express.json()`** — without this, `req.body` is `undefined` and you will save ghost students. Then you will blame Mongoose. It was you. It was always you 😭
2. **`app.use("/students", studentsRoutes)`** — this is the prefix. Your route file says `/create-student`, but the real URL is `/students/create-student`. I will say that again in a minute because this is the #1 "why is it 404" moment.
3. **`listen` then connect DB** — open the classroom, then unlock the cupboard.

🖼️ **Meme break:** empty fridge / "where did my routes go" / 404 face

---

## Step 9: Don't forget the prefix 👏

Because the router is mounted at `/students`, every student door looks like this:

| What you want | Method | Full URL | Clerk |
|---|---|---|---|
| Add a student | `POST` | `/students/create-student` | `createStudent` |
| Show everybody | `GET` | `/students/get-students` | `getStudents` |
| Show this one id | `GET` | `/students/get-student/:id` | `getStudentById` |
| Change this one | `PUT` | `/students/update-student/:id` | `updateStudent` |
| Find by exact name | `GET` | `/students/get-student-by-name` | `getStudentByName` |
| Find by email | `GET` | `/students/get-student-by-email` | `getStudentByEmail` |
| Remove this one | `DELETE` | `/students/delete-student/:id` | `deleteStudent` |
| Is the school open? | `GET` | `/` | Hello World |

If you test `POST /create-student` and get 404, you did not break Express. You just went to the wrong door. The students office is down the hall: **`/students/...`**

---

## Step 10: Stretch your fingers 😁😁

🖼️ **Meme break:** stretch / cracking knuckles / "we back"

Now drop the rest of the clerks into the controller. Same pattern. Different door.

```javascript
const getStudentById = async (req, res) => {
  const { id } = req.params;
  try {
    const student = await Student.findById(id);
    return res
      .status(200)
      .json({ message: "Student fetched successfully", student });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateStudent = async (req, res) => {
  const { id } = req.params;
  const { name, age, email, phone, address, course, institution } = req.body;
  try {
    const student = await Student.findByIdAndUpdate(
      id,
      { name, age, email, phone, address, course, institution },
      { new: true },
    );
    return res
      .status(200)
      .json({ message: "Student updated successfully", student });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getStudentByName = async (req, res) => {
  const { name } = req.query;
  try {
    const student = await Student.find({ name });
    return res
      .status(200)
      .json({ message: "Student fetched successfully", student });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getStudentByEmail = async (req, res) => {
  const { email } = req.query;
  try {
    const student = await Student.find({ email });
    return res
      .status(200)
      .json({ message: "Student fetched successfully", student });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteStudent = async (req, res) => {
  const { id } = req.params;
  try {
    await Student.findByIdAndDelete(id);
    return res.status(200).json({ message: "Student deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};
```

And hook them on the menu:

```javascript
router.post("/create-student", createStudent);
router.get("/get-students", getStudents);
router.get("/get-student/:id", getStudentById);
router.get("/get-student-by-email", getStudentByEmail);
router.put("/update-student/:id", updateStudent);
router.get("/get-student-by-name", getStudentByName);
router.delete("/delete-student/:id", deleteStudent);
```

Notice the difference:

- `:id` lives in **`req.params`** — it is part of the URL
- `name` and `email` live in **`req.query`** — they come after `?`

`/get-student-by-name?name=Ada` is not the same as `/get-student-by-name/Ada`. Query vs params. This will hunt you in your sleep until it clicks.

---

## Step 11: One request, slowly — creating Ada

Let's walk Ada through the building. This is the part that makes the folders click.

**Request:** `POST http://localhost:4555/students/create-student`

```json
{
  "name": "Ada",
  "age": 16,
  "email": "ada@school.com",
  "phone": "08012345678",
  "address": "Lagos",
  "course": "Computer Science",
  "institution": "Techy School"
}
```

Don't forget the header: `Content-Type: application/json`. That one line is why `express.json()` exists.

Now the walk:

```
  Postman
     │  JSON body + Content-Type
     ▼
  app.js
     │  express.json() turns the text into req.body
     │  path starts with /students → send to the router
     ▼
  students.routes.js
     │  POST /create-student  →  createStudent
     ▼
  students.controller.js
     │  pick name, age, email... out of req.body
     │  new Student({ ... })
     │  await student.save()
     ▼
  students.models.js
     │  checks the shape (name is String, age is Number...)
     ▼
  MongoDB  (techSchoolApp.students)
     │  writes one document, gives it an _id
     ▼
  back to the controller
     │  res.status(200).json({ message, student })
     ▼
  Postman sees Ada plus her _id 🎉
```

If anything breaks, ask: **which floor did it die on?**

- 404 → wrong door (routes / prefix)
- `req.body` empty → gate did not parse JSON (`express.json()` or the header)
- 500 on save → cupboard / schema / Mongo not running
- 200 with `student: null` on get-by-id → valid-looking id, nobody home (that's a story for another day 👀)

🖼️ **Meme break:** Postman screenshot of Ada created — paste yours here like the Prisma "Create Post" shot

Test `GET /students/get-students` next. You should see Ada in the list.

🖼️ **Meme break:** Get all students screenshot

---

## Step 12: Why we split it (so you don't undo it tomorrow)

| Layer | File | Job | Should **not** do |
|---|---|---|---|
| App | `app.js` | Start server, JSON, mount routers | Know how to save a student |
| Routes | `routes/students.routes.js` | Map URL + method to a function | Talk to MongoDB |
| Controllers | `controllers/students.controller.js` | Read the request, call the model, reply | Own the Express app or the schema |
| Models | `models/students.models.js` | Shape of a student + Mongoose model | Send HTTP responses |
| Config | `config/db.js` | Connect to MongoDB | Define routes |

Same idea as a school:

- **`app.js`** is the front gate and the timetable
- **routes** are the classroom doors
- **controllers** are the teachers doing the work
- **models** are the attendance register
- **`db.js`** is the key to the records cupboard

When you want to add "get student by phone", you do **not** open `app.js` and start praying. You add a function in the controller, one line in the router, done. `app.js` does not even notice. That is the flex.

---

## Before vs after

```
  BEFORE                              AFTER

  ┌─────────────────┐                 ┌─────────────────┐
  │     app.js      │                 │     app.js      │  start the school
  │  (everything)   │                 │  + express.json │
  │                 │                 │  + mount routes │
  │  connect DB     │                 └────────┬────────┘
  │  schema         │                          │
  │  all routes     │                          ▼
  │  all logic      │                 ┌─────────────────┐
  └─────────────────┘                 │     routes      │  the menu of doors
                                      └────────┬────────┘
                                               ▼
                                      ┌─────────────────┐
                                      │   controllers   │  the work happens here
                                      └────────┬────────┘
                                               ▼
                                      ┌─────────────────┐
                                      │     models      │  the student form
                                      └────────┬────────┘
                                               ▼
                                      ┌─────────────────┐
                                      │   config/db     │  the cupboard key
                                      └─────────────────┘
```

One file that does everything is a demo.  
Folders that each do one thing is how you still like this project in two weeks.

---

## Recap (say it with me)

1. The client talks to **Express**, not MongoDB.
2. **Routes** pick the door.
3. **Controllers** do the work.
4. **Models** describe the shape.
5. **Config** holds the cupboard key.
6. `app.use("/students", ...)` means every student URL starts with `/students`.
7. `express.json()` is not optional if you like `req.body`.

And that is a clean Express + Mongoose student API, without dumping the whole school into `app.js`.

---

Thank you for taking the time to read 🥰🥰  
I hope this was helpful. Don't forget to drop a like and follow 😋😋  
See you on the next one 🤗

🖼️ **Meme break:** bow / thank you / "we made it" GIF
