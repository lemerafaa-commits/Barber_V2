import { getAdminFirestore, getAdminAuth } from '../firebase/serverDb.js';

/**
 * Slugs reservados do sistema que não podem ser utilizados por barbearias
 * para evitar colisão de rotas no roteamento público e administrativo.
 */
export const RESERVED_SLUGS = new Set([
  'admin',
  'master',
  'api',
  'public',
  'login',
  'b',
  'static',
  'assets',
  'dashboard',
  'auth',
  'app',
  'system',
  'root',
  'superadmin',
  'joao-barber-admin',
]);

export interface ProvisionTenantInput {
  businessName: string;
  slug: string;
  adminName: string;
  adminEmail: string;
  initialPassword: string;
  adminPhone?: string;
  plan?: 'starter' | 'pro' | 'enterprise';
  source?: 'master' | 'public_signup';
}

export interface ProvisionTenantResult {
  business: {
    id: string;
    name: string;
    slug: string;
    status: 'active';
    plan: 'starter' | 'pro' | 'enterprise';
  };
  admin: {
    uid: string;
    email: string;
    name: string;
  };
  message: string;
}

export type ProvisioningErrorCode =
  | 'INVALID_DATA'
  | 'SLUG_RESERVED'
  | 'SLUG_ALREADY_EXISTS'
  | 'EMAIL_ALREADY_IN_USE'
  | 'FIREBASE_CONFIG_ERROR'
  | 'INTERNAL_ERROR';

export class ProvisioningError extends Error {
  constructor(
    public readonly code: ProvisioningErrorCode,
    message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = 'ProvisioningError';
  }
}

/**
 * Normaliza e valida o formato do slug de URL.
 * Aceita: letras minúsculas, números, hifens e sublinhados (3 a 64 caracteres).
 * Não pode iniciar nem terminar com hífen ou sublinhado.
 */
export function validateAndNormalizeSlug(
  rawSlug: any
): { valid: boolean; slug: string; reason?: string } {
  if (typeof rawSlug !== 'string') {
    return { valid: false, slug: '', reason: 'Slug deve ser uma string de texto.' };
  }

  const slug = rawSlug.trim().toLowerCase();

  if (slug.length < 3 || slug.length > 64) {
    return { valid: false, slug, reason: 'Slug deve conter entre 3 e 64 caracteres.' };
  }

  if (!/^[a-z0-9][a-z0-9_-]*[a-z0-9]$/.test(slug)) {
    return {
      valid: false,
      slug,
      reason:
        'Slug deve conter apenas letras minúsculas, números, hifens ou sublinhados, sem espaços e sem iniciar/terminar com caracteres especiais.',
    };
  }

  if (RESERVED_SLUGS.has(slug)) {
    return {
      valid: false,
      slug,
      reason: 'Este identificador de endereço é reservado para uso do sistema.',
    };
  }

  return { valid: true, slug };
}

/**
 * PROVISIONING CORE — FONTE ÚNICA DA VERDADE
 *
 * Executa o provisionamento atômico e completo de uma nova barbearia (tenant):
 * 1. Validações sintáticas e de domínio;
 * 2. Validação e normalização de slug contra RESERVED_SLUGS;
 * 3. Pre-flight de unicidade (Firestore slug e Auth email);
 * 4. Criação do usuário no Firebase Authentication;
 * 5. Injeção de Custom Claims ({ role: 'admin', businessId: slug });
 * 6. Montagem de businessDoc com city e state no nível superior e address;
 * 7. Semente inicial (seed) de 3 serviços essenciais e 1 profissional ativo;
 * 8. Commit atômico do lote usando batch.create() no documento principal para proteção contra race conditions;
 * 9. Mecanismo de compensação/rollback: exclui o usuário Auth em caso de falha de persistência.
 */
