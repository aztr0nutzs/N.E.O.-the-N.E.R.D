## UI PRESERVATION AMENDS - MUST OBEY FIRST
- Do not redesign the interface.
- Do not move major panels or alter overall HUD composition.
- Do not change the center layout, frame structure, panel placement, hotspot placement, or visual hierarchy.
- Keep Robot2D as the active center robot.
- Do not re-enable Robot3D or revive any 3D path in this branch.
- Preserve colors, glow language, scanline treatment, panel density, and premium mechanical framing.
- Make only the minimum code changes required for the task.
- Do not replace carefully styled components with generic cards, plain forms, or default layouts.


Perform a final verification pass on the migrated Supabase version.

## Required checks
- `npm ci`
- `npm run lint`
- `npm run build`
- Google sign-in works
- signed-out AI request fails cleanly
- signed-in AI request succeeds
- tasks CRUD works
- messages/history works
- clear history works
- no Firebase runtime references remain

## Output format
- pass/fail table
- exact blockers if any remain
- no speculative claims
