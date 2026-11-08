# Career Suggestion for Students — Frontend

React and Vite frontend for the Career Suggestion API.

## Run locally

1. Start the backend and MySQL database as described in [`../BackEnd/README.md`](../BackEnd/README.md).
2. From this directory, install dependencies and start Vite:

   ```sh
   npm install
   npm run dev
   ```

Vite serves the app at `http://localhost:5173` and proxies `/api` requests to `http://localhost:8080`. To use another API host, set `VITE_API_BASE_URL` to its `/api` base URL before starting or building the frontend.

## Available workflows

- Public landing, about, and contact pages
- Student registration and login
- A guided student journey: choose education or jobs, select a qualification, browse courses by level and branch, then continue to higher education or matched jobs
- A persistent roadmap that records selected courses and lets students track completion
- Direct administrator entry at `/admin-login`, followed by protected dashboard and catalog management
- Education course pages support selecting up to three `.csv` files at once, with a 5 MB per-file limit, row validation, and an import summary. The After 10th, Graduation, and Post-Graduation CSV headers match the corresponding legacy database table columns. Valid rows are saved to `after10th`, `graduate`, or `pg` and mirrored to the current `education_course` catalog so student recommendations and admin listings stay in sync. Templates are in [`public/import-templates/`](./public/import-templates/).

The backend issues eight-hour bearer tokens for student and admin sessions. Student journey data is always requested through the authenticated student API; the browser does not submit a student ID to select whose profile or roadmap to change.

## Checks

```sh
npm run lint
npm run build
```
