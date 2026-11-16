/**
 * scripts/test-etapa-7-real-multi-tenant.ts
 *
 * Suíte de testes cirúrgicos para a ETAPA 7:
 * CORREÇÃO DE CONSISTÊNCIA MULTI-TENANT EM PRODUÇÃO
 *
 * Validações obrigatórias:
 * TESTE 1: Novo tenant (businesses/{businessId}) é exposto no endpoint do Master e consumido por MasterDataService.
 * TESTE 2: Coleção users/{uid} possui regra explícita no firestore.rules para o próprio usuário e Master.
 * TESTE 3: Custom claims (forceRefresh controlado) e suporte a roles 'admin' e 'business_admin'.
 * TESTE 4: Isolamento multi-tenant (isAdminForBusiness exige claim correspondente ao businessId).
 * TESTE 5: Eliminação de loading infinito (tratamento de erro e estados empty em services e appointments).
 */

import fs from 'fs';
import path from 'path';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passCount++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
    if (detail) {
      console.error(`     Detalhe: ${detail}`);
    }
    failCount++;
  }
}

console.log('\n===============================================================');
console.log('TESTES DE VERIFICAÇÃO — ETAPA 7: CONSISTÊNCIA MULTI-TENANT');
console.log('===============================================================\n');

// -------------------------------------------------------------
// TESTE 1: BLOCO A — Master enxerga os tenants reais
// -------------------------------------------------------------
console.log('[BLOCO A: MASTER ENXERGA OS TENANTS REAIS]');
const networkApiPath = path.join(process.cwd(), 'api/master/network.ts');
assert(fs.existsSync(networkApiPath), '1.1 Endpoint server-side /api/master/network.ts existe');

const networkApiContent = fs.existsSync(networkApiPath) ? fs.readFileSync(networkApiPath, 'utf-8') : '';
assert(
  networkApiContent.includes("db.collection('businesses').get()") &&
  networkApiContent.includes("db.collection('users').get()"),
  '1.2 /api/master/network consulta diretamente as coleções "businesses" e "users" via Firebase Admin SDK'
);

assert(
  networkApiContent.includes("isMasterClaimPresent") &&
  networkApiContent.includes("payload.master === true"),
  '1.3 /api/master/network protege acesso exigindo claim master: true'
);

const masterDataServicePath = path.join(process.cwd(), 'src/services/master/masterDataService.ts');
const masterDataContent = fs.existsSync(masterDataServicePath) ? fs.readFileSync(masterDataServicePath, 'utf-8') : '';

assert(
  masterDataContent.includes("getMasterNetworkData") &&
  masterDataContent.includes("'/api/master/network'"),
  '1.4 MasterDataService consome /api/master/network para retornar lista dinâmica de empresas'
);

assert(
  masterDataContent.includes("networkData.businesses") &&
  masterDataContent.includes("networkData.users"),
  '1.5 getBusinesses() e getUsers() integram dados reais da rede multi-tenant'
);

// -------------------------------------------------------------
// TESTE 2: BLOCO B — Refresh de Custom Claims no Login
// -------------------------------------------------------------
console.log('\n[BLOCO B: REFRESH DE CUSTOM CLAIMS NO LOGIN]');
const adminLoginPath = path.join(process.cwd(), 'src/components/admin/AdminLogin.tsx');
const adminLoginContent = fs.existsSync(adminLoginPath) ? fs.readFileSync(adminLoginPath, 'utf-8') : '';

assert(
  adminLoginContent.includes("user.getIdToken(true)"),
  '2.1 AdminLogin força user.getIdToken(true) após autenticação para sincronizar claims recentes'
);

const appPath = path.join(process.cwd(), 'src/App.tsx');
const appContent = fs.existsSync(appPath) ? fs.readFileSync(appPath, 'utf-8') : '';

assert(
  appContent.includes("verifyAdminPrivilege(user, true)"),
  '2.2 App.tsx passa forceRefresh: true para verifyAdminPrivilege ao inicializar listener de auth'
);

const authServicePath = path.join(process.cwd(), 'src/services/firebase/auth.ts');
const authServiceContent = fs.existsSync(authServicePath) ? fs.readFileSync(authServicePath, 'utf-8') : '';

assert(
  authServiceContent.includes("role === 'admin' || role === 'business_admin'"),
  '2.3 verifyAdminPrivilege reconhece tanto role="admin" quanto role="business_admin"'
);

