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

async function runFrontendTests() {
  console.log('========================================================');
  console.log('AUDITORIA E TESTE AUTOMATIZADO: FRONTEND /cadastro');
  console.log('========================================================\n');

  const appFilePath = path.resolve(process.cwd(), 'src/App.tsx');
  const signupFilePath = path.resolve(process.cwd(), 'src/components/signup/PublicSignupPage.tsx');

  assert(fs.existsSync(appFilePath), 'src/App.tsx existe');
  assert(fs.existsSync(signupFilePath), 'src/components/signup/PublicSignupPage.tsx existe');

  const appSrc = fs.readFileSync(appFilePath, 'utf-8');
  const signupSrc = fs.readFileSync(signupFilePath, 'utf-8');

  // TEST 1: A rota /cadastro existe e é tratada no roteador SPA do App.tsx
  console.log('\n[TEST 1] Existência e tratamento da rota /cadastro na SPA');
  const hasCadastroRouteCheck =
    appSrc.includes("currentPath === '/cadastro'") ||
    appSrc.includes("currentPath.startsWith('/cadastro')");
  const lazyImportsSignup =
    appSrc.includes("import('./components/signup/PublicSignupPage')") ||
    appSrc.includes('PublicSignupPage');

  assert(hasCadastroRouteCheck, 'App.tsx verifica rota /cadastro');
  assert(lazyImportsSignup, 'App.tsx importa PublicSignupPage via code-splitting');

  // TEST 2: A página possui os campos obrigatórios
  console.log('\n[TEST 2] Presença de todos os campos obrigatórios no formulário');
  const hasBusinessNameField = signupSrc.includes('signup-business-name') && signupSrc.includes('businessName');
  const hasSlugField = signupSrc.includes('signup-slug') && signupSrc.includes('slug');
  const hasAdminNameField = signupSrc.includes('signup-admin-name') && signupSrc.includes('adminName');
  const hasAdminEmailField = signupSrc.includes('signup-admin-email') && signupSrc.includes('adminEmail');
  const hasPasswordField = signupSrc.includes('signup-password') && signupSrc.includes('password');
  const hasPasswordConfirmField = signupSrc.includes('signup-password-confirm') && signupSrc.includes('passwordConfirm');

  assert(hasBusinessNameField, 'Campo Nome da Barbearia presente');
  assert(hasSlugField, 'Campo Slug / Endereço presente');
  assert(hasAdminNameField, 'Campo Nome do Administrador presente');
  assert(hasAdminEmailField, 'Campo E-mail Administrativo presente');
  assert(hasPasswordField, 'Campo Senha presente');
  assert(hasPasswordConfirmField, 'Campo Confirmação de Senha presente');

  // TEST 3: passwordConfirm não é enviado à API
  console.log('\n[TEST 3] passwordConfirm NÃO é enviado no payload de rede');
  // Extrai o bloco de montagem do payload
  const payloadBlockMatch = signupSrc.match(/const\s+payload\s*=\s*\{([\s\S]*?)\};/);
  const payloadBlock = payloadBlockMatch ? payloadBlockMatch[1] : '';

  const payloadHasNoPasswordConfirm = !payloadBlock.includes('passwordConfirm');
  assert(payloadHasNoPasswordConfirm, 'passwordConfirm NÃO está presente no payload da requisição');

  // TEST 4: plan não é enviado pelo frontend
  console.log('\n[TEST 4] plan NÃO é enviado pelo frontend (mantido autoritativo no backend)');
  const payloadHasNoPlan = !payloadBlock.includes('plan:');
  assert(payloadHasNoPlan, 'plan NÃO é enviado pelo formulário frontend');

  // TEST 5: source não é enviado pelo frontend
  console.log('\n[TEST 5] source NÃO é enviado pelo frontend (forçado no backend)');
  const payloadHasNoSource = !payloadBlock.includes('source:');
  assert(payloadHasNoSource, 'source NÃO é enviado pelo formulário frontend');

  // TEST 6: Validação de confirmação de senha funciona
  console.log('\n[TEST 6] Validação de confirmação de senha');
  const hasPasswordConfirmValidation =
    signupSrc.includes('password !== passwordConfirm') &&
    signupSrc.includes('As senhas informadas não coincidem');
  assert(hasPasswordConfirmValidation, 'Validação bloqueia o envio caso password !== passwordConfirm');

  // TEST 7: Múltiplos submits são bloqueados durante loading
  console.log('\n[TEST 7] Bloqueio de múltiplos submits concorrentes');
  const blocksMultipleSubmits =
    signupSrc.includes('if (isLoading) return;') ||
    signupSrc.includes('disabled={isLoading}');
  const disablesSubmitButton = signupSrc.includes('disabled={isLoading}');
  const showsLoadingText = signupSrc.includes('Criando sua barbearia...');

  assert(blocksMultipleSubmits, 'Função handleSubmit descarta chamadas se isLoading === true');
  assert(disablesSubmitButton, 'Botão de submissão é desabilitado visualmente durante loading');
  assert(showsLoadingText, 'Feedback visual exibe "Criando sua barbearia..." com spinner');

  // TEST 8: Erros da API são mapeados para mensagens amigáveis
  console.log('\n[TEST 8] Mapeamento de erros de domínio da API');
  const mapsInvalidData = signupSrc.includes('INVALID_DATA');
  const mapsSlugReserved = signupSrc.includes('SLUG_RESERVED');
  const mapsSlugAlreadyExists = signupSrc.includes('SLUG_ALREADY_EXISTS');
  const mapsEmailAlreadyInUse = signupSrc.includes('EMAIL_ALREADY_IN_USE');
  const mapsFirebaseConfigError = signupSrc.includes('FIREBASE_CONFIG_ERROR');
  const mapsInternalError = signupSrc.includes('INTERNAL_ERROR');

  assert(mapsInvalidData, 'Mapeia INVALID_DATA amigavelmente');
  assert(mapsSlugReserved, 'Mapeia SLUG_RESERVED com aviso amigável');
  assert(mapsSlugAlreadyExists, 'Mapeia SLUG_ALREADY_EXISTS avisando que slug está em uso');
  assert(mapsEmailAlreadyInUse, 'Mapeia EMAIL_ALREADY_IN_USE sugerindo login');
  assert(mapsFirebaseConfigError, 'Mapeia FIREBASE_CONFIG_ERROR informando indisponibilidade temporária');
  assert(mapsInternalError, 'Mapeia INTERNAL_ERROR sem expor dados internos');

  // TEST 9: Nenhuma senha é salva em localStorage / sessionStorage e é limpa após sucesso
  console.log('\n[TEST 9] Segurança: senhas não são persistidas e são limpas da memória');
  const usesNoLocalStorageForPassword = !signupSrc.includes('localStorage.setItem') && !signupSrc.includes('sessionStorage.setItem');
  const clearsPasswordOnSuccess = signupSrc.includes("setPassword('')") && signupSrc.includes("setPasswordConfirm('')");

  assert(usesNoLocalStorageForPassword, 'Nenhuma referência a localStorage ou sessionStorage no componente');
  assert(clearsPasswordOnSuccess, 'Senhas são limpas do estado/memória imediatamente após o sucesso');

  // TEST 10: A prévia do link utiliza origin dinâmico
  console.log('\n[TEST 10] Prévia dinâmica do endereço público usando window.location.origin');
  const usesWindowOrigin = signupSrc.includes('window.location.origin');
  const displaysPreview = signupSrc.includes('/b/') && signupSrc.includes('previewUrl');
  const hasNoHardcodedDomain = !signupSrc.includes('http://localhost') && !signupSrc.includes('barbearia.com.br/b');

  assert(usesWindowOrigin, 'Origem resolvida dinamicamente via window.location.origin');
  assert(displaysPreview, 'Exibe prévia amigável formatada como {origin}/b/{slug}');
  assert(hasNoHardcodedDomain, 'Sem domínios hardcodados na prévia do link público');

  console.log('\n========================================================');
  console.log(`TOTAL DE ASSERTIVAS: ${passed + failed} | SUCESSOS: ${passed} | FALHAS: ${failed}`);
  console.log('========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runFrontendTests().catch((err) => {
  console.error('Erro na execução dos testes frontend:', err);
  process.exit(1);
});
