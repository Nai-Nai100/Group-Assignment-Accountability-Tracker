# ROADMAP.md — Group Project Accountability Tracker

> **Purpose of this file:** the high-level direction of the build: which phases come in which order, and why.
>
> **This file is not the task list.** The **[GitHub Project](https://github.com/users/Nai-Nai100/projects/4)** and its **[Issues](https://github.com/Nai-Nai100/Group-Assignment-Accountability-Tracker/issues)** are the authoritative source for detailed tasks, sequencing, dependencies, status and work tracking. If this file and the Project disagree about a task, the Project wins; update this file only when a phase itself changes.
>
> Technical rules: [ARCHITECTURE.md](ARCHITECTURE.md) · Product and privacy rules: [POLICY.md](POLICY.md) · Full reasoning: `docs/IMPLEMENTATION_PLAN.md` · Requirements: `docs/SDD.md`

---

## MVP goal

One full loop working end to end: a team lead sets up a project, the team gets an explainable, objective-aware task split that the lead accepted, and members report progress with evidence, coordinate, and get deadline reminders.

## Phases

| # | Phase | What exists when it's done | Key SDD stories | Project filter |
|---|---|---|---|---|
| 1 | **Foundation**: accounts, projects & access control | Sign in, create a project, join by code, project list with per-project role, server-side authorization and project isolation | US-01, US-08, US-14, US-15 | `Phase = Phase 1 - Foundation` / label `phase-1` |
| 2 | **Team setup**: profiles, course documents & objectives | Skill profiles; course document upload with disclosure; extracted objectives the lead reviews and accepts | US-02, US-09, US-10 | `phase-2` |
| 3 | **Allocation**: milestones & objective-aware split | Milestones; proposed allocation with reasons; lead reassigns and accepts; My Tasks view | US-03, US-11, US-12 | `phase-3` |
| 4 | **Progress & collaboration** | Status updates with evidence; team progress view; discussion board; milestone file space; 3-day deadline notifications | US-04, US-05, US-06, US-07, US-13 | `phase-4` |
| 5 | **Validation & hardening** | Every SDD pass/fail check demonstrated; authorization, accessibility and secrets reviews passed | All | `phase-5` |

## Order and why

```
Phase 1 ──► Phase 2 ──► Phase 3 ──► Phase 4 (progress, notifications) ──► Phase 5
    │                     ▲
    └──► milestones, discussion board, file space (can run in parallel after Phase 1)
```

- **Phase 1 first:** every feature depends on knowing who the user is, which projects they belong to and their role there.
- **Phase 2 before 3:** allocation needs accepted objectives and every member's profile.
- **Phase 3 is the critical, highest-risk phase:** it is the core of the product and is blocked by open decisions (below).
- **Board and file space** depend only on Phase 1, so they can be built early to keep work moving while allocation waits on decisions.

## Decisions blocking the roadmap

These need a human decision before the listed work can finish. Issues carrying them have the `needs-decision` label.

| Decision | Blocks | Status |
|---|---|---|
| OQ-02 Allocation weighting formula | Phase 3 allocation engine | Open — highest priority |
| OQ-03 Tie-break for contested objectives | Phase 3 allocation engine | Open |
| OQ-01 Objective extraction method | Phase 2 extraction | Open |
| OQ-05 File storage approach | Phase 2 upload, Phase 4 file space | Open |
| OQ-04 Notification channel | Phase 4 notifications | Open |

## After the MVP (not planned work)

Recorded so they are not lost, **not** to be built now: automatic contribution signals from GitHub or document history (DD-04), email or mobile push channels if OQ-04 chooses in-app only, richer allocation tuning once real teams have used it.

## How work moves

Issues flow through the Project's Status field: Backlog → Ready → In Progress → Agent Review → Done in Dev → Staging Candidate → Released. AI-created Issues start with **Human Review = Pending** and become **Reviewed** only after the human owner checks them. Code merges to `dev` freely; promotion to `staging` and `main` requires the human code owner's approval (see `.github/CODEOWNERS` and the repository rulesets).
