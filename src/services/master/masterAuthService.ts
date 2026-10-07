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
 * Princípios de Arquitetura (Passo 1.5):
 * 1. A identidade soberana é o usuário real do Firebase Auth (UID).
 * 2. O privilégio Master é estritamente independente do privilégio business_admin.
 * 3. A autorização prioritária e definitiva avalia Custom Claims no Firebase Token:
 *    - `claims.master === true`
 *    - `claims.role === 'master'`
 * 4. Para resiliência operacional enquanto o claim está sendo propagado no console administrativo,
 *    o e-mail oficial designado (`rafael.leme.macedo@hotmail.com`) é suportado como verificação de identidade.
 * 5. NUNCA expõe senhas, segredos ou API keys.
 */
export async function verifyMasterPrivilege(user: User | null): Promise<MasterIdentity | null> {
  if (!user) return null;

  let hasMasterClaim = false;
  let claims: Record<string, any> = {};

  try {
    // Força checagem sem forçar refresh a menos que necessário
    const idTokenResult = await user.getIdTokenResult();
    claims = idTokenResult.claims || {};

    if (claims.master === true || claims.role === 'master') {
      hasMasterClaim = true;
    }
  } catch (err) {
    console.warn('[MasterAuth] Falha ao inspecionar claims do Firebase Token:', err);
  }

  // Identidade autorizada por claim (prioritária) ou por e-mail oficial designado
  const normalizedEmail = (user.email || '').trim().toLowerCase();
  const isDesignatedEmail = normalizedEmail === 'rafael.leme.macedo@hotmail.com';

  const isMaster = hasMasterClaim || isDesignatedEmail;

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
export async function isAuthorizedMasterUser(user: User | null): Promise<boolean> {
  const identity = await verifyMasterPrivilege(user);
  return Boolean(identity && identity.isMaster);
}
