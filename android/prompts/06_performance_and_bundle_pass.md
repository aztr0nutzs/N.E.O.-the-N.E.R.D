# UI PRESERVATION AMENDS - MUST OBEY
- Preserve the current screen composition exactly.
- Do not move or redesign the center frame, side panels, or bottom dock.
- Do not re-enable `Robot3D` in this branch.
- `Robot2D` must remain the authoritative live center robot.
- Do not replace the cyber/industrial visual language with generic UI.
- Make only the smallest correct changes needed for the task.
- Report exact files changed, exact verification commands run, and exact results.

# Task
Perform a **performance and bundle pass**.

## Mission
Reduce payload weight and runtime overhead without affecting protected layout or branch identity.

## Focus areas
- main chunk contributors
- lazy loading opportunities
- expensive imports in app shell
- motion/update loops in neural/media hooks
- unnecessary rerenders in robot and visualizer components

## Required output
- current bottlenecks
- exact optimizations applied
- bundle/build receipts before and after
- any tradeoffs made
