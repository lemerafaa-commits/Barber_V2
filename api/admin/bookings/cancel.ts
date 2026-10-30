import { createRemoteJWKSet, jwtVerify } from 'jose';
import {
  cancelBookingTransaction,
  BookingTransactionError,
  BookingTransactionErrorCode,
  getAdminFirestore,
} from '../../../src/services/firebase/serverDb.js';

const FIREBASE_JWKS_URL = new URL(
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
);
const remoteJWKSet = createRemoteJWKSet(FIREBASE_JWKS_URL);

interface SuccessResponseBody {
  success: true;
  appointmentId: string;
  status: 'cancelled';
  alreadyCancelled: boolean;
  message: string;
}

interface ErrorResponseBody {
  success: false;
  error: BookingTransactionErrorCode | 'METHOD_NOT_ALLOWED' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'INTERNAL_ERROR';
  message: string;
}

/**
 * Utilitário agnóstico para envio de respostas HTTP compatível com
 * Vercel Serverless Functions, Express e Node.js IncomingMessage/ServerResponse.
 */
function sendResponse(
  res: any,
  statusCode: number,
  body: SuccessResponseBody | ErrorResponseBody
) {
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
 * Mapeia erros de negócio de BookingTransactionError para códigos HTTP adequados.
 */
function mapErrorCodeToHttpStatus(code: string): number {
  switch (code) {
    case 'INVALID_DATA':
      return 400;
    case 'UNAUTHORIZED':
      return 401;
    case 'FORBIDDEN':
      return 403;
    case 'APPOINTMENT_NOT_FOUND':
      return 404;
    case 'INVALID_STATUS_TRANSITION':
      return 409;
    case 'FIREBASE_CONFIG_ERROR':
      return 503;
    case 'INTERNAL_ERROR':
    default:
      return 500;
  }
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
        throw new BookingTransactionError('INVALID_DATA', 'Corpo da requisição não é um JSON válido.');
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
        reject(new BookingTransactionError('INVALID_DATA', 'Corpo da requisição não é um JSON válido.'));
      }
    });
    req.on('error', () => {
      reject(new BookingTransactionError('INVALID_DATA', 'Falha ao ler dados da requisição.'));
    });
  });
}

/**
 * Vercel Serverless Function para cancelamento administrativo transacional de reservas.
 * Endpoint: POST /api/admin/bookings/cancel
 *
 * Princípios de Segurança e Integridade (Etapa 1B.3):
 * 1. Exige autenticação administrativa válida via Bearer ID Token do Firebase Auth.
 * 2. Valida criptograficamente a assinatura, emissor e audiência do token com jose.
 * 3. Captura o payload decodificado e avalia autorização exclusivamente via custom claims:
 *    - Master: Autorizado globalmente se payload.master === true.
 *    - Admin local: Exige payload.role === "admin" e payload.businessId válido (string não vazia).
 * 4. Blindagem anti-IDOR/BOLA:
 *    - Rejeita com HTTP 403 se o corpo enviar businessId divergente da claim do admin.
 *    - O businessId da claim verificada é a única fonte autoritativa de isolamento multiempresa.
 * 5. Delega integridade transacional ACID a cancelBookingTransaction(), com validação
 *    autoritativa de pertença e tratamento seguro para reservas legadas sem businessId.
 */
