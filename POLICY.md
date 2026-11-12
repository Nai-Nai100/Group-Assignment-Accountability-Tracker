# POLICY.md — Group Project Accountability Tracker

> **Purpose of this file:** the enduring product, domain, privacy and ethical rules that hold no matter how the code is structured. Implementation agents must follow these in every Issue.
> Technical structure and architectural rules live in [ARCHITECTURE.md](ARCHITECTURE.md). Phases live in [ROADMAP.md](ROADMAP.md).
>
> **Sources:** `docs/SDD.md` (v0.2) Sections 1–4 and 7. If this file and the SDD disagree, the SDD wins and the conflict is raised as an Issue.

---

## 1. What the product is for

Help student teams split project work so it is **fair** (contribution is visible as it happens) and **teaches** (every member practices the learning objectives the assignment was designed to teach, not just what they are already good at).

**Core principle: the system advises, the team lead decides.** Software proposes; a human accepts (DD-03).

## 2. Terminology

Use these words consistently in code, UI and Issues.

| Term | Meaning |
|---|---|
| **Project** | One team's workspace for one assignment. |
| **Team lead** | The member who created the project. Also a team member. Role held per project. |
| **Team member** | Anyone in the project. The lead is also a team member. |
| **Join code** | Short code the lead shares so an invited person can join. The only way in. |
| **Skill profile** | A member's "I'm strong at" list and "I want to practice" list. |
| **Course documents** | The assignment prompt and course syllabus uploaded by the lead. |
| **Learning objective** | A skill the assignment is meant to develop. **Draft** = extracted, not yet reviewed. **Accepted** = reviewed and saved by the lead. |
| **Milestone** | A dated checkpoint. Every task belongs to exactly one. |
| **Allocation** | The proposed split of tasks. **Proposed** until the lead **accepts** it. |
| **Allocation reason** | Plain-language explanation of why a task went to a person: which objective, and whether as a **strength** or a **learning opportunity**. |
| **Evidence** | A file or link attached to a progress update. |

Do not use "admin", "owner", "manager" or "instructor account"; those roles do not exist.

## 3. Roles and permissions

There are exactly two roles, and they are **per project** (DD-05). There is no instructor user (DD-07).

| Action | Team member | Team lead |
|---|:-:|:-:|
| Sign in, see own project list, open own projects | ✓ | ✓ |
| Join a project with a valid code | ✓ | – |
| Create a project (becomes its lead) | ✓ | ✓ |
| Edit own skill profile | ✓ | ✓ |
| View the join code / invite members | – | ✓ |
| Upload course documents | – | ✓ |
| Edit, add, remove, accept learning objectives | – | ✓ |
| Create milestones | – | ✓ |
| Trigger, reassign and accept allocation | – | ✓ |
| View own tasks and their reasons | ✓ | ✓ |
| Update status and attach evidence on **own** tasks | ✓ | ✓ |
| View whole-team progress and everyone's evidence | ✓ | ✓ |
| Post and reply on the discussion board | ✓ | ✓ |
| Upload and download shared files | ✓ | ✓ |
| Edit or delete **another** member's evidence | ✗ | ✗ |

A member who opens a lead-only screen sees a short message naming the project's team lead, not the screen's contents (SDD 6.3, frame D6).

## 4. Business rules and workflows

**Access**
- No public sign-up. A person joins a project only with a valid join code issued by its lead (RC-01).
- A wrong code is rejected with an error and creates nothing.
- Joining always grants the team member role, never team lead.
- Joining creates the person's account if they have none; otherwise the membership is added to their existing account.

**Learning objectives**
- Extracted objectives are always a **draft** first. They are never used for allocation until the lead reviews and accepts them (RC-04).
- The UI must make the draft vs accepted difference visible.
- Teams do not type objectives from scratch as the starting point; they come from the instructor's documents (DD-02). The lead may correct, add and remove.
- The lead may add optional **professor notes** on the upload screen: anything the instructor said that is not in the documents. The notes are extraction input only, read together with the documents; they never replace the documents and never skip the draft review (RC-04).

**Allocation**
- Allocation balances existing strengths against learning needs; neither side may be dropped (DD-01).
- Every task shows its reason (RC-05). An allocation that cannot be explained to the team is not acceptable.
- Nothing is assigned until the lead accepts. The lead can reassign any task first (RC-06).
- The lead's own profile is part of the allocation like everyone else's.
- The weighting formula (OQ-02) and the tie-break for contested objectives (OQ-03) are **not decided**. Agents must not invent them.

**Milestones and progress**
- A project can have several dated milestones; every task belongs to exactly one.
- Progress is **self-reported** with evidence for the MVP (DD-04). It is not automatically tracked from GitHub, Google Docs or anything else.
- Each progress update records its author and a server timestamp and is visible to the whole team (RC-07).

**Notifications**
- Three days before a milestone, a member with at least one incomplete task on it is notified, naming the task and date. A member with no incomplete tasks on it is not (US-05).
- Notifications come from a daily server job, not from someone opening the app (RC-11). Channel is pending OQ-04.

**Collaboration**
- The discussion board is post-based with threaded replies. It is **not** real-time chat.
- The shared file space is organized by milestone and shows uploader and time.

## 5. Privacy and data handling

- **Project isolation:** a user sees only data from projects they belong to (RC-03).
- **Course documents may be instructor-owned material.** They are visible only to the uploading team, never shared across teams, and used for nothing except objective extraction for that project (RC-08).
- **Professor notes are treated like course documents:** visible only to that project's team and used only for that project's objective extraction.
- **Disclose before upload:** if a third-party AI service does the extraction, the upload screen must say so above the extract button, before the user uploads, and the disclosure must name both the documents and the professor notes (RC-08, frame A6b).
- **Send the minimum:** only course document text and the lead's professor notes go to the AI service; never names, profiles, progress or evidence.
- **Credentials:** passwords stored only as salted hashes; secrets never in client code or the repo (RC-01, RC-12).

## 6. Ethical boundaries

- **Report what was done, not how well.** The system never grades, scores or ranks the quality of a member's work (SDD 2.3).
- **Coordination tool, not surveillance tool.** No instructor view (DD-07) and no automatic activity tracking in the MVP (DD-04). Adding either changes how honestly people report and needs an explicit human decision.
- **Evidence is protected.** No one, including the lead, can edit or delete another member's submitted evidence. This protects the record from the disputes the product exists to prevent.
- **Humans make consequential decisions.** The lead can see context software cannot (illness, other workload, personal goals), so allocation stays advisory.

## 7. Accessibility

WCAG 2.1 AA in **both** light and dark themes: normal text contrast at least 4.5:1, large text at least 3:1, keyboard operable primary flows, labeled form controls, and status shown by symbol and text, never color alone. Allocation reasons and task states must be readable by assistive technology (RC-09).

## 8. Out of scope (do not build without a human decision)

GitHub/Google Docs activity tracking · native mobile apps · real-time chat · LMS integration (Canvas, Blackboard) · grading or quality scoring · instructor login or dashboard · public sign-up · emailed magic-link invitations.
