## Audit 01 — Shell / Control Truthfulness
Date: 2026-04-19
Agent: GPT-5.3-Codex
Branch: work

### Fake or misleading controls
- Bottom dock exposes seven slot buttons, but only `LINK` and `VOICE` are wired; `SECURE`, `POWER`, `CORE`, `CELL`, and `SYNC` are visually clickable but have no handlers.
- Bottom dock slot metadata includes `label`, but labels are not rendered, which obscures which controls are actionable.
- Right side panel `Prioritize` button has no `onClick` handler.
- Right side panel `Overclock` toggles only local visual state and stat bar color, not any system/runtime behavior.
- Network overlay presents simulated telemetry/control surfaces (randomized metrics, local-only reboot timer, hardcoded router/device data), which can be interpreted as real control state.
- System windows such as Environmental/Terminal/Radar are simulation content and not bound to live subsystems.

### Chat overlap root cause
- Layout is absolute-positioned with fixed percentages: robot container uses `top-[10%]` and `h-[50%]`, while chat uses `bottom-24` and `h-[40%]`, causing vertical collision on phone-height viewports.
- Z-order ensures the overlap is visible: robot frame is `z-20`, chat container is `z-30`.
- Side rails are also `z-30`; because chat is later in DOM order at the same z-index, lower side controls can be visually/interaction-competed in overlap regions.

### Settings gaps
- Settings entry exists and is reachable from the right side panel.
- Existing settings are local-only (`localStorage`) and include model params, custom instructions, default voice, and persona voice overrides.
- Voice test for Gemini voices falls back to generic browser TTS preview rather than model-backed voice preview.
- No explicit “simulated vs live” status is surfaced for nearby shell controls, which makes settings/control intent less truthful to operators.

### Files that must change
- `src/App.tsx` (resolve robot/chat/dock geometry and stacking contract).
- `src/components/BottomDock.tsx` (truthful interactivity for dock slots; non-action controls should not masquerade as actions).
- `src/components/SidePanelRight.tsx` (wire/remove `Prioritize`; clarify `Overclock` behavior scope).
- `src/components/NetworkScreen.tsx` (label simulator state clearly or wire to real data/actions).

### Files that must not change
- `src/components/Robot2D.tsx` (keep the live center robot concept and visual treatment intact).
- `src/components/NerdLogo.tsx`, `src/components/SystemStats.tsx`, `src/components/NeuralVisualizer.tsx` (not root-cause files for control truthfulness or overlap).
- `server.ts`, `src/authClient.ts`, `src/lib/supabase.ts` (outside this UI audit ledger purpose).

## Task — UI Dock / Control Truthfulness
Date: 2026-04-19
Owner Agent: GPT-5.3-Codex
Branch: cursor/wire-dock-controls-ac63

### Files changed
- src/App.tsx
- src/components/SystemStats.tsx
- src/components/SidePanelRight.tsx
- src/components/NetworkScreen.tsx
- src/components/BottomDock.tsx

### Verified outcomes
- Dock controls are now classified and made more truthful
- Fake terminal interval removed
- Fake overclock toggle removed
- Network screen simulator controls replaced with smaller honest implementation
- Lint passed
- Build passed

### Notes
- Scope expanded beyond BottomDock.tsx into adjacent control-truthfulness surfaces
- Acceptable because changes remained tied to shell honesty and misleading controls

## Task — Real settings access & HUD preferences
Date: 2026-04-19
Owner Agent: Codex / Composer
Branch: cursor/real-settings-hud-c601

### Files changed
- src/context/NeuralContext.tsx
- src/components/SettingsPanel.tsx
- src/App.tsx
- src/index.css

### Summary
- Extended settings panel with truthful persistence banner, HUD motion intensity, optional CRT shell overlay, OS reduced-motion respect, and real Gemini voice preview via protected TTS when signed in.
- Honest “not available” section for notifications, thermal governor, and network tool defaults.

### Verified outcomes
- Settings still opened from right panel; panel title “Operator Settings”.
- `neoHudSettings` + existing `aiSettings` persist to localStorage.
- npm ci / lint / build passed
