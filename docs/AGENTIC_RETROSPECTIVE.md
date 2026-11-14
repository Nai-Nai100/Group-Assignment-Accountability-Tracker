# Agentic Retrospective: Issue #9 (TMP-01 scaffold)

**Run:** Claude Code working Issue #9 with the `work-issue` skill. **Outcome:** PR #46 merged into `dev` after a pause for two human decisions.

## What worked
- **The workflow held.** Plan → small commits (`type(scope): summary (#9)`) → `test-writer` → `policy-reviewer` + `accessibility-checker` → PR into `dev`. Nothing went to `staging` or `main`.
- **The stop rule worked.** When the agent hit an open question it commented on the Issue and paused instead of guessing a provider in code.
- **The blocker comment was useful.** It named the exact criteria (AC2, AC3, and the "fails fast" check), the open questions (OQ-01, OQ-05) and two concrete options. That made the human decision quick.
- **Decisions went into docs before code.** The answers were recorded in `ARCHITECTURE.md` Sections 7 and 8 (commit `a4b26e2`) before any config used them.
- **The review agents caught real issues.** The accessibility check found that status symbols were being read aloud (`3d74183`). Policy review notes were applied in `36642cf`.

## The problem
Issue #9 had Human Review = Reviewed, Status = Ready, no `needs-decision` label and "Dependencies: None". By every check in the skill it was ready to start. But two acceptance criteria quietly depended on open questions:

- AC2: "the API reads … **file-storage keys** and **any AI service key** from environment variables". Whether storage keys exist depends on **OQ-05** (object storage vs. MongoDB). Whether an AI key exists depends on **OQ-01** (language-model API vs. rules-based extraction).
- AC3 and the "fails fast if a required variable is missing" check meant each of those variables had to be marked required or not. That can't be done without the decisions.

The agent only noticed this partway through, while mapping AC2/AC3 to actual variable names. It then had to stop and wait.

## Root cause
- **The skill's blocker check was too shallow.** Step 2 only asked "does this Issue need OQ-01 to OQ-05, or have `needs-decision`?" In practice that meant checking labels and the Dependencies section. Neither one mentioned the OQs.
- **The dependency was in the wording of the criteria, not in the metadata.** Phrases like "file-storage keys" and "AI service key" assume an answer to an open question. Nobody had checked each criterion against the `ARCHITECTURE.md` Section 7 list. That is how the Issue reached Ready.
- **The plan step didn't compare criteria with open questions.** It mapped each criterion to files, which is where the gap appeared, but nothing told the agent to compare those criteria with Section 7 before starting.

## Human decisions (recorded in `ARCHITECTURE.md` Section 8)
| OQ | Decision | Effect on #9 |
|---|---|---|
| OQ-01 | Objective extraction uses a language-model API: the **Gemini API**, called server-side only. | `GEMINI_API_KEY` is a required server env variable. The client never sees it. |
| OQ-05 | Uploaded files are stored **in MongoDB using GridFS**. No separate object storage. | No file-storage keys. `MONGODB_URI` covers file storage too. |

## Change made from this retrospective
The `work-issue` skill's plan step now checks **every acceptance criterion** (and each Testing/Verification item) against the **open** items in `ARCHITECTURE.md` Section 7. This happens before branching. Any match is treated like a `needs-decision` label: comment on the Issue and stop.

**Why this helps the next run:** the check now covers what the Issue *asks for*, not only how it is labelled. A hidden dependency shows up before any branch or code exists. The human gets one complete comment instead of finding out partway through. Section 7 is the live list (decided items are struck through), so the check stays current as OQ-04 and future questions are answered.
