---
name: work-issue
description: The standard workflow for implementing a GitHub Issue in this repo. Use whenever asked to work, build or implement an Issue.
---
# Work an Issue

1. **Read** the Issue with `gh issue view <n>`. Confirm it's Reviewed and Ready, and that its dependencies are done. If not, stop and tell the human.
2. **Check for blockers.** If it needs OQ-01 to OQ-05 or has `needs-decision`, comment on the Issue and stop.
3. **Plan.** Write a short plan (files to change, how each acceptance criterion will be met). Keep it simple.
4. **Branch:** `git checkout dev && git pull && git checkout -b feature/<n>-<short-name>`.
5. **Build** in order: UI → validation → database. Commit in small steps: `type(scope): summary (#n)`.
6. **Test:** delegate to `test-writer`. Fix feature code until all tests pass.
7. **Review:** delegate to `policy-reviewer`. If the change has UI, also delegate to `accessibility-checker`. Fix anything flagged.
8. **PR:** push the branch and open a PR into `dev` with `Closes #<n>`. The body lists each acceptance criterion with how it was met, test results, and the reviewer verdicts.
9. **Report** to the human: what was done, anything skipped, and every point where you needed a human decision.