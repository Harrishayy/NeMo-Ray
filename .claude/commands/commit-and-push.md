---
description: Stage, write a Conventional-Commit message, and push to the user's remote
argument-hint: "[optional scope or note, e.g. 'ui' or 'fix the build']"
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git add:*), Bash(git commit:*), Bash(git push:*), Bash(git log:*), Bash(git branch:*), Bash(git rev-parse:*), Bash(git symbolic-ref:*)
---

## Context

- Current branch: !`git branch --show-current`
- Status: !`git status --short`
- Staged diff: !`git diff --cached --stat`
- Unstaged diff: !`git diff --stat`
- Recent commits (for style/scope reference): !`git log --oneline -10 2>/dev/null || echo '(no commits yet — this will be the initial commit)'`

## Your task

Create a single production-quality commit from the current changes and push it
to the user's remote. Additional user note (optional): **$ARGUMENTS**

Follow these rules exactly:

1. **Stage** all relevant changes with `git add -A` (unless the user's note
   indicates a narrower set — then stage only those paths).

2. **Write a Conventional-Commit message**:
   - Format: `type(scope): summary`
   - `type` is one of: `feat`, `fix`, `refactor`, `chore`, `docs`, `style`,
     `test`, `perf`, `build`, `ci`.
   - `scope` is a short area of the codebase (e.g. `ui`, `nemoray`, `deps`,
     `config`). Infer it from the changed files; match the style of recent
     commits above.
   - `summary` is imperative, lowercase, no trailing period, ≤ 72 chars.
   - If the change is broad, add a short body (bullet points) after a blank
     line explaining the what/why.

3. **Commit etiquette — strict**:
   - Do **NOT** add any `Co-Authored-By` trailer.
   - Do **NOT** add "Generated with Claude Code", emojis, or any AI attribution.
   - Do **NOT** pass `--author`; the commit must use the user's own configured
     git identity so it comes directly from their account.
   - The message must read as if a single human author wrote it.

4. **Push** to the current branch's upstream with `git push`. If the branch has
   no upstream yet, use `git push -u origin <current-branch>`.

5. Report the final commit hash, the message, and the push result.

If there are no changes to commit, say so and stop.
