import {
  User,
  AuthError,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { masterAuth, isFirebaseConfigured } from '../firebase/config';

/**
 * Interface representando a identidade e os privilégios independentes de um usuário Master.
 */
export interface MasterIdentity {
  uid: string;
  email: string | null;
  isMaster: boolean;
  hasMasterClaim: boolean;
  claims: Record<string, any>;
}

/**
 * Autentica o Superadministrador na instância isolada `masterAuth` ('master-app'),
 * preservando a sessão do Admin no app padrão.
 */
export async function signInMaster(email: string, pass: string): Promise<User> {
  if (!isFirebaseConfigured || !masterAuth) {
    throw new Error(
      'Autenticação indisponível no ambiente de demonstração/preview. Configure VITE_FIREBASE_API_KEY para autenticar.'
    );
  }

  try {
    const credential = await signInWithEmailAndPassword(masterAuth, email.trim(), pass);
    return credential.user;
  } catch (error: unknown) {
    const authError = error as AuthError;
    let friendlyMessage = 'Não foi possível autenticar no SaaS Master. Verifique seus dados e tente novamente.';

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
 * Encerra exclusivamente a sessão ativa do Master (`masterAuth`).
 */
export async function signOutMaster(): Promise<void> {
  if (!isFirebaseConfigured || !masterAuth) {
    return;
  }
  await signOut(masterAuth);
}

/**
 * Inscreve listener independente para alterações de autenticação da instância Master.
 */
export function subscribeToMasterAuthChanges(callback: (user: User | null) => void): () => void {
  if (!isFirebaseConfigured || !masterAuth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(masterAuth, callback);
}

/**
 * Retorna o usuário Master atualmente autenticado na instância `masterAuth`.
 */
export function getCurrentMasterUser(): User | null {
  if (!isFirebaseConfigured || !masterAuth) {
    return null;
  }
  return masterAuth.currentUser;
}

/**
 * Valida se um usuário autenticado no Firebase Auth possui privilégio de Master.
 *
 * Princípios de Arquitetura (Passo 2B.5):
 * 1. A identidade soberana é o usuário real do Firebase Auth (UID).
 * 2. O privilégio Master é estritamente independente do privilégio business_admin.
 * 3. A autorização exige EXCLUSIVAMENTE o Custom Claim:
 *    - `claims.master === true`
 * 4. O e-mail do usuário não concede privilégios de acesso nem atua como fallback.
 * 5. Suporta `forceRefresh: true` para buscar claims recém-atribuídos sem necessidade de relogin.
 * 6. NUNCA expõe senhas, segredos ou API keys.
 */
export async function verifyMasterPrivilege(
  user: User | null,
  forceRefresh: boolean = false
): Promise<MasterIdentity | null> {
  if (!user) return null;

  let hasMasterClaim = false;
  let claims: Record<string, any> = {};

  try {
    const idTokenResult = await user.getIdTokenResult(forceRefresh);
    claims = idTokenResult.claims || {};

    // Exigência estrita e unificada: apenas o custom claim `master === true`
    if (claims.master === true) {
      hasMasterClaim = true;
    }
  } catch (err) {
    console.warn('[MasterAuth] Falha ao inspecionar claims do Firebase Token:', err);
  }

  // Autorização estrita e exclusiva: somente com custom claim `master === true`
  const isMaster = hasMasterClaim;

  return {
    uid: user.uid,
    email: user.email,
    isMaster,
    hasMasterClaim,
    claims,
  };
}

/**
 * Método de conveniência booleano consumido pelo fluxo de roteamento do frontend.
 */
export async function isAuthorizedMasterUser(
  user: User | null,
  forceRefresh: boolean = false
): Promise<boolean> {
  const identity = await verifyMasterPrivilege(user, forceRefresh);
  return Boolean(identity && identity.isMaster);
}
