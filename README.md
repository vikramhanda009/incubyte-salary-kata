# Incubyte Salary Management Kata

A production-ready REST API for managing employee records with salary calculation and metrics — built as part of the Incubyte Software Craftsperson assessment.

---

## Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Runtime | Node.js + TypeScript | Type safety, production-grade reliability |
| Framework | Express.js | Lightweight, well-understood REST framework |
| ORM | Prisma | Type-safe DB access, zero-config SQLite |
| Database | SQLite | Embedded, file-based, fits the kata scope |
| Validation | Joi | Declarative schema validation with clear errors |
| Testing | Jest + Supertest | Fast, deterministic integration tests |

---

## Getting Started

### Prerequisites
- Node.js v18+
- npm v9+

### Setup

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Server: `http://localhost:3000`

---

## Running Tests

```bash
npm test           # run once (CI-safe, no watch mode)
npm run test:watch # watch mode for development
npm run test:ci    # with coverage report
```

---

## Project Structure

```
src/
├── app.ts                        # Express app — no listen() here
├── server.ts                     # Starts HTTP server — never imported by tests
├── lib/
│   └── prisma.ts                 # Singleton PrismaClient
├── controllers/
│   └── employee.controller.ts    # Route handlers, typed DTOs
├── services/
│   └── salary.service.ts         # Pure salary calculation — no side effects
├── repositories/
│   └── employee.repository.ts    # All DB queries, typed with DTOs
├── routes/
│   └── index.ts                  # Route → controller wiring
├── validations/
│   └── employee.validation.ts    # Joi schemas
├── middlewares/
│   └── validate.ts               # Validation middleware
├── errors/
│   └── AppError.ts               # Custom error with HTTP status
└── types/
    └── employee.types.ts         # CreateEmployeeDto, UpdateEmployeeDto

tests/
├── app.test.ts                   # App initialization, routes, etc.
└── errors/
    └── AppError.test.ts          # AppError tests
└── controllers/
    ├── employee.controller.test.ts # Controller tests
└── integration/
    ├── employees.test.ts          # CRUD tests (create, read, update, delete)
    └── salary.test.ts             # Salary + metrics tests incl. edge cases

prisma/
├── schema.prisma
└── salary_management.db           # auto-created on first db push
```

---

## API Reference

**Base URL:** `http://localhost:3000/api`

---

### Employee CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/employees` | Create employee |
| `GET` | `/employees` | List all employees |
| `GET` | `/employees/:id` | Get one employee |
| `PUT` | `/employees/:id` | Update employee (partial allowed) |
| `DELETE` | `/employees/:id` | Delete employee — returns `204` |

**Create / Update body:**
```json
{
  "fullName": "Vikram Singh",
  "jobTitle": "Software Engineer",
  "country": "India",
  "salary": 1500000
}
```

**Validation rules:**

| Field | Rule |
|-------|------|
| `fullName` | Required, string, 3–100 chars |
| `jobTitle` | Required, string, 3–100 chars |
| `country` | Required, string, 2–100 chars |
| `salary` | Required, positive number |

---

### Salary Calculation

```http
GET /api/salary/:id
GET /api/salary/:id?gross=200000
```

- **Without `?gross`** — uses the employee's stored salary as the gross input
- **With `?gross=<amount>`** — calculates deductions against the provided gross amount instead

**Response:**
```json
{
  "employeeId": 1,
  "fullName": "Vikram Singh",
  "grossSalary": 200000,
  "tds": 20000,
  "netSalary": 180000,
  "country": "India"
}
```

**Deduction Rules:**

| Country | TDS | Example (gross 100,000) |
|---------|-----|------------------------|
| India | 10% | TDS = 10,000 → Net = 90,000 |
| United States | 12% | TDS = 12,000 → Net = 88,000 |
| All others | 0% | TDS = 0 → Net = gross |

---

### Salary Metrics

```http
GET /api/metrics/country/:country
```
```json
{
  "country": "India",
  "minSalary": 800000,
  "maxSalary": 2000000,
  "avgSalary": 1350000,
  "count": 5
}
```

```http
GET /api/metrics/job-title/:jobTitle
```
```json
{
  "jobTitle": "Software Engineer",
  "averageSalary": 1200000,
  "count": 3
}
```

Both return `404` when no matching employees exist.

---

## TDD Approach

Built following the **Three Laws of TDD**:

1. **Red** — Write a failing test. No production code without one.
2. **Green** — Write the minimum code to pass the test.
3. **Refactor** — Improve without breaking tests.

Each feature was developed in this loop:

- Write failing test for the behaviour
- Implement just enough to pass
- Refactor: extract service, repository, validation into separate layers
- Repeat for the next behaviour

---

## Architecture Decisions

**`app.ts` / `server.ts` split**
`app.ts` sets up Express with no `listen()`. `server.ts` is the only file that calls `listen()` and is never imported by tests. This eliminates the "worker process force exited" teardown warning.

**Singleton PrismaClient (`src/lib/prisma.ts`)**
One shared instance across the app. Prevents connection leaks from multiple `new PrismaClient()` calls and ensures `afterAll(() => prisma.$disconnect())` actually closes the only open connection.

**Typed DTOs — no `any`**
`CreateEmployeeDto` and `UpdateEmployeeDto` are used throughout the controller and repository. `req.body` is never passed directly into Prisma — the controller explicitly maps fields to a typed object.

**Pure `SalaryService`**
No database, no HTTP, no side effects. Input in, output out. Trivially unit-testable and easy to extend with new country rules.

**Optional `?gross` query param**
The spec says "calculates deductions from a given gross salary, given employee ID". The endpoint supports an optional `?gross=<amount>` parameter so callers can calculate against any gross — not just the stored salary. Falls back to stored salary when omitted.

---

## Implementation Details — AI Usage

Per Incubyte's instructions, AI usage is documented transparently:

| Task | Tool | How |
|------|------|-----|
| Initial scaffolding | Claude (Anthropic) | Express + Prisma + TypeScript boilerplate |
| Test case generation | Claude (Anthropic) | Edge cases: missing fields, 404s, deleted employees, invalid gross |
| Bug diagnosis | Claude (Anthropic) | Teardown leak, `prisma/prisma/` path nesting, `--watch` in CI |
| README | Claude (Anthropic) | Structure drafted; all decisions written manually |

**What AI did not decide:**
- Architecture layers (app/server split, singleton Prisma, repository pattern)
- The `?gross` query param design
- TDD sequencing and which behaviours to test first
- Typed DTO design to eliminate `any`

---
## Environment Variables

```dotenv
# .env (root of project)
DATABASE_URL="file:./salary_management.db"
PORT=3000
```

> `file:` paths are resolved relative to the `prisma/` folder where `schema.prisma` lives.
> `file:./salary_management.db` → `prisma/salary_management.db` ✅
> `file:./prisma/salary_management.db` → `prisma/prisma/salary_management.db` ❌

---

## Reset Database

```bash
rm prisma/salary_management.db
npx prisma db push
```

## Improvements After Review

- Cleaned duplicate commits to maintain proper TDD history
- Strengthened validation (salary must be > 0)
- Fixed missing Prisma client setup file
- Added additional test coverage for update edge cases