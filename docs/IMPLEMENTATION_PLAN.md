**Group Project Accountability Tracker**

**Implementation Plan**

CSCI 5520 - AI-Driven Software Development

*Naitri \| Version 1.0 \| November 2026*

# 1 Implementation Overview

## 1.1 Implementation Objective

The Group Project Accountability Tracker will be implemented as a proof-of-concept responsive web application: a React single-page client, a Node.js/Express REST API, and MongoDB Atlas, with external file storage for uploaded documents and evidence and a server-side language-model call for extracting learning objectives. The target MVP is the full loop described in the SDD: a team lead creates a project, invites members by join code, uploads the assignment and syllabus, reviews the extracted learning objectives, defines milestones, and accepts an explainable, objective-aware task allocation; members then report progress with evidence, coordinate on a discussion board and milestone file space, and receive deadline notifications.

The implementation must preserve the SDD's two central commitments: the system advises and the team lead decides (DD-03, RC-06), and allocation balances existing strengths against learning needs with a visible reason for every task (DD-01, RC-05). Everything listed in SDD Section 2.3 as out of scope stays out of scope.

## 1.2 Source Design Artifacts

- Software Design Document: CSCI 5520 SDD - Group Project Accountability Tracker, v0.2 (October 2026).

- Interactive UI/UX prototype (Flow A frames A1-A11, Flow B B1-B9, Flow C C1-C2, Other screens D1-D7; light and dark themes): https://claude.ai/artifact/HKfsTPMQ3MnF5tz9CNLFDS (original Claude Design link in SDD Section 6.2).

- Architecture reference: SDD Figure 1 - three-tier web architecture with object storage and language-model API.

- Experience-flow reference: SDD Figure 2 - team lead setup path and team member working path.

- Other approved constraints: SDD Section 4 (RC-01 to RC-12), Section 6.3 design refinements, and Section 7 decisions and open questions (DD-01 to DD-08, OQ-01 to OQ-05).

- Repository: https://github.com/Nai-Nai100/Group-Assignment-Accountability-Tracker \| GitHub Project: https://github.com/users/Nai-Nai100/projects/4

## 1.3 Planning Assumptions & Scope Guardrails

- The SDD v0.2 and the prototype are the authoritative design inputs. Where they disagree, the SDD wins and the difference is recorded as an Issue rather than silently resolved.

- The MVP is a responsive web application for current Chrome, Firefox, Safari and Edge on desktop and tablet widths (RC-10, DD-06). No native mobile app, real-time chat, LMS integration, automated GitHub/Docs tracking, grading, or instructor interface will be built (SDD Section 2.3).

- There are exactly two roles, held per project: team lead and team member (DD-05). The team lead is also a team member and completes a skill profile.

- Authorization, project isolation and evidence integrity are enforced on the server (RC-02, RC-03, RC-07). A feature is not complete if it only hides controls in the UI.

- Five open questions (OQ-01 to OQ-05) are unresolved by design. Issues that depend on them are labeled and must not be finished until the human owner records a decision (see Section 6).

| **Planning principle:** Implementation agents may refine technical details inside the approved design, but they must not invent product scope, decide an open question (OQ-01 to OQ-05), or weaken an authorization, privacy or secrets rule without a documented human decision. |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|

# 2 Phase Summary

The tracker is divided into five phases. The sequence establishes trusted identity and project isolation first, then the two inputs allocation needs (profiles and reviewed objectives), then allocation itself, then the day-to-day progress and collaboration features, and finally end-to-end validation.

