# Prompt 03: Robot3D Performance and Fallback Accuracy

## UI PRESERVATION AMEND — MUST BE FOLLOWED FIRST
- Preserve the current premium futuristic J.A.R.V.I.S. interface exactly.
- Preserve the 3D assistant viewport and all premium overlay treatment.
- Do not replace the 3D experience with a static image or simpler component.
- Any optimization must keep the current look and interactive feel intact.

## Task
Improve `Robot3D` correctness and performance without changing the visual contract.

### Files to inspect and modify
- `src/components/Robot3D.tsx`
- any directly related lazy-loading/import site if needed
- optionally `public/robot_model.glb` optimization guidance if the model itself is too heavy

### Objectives
1. update stale fallback copy so it no longer says to upload `robot_model.glb` when the asset is already present
2. make fallback text accurately describe real failure cases: asset load failure, corruption, unsupported WebGL, or runtime 3D failure
3. audit render path for unnecessary work
4. if appropriate, improve lazy-loading behavior around the 3D chunk
5. preserve current camera, lighting, float, controls, and overall premium feel unless a bug requires tiny adjustment
6. do not visually downgrade the viewport

### Verification required
- `npm run lint`
- `npm run build`
- report any chunk-size improvement
- explicitly state whether the GLB path still matches `useGLTF('/robot_model.glb', true)`
