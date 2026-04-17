## UI PRESERVATION AMENDS - MUST OBEY FIRST
- Do not redesign the interface.
- Do not move major panels or alter overall HUD composition.
- Do not change the center layout, frame structure, panel placement, hotspot placement, or visual hierarchy.
- Keep Robot2D as the active center robot.
- Do not re-enable Robot3D or revive any 3D path in this branch.
- Preserve colors, glow language, scanline treatment, panel density, and premium mechanical framing.
- Make only the minimum code changes required for the task.
- Do not replace carefully styled components with generic cards, plain forms, or default layouts.


Replace Firestore message history storage in `src/components/ChatInterface.tsx` with Supabase table operations.

## Requirements
- Table name: `messages`
- Row ownership column: `user_id`
- Preserve current chat UI, modes, styling, and interaction flow
- Preserve signed-out messaging behavior
- Preserve save/load/clear-history behavior
- Preserve image/video/audio metadata fields
- Keep protected AI route behavior intact
- Keep changes tightly scoped to auth/data logic

## Deliverables
- Complete updated `ChatInterface.tsx`
- Any helper modules if required
- Verification notes