| **Phase** | **Goal / Increment**                                | **Primary SDD Sources**                                                            | **Key Deliverables**                                                                                                                            | **Depends On**                               | **Candidate Issues** |
|-----------|-----------------------------------------------------|------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------|----------------------|
| 1         | Foundation: accounts, projects & access control     | US-01, US-08, US-14, US-15; RC-01, RC-02, RC-03, RC-10, RC-12; DD-05, DD-06, DD-08 | React + Express scaffold; MongoDB Atlas; user/project/membership model; sign-in; join codes; project list; server-side role and project scoping | None                                         | TMP-01 to TMP-07     |
| 2         | Team setup: profiles, course documents & objectives | US-02, US-09, US-10; RC-02, RC-04, RC-08, RC-12; DD-02; OQ-01, OQ-05               | Skill profile; course document upload with disclosure; server-side objective extraction; objective review with draft vs accepted state          | Phase 1                                      | TMP-08 to TMP-11     |
| 3         | Milestones & objective-aware allocation             | US-03, US-11, US-12; RC-02, RC-05, RC-06; DD-01, DD-03; OQ-02, OQ-03               | Milestones; allocation scoring engine with reasons; lead review/reassign/accept; My Tasks view                                                  | Phases 1-2                                   | TMP-12 to TMP-15     |
| 4         | Progress, collaboration & notifications             | US-04, US-05, US-06, US-07, US-13; RC-03, RC-07, RC-08, RC-11; DD-04; OQ-04, OQ-05 | Status updates with evidence; whole-team progress view; discussion board; milestone file space; daily notification job                          | Phase 3 (tasks); Phase 1 for board and files | TMP-16 to TMP-20     |
| 5         | Integrated validation & MVP hardening               | All MVP user stories US-01 to US-15; RC-01 to RC-12                                | Acceptance checklist; authorization/isolation tests; end-to-end flow test; WCAG 2.1 AA audit; secrets/privacy review                            | Phases 1-4                                   | TMP-21 to TMP-25     |

# 3 Detailed Implementation Phases

## 3.1 Phase 1 - Foundation: Accounts, Projects & Access Control

### Goal

Establish the trusted identity, per-project role and project-isolation foundation that every later capability depends on, so that a signed-in user can see only the projects they belong to and act only with the role they hold on each one.

### Source Requirements / Design References

US-01, US-08, US-14, US-15; RC-01, RC-02, RC-03, RC-10, RC-12; DD-05, DD-06, DD-08; SDD Section 5.1 technology choices; SDD Figure 1 (client never talks to the database directly); SDD Figure 2 entry path (sign-in, project list, join by code).

### Deliverables

- Repository scaffold with a React single-page client and a Node.js/Express REST API, with all secrets read from server-side environment configuration and a committed .env.example containing no real values.

- MongoDB Atlas connection and the core data model: User, Project, and Membership, with the role (team lead or team member) stored on the Membership rather than on the User.

- Sign-in with bcrypt-hashed passwords and JWT sessions; no public sign-up route exists.

- Project creation by a user, who becomes that project's team lead, with a generated project join code.

- Join-by-code flow: an invited person enters their name and the code and is added as a team member.

- Server middleware that checks authentication, project membership and per-project role on every project-scoped request.

- Project list showing each project with the role held there, plus the team-lead-only refusal message shown to members.

### Phase Acceptance Criteria

- A valid account signs in and reaches its project list; an invalid password or unknown account is denied (US-01).

- A correct join code adds the person to that project as a team member; an incorrect code is rejected with an error (US-15).

- The project list shows every project the user belongs to with the correct role, and opening one returns only that project's data (US-14).

- A direct API request for another project's data, or a team-member request for a lead-only action, is rejected by the server, not just hidden in the UI (RC-02, RC-03).

- No password is stored or logged in plaintext, and no secret appears in client code or the repository (RC-01, RC-12).

### Dependencies & Sequence Notes

This phase has no prerequisite and must be completed first. The Membership model and the authorization middleware are shared by every later phase, so their shape should be settled and reviewed before Phase 2 begins. The light/dark theme shell and the sign-in screen can be built in parallel with the API work once the auth contract (request/response shape and token format) is agreed.

### Relevant UI/UX Artifacts

Prototype frames: A1/B1 Sign in, A2 Your projects, A3 Create a project, A4 Invite team members, A5 Team dashboard (team lead), B2 Your projects with pending invitation, B3 Enter name and join code, B4 Invitation accepted, B5 Team dashboard (team member), D4 Same person, different role, D6 Team member refused, D7 New member: join with a code. SDD Figure 2 entry path.

### Candidate GitHub Issues

- Scaffold React client and Express API with environment-based configuration

- Define User, Project and Membership data model with per-project roles

- Implement sign-in with bcrypt password hashing and JWT sessions

- Implement project-membership and role authorization middleware

- Implement project creation with join-code generation

- Implement join-a-project-by-code flow

- Build project list with per-project role and lead-only refusal screen

## 3.2 Phase 2 - Team Setup: Skill Profiles, Course Documents & Learning Objectives

