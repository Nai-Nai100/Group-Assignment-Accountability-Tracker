# UI Navigation Flow — Group Project Accountability Tracker

Source: Claude Design prototype — https://claude.ai/artifact/HKfsTPMQ3MnF5tz9CNLFDS
Frame IDs (A1–D7) match the prototype's Frames page. Use this map when building the React UI.

---

## Entry (not signed in)

**A1 · Sign in**
- **Sign in** → A2 (Your projects)
- **Have a join code? Join your team →** → D7 (Join your team)

**D7 · Join your team** (new person, no account)
- Code + full name + university email → **Join team** → A2 (account created, project in list)
- **Already have an account? Sign in** → A1

---

## Flow A · Team lead

**A2 · Your projects**
- **+ Create a new project** → A3
- **Open project** → A5 (lead dashboard)
- **Join another project with a code** → **Join** → stays on A2, project added

**A3 · Create a project**
- Name + course → **Create project** → A4 (creator becomes team lead)
- **Cancel** → A2

**A4 · Invite team members**
- Name + email → **Send invite** → stays on A4 (pending invite listed)
- Copy join code
- Sidebar **Dashboard** → A5

**A5 · Team dashboard (lead)** — 4-step setup checklist
- Step 1 **Upload** → A6
- Step 2 **Review** → A7
- Step 3 **Edit milestones** → A8
- Step 4 **Review proposal** → A9

**A6 / A6b · Upload course documents**
- Assignment prompt + syllabus → **Extract learning objectives** → A7
- Optional **Notes from your professor** text box (anything special the instructor said); sent to the AI together with the documents for extraction
- A6b = privacy disclosure shown directly above the Extract button

**A7 · Learning objectives (draft)**
- Edit / add / delete (any edit returns list to draft)
- **Accept** → objectives accepted + allocation auto-proposed
- Sidebar **Milestones** → A8

**A8 · Milestones**
- Name + date → **Add milestone** (can't delete a milestone that has tasks)
- Sidebar **Proposed Allocation** → A9

**A9 · Proposed allocation**
- Change a row's assignee dropdown → A10 (row highlighted, reason updates)
- **Accept allocation** → A11

**A10 · Reassigned** → **Accept allocation** → A11

**A11 · Allocation accepted** — tasks now appear in every member's My Tasks

---

## Flow B · Team member

**B1 · Sign in** → **Sign in** → B2

**B2 · Your projects + pending invitation**
- **Accept and join** → B3
- **Decline** → invitation removed
- **Open project** (existing) → B5

**B3 · Enter name + join code** (already signed in)
- **Join team** → B4
- **Back to your projects** → B2

**B4 · Invitation accepted** → **Open project** → B5

**B5 · Team dashboard (member)**
- Click a task → B7
- Sidebar **My Tasks** → B6
- Sidebar **Team Progress** → B9

**B6 · My tasks** → click a task → B7

**B7 · Task detail**
- Status: Not started / In progress / Complete
- File or link + note → **Attach & mark complete** → B8
- **← Back** → where you came from (B6 / B9 / dashboard)

**B8 · Completed with evidence** (author + timestamp shown)
- **← Back** → B6
- Sidebar **Team Progress** → B9

**B9 · Team progress** → click any task → B7 (read-only if not yours)

---

## Flow C · Deadline reminder

**C1 · Notification received** — top bar **Notifications** → click reminder → C2
**C2 · Task detail** (same screen as B7)

---

## Other screens

- Sidebar **Skill Profile** → D1
- Sidebar **Discussion Board** → D2 (**Reply** opens threaded reply box)
- Sidebar **Shared Files** → D3 (grouped by milestone)
- Top bar **All projects** → open a project where you're lead → D4 (same person, different role)
- Member opens **My Tasks** before allocation is accepted → D5 (no tasks yet)
- Member opens a lead-only page → D6 (refused) → **Go to My tasks** → B6
- Top bar **Sign out** → A1

---

## Persistent navigation

**Top bar (every signed-in screen):** All projects · Notifications · ☾ Dark mode · Sign out

**Left sidebar (inside a project):**
- Everyone: ← My projects, Dashboard, My Tasks, Skill Profile, Team Progress, Discussion Board, Shared Files
- Team lead only ("Project setup · team lead"), with status badges: Invite Team Members, Upload Course Documents, Learning Objectives, Milestones, Proposed Allocation

No sidebar on: Your projects, Create a project, Join with code.

---

## Main paths

- **Lead:** A1 → A2 → A3 → A4 → A5 → A6 → A7 → A8 → A9 → A11
- **Member (invited):** A1/B1 → B2 → B3 → B4 → B5 → B6 → B7 → B8
- **New member (no account):** A1 → D7 → A2 → open project → B5
