import { createRemoteJWKSet, jwtVerify } from 'jose';
import { getAdminFirestore, getAdminAuth } from '../../src/services/firebase/serverDb.js';

const FIREBASE_JWKS_URL = new URL(
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
);
const remoteJWKSet = createRemoteJWKSet(FIREBASE_JWKS_URL);

/**
 * Negócio canônico autorizado para esta primeira etapa de integração.
 * O escopo é estritamente limitado a 'joao-barber', sem possibilidade
 * de injeção ou seleção de outro tenant pelo cliente.
 */
const CANONICAL_BUSINESS_ID = 'joao-barber';

interface ErrorResponse {
  success: false;
  error: 'METHOD_NOT_ALLOWED' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'FIREBASE_CONFIG_ERROR' | 'INTERNAL_ERROR' | 'FIRESTORE_ERROR';
  message: string;
}

/**
 * Utilitário agnóstico para envio de respostas HTTP compatível com
 * Vercel Serverless Functions, Express e Node.js IncomingMessage/ServerResponse.
 */
function sendResponse(res: any, statusCode: number, body: any) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(body);
  }
  res.statusCode = statusCode;
  if (typeof res.setHeader === 'function') {
    res.setHeader('Content-Type', 'application/json');
  }
  res.end(JSON.stringify(body));
}

/**
 * Endpoint de Leitura Protegido do Admin Master:
 * GET /api/master/joao-barber
 *
 * Requisitos de Segurança:
 * 1. Exige token Firebase ID válido via cabeçalho Authorization: Bearer <token>.
 * 2. Valida criptograficamente assinatura e validade do token.
 * 3. Valida no servidor a presença do custom claim `master === true` (ou `role === 'master'`).
 * 4. Retorna HTTP 401 para token ausente/inválido.
 * 5. Retorna HTTP 403 para usuário autenticado sem claim Master.
 * 6. Consulta o Firestore no servidor usando Firebase Admin SDK.
 * 7. Escopo estrito: consulta exclusivamente dados de `joao-barber`.
 * 8. Não expõe busy_slots, daily_schedules, senhas ou segredos internos.
 */
