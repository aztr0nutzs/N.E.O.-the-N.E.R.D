# UI PRESERVATION AMENDS - MUST OBEY
- Preserve the current screen composition exactly.
- Do not move or redesign the center frame, side panels, or bottom dock.
- Do not re-enable `Robot3D` in this branch.
- `Robot2D` must remain the authoritative live center robot.
- Do not replace the cyber/industrial visual language with generic UI.
- Make only the smallest correct changes needed for the task.
- Report exact files changed, exact verification commands run, and exact results.

# Task
Perform a **Robot3D quarantine/removal decision pass** for the stable 2D branch.

## Mission
Make the branch safer and less confusing by handling parked 3D code appropriately.

## Evaluate these options
1. keep `Robot3D.tsx` in place with stronger ON HOLD messaging
2. move it to a parked/experimental folder
3. remove it from this branch entirely if verified unused

## Rules
- do not re-enable Robot3D
- do not disturb Robot2D path
- do not change center layout framing

## Required output
- best option and why
- exact files changed
- proof that no active runtime path was broken
