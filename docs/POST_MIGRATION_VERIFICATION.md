# Post-Migration Verification

## Command gates
Run:

```bash
npm ci
npm run lint
npm run build
```

## Functional checks
### Auth
- launch app
- click sign in
- complete Google auth via Supabase
- return to app signed in

### Tasks
- create task
- toggle task complete state
- delete task
- refresh app and confirm persistence

### Messages
- send prompt
- verify user message saved
- verify assistant response saved
- clear history
- verify messages are removed and reboot message is written

### Protected AI routes
- signed-in request succeeds
- signed-out request fails cleanly
- expired/invalid token fails with auth message, not server crash

## Cleanup checks
- no runtime imports from `firebase` remain
- no runtime imports from `firebase-admin` remain
- no active references to `firebase-applet-config.json`
- package no longer depends on Firebase libraries after migration