### Goal

Give the project the two inputs allocation needs: every member's skill profile, and a lead-reviewed list of learning objectives extracted from the uploaded assignment and syllabus.

### Source Requirements / Design References

US-02, US-09, US-10; RC-02, RC-04, RC-08, RC-12; DD-02; OQ-01 (extraction method), OQ-05 (file storage); SDD Figure 1 document intake and extraction flow; SDD Section 6.3 upload-disclosure refinement.

### Deliverables

- Skill profile screen and API for current strengths and skills the member wants to practice, available to every member including the team lead.

- Lead-only upload of the assignment prompt and course syllabus, plus an optional professor-notes text box, with the third-party AI disclosure (covering documents and notes) shown directly above the extract button before upload (RC-08).

- File storage for uploaded documents, with only metadata and references kept in MongoDB (pending OQ-05).

- Server-side objective extraction from the document text and any professor notes, writing candidate objectives marked as unreviewed; the AI service key never reaches the client.

- Objective review screen where the lead can edit, add and remove objectives, with a visible difference between the unreviewed draft and the accepted list.

### Phase Acceptance Criteria

- A saved profile persists across sessions and the team lead's own profile is stored like any other member's (US-02).

- Both documents are stored against the project and the system returns an extracted objective list for review (US-09).

- Course documents and professor notes are visible only to members of the uploading project (RC-08, RC-03).

- Professor notes, when entered, are saved with the project and included in the extraction request; extraction still works when they are empty.

- The lead's edited objective list is saved, and only the accepted list, never the raw extraction, is exposed to allocation (US-10, RC-04).

- A team member cannot upload documents or edit objectives; the API rejects the request (RC-02).

### Dependencies & Sequence Notes

Requires the Phase 1 membership model and authorization middleware. OQ-01 (language-model API vs. rules-based extraction) and OQ-05 (object storage vs. database) must be decided by the human owner before the extraction and upload issues are implemented; the skill profile issue can start immediately and in parallel. Extraction quality should be tested against at least the CSCI 5520 syllabus before Phase 3 depends on it.

### Relevant UI/UX Artifacts

Prototype frames: D1 Skill profile, A6b Upload course documents (after: privacy disclosure directly above the extract button; A6 shows the rejected before state), and A7 Review extracted learning objectives (editable unreviewed draft, with the darkened add-item label from the RC-09 contrast fix).

### Candidate GitHub Issues

- Build member skill profile (strengths and skills to practice)

- Implement course document upload with RC-08 disclosure

- Implement server-side learning objective extraction

- Build learning objective review with draft vs. accepted state

## 3.3 Phase 3 - Milestones & Objective-Aware Allocation

### Goal

Turn accepted objectives, member profiles and dated milestones into a proposed, explainable task split that the team lead adjusts and accepts, after which every member can see their assigned tasks and why each was assigned.

### Source Requirements / Design References

US-03, US-11, US-12; RC-02, RC-05, RC-06; DD-01, DD-03; OQ-02 (weighting rule), OQ-03 (contested objectives); SDD Figure 1 allocation flow.

### Deliverables

- Lead-only milestone creation with distinct due dates; every task belongs to exactly one milestone.

- Allocation engine on the server that reads the accepted objectives, every member's profile and the milestones, and proposes tasks with an assignee and a human-readable reason naming the objective and whether it is a strength or a learning opportunity.

- Allocation review screen where the lead sees each proposed task's assignee and reason, reassigns tasks, and explicitly accepts the proposal.

- My Tasks view showing each assigned task's milestone, due date and allocation reason.

### Phase Acceptance Criteria

- Two or more milestones with distinct due dates can be created, and every task is tied to exactly one milestone (US-12).

- Every proposed and assigned task stores and displays a reason naming its objective and strength/learning basis (RC-05).

- The lead can reassign any task before acceptance, and no task appears as assigned to members until the lead accepts (US-11, RC-06).

- Every member's My Tasks view lists their tasks with milestone, due date and reason (US-03).

- Allocation is triggered and accepted only by the team lead; member requests are rejected by the API (RC-02).

### Dependencies & Sequence Notes

