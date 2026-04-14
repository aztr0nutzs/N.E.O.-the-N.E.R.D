# BRANCH_GUARDRAILS.md

## Branch name
`neo_final`

## Authoritative product rules
- This is the stable **2D robot** branch.
- `Robot2D` is the only center robot path that may be active.
- `Robot3D` is on hold.
- The current screen composition is protected.

## Guardrails for all changes
### Never do these in this branch
- do not re-enable `Robot3D`
- do not move the center frame
- do not restructure the screen layout
- do not replace the theme with generic UI
- do not weaken AI route auth or validation
- do not reintroduce client-side secret handling
- do not reintroduce anonymous AI requests

### Allowed changes
- cleanup
- hardening
- polish
- performance tuning
- micro-animation work
- readability/accessibility improvements

## Safe treatment of parked 3D code
If `Robot3D.tsx` remains in-tree, agents must treat it as:
- parked code
- not active in this product branch
- safe only for annotation, relocation, or stale-copy cleanup

## Required statement in every substantial PR/task result
Include:
- `Robot2D remains authoritative`
- `Robot3D was not re-enabled`
- `protected layout/composition was preserved`
