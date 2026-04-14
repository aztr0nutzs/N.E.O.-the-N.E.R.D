# PROJECT_GUIDELINES.md

## Editing philosophy
- Fix the smallest real surface that resolves the issue.
- Trace the live call path before removing code.
- Prefer helper extraction over rewriting working UI.
- Keep components understandable and explicit.
- Never make server security weaker to make local testing easier.

## Code quality rules
- No broad `any` expansion to avoid typing work.
- Keep route validation explicit.
- Keep cleanup paths explicit.
- Prefer app-level constants and helper functions over magic inline objects.
- Remove stale imports created by every task before declaring the task complete.

## Pull-request / patch standard
Every patch should include:
1. what changed
2. why it changed
3. what was verified
4. what remains risky