export async function provisionTenant(
  input: ProvisionTenantInput
): Promise<ProvisionTenantResult> {
  const {
    businessName,
    slug: rawSlug,
    adminName,
    adminEmail,
    initialPassword,
    adminPhone,
    plan = 'starter',
    source = 'master',
  } = input || {};

  // 1. Validações de entrada
  if (!businessName || typeof businessName !== 'string' || businessName.trim().length < 2) {
    throw new ProvisioningError(
      'INVALID_DATA',
      'Nome da barbearia é obrigatório (mínimo de 2 caracteres).',
      400
    );
  }

  const slugValidation = validateAndNormalizeSlug(rawSlug);
  if (!slugValidation.valid) {
    const isReserved = slugValidation.reason?.includes('reservado');
    throw new ProvisioningError(
      isReserved ? 'SLUG_RESERVED' : 'INVALID_DATA',
      slugValidation.reason || 'Slug inválido.',
      400
    );
  }
  const cleanSlug = slugValidation.slug;

  if (!adminName || typeof adminName !== 'string' || adminName.trim().length < 2) {
    throw new ProvisioningError(
      'INVALID_DATA',
      'Nome do administrador é obrigatório (mínimo de 2 caracteres).',
      400
    );
  }

  if (
    !adminEmail ||
    typeof adminEmail !== 'string' ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail.trim())
  ) {
    throw new ProvisioningError(
      'INVALID_DATA',
      'E-mail do administrador em formato inválido.',
      400
    );
  }
  const cleanEmail = adminEmail.trim().toLowerCase();

  if (!initialPassword || typeof initialPassword !== 'string' || initialPassword.length < 6) {
    throw new ProvisioningError(
      'INVALID_DATA',
      'A senha inicial deve conter no mínimo 6 caracteres.',
      400
    );
  }

  const validPlans = ['starter', 'pro', 'enterprise'] as const;
  const validatedPlan = validPlans.includes(plan as any) ? plan : 'starter';
  const validatedSource = source === 'public_signup' ? 'public_signup' : 'master';

  // 2. Conexão com Firebase Admin
  let adminAuth: any;
  let db: any;
  try {
    adminAuth = getAdminAuth();
    db = getAdminFirestore();
  } catch (err: any) {
    console.error('[ProvisioningCore] Falha na conexão com Firebase Admin:', err?.message || err);
    throw new ProvisioningError(
      'FIREBASE_CONFIG_ERROR',
      'Serviço temporariamente indisponível. Configuração do banco ausente ou inválida.',
      503
    );
  }

  // 3. Checagem prévia de duplicidade de Slug no Firestore
  try {
    const docRef = db.collection('businesses').doc(cleanSlug);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      throw new ProvisioningError(
        'SLUG_ALREADY_EXISTS',
        'O slug informado já está em uso por outra barbearia.',
        409
      );
    }

    const querySnap = await db.collection('businesses').where('slug', '==', cleanSlug).limit(1).get();
    if (!querySnap.empty) {
      throw new ProvisioningError(
        'SLUG_ALREADY_EXISTS',
        'O slug informado já está em uso por outra barbearia.',
        409
      );
    }
  } catch (dbErr: any) {
    if (dbErr instanceof ProvisioningError) {
      throw dbErr;
    }
    console.error('[ProvisioningCore] Erro ao verificar unicidade de slug:', dbErr?.message || dbErr);
    throw new ProvisioningError(
      'INTERNAL_ERROR',
      'Erro interno ao validar disponibilidade do endereço.',
      500
    );
  }

  // 4. Checagem prévia de existência do E-mail no Firebase Auth
  try {
    await adminAuth.getUserByEmail(cleanEmail);
    throw new ProvisioningError(
      'EMAIL_ALREADY_IN_USE',
      'O e-mail informado já está cadastrado no sistema.',
      409
    );
  } catch (userCheckErr: any) {
    if (userCheckErr instanceof ProvisioningError) {
      throw userCheckErr;
    }
    if (userCheckErr?.code !== 'auth/user-not-found') {
      console.error('[ProvisioningCore] Erro ao validar e-mail no Auth:', userCheckErr?.message || userCheckErr);
      throw new ProvisioningError(
        'INTERNAL_ERROR',
        'Erro interno ao verificar disponibilidade do e-mail.',
        500
      );
    }
    // 'auth/user-not-found' -> E-mail disponível para criação!
  }

  // 5. Criação do Usuário no Firebase Authentication
  let createdUser: any = null;
  try {
    createdUser = await adminAuth.createUser({
      email: cleanEmail,
      password: initialPassword,
      displayName: adminName.trim(),
      emailVerified: true,
      disabled: false,
    });
  } catch (createAuthErr: any) {
    console.error('[ProvisioningCore] Falha ao criar usuário no Firebase Auth:', createAuthErr?.message || createAuthErr);
    if (createAuthErr?.code === 'auth/email-already-exists') {
      throw new ProvisioningError(
        'EMAIL_ALREADY_IN_USE',
        'O e-mail informado já está em uso.',
        409
      );
    }
    throw new ProvisioningError(
      'INTERNAL_ERROR',
      'Não foi possível registrar o usuário no serviço de autenticação.',
      500
    );
  }

  // 6. Provisionamento dos Documentos no Firestore com Rollback Automático em caso de Falha
  try {
    // 6.1 Aplica Custom Claims de Admin vinculadas exclusivamente ao tenant
    await adminAuth.setCustomUserClaims(createdUser.uid, {
      role: 'admin',
      businessId: cleanSlug,
    });

    const nowIso = new Date().toISOString();
    const cleanPhone = typeof adminPhone === 'string' ? adminPhone.trim() : '';

    // 6.2 Montagem do documento da Barbearia (businesses/{cleanSlug})
    const businessDoc = {
      businessId: cleanSlug,
      slug: cleanSlug,
      name: businessName.trim(),
      description: `Barbearia ${businessName.trim()} especializada em estilo e atendimento de excelência.`,
      logoUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=200&auto=format&fit=crop&q=80',
      whatsapp: cleanPhone,
      instagram: '',
      status: 'active',
      plan: validatedPlan,
      source: validatedSource,
      ownerUserId: createdUser.uid,
      ownerEmail: cleanEmail,
      ownerName: adminName.trim(),
      ownerPhone: cleanPhone,
      city: 'São Paulo',
      state: 'SP',
      address: {
        street: 'Rua Principal',
        number: '100',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
      },
      openingHours: {
        monday: { isOpen: true, openTime: '09:00', closeTime: '19:00' },
        tuesday: { isOpen: true, openTime: '09:00', closeTime: '19:00' },
        wednesday: { isOpen: true, openTime: '09:00', closeTime: '19:00' },
        thursday: { isOpen: true, openTime: '09:00', closeTime: '19:00' },
        friday: { isOpen: true, openTime: '09:00', closeTime: '19:00' },
        saturday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
        sunday: { isOpen: false, openTime: '09:00', closeTime: '13:00' },
      },
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const batch = db.batch();

    // Gravação atômica do tenant sem sobrescrita silenciosa (proteção contra race condition)
    const businessRef = db.collection('businesses').doc(cleanSlug);
    batch.create(businessRef, businessDoc);

    // 6.3 Semente Inicial de Serviços Essenciais (services/)
    const initialServices = [
      {
        id: `${cleanSlug}_corte`,
        name: 'Corte Tradicional',
        categoryId: 'cabelo',
        categoryName: 'Cabelo',
        description: 'Corte moderno com acabamento na tesoura e navalha.',
        price: 45,
        durationMinutes: 35,
        active: true,
      },
      {
        id: `${cleanSlug}_barba`,
        name: 'Barba Completa',
        categoryId: 'barba',
        categoryName: 'Barba',
        description: 'Alinhamento com toalha quente e finalização com óleo.',
        price: 35,
        durationMinutes: 30,
        active: true,
      },
      {
        id: `${cleanSlug}_combo`,
        name: 'Corte + Barba',
        categoryId: 'combo',
        categoryName: 'Combos',
        description: 'Serviço completo de cabelo e barba com desconto.',
        price: 70,
        durationMinutes: 60,
        active: true,
      },
    ];

    for (const srv of initialServices) {
      const srvRef = db.collection('services').doc(srv.id);
      batch.set(srvRef, {
        businessId: cleanSlug,
        name: srv.name,
        categoryId: srv.categoryId,
        categoryName: srv.categoryName,
        description: srv.description,
        price: srv.price,
        durationMinutes: srv.durationMinutes,
        active: srv.active,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    }

    // 6.4 Semente Inicial de Profissional Ativo (professionals/)
    const profId = `${cleanSlug}_pro_principal`;
    const profRef = db.collection('professionals').doc(profId);
    batch.set(profRef, {
      businessId: cleanSlug,
      name: adminName.trim(),
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250',
      whatsapp: cleanPhone || '5511999999999',
      email: cleanEmail,
      status: 'active',
      active: true,
      serviceMode: 'all',
      serviceIds: [],
      serviceConfigs: [],
      schedule: [
        { dayOfWeek: 1, dayName: 'Segunda', isDayOff: false, startTime: '09:00', endTime: '19:00' },
        { dayOfWeek: 2, dayName: 'Terça', isDayOff: false, startTime: '09:00', endTime: '19:00' },
        { dayOfWeek: 3, dayName: 'Quarta', isDayOff: false, startTime: '09:00', endTime: '19:00' },
        { dayOfWeek: 4, dayName: 'Quinta', isDayOff: false, startTime: '09:00', endTime: '19:00' },
        { dayOfWeek: 5, dayName: 'Sexta', isDayOff: false, startTime: '09:00', endTime: '19:00' },
        { dayOfWeek: 6, dayName: 'Sábado', isDayOff: false, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 0, dayName: 'Domingo', isDayOff: true, startTime: '09:00', endTime: '13:00' },
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    // 6.5 Registro de usuário em users/{uid} para auditoria no Master
    const userDocRef = db.collection('users').doc(createdUser.uid);
    batch.set(userDocRef, {
      uid: createdUser.uid,
      email: cleanEmail,
      name: adminName.trim(),
      role: 'business_admin',
      businessId: cleanSlug,
      businessName: businessName.trim(),
      status: 'active',
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    // Commit atômico no Firestore
    await batch.commit();

    return {
      business: {
        id: cleanSlug,
        name: businessName.trim(),
        slug: cleanSlug,
        status: 'active',
        plan: validatedPlan,
      },
      admin: {
        uid: createdUser.uid,
        email: cleanEmail,
        name: adminName.trim(),
      },
      message: 'Barbearia e administrador provisionados com sucesso.',
    };
  } catch (firestoreErr: any) {
    console.error(
      '[ProvisioningCore] Falha na gravação do Firestore. Executando rollback no Firebase Auth:',
      firestoreErr?.message || firestoreErr
    );

    try {
      if (createdUser?.uid) {
        await adminAuth.deleteUser(createdUser.uid);
        console.log('[ProvisioningCore] Rollback concluído: usuário de Auth excluído com sucesso.');
      }
    } catch (rollbackErr: any) {
      console.error(
        '[ProvisioningCore] ERRO CRÍTICO durante o rollback de usuário (possível conta órfã):',
        rollbackErr?.message || rollbackErr
      );
    }

    throw new ProvisioningError(
      'INTERNAL_ERROR',
      'Ocorreu uma falha ao persistir os dados da barbearia. A operação foi cancelada e revertida.',
      500
    );
  }
}
