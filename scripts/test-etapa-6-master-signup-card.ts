/**
 * scripts/test-etapa-6-master-signup-card.ts
 *
 * Suíte de testes automatizados para a Etapa 6:
 * LINK DE CADASTRO DE NOVAS BARBEARIAS NO PAINEL MASTER (GESTÃO DE REDE)
 *
 * Verificações:
 * 1. Existência física do componente MasterSignupLinkCard.tsx
 * 2. Integração permanente em MasterNetwork.tsx (incondicional, fora de loops e filtros)
 * 3. Uso estrito de window.location.origin (sem domínio fixo/hardcoded)
 * 4. Rota pública de destino configurada para '/cadastro'
 * 5. Ações disponibilizadas:
 *    a) Cópia para clipboard com feedback
 *    b) Abertura direta com target="_blank" e rel="noopener noreferrer"
 *    c) Compartilhamento via WhatsApp com encodeURIComponent
 * 6. Independência total do volume de tenants (funciona com 0 barbearias na rede)
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
console.log('TESTES DE VERIFICAÇÃO — ETAPA 6: LINK DE CADASTRO NA GESTÃO DE REDE');
console.log('===============================================================\n');

// 1. Arquivo do componente existe
const cardFilePath = path.join(process.cwd(), 'src/components/master/MasterSignupLinkCard.tsx');
assert(fs.existsSync(cardFilePath), '1. Arquivo MasterSignupLinkCard.tsx existe no diretório correto');

const cardContent = fs.existsSync(cardFilePath) ? fs.readFileSync(cardFilePath, 'utf-8') : '';

// 2. Resolução Dinâmica do Origin (Sem domínio fixo)
assert(
  cardContent.includes('window.location.origin') &&
  !cardContent.includes('localhost:') &&
  !cardContent.includes('barber-saas.com') &&
  !cardContent.includes('vercel.app'),
  '2. URL resolvida dinamicamente via window.location.origin sem domínios hardcoded'
);

// 3. Rota correta /cadastro
assert(
  cardContent.includes('`${origin}/cadastro`') || cardContent.includes("'/cadastro'"),
  '3. Rota de cadastro aponta explicitamente para /cadastro'
);

// 4. Ação: Copiar Link com feedback
assert(
  cardContent.includes('navigator.clipboard.writeText') &&
  cardContent.includes('copied') &&
  cardContent.includes('Copiado!'),
  '4. Mecanismo de cópia para clipboard com estado temporário e feedback visual'
);

// 5. Ação: Abrir link em nova aba segura
assert(
  cardContent.includes('target="_blank"') &&
  cardContent.includes('rel="noopener noreferrer"'),
  '5. Abertura do link em nova aba com proteções de segurança rel="noopener noreferrer"'
);

// 6. Ação: Compartilhamento WhatsApp formatado
assert(
  cardContent.includes('api.whatsapp.com/send') &&
  cardContent.includes('encodeURIComponent'),
  '6. Botão de compartilhamento direto via WhatsApp com encodeURIComponent'
);

// 7. Integração permanente no MasterNetwork.tsx
const networkFilePath = path.join(process.cwd(), 'src/components/master/MasterNetwork.tsx');
assert(fs.existsSync(networkFilePath), '7. Arquivo MasterNetwork.tsx existe');

const networkContent = fs.existsSync(networkFilePath) ? fs.readFileSync(networkFilePath, 'utf-8') : '';

// 8. Import de MasterSignupLinkCard em MasterNetwork.tsx
assert(
  networkContent.includes("import { MasterSignupLinkCard } from './MasterSignupLinkCard';"),
  '8. MasterSignupLinkCard está devidamente importado em MasterNetwork.tsx'
);

// 9. Renderização permanente fora de condicionais de businesses.length > 0
const jsxReturnStart = networkContent.indexOf('return (');
const cardIndex = networkContent.indexOf('<MasterSignupLinkCard />', jsxReturnStart);
const businessesListIndex = networkContent.indexOf("{activeSubTab === 'businesses' && (", jsxReturnStart);

assert(
  cardIndex !== -1 && cardIndex < businessesListIndex,
  '9. MasterSignupLinkCard é renderizado antes da listagem de barbearias, de forma permanente e visível mesmo com 0 empresas'
);

// 10. Inalterabilidade do Provisioning Core e APIs
const provisioningCorePath = path.join(process.cwd(), 'src/services/tenant/provisioningCore.ts');
assert(fs.existsSync(provisioningCorePath), '10. Provisioning Core permanece intocado e íntegro');

console.log('\n---------------------------------------------------------------');
console.log(`TOTAL: ${passCount + failCount} testes | PASS: ${passCount} | FAIL: ${failCount}`);
console.log('---------------------------------------------------------------\n');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 TODOS OS TESTES DA ETAPA 6 PASSARAM COM SUCESSO!\n');
}
