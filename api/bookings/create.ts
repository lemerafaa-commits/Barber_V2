import {
  createBookingTransaction,
  CreateBookingTransactionInput,
  BookingTransactionError,
  BookingTransactionErrorCode,
} from '../../src/services/firebase/serverDb.js';

interface ErrorResponseBody {
  success: false;
  error: {
    code: BookingTransactionErrorCode | 'METHOD_NOT_ALLOWED' | 'INTERNAL_ERROR';
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
 * Mapeia erros de negócio tipados de BookingTransactionError para códigos HTTP adequados.
 */
function mapErrorCodeToHttpStatus(code: BookingTransactionErrorCode): number {
  switch (code) {
    case 'INVALID_DATA':
      return 400;
    case 'SERVICE_NOT_FOUND':
    case 'PROFESSIONAL_NOT_FOUND':
      return 404;
    case 'PROFESSIONAL_INACTIVE':
    case 'PROFESSIONAL_NOT_ELIGIBLE':
      return 403;
    case 'SLOT_CONFLICT':
    case 'IDEMPOTENCY_CONFLICT':
      return 409;
    case 'FIREBASE_CONFIG_ERROR':
      return 503;
    case 'INTERNAL_ERROR':
    default:
      return 500;
  }
}

/**
 * Vercel Serverless Function para criação transacional autoritativa de reservas.
 * Endpoint: POST /api/bookings/create
 *
 * Princípios de Segurança e Isolamento:
 * 1. Não confia em preço, duração ou status enviados pelo navegador do cliente.
 * 2. Valida apenas o formato de transporte e contrato HTTP.
 * 3. Delega estritamente a autoridade de persistência, cálculo e concorrência para createBookingTransaction().
 * 4. Protege segredos, credenciais e stack traces contra vazamentos em respostas de erro.
 */
export default async function handler(req: any, res: any) {
  // 1. Restrição estrita de método HTTP: apenas POST é permitido
  if (req.method !== 'POST') {
    if (typeof res.setHeader === 'function') {
      res.setHeader('Allow', ['POST']);
    }
    const errorBody: ErrorResponseBody = {
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Método não permitido. Utilize POST.',
      },
    };
    return sendResponse(res, 405, errorBody);
  }

  // 2. Extração e parsing seguro do corpo JSON
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      const errorBody: ErrorResponseBody = {
        success: false,
        error: {
          code: 'INVALID_DATA',
          message: 'JSON malformado ou inválido no corpo da requisição.',
        },
      };
      return sendResponse(res, 400, errorBody);
    }
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    const errorBody: ErrorResponseBody = {
      success: false,
      error: {
        code: 'INVALID_DATA',
        message: 'O corpo da requisição deve ser um objeto JSON válido.',
      },
    };
    return sendResponse(res, 400, errorBody);
  }

  // 3. Validação do contrato de transporte (presença e tipos básicos)
  const { businessId, serviceIds, professionalId, date, time, clientInfo, clientRequestId } = body;

  if (!businessId || typeof businessId !== 'string' || !businessId.trim()) {
    const errorBody: ErrorResponseBody = {
      success: false,
      error: { code: 'INVALID_DATA', message: 'businessId é obrigatório.' },
    };
    return sendResponse(res, 400, errorBody);
  }

  if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
    const errorBody: ErrorResponseBody = {
      success: false,
      error: {
        code: 'INVALID_DATA',
        message: 'serviceIds deve ser uma lista não vazia com pelo menos um serviço.',
      },
    };
    return sendResponse(res, 400, errorBody);
  }

  if (!professionalId || typeof professionalId !== 'string' || !professionalId.trim()) {
    const errorBody: ErrorResponseBody = {
      success: false,
      error: { code: 'INVALID_DATA', message: 'professionalId é obrigatório.' },
    };
    return sendResponse(res, 400, errorBody);
  }

  if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
    const errorBody: ErrorResponseBody = {
      success: false,
      error: { code: 'INVALID_DATA', message: 'date deve estar no formato YYYY-MM-DD.' },
    };
    return sendResponse(res, 400, errorBody);
  }

  if (!time || typeof time !== 'string' || !/^\d{2}:\d{2}$/.test(time.trim())) {
    const errorBody: ErrorResponseBody = {
      success: false,
      error: { code: 'INVALID_DATA', message: 'time deve estar no formato HH:mm.' },
    };
    return sendResponse(res, 400, errorBody);
  }

  if (
    !clientInfo ||
    typeof clientInfo !== 'object' ||
    typeof clientInfo.name !== 'string' ||
    clientInfo.name.trim().length < 2 ||
    typeof clientInfo.phone !== 'string' ||
    clientInfo.phone.trim().length < 8
  ) {
    const errorBody: ErrorResponseBody = {
      success: false,
      error: {
        code: 'INVALID_DATA',
        message:
          'clientInfo deve conter name (mínimo 2 caracteres) e phone (mínimo 8 caracteres).',
      },
    };
    return sendResponse(res, 400, errorBody);
  }

  if (
    !clientRequestId ||
    typeof clientRequestId !== 'string' ||
    clientRequestId.trim().length < 8
  ) {
    const errorBody: ErrorResponseBody = {
      success: false,
      error: {
        code: 'INVALID_DATA',
        message:
          'clientRequestId é obrigatório (mínimo 8 caracteres) para garantia de idempotência.',
      },
    };
    return sendResponse(res, 400, errorBody);
  }

  // 4. Montagem segura do payload (rejeita e ignora quaisquer preços, durações ou IDs forjados)
  const transactionInput: CreateBookingTransactionInput = {
    businessId: businessId.trim(),
    serviceIds: serviceIds.map((s: any) => String(s).trim()).filter(Boolean),
    professionalId: professionalId.trim(),
    date: date.trim(),
    time: time.trim(),
    clientInfo: {
      name: clientInfo.name.trim(),
      phone: clientInfo.phone.trim(),
      whatsappOptIn: clientInfo.whatsappOptIn === true,
    },
    clientRequestId: clientRequestId.trim(),
  };

  // 5. Execução do núcleo transacional
  try {
    const result = await createBookingTransaction(transactionInput);

    // Se for replay idempotente de agendamento já existente, responde HTTP 200.
    // Se for nova reserva criada atomicamente com sucesso, responde HTTP 201.
    const statusCode = result.isIdempotentReplay ? 200 : 201;

    return sendResponse(res, statusCode, {
      success: true,
      isIdempotentReplay: result.isIdempotentReplay,
      appointment: result.appointment,
    });
  } catch (err: any) {
    if (err instanceof BookingTransactionError) {
      const statusCode = mapErrorCodeToHttpStatus(err.code);
      const errorBody: ErrorResponseBody = {
        success: false,
        error: {
          code: err.code,
          message: err.message,
        },
      };
      return sendResponse(res, statusCode, errorBody);
    }

    // Tratamento defensivo de erros inesperados: sem vazar stack trace ou detalhes internos
    console.error('[API /api/bookings/create] Erro inesperado:', err?.message || err);
    const errorBody: ErrorResponseBody = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ocorreu um erro interno no servidor ao processar o agendamento.',
      },
    };
    return sendResponse(res, 500, errorBody);
  }
}
