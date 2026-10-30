import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

/**
 * Script de Provisionamento Seguro de Custom Claims para o Superadministrador Master
 *
 * Princípios de Segurança e Integridade (JOBSNIAK V5 - Etapa 1C):
 * 1. MODO SIMULAÇÃO (DRY-RUN) POR PADRÃO:
 *    Nenhuma gravação é efetuada no Firebase Authentication a menos que a flag `--apply` seja passada explicitamente.
 * 2. IDENTIFICADOR INEQUÍVOCO (ZERO AMBIGUIDADE & ZERO HARDCODING):
 *    Exige exatamente um identificador (UID ou E-mail), fornecido via argumento CLI (--email= ou --uid=) ou
 *    variável de ambiente (MASTER_USER_EMAIL ou MASTER_USER_UID). Nenhum e-mail pessoal é prefixado ou assumido.
 *    Se nenhum identificador for fornecido, a execução é abortada imediatamente antes de inicializar o Firebase.
 * 3. PRECEDÊNCIA E RESOLUÇÃO SEGURA DE CONFLITOS CLI VS AMBIENTE:
 *    Argumentos explícitos na CLI prevalecem. Se o ambiente (.env) contiver identificadores divergentes ou
 *    conflitantes, a operação aborta exigindo alinhamento explícito, sem escolher contas silenciosamente.
 * 4. REJEIÇÃO RÍGIDA DE ARGUMENTOS DESCONHECIDOS OU DUPLICADOS:
 *    Qualquer argumento não reconhecido, vazio ou duplicado interrompe imediatamente a execução com erro.
 * 5. VALIDAÇÃO DE CONTA DESATIVADA E E-MAIL NÃO VERIFICADO:
 *    Interrompe a operação se user.disabled === true ou user.emailVerified !== true.
 * 6. PRESERVAÇÃO INTEGRAL DE CLAIMS PRÉ-EXISTENTES:
 *    Preserva integralmente todas as custom claims existentes (inclusive businessId ou role),
 *    adicionando exclusivamente `master: true` via merge seguro.
 * 7. ZERO EXPOSIÇÃO DE CREDENCIAIS OU SEGREDOS:
 *    Nenhum token, chave privada ou senha é exibido nos logs.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Resolução determinística e segura do arquivo .env
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

if (!loadedEnvPath) {
  dotenv.config();
}

interface ParsedArgs {
  email?: string;
  uid?: string;
  isApplyMode: boolean;
}

/**
 * Realiza a análise estrita da linha de comando e valida conflitos com variáveis de ambiente.
 */
