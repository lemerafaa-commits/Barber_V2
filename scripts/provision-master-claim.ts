import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

/**
 * Script de Provisionamento Seguro do Master Claim
 *
 * Princípios de Segurança:
 * 1. CARREGAMENTO EXPLÍCITO DO .ENV:
 *    Localiza e carrega o arquivo .env a partir da raiz do projeto antes de inicializar o Firebase Admin.
 * 2. REUTILIZAÇÃO DA INFRAESTRUTURA EXISTENTE:
 *    Importa dinamicamente getAdminAuth() de serverDb.ts após o carregamento confirmado do .env.
 * 3. MODO AUDITORIA / DRY-RUN POR PADRÃO:
 *    Nenhuma alteração é gravada a menos que a flag `--apply` seja explicitamente passada.
 * 4. PRESERVAÇÃO DE PRIVILÉGIOS EXISTENTES:
 *    Sempre realiza MERGE (`{ ...existingClaims, master: true }`),
 *    assegurando que o acesso do administrador da barbearia (business_admin) NUNCA seja sobrescrito ou perdido.
 * 5. NENHUMA EXPOSIÇÃO DE CREDENCIAIS OU VALORES SECRETOS.
 */

// Resolução determinística da raiz do projeto a partir da localização deste script (/scripts/..)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Candidatos ordenados de caminho para o arquivo .env
const envCandidates = [
  path.resolve(projectRoot, '.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(projectRoot, '.env.local'),
  path.resolve(process.cwd(), '.env.local'),
];

let loadedEnvPath: string | null = null;

for (const candidate of envCandidates) {
  if (fs.existsSync(candidate)) {
    const result = dotenv.config({ path: candidate });
    if (!result.error) {
      loadedEnvPath = candidate;
      break;
    }
  }
}

// Fallback padrão caso nenhum arquivo específico seja encontrado
if (!loadedEnvPath) {
  dotenv.config();
}

async function main() {
  const targetEmail = process.env.MASTER_USER_EMAIL || 'rafael.leme.macedo@hotmail.com';
  const isApplyMode = process.argv.includes('--apply');

  console.log('======================================================================');
  console.log('  JOBSNIAK — PROVISIONAMENTO CONTROLADO DO MASTER CLAIM');
  console.log('======================================================================');
  console.log(`[Ambiente] Arquivo .env carregado: ${loadedEnvPath ? loadedEnvPath : '(nenhum arquivo .env encontrado no disco)'}`);
  console.log(`[Config] E-mail alvo: ${targetEmail}`);
  console.log(`[Config] Modo de execução: ${isApplyMode ? 'APLICAR ALTERAÇÕES (--apply)' : 'AUDITORIA / DRY-RUN (SOMENTE LEITURA)'}`);
  console.log('----------------------------------------------------------------------');
  console.log('[Diagnóstico de Variáveis Server-Side (sem expor segredos)]:');
  console.log(`  - FIREBASE_PROJECT_ID: ${process.env.FIREBASE_PROJECT_ID || '(não definido)'}`);
  console.log(`  - FIREBASE_SERVICE_ACCOUNT presente: ${Boolean(process.env.FIREBASE_SERVICE_ACCOUNT)}`);
  console.log(`  - FIREBASE_CLIENT_EMAIL presente: ${Boolean(process.env.FIREBASE_CLIENT_EMAIL)}`);
  console.log(`  - FIREBASE_PRIVATE_KEY presente: ${Boolean(process.env.FIREBASE_PRIVATE_KEY)}`);
  console.log('----------------------------------------------------------------------');

  // Importação dinâmica: garante que serverDb.ts seja avaliado somente APÓS o .env estar carregado
  const { getAdminAuth } = await import('../src/services/firebase/serverDb.js');

  let adminAuth;
  try {
    adminAuth = getAdminAuth();
  } catch (err: any) {
    console.error('❌ Falha ao inicializar Firebase Admin Auth:');
    console.error(err?.message || err);
    console.log('\nCertifique-se de configurar uma das seguintes fontes de credenciais no seu arquivo .env:');
    console.log('- FIREBASE_SERVICE_ACCOUNT (JSON string)');
    console.log('- FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY + FIREBASE_PROJECT_ID');
    console.log('- Application Default Credentials (GCP / Cloud Run)');
    process.exit(1);
  }

  try {
    console.log(`[Passo 1/3] Localizando usuário no Firebase Authentication...`);
    const user = await adminAuth.getUserByEmail(targetEmail);

    console.log('✅ Usuário localizado com sucesso:');
    console.log(`  - UID: ${user.uid}`);
    console.log(`  - E-mail: ${user.email}`);
    console.log(`  - E-mail verificado: ${user.emailVerified}`);
    console.log(`  - Conta desativada: ${user.disabled}`);
    console.log(`  - Claims atuais:`, JSON.stringify(user.customClaims || {}, null, 2));

    const existingClaims = user.customClaims || {};
    const mergedClaims = {
      ...existingClaims,
      master: true,
    };

    console.log('----------------------------------------------------------------------');
    console.log('[Passo 2/3] Simulação do Merge de Claims:');
    console.log('  - Claims antes:', JSON.stringify(existingClaims));
    console.log('  - Claims após merge:', JSON.stringify(mergedClaims));
    console.log('  - Preservação de claims anteriores: GARANTIDA');

    if (!isApplyMode) {
      console.log('----------------------------------------------------------------------');
      console.log('🛡️ MODO DRY-RUN: Nenhuma alteração foi persistida no Firebase Authentication.');
      console.log('Para aplicar efetivamente em um próximo passo autorizado, execute:');
      console.log('  npm run master:claim -- --apply');
      console.log('======================================================================');
      return;
    }

    console.log('----------------------------------------------------------------------');
    console.log('[Passo 3/3] Aplicando custom claims no Firebase Authentication...');
    await adminAuth.setCustomUserClaims(user.uid, mergedClaims);

    // Validação imediata consultando novamente o registro no Firebase
    const updatedUser = await adminAuth.getUser(user.uid);
    console.log('✅ Custom Claims gravados e verificados com sucesso:');
    console.log(`  - Claims finais persistidos:`, JSON.stringify(updatedUser.customClaims || {}, null, 2));
    console.log('======================================================================');
    console.log('🎉 SUCESSO: Usuário agora possui acesso ao /master com privilégios preservados.');
    console.log('======================================================================');
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      console.error(`❌ Usuário "${targetEmail}" não foi encontrado no projeto Firebase.`);
    } else {
      console.error('❌ Erro durante a operação:', err?.message || err);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Erro fatal não tratado:', err);
  process.exit(1);
});
