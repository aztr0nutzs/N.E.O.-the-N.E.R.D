## UI PRESERVATION AMENDS - MUST OBEY FIRST
- Do not redesign the interface.
- Do not move major panels or alter overall HUD composition.
- Do not change the center layout, frame structure, panel placement, hotspot placement, or visual hierarchy.
- Keep Robot2D as the active center robot.
- Do not re-enable Robot3D or revive any 3D path in this branch.
- Preserve colors, glow language, scanline treatment, panel density, and premium mechanical framing.
- Make only the minimum code changes required for the task.
- Do not replace carefully styled components with generic cards, plain forms, or default layouts.


You are performing a READ-ONLY audit of the uploaded N.E.O. project before a Firebase -> Supabase migration.

## Goals
1. Enumerate every Firebase dependency by file.
2. Identify every Firestore query/write path.
3. Identify every place the app reads auth state.
4. Identify every server endpoint that depends on Firebase Admin verification.
5. Identify any code that can be removed after cutover.
6. Identify any migration risks to live UI behavior.

## Output format
- Verified findings only
- File-by-file dependency map
- Exact cutover checklist
- Risks and blockers
- No code changes
