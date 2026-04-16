## UI PRESERVATION AMENDS - MUST OBEY FIRST
- Do not redesign the interface.
- Do not move major panels or alter overall HUD composition.
- Do not change the center layout, frame structure, panel placement, hotspot placement, or visual hierarchy.
- Keep Robot2D as the active center robot.
- Do not re-enable Robot3D or revive any 3D path in this branch.
- Preserve colors, glow language, scanline treatment, panel density, and premium mechanical framing.
- Make only the minimum code changes required for the task.
- Do not replace carefully styled components with generic cards, plain forms, or default layouts.


Replace Firebase Admin auth verification in `server.ts` with Supabase token verification while preserving existing Gemini route behavior and route validation structure.

## Requirements
1. Remove `firebase-admin` usage.
2. Add server-side Supabase verification using service role configuration.
3. Keep `/api/ai/*` rate limiting.
4. Keep fail-closed auth behavior.
5. Keep existing Gemini route validation and response behavior unless a strict improvement is necessary.
6. Do not touch unrelated UI code.

## Deliverables
- Complete updated `server.ts`
- Any new server helper module if needed
- Exact env vars required
- Verification notes
