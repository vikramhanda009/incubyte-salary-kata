# Incubyte Salary Management Kata

A production-ready REST API for managing employee records with salary calculation and metrics — built as part of the Incubyte Software Craftsperson assessment.

---

## Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Runtime | Node.js + TypeScript | Type safety, production-grade reliability |
| Framework | Express.js | Lightweight, well-understood REST framework |
| ORM | Prisma | Type-safe DB access, clean migrations |
| Database | SQLite | Zero-config, file-based, fits the kata scope |
| Validation | Joi | Declarative schema validation with clear error messages |
| Testing | Jest + Supertest | Fast, deterministic integration tests |

---

## Getting Started

### Prerequisites
- Node.js v18+
- npm v9+

### Installation & Setup

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npx prisma generate

# 3. Push schema to SQLite database
npx prisma db push

# 4. Start development server
npm run dev
```

Server runs at: `http://localhost:3000`

---

## Running Tests

```bash
# Run all tests once
npm run test:ci

# Run in watch mode (during development)
npm test
```

---

## Project Structure

```
src/
├── app.ts                        # Express app setup (no listen — clean for testing)
├── server.ts                     # Entry point — starts HTTP server
├── lib/
│   └── prisma.ts                 # Singleton Prisma client
├── controllers/
│   └── employee.controller.ts    # Route handlers
├── services/
│   └── salary.service.ts         # Pure salary calculation logic
├── repositories/
│   └── employee.repository.ts    # All database queries
├── routes/
│   └── index.ts                  # Route definitions
├── validations/
│   └── employee.validation.ts    # Joi schemas
├── middlewares/
│   └── validate.ts               # Validation middleware
├── errors/
│   └── AppError.ts               # Custom error class
└── types/
    └── employee.types.ts         # TypeScript interfaces

tests/
└── integration/
    ├── employees.test.ts          # CRUD endpoint tests
    └── salary.test.ts             # Salary calculation & metrics tests

prisma/
├── schema.prisma                  # Database schema
└── salary_management.db           # SQLite DB (auto-created)
```

---

## API Reference

### Base URL
```
http://localhost:3000/api
```

---

### Employee CRUD

#### Create Employee
```http
POST /api/employees
Content-Type: application/json

{
  "fullName": "Vikram Singh",
  "jobTitle": "Software Engineer",
  "country": "India",
  "salary": 1500000
}
```
**Response `201`**
```json
{
  "id": 1,
  "fullName": "Vikram Singh",
  "jobTitle": "Software Engineer",
  "country": "India",
  "salary": 1500000,
  "createdAt": "2026-04-19T10:00:00.000Z",
  "updatedAt": "2026-04-19T10:00:00.000Z"
}
```

#### Get All Employees
```http
GET /api/employees
```

#### Get Employee by ID
```http
GET /api/employees/:id
```

#### Update Employee
```http
PUT /api/employees/:id
Content-Type: application/json

{
  "salary": 1800000
}
```

#### Delete Employee
```http
DELETE /api/employees/:id
```
**Response `204 No Content`**

---

### Salary Calculation

#### Get Salary Breakdown
```http
GET /api/salary/:id
```

**Response**
```json
{
  "employeeId": 1,
  "fullName": "Vikram Singh",
  "grossSalary": 1500000,
  "tds": 150000,
  "netSalary": 1350000,
  "country": "India"
}
```

**Deduction Rules**

| Country | TDS Rate | Example (gross 100,000) |
|---------|----------|--------------------------|
| India | 10% | TDS = 10,000 → Net = 90,000 |
| United States | 12% | TDS = 12,000 → Net = 88,000 |
| All others | 0% | TDS = 0 → Net = gross |

---

### Salary Metrics

#### By Country — Min, Max, Average
```http
GET /api/metrics/country/:country
```
**Response**
```json
{
  "country": "India",
  "minSalary": 800000,
  "maxSalary": 2000000,
  "avgSalary": 1350000,
  "count": 5
}
```

#### By Job Title — Average
```http
GET /api/metrics/job-title/:jobTitle
```
**Response**
```json
{
  "jobTitle": "Software Engineer",
  "averageSalary": 1200000,
  "count": 3
}
```

---

## Validation Rules

| Field | Rule |
|-------|------|
| `fullName` | Required, string, 3–100 characters |
| `jobTitle` | Required, string, 3–100 characters |
| `country` | Required, string, 2–100 characters |
| `salary` | Required, positive number |

**Error response `400`**
```json
{
  "error": "Validation failed: salary must be a positive number"
}
```

---

## TDD Approach

This project was built following the **Three Laws of TDD** (as referenced in the assessment):

1. **Red** — Write a failing test first. No production code without a failing test.
2. **Green** — Write the minimum code to make the test pass.
3. **Refactor** — Clean up without breaking tests.

### Commit History reflects this loop:
```
feat: red - failing test for POST /employees
feat: green - minimal create employee implementation
refactor: extract validation into middleware
feat: red - failing test for salary calculation (India TDS)
feat: green - implement salary calculation service
refactor: extract salary logic into pure SalaryService
feat: red - failing tests for metrics endpoints
feat: green - implement country and job title metrics
refactor: extract repository layer, singleton Prisma client
fix: split app.ts from server.ts to fix test teardown leak
```

Each commit is a deliberate, small step — not a bulk dump. The history is the TDD story.

---

## Architecture Decisions

**`app.ts` vs `server.ts` split**
Express app setup is in `app.ts` with no `listen()`. `server.ts` only starts the HTTP server. Tests import `app` directly — no port binding, no open handles, no teardown warnings.

**Singleton Prisma Client (`src/lib/prisma.ts`)**
One shared `PrismaClient` instance across the entire app. Prevents connection leaks from multiple `new PrismaClient()` calls, and ensures `$disconnect()` in `afterAll` cleanly closes the single connection.

**Pure `SalaryService`**
Salary calculation logic is a pure function — no DB, no HTTP, no side effects. Trivially unit-testable and easy to extend with new country rules.

**Repository Pattern**
All database queries live in `EmployeeRepository`. Controllers never touch Prisma directly. Clean separation makes both layers independently testable and replaceable.

---

## Implementation Details — AI Usage

As per Incubyte's assessment instructions, AI was used intentionally and transparently:

| Task | Tool | How |
|------|------|-----|
| Boilerplate scaffolding | Claude (Anthropic) | Generated initial Express + Prisma + TypeScript setup |
| Test case generation | Claude (Anthropic) | Edge cases: 0 salary, missing fields, unknown country, 404s |
| README | Claude (Anthropic) | Drafted structure; decisions and content written manually |
| Bug diagnosis | Claude (Anthropic) | Identified teardown leak, prisma path nesting issue |

**What AI did NOT decide:**
- Architecture (app/server split, singleton Prisma, repository pattern)
- TDD commit strategy and sequencing
- Which edge cases matter for this domain
- Validation rules and error response shapes

AI accelerated scaffolding and surfaced options. Every architectural and quality decision was made by the engineer.

---

## Environment Variables

Create a `.env` file in the project root:

```dotenv
DATABASE_URL="file:./salary_management.db"
PORT=3000
```

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite path (relative to `prisma/` folder) | — |
| `PORT` | HTTP server port | `3000` |

---

## Database Reset

```bash
rm prisma/salary_management.db
npx prisma db push
```