# Group Project Accountability Tracker

A responsive web app for student group projects: a React client (`/client`) and a Node.js + Express REST API (`/server`) backed by MongoDB Atlas. See [ARCHITECTURE.md](ARCHITECTURE.md) and [POLICY.md](POLICY.md).

## Requirements

- Node.js 22.9 or later (the API uses Node's built-in `--env-file-if-exists` loading)
- A MongoDB Atlas connection string, a JWT secret and a Gemini API key

## Setup

1. Copy `.env.example` to `.env` in the repo root and replace every placeholder. `.env` is git-ignored; never commit it.
2. Install dependencies:

   ```sh
   cd server && npm install
   cd ../client && npm install
   ```

## Run locally

In two terminals:

```sh
cd server && npm run dev   # API on http://localhost:5000
cd client && npm run dev   # client on http://localhost:5173
```

The client calls the API through `/api` (Vite forwards it to port 5000 in development). The API exits with an error naming any missing required variable.

Check the API: `GET http://localhost:5000/api/health` returns `{"status":"ok"}`.

## Test

```sh
cd server && npm test   # Jest + Supertest
cd client && npm test   # Vitest + React Testing Library
```
