# UI PRESERVATION AMENDS - MUST OBEY
- Preserve the current screen composition exactly.
- Do not move or redesign the center frame, side panels, or bottom dock.
- Do not re-enable `Robot3D` in this branch.
- `Robot2D` must remain the authoritative live center robot.
- Do not replace the cyber/industrial visual language with generic UI.
- Make only the smallest correct changes needed for the task.
- Report exact files changed, exact verification commands run, and exact results.

# Task
Perform a **server hardening pass** focused on `server.ts`.

## Mission
Tighten request validation and maintain secure behavior without breaking successful requests.

## Focus areas
- `systemInstruction` validation
- `responseModalities` validation
- `speechConfig` shape validation
- `thinkingConfig` value validation
- tool object validation
- image/video config validation
- operation ID validation
- payload bounds
- generic client-safe error responses

## Must preserve
- `/api/ai/*` auth protection
- rate limiting
- fail-closed auth misconfiguration behavior
- current route structure

## Required output
- exact validation changes
- exact files changed
- exact commands run
- examples of newly rejected malformed payloads
