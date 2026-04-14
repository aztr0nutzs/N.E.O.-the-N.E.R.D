# UI_PRESERVATION_STANDARD.md

## Core rule
This branch must retain its current composition and visual identity while being polished.

## Protected areas
- full screen composition in `src/App.tsx`
- center robot frame and overlays
- left/right panel placement
- bottom dock placement
- industrial/cyber visual language

## Allowed polish
- spacing refinements
- readability improvements
- improved glow and pulse timing
- hover feedback
- scanline and micro-animation refinement
- stronger 2D robot presentation

## Forbidden without explicit approval
- moving panel positions
- collapsing layout into generic cards
- replacing the theme
- re-centering/rebuilding the whole screen
- re-enabling 3D robot as the live path

## Required language in every prompt/change plan
Include explicit instruction that:
- UI composition must be preserved
- center framing must not change
- Robot2D remains authoritative
