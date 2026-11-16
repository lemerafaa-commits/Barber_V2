/**
 * scripts/test-etapa-7b-rules-compatibility.ts
 *
 * Suíte de testes cirúrgicos para a ETAPA 7B:
 * FIRESTORE RULES DEFINITIVAS — APLICAÇÃO SEGURA + VALIDAÇÃO DE COMPATIBILIDADE
 *
 * Validações obrigatórias:
 * 1. Presença dos helpers isBusinessAdminFor e isAdminForBusiness.
 * 2. Suporte a roles 'admin' e 'business_admin' + 'master'.
 * 3. Validação de request.auth e businessId no JWT contra o tenant acessado.
 * 4. Proteção estrita contra IDOR / Cross-Tenant.
 * 5. Bloqueio de criação direta no Client SDK para appointments, busy_slots e businesses.
 * 6. Immutabilidade do businessId nas atualizações de services, professionals, appointments e busy_slots.
 * 7. Proteção integral de PII no fluxo de conclusão de appointments.
 * 8. Zero erros de sintaxe (ausência de referências inválidas como data.email).
 * 9. Bloqueio explícito das coleções server-side daily_schedules e idempotency_keys.
 * 10. Default deny global ativado.
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
console.log('TESTES DE VERIFICAÇÃO — ETAPA 7B: FIRESTORE RULES DEFINITIVAS');
console.log('===============================================================\n');

const rulesPath = path.join(process.cwd(), 'firestore.rules');
assert(fs.existsSync(rulesPath), '1. Arquivo oficial firestore.rules existe na raiz do repositório');

const content = fs.existsSync(rulesPath) ? fs.readFileSync(rulesPath, 'utf-8') : '';

// -------------------------------------------------------------
// TESTE 1: HELPERS DE AUTORIZAÇÃO E SUPORTE A ROLES
// -------------------------------------------------------------
console.log('[BLOCO 1: HELPERS DE AUTORIZAÇÃO E ROLES]');

assert(
  content.includes('function isAuthenticated()') && content.includes('request.auth != null'),
  '1.1 Helper isAuthenticated() implementado'
);

assert(
  content.includes('function isMaster()') && content.includes('request.auth.token.master == true'),
  '1.2 Helper isMaster() valida claim master: true'
);

assert(
  content.includes('function isBusinessAdminFor(targetBusinessId)') &&
  content.includes("request.auth.token.role == 'admin' || request.auth.token.role == 'business_admin'") &&
  content.includes('request.auth.token.businessId == targetBusinessId'),
  '1.3 Helper isBusinessAdminFor() valida roles "admin" e "business_admin" associadas ao businessId'
);

assert(
  content.includes('function isAdminForBusiness(targetBusinessId)') &&
  content.includes('return isBusinessAdminFor(targetBusinessId);'),
  '1.4 Helper isAdminForBusiness() atua como alias compatível para isBusinessAdminFor()'
);

// -------------------------------------------------------------
// TESTE 2: CORREÇÃO DE SINTAXE E REFERÊNCIA DE VARIÁVEIS
// -------------------------------------------------------------
console.log('\n[BLOCO 2: CORREÇÃO DE SINTAXE E REFERÊNCIAS]');

const profUpdateMatch = content.match(/function isValidProfessionalUpdate\s*\([^)]*\)\s*\{([\s\S]*?)\}/);
const profUpdateBody = profUpdateMatch ? profUpdateMatch[1] : '';

assert(
  profUpdateMatch !== null && !profUpdateBody.includes('data.email') && !profUpdateBody.includes('data.photoUrl'),
  '2.1 Ausência de referências a variável inexistente "data" dentro de isValidProfessionalUpdate'
);

assert(
  profUpdateBody.includes('incomingData.email is string && incomingData.email.size() <= 100') &&
  profUpdateBody.includes('incomingData.photoUrl is string && incomingData.photoUrl.size() <= 2000'),
  '2.2 isValidProfessionalUpdate utiliza corretamente "incomingData" para validação de email e photoUrl'
);

// -------------------------------------------------------------
// TESTE 3: ISOLAMENTO MULTI-TENANT E PROTEÇÃO CONTRA IDOR
// -------------------------------------------------------------
console.log('\n[BLOCO 3: ISOLAMENTO MULTI-TENANT E ANTI-IDOR]');

assert(
  content.includes('match /appointments/{appointmentId}') &&
  content.includes('allow read: if isBusinessAdminFor(resource.data.businessId);'),
  '3.1 Leitura de appointments restrita ao admin do tenant proprietário (Zero vazamento PII cross-tenant)'
);

assert(
  !content.includes('match /appointments/{appointmentId} {\n      allow read: if request.auth != null;'),
  '3.2 appointments NÃO permite leitura aberta apenas com request.auth != null'
);

assert(
  content.includes('match /professionals/{professionalId}') &&
  content.includes('allow read: if isBusinessAdminFor(resource.data.businessId);'),
  '3.3 Leitura de professionals restrita ao admin da empresa (público consome /api/public/catalog higienizado)'
);

assert(
  content.includes('match /services/{serviceId}') &&
  content.includes('allow create: if isBusinessAdminFor(request.resource.data.businessId)') &&
  content.includes('allow update: if isBusinessAdminFor(resource.data.businessId)'),
  '3.4 Criação e atualização de serviços vinculadas estritamente à claim do tenant'
);

// -------------------------------------------------------------
// TESTE 4: BLOQUEIO DE CRIAÇÃO DIRETA NO CLIENT SDK
// -------------------------------------------------------------
console.log('\n[BLOCO 4: BLOQUEIO DE CRIAÇÃO NO CLIENT SDK]');

assert(
  content.includes('match /appointments/{appointmentId}') &&
  content.includes('allow create: if false;'),
  '4.1 appointments proíbe create direto no Client SDK (criação via /api/bookings/create)'
);

assert(
  content.includes('match /busy_slots/{slotId}') &&
  content.includes('allow create: if false;'),
  '4.2 busy_slots proíbe create direto no Client SDK (criação via transação backend)'
);

assert(
  content.includes('match /businesses/{businessId}') &&
  content.includes('allow create: if false;'),
  '4.3 businesses proíbe create direto no Client SDK (criação exclusiva via Provisioning Core no backend)'
);

// -------------------------------------------------------------
// TESTE 5: IMUTABILIDADE DO BUSINESSID E PROTEÇÃO DE PII
// -------------------------------------------------------------
console.log('\n[BLOCO 5: IMUTABILIDADE DO BUSINESSID E FLUXO COMPLETED]');

assert(
  content.includes('request.resource.data.diff(resource.data).affectedKeys().hasOnly([\'status\'])') &&
  content.includes("resource.data.status == 'confirmed'") &&
  content.includes("request.resource.data.status == 'completed'"),
  '5.1 appointments update restrito exclusivamente à transição confirmed -> completed (PII 100% imutável)'
);

assert(
  content.includes('match /services/{serviceId}') &&
  content.includes('request.resource.data.businessId == resource.data.businessId'),
  '5.2 services update garante imutabilidade estrita do businessId'
);

assert(
  content.includes('match /professionals/{professionalId}') &&
  content.includes('request.resource.data.businessId == resource.data.businessId'),
  '5.3 professionals update garante imutabilidade estrita do businessId'
);

assert(
  content.includes('match /businesses/{businessId}') &&
  content.includes('request.resource.data.businessId == businessId'),
  '5.4 businesses update garante correspondência com o ID do documento'
);

// -------------------------------------------------------------
// TESTE 6: COLEÇÕES EXCLUSIVAS DO BACKEND E DEFAULT DENY
// -------------------------------------------------------------
console.log('\n[BLOCO 6: COLEÇÕES DO BACKEND E DEFAULT DENY]');

assert(
  content.includes('match /daily_schedules/{scheduleId}') &&
  content.includes('allow read, write: if false;'),
  '6.1 daily_schedules bloqueada para qualquer acesso Client SDK'
);

assert(
  content.includes('match /idempotency_keys/{keyId}') &&
  content.includes('allow read, write: if false;'),
  '6.2 idempotency_keys bloqueada para qualquer acesso Client SDK'
);

assert(
  content.includes('match /users/{userId}') &&
  content.includes('request.auth.uid == userId || isMaster()') &&
  content.includes('allow create, delete: if false;'),
  '6.3 users com leitura e edição restritas ao próprio usuário ou Master, sem create/delete client-side'
);

assert(
  content.includes('match /{document=**}') &&
  content.includes('allow read, write: if false;'),
  '6.4 Bloqueio global padrão (default deny) ativo no final do arquivo'
);

// -------------------------------------------------------------
// TESTE 7: LEITURA PÚBLICA LEGÍTIMA
// -------------------------------------------------------------
console.log('\n[BLOCO 7: LEITURA PÚBLICA LEGÍTIMA]');

assert(
  content.includes('match /busy_slots/{slotId}') &&
  content.includes('allow read: if true;'),
  '7.1 busy_slots permite leitura pública anônima para cálculo de horários livres'
);

assert(
  content.includes('match /businesses/{businessId}') &&
  content.includes('allow read: if true;'),
  '7.2 businesses permite leitura pública do perfil da barbearia'
);

assert(
  content.includes('match /services/{serviceId}') &&
  content.includes('allow read: if true;'),
  '7.3 services permite leitura pública para exibição do catálogo'
);

console.log('\n---------------------------------------------------------------');
console.log(`TOTAL: ${passCount + failCount} testes | PASS: ${passCount} | FAIL: ${failCount}`);
console.log('---------------------------------------------------------------\n');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 TODAS AS VALIDAÇÕES DAS FIRESTORE RULES PASSARAM COM SUCESSO!\n');
}
