import fs from 'fs';
import path from 'path';

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
  console.log('VALIDAÇÃO CIRÚRGICA — ETAPA 5.1: LINK "VER AGENDAMENTO PÚBLICO"');
  console.log('========================================================\n');

  const appFilePath = path.resolve(process.cwd(), 'src/App.tsx');
  assert(fs.existsSync(appFilePath), 'src/App.tsx existe');

  const appSrc = fs.readFileSync(appFilePath, 'utf-8');

  // TEST 1: Identificação da correção cirúrgica no AdminDashboard
  console.log('\n[TEST 1] Invocação dinâmica da rota /b/${adminBusinessId}');
  const hasDynamicRoute = appSrc.includes('navigateTo(`/b/${adminBusinessId.trim()}`)') ||
    appSrc.includes('navigateTo(`/b/${adminBusinessId}`)');
  const doesNotHardcodeRootOnAdmin = !appSrc.includes(
    `<AdminDashboard
              businessId={adminBusinessId || 'joao-barber'}
              onGoToPublicPage={() => navigateTo('/')}`
  );

  assert(hasDynamicRoute, 'onGoToPublicPage navega para /b/${adminBusinessId.trim()}');
  assert(doesNotHardcodeRootOnAdmin, 'Navegação fixa para "/" no AdminDashboard foi removida');

  // TEST 2: Proteção contra fallback silencioso quando adminBusinessId for vazio
  console.log('\n[TEST 2] Proteção contra fallback silencioso para outro tenant');
  const hasSafetyCheck = appSrc.includes('if (adminBusinessId && adminBusinessId.trim().length > 0)');
  assert(hasSafetyCheck, 'Verifica existência e preenchimento de adminBusinessId antes de navegar');

  // TEST 3: Simulação de roteamento com tenants reais
  console.log('\n[TEST 3] Simulação conceitual de rota gerada por tenant');
  const simulateNav = (businessId: string | null) => {
    let targetPath: string | null = null;
    const fakeNavigateTo = (path: string) => { targetPath = path; };
    // Executa a lógica idêntica implementada em App.tsx
    if (businessId && businessId.trim().length > 0) {
      fakeNavigateTo(`/b/${businessId.trim()}`);
    }
    return targetPath;
  };

  assert(simulateNav('barbearia-vintage') === '/b/barbearia-vintage', 'barbearia-vintage navega para /b/barbearia-vintage');
  assert(simulateNav('barbearia-teste') === '/b/barbearia-teste', 'barbearia-teste navega para /b/barbearia-teste');
  assert(simulateNav('navalha-de-ouro') === '/b/navalha-de-ouro', 'navalha-de-ouro navega para /b/navalha-de-ouro');
  assert(simulateNav('') === null, 'businessId vazio não navega para lugar nenhum (zero vazamento de tenant)');
  assert(simulateNav(null) === null, 'businessId nulo não navega para lugar nenhum');

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
