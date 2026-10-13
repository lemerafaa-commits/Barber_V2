import { User } from 'firebase/auth';

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
