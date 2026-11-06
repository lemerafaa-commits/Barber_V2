import { createRemoteJWKSet, jwtVerify } from 'jose';
import { getAdminAuth } from '../../../src/services/firebase/serverDb.js';
import {
  provisionTenant,
  ProvisioningError,
  ProvisionTenantInput,
  ProvisionTenantResult,
  ProvisioningErrorCode,
} from '../../../src/services/tenant/provisioningCore.js';

const FIREBASE_JWKS_URL = new URL(
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
);
const remoteJWKSet = createRemoteJWKSet(FIREBASE_JWKS_URL);

export interface CreateTenantRequestBody {
  businessName: string;
  slug: string;
  adminName: string;
  adminEmail: string;
  initialPassword: string;
  adminPhone?: string;
  plan?: 'starter' | 'pro' | 'enterprise';
}

export interface CreateTenantSuccessResponse {
  success: true;
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

export interface CreateTenantErrorResponse {
  success: false;
  error:
    | 'METHOD_NOT_ALLOWED'
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | ProvisioningErrorCode;
  message: string;
}

/**
 * Utilitário agnóstico para envio de respostas HTTP compatível com
 * Vercel Serverless Functions, Express e Node.js IncomingMessage/ServerResponse.
 */
function sendResponse(
  res: any,
  statusCode: number,
  body: CreateTenantSuccessResponse | CreateTenantErrorResponse
) {
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
 * Extrai o corpo da requisição de forma resiliente tanto para runtimes com body-parser
 * quanto para streams brutos do Node.js.
 */
async function parseRequestBody(req: any): Promise<any> {
  if (req.body) {
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch {
        throw new Error('INVALID_JSON');
      }
    }
    return req.body;
  }

  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk: any) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('INVALID_JSON'));
      }
    });
    req.on('error', (err: any) => {
      reject(err);
    });
  });
}

/**
 * Vercel Serverless Function: Criação e Provisionamento de Nova Barbearia (Tenant)
 * Endpoint: POST /api/master/tenants/create
 *
 * Arquitetura Refatorada (Porta Master):
 * 1. Camada fina de Transporte HTTP e Autorização Master.
 * 2. Valida método POST e autenticação Bearer Token com claim master: true.
 * 3. Delega a execução da lógica de provisionamento exclusivamente ao Provisioning Core central.
 */
export default async function handler(req: any, res: any) {
  // 1. Validação estrita de método HTTP
  if (req.method !== 'POST') {
    if (typeof res.setHeader === 'function') {
      res.setHeader('Allow', ['POST']);
    }
    return sendResponse(res, 405, {
      success: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'Método não permitido. Utilize POST.',
    });
  }

  // 2. Extração e validação do cabeçalho Authorization
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (!authHeader || typeof authHeader !== 'string') {
    return sendResponse(res, 401, {
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Cabeçalho Authorization necessário para acessar rotas administrativas.',
    });
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match || !match[1]) {
    return sendResponse(res, 401, {
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Formato de autorização inválido. Esperado: Bearer <token>.',
    });
  }

  const idToken = match[1].trim();
  if (!idToken) {
    return sendResponse(res, 401, {
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Token de autenticação vazio.',
    });
  }

  // 3. Validação de Token e verificação de privilégio Master
  let isMasterAuthorized = false;

  try {
    try {
      const adminAuth = getAdminAuth();
      const decoded = await adminAuth.verifyIdToken(idToken);
      if (decoded.master === true) {
        isMasterAuthorized = true;
      }
    } catch {
      // Fallback seguro com verificação via JWKS da Google
      const projectId = process.env.FIREBASE_PROJECT_ID || 'saas-barbearia-teste-v1';
      const { payload } = await jwtVerify(idToken, remoteJWKSet, {
        issuer: `https://securetoken.google.com/${projectId}`,
        audience: projectId,
      });

      if (payload.master === true) {
        isMasterAuthorized = true;
      }
    }
  } catch (authErr: any) {
    return sendResponse(res, 401, {
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Token de autenticação inválido ou expirado.',
    });
  }

  if (!isMasterAuthorized) {
    return sendResponse(res, 403, {
      success: false,
      error: 'FORBIDDEN',
      message: 'Acesso negado. A criação de barbearias exige privilégio Master (claim master: true).',
    });
  }

  // 4. Extração do corpo da requisição
  let body: Partial<CreateTenantRequestBody>;
  try {
    body = await parseRequestBody(req);
  } catch {
    return sendResponse(res, 400, {
      success: false,
      error: 'INVALID_DATA',
      message: 'Corpo da requisição deve ser um JSON válido.',
    });
  }

  // 5. Execução pelo Provisioning Core Central
  try {
    const input: ProvisionTenantInput = {
      businessName: body?.businessName || '',
      slug: body?.slug || '',
      adminName: body?.adminName || '',
      adminEmail: body?.adminEmail || '',
      initialPassword: body?.initialPassword || '',
      adminPhone: body?.adminPhone,
      plan: body?.plan,
      source: 'master',
    };

    const result = await provisionTenant(input);

    return sendResponse(res, 201, {
      success: true,
      business: result.business,
      admin: result.admin,
      message: result.message,
    });
  } catch (err: any) {
    if (err instanceof ProvisioningError) {
      return sendResponse(res, err.statusCode, {
        success: false,
        error: err.code,
        message: err.message,
      });
    }

    console.error('[API CreateTenant] Erro inesperado durante o provisionamento:', err?.message || err);
    return sendResponse(res, 500, {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Erro interno no servidor ao processar o provisionamento.',
    });
  }
}
