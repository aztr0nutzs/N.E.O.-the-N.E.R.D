# Current Firebase Dependency Map

This is based on the uploaded `N.E.O.-the-N.E.R.D-main` source.

## Client auth
### `src/firebase.ts`
Current responsibilities:
- initializes Firebase app
- creates `auth`
- `loginWithGoogle()` via Firebase redirect
- `logout()`
- token acquisition via `getProtectedIdToken()`
- generic protected fetch helper `fetchProtectedJson()`
- Firestore error formatting

## Client db
### `src/firestore.ts`
Current responsibilities:
- creates Firestore instance via `getFirestore(app, firebaseConfig.firestoreDatabaseId)`

## Auth propagation
### `src/context/NeuralContext.tsx`
Current responsibilities:
- imports `auth` from `src/firebase.ts`
- subscribes with `onAuthStateChanged`
- stores a Firebase `User | null`

## Tasks data layer
### `src/components/TaskLog.tsx`
Current responsibilities:
- Firestore realtime `onSnapshot`
- `setDoc`, `updateDoc`, `deleteDoc`
- user path `users/${userId}/tasks`
- task schema:
  - `id`
  - `title`
  - `completed`
  - `priority`
  - `userId`
  - `createdAt`

## Messages data layer
### `src/components/ChatInterface.tsx`
Current responsibilities:
- Firestore realtime `onSnapshot`
- `setDoc`, `deleteDoc`, `getDocs`
- user path `users/${userId}/messages`
- message schema:
  - `role`
  - `content`
  - optional `imageUrl`
  - optional `videoUrl`
  - optional `audioData`
  - `createdAt`

## Server auth verification
### `server.ts`
Current responsibilities:
- imports `firebase-admin`
- runs `admin.initializeApp()`
- verifies bearer tokens with `admin.auth().verifyIdToken(token)`
- attaches decoded token to request

## Config files tied to Firebase
- `firebase-applet-config.json`
- `firebase-blueprint.json`
- `firestore.rules`

## Package dependencies to remove after migration
- `firebase`
- `firebase-admin`
