## UI PRESERVATION AMENDS - MUST OBEY FIRST
- Do not redesign the interface.
- Do not move major panels or alter overall HUD composition.
- Do not change the center layout, frame structure, panel placement, hotspot placement, or visual hierarchy.
- Keep Robot2D as the active center robot.
- Do not re-enable Robot3D or revive any 3D path in this branch.
- Preserve colors, glow language, scanline treatment, panel density, and premium mechanical framing.
- Make only the minimum code changes required for the task.
- Do not replace carefully styled components with generic cards, plain forms, or default layouts.


After Supabase cutover is complete and verified, remove Firebase and stale migration debris safely.

## Tasks
1. Remove runtime Firebase imports and dependencies.
2. Remove `firebase-applet-config.json`, `firebase-blueprint.json`, and `firestore.rules` if no longer referenced.
3. Remove `src/firestore.ts` if fully replaced.
4. Remove stale comments and dead code paths.
5. Update README/setup docs to describe Supabase only.
6. Ensure `npm run lint` and `npm run build` both pass.

## Deliverables
- File deletion list
- Updated package.json/package-lock notes
- Verification notes
