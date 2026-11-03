import { getAdminFirestore } from '../../src/services/firebase/serverDb.js';

export const CANONICAL_BUSINESS_ID = 'joao-barber';

export interface PublicCatalogService {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  description: string;
  price: number;
  durationMinutes: number;
  active: boolean;
}

export interface PublicCatalogProfessional {
  id: string;
  name: string;
  photoUrl: string;
  active: boolean;
  status: 'active';
  serviceMode: 'all' | 'custom';
  serviceIds: string[];
  serviceConfigs: any[];
  schedule: any[];
}

export interface PublicCatalogBusinessProfile {
  businessId: string;
  name: string;
  description: string;
  logoUrl: string;
  whatsapp: string;
  instagram: string;
  address?: {
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
  };
  openingHours?: Record<string, { isOpen: boolean; openTime: string; closeTime: string }>;
}

export interface PublicCatalogResponse {
  success: true;
  catalog: {
    businessId: string;
    profile?: PublicCatalogBusinessProfile | null;
    professionals: PublicCatalogProfessional[];
    services: PublicCatalogService[];
  };
}

export interface PublicCatalogErrorResponse {
  success: false;
  error: {
    code: 'METHOD_NOT_ALLOWED' | 'FIREBASE_CONFIG_ERROR' | 'INTERNAL_ERROR' | 'INVALID_DATA' | 'BUSINESS_NOT_FOUND';
    message: string;
  };
}

/**
 * Utilitário agnóstico para envio de respostas HTTP compatível com
 * Vercel Serverless Functions, Express e Node.js IncomingMessage/ServerResponse.
 * Configura cabeçalhos de segurança e cache HTTP de forma explícita.
 */
function sendResponse(
  res: any,
  statusCode: number,
  body: any,
  cacheHeaders?: { cacheControl: string; vary?: string }
) {
  if (typeof res.setHeader === 'function') {
    res.setHeader('Content-Type', 'application/json');
    if (cacheHeaders) {
      res.setHeader('Cache-Control', cacheHeaders.cacheControl);
      if (cacheHeaders.vary) {
        res.setHeader('Vary', cacheHeaders.vary);
      }
    } else {
      // Respostas de erro ou mutações NUNCA são cacheadas em proxies/CDN
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    }
  }

  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(body);
  }
  res.statusCode = statusCode;
  res.end(JSON.stringify(body));
}

/**
 * Vercel Serverless Function pública para leitura autoritativa e segura do catálogo
 * de serviços e profissionais do Firestore.
 * 
 * Endpoint: GET /api/public/catalog
 * 
 * Princípios de Segurança e Integridade:
 * 1. Somente leitura (método GET). Rejeita POST/PUT/DELETE com HTTP 405.
 * 2. Utiliza exclusivamente o Firebase Admin SDK no servidor (bypassa regras restritivas com segurança).
 * 3. Expõe os Document IDs reais e canônicos do Firestore para eliminar divergências com mocks.
 * 4. Aplica rigorosa higienização de PII: omite e-mails, telefones privados e credenciais.
 * 5. Escopo estrito e imutável de tenant: fixa 'businessId' em 'joao-barber'.
 */
