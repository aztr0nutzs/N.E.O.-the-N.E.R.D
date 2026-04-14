# UI PRESERVATION AMENDS - MUST OBEY
- Preserve the current screen composition exactly.
- Do not move or redesign the center frame, side panels, or bottom dock.
- Do not re-enable `Robot3D` in this branch.
- `Robot2D` must remain the authoritative live center robot.
- Do not replace the cyber/industrial visual language with generic UI.
- Make only the smallest correct changes needed for the task.
- Report exact files changed, exact verification commands run, and exact results.

# Task
Perform a **top-to-bottom UI polish pass** specifically for the 2D-authoritative `neo_final` branch.

## Core mission
Improve the finish, density, responsiveness, and premium feel of the current UI **without changing composition**.

## Focus targets
- `src/components/Robot2D.tsx`
- `src/App.tsx`
- `src/components/Panel.tsx`
- `src/components/BottomDock.tsx`
- `src/components/SidePanelLeft.tsx`
- `src/components/SidePanelRight.tsx`
- `src/components/ChatInterface.tsx`
- `src/index.css`

## Allowed polish
- better 2D robot idle animation
- better glow, pulse, and scanline timing
- stronger hotspot affordance
- improved text readability and spacing
- improved panel polish and subtle motion
- better chat/control tactile polish

## Forbidden
- no layout redesign
- no center frame rebuild
- no 3D return
- no generic card UI conversion
