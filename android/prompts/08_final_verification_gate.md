# UI PRESERVATION AMENDS - MUST OBEY
- Preserve the current screen composition exactly.
- Do not move or redesign the center frame, side panels, or bottom dock.
- Do not re-enable `Robot3D` in this branch.
- `Robot2D` must remain the authoritative live center robot.
- Do not replace the cyber/industrial visual language with generic UI.
- Make only the smallest correct changes needed for the task.
- Report exact files changed, exact verification commands run, and exact results.

# Task
Perform the **final verification gate** for the current `neo_final` branch after all intended changes are complete.

## Required commands
```bash
npm ci
npm run lint
npm run build
```

## Required manual/runtime checks
- sign in
- sign out
- systems boot
- Robot2D render
- no Robot3D runtime path
- chat request
- image request
- video request or clean failure state
- clean error handling on auth/server problems

## Required final report
- exact files changed across the full effort
- exact verification receipts
- remaining known issues, if any
- explicit statement that protected UI was preserved
- explicit statement that Robot2D remains authoritative
