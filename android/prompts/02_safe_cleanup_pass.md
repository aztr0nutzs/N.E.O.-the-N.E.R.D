# UI PRESERVATION AMENDS - MUST OBEY
- Preserve the current screen composition exactly.
- Do not move or redesign the center frame, side panels, or bottom dock.
- Do not re-enable `Robot3D` in this branch.
- `Robot2D` must remain the authoritative live center robot.
- Do not replace the cyber/industrial visual language with generic UI.
- Make only the smallest correct changes needed for the task.
- Report exact files changed, exact verification commands run, and exact results.

# Task
Perform a **safe cleanup pass** on the `neo_final` branch.

## Mission
Remove stale/dead/confusing code and comments **without changing runtime behavior or layout**.

## Primary targets
- any unused imports
- stale `Robot3D` references outside its parked file
- stale fallback copy in `Robot3D.tsx`
- misleading comments implying 3D is active
- dead helpers or dead branches proven unused
- noisy logs that can be safely reduced while staying dev-only

## Required protections
- no UI redesign
- no server behavior loosening
- no auth behavior regression
- no reactivation of 3D path

## Deliverable
Provide:
- exact files changed
- exact removals/cleanups made
- why each cleanup was safe
- verification command results
