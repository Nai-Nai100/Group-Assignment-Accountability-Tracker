# CLAUDE.md — Group Project Accountability Tracker

Always-on rules for Claude Code in this repo. Details live in the linked files; don't copy them here.

## Sources of truth
- **The task:** the GitHub Issue you're given. Only work Issues with Human Review = Reviewed and Status = Ready. Its acceptance criteria define "done".
- **Technical rules:** `ARCHITECTURE.md` (Section 5 rules apply to every Issue).
- **Product, roles, privacy:** `POLICY.md`.
- **Phases:** `ROADMAP.md`. The GitHub Project is the real backlog.
- **Detail:** `docs/SDD.md`, `docs/IMPLEMENTATION_PLAN.md`. If docs disagree, the SDD wins. Report the conflict, don't fix it in code.

## How to work
- Use the `work-issue` skill for every Issue.
- **Keep it simple:** fewest lines that meet the acceptance criteria. No extra features, abstractions or libraries "for later".
- **Build order:** UI first → validation → database → test everything together.
- Stack: React (`/client`), Node + Express (`/server`), MongoDB Atlas, JWT + bcrypt. Nothing new without a human decision.

## Agents
- `test-writer` — writes tests, including negative auth tests, for every endpoint.
- `policy-reviewer` — checks the change against ARCHITECTURE.md Section 5 and POLICY.md. Read-only.
- `accessibility-checker` — checks any UI change for WCAG 2.1 AA in light and dark themes. Read-only.

## Testing
- Server: Jest + Supertest in `server/tests/`. Client: Vitest + React Testing Library.
- Every API endpoint needs at least one negative test (not signed in, wrong project, or member calling a lead action).
- Run tests before opening a PR. Never open a PR with failing tests.

## Git rules
- Branch from `dev` as `feature/<issue#>-<short-name>`. PRs go into `dev` only, with `Closes #<issue#>`.
- Never push to, merge into, or open PRs into `staging` or `main`. Promotion is done by the human code owner.
- No force pushes. No changes to rulesets or repo settings.
- Commit format: `type(scope): summary (#issue)`.

## Secrets
Never read, create or commit `.env`. Use `.env.example` with placeholder values only. Never put keys, URIs or passwords in code, tests, Issues or PRs.

## Stop and ask the human when
- The work needs OQ-01 to OQ-05 decided, or the Issue has the `needs-decision` label. Comment on the Issue instead of guessing.
- Roles or permissions would change beyond what POLICY.md says.
- You need a dependency outside the stack above.
- Acceptance criteria are unclear, or the Issue is too big for one PR.
- Anything is out of scope per POLICY.md Section 8.