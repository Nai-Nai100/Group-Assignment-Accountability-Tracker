<!-- Text copy of the SDD PDF (v0.2) for agents to read. The PDF is the source of truth. -->

```text
Group Project Accountability Tracker
                           Software Design Document (SDD)
                              CSCI 5520 - AI-Driven Software Development
Student Name                                           Naitri
Date                                                   October 2026
Document Version                                       v0.2
Project Repository / URL                               N/A
1 Problem & Users
1.1 Problem Description
In student team projects, members typically divide work by convenience or by whoever volunteers first, rather
than by what each person needs to learn. This creates two problems.
First, the workload is often uneven, and because most of the real work happens privately, it is hard to see who
actually contributed until the very end, when it is too late to correct. Teammates discover an imbalance at
submission time, when the only remaining options are to absorb the missing work or to report a peer.
Second, and more consequential in an academic setting, splitting work by existing strength means students
repeatedly do only what they are already good at. The person comfortable with code writes all the code; the
person comfortable with writing does all the writing. Each member finishes the project having practiced only a
narrow slice of the skills the assignment was designed to teach. Instructors design assignments around specific
learning objectives, but an uncoordinated split quietly defeats those objectives even when the final deliverable
looks complete.

1.2 Target Users & Stakeholders
User / Stakeholder                                        Relationship to the Problem
Primary User - Student Team Member                        Works on the project, maintains a skill profile, receives
                                                          task assignments, uploads progress evidence, and
                                                          collaborates through the discussion board and shared
                                                          files. Most directly harmed by an unfair split, and the
                                                          one whose learning is narrowed when work is divided
                                                          by existing strength alone.
Primary User - Team Lead                                  A team member who also creates the project, invites
                                                          the team, uploads the assignment and syllabus,
                                                          triggers allocation, adjusts the proposed assignments,
                                                          and sets milestone dates. Role is held per project: the
                                                          same person may be team lead on one project and a
                                                          team member on another. Carries responsibility for
                                                          producing a split that is both fair and objective-aware.
Stakeholder - Course Instructor                           Does not use the system and has no interface in this
                                                          project. Defines the learning objectives the
                                                          assignment is built to develop, which is why objective
                                                          coverage matters at all, and is the eventual judge of
                                                          whether the work reflects the intended learning.

2 Proposed Solution & Scope
2.1 Proposed Solution
The proposed system is a web application that helps student teams divide project work in a way that serves both
fairness and learning. A team lead uploads the assignment prompt and the course syllabus, and the system
extracts the learning objectives the assignment is meant to develop. Each team member maintains a profile
describing what they are already strong at and what they want to practice.
The system then proposes a division of tasks that deliberately balances two goals: using each member's existing
strengths where it helps the project, while ensuring every member is assigned work that exercises objectives they
have not yet practiced. The team lead reviews and adjusts this proposal before accepting it, so the system advises
rather than decides.
Throughout the project, members track progress against dated milestones, upload evidence of completed work,
and coordinate through a shared discussion board and file space, so that contribution is visible as it happens
rather than discovered at the end.
The expected value is twofold: teams distribute work more fairly and transparently, and students finish having
practiced the full range of skills the assignment was designed to teach rather than only the ones they already had.

2.2 Minimum Viable Product (MVP) Scope
•   Authenticated access with two roles, team member and team lead, assigned per project.
•   One account across several projects, with a project list and per-project role.
•   Invitation-only joining: the team lead issues a project join code, and an invited person joins by entering their
    name and that code. There is no public sign-up.
•   Member skill profiles capturing current strengths and the skills the member wants to practice.
•   Upload of the assignment prompt and course syllabus, with automatic extraction of learning objectives and
    human review of the extracted list.
•   Objective-aware task allocation balancing strengths against learning needs, presented as a proposal the team
    lead can adjust before accepting.
•   Multiple dated milestones per project, with every task tied to a milestone.
•   Self-reported progress: members mark tasks in progress or complete and attach evidence, visible to the whole
    team.
•   Deadline notifications sent three days before a milestone to members with open tasks on it.
•   A post-based project discussion board.
•   A shared file space organized by milestone.

2.3 Out of Scope / Non-Goals
•   Automatic contribution tracking through GitHub, Google Docs, or other external integrations. The MVP relies
    on self-reported progress; automated tracking is a planned future extension recorded in Section 7.
•   Native mobile applications. The MVP is a responsive web application only.
•   Real-time chat or messaging. The discussion board is post-based, not a live chat.
•   Integration with learning management systems such as Canvas or Blackboard.
•   Automated grading, scoring, or evaluation of the quality of an individual member's work. The system reports
    what was done, not how well.
•   An instructor-facing interface. The instructor is a stakeholder whose learning objectives the system serves, but
    there is no instructor login or dashboard in this project.

3 User Stories & Acceptance Criteria
The following stories define the major behavior required for the MVP. Stable identifiers are used so these stories
can be traced into the UI/UX design, the implementation plan, GitHub Issues, tests, and later agentic development
work.

3.1 Team Member User Stories
US-01 - Secure Sign-In
User Story: As a team member, I can sign in to an account provisioned for my team so that I can securely access
my project.
Pass/Fail Check: Pass if a valid member account reaches its team dashboard and an invalid or unauthorized
account is denied access.
US-02 - Maintain Skill Profile
User Story: As a team member, including when I am the team lead, I can record my current strengths and the skills
I want to practice so that task allocation reflects both.
Pass/Fail Check: Pass if a saved profile persists across sessions, both lists are available as inputs to the allocation
step, and the team lead's own profile is included in that allocation.
US-03 - View My Assigned Tasks
User Story: As a team member, I can see the tasks assigned to me and why each was assigned so that the
allocation feels fair rather than arbitrary.
Pass/Fail Check: Pass if every assigned task displays its milestone, due date, and a short allocation reason.
US-04 - Report Progress
User Story: As a team member, I can mark a task in progress or complete and attach evidence so that my
contribution is visible as it happens.
Pass/Fail Check: Pass if a status change and an attached file or link are saved with author and timestamp and are
visible to every member of the team.
US-05 - Receive Deadline Notification
User Story: As a team member, I can receive a notification three days before a milestone on which I have open
tasks so that I am not surprised the night before.
Pass/Fail Check: Pass if a member with at least one incomplete task on a milestone dated three days ahead
receives a notification naming the task and the milestone date, and a member with no incomplete tasks on that
milestone does not.
US-06 - Post to the Project Board
User Story: As a team member, I can post questions, ideas, and decisions to a project discussion board so that
coordination stays with the project instead of scattering across private messages.
Pass/Fail Check: Pass if a post is saved with author and timestamp, is visible to all team members, and supports at
least one level of threaded reply.
US-07 - Use the Shared File Space
User Story: As a team member, I can upload project files and find them grouped by milestone so that I am not
searching old threads for the latest version.
Pass/Fail Check: Pass if an uploaded file appears under its chosen milestone, is downloadable by every team
member, and shows its uploader and upload time.

3.2 Team Lead User Stories
US-08 - Create Team and Invite Members
User Story: As a team lead, I can create a team and invite my project members so that the group has one shared
workspace.
Pass/Fail Check: Pass if an invited person who accepts gains member access to that team only, and a person who
was not invited cannot reach it.
US-09 - Upload Assignment and Syllabus
User Story: As a team lead, I can upload the assignment prompt and the course syllabus so that the system knows
what the project requires and what it is meant to teach.
Pass/Fail Check: Pass if both documents are stored against the project and the system returns a list of extracted
learning objectives for review. The lead may also enter optional professor notes (anything the instructor said
that is not in the documents), which are used together with the documents for extraction.
US-10 - Review Extracted Learning Objectives
User Story: As a team lead, I can review, correct, add, and remove the extracted learning objectives so that
allocation is based on what the course actually requires.
Pass/Fail Check: Pass if the lead's edits to the objective list are saved and the saved list, not the raw extraction, is
what allocation uses.
US-11 - Review and Adjust Proposed Allocation
User Story: As a team lead, I can review the proposed task allocation and reassign tasks before accepting it so that
I keep final control over the split.
Pass/Fail Check: Pass if the proposal is displayed with each task's assignee and reason, reassignment is possible
before acceptance, and no task is treated as assigned until the lead accepts.
US-12 - Define Project Milestones
User Story: As a team lead, I can create several dated milestones so that the project has checkpoints instead of
one final deadline.
Pass/Fail Check: Pass if two or more milestones with distinct due dates can be created and every task is associated
with exactly one of them.
US-13 - Monitor Whole-Team Progress
User Story: As a team lead, I can see every member's task status and submitted evidence in one view so that I can
tell whether the project is on track.
Pass/Fail Check: Pass if the view lists every member with their open and completed tasks per milestone and links
to the evidence each member submitted.

3.3 Account and Project Access Stories
US-14 - Work Across Several Projects
User Story: As a signed-in user, I can see every project I belong to and open any of them so that one account
covers all my team projects.
Pass/Fail Check: Pass if the project list shows each project with the role held there, and opening one shows that
project's data only.
US-15 - Join a Project With an Invitation Code
User Story: As an invited person, I can join a project by entering my name and the join code my team lead shared
so that I gain access without a public sign-up existing.
Pass/Fail Check: Pass if a correct code adds the person to that project as a team member and clears the pending
invitation, and an incorrect code is rejected with an error.
4 Requirements, Constraints & Design Rules
The following rules are not captured cleanly by the user stories above but must be respected consistently by any
later implementation, human or agentic.
RC-01 - Authentication: All functionality other than sign-in and joining by invitation code requires an
authenticated session. Passwords are stored only as salted hashes; plaintext passwords are never stored or
logged. There is no public sign-up: a project is joined only with a valid invitation code issued by its team lead.
RC-02 - Role-Based Authorization: Team-lead actions - uploading course documents, editing the objective list,
triggering and accepting allocation, creating milestones - must be enforced on the server, not only hidden in the
client interface. A member request for a lead action must be rejected by the API.
RC-03 - Project Data Isolation: A user may read and write only data belonging to projects they are a member of,
and their role is evaluated per project rather than globally. Every query that returns project data must be scoped
by project membership on the server. Cross-project access is a defect, not a configuration option.
RC-04 - Human Review of Extracted Objectives: Automatically extracted learning objectives are a draft and must
never be used for allocation until a team lead has reviewed and saved them. The system must make the extracted
list editable and must visibly distinguish an unreviewed extraction from an accepted one.
RC-05 - Allocation Transparency: Every assigned task must store and display a human-readable reason for its
assignment, naming the objective it covers and whether it was assigned as a strength or as a learning opportunity.
Allocation output that cannot be explained to the team is not acceptable.
RC-06 - Allocation Is Advisory: The system proposes; the team lead disposes. No allocation becomes active
without explicit acceptance by the lead, and the lead must be able to reassign any task before accepting.
RC-07 - Progress Evidence Integrity: Each progress update records its author and a server-generated timestamp. A
member may create and update their own progress records only; no user may edit or delete another member's
submitted evidence. This protects the record from the disputes the system exists to prevent.
RC-08 - Privacy of Uploaded Course Documents: Assignment prompts and syllabi are uploaded by students and
may be instructor-owned material. They are visible only to members of the uploading team and are never shared
across teams or used for any purpose other than objective extraction for that project. If a third-party AI service
performs the extraction, that transfer must be disclosed in the interface before upload. The lead's optional
professor notes receive the same protection and are named in the same disclosure.
RC-09 - Accessibility & User Experience: The interface targets WCAG 2.1 AA: sufficient color contrast, keyboard
operability for all primary flows, labeled form controls, and status conveyed by a symbol and text rather than color
alone. Both the light and dark themes must meet the contrast requirement independently. Allocation reasons and
task states must be readable by assistive technology.
RC-10 - Platform & Compatibility: The MVP is a responsive web application supporting current versions of
Chrome, Firefox, Safari, and Edge on desktop and tablet widths. No native mobile application and no legacy
browser support is required.
RC-11 - Notification Timing: Deadline notifications are generated from milestone dates by a scheduled server-side
job, not by client activity, so that a member who has not opened the application still receives them.
RC-12 - Secrets & Credentials: Database credentials, authentication secrets, file-storage keys, and any AI service
API key are held server-side in environment configuration. They are never embedded in client code or committed
to the repository.
5 Platform & Architecture
5.1 System Components & Technology Choices
The system is a conventional three-tier web application with two external dependencies: object storage for
uploaded files and an AI service for extracting learning objectives from course documents.
Client. A single-page web application providing the member and lead experiences from one codebase, with the
lead-only screens shown according to the role the signed-in user holds on the open project. The client ships a light
and a dark theme.
Application server. A REST API that holds all authorization logic, performs objective extraction and task allocation,
and runs the scheduled job that generates deadline notifications.
Database. Document storage for users, teams, projects, learning objectives, milestones, tasks, progress updates,
board posts, and file metadata.
File storage. Uploaded course documents and progress evidence are stored as objects outside the database; the
database holds only their metadata and references.
Objective extraction service. An external language-model API that reads the uploaded assignment and syllabus
text and returns a candidate list of learning objectives for the lead to review. The extraction approach is not yet
final - see OQ-01.
Technology                   Rationale                       Usage                       Residency
React                        Component model suits a         Client application:         User's browser, served as
                             dashboard with repeated         profiles, allocation        static assets from the
                             task, milestone, and            review, task board,         hosting provider.
                             member views; already           progress reporting,
                             familiar to the author,         discussion board, file
                             reducing project risk.          space.
Node.js with Express         Keeps one language              Application server:         Cloud application host.
                             across client and server;       authentication,
                             straightforward REST            authorization, allocation
                             routing and scheduled           logic, extraction
                             jobs.                           orchestration,
                                                             notification job.
MongoDB (Atlas)              Document model fits             Primary data store for      Managed cloud database
                             records whose shape             users, teams, projects,     service.
                             varies, such as a task's list   objectives, milestones,
                             of covered objectives and       tasks, progress updates,
                             a profile's skill lists,        posts, and file metadata.
                             without rigid schema
                             migration.
JSON Web Tokens with         Standard, well-                 Session authentication      Issued and verified by the
bcrypt password hashing      documented approach             and role claims enforced    application server.
                             adequate for a project          on every API request.
                             with no institutional
                             single sign-on available.
Cloud object storage         Keeps uploaded                  Storage of syllabi,         Third-party object-
                             documents and evidence         assignment prompts, and     storage service.
                             files out of the database      progress evidence.
                             and allows direct, access-
                             controlled download.
Language-model API           Course documents are           Extracting candidate        Third-party AI service,
                             unstructured prose; rule-      learning objectives from    called server-side only.
                             based parsing of arbitrary     uploaded documents,
                             syllabus formats is brittle.   subject to human review
                                                            per RC-04.

These choices may evolve. Unresolved technology decisions are recorded in Section 7.2 rather than presented
here as settled.

5.2 Architecture Diagram & Explanation
Figure 1 shows the system architecture. The browser client communicates with the application server over HTTPS
using a REST API; it never contacts the database, the object store, or the AI service directly. Three flows carry most
of the system's meaning.
Document intake and extraction. The lead uploads the assignment and syllabus. The server stores the files in
object storage, sends the extracted text and any professor notes to the language-model API, and writes the returned candidate objectives
to the database marked as unreviewed. The lead's review turns them into the accepted objective list (RC-04).
Allocation. The server reads the accepted objectives together with every member's skill profile and the project's
milestones, computes a proposed set of tasks with assignees and reasons, and returns it to the lead for
adjustment. Nothing is written as an active assignment until the lead accepts (RC-06).
Notification. A scheduled job on the application server runs daily, finds milestones dated three days ahead,
identifies members with incomplete tasks on them, and dispatches notifications. It is driven by milestone dates
rather than by user activity (RC-11).
                              Figure 1: Architecture of the Group Project Accountability Tracker.

6 UI/UX Design
6.1 Application / Experience Flow
Both roles enter through sign-in and arrive at a list of the projects they belong to. Opening a project reaches its
team dashboard, from which the experience diverges by the role held on that project. An invited person who has
not yet joined enters their name and the join code from this list before the project becomes available.
A team lead follows a setup path: create the project, invite members by sharing the project join code, upload the
assignment and syllabus, review and correct the extracted learning objectives, define milestones, then open the
proposed allocation, reassign where needed, and accept it. After setup, the lead's main view is whole-team
progress across milestones.
Completing a skill profile is shared rather than role-specific. Every member of a project does it, the team lead
included, because the lead is a team member who also carries setup responsibility (DD-05) and their strengths and
learning needs are inputs to the same allocation as everyone else's. A project whose lead has no profile would
allocate around them.
A team member then follows a working path: view assigned tasks with their milestone, due date, and allocation
reason, open a task to mark it in progress or complete and attach evidence, and receive a deadline notification
three days before a milestone with open tasks.
Both roles share the discussion board and the milestone-organized file space, reachable from the dashboard at
any point. A team member who reaches a team-lead-only screen is shown a short message naming the project's
team lead rather than the screen's contents. Figure 2 shows the full flow.

                      Figure 2: Major user/experience flow for the Group Project Accountability Tracker.
6.2 Interactive UI/UX Prototype
The interactive prototype represents the team member and team lead flows required by the MVP. It was
produced with an AI-assisted design workflow and then reviewed and corrected against this document; the
refinements are recorded in Section 6.3. It covers nineteen frames across three end-to-end interactions - team
lead setup through allocation, team member joining through completing a task with evidence, and the deadline
notification - plus the remaining screens, in a light and a dark theme.
Prototype Link: https://claude.ai/design/p/fdf25ae8-5a36-47c6-b7aa-
1b73100894f9?file=Accountability+Tracker+Frames+Dark.dc.html&via=share

6.3 Design Alignment & Human Refinement
The first generated design was treated as a draft and reviewed screen by screen against the user stories in Section
3 and the constraints in Section 4. The prototype supports every US-## story: the allocation reason required by US-
03 appears on the allocation table, the task detail screen and the team progress view; the unreviewed-draft state
required by US-10 is shown explicitly before acceptance; and US-11 keeps the proposal editable until the lead
accepts it. Three refinements were made deliberately after that review.
Design Refinement                     Why It Was Changed                       Related Story / Requirement
Added a disclosure on the upload      The generated design omitted it          RC-08, US-09
screen, directly above the extract    entirely. RC-08 requires the
button, stating that uploaded         transfer to be disclosed before
documents are sent to a third-party   upload, and without it the user
AI service to extract learning        hands over instructor-owned
objectives, are visible only to the   course material without knowing it
team, and are not used for            leaves the system. This was the
anything else.                        only constraint in Section 4 the
                                      draft failed outright.
Darkened the muted label colour       Measured at 4.44:1 against its           RC-09
used in the inline add-item forms     background, below the 4.5:1
on the learning objectives and        minimum for normal text. RC-09
milestones screens.                   commits the project to WCAG 2.1
                                      AA, so the generated palette did
                                      not meet the project's own stated
                                      standard.
Added an explicit refusal state: a    The draft showed role separation         RC-02, US-11
team member who opens a team-         only by hiding the lead's actions.
lead-only screen now sees a short     RC-02 requires authorisation to be
message naming the project's team     enforced rather than merely
lead, rather than the screen's        hidden, so the interface needed to
contents.                             show the boundary rather than
                                      conceal it.
7 Key Design Decisions & Open Questions
7.1 Key Design Decisions
DD-01 - Allocation Balances Learning Against Strength: Assigning purely by existing strength produces the best
short-term deliverable and teaches nobody; assigning purely by learning need maximizes practice but risks a
weaker result and frustrated teammates. The system therefore weights both inputs and exposes the reasoning per
task (RC-05). This tension is the core of the project, and removing either side would reduce the system to an
ordinary task board.
DD-02 - Objectives Extracted From the Syllabus, Not Typed by Hand: Asking a team to type learning objectives
would invite them to invent convenient ones. Deriving them from the instructor's own document is what makes
the allocation answerable to the course rather than to the team's preferences.
DD-03 - The System Advises; the Team Lead Decides: Allocation output is a proposal requiring explicit acceptance
(RC-06). Automatic assignment would place a consequential academic decision in software that cannot see
context such as illness, workload elsewhere, or a member's own goals.
DD-04 - Self-Reported Progress for the MVP: Automated signals from GitHub or document revision history would
be more objective, but they add integration risk, raise surveillance concerns, and are not required to demonstrate
the core value. Self-reporting with evidence and immutable authorship (RC-07) is sufficient for the MVP, and
automated tracking is recorded as a future extension rather than silently dropped.
DD-05 - Two Roles, Held Per Project, With the Lead Inside the Team: A separate administrator account type
would add a permissions model the project does not need. Keeping the lead as a team member means the person
allocating work is also doing some of it. Role is stored against the membership rather than the user, because a
student is typically the lead on one course project and an ordinary member on another in the same term.
DD-06 - Web-Only, Single Responsive Codebase: Members use the system at a desk while working on
deliverables, not on the move, and a single web client keeps the implementation inside the time available (RC-10).
DD-08 - Join Code Rather Than an Emailed Link: An invited person joins by entering a short project code alongside
their name. A one-click email link would be smoother, but it makes access depend on mail delivery and on a secret
sitting in an inbox. A code the lead can read out or paste into the team's existing chat keeps joining inside the
team's control and keeps the invitation-only rule in RC-01 enforceable.
DD-07 - No Instructor Interface: The instructor's objectives drive the system, but giving instructors a view would
turn a team's coordination tool into a monitoring tool and would change how honestly members report progress.
The instructor remains a stakeholder, not a user.

7.2 Open Questions, Assumptions & Risks
The following items are unresolved. A later implementation should not silently decide them.
ID / Topic                                                Open Question, Assumption, or Risk
OQ-01 - Objective Extraction Method                       The leading option is a language-model API call on the
                                                          uploaded text, because syllabus formats vary too
                                                          widely for reliable rule-based parsing. A rules-and-
                                                          keywords approach would avoid an external
                                                          dependency and the privacy disclosure in RC-08.
                                                          Resolution requires testing extraction against several
                                                          real syllabi, including this course's own, and
                                                          comparing the results against a hand-written objective
                                                          list.
OQ-02 - Allocation Weighting Rule                           How strongly the system should favor a learning
                                                            opportunity over an existing strength is not yet
                                                            defined as a concrete rule. This needs a stated formula
                                                            or scoring method, not a description of intent, before
                                                            implementation begins. It is the most important
                                                            unresolved item in this document.
OQ-03 - Contested Objectives                                When two members both need practice on the same
                                                            objective and only one task covers it, the tie-breaking
                                                            rule is undefined. Candidate approaches include
                                                            rotating across milestones, splitting the task, or
                                                            deferring to the lead.
OQ-04 - Notification Channel                                In-app notification alone is simpler; email reaches a
                                                            member who is not in the application, which is the
                                                            case the feature exists for. Email adds a mail-delivery
                                                            dependency and a deliverability risk.
OQ-05 - File Storage Approach                               Whether to use a third-party object-storage service or
                                                            store files in the database affects deployment, cost,
                                                            and access control. The object-storage option is
                                                            assumed in Section 5.1 but is not confirmed.
Assumption - Syllabi State Objectives Explicitly            This document assumes course syllabi contain an
                                                            identifiable objectives or outcomes section. A syllabus
                                                            that does not would weaken extraction quality and
                                                            leave the team to supply objectives manually.
Risk - Extraction Quality Drives Everything                 If objective extraction is poor and the lead does not
Downstream                                                  catch it, every subsequent allocation is wrong in a way
                                                            that is hard to notice. RC-04 mitigates this, but it
                                                            depends on the lead actually reviewing rather than
                                                            clicking through.

8 References & Supporting Links
•   User Stories - Atlassian: https://www.atlassian.com/agile/project-management/user-stories
•   C4 Model for Software Architecture: https://c4model.com/
•   Web Content Accessibility Guidelines (WCAG) 2.1: https://www.w3.org/TR/WCAG21/
•   React Documentation: https://react.dev/
•   MongoDB Documentation: https://www.mongodb.com/docs/
•   Figma Education: https://www.figma.com/education/
•   CSCI 5520 Software Design Document Template and Safe Alert completed SDD example (course materials).
Document Status: Complete for Challenges #1 and #2. Section 6.2 requires the public prototype link to be pasted
in before the document is exported to PDF. OQ-01 to OQ-05 remain open by design and are not decided by the
prototype.
```
