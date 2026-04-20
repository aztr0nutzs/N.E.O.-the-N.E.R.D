# MASTER_INSPECTION.md

## Project Identity and Scope

This repository is the active **N.E.O.** branch using:

- **Supabase** for auth and data persistence
- **Capacitor Android** as the active mobile packaging target
- **Robot2D** as the active center-screen robot
- **Robot3D** as parked / non-authoritative
- **Express + Gemini server routes** protected by Supabase bearer-token verification
- **Premium NERD shell UI** that must be preserved during all technical work

This document defines the required standard for any deep inspection, stabilization pass, migration audit, shell correction pass, feature implementation review, or production-readiness review.

This is not a vague code-quality checklist. It is the source-of-truth inspection framework for this exact project.

---

## Current Product Direction

The product direction for this branch is:

# **Network / Device Intelligence + Actionable Assistant**

The app must evolve into a **useful AI-powered network and device command center**, not a decorative sci-fi shell.

That means all inspections must prioritize whether the app is becoming better at:

1. **detecting real network/device state**
2. **explaining that state clearly**
3. **allowing meaningful actions**
4. **persisting useful history/preferences**
5. **remaining visually premium without becoming deceptive**

If the app looks impressive but still lies about controls, telemetry, state, or actions, that is a failure.

---

## Non-Negotiable Branch Truths

Any inspection must assume and preserve these truths unless explicitly told otherwise:

- **Supabase is the active backend**
- **Firebase is not the active runtime backend**
- **Capacitor Android is the active mobile target**
- **Robot2D is the active center robot**
- **Robot3D is parked / non-authoritative**
- **Current premium shell aesthetic is intentional and must not be flattened**
- **Signed-out/login flow must be truthful**
- **Visible controls must not pretend to do things they do not do**
- **Simulated content must be labeled honestly**
- **No new work should reintroduce fake clickability or decorative system lies**

---

## Mandatory Inspection Rules

### 1. Read-only means read-only
If the inspection is defined as read-only:
- do not modify files
- do not “quietly fix” things
- do not combine audit and implementation
- do not slip in cleanup

### 2. Trace real call paths
Do not assume a button, panel, stat, setting, or route is real just because the UI exists.

You must trace:
- handler
- state source
- service/repository call
- backend expectation
- actual success/failure path

### 3. Distinguish real vs decorative
For every relevant control or telemetry surface, classify it as:
- **Real**
- **Partial**
- **Decorative**
- **Unavailable**
- **Dead/Misleading**

### 4. Distinguish verified facts from inferred risks
Every inspection must separate:
- **verified current behavior**
- **likely but unverified runtime/device behavior**
- **future risk**

### 5. Preserve shell identity while inspecting
Do not recommend “fixing” shell problems by replacing the app with a generic dashboard or bland auth/settings/chat pages.

### 6. Scope discipline is mandatory
Only inspect what is necessary for the current task.
Do not convert one inspection into a rewrite proposal.

---

## Core Inspection Domains

Every serious inspection must explicitly cover the following domains relevant to the task.

---

# A. Shell Truthfulness and Interaction Integrity

Inspect whether the visible UI is **truthful**.

## Required checks
- bottom dock buttons
- right-side panel controls
- top-level shell controls
- visible labels vs actual behavior
- decorative telemetry vs real telemetry
- visible actions vs real actions
- disabled/unavailable state honesty
- fake clickability
- misleading toasts/messages
- shell-level overlap/z-index/hit-area issues

## Must identify
- controls that look actionable but are fake
- controls that changed local visual state only
- decorative metrics presented as live system values
- surfaces that feel operational but are simulation-only
- any overlap that blocks robot, controls, or important interaction zones

## Failure conditions
Inspection fails if it does not explicitly classify visible shell controls as:
- Real
- Partial
- Decorative
- Unavailable

---

# B. Login / Auth / Session Flow

Inspect the real signed-out and signed-in transition behavior.

## Required checks
- login screen entry flow
- primary sign-in action
- any misleading secondary action
- inline auth error handling
- session bootstrap path
- Supabase session restoration
- signed-out gate logic
- post-login transition into main app

## Capacitor / Android specific checks
- Capacitor Browser usage
- Capacitor App callback handling
- app URL open listener
- callback deep link consistency
- Android manifest callback intent filter
- callback scheme/host/path consistency
- Supabase redirect assumptions
- browser fallback behavior

## Must identify
- browser-only auth assumptions
- silent login failures
- misleading signed-out actions
- session restoration gaps
- app states where user is authenticated but UI remains stuck signed out

