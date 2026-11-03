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

/**
 * Interface representando a identidade e privilégios verificados de um Administrador.
 */
export interface AdminIdentity {
  uid: string;
  email: string | null;
  isAdmin: boolean;
  businessId: string | null;
  claims: Record<string, any>;
}

/**
 * Valida autoritativamente se um usuário autenticado no Firebase Auth possui Custom Claim de Admin.
 *
 * Princípios de Segurança (SEC-01):
 * 1. Exige que o usuário esteja autenticado no Firebase Auth (UID válido).
 * 2. Valida as claims criptografadas do token via getIdTokenResult(forceRefresh).
 * 3. Valida se role === 'admin'.
 * 4. Valida se businessId é uma string válida e não vazia após trim().
 * 5. Se o usuário for apenas Master (claims.master === true), não concede automaticamente
 *    privilégios de admin local sem que possua role === 'admin' e businessId válido.
 * 6. Suporta forceRefresh: true para recarregar claims recém-atribuídas sem necessidade de relogin.
 */
export async function verifyAdminPrivilege(
  user: User | null,
  forceRefresh: boolean = false
): Promise<AdminIdentity | null> {
  if (!user) return null;

  let isAdmin = false;
  let businessId: string | null = null;
  let claims: Record<string, any> = {};

  try {
    const idTokenResult = await user.getIdTokenResult(forceRefresh);
    claims = idTokenResult.claims || {};

    const role = typeof claims.role === 'string' ? claims.role.trim() : '';
    const bId = typeof claims.businessId === 'string' ? claims.businessId.trim() : '';

    if (role === 'admin' && bId.length > 0) {
      isAdmin = true;
      businessId = bId;
    }
  } catch (err) {
    console.warn('[AdminAuth] Falha ao inspecionar custom claims do token Firebase:', err);
  }

  return {
    uid: user.uid,
    email: user.email,
    isAdmin,
    businessId,
    claims,
  };
}

/**
 * Método booleano de conveniência para guardas de rota da interface administrativa.
 */
export async function isAuthorizedAdminUser(
  user: User | null,
  forceRefresh: boolean = false
): Promise<boolean> {
  const identity = await verifyAdminPrivilege(user, forceRefresh);
  return Boolean(identity && identity.isAdmin);
}
