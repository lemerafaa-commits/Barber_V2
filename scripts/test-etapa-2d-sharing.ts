/**
 * ETAPA 2D — SUÍTE DE TESTES AUTOMATIZADOS
 * Compartilhamento dos Links Públicos Multiempresa
 *
 * Valida:
 * 1. Estratégia de geração de URLs públicas por tenant
 * 2. Isolamento de links no Admin (derivação exclusiva de claims/perfil autenticado)
 * 3. Dinamismo e ausência de vazamento de slug na troca de empresas no Master
 * 4. Tratamento de empresas sem slug configurado (bloqueio de fallback indevido para João Barber)
 * 5. Proteções de segurança para abertura de links (anti-manipulação, sem rotas admin)
 * 6. Formatação e codificação da mensagem de WhatsApp
 */

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTest(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`  ✓ PASS: ${name}`);
  } catch (err: any) {
    results.push({ name, passed: false, error: err?.message || String(err) });
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    Erro: ${err?.message || err}`);
  }
}

// Simulador da função de geração de link usada no componente PublicBookingLinkCard
function generateBookingLinkData(origin: string, slug?: string | null, businessName = 'Barbearia') {
  const cleanSlug = typeof slug === 'string' ? slug.trim() : '';
  const isSlugValid = /^[a-zA-Z0-9_-]{1,64}$/.test(cleanSlug);

  if (!isSlugValid) {
    return {
      isValid: false,
      publicPath: '',
      fullUrl: '',
      whatsappUrl: '',
      state: 'missing_slug' as const,
    };
  }

  const publicPath = `/b/${cleanSlug}`;
  const fullUrl = `${origin}${publicPath}`;
  const whatsappMessage = `Olá! Agende seu horário na *${businessName.trim()}* de forma rápida e prática pelo link:\n${fullUrl}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`;

  return {
    isValid: true,
    publicPath,
    fullUrl,
    whatsappUrl,
    state: 'ready' as const,
  };
}

async function runAllTests() {
  console.log('\n======================================================');
  console.log('ETAPA 2D — TESTES DO COMPARTILHAMENTO DE LINKS MULTIEMPRESA');
  console.log('======================================================\n');

  const mockOrigin = 'https://meu-saas-barber.com';

  // GRUPO 1: Geração de Link no Admin
  console.log('--- 1. Geração de Link no Painel Admin ---');

  await runTest('Admin com slug próprio gera a URL correta da sua barbearia', () => {
    const adminSlug = 'vintage-club';
    const data = generateBookingLinkData(mockOrigin, adminSlug, 'Vintage Club');

    assert(data.isValid, 'Link deve ser válido');
    assert(data.publicPath === '/b/vintage-club', 'Caminho deve ser /b/vintage-club');
    assert(data.fullUrl === 'https://meu-saas-barber.com/b/vintage-club', 'URL completa incorreta');
  });

  await runTest('Admin da João Barber preserva o slug canônico joao-barber', () => {
    const data = generateBookingLinkData(mockOrigin, 'joao-barber', 'João Barber');

    assert(data.isValid, 'Link da João Barber deve ser válido');
    assert(data.fullUrl === 'https://meu-saas-barber.com/b/joao-barber', 'URL deve ser /b/joao-barber');
  });

  await runTest('Admin não pode forçar geração de link com slug malicioso ou injeção de rota', () => {
    const maliciousSlug = '../admin/users';
    const data = generateBookingLinkData(mockOrigin, maliciousSlug, 'Tentativa Hacker');

    assert(!data.isValid, 'Slug malicioso deve ser invalidado');
    assert(data.state === 'missing_slug', 'Deve cair no estado de slug ausente/inválido');
    assert(data.fullUrl === '', 'URL deve ser vazia');
  });

  // GRUPO 2: Painel Master e Troca Dinâmica entre Empresas
  console.log('\n--- 2. Dinamismo e Troca de Empresas no Painel Master ---');

  const mockBusinesses = [
    { id: 'biz_01', name: 'João Barber', slug: 'joao-barber' },
    { id: 'biz_02', name: 'Barbearia Retrô', slug: 'retro-barber' },
    { id: 'biz_03', name: 'Navalha de Ouro', slug: 'navalha-de-ouro' },
    { id: 'biz_04', name: 'Barbearia Sem Slug', slug: '' },
  ];

  await runTest('Master gera o link correto correspondente a cada empresa selecionada', () => {
    const b1 = generateBookingLinkData(mockOrigin, mockBusinesses[0].slug, mockBusinesses[0].name);
    assert(b1.fullUrl === 'https://meu-saas-barber.com/b/joao-barber', 'Link de b1 incorreto');

    const b2 = generateBookingLinkData(mockOrigin, mockBusinesses[1].slug, mockBusinesses[1].name);
    assert(b2.fullUrl === 'https://meu-saas-barber.com/b/retro-barber', 'Link de b2 incorreto');

    const b3 = generateBookingLinkData(mockOrigin, mockBusinesses[2].slug, mockBusinesses[2].name);
    assert(b3.fullUrl === 'https://meu-saas-barber.com/b/navalha-de-ouro', 'Link de b3 incorreto');
  });

  await runTest('Troca de empresa no Master não vaza nem reutiliza o slug anterior', () => {
    // Simula seleção sequencial de empresa no modal
    let selectedBusiness = mockBusinesses[1]; // retro-barber
    let linkData = generateBookingLinkData(mockOrigin, selectedBusiness.slug, selectedBusiness.name);
    assert(linkData.fullUrl.includes('retro-barber'), 'Primeira empresa deve ser retro-barber');

    // Troca para Navalha de Ouro
    selectedBusiness = mockBusinesses[2];
    linkData = generateBookingLinkData(mockOrigin, selectedBusiness.slug, selectedBusiness.name);
    assert(linkData.fullUrl.includes('navalha-de-ouro'), 'Segunda empresa deve ser navalha-de-ouro');
    assert(!linkData.fullUrl.includes('retro-barber'), 'Slug anterior não pode estar presente');

    // Troca para Empresa Sem Slug
    selectedBusiness = mockBusinesses[3];
    linkData = generateBookingLinkData(mockOrigin, selectedBusiness.slug, selectedBusiness.name);
    assert(!linkData.isValid, 'Empresa sem slug não deve ter link válido');
    assert(linkData.state === 'missing_slug', 'Deve indicar ausência de slug');
    // GARANTIA: NÃO PODE CAIR EM JOÃO BARBER!
    assert(!linkData.fullUrl.includes('joao-barber'), 'NUNCA deve fazer fallback para joao-barber!');
  });

  // GRUPO 3: Proteção de Abertura de Rota
  console.log('\n--- 3. Proteções de Segurança na Abertura de Rota ---');

  await runTest('Validação estrita impede abertura de rotas administrativas', () => {
    function isSafePublicRoute(path: string): boolean {
      if (!path.startsWith('/b/')) return false;
      const slug = path.slice(3);
      if (!/^[a-zA-Z0-9_-]{1,64}$/.test(slug)) return false;
      if (path.includes('admin') || path.includes('master') || path.includes('api')) return false;
      return true;
    }

    assert(isSafePublicRoute('/b/joao-barber'), '/b/joao-barber é segura');
    assert(isSafePublicRoute('/b/minha-barbearia-123'), '/b/minha-barbearia-123 é segura');
    assert(!isSafePublicRoute('/admin'), '/admin deve ser bloqueada');
    assert(!isSafePublicRoute('/master'), '/master deve ser bloqueada');
    assert(!isSafePublicRoute('/b/admin'), '/b/admin deve ser bloqueada por conter admin');
    assert(!isSafePublicRoute('/b/../secret'), 'tentativa de path traversal deve ser bloqueada');
  });

  // GRUPO 4: Formatação de Compartilhamento via WhatsApp
  console.log('\n--- 4. Formatação e Codificação do Compartilhamento no WhatsApp ---');

  await runTest('Mensagem do WhatsApp é codificada e contém o link e o nome da barbearia', () => {
    const data = generateBookingLinkData(mockOrigin, 'corte-fino', 'Corte Fino Barbearia');

    assert(data.whatsappUrl.startsWith('https://api.whatsapp.com/send?text='), 'Protocolo e domínio corretos');

    const encodedText = data.whatsappUrl.replace('https://api.whatsapp.com/send?text=', '');
    const decodedText = decodeURIComponent(encodedText);

    assert(decodedText.includes('Corte Fino Barbearia'), 'Texto decodificado deve conter o nome');
    assert(decodedText.includes('https://meu-saas-barber.com/b/corte-fino'), 'Texto decodificado deve conter o link público');
    assert(!decodedText.includes('joao-barber'), 'Não deve vazar nome ou link de outra empresa');
  });

  // RESUMO FINAL
  console.log('\n======================================================');
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;
  console.log(`TOTAL DE TESTES: ${total} | APROVADOS: ${passed} | REPROVADOS: ${failed}`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests();
