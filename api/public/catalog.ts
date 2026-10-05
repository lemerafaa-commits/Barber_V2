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

export interface PublicCatalogResponse {
  success: true;
  catalog: {
    businessId: string;
    professionals: PublicCatalogProfessional[];
    services: PublicCatalogService[];
  };
}

export interface PublicCatalogErrorResponse {
  success: false;
  error: {
    code: 'METHOD_NOT_ALLOWED' | 'FIREBASE_CONFIG_ERROR' | 'INTERNAL_ERROR';
    message: string;
  };
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
    const businessId = CANONICAL_BUSINESS_ID;

    // 3. Consulta de Serviços e Profissionais em paralelo
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
      
      // Filtrar apenas profissionais com status ativo
      const rawStatus = data.status || (data.active === false ? 'inactive' : 'active');
      const isExplicitlyActive = rawStatus === 'active' && data.active !== false;
      if (!isExplicitlyActive) return;

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

    // 6. Resposta Pública de Sucesso
    const responsePayload: PublicCatalogResponse = {
      success: true,
      catalog: {
        businessId,
        professionals,
        services,
      },
    };

    return sendResponse(res, 200, responsePayload);
  } catch (err: any) {
    console.error('[API /api/public/catalog] Erro interno inesperado ao carregar catálogo:', err?.message || err);
    const errorBody: PublicCatalogErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ocorreu um erro interno no servidor ao processar a requisição do catálogo.',
      },
    };
    return sendResponse(res, 500, errorBody);
  }
}