function parseAndValidateArgs(): ParsedArgs {
  const rawArgs = process.argv.slice(2);
  let cliEmail: string | undefined;
  let cliUid: string | undefined;
  let isApplyMode = false;

  const seenFlags = new Set<string>();

  for (const rawArg of rawArgs) {
    const trimmed = rawArg.trim();

    // 1. Flag de aplicação
    if (trimmed === '--apply') {
      if (seenFlags.has('--apply')) {
        console.error('❌ Argumento duplicado detectado: "--apply". Execução interrompida.');
        process.exit(1);
      }
      seenFlags.add('--apply');
      isApplyMode = true;
      continue;
    }

    // 2. Argumento de E-mail
    if (trimmed.startsWith('--email=')) {
      if (seenFlags.has('email')) {
        console.error('❌ Argumento duplicado detectado: múltiplos argumentos de e-mail foram fornecidos.');
        process.exit(1);
      }
      seenFlags.add('email');
      const val = trimmed.slice('--email='.length).trim();
      if (!val) {
        console.error('❌ Valor inválido: argumento "--email=" não pode ser vazio.');
        process.exit(1);
      }
      cliEmail = val;
      continue;
    }

    if (trimmed === '--email') {
      console.error('❌ Sintaxe inválida: utilize "--email=<endereco>" com sinal de igual e sem espaços.');
      process.exit(1);
    }

    // 3. Argumento de UID
    if (trimmed.startsWith('--uid=')) {
      if (seenFlags.has('uid')) {
        console.error('❌ Argumento duplicado detectado: múltiplos argumentos de UID foram fornecidos.');
        process.exit(1);
      }
      seenFlags.add('uid');
      const val = trimmed.slice('--uid='.length).trim();
      if (!val) {
        console.error('❌ Valor inválido: argumento "--uid=" não pode ser vazio.');
        process.exit(1);
      }
      cliUid = val;
      continue;
    }

    if (trimmed === '--uid') {
      console.error('❌ Sintaxe inválida: utilize "--uid=<id>" com sinal de igual e sem espaços.');
      process.exit(1);
    }

    // 4. Rejeição imediata de argumentos desconhecidos
    console.error(`❌ Argumento não suportado ou inválido: "${trimmed}". Execução interrompida.`);
    console.error('   Argumentos permitidos: --email=<email>, --uid=<uid>, --apply.');
    process.exit(1);
  }

  // Validação 1: Ambiguidade direta na CLI (UID e E-mail fornecidos simultaneamente)
  if (cliEmail && cliUid) {
    console.error('❌ AMBIGUIDADE DE IDENTIFICADOR NA LINHA DE COMANDO:');
    console.error('   Foram informados simultaneamente --email e --uid na CLI.');
    console.error('   Por segurança estrita, informe exatamente um identificador (UID ou E-mail), nunca ambos.');
    console.error('   Execução interrompida antes de qualquer consulta ao Firebase.');
    process.exit(1);
  }

  // Leitura segura de variáveis de ambiente
  const envEmail = process.env.MASTER_USER_EMAIL?.trim();
  const envUid = process.env.MASTER_USER_UID?.trim();

  // Validação 2: Conflito ou ambiguidade entre CLI e variáveis de ambiente
  if (cliEmail) {
    if (envUid) {
      console.error('❌ CONFLITO ENTRE CLI E AMBIENTE:');
      console.error('   A linha de comando especificou um E-mail (--email), mas a variável MASTER_USER_UID está presente no ambiente.');
      console.error('   Para evitar selecionar uma conta divergente, remova a variável conflitante do ambiente.');
      process.exit(1);
    }
    if (envEmail && envEmail.toLowerCase() !== cliEmail.toLowerCase()) {
      console.error('❌ CONFLITO DE E-MAILS ENTRE CLI E AMBIENTE:');
      console.error('   O e-mail informado na CLI difere do valor definido em MASTER_USER_EMAIL no ambiente.');
      console.error('   Remova a variável do ambiente ou alinhe os valores para prosseguir.');
      process.exit(1);
    }
  }

  if (cliUid) {
    if (envEmail) {
      console.error('❌ CONFLITO ENTRE CLI E AMBIENTE:');
      console.error('   A linha de comando especificou um UID (--uid), mas a variável MASTER_USER_EMAIL está presente no ambiente.');
      console.error('   Para evitar selecionar uma conta divergente, remova a variável conflitante do ambiente.');
      process.exit(1);
    }
    if (envUid && envUid !== cliUid) {
      console.error('❌ CONFLITO DE UIDs ENTRE CLI E AMBIENTE:');
      console.error('   O UID informado na CLI difere do valor definido em MASTER_USER_UID no ambiente.');
      console.error('   Remova a variável do ambiente ou alinhe os valores para prosseguir.');
      process.exit(1);
    }
  }

  // Validação 3: Se nada foi informado na CLI, verificar se o ambiente possui ambiguidade interna
  if (!cliEmail && !cliUid) {
    if (envEmail && envUid) {
      console.error('❌ AMBIGUIDADE NAS VARIÁVEIS DE AMBIENTE:');
      console.error('   Tanto MASTER_USER_EMAIL quanto MASTER_USER_UID estão definidos no ambiente.');
      console.error('   Defina apenas um identificador por vez para garantir uma seleção inequívoca.');
      process.exit(1);
    }
  }

  const finalEmail = cliEmail || envEmail;
  const finalUid = cliUid || envUid;

  return {
    email: finalEmail,
    uid: finalUid,
    isApplyMode,
  };
}