## Failure conditions
Inspection fails if it cannot answer:
- what exact handler performs login
- how mobile callback returns are processed
- how the session is restored
- how the app leaves the auth gate

---

# C. Supabase Data Flow Integrity

Inspect actual persisted user data flows.

## Required checks
- task create/read/update/delete flow
- message create/read flow
- assistant reply persistence path
- local state vs remote persistence consistency
- signed-out behavior
- row ownership assumptions
- Supabase table names and payload shapes
- failure behavior when inserts/selects fail

## Must identify
- saved-but-not-shown bugs
- reload mismatch bugs
- duplicate append issues
- optimistic UI with broken persistence
- persistence with no immediate UI update
- hardcoded/demo fallback data interfering with live data

## Failure conditions
Inspection fails if it does not map:
- exact file(s) performing the writes
- exact file(s) loading the data
- exact state containers used by the UI

---

# D. Network / Device Intelligence Readiness

This is the product-critical inspection domain going forward.

## Required checks
- existence of device/network models
- existence of scan service abstractions
- actual network discovery logic vs placeholders
- device state normalization
- persistence for devices/history
- action service design
- UI readiness for device list/detail/action surfaces
- assistant consumption of network/device state

## Must identify
- whether the app has real network intelligence yet
- whether the app still depends on simulated telemetry
- missing models required for:
  - DeviceRecord
  - ScanSnapshot
  - DeviceEvent
  - NetworkSummary
  - DeviceActionResult

## Failure conditions
Inspection fails if it cannot clearly state:
- what network/device functionality is real today
- what is missing for MVP usefulness
- what is still decorative

---

# E. Assistant Usefulness and Truthfulness

Inspect whether the assistant is becoming operationally useful.

## Required checks
- assistant request path
- model/tool settings path
- assistant UI action cards / actionable behavior
- whether assistant responses use real app state
- whether assistant can trigger real operations
- local-only decorative assistant behaviors
- chat usefulness vs generic fluff

## Must identify
- whether assistant is grounded in real device/network state
- whether assistant only “talks” or can actually help act
- whether settings around voice/model/persona are truthful and meaningful

## Failure conditions
Inspection fails if it cannot answer:
- what real state the assistant can see
- what real actions the assistant can trigger
- what is still decorative persona behavior

---

# F. Settings Truthfulness and Persistence

Inspect whether settings are real, useful, and honest.

## Required checks
- settings entry path
- settings panel/window implementation
- settings persistence path
- localStorage vs server persistence
- real vs unavailable settings
- voice preview behavior
- HUD/settings impact on actual shell behavior

## Must identify
- which settings are actually wired
- which settings are partial
- which settings are unavailable but still shown
- whether settings survive reload
- whether settings affect real UI/runtime behavior

## Failure conditions
Inspection fails if it does not classify settings by:
- Wired
- Partially Wired
- Unavailable but Honest
- Misleading/Fake

---

# G. Server / Protected Route Integrity

Inspect `server.ts` and related server-side behavior.

## Required checks
- Supabase bearer-token verification
- fail-closed behavior on missing/invalid tokens
- rate limiting
- request validation
- payload sanitation
- tool/config validation
- error hygiene
- Gemini route behavior
- route assumptions about signed-in user

## Must identify
- any route that can be hit without proper auth
- any env-name confusion or brittle config usage
- validation gaps
- raw internal error leakage
- server/client contract mismatch

## Failure conditions
Inspection fails if it cannot map:
- how token verification works
- which routes are protected
- what happens on invalid auth
- what validation gaps remain

---

# H. Android / Capacitor Integration

Inspect the project as a real mobile app, not a browser fantasy.

## Required checks
- `capacitor.config.*`
- Android manifest
- plugin registration expectations
- deep-link intent filter
- WebView assumptions
- Browser/App plugin usage
- Android build health
- shell UI suitability for phone layout

## Must identify
- any mobile-only blockers
- browser-only assumptions
- high-heat / high-lag startup paths
- pre-auth heavy subsystem startup
- callback routing inconsistencies

## Failure conditions
Inspection fails if it does not answer:
- how Android receives auth callback
- how the app processes the return URL
- what pre-auth heavy systems are still running

---

# I. Dead / Stale / Misleading Code

Inspect only directly relevant dead or misleading code.

## Required checks
- dead handlers
- fake intervals/RNG “telemetry”
- abandoned login flows
- stale Firebase references
- stale Robot3D references in live flows
- duplicate logic paths
- stale docs that contradict runtime reality

## Must identify
- code that should be removed
- code that should be quarantined
- code that should be relabeled/documented
- docs that would mislead future agents

