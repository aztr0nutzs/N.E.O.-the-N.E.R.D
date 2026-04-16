## UI PRESERVATION AMENDS - MUST OBEY FIRST
- Do not redesign the interface.
- Do not move major panels or alter overall HUD composition.
- Do not change the center layout, frame structure, panel placement, hotspot placement, or visual hierarchy.
- Keep Robot2D as the active center robot.
- Do not re-enable Robot3D or revive any 3D path in this branch.
- Preserve colors, glow language, scanline treatment, panel density, and premium mechanical framing.
- Make only the minimum code changes required for the task.
- Do not replace carefully styled components with generic cards, plain forms, or default layouts.


Modify the project to add Supabase client foundations without removing Firebase yet.

## Tasks
1. Add `@supabase/supabase-js` to dependencies.
2. Create `src/lib/supabase.ts` using browser-safe env vars.
3. Create or update `.env.example` to document:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
   - `APP_URL`
4. Do not change UI components.
5. Ensure `npm run lint` still passes.

## Deliverables
- Complete file contents
- Exact paths
- Verification notes
