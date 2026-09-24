import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  AuthError,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './config';

/**
 * Realiza autenticação do administrador usando Firebase Authentication (Email/Senha).
 */
export async function signInAdmin(email: string, pass: string): Promise<User> {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Autenticação indisponível no ambiente de demonstração/preview. Configure VITE_FIREBASE_API_KEY para autenticar.');
  }

  try {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), pass);
    return credential.user;
  } catch (error: unknown) {
    const authError = error as AuthError;
    let friendlyMessage = 'Não foi possível autenticar. Verifique seus dados e tente novamente.';

    switch (authError.code) {
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        friendlyMessage = 'E-mail ou senha incorretos.';
        break;
      case 'auth/invalid-email':
        friendlyMessage = 'Formato de e-mail inválido.';
        break;
      case 'auth/too-many-requests':
        friendlyMessage = 'Muitas tentativas sem sucesso. Por favor, aguarde alguns instantes.';
        break;
      case 'auth/network-request-failed':
        friendlyMessage = 'Falha de conexão com os servidores de autenticação.';
        break;
      default:
        if (authError.message) {
          friendlyMessage = authError.message;
        }
    }

    const err = new Error(friendlyMessage);
    (err as any).code = authError.code;
    throw err;
  }
}

/**
 * Encerra a sessão ativa do administrador no Firebase Auth.
 */
export async function signOutAdmin(): Promise<void> {
  if (!isFirebaseConfigured || !auth) {
    return;
  }
  await signOut(auth);
}

/**
 * Inscreve um listener para observar alterações de estado de autenticação em tempo real.
 */
export function subscribeToAuthChanges(callback: (user: User | null) => void): () => void {
  if (!isFirebaseConfigured || !auth) {
    // Retorno seguro imediato para ambiente de preview/sem Firebase
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

/**
 * Retorna o usuário administrador atualmente autenticado, se houver.
 */
export function getCurrentAdminUser(): User | null {
  if (!isFirebaseConfigured || !auth) {
    return null;
  }
  return auth.currentUser;
}
