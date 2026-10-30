import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  RulesTestContext,
} from '@firebase/rules-unit-testing';
import { doc, setDoc } from 'firebase/firestore';

export const TEST_PROJECT_ID = 'demo-barber-rules-test';
export const EMULATOR_HOST = '127.0.0.1';
export const EMULATOR_PORT = 8080;

// Garantia absoluta de isolamento em memória
process.env.FIRESTORE_EMULATOR_HOST = `${EMULATOR_HOST}:${EMULATOR_PORT}`;
process.env.GCLOUD_PROJECT = TEST_PROJECT_ID;

export async function createRulesTestEnvironment(): Promise<RulesTestEnvironment> {
  const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
  const rules = fs.readFileSync(rulesPath, 'utf8');

  return await initializeTestEnvironment({
    projectId: TEST_PROJECT_ID,
    firestore: {
      host: EMULATOR_HOST,
      port: EMULATOR_PORT,
      rules,
    },
  });
}

export function getAnonymousContext(testEnv: RulesTestEnvironment): RulesTestContext {
  return testEnv.unauthenticatedContext();
}

export function getAdminContext(
  testEnv: RulesTestEnvironment,
  uid: string,
  businessId: string
): RulesTestContext {
  return testEnv.authenticatedContext(uid, {
    role: 'admin',
    businessId,
  });
}

export function getMasterContext(
  testEnv: RulesTestEnvironment,
  uid: string = 'master-user'
): RulesTestContext {
  return testEnv.authenticatedContext(uid, {
    master: true,
  });
}

export function getUnprivilegedContext(
  testEnv: RulesTestEnvironment,
  uid: string = 'customer-user'
): RulesTestContext {
  return testEnv.authenticatedContext(uid, {});
}

/**
 * Prepara fixtures sintéticas sem PII real usando withSecurityRulesDisabled
 * exclusivamente no projeto de teste demo.
 */
export async function seedTestFixtures(testEnv: RulesTestEnvironment): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    // Empresa A
    await setDoc(doc(db, 'businesses', 'biz-a'), {
      businessId: 'biz-a',
      name: 'Barbearia Alpha Teste',
      description: 'Estabelecimento sintético A',
    });

    // Empresa B
    await setDoc(doc(db, 'businesses', 'biz-b'), {
      businessId: 'biz-b',
      name: 'Barbearia Beta Teste',
      description: 'Estabelecimento sintético B',
    });

    // Catálogo de Serviços (Empresa A)
    await setDoc(doc(db, 'services', 'srv-a1'), {
      businessId: 'biz-a',
      name: 'Corte Cabelo Teste',
      categoryId: 'cat-cabelo',
      price: 45,
      durationMinutes: 30,
      active: true,
    });

    // Profissional da Empresa A
    await setDoc(doc(db, 'professionals', 'pro-a1'), {
      businessId: 'biz-a',
      name: 'Barbeiro Teste A',
      whatsapp: '5511999990001',
      status: 'active',
      serviceMode: 'all',
    });

    // Profissional da Empresa B
    await setDoc(doc(db, 'professionals', 'pro-b1'), {
      businessId: 'biz-b',
      name: 'Barbeiro Teste B',
      whatsapp: '5511999990002',
      status: 'active',
      serviceMode: 'all',
    });

    // Slot e Agendamento confirmados da Empresa A
    await setDoc(doc(db, 'busy_slots', 'slot-a1'), {
      businessId: 'biz-a',
      date: '2026-10-30',
      startTime: '10:00',
      endTime: '10:30',
      status: 'confirmed',
      appointmentId: 'apt-a1',
    });

    await setDoc(doc(db, 'appointments', 'apt-a1'), {
      businessId: 'biz-a',
      customerName: 'Cliente Sintético A',
      customerPhone: '5511988880001',
      date: '2026-10-30',
      startTime: '10:00',
      endTime: '10:30',
      status: 'confirmed',
      totalPrice: 45,
      serviceId: 'srv-a1',
      professionalId: 'pro-a1',
    });

    // Slot e Agendamento confirmados da Empresa B
    await setDoc(doc(db, 'busy_slots', 'slot-b1'), {
      businessId: 'biz-b',
      date: '2026-10-30',
      startTime: '14:00',
      endTime: '14:30',
      status: 'confirmed',
      appointmentId: 'apt-b1',
    });

    await setDoc(doc(db, 'appointments', 'apt-b1'), {
      businessId: 'biz-b',
      customerName: 'Cliente Sintético B',
      customerPhone: '5511988880002',
      date: '2026-10-30',
      startTime: '14:00',
      endTime: '14:30',
      status: 'confirmed',
      totalPrice: 60,
      serviceId: 'srv-b1',
      professionalId: 'pro-b1',
    });
  });
}
