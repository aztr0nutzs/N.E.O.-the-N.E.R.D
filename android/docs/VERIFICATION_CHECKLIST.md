# VERIFICATION_CHECKLIST.md

## Required command receipts
- [ ] `npm ci`
- [ ] `npm run lint`
- [ ] `npm run build`

## Required functional checks
- [ ] unauthenticated protected AI call is rejected or blocked client-side
- [ ] authenticated chat flow still works
- [ ] image flow still works
- [ ] video generation flow still works or fails cleanly
- [ ] `Robot3D` renders with `robot_model.glb`
- [ ] `Robot3D` fallback text is accurate
- [ ] speech recognition starts/stops correctly
- [ ] media stream cleanup occurs on unmount
- [ ] motion tracking still updates user position
- [ ] Firestore message history still loads and persists correctly

## Required regression checks
- [ ] no flattening of UI
- [ ] no major layout shifts
- [ ] no dead controls introduced
- [ ] no stale imports left behind
- [ ] no new console spam beyond intended dev-only logs

## Performance checks
- [ ] capture build chunk sizes
- [ ] note `Robot3D` chunk size
- [ ] note main bundle size
- [ ] if optimized, compare before/after numbers
