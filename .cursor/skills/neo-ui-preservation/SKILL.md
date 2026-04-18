---
name: neo-ui-preservation
description: >-
  Ensures N.E.O. HUD changes stay within the visual contract (Robot2D, panels,
  cyber styling). Use for any TaskLog, ChatInterface, App.tsx, or styling work
  that could affect layout or theme.
---
# UI preservation pass

## Invariants

- `Robot2D` remains the live center; do not activate `Robot3D` in this branch.
- No major layout moves; no generic card replacement of the shell.

## Workflow

1. Read current component structure for the touched area.
2. List **what must not change** (positions, hierarchy, key class names affecting theme).
3. Implement the **smallest** diff; avoid new global layout systems.

## Evidence

- If visuals could change: suggest screenshot comparison or describe exact UI risk in the PR/agent summary.

## Done when

- Functional goal met AND explicit statement: **protected UI preserved** (yes/no + notes)
