# Prompt 08: Final Release Readiness Pass

## UI PRESERVATION AMEND — MUST BE FOLLOWED FIRST
- Preserve the current premium futuristic J.A.R.V.I.S. interface exactly.
- Do not flatten, restyle, or simplify the app during this pass.
- This is a verification and finish-quality task, not a redesign task.

## Task
Run a final release-readiness pass after all correction work is done.

### Required actions
1. inspect the modified project end-to-end
2. run:
   - `npm ci`
   - `npm run lint`
   - `npm run build`
3. compare before/after visual behavior for key screens
4. confirm protected AI routes still work logically
5. confirm `Robot3D` still loads and fallback text is accurate
6. confirm no stale imports or dead code remain from prior tasks
7. produce a final scorecard with verified strengths, verified remaining issues, and a concise production-readiness verdict

### Output requirements
- no vague claims
- separate verified facts from inferred risks
- include build chunk sizes and note the heaviest bundle areas
