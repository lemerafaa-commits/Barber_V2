import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, initializeFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

/**
 * Flag indicando se a configuração do Firebase está presente e válida no ambiente.
 * No ambiente de Preview do Google AI Studio ou desenvolvimento local sem .env,
 * VITE_FIREBASE_API_KEY pode não estar definida.
 */
export const isFirebaseConfigured: boolean = Boolean(
  typeof import.meta !== 'undefined' &&
  import.meta.env?.VITE_FIREBASE_API_KEY &&
  typeof import.meta.env.VITE_FIREBASE_API_KEY === 'string' &&
  import.meta.env.VITE_FIREBASE_API_KEY.trim().length > 0
);

export const firebaseConfig = {
  apiKey: typeof import.meta !== 'undefined' ? import.meta.env?.VITE_FIREBASE_API_KEY : undefined,
  authDomain: "saas-barbearia-teste-v1.firebaseapp.com",
  projectId: "saas-barbearia-teste-v1",
  storageBucket: "saas-barbearia-teste-v1.firebasestorage.app",
  messagingSenderId: "822706405655",
  appId: "1:822706405655:web:30f1cf136b32f8e56ff752"
};

const MASTER_APP_NAME = 'master-app';

let app: FirebaseApp | null = null;
let masterApp: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;
let masterAuthInstance: Auth | null = null;
let initError: string | null = null;

if (isFirebaseConfigured) {
  try {
    const existingDefaultApp = getApps().find((item) => item.name === '[DEFAULT]');
    app = existingDefaultApp ?? initializeApp(firebaseConfig);

    try {
      dbInstance = initializeFirestore(app, {
        experimentalForceLongPolling: true,
      });
    } catch (firestoreErr: unknown) {
      console.warn(
        '[Firebase] initializeFirestore(experimentalForceLongPolling) falhou ou já havia sido inicializado (usando getFirestore):',
        firestoreErr
      );
      dbInstance = getFirestore(app);
    }

    authInstance = getAuth(app);

    const existingMasterApp = getApps().find((item) => item.name === MASTER_APP_NAME);
    masterApp = existingMasterApp ?? initializeApp(firebaseConfig, MASTER_APP_NAME);
    masterAuthInstance = getAuth(masterApp);
  } catch (err: unknown) {
    initError = err instanceof Error ? err.message : String(err);
    console.error('[Firebase] Erro crítico ao inicializar serviços do Firebase:', err);
  }
} else {
  console.info('[Firebase] VITE_FIREBASE_API_KEY ausente. Modo seguro de Preview ativo (Firebase desabilitado).');
}

export const db: Firestore | null = dbInstance;
export const auth: Auth | null = authInstance;
export const masterAuth: Auth | null = masterAuthInstance;
export const firebaseInitError: string | null = initError;

export class FirestoreOperationError extends Error {
  readonly isIndeterminate: boolean;
  readonly isOffline: boolean;
  readonly originalError?: unknown;

  constructor(
    message: string,
    options?: { isIndeterminate?: boolean; isOffline?: boolean; originalError?: unknown }
  ) {
    super(message);
    this.name = 'FirestoreOperationError';
    this.isIndeterminate = Boolean(options?.isIndeterminate);
    this.isOffline = Boolean(options?.isOffline);
    this.originalError = options?.originalError;
  }
}

export const FIRESTORE_WRITE_TIMEOUT_MS = 12000;
export const FIRESTORE_READ_TIMEOUT_MS = 10000;

export function assertBrowserOnline(actionLabel = 'executar esta operação'): void {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new FirestoreOperationError(
      `Sem conexão com a internet para ${actionLabel}. Verifique sua rede e tente novamente.`,
      { isOffline: true, isIndeterminate: false }
    );
  }
}

export async function awaitFirestoreOperation<T>(
  promise: Promise<T>,
  options: {
    timeoutMs?: number;
    timeoutMessage: string;
    indeterminateOnTimeout?: boolean;
  }
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? FIRESTORE_WRITE_TIMEOUT_MS;
  let timerId: ReturnType<typeof setTimeout> | undefined;

  // Evita UnhandledPromiseRejection caso a Promise original rejeite após o timeout
  promise.catch(() => {});

  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timerId = setTimeout(() => {
          reject(
            new FirestoreOperationError(options.timeoutMessage, {
              isIndeterminate: Boolean(options.indeterminateOnTimeout),
              isOffline: true,
            })
          );
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
  }
}

export function extractFirestoreErrorMessage(
  error: unknown,
  fallbackMessage = 'Falha na comunicação com o banco de dados. Tente novamente.'
): string {
  if (!error) return fallbackMessage;
  if (error instanceof FirestoreOperationError) {
    return error.message;
  }
  const rawMessage = error instanceof Error ? error.message : String(error);
  try {
    const parsed = JSON.parse(rawMessage);
    if (parsed && typeof parsed.error === 'string') {
      if (
        parsed.error.includes('Missing or insufficient permissions') ||
        parsed.error.includes('permission-denied')
      ) {
        return 'Permissão negada no Firestore (permission-denied). Verifique sua sessão e as regras de acesso.';
      }
      if (parsed.error.toLowerCase().includes('offline')) {
        return 'Cliente Firestore offline ou sem conexão estável com o servidor.';
      }
      return parsed.error;
    }
  } catch {
    // Não é JSON do handleFirestoreError
  }
  if (rawMessage.toLowerCase().includes('offline')) {
    return 'Não foi possível conectar ao Firestore (cliente offline). Verifique sua rede e tente novamente.';
  }
  return rawMessage || fallbackMessage;
}

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
  if (error instanceof FirestoreOperationError) {
    console.error('Firestore Operation Timeout/Offline:', {
      message: error.message,
      isIndeterminate: error.isIndeterminate,
      isOffline: error.isOffline,
      operationType,
      path,
    });
    throw error;
  }

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
