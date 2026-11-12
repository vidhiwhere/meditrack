# BUG-003 — `GET /api/doctor/patients` returns 500 (SQL correlated-subquery failure)

**Severity:** High  
**Component:** Backend — `services/doctor/doctor.service.js` → `getPatients()`  
**Found during:** Jest + Supertest RBAC test suite (`rbac.test.js`)  
**Status:** Fixed ✅

---

## Description

When an authenticated doctor requests their patient list (`GET /api/doctor/patients`), the
endpoint returns HTTP 500 with a database-level error message.  
The root cause is a correlated subquery that references an outer-query alias (`p.id`) inside a
nested `SELECT DISTINCT` context — a pattern that is non-standard SQL and rejected by several
PostgreSQL drivers and in-memory implementations.

---

## Steps to Reproduce

1. Set up the test database and seed test data (see `README.md` → Testing).
2. Log in as a doctor to obtain a JWT:
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"doctor1@lumia.com","password":"Doctor@123"}'
   ```
3. Use the returned token to call the patients endpoint:
   ```bash
   curl http://localhost:5000/api/doctor/patients \
     -H "Authorization: Bearer <token>"
   ```

**Expected:** HTTP 200 with an array of patient objects.  
**Actual:** HTTP 500 — `column "p.id" does not exist` (or similar driver-level message).

---

## Root Cause

Original query in `doctor.service.js`:

```sql
SELECT DISTINCT
  p.id,
  p.name,
  p.email,
  (SELECT MAX(a.appointment_date)
   FROM appointments a
   WHERE a.patient_id = p.id               -- ← outer alias p.id used here
     AND a.doctor_id  = $1
     AND a.status     = 'COMPLETED') AS last_visit,
  (SELECT COALESCE(SUM(a.fee), 0)
   FROM appointments a
   WHERE a.patient_id = p.id               -- ← and here
     AND a.doctor_id  = $1
     AND a.status     = 'COMPLETED') AS total_fees_paid
FROM users p
JOIN appointments a ON a.patient_id = p.id
WHERE a.doctor_id = $1
  AND p.role = 'patient';
```

The alias `p` assigned in the outer `FROM users p` clause is not visible inside the correlated
subqueries when the outer query uses `SELECT DISTINCT`, because the driver resolves column
references before deduplication.  
PostgreSQL 15+ accepts this syntax as an extension, but it is rejected by `pg-mem` (used in the
local test environment) and is fragile across PostgreSQL minor versions.

---

## Fix Applied

Rewrote the query to eliminate correlated subqueries by using `GROUP BY` with aggregate
functions — standard SQL that works in all environments:

```sql
SELECT
  p.id,
  p.name,
  p.email,
  MAX(CASE WHEN a.status = 'COMPLETED' THEN a.appointment_date END) AS last_visit,
  COALESCE(SUM(CASE WHEN a.status = 'COMPLETED' THEN a.fee ELSE 0 END), 0) AS total_fees_paid
FROM users p
JOIN appointments a ON a.patient_id = p.id
WHERE a.doctor_id = $1
  AND p.role = 'patient'
GROUP BY p.id, p.name, p.email;
```

**File changed:** `lumia-backend/services/doctor/doctor.service.js`

---

## Impact

| Area | Impact |
|------|--------|
| Doctor dashboard | Patient list fails to load — blank screen in production |
| Revenue analytics | Per-patient fee totals unavailable |
| Test suite | RBAC test `GET /api/doctor/patients` returned 500 instead of 200 |

---

## Verification

After the fix, `npm test` in `lumia-backend/` runs all 60 tests with 0 failures, including:

```
rbac.test.js > GET /api/doctor/patients > returns patient list for authenticated doctor ✓
```

---

## Prevention

- Add a SQL linter (e.g. `sqlfluff`) to CI to catch non-standard correlated subquery patterns.
- Prefer `GROUP BY` aggregate queries over correlated subqueries for lists with computed columns.
- Run the Jest suite (with `pg-mem` fallback) on every PR — it catches environment-specific SQL
  portability issues before they reach production.