export default async function handler(req: any, res: any) {
  // 1. Validação de Método HTTP (somente POST)
  if (req.method !== 'POST') {
    if (typeof res.setHeader === 'function') {
      res.setHeader('Allow', 'POST');
    }
    return sendResponse(res, 405, {
      success: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'Método não permitido. Utilize POST.',
    });
  }

  // 2. Inicialização do Firebase Admin (se não estiver inicializado)
  try {
    getAdminFirestore();
  } catch (configErr: any) {
    return sendResponse(res, 503, {
      success: false,
      error: 'FIREBASE_CONFIG_ERROR',
      message: 'Serviço temporariamente indisponível (configuração do servidor).',
    });
  }

  // 3. Autenticação Administrativa via Bearer ID Token
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (!authHeader || typeof authHeader !== 'string') {
    return sendResponse(res, 401, {
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Autenticação administrativa necessária para cancelar reservas.',
    });
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match || !match[1]) {
    return sendResponse(res, 401, {
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Cabeçalho Authorization malformado. Formato esperado: Bearer <token>.',
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

  const projectId = process.env.FIREBASE_PROJECT_ID || 'saas-barberaria-teste-v1';

  let tokenPayload: any;
  try {
    const verified = await jwtVerify(idToken, remoteJWKSet, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    tokenPayload = verified.payload;
  } catch {
    return sendResponse(res, 401, {
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Token de autenticação inválido ou expirado.',
    });
  }

  // 4. Extração e validação do corpo da requisição
  let body: any;
  try {
    body = await parseRequestBody(req);
  } catch (parseErr: any) {
    return sendResponse(res, 400, {
      success: false,
      error: 'INVALID_DATA',
      message: parseErr?.message || 'Corpo da requisição inválido.',
    });
  }

  if (!body || typeof body !== 'object') {
    return sendResponse(res, 400, {
      success: false,
      error: 'INVALID_DATA',
      message: 'Corpo da requisição deve ser um objeto JSON.',
    });
  }

  const appointmentId = typeof body.appointmentId === 'string' ? body.appointmentId.trim() : '';
  if (!appointmentId) {
    return sendResponse(res, 400, {
      success: false,
      error: 'INVALID_DATA',
      message: 'Campo "appointmentId" é obrigatório.',
    });
  }

  // 5. Avaliação Autoritativa de Autorização (RBAC & Multi-tenant)
  // Regra Master: Autorizar acesso global exclusivamente via custom claim verificada no JWT
  const isMaster = tokenPayload?.master === true;
  let authorizedBusinessId: string | undefined;

  if (isMaster) {
    // Master possui acesso global. A empresa será resolvida de forma autoritativa no servidor
    // a partir do próprio registro do agendamento, sem confiar em inputs do cliente.
    authorizedBusinessId = undefined;
  } else {
    // Regra Admin local: exige role: "admin" e businessId válido nas custom claims
    const roleClaim = typeof tokenPayload?.role === 'string' ? tokenPayload.role.trim() : '';
    const businessIdClaim = typeof tokenPayload?.businessId === 'string' ? tokenPayload.businessId.trim() : '';

    if (roleClaim !== 'admin') {
      return sendResponse(res, 403, {
        success: false,
        error: 'FORBIDDEN',
        message: 'Acesso negado. Privilégio administrativo necessário para cancelar reservas.',
      });
    }

    if (!businessIdClaim) {
      return sendResponse(res, 403, {
        success: false,
        error: 'FORBIDDEN',
        message: 'Acesso negado. Administrador sem vínculo empresarial (claim businessId ausente ou inválida).',
      });
    }

    // Se o corpo enviou businessId, ele DEVE coincidir exatamente com a claim autoritativa
    if (body.businessId !== undefined && body.businessId !== null) {
      const bodyBusinessId = typeof body.businessId === 'string' ? body.businessId.trim() : '';
      if (bodyBusinessId !== businessIdClaim) {
        return sendResponse(res, 403, {
          success: false,
          error: 'FORBIDDEN',
          message: 'Acesso negado. O businessId informado diverge da empresa vinculada ao administrador.',
        });
      }
    }

    // Usar a claim verificada como fonte autoritativa
    authorizedBusinessId = businessIdClaim;
  }

  // 6. Execução do Cancelamento Transacional
  try {
    const result = await cancelBookingTransaction({
      businessId: authorizedBusinessId,
      appointmentId,
      callerIsMaster: isMaster,
    });

    return sendResponse(res, 200, {
      success: true,
      appointmentId: result.appointmentId,
      status: result.status,
      alreadyCancelled: result.alreadyCancelled,
      message: result.alreadyCancelled
        ? 'Agendamento já se encontrava cancelado.'
        : 'Agendamento cancelado com sucesso.',
    });
  } catch (err: any) {
    if (err instanceof BookingTransactionError) {
      const status = mapErrorCodeToHttpStatus(err.code);
      return sendResponse(res, status, {
        success: false,
        error: err.code,
        message: err.message,
      });
    }

    console.error('[Admin Cancel Endpoint] Erro inesperado ao cancelar agendamento:', err);
    return sendResponse(res, 500, {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Falha interna ao processar o cancelamento.',
    });
  }
}
