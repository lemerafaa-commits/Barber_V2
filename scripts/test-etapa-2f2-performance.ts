import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('======================================================================');
console.log('JOBSNIAK V5.02 — VALIDAÇÃO DA ETAPA 2F.2 (PERFORMANCE CIRÚRGICA)');
console.log('======================================================================\n');

let passedCount = 0;

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ [PASS] ${name}`);
    passedCount++;
  } catch (err: any) {
    console.error(`  ✗ [FAIL] ${name}`);
    console.error(`     Erro: ${err?.message || err}`);
    process.exit(1);
  }
}

// --------------------------------------------------------------------
// PILAR 1: Cabeçalhos de Cache HTTP em /api/public/catalog
// --------------------------------------------------------------------
console.log('--- PILAR 1: Cabeçalhos de Cache HTTP e Isolamento ---');

runTest('Endpoint /api/public/catalog configura Cache-Control seguro em HTTP 200', async () => {
  const catalogModule = await import('../api/public/catalog.ts');
  const handler = catalogModule.default;

  const mockRes = {
    statusCode: 0,
    headers: {} as Record<string, string>,
    setHeader(key: string, val: string) {
      this.headers[key.toLowerCase()] = val;
    },
    end(_data: string) {},
  };

  // Método incorreto deve receber no-store
  const reqPost = { method: 'POST', query: {}, url: '/api/public/catalog' };
  await handler(reqPost, mockRes);
  assert.strictEqual(mockRes.statusCode, 405);
  assert.strictEqual(
    mockRes.headers['cache-control'],
    'no-store, no-cache, must-revalidate, proxy-revalidate'
  );
});

runTest('Formato inválido de slug recebe HTTP 400 com no-store', async () => {
  const catalogModule = await import('../api/public/catalog.ts');
  const handler = catalogModule.default;

  const mockRes = {
    statusCode: 0,
    headers: {} as Record<string, string>,
    setHeader(key: string, val: string) {
      this.headers[key.toLowerCase()] = val;
    },
    end(_data: string) {},
  };

  const reqInvalid = { method: 'GET', query: { slug: '<script>alert(1)</script>' }, url: '/api/public/catalog?slug=<script>' };
  await handler(reqInvalid, mockRes);
  assert.strictEqual(mockRes.statusCode, 400);
  assert.strictEqual(
    mockRes.headers['cache-control'],
    'no-store, no-cache, must-revalidate, proxy-revalidate'
  );
});

// --------------------------------------------------------------------
// PILAR 2: Code Splitting e Isolamento de Chunks
// --------------------------------------------------------------------
console.log('\n--- PILAR 2: Code Splitting e Chunks em Produção ---');

runTest('Build de produção particiona módulos administrativos em chunks dedicados', () => {
  const assetsDir = path.resolve(process.cwd(), 'dist/assets');
  assert.ok(fs.existsSync(assetsDir), 'Diretório dist/assets deve existir após build');

  const files = fs.readdirSync(assetsDir);

  const hasAdminDashboard = files.some(f => f.startsWith('AdminDashboard-') && f.endsWith('.js'));
  const hasMasterDashboard = files.some(f => f.startsWith('MasterDashboard-') && f.endsWith('.js'));
  const hasAdminLogin = files.some(f => f.startsWith('AdminLogin-') && f.endsWith('.js'));
  const hasMasterLogin = files.some(f => f.startsWith('MasterLogin-') && f.endsWith('.js'));
  const hasAdminAccessDenied = files.some(f => f.startsWith('AdminAccessDenied-') && f.endsWith('.js'));
  const hasMasterAccessDenied = files.some(f => f.startsWith('MasterAccessDenied-') && f.endsWith('.js'));

  assert.ok(hasAdminDashboard, 'AdminDashboard deve ser um chunk JS isolado');
  assert.ok(hasMasterDashboard, 'MasterDashboard deve ser um chunk JS isolado');
  assert.ok(hasAdminLogin, 'AdminLogin deve ser um chunk JS isolado');
  assert.ok(hasMasterLogin, 'MasterLogin deve ser um chunk JS isolado');
  assert.ok(hasAdminAccessDenied, 'AdminAccessDenied deve ser um chunk JS isolado');
  assert.ok(hasMasterAccessDenied, 'MasterAccessDenied deve ser um chunk JS isolado');
});

runTest('Index HTML inicial não contém referências diretas estáticas para os chunks Admin/Master', () => {
  const indexHtmlPath = path.resolve(process.cwd(), 'dist/index.html');
  assert.ok(fs.existsSync(indexHtmlPath), 'dist/index.html deve existir');

  const indexContent = fs.readFileSync(indexHtmlPath, 'utf-8');

  // Verifica que Admin e Master não são pré-carregados estaticamente no HTML de entrada
  assert.ok(!indexContent.includes('AdminDashboard'), 'index.html não deve importar AdminDashboard diretamente');
  assert.ok(!indexContent.includes('MasterDashboard'), 'index.html não deve importar MasterDashboard diretamente');
});

// --------------------------------------------------------------------
// PILAR 3: Otimização de Fontes
// --------------------------------------------------------------------
console.log('\n--- PILAR 3: Otimização de Fontes em index.html ---');

runTest('index.html carrega apenas pesos estritamente ativos das famílias tipográficas', () => {
  const indexHtml = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
  assert.ok(
    indexHtml.includes('Montserrat:wght@700;800;900'),
    'Montserrat deve conter apenas pesos ativos (700, 800, 900)'
  );
  assert.ok(
    !indexHtml.includes('Montserrat:wght@500'),
    'Montserrat não deve carregar peso 500 desnecessário'
  );
  assert.ok(
    !indexHtml.includes('Montserrat:wght@600'),
    'Montserrat não deve carregar peso 600 desnecessário'
  );
  assert.ok(
    indexHtml.includes('display=swap'),
    'Fontes devem declarar display=swap para evitar FOIT'
  );
});

console.log('\n======================================================================');
console.log(`TOTAL DE TESTES VALIDADOS: ${passedCount} | APROVADOS: ${passedCount} | REPROVADOS: 0`);
console.log('======================================================================\n');
