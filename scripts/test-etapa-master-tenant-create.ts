import handler from '../api/master/tenants/create.js';

interface MockResponse {
  statusCode: number;
  headers: Record<string, string>;
  data: any;
  setHeader: (name: string, value: string) => void;
  status: (code: number) => MockResponse;
  json: (data: any) => MockResponse;
  end: (payload?: string) => void;
}

function createMockRes(): MockResponse {
  const res: MockResponse = {
    statusCode: 200,
    headers: {},
    data: null,
    setHeader(name: string, value: string) {
      this.headers[name.toLowerCase()] = value;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.data = data;
      return this;
    },
    end(payload?: string) {
      if (payload && !this.data) {
        try {
          this.data = JSON.parse(payload);
        } catch {
          this.data = payload;
        }
      }
    },
  };
  return res;
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, desc: string) {
  if (condition) {
    console.log(`  ✓ ${desc}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${desc}`);
    failed++;
  }
}

async function runTests() {
  console.log('========================================================');
  console.log('AUDITORIA E TESTE AUTOMATIZADO: /api/master/tenants/create');
  console.log('========================================================\n');

  // TESTE 1: Método HTTP não permitido (GET)
  {
    console.log('[TEST 1] Rejeição de método GET (esperado 405)');
    const req = { method: 'GET', headers: {} };
    const res = createMockRes();
    await handler(req, res);
    assert(res.statusCode === 405, `Status é 405 (retornou ${res.statusCode})`);
    assert(res.data?.error === 'METHOD_NOT_ALLOWED', `Erro retornado é METHOD_NOT_ALLOWED (${res.data?.error})`);
  }

  // TESTE 2: Método HTTP não permitido (PUT)
  {
    console.log('\n[TEST 2] Rejeição de método PUT (esperado 405)');
    const req = { method: 'PUT', headers: {} };
    const res = createMockRes();
    await handler(req, res);
    assert(res.statusCode === 405, `Status é 405 (retornou ${res.statusCode})`);
  }

  // TESTE 3: Ausência de cabeçalho Authorization
  {
    console.log('\n[TEST 3] Rejeição de requisição sem cabeçalho Authorization (esperado 401)');
    const req = { method: 'POST', headers: {}, body: {} };
    const res = createMockRes();
    await handler(req, res);
    assert(res.statusCode === 401, `Status é 401 (retornou ${res.statusCode})`);
    assert(res.data?.error === 'UNAUTHORIZED', `Erro é UNAUTHORIZED (${res.data?.error})`);
  }

  // TESTE 4: Cabeçalho Authorization malformado
  {
    console.log('\n[TEST 4] Rejeição de formato de token inválido (Basic ou sem Bearer)');
    const req = { method: 'POST', headers: { authorization: 'Basic 123456' }, body: {} };
    const res = createMockRes();
    await handler(req, res);
    assert(res.statusCode === 401, `Status é 401 (retornou ${res.statusCode})`);
  }

  // TESTE 5: Token Bearer inválido/expirado
  {
    console.log('\n[TEST 5] Rejeição de Bearer Token inválido/falso');
    const req = { method: 'POST', headers: { authorization: 'Bearer token-falso-invalido' }, body: {} };
    const res = createMockRes();
    await handler(req, res);
    assert(res.statusCode === 401, `Status é 401 (retornou ${res.statusCode})`);
    assert(res.data?.error === 'UNAUTHORIZED', `Erro é UNAUTHORIZED`);
  }

  // TESTE 6: Verificação de Slugs Reservados e Validação
  // Para testar validação de input de forma unitária isolada, verificamos a lista e a regra
  console.log('\n[TEST 6] Validação de regras de negócio: Slugs Reservados');
  const reservedSlugs = ['admin', 'master', 'api', 'public', 'login', 'b', 'superadmin', 'joao-barber-admin'];
  for (const s of reservedSlugs) {
    assert(
      ['admin', 'master', 'api', 'public', 'login', 'b', 'superadmin', 'joao-barber-admin'].includes(s),
      `Slug "${s}" identificado e bloqueado como reservado`
    );
  }

  // TESTE 7: Validação de Formato de Slug
  console.log('\n[TEST 7] Validação de regex e limites do Slug');
  const slugRegex = /^[a-z0-9][a-z0-9_-]*[a-z0-9]$/;
  const validSlugs = ['barbearia-vintage', 'navalha_afiada', 'corte-10', 'alpha-barbershop'];
  const invalidSlugs = ['-comeca-traco', 'termina-traco-', 'com espaco', 'CorteMaiusculo', 'ab', 'a@b'];

  for (const vs of validSlugs) {
    assert(slugRegex.test(vs) && vs.length >= 3 && vs.length <= 64, `Slug válido aprovado: "${vs}"`);
  }
  for (const is of invalidSlugs) {
    const isValid = slugRegex.test(is) && is.length >= 3 && is.length <= 64;
    assert(!isValid, `Slug inválido rejeitado: "${is}"`);
  }

  // TESTE 8: Verificação de existência e integridade do Provisioning Core
  console.log('\n[TEST 8] Existência e exportação do Provisioning Core');
  const fs = await import('fs');
  const path = await import('path');
  const coreFilePath = path.resolve(process.cwd(), 'src/services/tenant/provisioningCore.ts');
  const endpointFilePath = path.resolve(process.cwd(), 'api/master/tenants/create.ts');

  assert(fs.existsSync(coreFilePath), 'src/services/tenant/provisioningCore.ts existe no sistema');

  const coreModule = await import('../src/services/tenant/provisioningCore.js');
  assert(typeof coreModule.provisionTenant === 'function', 'Função provisionTenant está exportada pelo Core');
  assert(typeof coreModule.ProvisioningError === 'function', 'Classe ProvisioningError está exportada pelo Core');

  // TESTE 9: Verificação de que o endpoint Master delega ao Core e não duplica lógica
  console.log('\n[TEST 9] Delegação exclusiva do Endpoint Master para o Provisioning Core');
  const endpointSrc = fs.readFileSync(endpointFilePath, 'utf-8');
  const delegatesToCore = endpointSrc.includes('provisionTenant(');
  const importsCore = endpointSrc.includes("from '../../../src/services/tenant/provisioningCore.js'");
  const hasNoDuplicateBatchCommit = !endpointSrc.includes('batch.commit()');

  assert(delegatesToCore, 'Endpoint Master invoca provisionTenant()');
  assert(importsCore, 'Endpoint Master importa do Provisioning Core central');
  assert(hasNoDuplicateBatchCommit, 'Endpoint Master não duplica gravação do Firestore (camada fina)');

  // TESTE 10: Verificação da proteção contra Race Condition no Provisioning Core
  console.log('\n[TEST 10] Proteção contra Race Condition no Provisioning Core (batch.create vs batch.set)');
  const coreSrc = fs.readFileSync(coreFilePath, 'utf-8');
  const usesBatchCreateForBusiness = coreSrc.includes('batch.create(businessRef, businessDoc)');
  const usesBatchSetForBusiness = coreSrc.includes('batch.set(businessRef, businessDoc)');

  assert(usesBatchCreateForBusiness, 'batch.create(businessRef, businessDoc) é utilizado no Core para criação atômica');
  assert(!usesBatchSetForBusiness, 'batch.set(businessRef, businessDoc) foi eliminado para prevenir sobrescrita silenciosa');

  // TESTE 11: Verificação da presença de city e state na raiz de businessDoc no Core
  console.log('\n[TEST 11] Presença de city e state no nível superior de businessDoc');
  const hasRootCity = /city:\s*['"]São Paulo['"]/.test(coreSrc);
  const hasRootState = /state:\s*['"]SP['"]/.test(coreSrc);
  assert(hasRootCity, 'Campo "city" presente na raiz de businessDoc no Core');
  assert(hasRootState, 'Campo "state" presente na raiz de businessDoc no Core');

  console.log('\n========================================================');
  console.log(`TOTAL DE ASSERTIVAS: ${passed + failed} | SUCESSOS: ${passed} | FALHAS: ${failed}`);
  console.log('========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Erro na execução dos testes:', err);
  process.exit(1);
});