## Failure conditions
Inspection fails if it hand-waves dead code instead of naming:
- file
- symbol/handler/component
- reason it is stale
- safe removal/quarantine recommendation

---

## File Priority Map for Inspections

These files should be treated as primary high-value inspection targets for this project:

### Top priority
- `src/App.tsx`
- `src/authClient.ts`
- `src/lib/supabase.ts`
- `src/context/NeuralContext.tsx`
- `src/components/NerdLogin.tsx`
- `src/components/BottomDock.tsx`
- `src/components/ChatInterface.tsx`
- `src/components/SettingsPanel.tsx`
- `src/components/SidePanelRight.tsx`
- `src/components/NetworkScreen.tsx`
- `src/components/SystemStats.tsx`
- `server.ts`
- `capacitor.config.ts`
- `android/app/src/main/AndroidManifest.xml`

### Secondary priority
- `src/hooks/*`
- device/network-related services or repositories
- docs describing architecture or migration state
- any old Firebase-era references still in active docs

---

## Required Output Format for Formal Inspections

Every formal inspection must return results in this exact structure.

### 1. BRANCH HEALTH SUMMARY
- current branch identity
- major strengths
- major risks
- current readiness tier

### 2. VERIFIED FILE / CALL PATH MAP
- auth flow
- session flow
- data persistence flow
- shell control flow
- server protection flow

### 3. CONTROL / SETTINGS / TELEMETRY TRUTHFULNESS AUDIT
- list visible controls and classify them
- identify fake/decorative/misleading elements
- identify truthful real actions

### 4. VERIFIED BLOCKERS
- only real blockers
- no speculative filler
- clearly separate code blockers from runtime/manual verification blockers

### 5. STALE / DEAD / MISLEADING CODE
- exact files and symbols
- why they are risky or stale

### 6. RUNTIME / DEVICE-ONLY UNKNOWNs
- exactly what cannot be proven statically
- exactly what must be verified manually

### 7. SAFE NEXT STEPS
- ordered, scoped, minimal next actions
- no giant rewrite recommendations unless absolutely unavoidable

### 8. FINAL SCORE
Required category scores:
- Shell Truthfulness
- Auth / Session Integrity
- Supabase Data Integrity
- Network/Device Intelligence Readiness
- Assistant Usefulness
- Settings Integrity
- Server Hardening
- Android/Capacitor Readiness
- Cleanup / Naming Hygiene
- Production-Readiness

---

## Scoring Guidance

Use 0–10 scoring.

### 0–3
Broken, deceptive, or structurally wrong

### 4–6
Partially working but still risky, misleading, or incomplete

### 7–8
Good foundation with known finite blockers

### 9
Strong, nearly production-ready, only minor cleanup/hardening left

### 10
Do not hand out casually. This repo is not there unless proven across browser + Android + live auth + live data + useful network/device flows.

---

## Hard Prohibitions for Any AI Using This File

Any AI or agent inspecting this project must NOT:

- replace the premium UI with generic dashboard components
- propose flattening the shell into bland cards as the main fix
- revive Robot3D in the live branch
- suggest broad architecture rewrites without first tracing real call paths
- assume Supabase, login, or data persistence works just because config files exist
- assume telemetry is real because numbers are moving
- treat decorative controls as acceptable final behavior
- merge inspection and implementation unless explicitly asked
- claim mobile auth is fixed without addressing callback return and session restoration
- suggest Firebase as the active solution path for this branch
- ignore Android/Capacitor realities and inspect as if this were web-only

---

## Definition of Inspection Success

A successful inspection for this project does all of the following:

- identifies what is truly real vs what is still decorative
- traces actual auth/session/data/control/server paths
- names exact blockers without inventing drama
- protects the premium NERD shell while judging truthfulness
- provides a scoped next step plan that does not cause drift
- helps the project move toward:
  - **detect**
  - **explain**
  - **act**
  - **remember**

If an inspection cannot do that, it is just expensive narration.

---

## Current Strategic Goal After Shell Stabilization

Once shell stabilization is verified, inspections should shift toward readiness for:

1. **Network data model foundation**
2. **Scan engine MVP**
3. **Device actions**
4. **Assistant intelligence grounded in real state**
5. **History and alerts**
6. **Performance / thermal-safe polish**

Future inspections must judge new work by whether it makes the app **useful**, not just prettier.

---

## Final Principle

This project should not become:

- a fake Jarvis skin
- a decorative sci-fi launcher
- a chat window surrounded by lies

It should become:

# **an AI-powered network and device command center with truthful controls, useful intelligence, and premium presentation**

Any inspection that loses that thread is off course.