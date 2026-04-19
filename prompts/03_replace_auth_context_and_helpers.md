## UI PRESERVATION AMENDS - MUST OBEY FIRST
- Do not redesign the interface.
- Do not move major panels or alter overall HUD composition.
- Do not change the center layout, frame structure, panel placement, hotspot placement, or visual hierarchy.
- Keep Robot2D as the active center robot.
- Do not re-enable Robot3D or revive any 3D path in this branch.
- Preserve colors, glow language, scanline treatment, panel density, and premium mechanical framing.
- Make only the minimum code changes required for the task.
- Do not replace carefully styled components with generic cards, plain forms, or default layouts.


Replace Firebase auth on the client with Supabase auth while preserving the existing app behavior and user-facing sign-in flow.

## Tasks
1. Ensure the Supabase-based auth/helper module is canonical as `src/authClient.ts` (legacy docs may refer to `src/firebase.ts`).
2. Preserve these exported behaviors or close equivalents:
   - sign in with Google
   - sign out
   - fetch protected JSON for server routes
   - client-safe auth/network error messages
3. Update `src/context/NeuralContext.tsx` to use Supabase auth subscription and user state.
4. Update any user typing/imports as needed.
5. Do not change App layout or visible UI structure.
6. Ensure `npm run lint` passes.

## Deliverables
- Complete replacement file contents
- Exact imports to change
- Verification steps
