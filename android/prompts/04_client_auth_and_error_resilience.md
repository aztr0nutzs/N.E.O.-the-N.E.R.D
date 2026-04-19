# UI PRESERVATION AMENDS - MUST OBEY
- Preserve the current screen composition exactly.
- Do not move or redesign the center frame, side panels, or bottom dock.
- Do not re-enable `Robot3D` in this branch.
- `Robot2D` must remain the authoritative live center robot.
- Do not replace the cyber/industrial visual language with generic UI.
- Make only the smallest correct changes needed for the task.
- Report exact files changed, exact verification commands run, and exact results.

# Task
Perform a **client auth and error resilience pass**.

## Focus files
- `src/components/ChatInterface.tsx`
- `src/authClient.ts`
- any directly related helpers/context files

## Mission
Ensure protected AI actions fail cleanly, surface clean user-facing errors, and do not hang the UI.

## Required checks
- behavior when signed out
- behavior on expired token
- behavior on server 401/429/500
- behavior on media/generation failures
- sign-in/sign-out transition stability

## Must not do
- do not weaken auth
- do not bypass server protection
- do not redesign the chat UI layout
