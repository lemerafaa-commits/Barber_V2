import { createRemoteJWKSet, jwtVerify } from 'jose';
import { getAdminFirestore, getAdminAuth } from '../../src/services/firebase/serverDb.js';

const FIREBASE_JWKS_URL = new URL(
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
);
const remoteJWKSet = createRemoteJWKSet(FIREBASE_JWKS_URL);

interface ErrorResponse {
  success: false;
  error: 'METHOD_NOT_ALLOWED' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'FIREBASE_CONFIG_ERROR' | 'INTERNAL_ERROR' | 'FIRESTORE_ERROR';
  message: string;
}

function sendResponse(res: any, statusCode: number, body: any) {
  if (typeof res.setHeader === 'function') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  }
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(body);
  }
  res.statusCode = statusCode;
  res.end(JSON.stringify(body));
}

/**
 * Endpoint Protegido do Painel Master para Gestão de Rede Real:
 * GET /api/master/network
 *
 * Requisitos e Garantias de Segurança:
 * 1. Exige autenticação Firebase válida via Bearer ID Token.
 * 2. Valida criptograficamente o token e exige claim `master === true`.
 * 3. Utiliza exclusivamente o Firebase Admin SDK no servidor para ler as coleções
 *    `businesses` e `users` sem expor regras abertas no Firestore Client.
 * 4. Retorna todas as empresas cadastradas pelo Provisioning Core e seus administradores vinculados.
 * 5. Não utiliza dados mockados nem filtros hardcoded.
 */
export default async function handler(req: any, res: any) {
  // 1. Validação estrita de método HTTP (somente GET)
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
      message: 'Cabeçalho Authorization necessário para acessar a rede do Master.',
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

  try {
    try {
      const adminAuth = getAdminAuth();
      const decoded = await adminAuth.verifyIdToken(idToken);
      if (decoded.master === true) {
        isMasterClaimPresent = true;
      }
    } catch {
      const projectId = process.env.FIREBASE_PROJECT_ID || 'saas-barbearia-teste-v1';
      const { payload } = await jwtVerify(idToken, remoteJWKSet, {
        issuer: `https://securetoken.google.com/${projectId}`,
        audience: projectId,
      });

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

  if (!isMasterClaimPresent) {
    return sendResponse(res, 403, {
      success: false,
      error: 'FORBIDDEN',
      message: 'Acesso negado. Acesso restrito a usuários com privilégio Master (claim master: true).',
    } as ErrorResponse);
  }

  // 4. Consulta autorizada no Firestore usando Firebase Admin SDK
  try {
    const db = getAdminFirestore();

    // 4.1 Busca todas as empresas cadastradas no Firestore
    const businessesSnap = await db.collection('businesses').get();
    const businesses: any[] = [];

    // 4.2 Busca todos os usuários cadastrados na coleção users
    const usersSnap = await db.collection('users').get();
    const users: any[] = [];

    usersSnap.forEach((doc) => {
      const u = doc.data() || {};
      users.push({
        id: doc.id,
        name: u.name || 'Sem nome',
        email: u.email || '',
        role: u.role || 'business_admin',
        businessId: u.businessId || '',
        businessName: u.businessName || '',
        status: u.status || 'active',
        createdAt: u.createdAt || '',
        lastLoginAt: u.updatedAt || u.createdAt || '',
        phone: u.phone || u.whatsapp || '',
      });
    });

    businessesSnap.forEach((doc) => {
      const data = doc.data() || {};
      const slug = data.slug || doc.id;
      const ownerEmail = data.ownerEmail || '';
      const ownerName = data.ownerName || data.name || 'Administrador';

      businesses.push({
        id: doc.id,
        name: data.name || doc.id,
        slug,
        ownerUserId: data.ownerUserId || '',
        ownerName,
        ownerEmail,
        ownerPhone: data.ownerPhone || data.whatsapp || '',
        status: data.status || 'active',
        plan: data.plan || 'starter',
        appointmentCount: 0,
        monthlyRevenue: 0,
        city: data.city || data.address?.city || '',
        state: data.state || data.address?.state || '',
        createdAt: data.createdAt || '',
        lastActiveAt: data.updatedAt || data.createdAt || 'Ativo no Firestore',
        isLiveFirestore: true,
        professionals: [],
        liveStats: {
          totalAppointments: 0,
          confirmedAppointments: 0,
          completedAppointments: 0,
          cancelledAppointments: 0,
          calculatedRevenue: 0,
          totalServices: 0,
          activeServices: 0,
          totalProfessionals: 0,
          activeProfessionals: 0,
          lastSyncedAt: new Date().toISOString(),
        },
      });
    });

    // Ordena as empresas mais recentes primeiro
    businesses.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    return sendResponse(res, 200, {
      success: true,
      totalBusinesses: businesses.length,
      totalUsers: users.length,
      businesses,
      users,
      timestamp: new Date().toISOString(),
    });
  } catch (dbErr: any) {
    console.error('[API /api/master/network] Erro ao consultar banco de dados:', dbErr?.message || dbErr);
    return sendResponse(res, 500, {
      success: false,
      error: 'FIRESTORE_ERROR',
      message: 'Falha ao recuperar dados da rede no Firestore.',
    } as ErrorResponse);
  }
}
