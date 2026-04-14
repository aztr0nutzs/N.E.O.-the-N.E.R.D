import { FirebaseError, initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithRedirect, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithRedirect(auth, provider);
  } catch (error: any) {
    console.error("Error signing in with Google", error);
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
  }
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
}

interface AuthProviderInfo {
  providerId: string;
  displayName: string | null;
  email: string | null;
  photoUrl: string | null;
}

interface FirestoreErrorInfo {
  error: string;
  code?: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: AuthProviderInfo[];
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

function getFirebaseErrorCode(error: unknown) {
  if (!(error instanceof FirebaseError)) return undefined;
  return error.code.replace(/^firestore\//, '');
}

function getAuthInfo() {
  return {
    userId: auth.currentUser?.uid,
    email: auth.currentUser?.email,
    emailVerified: auth.currentUser?.emailVerified,
    isAnonymous: auth.currentUser?.isAnonymous,
    tenantId: auth.currentUser?.tenantId,
    providerInfo: auth.currentUser?.providerData.map((provider) => ({
      providerId: provider.providerId,
      displayName: provider.displayName,
      email: provider.email,
      photoUrl: provider.photoURL
    })) ?? []
  };
}

function logFirestoreError(errInfo: FirestoreErrorInfo) {
  if (!import.meta.env.DEV) return;
  console.error('Detailed Firestore Error:', JSON.stringify(errInfo, null, 2));
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: getErrorMessage(error),
    code: getFirebaseErrorCode(error),
    authInfo: getAuthInfo(),
    operationType,
    path
  };

  logFirestoreError(errInfo);

  if (errInfo.code === 'permission-denied' || errInfo.error.includes('Missing or insufficient permissions')) {
    throw new Error(`Permission denied while trying to ${operationType} data at ${path || 'unknown path'}.`);
  }

  if (errInfo.code === 'unauthenticated') {
    throw new Error(`Authentication required before trying to ${operationType} data.`);
  }

  if (errInfo.code === 'unavailable' || errInfo.code === 'deadline-exceeded') {
    throw new Error(`Database temporarily unavailable during ${operationType} operation. Please try again.`);
  }

  throw new Error(`Database error during ${operationType} operation. Please try again.`);
}
