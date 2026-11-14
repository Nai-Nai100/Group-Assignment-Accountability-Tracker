# ARCHITECTURE.md — Group Project Accountability Tracker

> **Purpose of this file:** the long-lived technical shape of the system and the architectural rules every implementation agent must preserve, across every Issue.
> Business rules, roles and privacy policy live in [POLICY.md](POLICY.md). Phases live in [ROADMAP.md](ROADMAP.md). Detailed tasks live in the GitHub Project.
>
> **Sources:** `docs/SDD.md` (v0.2) Sections 4–5, `docs/IMPLEMENTATION_PLAN.md`. If this file and the SDD disagree, the SDD wins and the conflict is raised as an Issue.

---

## 1. System at a glance

A responsive web app (no native mobile) built as a conventional three-tier system with two external services.

```
 Browser (React SPA, light + dark theme)
        │  HTTPS + JSON, JWT in Authorization header
        ▼
 Application server (Node.js + Express REST API)
   ├─ auth & per-project authorization middleware
   ├─ objective extraction orchestration
   ├─ allocation engine
   └─ daily notification job (scheduler)
        │                 │                     │
        ▼                 ▼                     ▼
 MongoDB Atlas      File/object storage     Language-model API
 (all records,      (syllabi, prompts,      (objective extraction,
  file metadata)     progress evidence)      server-side only)
```

**The one rule behind the diagram:** the browser talks **only** to the API. It never calls MongoDB, file storage or the AI service directly (SDD Figure 1).

## 2. Components and responsibilities

