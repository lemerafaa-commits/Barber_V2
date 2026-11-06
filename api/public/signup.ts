import {
  provisionTenant,
  ProvisioningError,
  ProvisionTenantInput,
  ProvisionTenantResult,
  ProvisioningErrorCode,
} from '../../src/services/tenant/provisioningCore.js';

export interface PublicSignupRequestBody {
  businessName: string;
  slug: string;
  adminName: string;
  adminEmail: string;
  initialPassword: string;
  adminPhone?: string;
}

export interface PublicSignupSuccessResponse {
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

export interface PublicSignupErrorResponse {
  success: false;
  error:
    | 'METHOD_NOT_ALLOWED'
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
  body: PublicSignupSuccessResponse | PublicSignupErrorResponse
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
 * Vercel Serverless Function: Cadastro Público de Nova Barbearia (Tenant)
 * Endpoint: POST /api/public/signup
 *
 * Arquitetura (Porta de Entrada Pública):
 * 1. Camada fina de Transporte HTTP pública (sem exigência de Bearer token ou autenticação prévia).
 * 2. Valida método POST estritamente.
 * 3. Sanitização contra Mass Assignment via whitelist rigorosa de campos.
 * 4. Força plano inicial 'starter' e auditoria de origem 'public_signup'.
 * 5. Delega o provisionamento exclusivamente ao Provisioning Core central.
 * 6. Higienização: nunca retorna dados sensíveis (senhas, hashes ou credenciais).
 */
export default async function handler(req: any, res: any) {
  // 1. Validação estrita de método HTTP (somente POST)
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

  // 2. Extração segura do corpo da requisição
  let body: any;
  try {
    body = await parseRequestBody(req);
  } catch {
    return sendResponse(res, 400, {
      success: false,
      error: 'INVALID_DATA',
      message: 'Corpo da requisição deve ser um JSON válido.',
    });
  }

  // 3. Whitelist estrita de campos aceitos (Prevenção contra Mass Assignment)
  // Campos privilegiados ou de sistema (role, master, claims, plan, source, status, internalId)
  // são descartados sumariamente.
  const { businessName, slug, adminName, adminEmail, initialPassword, adminPhone } = body || {};

  const input: ProvisionTenantInput = {
    businessName: typeof businessName === 'string' ? businessName : '',
    slug: typeof slug === 'string' ? slug : '',
    adminName: typeof adminName === 'string' ? adminName : '',
    adminEmail: typeof adminEmail === 'string' ? adminEmail : '',
    initialPassword: typeof initialPassword === 'string' ? initialPassword : '',
    adminPhone: typeof adminPhone === 'string' ? adminPhone : undefined,
    // Regra mandatória: cadastros públicos entram exclusivamente no plano starter
    plan: 'starter',
    // Rastreabilidade de origem no Provisioning Core
    source: 'public_signup',
  };

  // 4. Delegação exclusiva ao Provisioning Core
  try {
    const result: ProvisionTenantResult = await provisionTenant(input);

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

    console.error('[API Public Signup] Erro inesperado durante o provisionamento:', err?.message || err);
    return sendResponse(res, 500, {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Erro interno no servidor ao processar o cadastro.',
    });
  }
}
