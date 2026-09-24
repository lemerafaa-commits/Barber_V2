import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

/**
 * Flag indicando se a configuração do Firebase está presente e válida no ambiente.
 * No ambiente de Preview do Google AI Studio ou desenvolvimento local sem .env,
 * VITE_FIREBASE_API_KEY pode não estar definida.
 */
export const isFirebaseConfigured: boolean = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  typeof import.meta.env.VITE_FIREBASE_API_KEY === 'string' &&
  import.meta.env.VITE_FIREBASE_API_KEY.trim().length > 0
);

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "saas-barberaria-teste-v1.firebaseapp.com",
  projectId: "saas-barberaria-teste-v1",
  storageBucket: "saas-barberaria-teste-v1.firebasestorage.app",
  messagingSenderId: "822706405655",
  appId: "1:822706405655:web:30f1cf136b32f8e56ff752"
};

let app: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    dbInstance = getFirestore(app);
    authInstance = getAuth(app);
  } catch (err) {
    console.warn('[Firebase] Erro ao inicializar serviços do Firebase:', err);
  }
} else {
  console.info('[Firebase] VITE_FIREBASE_API_KEY ausente. Modo seguro de Preview ativo (Firebase desabilitado).');
}

export const db: Firestore = dbInstance as unknown as Firestore;
export const auth: Auth = authInstance as unknown as Auth;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentUser = auth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid || null,
      email: currentUser?.email || null,
      emailVerified: currentUser?.emailVerified || null,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
