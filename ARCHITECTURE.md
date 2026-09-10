# How the Student API is put together

We took one fat `app.js` and split it into **layers**. Each layer has one job. A request walks through them like a school office: reception → clerk → filing cabinet.

```
  BEFORE                              AFTER
  ──────                              ─────

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
                                               │
                                               ▼
                                      ┌─────────────────┐
                                      │   controllers   │  the work happens here
                                      └────────┬────────┘
                                               │
                                               ▼
                                      ┌─────────────────┐
                                      │     models      │  the student form
                                      └────────┬────────┘
                                               │
                                               ▼
                                      ┌─────────────────┐
                                      │   config/db     │  the cupboard key
                                      └─────────────────┘
```

---

## 1. A request walking through the building

```mermaid
flowchart LR
  Client["Postman / browser"] -->|"HTTP request"| App
  App["app.js<br/>port 4555"] -->|"express.json()"| Router
  Router["routes/<br/>students.routes.js"] -->|"picks a handler"| Ctrl
  Ctrl["controllers/<br/>students.controller.js"] -->|"Student.find / save"| Model
  Model["models/<br/>students.models.js"] -->|"Mongoose"| DB
  DB[("MongoDB<br/>techSchoolApp<br/>collection: students")]
  DB -->|"document"| Model
  Model -->|"JS object"| Ctrl
  Ctrl -->|"res.json(...)"| Client
```

**In words:** the client never talks to MongoDB. It talks to Express. Express asks the router which door was knocked. The router calls a controller function. The controller uses the Student model. The model talks to MongoDB. The answer travels back the same way.

---

## 2. What each file is for

```
techySchoolApp/
│
├── app.js                         ← front gate
│                                    creates Express, teaches it JSON,
│                                    hangs the students router on /students,
│                                    opens classroom 4555
│
├── config/
│   └── db.js                      ← cupboard key
│                                    mongoose.connect(
│                                      mongodb://localhost:27017/techSchoolApp
│                                    )
│
├── models/
│   └── students.models.js         ← the form every student must fill
│                                    name, age, email, phone,
│                                    address, course, institution
│                                    mongoose.model("Student", ...)
│                                    → real collection name: "students"
│
├── controllers/
│   └── students.controller.js     ← the clerk who does the work
│                                    create / list / find / update / delete
│
└── routes/
    └── students.routes.js         ← the list of doors
                                     maps URL + method → controller function
```

```mermaid
flowchart TB
  subgraph APP["app.js — front gate"]
    A1["express()"]
    A2["express.json()"]
    A3["GET /  → Hello World"]
    A4["app.use('/students', studentsRoutes)"]
    A5["listen(4555) then connect DB"]
  end

  subgraph ROUTES["routes/students.routes.js — doors"]
    R1["POST   /create-student"]
    R2["GET    /get-students"]
    R3["GET    /get-student/:id"]
    R4["PUT    /update-student/:id"]
    R5["GET    /get-student-by-name"]
    R6["DELETE /delete-student/:id"]
  end

  subgraph CTRL["controllers/students.controller.js — clerks"]
    C1["createStudent"]
    C2["getStudents"]
    C3["getStudentById"]
    C4["updateStudent"]
    C5["getStudentByName"]
    C6["deleteStudent"]
  end

  subgraph MODEL["models/students.models.js — form"]
    M1["studentSchema"]
    M2["Student model"]
  end

  subgraph DB["config/db.js + MongoDB"]
    D1["databaseConnection()"]
    D2[("techSchoolApp / students")]
  end

  A4 --> ROUTES
  R1 --> C1
  R2 --> C2
  R3 --> C3
  R4 --> C4
  R5 --> C5
  R6 --> C6
  C1 & C2 & C3 & C4 & C5 & C6 --> M2
  M2 --> D2
  A5 --> D1
  D1 --> D2
```

---

## 3. The doors (full URLs)

Because the router is mounted at `/students`, every path below is prefixed.

```
  Client                         Method   Full URL                         Clerk
  ──────                         ──────   ────────                         ─────
  "add a student"                POST     /students/create-student         createStudent
  "show everybody"               GET      /students/get-students           getStudents
  "show this one id"             GET      /students/get-student/:id        getStudentById
  "change this one"              PUT      /students/update-student/:id     updateStudent
  "find by exact name"           GET      /students/get-student-by-name    getStudentByName
  "remove this one"              DELETE   /students/delete-student/:id     deleteStudent
  "is the school open?"          GET      /                                Hello World
```

```
                    ┌──────────────────────────────────────────┐
                    │              app.js  :4555               │
                    │                                          │
                    │   GET /          →  "Hello World"        │
                    │                                          │
                    │   /students  ──►  students.routes.js     │
                    │                   ┌────────────────────┐ │
                    │                   │ POST   /create-... │ │
                    │                   │ GET    /get-students│ │
                    │                   │ GET    /get-student/│ │
                    │                   │ PUT    /update-... │ │
                    │                   │ GET    /get-...name│ │
                    │                   │ DELETE /delete-... │ │
                    │                   └─────────┬──────────┘ │
                    └─────────────────────────────┼────────────┘
                                                  │
                                                  ▼
                    ┌──────────────────────────────────────────┐
                    │         students.controller.js           │
                    │                                          │
                    │   unpack req.body / req.params / query   │
                    │   call Student.save / find / update      │
                    │   send res.status(...).json(...)         │
                    └─────────────────────┬────────────────────┘
                                          │
                                          ▼
                    ┌──────────────────────────────────────────┐
                    │          students.models.js              │
                    │                                          │
                    │   Schema  →  model name "Student"        │
                    │           →  collection  "students"      │
                    └─────────────────────┬────────────────────┘
                                          │
                                          ▼
                    ┌──────────────────────────────────────────┐
                    │     MongoDB  localhost:27017             │
                    │     database: techSchoolApp              │
                    │     collection: students                 │
                    └──────────────────────────────────────────┘
```

---

## 4. One example, step by step

**Admin creates Ada** — `POST /students/create-student`

```
  Postman
     │  JSON body: { name, age, email, ... }
     │  header: Content-Type: application/json
     ▼
  app.js
     │  express.json() turns the text into req.body
     │  path starts with /students → send to the router
     ▼
  students.routes.js
     │  POST /create-student  →  createStudent
     ▼
  students.controller.js
     │  pick name, age, email, ... out of req.body
     │  new Student({ ... })
     │  await student.save()
     ▼
  students.models.js
     │  checks the shape (name is String, age is Number, ...)
     ▼
  MongoDB  (techSchoolApp.students)
     │  writes one document, gives it an _id
     ▼
  back to the controller
     │  res.status(200).json({ message, student })
     ▼
  Postman sees Ada plus her _id
```

---

## 5. Why we split it

| Layer        | File                         | Job                                      | Should not do                          |
|--------------|------------------------------|------------------------------------------|----------------------------------------|
| App          | `app.js`                     | Start server, JSON, mount routers        | Know how to save a student             |
| Routes       | `routes/students.routes.js`  | Map URL + HTTP method to a function      | Talk to MongoDB                        |
| Controllers  | `controllers/...controller.js` | Read the request, call the model, reply | Own the Express app or the schema      |
| Models       | `models/students.models.js`  | Shape of a student + Mongoose model      | Send HTTP responses                    |
| Config       | `config/db.js`               | Connect to MongoDB                       | Define routes                          |

Same idea as a school:

- **app.js** is the front gate and the timetable
- **routes** are the classroom doors
- **controllers** are the teachers doing the work
- **models** are the attendance register (what a student looks like)
- **db.js** is the key to the records cupboard