| Component | Owns | Must not |
|---|---|---|
| **Client** (`/client`, React) | Screens for both roles from one codebase; shows lead-only screens based on the role returned by the API for the open project; light and dark themes | Hold secrets; make authorization decisions; talk to the DB, storage or AI service |
| **API** (`/server`, Express) | Authentication, all authorization, validation, allocation, extraction orchestration, file upload/download brokering, the notification job | Trust role or project IDs sent by the client without checking membership |
| **Database** (MongoDB Atlas) | Users, projects, memberships, objectives, milestones, tasks, progress updates, posts, file metadata | Store file bytes, plaintext passwords or API keys |
| **File storage** | Uploaded course documents and evidence files | Be publicly readable; downloads go through the API or short-lived signed URLs |
| **Language-model API** | Turning uploaded document text (plus the lead's optional professor notes) into a *draft* objective list | Be called from the client; receive anything other than that project's course document text and professor notes |

Suggested repo layout (agents may refine, not replace): `/client`, `/server/src/{routes,middleware,models,services,jobs}`, `/docs`, root `.env.example`.

## 3. Core data model

Role is stored on **Membership**, not on User (DD-05). One user can be lead on one project and member on another.

| Collection | Key fields | Notes |
|---|---|---|
| `users` | name, email, passwordHash | No role field. |
| `projects` | name, joinCode, createdBy | Join code is per project (DD-08). |
| `memberships` | userId, projectId, role (`lead`/`member`) | One per user per project. The source of truth for access. |
| `profiles` | userId, projectId, strengths[], wantToPractice[] | Lead has one too. |
| `courseDocuments` | projectId, kind (`assignment`/`syllabus`), storageRef, uploadedBy | Metadata only. |
| `projects.profNote` | text, updatedBy, updatedAt | Optional professor notes for extraction. Same privacy as course documents (RC-08). |
| `objectives` | projectId, text, status (`draft`/`accepted`) | Allocation reads `accepted` only (RC-04). |
| `milestones` | projectId, title, dueDate | ≥ 2 per project allowed. |
| `allocations` | projectId, status (`proposed`/`accepted`), acceptedBy, acceptedAt | Only one accepted allocation is active. |
| `tasks` | projectId, milestoneId, assigneeId, objectiveIds[], basis (`strength`/`learning`), reason, status | Exactly one milestone per task. `reason` is required (RC-05). |
| `progressUpdates` | taskId, authorId, status, evidence (file ref or link), note, createdAt (server) | Append-only for others (RC-07). |
| `posts` | projectId, authorId, parentId (nullable), body, createdAt | One level of threaded reply minimum. |
| `files` | projectId, milestoneId, storageRef, uploadedBy, uploadedAt | Shared file space. |
| `notifications` | userId, taskId, milestoneId, createdAt, readAt | Channel pending OQ-04. |

## 4. Key flows

1. **Document intake & extraction:** lead uploads (and optionally adds professor notes) → API stores file in storage → API sends document text + professor notes to the language-model API → candidate objectives saved as `draft` → lead edits and accepts → status becomes `accepted`.
2. **Allocation:** API reads accepted objectives + every member's profile + milestones → proposes tasks with assignee, basis and reason → stored as `proposed` → lead reassigns and accepts → tasks become active. Nothing is assigned before acceptance (RC-06).
3. **Progress:** member updates own task status with evidence → API stamps author and server time → visible to whole team.
4. **Notification:** server scheduler runs daily → finds milestones exactly 3 days ahead → notifies members with incomplete tasks on them. Never triggered by client activity (RC-11).

## 5. Architectural rules agents must preserve

These are not optional and apply to every Issue.

1. **API-only access.** The client never contacts the database, file storage or AI service. (SDD Fig. 1)
2. **Authorize on the server, every request.** Every project-scoped route runs the membership middleware: authenticated → member of `:projectId` → role allowed for this action. Hiding a button is never the control. (RC-02)
3. **Scope every query by project.** Any query returning project data filters by a project the caller is a member of. Cross-project access is a defect. (RC-03)
4. **Role comes from Membership, looked up server-side,** never from a client field or a global user role. (DD-05)
5. **Server-generated timestamps** for progress, posts and files; never trust client time. (RC-07)
6. **Evidence is author-owned.** Only the author can create or update their own progress records; nobody can edit or delete another member's evidence. (RC-07)
7. **Draft objectives never reach allocation.** The allocation service reads only `status: accepted`. (RC-04)
8. **Every task stores a reason** naming its objective and basis; a task without one fails validation. (RC-05)
9. **Secrets in server environment only.** DB URI, JWT secret, storage keys and AI key come from env vars; `.env` is git-ignored; `.env.example` has placeholders only. (RC-12)
10. **Passwords:** bcrypt hash only; never logged or returned. (RC-01)
11. **Scheduled jobs run on the server** on a schedule, never from client calls. (RC-11)
12. **Accessibility is part of done:** WCAG 2.1 AA in both themes, labeled controls, keyboard operable, status shown by symbol + text. (RC-09)

## 6. Technology boundaries

| Use | Chosen | Do not introduce without a human decision |
|---|---|---|
| Client | React SPA, responsive (desktop + tablet) | Native mobile, React Native, server-side rendering frameworks |
| Server | Node.js + Express REST | GraphQL, microservices, a second backend language |
| Data | MongoDB Atlas | A second database |
| Auth | JWT + bcrypt | Third-party OAuth/SSO, public sign-up |
| Browsers | Current Chrome, Firefox, Safari, Edge | Legacy browser support |

## 7. Open architectural decisions (do not decide in code)

| ID | Question | Affects |
|---|---|---|
| OQ-01 | ~~Language-model API vs rules-based objective extraction~~ **Decided 2026-11, see Section 8** | Extraction service; RC-08 disclosure text |
| OQ-04 | In-app only vs email notifications | Notification job; adds mail dependency if email |
| OQ-05 | ~~Object storage vs storing files in MongoDB~~ **Decided 2026-11, see Section 8** | Upload, evidence and file-space Issues |

When an Issue hits one of these, stop and leave a comment for the human owner. Record each decision here as it is made.

## 8. Decision log

| Date | Decision | Ref |
|---|---|---|
| 2026-10 | Three-tier React / Express / MongoDB web app | SDD 5.1 |
| 2026-10 | Role stored per project on Membership | DD-05 |
| 2026-10 | Join code instead of emailed invite link | DD-08 |
| 2026-11 | Joining by code creates the user's account (email + bcrypt password) if they don't have one | Human review of Issue #14 |
| 2026-11 | Optional professor-notes text box on the upload screen; notes go to extraction with the documents and are covered by the RC-08 disclosure | Human UI review (frame A6/A6b) |
| 2026-11 | OQ-01: objective extraction uses a language-model API, the Gemini API, called server-side only. Key in `GEMINI_API_KEY` | Human decision, Issue #9 |
| 2026-11 | OQ-05: uploaded files are stored in MongoDB using GridFS (no separate object storage, so no storage keys) | Human decision, Issue #9 |
