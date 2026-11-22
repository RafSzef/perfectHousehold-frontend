# Perfect Household — Frontend

Web client for the **Perfect Household** application, built with **Angular 22** and **TypeScript**.

## About This Repository

This repository is part of an end-to-end full-stack project:

* **Backend (`perfectHousehold-backend`)** — designed and implemented manually (Java 21, Spring Boot, MyBatis, PostgreSQL, Flyway, JWT & biometric auth).
* **Frontend (`perfectHousehold-frontend`)** — **primarily created and maintained with an AI coding agent** to rapidly deliver a complete, usable end-to-end application on top of the backend API.

Instead of spending time hand-crafting every UI view from scratch, the goal here is to focus engineering effort on backend architecture, security, and infrastructure while leveraging AI-assisted development for the client layer.

## Tech Stack

* **Framework:** Angular 22 (`@angular/build:application`)
* **Styling:** SCSS
* **Testing:** Vitest (`ng test`)
* **Runtime / Deployment:** Docker (`nginx:alpine`) + Nginx reverse proxy for `/api/` -> `perfecthousehold-backend:8080`
* **CI/CD:** GitHub Actions (`.github/workflows/deploy.yml`) deploying production builds to an Oracle Cloud VM

## Local Development

```bash
npm install
npm start
```

The dev server starts on `http://localhost:4200/` (bound to `0.0.0.0`).

### Useful Commands

```bash
# Production build (outputs to dist/)
npm run build

# Unit tests (Vitest)
npm test
```

## Deployment (Docker & Oracle VM)

Production builds are compiled in GitHub Actions and packaged into a `.tar.gz` archive containing `dist/`, `Dockerfile`, `docker-compose.yml`, and `nginx.conf`. On the Oracle VM, Nginx serves the Angular SPA and proxies `/api/` requests over the internal Docker network (`perfecthousehold-internal-net`) to the backend container.