Requires Phase 2's accepted objective list and skill profiles. OQ-02 (the concrete weighting formula) is the most important unresolved item and blocks the allocation engine; OQ-03 (tie-breaking for contested objectives) must be decided at the same time. Milestones can be built in parallel with Phase 2. The allocation review UI can be built against a stubbed proposal while the engine waits on OQ-02.

### Relevant UI/UX Artifacts

Prototype frames: A8 Milestones, A9 Proposed allocation, A10 Reassign one task, A11 Allocation accepted, B6 My tasks, D5 My tasks before allocation is accepted, and D6 Team member refused (proposed allocation). The allocation reason appears on A9, B6, B7 and B9 (SDD Section 6.3).

### Candidate GitHub Issues

- Implement milestone creation and listing

- Implement allocation engine with per-task reasons

- Build allocation review, reassign and accept screen

- Build My Tasks view with milestone, due date and reason

## 3.4 Phase 4 - Progress, Collaboration & Deadline Notifications

### Goal

Make contribution visible as it happens: members report progress with evidence, the lead sees whole-team status, the team coordinates on a board and in a milestone-organized file space, and members are warned three days before a milestone with open tasks.

### Source Requirements / Design References

US-04, US-05, US-06, US-07, US-13; RC-03, RC-07, RC-08, RC-11; DD-04; OQ-04 (notification channel), OQ-05 (file storage); SDD Figure 1 notification flow.

### Deliverables

- Task status updates (in progress, complete) with an attached file or link, saved with author and server-generated timestamp.

- Whole-team progress view listing every member's open and completed tasks per milestone, with links to evidence.

- Post-based discussion board with at least one level of threaded reply.

- Shared file space grouped by milestone, showing uploader and upload time.

- Daily scheduled server job that finds milestones three days ahead and notifies members with incomplete tasks on them.

### Phase Acceptance Criteria

- A status change and its evidence are saved with author and server timestamp and are visible to every team member (US-04).

- No user can edit or delete another member's progress evidence; the API rejects the attempt (RC-07).

- The team progress view lists every member's open and completed tasks per milestone with evidence links (US-13).

- A post is saved with author and timestamp, is visible to the team, and supports a threaded reply (US-06).

- An uploaded file appears under its milestone, is downloadable by every member, and shows uploader and time (US-07).

- A member with an incomplete task on a milestone three days ahead receives a notification naming the task and date; a member with no incomplete tasks on it does not (US-05, RC-11).

### Dependencies & Sequence Notes

Progress reporting, the team progress view and notifications depend on Phase 3 tasks and milestones. The discussion board and file space depend only on Phase 1 and can be built in parallel with Phases 2-3. The notification job must be server-scheduled rather than client-triggered (RC-11), and OQ-04 (in-app vs. email) must be decided before it is finished. The file space reuses the storage decision made for OQ-05.

### Relevant UI/UX Artifacts

Prototype frames: B7 Task detail, B8 Complete with evidence, B9 Team progress, D2 Discussion board, D3 Shared files, C1 Notification received, and C2 Lands on the relevant task. Status must be shown by symbol and text, not color alone (RC-09).

### Candidate GitHub Issues

- Implement task status update with evidence attachment

- Build whole-team progress view

- Build discussion board with threaded replies

- Build milestone-organized shared file space

- Implement daily deadline notification job

## 3.5 Phase 5 - Integrated Validation & MVP Hardening

### Goal

Validate the complete proof-of-concept against every SDD user story and constraint across both roles, then fix the highest-value defects without adding new scope.

### Source Requirements / Design References

All MVP user stories and RC-01 through RC-12; all prototype flows; SDD Section 7.1 key design decisions.

### Deliverables

- Acceptance checklist mapping every US-01 to US-15 pass/fail check to a test or demonstration.

- Authorization and project-isolation test suite covering lead-only actions, cross-project access and evidence integrity.

- End-to-end run of the full flow: lead setup, invite, upload, objective review, milestones, allocation, member progress with evidence, and notification.

- WCAG 2.1 AA audit of both light and dark themes, with fixes.

- Review confirming no secrets in client code or the repository and correct handling of course documents.

### Phase Acceptance Criteria

- Every US-01 to US-15 pass/fail check is demonstrated or documented as passing.

- No known cross-project access path, lead-action bypass, or exposed secret remains.

- Both themes meet WCAG 2.1 AA contrast and the primary flows are keyboard operable (RC-09).

