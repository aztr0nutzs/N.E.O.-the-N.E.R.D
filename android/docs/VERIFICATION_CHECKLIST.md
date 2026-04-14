# VERIFICATION_CHECKLIST.md

## Required commands
```bash
npm ci
npm run lint
npm run build
```

## Required manual checks
### Auth
- sign in works
- sign out works
- protected AI actions fail cleanly when signed out

### Systems
- boot sequence starts
- media permission prompts behave correctly
- speech recognition toggles correctly
- motion detection path does not crash

### UI
- `Robot2D` renders in center frame
- no `Robot3D` path is active
- side panels render correctly
- bottom dock remains intact
- no layout shifts or panel relocations

### AI
- chat request works
- image request works
- video request works or fails cleanly
- server errors are generic and user-safe

## Required report fields
- files changed
- commands run
- command results
- protected UI preserved statement
- `Robot2D` still authoritative statement
