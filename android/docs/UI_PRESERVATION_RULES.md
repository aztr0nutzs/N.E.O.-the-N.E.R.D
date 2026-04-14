# UI_PRESERVATION_RULES.md

## The visual contract must survive every fix
This project already has a distinct premium HUD identity. Implementation agents must preserve that identity while correcting logic, performance, and maintainability issues.

## Hard UI preservation rules
- Keep the black/cyber aesthetic.
- Keep the dense, premium, control-wall composition.
- Do not replace the 3D viewport with a static image.
- Do not flatten the interface into generic cards or default components.
- Do not simplify away overlays, panel framing, scanline/glow polish, or premium density.
- Do not remove side panels, dock behavior, persona controls, or assistant affordances unless the task explicitly calls for it.
- Do not rename the product or alter its visual identity without explicit instruction.

## Allowed UI changes
- polish copy
- fix stale fallback text
- fix loading or error-state messaging
- improve spacing only if it preserves composition and density
- improve accessibility labels without changing look and feel
- optimize rendering without visual downgrade

## Verification before accepting any UI-touching task
- compare before/after screenshots
- ensure component hierarchy still renders the same overall shell
- ensure no major spacing collapse occurred
- ensure the 3D viewport still exists and still feels premium