async function main() {
  const { email, uid, isApplyMode } = parseAndValidateArgs();

  console.log('======================================================================');
  console.log('  JOBSNIAK V5 — PROVISIONAMENTO SEGURO DO MASTER CLAIM');
  console.log('======================================================================');
  console.log(`[Ambiente] Arquivo .env carregado: ${loadedEnvPath ? loadedEnvPath : '(nenhum arquivo .env encontrado no disco)'}`);
  console.log(`[Modo] Execução: ${isApplyMode ? 'APLICAR NO FIREBASE (--apply)' : 'SIMULAÇÃO / DRY-RUN (SOMENTE LEITURA)'}`);
  console.log('----------------------------------------------------------------------');

  // Exigência estrita de exatamente um identificador fornecido (ZERO FALLBACK / ZERO HARDCODING)
  if (!email && !uid) {
    console.error('❌ ERRO DE IDENTIFICAÇÃO: Nenhum identificador de usuário Master foi fornecido.');
    console.error('');
    console.error('Por motivos de segurança estrita, nenhum e-mail ou UID padrão é assumido pelo sistema.');
    console.error('Por favor, forneça exatamente um identificador do Superadministrador Master da plataforma:');
    console.error('');
    console.error('  Forma 1 (Simulação por E-mail):');
    console.error('    npm run master:claim -- --email=superadmin@suaplataforma.com');
    console.error('');
    console.error('  Forma 2 (Simulação por UID):');
    console.error('    npm run master:claim -- --uid=SEU_UID_DO_FIREBASE');
    console.error('');
    console.error('  Forma 3 (Via Variável de Ambiente no .env):');
    console.error('    MASTER_USER_EMAIL=superadmin@suaplataforma.com');
    console.error('');
    console.error('Para aplicar após confirmar a prévia da simulação, adicione a flag --apply.');
    console.error('======================================================================');
    process.exit(1);
  }

  // Diagnóstico seguro de credenciais server-side (sem vazar valores ou segredos)
  console.log('[Diagnóstico de Credenciais do Servidor]:');
  console.log(`  - FIREBASE_PROJECT_ID: ${process.env.FIREBASE_PROJECT_ID || '(não definido)'}`);
  console.log(`  - FIREBASE_SERVICE_ACCOUNT presente: ${Boolean(process.env.FIREBASE_SERVICE_ACCOUNT)}`);
  console.log(`  - FIREBASE_CLIENT_EMAIL presente: ${Boolean(process.env.FIREBASE_CLIENT_EMAIL)}`);
  console.log(`  - FIREBASE_PRIVATE_KEY presente: ${Boolean(process.env.FIREBASE_PRIVATE_KEY)}`);
  console.log('----------------------------------------------------------------------');

  // Inicialização controlada do Firebase Admin
  const { getAdminAuth } = await import('../src/services/firebase/serverDb.js');

  let adminAuth;
  try {
    adminAuth = getAdminAuth();
  } catch (err: any) {
    console.error('❌ Falha ao inicializar Firebase Admin Auth:');
    console.error(err?.message || err);
    console.error('\nConfigure as credenciais no .env antes de prosseguir.');
    process.exit(1);
  }

  try {
    console.log('[Passo 1/3] Localizando usuário Master no Firebase Authentication...');
    let user;
    if (uid) {
      console.log(`  Buscando unicamente por UID: "${uid}"`);
      user = await adminAuth.getUser(uid);
    } else if (email) {
      console.log(`  Buscando unicamente por E-mail: "${email}"`);
      user = await adminAuth.getUserByEmail(email);
    } else {
      throw new Error('Identificador ausente após validação.');
    }

    console.log('✅ Usuário localizado com sucesso:');
    console.log(`  - UID: ${user.uid}`);
    console.log(`  - E-mail: ${user.email}`);
    console.log(`  - E-mail verificado: ${user.emailVerified}`);
    console.log(`  - Conta desativada: ${user.disabled}`);
    console.log(`  - Claims atuais no Firebase:`, JSON.stringify(user.customClaims || {}, null, 2));

    // Verificação de segurança: Bloqueio estrito de contas desativadas ou com e-mail não verificado
    if (user.disabled === true) {
      console.error('❌ CONTA DESATIVADA: O usuário informado está marcado como desativado no Firebase Authentication.');
      console.error('   Por segurança estrita, privilégios de Superadministrador Master não podem ser provisionados para contas desativadas.');
      process.exit(1);
    }

    if (user.emailVerified !== true) {
      console.error('❌ E-MAIL NÃO VERIFICADO: O e-mail do usuário informado ainda não foi verificado no Firebase Authentication.');
      console.error('   Por segurança estrita, privilégios de Superadministrador Master só podem ser concedidos a contas com e-mail verificado.');
      process.exit(1);
    }

    // Leitura e preservação estrita de claims pré-existentes
    const existingClaims = (user.customClaims || {}) as Record<string, any>;

    const mergedClaims: Record<string, any> = {
      ...existingClaims,
      master: true,
    };

    console.log('----------------------------------------------------------------------');
    console.log('[Passo 2/3] Simulação do Merge de Claims:');
    console.log('  - Claims antes:', JSON.stringify(existingClaims));
    console.log('  - Claims após merge:', JSON.stringify(mergedClaims));
    console.log('  - Preservação de claims anteriores: GARANTIDA (nenhuma permissão removida)');

    if (!isApplyMode) {
      console.log('----------------------------------------------------------------------');
      console.log('🛡️ MODO DRY-RUN / SIMULAÇÃO ATIVO:');
      console.log('   Nenhuma alteração foi persistida no Firebase Authentication.');
      console.log('   Para aplicar efetivamente em um próximo passo autorizado, execute:');
      if (uid) {
        console.log(`     npm run master:claim -- --uid=${uid} --apply`);
      } else {
        console.log(`     npm run master:claim -- --email=${email} --apply`);
      }
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
    console.log('🎉 SUCESSO: Usuário agora possui acesso ao /master com privilégios soberanos preservados.');
    console.log('======================================================================');
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      console.error(`❌ Usuário "${uid || email}" não foi encontrado no projeto Firebase.`);
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
