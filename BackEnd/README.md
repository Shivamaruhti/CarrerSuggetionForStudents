# Career Suggestion API

Spring Boot REST API for student registration and login, with authenticated admin APIs for managing student accounts, education courses, and jobs. Student passwords are stored as BCrypt hashes and are never returned by the API.

## Requirements

- Java 17 or newer
- Maven 3.6.3 or newer
- MySQL 8.x

## Database setup

Create the database before starting the API:

```sql
CREATE DATABASE career_suggestion;
```

`schema.sql` creates the student, education-course, career-job, profile, and roadmap tables when the application starts. Education courses store their education level, prior standard and branch, next level, duration, branch, entrance options and test, plus optional course details. Student status supports `PENDING`, `APPROVED`, `REJECTED`, and `ACTIVE`; new accounts default to `ACTIVE`. The default connection is `jdbc:mysql://localhost:3308/career_suggestion`, user `root`, and a blank password. Override these with environment variables when needed:

The course CSV templates in `src/main/resources/import-templates/` use the legacy `after10th`, `graduate`, and `pg` table column names. Those tables are created additively by `schema.sql` and migration `V5__create_legacy_education_tables.sql`, without dropping or replacing existing tables. The authenticated `POST /api/admin/courses/import/{category}` endpoint writes each validated row to its matching legacy table and mirrors it to `education_course`, keeping current student recommendations and admin listings in sync.

- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `SERVER_PORT`
- `CORS_ALLOWED_ORIGINS` (comma-separated browser origins)
- `ADMIN_ID` and `ADMIN_PASSWORD` (credentials accepted by the admin login endpoint)
- `ADMIN_TOKEN_SECRET` (a private signing secret of at least 32 characters)
- `STUDENT_TOKEN_SECRET` (a private signing secret of at least 32 characters; sessions expire after eight hours)

## Run

From this directory:

```sh
mvn spring-boot:run
```

The API listens on `http://localhost:8080`.

## Endpoints

- `POST /api/auth/register` — JSON body: `{"fullName":"A Student","phone":"9876543210","password":"Password1"}`
- `POST /api/auth/login` — JSON body: `{"phone":"9876543210","password":"Password1"}`
- `GET /api/student/profile`, `PUT /api/student/profile` — read and save the authenticated student's qualification, stream, career interest, and location preference.
- `GET /api/student/courses`, `GET /api/student/courses/after10th`, `GET /api/student/jobs` — retrieve course and job records relevant to the saved qualification. The After 10th journey reads all rows from the legacy `after10th` table. For a next education step, request `/api/student/courses?category=graduation&previousStandard=Intermediate&previousBranch=MPC` (or `category=pg`) to match courses to the selected course and branch. Job results can be filtered with `qualification` and `branch` query parameters.
- `GET /api/student/roadmap`, `POST /api/student/roadmap/{courseId}`, `POST /api/student/roadmap/after10th/{legacyCourseId}`, `PATCH /api/student/roadmap/{courseId}`, `DELETE /api/student/roadmap/{courseId}` — maintain the authenticated student's saved course path and completion progress. Selecting an After 10th legacy row creates its catalog mirror if needed before saving it to the roadmap.
- `POST /api/admin/login` — JSON body: `{"adminId":"...","password":"..."}`; returns a signed bearer token valid for eight hours. Admin API routes under `/api/admin/**` require that token.
- `GET /api/admin/users`, `POST /api/admin/users`, `PUT /api/admin/users/{id}`, `DELETE /api/admin/users/{id}` — list and manage student accounts. Passwords are only accepted on create or as an optional reset; they are never returned.
- `GET /api/admin/courses`, `POST /api/admin/courses`, `PUT /api/admin/courses/{id}`, `DELETE /api/admin/courses/{id}` — list and manage education records. Filter by category with `?category=after10th`, `intermediate`, `graduation`, or `pg`.
- `POST /api/admin/courses/import/after10th`, `/graduation`, or `/pg` — add a CSV-mapped education row to the corresponding legacy table and the current course catalog.
- `GET /api/admin/jobs`, `POST /api/admin/jobs`, `PUT /api/admin/jobs/{id}`, `DELETE /api/admin/jobs/{id}` — list and manage career opportunities.

Registration returns the student `id`, `fullName`, `phone`, and `status`. Login returns that student object plus a signed bearer token. Supply the token as `Authorization: Bearer <token>` for every `/api/student/**` request. Registration responds with HTTP 201; invalid credentials respond with HTTP 401; duplicate mobile numbers respond with HTTP 409. Only `ACTIVE` and `APPROVED` accounts may log in or continue using an existing token; account status is checked on every student API request. Student profile and roadmap records are scoped to the identity in the signed token, not to a caller-supplied student ID.

For local development, the admin ID defaults to `admin`; set `ADMIN_PASSWORD` before starting the API. The admin password is intentionally not stored as a source-code default. If either token secret is omitted, the API generates a cryptographically random in-memory signing key on startup; existing sessions using that key are invalidated whenever the API restarts. Set the secrets for deployments, use a strong password and private signing secrets of at least 32 characters, and never commit credentials or secrets to source control.

### Existing database

For a database created before the admin catalog was added, apply `src/main/resources/db/migration/V3__create_education_and_jobs.sql`. If the existing `student` table predates the status field, apply `src/main/resources/db/migration/V2__add_student_status.sql` once as well.

For an existing database, apply `src/main/resources/db/migration/V4__create_student_journey.sql` after the course catalog migration. It adds student profile and roadmap tables without changing or deleting existing account or catalog rows. On startup, `schema.sql` also creates these tables when they are absent.

For an existing database that needs the legacy course tables from the supplied backup schema, apply `src/main/resources/db/migration/V5__create_legacy_education_tables.sql`. It only creates missing `after10th`, `graduate`, and `pg` tables and does not drop existing data. The application connects to the database selected by `DB_URL`; with the default settings, the tables are added to `career_suggestion` rather than switching databases or dropping the current schema.

The frontend's current OTP is a browser-only demo and is not evidence of mobile ownership. Configure a real OTP/SMS provider before treating phone verification as a security control.

## Frontend

Run the frontend from `FrontEnd` with `npm run dev`. Vite proxies `/api` requests to `http://localhost:8080`; if the API is hosted elsewhere, set `VITE_API_BASE_URL` to the API's `/api` base URL.
