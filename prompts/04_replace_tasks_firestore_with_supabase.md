## UI PRESERVATION AMENDS - MUST OBEY FIRST
- Do not redesign the interface.
- Do not move major panels or alter overall HUD composition.
- Do not change the center layout, frame structure, panel placement, hotspot placement, or visual hierarchy.
- Keep Robot2D as the active center robot.
- Do not re-enable Robot3D or revive any 3D path in this branch.
- Preserve colors, glow language, scanline treatment, panel density, and premium mechanical framing.
- Make only the minimum code changes required for the task.
- Do not replace carefully styled components with generic cards, plain forms, or default layouts.


Replace Firestore task storage in `src/components/TaskLog.tsx` with Supabase table operations.

## Requirements
- Table name: `tasks`
- Row ownership column: `user_id`
- Preserve current task UX and styling
- Preserve auth-required empty state message
- Preserve create/toggle/delete behavior
- Use descending `created_at` ordering
- Preserve high-priority sorting behavior
- Avoid broad refactors outside the minimum data-access changes

## Deliverables
- Complete updated `TaskLog.tsx`
- Any small helper module if truly needed
- Verification notes