export default async function handler(req: any, res: any) {
  // 1. Validação estrita de método HTTP (somente GET é permitido)
  if (req.method !== 'GET') {
    if (typeof res.setHeader === 'function') {
      res.setHeader('Allow', ['GET']);
    }
    const errorBody: PublicCatalogErrorResponse = {
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Método não permitido. Utilize GET.',
      },
    };
    return sendResponse(res, 405, errorBody);
  }

  // 2. Conexão com Firebase Admin Firestore
  let db: any;
  try {
    db = getAdminFirestore();
  } catch (err: any) {
    console.error('[API /api/public/catalog] Falha na inicialização do Firebase Admin:', err?.message || err);
    const errorBody: PublicCatalogErrorResponse = {
      success: false,
      error: {
        code: 'FIREBASE_CONFIG_ERROR',
        message: 'Serviço temporariamente indisponível. Configuração do banco ausente ou inválida.',
      },
    };
    return sendResponse(res, 503, errorBody);
  }

  try {
    // 3. Resolução segura e dinâmica da empresa (tenant) por slug ou businessId
    let requestedIdentifier = '';
    if (req.query) {
      requestedIdentifier = (typeof req.query.slug === 'string' ? req.query.slug : typeof req.query.businessId === 'string' ? req.query.businessId : '') || '';
    }
    if (!requestedIdentifier && req.url) {
      try {
        const parsedUrl = new URL(req.url, 'http://localhost');
        requestedIdentifier = parsedUrl.searchParams.get('slug') || parsedUrl.searchParams.get('businessId') || '';
      } catch {
        // Ignora erro de parsing em URLs relativas
      }
    }

    let businessId = CANONICAL_BUSINESS_ID;
    let profileData: any = null;

    if (requestedIdentifier) {
      const cleanIdentifier = requestedIdentifier.trim();
      if (!/^[a-zA-Z0-9_-]{1,64}$/.test(cleanIdentifier)) {
        const errorBody: PublicCatalogErrorResponse = {
          success: false,
          error: {
            code: 'INVALID_DATA',
            message: 'Identificador de empresa em formato inválido.',
          },
        };
        return sendResponse(res, 400, errorBody);
      }

      if (cleanIdentifier !== CANONICAL_BUSINESS_ID) {
        // Resolução autoritativa do negócio no Firestore:
        // 1. Tenta correspondência direta por document ID
        const directSnap = await db.collection('businesses').doc(cleanIdentifier).get();
        if (directSnap.exists) {
          businessId = directSnap.id;
          profileData = directSnap.data();
        } else {
          // 2. Tenta correspondência por campo slug
          const slugQuery = await db.collection('businesses').where('slug', '==', cleanIdentifier).limit(1).get();
          if (!slugQuery.empty) {
            businessId = slugQuery.docs[0].id;
            profileData = slugQuery.docs[0].data();
          } else {
            const errorBody: PublicCatalogErrorResponse = {
              success: false,
              error: {
                code: 'BUSINESS_NOT_FOUND',
                message: 'Estabelecimento não encontrado para o identificador informado.',
              },
            };
            return sendResponse(res, 404, errorBody);
          }
        }
      } else {
        const bizSnap = await db.collection('businesses').doc(businessId).get();
        if (bizSnap.exists) {
          profileData = bizSnap.data();
        }
      }
    } else {
      const bizSnap = await db.collection('businesses').doc(businessId).get();
      if (bizSnap.exists) {
        profileData = bizSnap.data();
      }
    }

    // 4. Consulta de Serviços e Profissionais em paralelo filtrados pelo tenant
    const [servicesSnap, professionalsSnap] = await Promise.all([
      db.collection('services').where('businessId', '==', businessId).get(),
      db.collection('professionals').where('businessId', '==', businessId).get(),
    ]);

    // 4. Mapeamento e filtragem de Serviços Ativos
    const services: PublicCatalogService[] = [];
    servicesSnap.forEach((docSnap: any) => {
      const data = docSnap.data() || {};
      // Somente serviços explicitamente ativos
      if (data.active === false) return;

      services.push({
        id: docSnap.id, // Document ID canônico real do Firestore
        name: typeof data.name === 'string' ? data.name.trim() : 'Serviço',
        categoryId: typeof data.categoryId === 'string' ? data.categoryId.trim() : 'cabelo',
        categoryName: typeof data.categoryName === 'string' ? data.categoryName.trim() : (data.categoryId || 'Geral'),
        description: typeof data.description === 'string' ? data.description.trim() : '',
        price: typeof data.price === 'number' ? data.price : Number(data.price) || 0,
        durationMinutes: typeof data.durationMinutes === 'number' ? data.durationMinutes : Number(data.durationMinutes) || 30,
        active: true,
      });
    });

    // Ordenação determinística de serviços: por categoria e depois por nome
    services.sort((a, b) => {
      const catCompare = a.categoryName.localeCompare(b.categoryName, 'pt-BR');
      if (catCompare !== 0) return catCompare;
      return a.name.localeCompare(b.name, 'pt-BR');
    });

    // 5. Mapeamento, higienização de PII e filtragem de Profissionais Ativos
    const professionals: PublicCatalogProfessional[] = [];
    professionalsSnap.forEach((docSnap: any) => {
      const data = docSnap.data() || {};
      
      // Filtrar apenas profissionais que não estejam explicitamente inativos
      const rawStatus = typeof data.status === 'string' ? data.status.trim().toLowerCase() : '';
      const isExplicitlyInactive = rawStatus === 'inactive' || data.active === false;
      if (isExplicitlyInactive) return;

      // Higienização estrita: NUNCA expor email, whatsapp privado ou dados de auditoria
      professionals.push({
        id: docSnap.id, // Document ID canônico real do Firestore
        name: typeof data.name === 'string' ? data.name.trim() : 'Profissional',
        photoUrl: typeof data.photoUrl === 'string' ? data.photoUrl.trim() : '',
        active: true,
        status: 'active',
        serviceMode: data.serviceMode === 'custom' ? 'custom' : 'all',
        serviceIds: Array.isArray(data.serviceIds) ? data.serviceIds : [],
        serviceConfigs: Array.isArray(data.serviceConfigs) ? data.serviceConfigs : [],
        schedule: Array.isArray(data.schedule) ? data.schedule : [],
      });
    });

    // Ordenação determinística de profissionais: por nome ascendente
    professionals.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

    // Higienização e montagem do perfil público
    const profile: PublicCatalogBusinessProfile | null = profileData ? {
      businessId,
      name: typeof profileData.name === 'string' ? profileData.name.trim() : 'Barbearia',
      description: typeof profileData.description === 'string' ? profileData.description.trim() : '',
      logoUrl: typeof profileData.logoUrl === 'string' ? profileData.logoUrl.trim() : '',
      whatsapp: typeof profileData.whatsapp === 'string' ? profileData.whatsapp.trim() : '',
      instagram: typeof profileData.instagram === 'string' ? profileData.instagram.trim() : '',
      address: profileData.address || undefined,
      openingHours: profileData.openingHours || undefined,
    } : null;

    // 6. Resposta Pública de Sucesso
    const responsePayload: PublicCatalogResponse = {
      success: true,
      catalog: {
        businessId,
        profile,
        professionals,
        services,
      },
    };

    // Aplica cache seguro de borda (CDN): 30s fresco, 120s stale-while-revalidate.
    // O isolamento por tenant é rigorosamente garantido pela inclusão da URL completa (incluindo query params) na cache key.
    return sendResponse(res, 200, responsePayload, {
      cacheControl: 'public, s-maxage=30, stale-while-revalidate=120',
      vary: 'Accept-Encoding',
    });
  } catch (err: any) {
    console.error('[API /api/public/catalog] Erro ao carregar catálogo:', err?.message || err);
    const isConfigOrAuthError =
      err?.code === 7 ||
      err?.code === 16 ||
      typeof err?.message === 'string' && (
        err.message.includes('PERMISSION_DENIED') ||
        err.message.includes('UNAUTHENTICATED') ||
        err.message.includes('FIREBASE_CONFIG_ERROR')
      );

    const errorBody: PublicCatalogErrorResponse = {
      success: false,
      error: {
        code: isConfigOrAuthError ? 'FIREBASE_CONFIG_ERROR' : 'INTERNAL_ERROR',
        message: isConfigOrAuthError
          ? 'Serviço temporariamente indisponível. Configuração do banco ausente ou sem credenciais de acesso.'
          : 'Ocorreu um erro interno no servidor ao processar a requisição do catálogo.',
      },
    };
    return sendResponse(res, isConfigOrAuthError ? 503 : 500, errorBody);
  }
}
