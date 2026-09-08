import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;
let adminDb: Firestore | null = null;

// Temporary diagnostic holders (non-sensitive)
let diagProjectId = '';
let diagClientEmail = '';
let diagCredentialSource = '';

export interface RealAppointmentRecord {
  id: string;
  businessId: string;
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  services?: any[];
  totalPrice?: number;
  duration?: number;
  status: string;
  whatsappOptIn?: boolean;
  whatsappNotificationSent?: boolean;
  whatsappNotificationSentAt?: any;
}

/**
 * Initializes and returns the Firebase Admin Firestore instance on the server side.
 * Never imported into client bundles.
 * 
 * Supports:
 * 1. FIREBASE_SERVICE_ACCOUNT (raw JSON string)
 * 2. FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY + FIREBASE_PROJECT_ID
 * 3. Default GCP / ADC initialization with fallback
 */
export function getAdminFirestore(): Firestore {
  if (adminDb) {
    return adminDb;
  }

  const envProjectId = process.env.FIREBASE_PROJECT_ID;
  const defaultProjectId = 'saas-barberaria-teste-v1';
  const projectId = envProjectId || defaultProjectId;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

  const hasPrivateKey = Boolean(process.env.FIREBASE_PRIVATE_KEY);
  const hasServiceAccount = Boolean(serviceAccountJson);

  if (getApps().length > 0) {
    adminApp = getApps()[0];
    diagProjectId = adminApp.options.projectId || projectId;
    diagCredentialSource = 'Existing App Instance (' + adminApp.name + ')';
    diagClientEmail = diagClientEmail || '(already initialized app)';
  } else {
    if (serviceAccountJson) {
      try {
        const parsed = JSON.parse(serviceAccountJson);
        diagCredentialSource = 'FIREBASE_SERVICE_ACCOUNT';
        diagClientEmail = parsed.client_email || '(unknown client_email)';
        diagProjectId = parsed.project_id || projectId;

        adminApp = initializeApp({
          credential: cert(parsed),
          projectId: diagProjectId,
        });
      } catch (err: any) {
        console.error('[Firebase Admin] Error parsing FIREBASE_SERVICE_ACCOUNT JSON:', err?.message);
        throw new Error('FIREBASE_CONFIG_ERROR');
      }
    } else if (clientEmail && privateKey) {
      diagCredentialSource = 'FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY';
      diagClientEmail = clientEmail;
      diagProjectId = projectId;

      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
    } else {
      diagCredentialSource = 'Application Default Credentials';
      diagClientEmail = '(ADC / default environment)';
      diagProjectId = projectId;

      adminApp = initializeApp({ projectId });
    }
  }

  // Diagnostic logs at initialization (strictly non-sensitive)
  console.log('[Firebase Admin Init] Process FIREBASE_PROJECT_ID:', envProjectId || '(not set)');
  console.log('[Firebase Admin Init] FIREBASE_SERVICE_ACCOUNT present:', hasServiceAccount);
  console.log('[Firebase Admin Init] FIREBASE_PRIVATE_KEY present:', hasPrivateKey);
  console.log('[Firebase Admin Init] Credential method used:', diagCredentialSource);
  console.log('[Firebase Admin Init] Client email used:', diagClientEmail);
  console.log('[Firebase Admin Init] ProjectId resolved:', diagProjectId);

  adminDb = getFirestore(adminApp);
  return adminDb;
}

/**
 * Retrieves the REAL appointment from Firestore collection 'appointments'.
 * Uses Firebase Admin SDK to bypass client security rules securely on the server.
 * 
 * Returns null if appointmentId is invalid or document does not exist.
 */
export async function getRealAppointmentById(
  appointmentId: string
): Promise<RealAppointmentRecord | null> {
  if (!appointmentId || typeof appointmentId !== 'string' || appointmentId.trim().length === 0) {
    return null;
  }

  const cleanId = appointmentId.trim();
  // Validate ID format (Firestore IDs are alphanumeric strings, typically 10-40 characters)
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(cleanId)) {
    console.warn(`[Firebase Admin] Invalid appointmentId format: "${cleanId}"`);
    return null;
  }

  try {
    const db = getAdminFirestore();

    // Sanitized diagnostic log immediately before querying Firestore
    console.log(`[Firebase Admin Diagnostic] projectId=${diagProjectId}`);
    console.log(`[Firebase Admin Diagnostic] clientEmail=${diagClientEmail}`);
    console.log(`[Firebase Admin Diagnostic] credentialSource=${diagCredentialSource}`);

    const docRef = db.collection('appointments').doc(cleanId);
    const snap = await docRef.get();

    if (!snap.exists) {
      return null;
    }

    const data = snap.data() || {};
    return {
      id: snap.id,
      businessId: data.businessId || '',
      customerName: data.customerName || '',
      customerPhone: data.customerPhone || '',
      date: data.date || '',
      time: data.time || '',
      services: data.services || [],
      totalPrice: data.totalPrice || 0,
      duration: data.duration || 0,
      status: data.status || 'confirmed',
      whatsappOptIn: data.whatsappOptIn === true,
      whatsappNotificationSent: data.whatsappNotificationSent === true,
      whatsappNotificationSentAt: data.whatsappNotificationSentAt,
    };
  } catch (error: any) {
    console.error(`[Firebase Admin] Failed to fetch appointment ${cleanId}:`, error?.message || error);
    throw error;
  }
}

/**
 * Marks the appointment as having sent WhatsApp confirmation in Firestore.
 * Provides server-side persistent idempotency.
 */
export async function markAppointmentNotificationSent(appointmentId: string): Promise<void> {
  try {
    const db = getAdminFirestore();
    const docRef = db.collection('appointments').doc(appointmentId);
    await docRef.update({
      whatsappNotificationSent: true,
      whatsappNotificationSentAt: new Date().toISOString(),
    });
  } catch (error: any) {
    // Non-critical: Log and continue
    console.warn(`[Firebase Admin] Could not update whatsappNotificationSent on ${appointmentId}:`, error?.message);
  }
}