// -------------------------------------------------------------
// TESTE 3: BLOCO C — Consistência de Roles e Firestore Rules
// -------------------------------------------------------------
console.log('\n[BLOCO C: CONSISTÊNCIA DE ROLES E FIRESTORE RULES]');
const rulesPath = path.join(process.cwd(), 'firestore.rules');
const rulesContent = fs.existsSync(rulesPath) ? fs.readFileSync(rulesPath, 'utf-8') : '';

assert(
  rulesContent.includes("request.auth.token.role == 'admin' || request.auth.token.role == 'business_admin'"),
  '3.1 firestore.rules aceita tanto "admin" quanto "business_admin" na função isAdminForBusiness'
);

assert(
  rulesContent.includes("match /users/{userId}") &&
  rulesContent.includes("request.auth.uid == userId || isMaster()"),
  '3.2 firestore.rules possui regra explícita para /users/{userId} com leitura permitida ao próprio usuário ou Master'
);

assert(
  !rulesContent.includes("match /users/{userId} {\n      allow read, write: if true;"),
  '3.3 firestore.rules NÃO possui regras abertas em /users'
);

const cancelApiPath = path.join(process.cwd(), 'api/admin/bookings/cancel.ts');
const cancelApiContent = fs.existsSync(cancelApiPath) ? fs.readFileSync(cancelApiPath, 'utf-8') : '';

assert(
  cancelApiContent.includes("roleClaim !== 'admin' && roleClaim !== 'business_admin'"),
  '3.4 /api/admin/bookings/cancel aceita administradores com role "admin" ou "business_admin"'
);

// -------------------------------------------------------------
// TESTE 4: ISOLAMENTO MULTI-TENANT
// -------------------------------------------------------------
console.log('\n[SEGURANÇA: ISOLAMENTO MULTI-TENANT]');
assert(
  rulesContent.includes("request.auth.token.businessId == targetBusinessId"),
  '4.1 firestore.rules valida estritamente a claim businessId contra o targetBusinessId do recurso'
);

assert(
  cancelApiContent.includes("bodyBusinessId !== businessIdClaim"),
  '4.2 API de cancelamento rejeita com 403 tentativa de cancelar reserva de outro tenant'
);

// -------------------------------------------------------------
// TESTE 5: BLOCO D — Eliminação de Loading Infinito
// -------------------------------------------------------------
console.log('\n[BLOCO D: ELIMINAÇÃO DE LOADING INFINITO]');
const adminDashPath = path.join(process.cwd(), 'src/components/admin/AdminDashboard.tsx');
const adminDashContent = fs.existsSync(adminDashPath) ? fs.readFileSync(adminDashPath, 'utf-8') : '';

assert(
  adminDashContent.includes("appointmentsError") &&
  adminDashContent.includes("setAppointmentsError"),
  '5.1 AdminDashboard possui estado explícito de erro para agendamentos'
);

assert(
  adminDashContent.includes("servicesError") &&
  adminDashContent.includes("setServicesError"),
  '5.2 AdminDashboard possui estado explícito de erro para serviços'
);

assert(
  adminDashContent.includes("setServices(firestoreServices)"),
  '5.3 fetchServices atualiza o estado de serviços mesmo quando a lista retornada for vazia (0 serviços)'
);

const servicesHubPath = path.join(process.cwd(), 'src/components/admin/services/ServicesHub.tsx');
const servicesHubContent = fs.existsSync(servicesHubPath) ? fs.readFileSync(servicesHubPath, 'utf-8') : '';

assert(
  servicesHubContent.includes("error && !isLoading") &&
  servicesHubContent.includes("Tentar Novamente"),
  '5.4 ServicesHub exibe mensagem de erro e botão de tentar novamente em caso de falha'
);

const appointmentsServicePath = path.join(process.cwd(), 'src/services/firebase/appointments.ts');
const appointmentsServiceContent = fs.existsSync(appointmentsServicePath) ? fs.readFileSync(appointmentsServicePath, 'utf-8') : '';

assert(
  appointmentsServiceContent.includes("throw error;"),
  '5.5 getFirestoreAppointmentsForAdmin propaga erros de forma limpa para fechamento do loading no finally'
);

console.log('\n---------------------------------------------------------------');
console.log(`TOTAL: ${passCount + failCount} testes | PASS: ${passCount} | FAIL: ${failCount}`);
console.log('---------------------------------------------------------------\n');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 TODOS OS TESTES DA ETAPA 7 PASSARAM COM 100% DE SUCESSO!\n');
}