- Known non-blocking limitations are documented rather than hidden.

### Dependencies & Sequence Notes

Depends on all previous phases. Defect fixes may return work to earlier phase areas, but no new product scope (for example GitHub tracking, chat or an instructor view) may be added during hardening without an explicit human decision.

### Relevant UI/UX Artifacts

All prototype frames in both the light and dark themes: Flow A (A1-A11), Flow B (B1-B9), Flow C (C1-C2) and Other screens (D1-D7), especially the refusal state D6.

### Candidate GitHub Issues

- Create SDD acceptance-criteria validation checklist

- Run authorization and project-isolation test suite

- Run end-to-end lead setup to member completion test

- Run WCAG 2.1 AA accessibility audit for light and dark themes

- Verify secrets handling and course-document privacy

# 4 Cross-Phase Dependencies & Implementation Sequence

The critical path runs through the Membership model and authorization middleware (Phase 1), the reviewed objective list (Phase 2), and the allocation engine (Phase 3). Allocation is the highest-risk item because it depends on two open questions (OQ-02, OQ-03) and on extraction quality (OQ-01); it should not begin until those decisions are recorded. Work that depends only on Phase 1 - skill profiles, milestones, the discussion board and the file space - can run in parallel with the critical path. No feature may read the raw extraction instead of the accepted objective list, and no task may be shown as assigned before the lead accepts.

## 4.1 Dependency / Sequence Table

| **Item / Capability**         | **Must Follow**                                                  | **Reason**                                                                | **Can Run in Parallel With**     |
|-------------------------------|------------------------------------------------------------------|---------------------------------------------------------------------------|----------------------------------|
| Authorization middleware      | User/Project/Membership model (TMP-02)                           | Every project-scoped route depends on membership and per-project role     | Sign-in UI, theme shell          |
| Objective extraction          | OQ-01 decision; document upload (TMP-09)                         | Extraction needs stored text and an approved method                       | Skill profiles, milestones       |
| Allocation engine             | OQ-02/OQ-03 decisions; accepted objectives; profiles; milestones | Allocation must use reviewed objectives only (RC-04) and a stated formula | Discussion board, file space     |
| My Tasks / progress reporting | Accepted allocation (TMP-14)                                     | No task is assigned until the lead accepts (RC-06)                        | Discussion board, file space     |
| Deadline notifications        | Milestones + tasks with status; OQ-04 decision                   | Job needs milestone dates and incomplete-task data                        | Team progress view               |
| Integrated validation         | Phases 1-4                                                       | Needs both roles, all data and the full flow                              | Targeted defect fixes and polish |

# 5 GitHub Issue Decomposition Guidance

Each candidate item becomes one GitHub Issue, drafted by Claude Code from this plan and the SDD, then reviewed by the human owner before it is marked Reviewed. Issues reference the SDD and this plan by ID rather than copying them. A coding agent should be able to understand the goal, constraints, definition of done and visual context without redesigning the feature. Every Issue body uses the same sections:

- Title states a concrete outcome (for example "Build My Tasks view with milestone, due date and reason", not "Tasks page").

- Context and goal in two or three sentences, with the phase and the SDD IDs (US/RC/DD/OQ) it satisfies.

- Acceptance criteria as a checklist, reusing the SDD pass/fail checks where they apply.

- Design references: the prototype frame ID (for example A9 Proposed allocation), a screenshot when the Issue changes the UI, and the SDD figure when it changes data flow.

- Dependencies (other TMP/Issue numbers or OQ decisions) and explicit non-goals.

- Testing and verification: how a reviewer confirms it works, including at least one negative/authorization check for any server endpoint.

- Scoped so one focused implementation and review cycle can complete it; anything larger is split into sub-issues.

## 5.1 Candidate Issue Inventory

