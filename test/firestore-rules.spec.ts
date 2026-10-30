import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertSucceeds,
  assertFails,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  createRulesTestEnvironment,
  seedTestFixtures,
  getAnonymousContext,
  getAdminContext,
  getMasterContext,
  TEST_PROJECT_ID,
} from './test-helpers';

describe('JOBSNIAK V5 — Bateria de Testes Unitários de Segurança (Firestore Rules)', () => {
  let testEnv: RulesTestEnvironment;

  before(async () => {
    // Inicialização do ambiente de regras com projeto estritamente demo
    testEnv = await createRulesTestEnvironment();
  });

  after(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async () => {
    // Reset e povoamento de fixtures sintéticas antes de cada teste
    await testEnv.clearFirestore();
    await seedTestFixtures(testEnv);
  });

  // 1. Usuário anônimo pode ler busy_slots
  it('1. Permite leitura pública de busy_slots para cálculo anônimo de horários livres', async () => {
    const anon = getAnonymousContext(testEnv);
    const slotDoc = doc(anon.firestore(), 'busy_slots', 'slot-a1');
    await assertSucceeds(getDoc(slotDoc));
  });

  // 2. Usuário anônimo não pode ler appointments
  it('2. Bloqueia leitura de appointments para usuários anônimos (Zero PII leak)', async () => {
    const anon = getAnonymousContext(testEnv);
    const aptDoc = doc(anon.firestore(), 'appointments', 'apt-a1');
    await assertFails(getDoc(aptDoc));
  });

  // 3. Criação direta de appointments é negada
  it('3. Bloqueia criação direta de appointments pelo Web SDK (exclusividade do backend transacional)', async () => {
    const anon = getAnonymousContext(testEnv);
    const adminA = getAdminContext(testEnv, 'admin-a', 'biz-a');

    await assertFails(
      setDoc(doc(anon.firestore(), 'appointments', 'apt-new-anon'), {
        businessId: 'biz-a',
        customerName: 'Tentativa Invasora',
        status: 'confirmed',
      })
    );

    await assertFails(
      setDoc(doc(adminA.firestore(), 'appointments', 'apt-new-admin'), {
        businessId: 'biz-a',
        customerName: 'Tentativa Direta Admin',
        status: 'confirmed',
      })
    );
  });

  // 4. Criação direta de busy_slots é negada
  it('4. Bloqueia criação direta de busy_slots pelo Web SDK (gerenciado apenas pelo backend)', async () => {
    const anon = getAnonymousContext(testEnv);
    const adminA = getAdminContext(testEnv, 'admin-a', 'biz-a');

    await assertFails(
      setDoc(doc(anon.firestore(), 'busy_slots', 'slot-new-anon'), {
        businessId: 'biz-a',
        date: '2026-10-31',
        startTime: '11:00',
        endTime: '11:30',
        status: 'confirmed',
      })
    );

    await assertFails(
      setDoc(doc(adminA.firestore(), 'busy_slots', 'slot-new-admin'), {
        businessId: 'biz-a',
        date: '2026-10-31',
        startTime: '11:00',
        endTime: '11:30',
        status: 'confirmed',
      })
    );
  });

  // 5. Admin da Empresa A pode ler documentos da Empresa A
  it('5. Permite ao Admin da Empresa A ler agendamentos da respectiva empresa', async () => {
    const adminA = getAdminContext(testEnv, 'admin-a', 'biz-a');
    const aptDoc = doc(adminA.firestore(), 'appointments', 'apt-a1');
    const snap = await assertSucceeds(getDoc(aptDoc));
    assert.equal(snap.data()?.businessId, 'biz-a');
  });

  // 6. Admin da Empresa B não pode ler documentos da Empresa A
  it('6. Bloqueia o Admin da Empresa B de acessar agendamentos da Empresa A (Isolamento Multi-tenant)', async () => {
    const adminB = getAdminContext(testEnv, 'admin-b', 'biz-b');
    const aptDocA = doc(adminB.firestore(), 'appointments', 'apt-a1');
    await assertFails(getDoc(aptDocA));
  });

  // 7. Master com claim master: true pode ler documentos de ambas as empresas
  it('7. Permite ao usuário Master com claim master: true auditar agendamentos de ambas as empresas', async () => {
    const master = getMasterContext(testEnv, 'master-operator');
    const aptDocA = doc(master.firestore(), 'appointments', 'apt-a1');
    const aptDocB = doc(master.firestore(), 'appointments', 'apt-b1');

    await assertSucceeds(getDoc(aptDocA));
    await assertSucceeds(getDoc(aptDocB));
  });

  // 8. Admin autorizado pode concluir atomicamente um atendimento
  it('8. Permite conclusão atômica por writeBatch (status confirmed -> completed) pelo Admin da empresa', async () => {
    const adminA = getAdminContext(testEnv, 'admin-a', 'biz-a');
    const dbA = adminA.firestore();
    const aptRef = doc(dbA, 'appointments', 'apt-a1');
    const slotRef = doc(dbA, 'busy_slots', 'slot-a1');

    const batch = writeBatch(dbA);
    batch.update(aptRef, { status: 'completed' });
    batch.update(slotRef, { status: 'completed' });

    await assertSucceeds(batch.commit());

    // Verificação do estado final dos dois documentos
    const aptSnap = await getDoc(aptRef);
    const slotSnap = await getDoc(slotRef);
    assert.equal(aptSnap.data()?.status, 'completed');
    assert.equal(slotSnap.data()?.status, 'completed');
  });

  // 9. Alterar totalPrice, customerName ou businessId durante a conclusão é negado
  it('9. Bloqueia alteração indevida de campos de negócio (totalPrice, customerName, businessId) na conclusão', async () => {
    const adminA = getAdminContext(testEnv, 'admin-a', 'biz-a');
    const dbA = adminA.firestore();
    const aptRef = doc(dbA, 'appointments', 'apt-a1');

    // Tentativa de alterar valor financeiro junto com a conclusão
    await assertFails(
      updateDoc(aptRef, {
        status: 'completed',
        totalPrice: 999,
      })
    );

    // Tentativa de adulterar o nome do cliente
    await assertFails(
      updateDoc(aptRef, {
        status: 'completed',
        customerName: 'Fraude no Nome',
      })
    );

    // Tentativa de transferir o agendamento para outra empresa
    await assertFails(
      updateDoc(aptRef, {
        status: 'completed',
        businessId: 'biz-b',
      })
    );
  });

  // 10. Admin de outra empresa não pode concluir o atendimento
  it('10. Bloqueia Admin de empresa concorrente (Empresa B) de concluir agendamento da Empresa A', async () => {
    const adminB = getAdminContext(testEnv, 'admin-b', 'biz-b');
    const dbB = adminB.firestore();
    const aptRefA = doc(dbB, 'appointments', 'apt-a1');
    const slotRefA = doc(dbB, 'busy_slots', 'slot-a1');

    const batch = writeBatch(dbB);
    batch.update(aptRefA, { status: 'completed' });
    batch.update(slotRefA, { status: 'completed' });

    await assertFails(batch.commit());
  });

  // 11. Exclusão direta de agendamento é negada, inclusive para Master
  it('11. Bloqueia exclusão física de agendamentos para Admin e para Master (imutabilidade de registros)', async () => {
    const adminA = getAdminContext(testEnv, 'admin-a', 'biz-a');
    const master = getMasterContext(testEnv, 'master-operator');

    await assertFails(deleteDoc(doc(adminA.firestore(), 'appointments', 'apt-a1')));
    await assertFails(deleteDoc(doc(master.firestore(), 'appointments', 'apt-a1')));
  });

  // 12. Leitura anônima de professionals é negada
  it('12. Bloqueia leitura anônima de professionals (proteção de contatos e equipe)', async () => {
    const anon = getAnonymousContext(testEnv);
    const proDoc = doc(anon.firestore(), 'professionals', 'pro-a1');
    await assertFails(getDoc(proDoc));
  });

  // 13. Admin autorizado pode ler professionals da própria empresa
  it('13. Permite ao Admin da Empresa A ler profissionais de sua barbearia e bloqueia Admin da Empresa B', async () => {
    const adminA = getAdminContext(testEnv, 'admin-a', 'biz-a');
    const adminB = getAdminContext(testEnv, 'admin-b', 'biz-b');

    // Admin A pode ler pro-a1
    await assertSucceeds(getDoc(doc(adminA.firestore(), 'professionals', 'pro-a1')));

    // Admin B é bloqueado ao tentar ler pro-a1
    await assertFails(getDoc(doc(adminB.firestore(), 'professionals', 'pro-a1')));
  });

  // 14. Leitura pública de services é permitida
  it('14. Permite leitura pública e anônima do catálogo de serviços', async () => {
    const anon = getAnonymousContext(testEnv);
    const srvDoc = doc(anon.firestore(), 'services', 'srv-a1');
    const snap = await assertSucceeds(getDoc(srvDoc));
    assert.equal(snap.data()?.name, 'Corte Cabelo Teste');
  });

  // 15. Coleções ou documentos sem permissão explícita são negados (default deny)
  it('15. Aplica Default Deny absoluto para coleções ou caminhos não autorizados', async () => {
    const anon = getAnonymousContext(testEnv);
    const adminA = getAdminContext(testEnv, 'admin-a', 'biz-a');
    const master = getMasterContext(testEnv, 'master-operator');

    // Leitura anônima em rota inexistente
    await assertFails(getDoc(doc(anon.firestore(), 'internal_audit_logs', 'entry-1')));

    // Gravação arbitrária de admin em coleção não permitida
    await assertFails(
      setDoc(doc(adminA.firestore(), 'system_config', 'flag-1'), {
        maintenance: true,
      })
    );

    // Leitura arbitrária até mesmo para Master
    await assertFails(getDoc(doc(master.firestore(), 'root_secrets', 'secret-1')));
  });
});