export default async function handler(req: any, res: any) {
  // 1. Validação de método HTTP (somente leitura - GET)
  if (req.method !== 'GET') {
    if (typeof res.setHeader === 'function') {
      res.setHeader('Allow', 'GET');
    }
    return sendResponse(res, 405, {
      success: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'Método não permitido. Utilize GET.',
    } as ErrorResponse);
  }

  // 2. Extração do cabeçalho de autorização
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (!authHeader || typeof authHeader !== 'string') {
    return sendResponse(res, 401, {
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Cabeçalho Authorization necessário para acessar dados do Master.',
    } as ErrorResponse);
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match || !match[1]) {
    return sendResponse(res, 401, {
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Formato de autorização inválido. Esperado: Bearer <token>.',
    } as ErrorResponse);
  }

  const idToken = match[1].trim();
  if (!idToken) {
    return sendResponse(res, 401, {
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Token de autenticação vazio.',
    } as ErrorResponse);
  }

  // 3. Validação do Token e Verificação do Custom Claim `master: true`
  let isMasterClaimPresent = false;
  let callerUid = '';

  try {
    // 3.1 Tentativa com Admin SDK se credenciais server-side completas estiverem presentes
    try {
      const adminAuth = getAdminAuth();
      const decoded = await adminAuth.verifyIdToken(idToken);
      callerUid = decoded.uid;
      if (decoded.master === true) {
        isMasterClaimPresent = true;
      }
    } catch {
      // 3.2 Validação direta via JWKS público da Google (garante verificação estrita)
      const projectId = process.env.FIREBASE_PROJECT_ID || 'saas-barberaria-teste-v1';
      const { payload } = await jwtVerify(idToken, remoteJWKSet, {
        issuer: `https://securetoken.google.com/${projectId}`,
        audience: projectId,
      });

      callerUid = payload.sub as string;
      if (payload.master === true) {
        isMasterClaimPresent = true;
      }
    }
  } catch (authErr: any) {
    return sendResponse(res, 401, {
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Token de autenticação inválido ou expirado.',
    } as ErrorResponse);
  }

  // 4. Bloqueio por falta de privilégio Master (HTTP 403 Forbidden)
  if (!isMasterClaimPresent) {
    return sendResponse(res, 403, {
      success: false,
      error: 'FORBIDDEN',
      message: 'Acesso negado. Acesso restrito a usuários com privilégio Master (claim master: true).',
    } as ErrorResponse);
  }

  // 5. Consulta autorizada no Firestore usando Firebase Admin SDK
  try {
    const db = getAdminFirestore();

    // 5.1 Documento de perfil do negócio: businesses/joao-barber
    let businessProfile: Record<string, any> | null = null;
    const businessSnap = await db.collection('businesses').doc(CANONICAL_BUSINESS_ID).get();
    if (businessSnap.exists) {
      businessProfile = { id: businessSnap.id, ...businessSnap.data() };
    }

    // 5.2 Agendamentos reais: appointments (filtrado estritamente por businessId)
    const appointments: any[] = [];
    let totalAppointments = 0;
    let confirmedCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;
    let calculatedRevenue = 0;

    const aptQuerySnap = await db
      .collection('appointments')
      .where('businessId', '==', CANONICAL_BUSINESS_ID)
      .get();

    aptQuerySnap.forEach((doc) => {
      totalAppointments++;
      const data = doc.data();
      const price = typeof data.totalPrice === 'number' ? data.totalPrice : Number(data.totalPrice) || 0;
      const status = data.status || 'confirmed';

      if (status === 'confirmed') confirmedCount++;
      else if (status === 'completed') completedCount++;
      else if (status === 'cancelled') cancelledCount++;

      if (status === 'confirmed' || status === 'completed') {
        calculatedRevenue += price;
      }

      // Sanitização de campos: não expor dados internos sensíveis
      appointments.push({
        id: doc.id,
        businessId: CANONICAL_BUSINESS_ID,
        customerName: data.customerName || 'Cliente',
        date: data.date,
        time: data.time,
        totalPrice: price,
        duration: data.duration || 30,
        status,
        createdAt: data.createdAt ? String(data.createdAt) : '',
        professionalName: data.professionalName || 'Não especificado',
      });
    });

    // 5.3 Serviços cadastrados: services (filtrado estritamente por businessId)
    const services: any[] = [];
    let activeServicesCount = 0;
    const srvQuerySnap = await db
      .collection('services')
      .where('businessId', '==', CANONICAL_BUSINESS_ID)
      .get();

    srvQuerySnap.forEach((doc) => {
      const data = doc.data();
      const active = data.active !== false;
      if (active) activeServicesCount++;
      services.push({
        id: doc.id,
        businessId: CANONICAL_BUSINESS_ID,
        name: data.name || '',
        categoryId: data.categoryId || '',
        categoryName: data.categoryName || '',
        price: typeof data.price === 'number' ? data.price : Number(data.price) || 0,
        durationMinutes: typeof data.durationMinutes === 'number' ? data.durationMinutes : Number(data.durationMinutes) || 30,
        active,
        description: data.description || '',
      });
    });

    // 5.4 Profissionais cadastrados: professionals (filtrado estritamente por businessId)
    const professionals: any[] = [];
    let activeProfessionalsCount = 0;
    const profQuerySnap = await db
      .collection('professionals')
      .where('businessId', '==', CANONICAL_BUSINESS_ID)
      .get();

    profQuerySnap.forEach((doc) => {
      const data = doc.data();
      const active = data.status === 'active';
      if (active) activeProfessionalsCount++;
      professionals.push({
        id: doc.id,
        businessId: CANONICAL_BUSINESS_ID,
        name: data.name || '',
        whatsapp: data.whatsapp || '',
        email: data.email || '',
        status: data.status || 'active',
        serviceMode: data.serviceMode || 'all',
        serviceIds: Array.isArray(data.serviceIds) ? data.serviceIds : [],
      });
    });

    // 6. Resposta estruturada somente de leitura
    return sendResponse(res, 200, {
      success: true,
      businessId: CANONICAL_BUSINESS_ID,
      profile: businessProfile
        ? {
            businessId: CANONICAL_BUSINESS_ID,
            name: businessProfile.name || 'João Barber Shop',
            description: businessProfile.description || '',
            logoUrl: businessProfile.logoUrl || '',
            whatsapp: businessProfile.whatsapp || '',
            instagram: businessProfile.instagram || '',
            address: businessProfile.address || {},
            openingHours: businessProfile.openingHours || {},
          }
        : null,
      summary: {
        totalAppointments,
        confirmedAppointments: confirmedCount,
        completedAppointments: completedCount,
        cancelledAppointments: cancelledCount,
        calculatedRevenue,
        totalServices: services.length,
        activeServices: activeServicesCount,
        totalProfessionals: professionals.length,
        activeProfessionals: activeProfessionalsCount,
      },
      services,
      professionals,
      appointmentsCount: totalAppointments,
      // Retorna amostra recente de agendamentos sanitizados
      recentAppointments: appointments.slice(0, 50),
      timestamp: new Date().toISOString(),
    });
  } catch (serverErr: any) {
    console.error('[API Master] Erro ao consultar dados no Firestore:', serverErr?.message || serverErr);
    return sendResponse(res, 500, {
      success: false,
      error: 'FIRESTORE_ERROR',
      message: 'Erro interno ao consultar dados do negócio no Firestore.',
    } as ErrorResponse);
  }
}