| **ID** | **Issue Title**                                                            | **Phase** | **SDD Sources**                   | **Depends On**         | **Notes / Visual Context**                  |
|--------|----------------------------------------------------------------------------|-----------|-----------------------------------|------------------------|---------------------------------------------|
| TMP-01 | Scaffold React client and Express API with environment-based configuration | 1         | US-01, US-14; RC-10, RC-12        | None                   | SDD Figure 1; Section 5.1 technology table. |
| TMP-02 | Define User, Project and Membership data model with per-project roles      | 1         | US-14; RC-03; DD-05               | TMP-01                 | Role lives on Membership, not User (DD-05). |
| TMP-03 | Implement sign-in with bcrypt password hashing and JWT sessions            | 1         | US-01; RC-01                      | TMP-02                 | Frames A1, B1.                              |
| TMP-04 | Implement project-membership and role authorization middleware             | 1         | RC-02, RC-03                      | TMP-02, TMP-03         | Shared by every later issue; no UI.         |
| TMP-05 | Implement project creation with join-code generation                       | 1         | US-08; RC-01; DD-08               | TMP-04                 | Frames A3, A4 (join code shown to lead).    |
| TMP-06 | Implement join-a-project-by-code flow                                      | 1         | US-15; RC-01; DD-08               | TMP-05                 | Frames B2, B3, B4, D7.                      |
| TMP-07 | Build project list with per-project role and lead-only refusal screen      | 1         | US-14; RC-02, RC-09               | TMP-04                 | Frames A2, A5, B5, D4, D6.                  |
| TMP-08 | Build member skill profile (strengths and skills to practice)              | 2         | US-02                             | Phase 1                | Frame D1. Lead completes one too.           |
| TMP-09 | Implement course document upload with RC-08 disclosure                     | 2         | US-09; RC-08; OQ-05               | Phase 1                | Frame A6b. Needs OQ-05 decision.            |
| TMP-10 | Implement server-side learning objective extraction                        | 2         | US-09; RC-04, RC-12; DD-02; OQ-01 | TMP-09                 | Needs OQ-01 decision. Server-side only.     |
| TMP-11 | Build learning objective review with draft vs. accepted state              | 2         | US-10; RC-04                      | TMP-10                 | Frame A7 (draft vs accepted).               |
| TMP-12 | Implement milestone creation and listing                                   | 3         | US-12; RC-02                      | Phase 1                | Frame A8. Can run parallel to Phase 2.      |
| TMP-13 | Implement allocation engine with per-task reasons                          | 3         | US-11; RC-05; DD-01; OQ-02, OQ-03 | TMP-08, TMP-11, TMP-12 | Blocked on OQ-02/OQ-03 decisions.           |
| TMP-14 | Build allocation review, reassign and accept screen                        | 3         | US-11; RC-06; DD-03               | TMP-13                 | Frames A9, A10, A11, D6. UI can use a stub. |
| TMP-15 | Build My Tasks view with milestone, due date and reason                    | 3         | US-03; RC-05                      | TMP-14                 | Frames B6, D5.                              |
| TMP-16 | Implement task status update with evidence attachment                      | 4         | US-04; RC-07                      | TMP-15                 | Frames B7, B8.                              |
| TMP-17 | Build whole-team progress view                                             | 4         | US-13; RC-03                      | TMP-16                 | Frame B9.                                   |
| TMP-18 | Build discussion board with threaded replies                               | 4         | US-06; RC-03                      | Phase 1                | Frame D2. Parallel to Phases 2-3.           |
| TMP-19 | Build milestone-organized shared file space                                | 4         | US-07; RC-03; OQ-05               | Phase 1, TMP-09        | Frame D3. Reuses OQ-05 storage.             |
| TMP-20 | Implement daily deadline notification job                                  | 4         | US-05; RC-11; OQ-04               | TMP-12, TMP-16         | Frames C1, C2. Needs OQ-04.                 |
| TMP-21 | Create SDD acceptance-criteria validation checklist                        | 5         | US-01 to US-15                    | Phases 1-4             | Maps every pass/fail check to evidence.     |
| TMP-22 | Run authorization and project-isolation test suite                         | 5         | RC-02, RC-03, RC-07               | Phases 1-4             | Includes cross-project API attempts.        |
| TMP-23 | Run end-to-end lead setup to member completion test                        | 5         | US-01 to US-15                    | Phases 1-4             | Full lead and member flow.                  |
| TMP-24 | Run WCAG 2.1 AA accessibility audit for light and dark themes              | 5         | RC-09                             | Phases 1-4             | Both themes, keyboard, labels.              |
| TMP-25 | Verify secrets handling and course-document privacy                        | 5         | RC-08, RC-12                      | Phases 1-4             | Repo scan + client bundle check.            |

