# RISK_REGISTER.md

## Current top risks

### 1. Server validation still too permissive in edge shapes
Risk: malformed config/tool payloads or unexpected content structures slip through.
Mitigation: explicit route-specific schemas and stricter object sanitization.

### 2. 3D payload cost remains high
Risk: slow first-load or mobile performance drag.
Mitigation: lazy loading, GLB optimization, dependency audit.

### 3. `ChatInterface.tsx` complexity
Risk: future changes introduce regressions because request logic and UI logic remain too intertwined.
Mitigation: extract helpers/services without changing visible behavior.

### 4. Dev logging noise
Risk: low signal in debugging and possible accidental shipping of noisy diagnostics.
Mitigation: centralize dev logging helpers and trim low-value logs.

### 5. AI-assisted cleanup regressions
Risk: external coding agents flatten UI or remove premium features to make bugs vanish.
Mitigation: strict UI preservation header on every task prompt and screenshot-based verification.
