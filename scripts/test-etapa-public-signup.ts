import handler from '../api/public/signup.js';

interface MockResponse {
  statusCode: number;
  headers: Record<string, string>;
  data: any;
  setHeader: (name: string, value: any) => void;
  status: (code: number) => MockResponse;
  json: (data: any) => MockResponse;
  end: (payload?: string) => void;
}

function createMockRes(): MockResponse {
  const res: MockResponse = {
    statusCode: 200,
    headers: {},
    data: null,
    setHeader(name: string, value: any) {
      this.headers[name.toLowerCase()] = Array.isArray(value) ? value.join(', ') : String(value);
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
  console.log('AUDITORIA E TESTE AUTOMATIZADO: /api/public/signup');
  console.log('========================================================\n');

  // TEST 1: Rejeição de método HTTP GET (405)
  {
    console.log('[TEST 1] Rejeição de método GET (esperado 405 e cabeçalho Allow: POST)');
    const req = { method: 'GET', headers: {} };
    const res = createMockRes();
    await handler(req, res);
    assert(res.statusCode === 405, `Status HTTP retornado é 405 (obtido: ${res.statusCode})`);
    assert(res.data?.error === 'METHOD_NOT_ALLOWED', `Código de erro é METHOD_NOT_ALLOWED (obtido: ${res.data?.error})`);
    assert(
      res.headers['allow']?.includes('POST'),
      `Cabeçalho Allow contém POST (obtido: ${res.headers['allow']})`
    );
  }

  // TEST 2: Rejeição de método HTTP PUT (405)
  {
    console.log('\n[TEST 2] Rejeição de método PUT (esperado 405)');
    const req = { method: 'PUT', headers: {}, body: {} };
    const res = createMockRes();
    await handler(req, res);
    assert(res.statusCode === 405, `Status HTTP retornado é 405 (obtido: ${res.statusCode})`);
    assert(res.data?.error === 'METHOD_NOT_ALLOWED', 'Código de erro é METHOD_NOT_ALLOWED');
  }

  // TEST 3: Acesso público sem necessidade de Authorization header (não retorna 401)
  {
    console.log('\n[TEST 3] Acesso público sem cabeçalho Authorization (não exige login/master)');
    const req = {
      method: 'POST',
      headers: {}, // Sem nenhum cabeçalho de autorização
      body: {
        // Payload incompleto para testar que a requisição passa pelo filtro de auth e atinge validação
      },
    };
    const res = createMockRes();
    await handler(req, res);
    assert(res.statusCode !== 401, `Status não é 401 Unauthorized (obtido: ${res.statusCode})`);
    assert(res.statusCode !== 403, `Status não é 403 Forbidden (obtido: ${res.statusCode})`);
    assert(res.statusCode === 400, `Atingiu validação de dados com 400 (obtido: ${res.statusCode})`);
  }

  // TEST 4: Validação de Payload Incompleto ou Inválido (400)
  {
    console.log('\n[TEST 4] Validação de dados ausentes (nome da barbearia ausente)');
    const req = {
      method: 'POST',
      headers: {},
      body: {
        slug: 'barbearia-teste-public',
        adminName: 'João Silva',
        adminEmail: 'joao.public@barber.com',
        initialPassword: 'senha-segura-123',
      },
    };
    const res = createMockRes();
    await handler(req, res);
    assert(res.statusCode === 400, `Status é 400 para nome ausente (obtido: ${res.statusCode})`);
    assert(res.data?.error === 'INVALID_DATA', `Código de erro é INVALID_DATA (obtido: ${res.data?.error})`);
  }

  // TEST 5: Proteção contra Mass Assignment e Forçamento do Plano 'starter'
  {
    console.log('\n[TEST 5] Proteção contra Mass Assignment (campos privilegiados ignorados e plano starter forçado)');
    const fs = await import('fs');
    const path = await import('path');
    const signupFilePath = path.resolve(process.cwd(), 'api/public/signup.ts');
    const signupSrc = fs.readFileSync(signupFilePath, 'utf-8');

    // Verifica que não usa desestruturação cega de req.body nem spread operator no input
    const hasSpreadOnInput = /provisionTenant\s*\(\s*\{\s*\.\.\./.test(signupSrc) || /input\s*=\s*\{\s*\.\.\./.test(signupSrc);
    assert(!hasSpreadOnInput, 'Não utiliza spread operator de req.body (...req.body ou ...body)');

    // Verifica whitelist explícita de campos
    const hasWhitelistExtraction = /const\s*\{\s*businessName,\s*slug,\s*adminName,\s*adminEmail,\s*initialPassword,\s*adminPhone\s*\}\s*=\s*body/.test(signupSrc);
    assert(hasWhitelistExtraction, 'Aplica whitelist explícita e estrita para os campos permitidos');

    // Verifica que o plano é explicitamente fixado em 'starter'
    const forcesStarterPlan = /plan:\s*['"]starter['"]/.test(signupSrc);
    assert(forcesStarterPlan, 'Força categoricamente o plano inicial como "starter" no objeto input');
  }

  // TEST 6: Rastreabilidade de Origem (source: 'public_signup')
  {
    console.log('\n[TEST 6] Rastreabilidade de origem fixada para "public_signup"');
    const fs = await import('fs');
    const path = await import('path');
    const signupFilePath = path.resolve(process.cwd(), 'api/public/signup.ts');
    const signupSrc = fs.readFileSync(signupFilePath, 'utf-8');

    const forcesPublicSignupSource = /source:\s*['"]public_signup['"]/.test(signupSrc);
    assert(forcesPublicSignupSource, 'Define source: "public_signup" de forma imutável');
  }

  // TEST 7: Delegação Exclusiva ao Provisioning Core
  {
    console.log('\n[TEST 7] Delegação ao Provisioning Core central (reutilização limpa)');
    const fs = await import('fs');
    const path = await import('path');
    const signupFilePath = path.resolve(process.cwd(), 'api/public/signup.ts');
    const signupSrc = fs.readFileSync(signupFilePath, 'utf-8');

    const importsCore = signupSrc.includes("from '../../src/services/tenant/provisioningCore.js'");
    const callsProvisionTenant = signupSrc.includes('provisionTenant(input)');

    assert(importsCore, 'Importa provisionTenant de src/services/tenant/provisioningCore.js');
    assert(callsProvisionTenant, 'Chama provisionTenant(input) com os dados sanitizados');
  }

  // TEST 8: Anti-duplicação de Lógica (Camada Fina de Transporte)
  {
    console.log('\n[TEST 8] Ausência de lógica duplicada de persistência/auth no endpoint');
    const fs = await import('fs');
    const path = await import('path');
    const signupFilePath = path.resolve(process.cwd(), 'api/public/signup.ts');
    const signupSrc = fs.readFileSync(signupFilePath, 'utf-8');

    const hasNoAuthCreateUser = !signupSrc.includes('createUser(');
    const hasNoBatchSet = !signupSrc.includes('batch.set');
    const hasNoBatchCreate = !signupSrc.includes('batch.create');
    const hasNoBatchCommit = !signupSrc.includes('batch.commit');
    const hasNoDeleteUser = !signupSrc.includes('deleteUser');

    assert(hasNoAuthCreateUser, 'Não invoca adminAuth.createUser diretamente');
    assert(hasNoBatchSet && hasNoBatchCreate && hasNoBatchCommit, 'Não manipula batches do Firestore diretamente');
    assert(hasNoDeleteUser, 'Não implementa rollback direto (delegado ao Core)');
  }

  // TEST 9: Mapeamento de Erros de Domínio
  {
    console.log('\n[TEST 9] Mapeamento de erros de domínio do ProvisioningError');
    const fs = await import('fs');
    const path = await import('path');
    const signupFilePath = path.resolve(process.cwd(), 'api/public/signup.ts');
    const signupSrc = fs.readFileSync(signupFilePath, 'utf-8');

    const catchesProvisioningError = signupSrc.includes('err instanceof ProvisioningError');
    const passesStatusCode = signupSrc.includes('sendResponse(res, err.statusCode');
    const passesErrorCode = signupSrc.includes('error: err.code');

    assert(catchesProvisioningError, 'Captura instâncias de ProvisioningError');
    assert(passesStatusCode, 'Propaga o statusCode correto emitido pelo Core (400, 409, 503, etc.)');
    assert(passesErrorCode, 'Retorna o código de erro exato do Core (SLUG_RESERVED, EMAIL_ALREADY_IN_USE, etc.)');
  }

  // TEST 10: Higienização da Resposta (Proteção de Segredos e PII)
  {
    console.log('\n[TEST 10] Higienização de dados na resposta HTTP');
    const fs = await import('fs');
    const path = await import('path');
    const signupFilePath = path.resolve(process.cwd(), 'api/public/signup.ts');
    const signupSrc = fs.readFileSync(signupFilePath, 'utf-8');

    // A resposta deve retornar apenas business e admin higienizados
    const returnsBusinessAndAdminOnly = signupSrc.includes('business: result.business') && signupSrc.includes('admin: result.admin');
    
    // Verifica que sendResponse no fluxo de sucesso 201 não inclui password
    const response201Block = signupSrc.substring(signupSrc.indexOf('sendResponse(res, 201'));
    const response201Body = response201Block.substring(0, response201Block.indexOf('});') + 3);
    const responseNeverExposesPassword = !response201Body.includes('password') && !response201Body.includes('initialPassword');

    assert(returnsBusinessAndAdminOnly, 'Resposta contém apenas metadados públicos e cadastrais de business e admin');
    assert(responseNeverExposesPassword, 'Nunca expõe senha ou credencial no payload de resposta HTTP');
  }

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