TMP identifiers are replaced with GitHub Issue numbers once the Issues are created; the mapping is recorded in each Issue body.

# 6 Risks, Open Decisions & Agent Guardrails

### Open decisions that block specific Issues

- **OQ-02 Allocation weighting rule (blocks TMP-13):** the most important unresolved item. A concrete scoring formula must be written down by the human owner before the allocation engine is implemented. An agent must not invent one.

- **OQ-03 Contested objectives (blocks TMP-13):** the tie-break when two members both need the same objective (rotate across milestones, split the task, or defer to the lead) must be decided with OQ-02.

- **OQ-01 Extraction method (blocks TMP-10):** language-model API vs. rules-based parsing, to be decided after testing against real syllabi including CSCI 5520's. If rules-based is chosen, the RC-08 third-party disclosure changes.

- **OQ-04 Notification channel (blocks completing TMP-20):** in-app only vs. email. Email adds a mail-delivery dependency.

- **OQ-05 File storage (blocks TMP-09 and TMP-19):** object storage vs. database storage; object storage is assumed but not confirmed.

### Risks

- Extraction quality drives everything downstream: a poor extraction that the lead clicks through produces a wrong allocation that is hard to notice. RC-04's visible draft state is the mitigation and must not be weakened.

- Authorization mistakes are the most likely serious defect because role is per project. Every new endpoint needs a cross-project and a member-calls-lead-action test.

- Free-tier limits on the AI service, file storage or MongoDB Atlas could interrupt demonstrations; test with small files early.

### Agent guardrails

- Never decide OQ-01 to OQ-05; stop and ask, or leave the Issue open with a note.

- Never let the client call MongoDB, file storage or the AI service directly; all access goes through the API (SDD Figure 1).

- Never commit secrets or put keys in client code; use server environment variables and keep .env.example free of real values (RC-12).

- Never allow a user to edit or delete another member's progress evidence (RC-07), and never share course documents across projects (RC-08).

- Never activate an allocation without explicit lead acceptance (RC-06), and never feed unreviewed objectives into allocation (RC-04).

- Never add out-of-scope features (GitHub/Docs tracking, chat, mobile app, LMS integration, grading, instructor view) without a recorded human decision.

# 7 Handoff to GitHub Project

The 25 candidate Issues will be created in the repository by Claude Code running under the AiDev identity and added to the existing GitHub Project, Group Assignment Accountability Tracker. Once created, the Project and its Issues become the authoritative source for detailed tasks, sequencing and status; this plan remains the human-readable explanation of why the phases are ordered as they are, and ROADMAP.md points to the Project rather than duplicating it. The practice Issues from Lab 2 are closed so the board contains only implementation work.

Project fields carry the following metadata:

- **Status:** Backlog, Ready, In Progress, Agent Review, Done in Dev, Staging Candidate, Released. New Issues start in Backlog.

- **Phase:** Phase 1 - Foundation, Phase 2 - Team Setup, Phase 3 - Allocation, Phase 4 - Progress & Collaboration, Phase 5 - Validation.

- **Human Review:** Pending or Reviewed. Every AI-created Issue starts Pending and is set to Reviewed only after the human owner has checked its context, SDD traceability, acceptance criteria, design references, dependencies and test expectations.

- **Sequence:** the TMP number (1-25), giving agents an unambiguous build order.

- **Priority:** P0 for the critical path (auth, authorization, objectives, allocation), P1 for core member features, P2 for collaboration and polish.

- **Area:** Frontend, Backend, Database, DevOps, Docs.

- **Labels:** needs-decision on Issues blocked by an open question (TMP-09, TMP-10, TMP-13, TMP-19, TMP-20).

## 7.1 Final Readiness Checklist

- US-01 through US-15 are each represented in at least one phase and candidate Issue.

- RC-01 through RC-12 are each implemented in a specific phase or covered by Phase 5 validation.

- Each phase ends with an observable, testable increment rather than an internal-only activity.

- Dependencies and blocking open questions are explicit, so an agent will not guess the order of high-risk work or decide OQ-01 to OQ-05.

- Prototype screens and SDD figures are identified for every Issue that changes the UI or data flow.

- No phase introduces scope that conflicts with the SDD's MVP or non-goals.

- The candidate Issue inventory is detailed enough to create GitHub Issues without another design exercise.
