import React, { useState, useEffect, useMemo } from 'react';
import { MinimalHeader } from './components/MinimalHeader';
import { ProgressBar } from './components/ProgressBar';
import { ServiceSelector } from './components/ServiceSelector';
import { DateAndTimeSelector } from './components/DateAndTimeSelector';
import { CustomerForm } from './components/CustomerForm';
import { BookingConfirmation } from './components/BookingConfirmation';
import { ProfessionalSelector } from './components/ProfessionalSelector';
import { BarbershopInfoFooter } from './components/BarbershopInfoFooter';
import { DevEdgeCasesModal } from './components/DevEdgeCasesModal';
import { ProductionConfigError } from './components/common/ProductionConfigError';
import { BusinessRouteError } from './components/common/BusinessRouteError';
import { ChunkErrorBoundary } from './components/common/ChunkErrorBoundary';

// Carregamento sob demanda (Code Splitting) dos módulos administrativos e master (P1).
// Garante isolamento estrito: visitantes na rota pública ('/' e '/b/:slug') NUNCA
// transferem os pacotes de AdminDashboard, MasterDashboard ou suas dependências internas.
const AdminDashboard = React.lazy(() =>
  import('./components/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);
const AdminLogin = React.lazy(() =>
  import('./components/admin/AdminLogin').then((m) => ({ default: m.AdminLogin }))
);
const AdminAccessDenied = React.lazy(() =>
  import('./components/admin/AdminAccessDenied').then((m) => ({ default: m.AdminAccessDenied }))
);
const MasterDashboard = React.lazy(() =>
  import('./components/master/MasterDashboard').then((m) => ({ default: m.MasterDashboard }))
);
const MasterLogin = React.lazy(() =>
  import('./components/master/MasterLogin').then((m) => ({ default: m.MasterLogin }))
);
const MasterAccessDenied = React.lazy(() =>
  import('./components/master/MasterAccessDenied').then((m) => ({ default: m.MasterAccessDenied }))
);
import { User } from 'firebase/auth';
import { subscribeToAuthChanges, signOutAdmin, verifyAdminPrivilege } from './services/firebase/auth';
import { isAuthorizedMasterUser } from './services/master/masterAuthService';
import { isFirebaseConfigured } from './services/firebase/config';
import { Loader2 } from 'lucide-react';

import {
  BookingState,
  StepNumber,
  Service,
  ServiceCategory,
  ServiceOption,
  DayOption,
  Appointment,
  Barbershop,
  Professional
} from './types/booking';
import { MOCK_BARBERSHOP, MOCK_PROFESSIONALS, MOCK_SERVICE_CATEGORIES } from './data/mockData';
import {
  getUpcomingDays,
  getAvailableTimeSlots,
  createBooking
} from './services/bookingData';
import {
  getFirestoreAppointmentsByDate,
  FirestoreAppointmentRecord
} from './services/firebase/appointments';
import {
  loadBusinessProfile,
  businessProfileToBarbershop,
  DEFAULT_BUSINESS_PROFILE
} from './services/businessProfileData';
import { DEFAULT_SERVICE_CATEGORIES } from './services/adminServiceDomain';
import {
  calculateTotalEffectiveDuration,
  extractCandidateServiceIds
} from './utils/duration';
import { triggerWhatsAppConfirmation } from './services/notifications/clientNotification';

/**
 * Converte serviços reais retornados pela API /api/public/catalog em ServiceCategory[]
 * para a interface pública de agendamento.
 *
 * Regras estritas:
 * 1. Cada serviço do Firestore vira uma opção diretamente com seu Document ID real (option.id = service.id).
 * 2. NUNCA deduplica serviços por nome (serviços com mesmo nome e IDs distintos são preservados).
 * 3. NUNCA concatena ou altera os IDs reais.
 */
function publicCatalogToBookingCategories(
  services: {
    id: string;
    name: string;
    categoryId?: string;
    categoryName?: string;
    description?: string;
    price: number;
    durationMinutes: number;
    active?: boolean;
  }[]
): ServiceCategory[] {
  const activeServices = services.filter((s) => s.active !== false);
  if (activeServices.length === 0) return [];

  const categoryGroups = new Map<string, typeof services>();
  for (const s of activeServices) {
    const catId = s.categoryId || 'cabelo';
    const list = categoryGroups.get(catId) || [];
    list.push(s);
    categoryGroups.set(catId, list);
  }

  const result: ServiceCategory[] = [];

  for (const [catId, group] of categoryGroups.entries()) {
    const def = DEFAULT_SERVICE_CATEGORIES.find((c) => c.id === catId);
    const catName = def?.name || group[0]?.categoryName || catId;
    const catDesc = def?.description || group[0]?.description || 'Serviços especializados';
    const iconName = def?.iconName || (catId === 'barba' ? 'Razor' : catId === 'combo' ? 'Sparkles' : 'Scissors');

    const options: ServiceOption[] = group.map((s) => ({
      id: s.id, // O ID REAL CANÔNICO DO FIRESTORE!
      name: s.name,
      priceOverride: typeof s.price === 'number' ? s.price : Number(s.price) || 0,
      durationOverride: typeof s.durationMinutes === 'number' ? s.durationMinutes : Number(s.durationMinutes) || 30,
    }));

    const sortedByPrice = [...group].sort((a, b) => a.price - b.price);
    const baseService = sortedByPrice[0];

    result.push({
      id: catId,
      name: catName,
      description: catDesc,
      durationMinutes: baseService.durationMinutes,
      price: baseService.price,
      iconName,
      popular: catId === 'combo',
      options,
    });
  }

  result.sort((a, b) => {
    const indexA = DEFAULT_SERVICE_CATEGORIES.findIndex((c) => c.id === a.id);
    const indexB = DEFAULT_SERVICE_CATEGORIES.findIndex((c) => c.id === b.id);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.name.localeCompare(b.name, 'pt-BR');
  });

  return result;
}

export default function App() {
  // Simple SPA path router state
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // Identificação e validação da rota pública dinâmica /b/:slug
  const slugMatch = currentPath.match(/^\/b\/([^/?#]+)/i);
  let routeSlug: string | null = null;
  let isMalformedSlug = false;
  if (slugMatch) {
    try {
      routeSlug = decodeURIComponent(slugMatch[1]).trim();
    } catch {
      isMalformedSlug = true;
      routeSlug = null;
    }
  }
  const isSlugRoute = Boolean(slugMatch);

  // Status de carregamento e integridade da rota
  const [routeStatus, setRouteStatus] = useState<
    'loading' | 'success' | 'not_found' | 'invalid_slug' | 'server_error' | 'empty_catalog'
  >('loading');
  const [routeErrorMessage, setRouteErrorMessage] = useState<string | null>(null);
  const [activeBusinessId, setActiveBusinessId] = useState<string>('joao-barber');

  // Firebase Auth state for protected admin and master access
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [isMasterAuthorized, setIsMasterAuthorized] = useState<boolean>(false);
  const [isMasterAuthChecking, setIsMasterAuthChecking] = useState<boolean>(true);
  const [isAdminAuthorized, setIsAdminAuthorized] = useState<boolean>(false);
  const [isAdminAuthChecking, setIsAdminAuthChecking] = useState<boolean>(true);
  const [adminBusinessId, setAdminBusinessId] = useState<string | null>(null);

  useEffect(() => {
    let isSubscribed = true;

    const unsubscribe = subscribeToAuthChanges(async (user) => {
      setAdminUser(user);
      setIsAuthChecking(false);

      if (user) {
        setIsMasterAuthChecking(true);
        setIsAdminAuthChecking(true);
        try {
          const [masterAuth, adminIdentity] = await Promise.all([
            isAuthorizedMasterUser(user),
            verifyAdminPrivilege(user),
          ]);
          if (isSubscribed) {
            setIsMasterAuthorized(masterAuth);
            setIsAdminAuthorized(Boolean(adminIdentity?.isAdmin));
            setAdminBusinessId(adminIdentity?.businessId || null);
          }
        } catch (err) {
          console.warn('[Auth] Falha ao verificar autorização do usuário:', err);
          if (isSubscribed) {
            setIsMasterAuthorized(false);
            setIsAdminAuthorized(false);
            setAdminBusinessId(null);
          }
        } finally {
          if (isSubscribed) {
            setIsMasterAuthChecking(false);
            setIsAdminAuthChecking(false);
          }
        }
      } else {
        if (isSubscribed) {
          setIsMasterAuthorized(false);
          setIsMasterAuthChecking(false);
          setIsAdminAuthorized(false);
          setIsAdminAuthChecking(false);
          setAdminBusinessId(null);
        }
      }
    });

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, []);

  // Current active step in progressive disclosure (1: Service, 2: Date & Time, 3: Customer Data)
  const [currentStep, setCurrentStep] = useState<StepNumber>(1);

  // Dynamic Barbershop info fetched from Firestore (with resilient fallback)
  const [barbershop, setBarbershop] = useState<Barbershop>(() =>
    businessProfileToBarbershop(DEFAULT_BUSINESS_PROFILE)
  );

  // Dynamic Service categories fetched from Firestore
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>(MOCK_SERVICE_CATEGORIES);
  const [isLoadingServices, setIsLoadingServices] = useState<boolean>(false);

  // Active professionals fetched from Firestore
  const [professionals, setProfessionals] = useState<Professional[]>(MOCK_PROFESSIONALS);
  const [isLoadingProfessionals, setIsLoadingProfessionals] = useState<boolean>(true);

  // Carregamento autoritativo do catálogo e perfil conforme a rota acessada
  const loadRouteCatalog = async () => {
    setIsLoadingServices(true);
    setIsLoadingProfessionals(true);
    setRouteErrorMessage(null);

    // CASO 1: Rota dinâmica pública /b/:slug
    if (isSlugRoute) {
      if (isMalformedSlug || !routeSlug || !/^[a-zA-Z0-9_-]{1,64}$/.test(routeSlug)) {
        setRouteStatus('invalid_slug');
        setIsLoadingServices(false);
        setIsLoadingProfessionals(false);
        return;
      }

      setRouteStatus('loading');

      try {
        const response = await fetch(`/api/public/catalog?slug=${encodeURIComponent(routeSlug)}`);

        if (response.status === 404) {
          // ESTABELECIMENTO NÃO ENCONTRADO: NUNCA SUBSTITUIR SILENCIOSAMENTE PELA JOÃO BARBER!
          setRouteStatus('not_found');
          return;
        }

        if (response.status === 400) {
          setRouteStatus('invalid_slug');
          return;
        }

        if (!response.ok) {
          throw new Error(`Falha no servidor (${response.status})`);
        }

        const data = await response.json();
        if (!data.success || !data.catalog) {
          throw new Error(data.error?.message || 'Resposta de catálogo inválida');
        }

        const { businessId, profile, services: apiServices, professionals: apiProfessionals } = data.catalog;

        setActiveBusinessId(businessId);

        // 1. Integrar Perfil da Barbearia
        if (profile) {
          setBarbershop(businessProfileToBarbershop(profile, businessId));
        } else {
          setBarbershop(businessProfileToBarbershop({
            name: routeSlug.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            description: 'Barbearia especializada com atendimento de excelência.',
            logoUrl: DEFAULT_BUSINESS_PROFILE.logoUrl,
            whatsapp: '',
            instagram: '',
            address: { street: '', number: '', neighborhood: '', city: 'Poços de Caldas', state: 'MG' },
            openingHours: DEFAULT_BUSINESS_PROFILE.openingHours,
          }, businessId));
        }

        // 2. Integrar Serviços Reais
        if (Array.isArray(apiServices) && apiServices.length > 0) {
          const categories = publicCatalogToBookingCategories(apiServices);
          if (categories.length > 0) {
            setServiceCategories(categories);
          } else {
            setRouteStatus('empty_catalog');
            return;
          }
        } else {
          setServiceCategories([]);
          setRouteStatus('empty_catalog');
          return;
        }

        // 3. Integrar Profissionais Reais
        if (Array.isArray(apiProfessionals) && apiProfessionals.length > 0) {
          const mapped: Professional[] = apiProfessionals.map((b: any) => ({
            id: b.id,
            name: b.name,
            role: 'Barbeiro Especialista',
            avatarUrl: b.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250',
            isAvailable: true,
            serviceMode: b.serviceMode || 'all',
            serviceIds: Array.isArray(b.serviceIds) ? b.serviceIds : [],
            serviceConfigs: Array.isArray(b.serviceConfigs) ? b.serviceConfigs : [],
            schedule: Array.isArray(b.schedule) ? b.schedule : [],
          } as any));
          setProfessionals(mapped);
        } else {
          setProfessionals([]);
        }

        setRouteStatus('success');
      } catch (err: any) {
        console.error('[App] Erro ao carregar rota /b/:slug:', err);
        setRouteErrorMessage(err?.message || 'Não foi possível carregar as informações do estabelecimento.');
        setRouteStatus('server_error');
      } finally {
        setIsLoadingServices(false);
        setIsLoadingProfessionals(false);
      }
      return;
    }

    // CASO 2: Rota raiz "/" (João Barber - compatibilidade legada)
    setRouteStatus('loading');
    setActiveBusinessId('joao-barber');
    try {
      // 1. Carregar perfil da João Barber
      try {
        const profile = await loadBusinessProfile('joao-barber');
        setBarbershop(businessProfileToBarbershop(profile, 'joao-barber'));
      } catch (profErr) {
        console.warn('[App] Usando perfil padrão para João Barber:', profErr);
        setBarbershop(businessProfileToBarbershop(DEFAULT_BUSINESS_PROFILE, 'joao-barber'));
      }

      // 2. Carregar catálogo público da João Barber
      const response = await fetch('/api/public/catalog');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.catalog) {
          const { services: apiServices, professionals: apiProfessionals } = data.catalog;
          if (Array.isArray(apiServices) && apiServices.length > 0) {
            const categories = publicCatalogToBookingCategories(apiServices);
            if (categories.length > 0) {
              setServiceCategories(categories);
            }
          }
          if (Array.isArray(apiProfessionals) && apiProfessionals.length > 0) {
            const mapped: Professional[] = apiProfessionals.map((b: any) => ({
              id: b.id,
              name: b.name,
              role: b.id.includes('joao') ? 'Barbeiro Líder' : 'Barbeiro Especialista',
              avatarUrl: b.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250',
              isAvailable: true,
              serviceMode: b.serviceMode || 'all',
              serviceIds: Array.isArray(b.serviceIds) ? b.serviceIds : [],
              serviceConfigs: Array.isArray(b.serviceConfigs) ? b.serviceConfigs : [],
              schedule: Array.isArray(b.schedule) ? b.schedule : [],
            } as any));
            setProfessionals(mapped);
          }
        }
      } else {
        // Fallback demo mode para raiz caso API esteja indisponível
        setServiceCategories(MOCK_SERVICE_CATEGORIES);
        setProfessionals(MOCK_PROFESSIONALS);
      }
      setRouteStatus('success');
    } catch (err: any) {
      console.warn('[App] Fallback resiliente para João Barber na raiz:', err?.message || err);
      setServiceCategories(MOCK_SERVICE_CATEGORIES);
      setProfessionals(MOCK_PROFESSIONALS);
      setRouteStatus('success');
    } finally {
      setIsLoadingServices(false);
      setIsLoadingProfessionals(false);
    }
  };

  useEffect(() => {
    loadRouteCatalog();
  }, [currentPath]);



  // Dev state for edge case testing
  const [simulateConflict, setSimulateConflict] = useState(false);
  const [fullyBookedMode, setFullyBookedMode] = useState(false);

  // Booking details state
  const [bookingState, setBookingState] = useState<BookingState>({
    services: [],
    service: null,
    professional: MOCK_PROFESSIONALS[0], // Auto assigned default professional
    isAnyProfessional: false,
    selectedDate: null,
    selectedTime: null,
    clientInfo: {
      name: '',
      phone: '',
      whatsappOptIn: false,
    },
  });

  // Filter professionals eligible for all selected services
  const eligibleProfessionals = useMemo(() => {
    if (!bookingState.services || bookingState.services.length === 0) {
      return professionals;
    }

    return professionals.filter((prof) => {
      const barber = prof as any;
      // Se atende todos os serviços
      if (barber.serviceMode === 'all' || !barber.serviceMode) {
        return true;
      }

      // Se atende apenas serviços específicos
      const allowedIds = new Set(barber.serviceIds || []);
      if (allowedIds.size === 0) {
        return true;
      }
      return bookingState.services.every((svc) => {
        const candidates = extractCandidateServiceIds(svc);
        if (svc.id) candidates.push(svc.id);
        if (svc.name) candidates.push(svc.name);
        return candidates.some((cId) => allowedIds.has(cId));
      });
    });
  }, [professionals, bookingState.services]);

  // Keep bookingState.professional in sync with eligible professionals
  useEffect(() => {
    if (eligibleProfessionals.length > 0) {
      const isCurrentEligible = eligibleProfessionals.some(
        (p) => p.id === bookingState.professional?.id
      );
      if (!isCurrentEligible) {
        setBookingState((prev) => ({
          ...prev,
          professional: eligibleProfessionals[0],
          isAnyProfessional: false,
          selectedTime: null,
        }));
      }
    } else {
      setBookingState((prev) => ({
        ...prev,
        professional: null,
        isAnyProfessional: false,
        selectedTime: null,
      }));
    }
  }, [eligibleProfessionals]);

  // Real Firestore appointments for the selected date
  const [dayAppointments, setDayAppointments] = useState<FirestoreAppointmentRecord[]>([]);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState<boolean>(false);
  const [timeSlotsError, setTimeSlotsError] = useState<string | null>(null);

  // Flow status state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slotConflictError, setSlotConflictError] = useState(false);
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(null);
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);

  // Auto scroll to top on step transitions
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep, confirmedAppointment]);

  // Available days (next 14 days)
  const upcomingDays = useMemo(() => getUpcomingDays(14), []);

  // Set default date to first available day if none selected
  useEffect(() => {
    if (!bookingState.selectedDate && upcomingDays.length > 0) {
      const firstAvail = upcomingDays.find((d) => d.isAvailable) || upcomingDays[0];
      setBookingState((prev) => ({ ...prev, selectedDate: firstAvail }));
    }
  }, [upcomingDays, bookingState.selectedDate]);

  // Fetch Firestore appointments whenever selected date changes
  const fetchDayAppointments = async (dateStr: string) => {
    setIsLoadingTimeSlots(true);
    setTimeSlotsError(null);
    try {
      const records = await getFirestoreAppointmentsByDate(dateStr, activeBusinessId);
      setDayAppointments(records);
    } catch (err) {
      console.warn('Utilizando horários disponíveis padrão para agendamento:', err);
      setTimeSlotsError(null);
      setDayAppointments([]);
    } finally {
      setIsLoadingTimeSlots(false);
    }
  };

  useEffect(() => {
    if (bookingState.selectedDate) {
      fetchDayAppointments(bookingState.selectedDate.dateString);
    } else {
      setDayAppointments([]);
    }
  }, [bookingState.selectedDate?.dateString, activeBusinessId]);

  // Total duration of all selected services
  const totalDurationMinutes = useMemo(() => {
    if (!bookingState.services || bookingState.services.length === 0) return 30;
    return calculateTotalEffectiveDuration(bookingState.services, bookingState.professional as any);
  }, [bookingState.services, bookingState.professional]);

  // Compute available time slots for chosen date, appointments, total duration, and selected professional
  const availableTimeSlots = useMemo(() => {
    if (!bookingState.selectedDate) return [];
    const profSchedule = (bookingState.professional as any)?.schedule || null;
    const profId = bookingState.professional?.id || null;

    return getAvailableTimeSlots(
      bookingState.selectedDate.dateString,
      dayAppointments,
      totalDurationMinutes,
      fullyBookedMode,
      profSchedule,
      profId
    );
  }, [
    bookingState.selectedDate,
    dayAppointments,
    totalDurationMinutes,
    fullyBookedMode,
    bookingState.professional
  ]);

  // Deselect time if it becomes unavailable due to service duration changes or new appointments
  useEffect(() => {
    if (bookingState.selectedTime && availableTimeSlots.length > 0) {
      const slot = availableTimeSlots.find((s) => s.time === bookingState.selectedTime);
      if (slot && !slot.available) {
        setBookingState((prev) => ({ ...prev, selectedTime: null }));
      }
    }
  }, [availableTimeSlots, bookingState.selectedTime]);

  // Handler for service selection (Multi-select across categories, single-select inside category)
  const handleToggleService = (category: any, option: any) => {
    setBookingState((prev) => {
      const existingIndex = prev.services.findIndex((s) => s.categoryId === category.id);

      const newService: Service = {
        id: option.id, // Preservar exatamente o ID real do documento Firestore
        categoryId: category.id,
        name: category.name,
        selectedOption: option.name,
        price: option.priceOverride ?? category.price,
        durationMinutes: option.durationOverride ?? category.durationMinutes,
        description: category.description,
        iconName: category.iconName,
        popular: category.popular,
      };

      let updatedServices: Service[] = [];

      if (existingIndex >= 0) {
        const existingService = prev.services[existingIndex];
        if (existingService.selectedOption === option.name) {
          // Toggle off if clicking the already selected option
          updatedServices = prev.services.filter((_, idx) => idx !== existingIndex);
        } else {
          // Replace option within same category
          updatedServices = [...prev.services];
          updatedServices[existingIndex] = newService;
        }
      } else {
        // Add new category selection
        updatedServices = [...prev.services, newService];
      }

      return {
        ...prev,
        services: updatedServices,
        service: updatedServices[0] || null,
      };
    });
    setSlotConflictError(false);
  };

  const handleSelectProfessional = (prof: Professional) => {
    setBookingState((prev) => ({
      ...prev,
      professional: prof,
      isAnyProfessional: false,
      selectedTime: null, // Reset time because new professional has different availability
    }));
    setSlotConflictError(false);
  };

  const handleSelectDate = (day: DayOption) => {
    setBookingState((prev) => ({
      ...prev,
      selectedDate: day,
      selectedTime: null, // Reset time on date change
    }));
    setSlotConflictError(false);
  };

  const handleSelectTime = (time: string) => {
    setBookingState((prev) => ({
      ...prev,
      selectedTime: time,
    }));
    setSlotConflictError(false);
  };

  const handleClientInfoChange = (info: { name: string; phone: string }) => {
    setBookingState((prev) => ({
      ...prev,
      clientInfo: info,
    }));
  };

  // Back step navigation
  const handleBackStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as StepNumber);
    }
  };

  // Direct jump to step (e.g. from summary or progress bar)
  const handleJumpToStep = (step: StepNumber) => {
    setCurrentStep(step);
  };

  const canJumpToStep = (step: StepNumber): boolean => {
    if (step === 1) return true;
    if (step === 2) return bookingState.services.length > 0;
    if (step === 3) {
      return (
        bookingState.services.length > 0 &&
        Boolean(bookingState.selectedDate) &&
        Boolean(bookingState.selectedTime) &&
        Boolean(bookingState.professional)
      );
    }
    return false;
  };

  // Submit appointment handler
  const handleConfirmAppointment = async () => {
    if (
      bookingState.services.length === 0 ||
      !bookingState.selectedDate ||
      !bookingState.selectedTime
    ) {
      return;
    }

    setIsSubmitting(true);
    setSlotConflictError(false);
    setSubmitErrorMessage(null);

    try {
      const appointment = await createBooking({
        businessId: activeBusinessId,
        services: bookingState.services,
        service: bookingState.service,
        professional: bookingState.professional || MOCK_PROFESSIONALS[0],
        selectedDate: bookingState.selectedDate,
        selectedTime: bookingState.selectedTime,
        clientInfo: bookingState.clientInfo,
        simulateConflict,
        simulateDelayMs: 1200,
      });

      setConfirmedAppointment(appointment);

      // Refetch day appointments immediately after successful creation so availability updates in real time
      if (bookingState.selectedDate) {
        await fetchDayAppointments(bookingState.selectedDate.dateString);
      }

      // Asynchronously trigger WhatsApp confirmation (100% isolated & non-blocking)
      // Any failure here is caught inside triggerWhatsAppConfirmation and will NEVER disrupt the appointment
      triggerWhatsAppConfirmation(appointment).catch((notifErr) => {
        console.warn('[WhatsApp] Non-blocking dispatch notice:', notifErr);
      });
    } catch (err: any) {
      if (err?.message === 'SLOT_CONFLICT') {
        setSlotConflictError(true);
        // Refresh day appointments immediately so new conflicts show up
        if (bookingState.selectedDate) {
          fetchDayAppointments(bookingState.selectedDate.dateString);
        }
        // Jump back to date/time step so user can choose another time
        setCurrentStep(2);
        setBookingState((prev) => ({ ...prev, selectedTime: null }));
      } else {
        setSubmitErrorMessage('Não foi possível confirmar seu agendamento no momento. Por favor, tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset booking state to start over
  const handleReset = () => {
    setConfirmedAppointment(null);
    setCurrentStep(1);
    setSlotConflictError(false);
    setSubmitErrorMessage(null);
    setBookingState({
      services: [],
      service: null,
      professional: MOCK_PROFESSIONALS[0],
      isAnyProfessional: true,
      selectedDate: upcomingDays.find((d) => d.isAvailable) || null,
      selectedTime: null,
      clientInfo: { name: '', phone: '', whatsappOptIn: false },
    });
  };

  // Render Admin space if path is /admin
  if (currentPath.startsWith('/admin')) {
    // Quando o Firebase está configurado no ambiente (Produção / Staging),
    // o acesso é estritamente protegido pelo Firebase Authentication com Custom Claims (SEC-01).
    if (isFirebaseConfigured) {
      if (isAuthChecking || isAdminAuthChecking) {
        return (
          <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            <span className="text-xs text-zinc-400 font-medium">Validando privilégios administrativos...</span>
          </div>
        );
      }

      if (!adminUser) {
        return (
          <ChunkErrorBoundary fallbackTitle="Erro ao carregar Login Administrativo" onGoHome={() => navigateTo('/')}>
            <React.Suspense
              fallback={
                <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                  <span className="text-xs text-zinc-400 font-medium">Carregando tela de login...</span>
                </div>
              }
            >
              <AdminLogin
                onLoginSuccess={() => {
                  // Transição de estado acionada automaticamente por onAuthStateChanged
                }}
                onGoToPublicPage={() => navigateTo('/')}
              />
            </React.Suspense>
          </ChunkErrorBoundary>
        );
      }

      // Usuário autenticado, mas NÃO possui privilégios de Admin (role === 'admin' e businessId válido)
      if (!isAdminAuthorized) {
        return (
          <ChunkErrorBoundary fallbackTitle="Erro ao carregar Módulo Administrativo" onGoHome={() => navigateTo('/')}>
            <React.Suspense
              fallback={
                <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                  <span className="text-xs text-zinc-400 font-medium">Carregando...</span>
                </div>
              }
            >
              <AdminAccessDenied
                userEmail={adminUser.email}
                isMaster={isMasterAuthorized}
                onLogout={async () => {
                  try {
                    await signOutAdmin();
                  } catch (e) {
                    console.error('[Admin] Erro ao encerrar sessão:', e);
                  }
                }}
                onGoToMasterPage={() => navigateTo('/master')}
                onGoToPublicPage={() => navigateTo('/')}
                onRefreshPermissions={async () => {
                  try {
                    const identity = await verifyAdminPrivilege(adminUser, true);
                    const isAuth = Boolean(identity?.isAdmin);
                    setIsAdminAuthorized(isAuth);
                    setAdminBusinessId(identity?.businessId || null);
                    return isAuth;
                  } catch (err) {
                    console.warn('[AdminAuth] Erro ao recarregar claims do usuário:', err);
                    return false;
                  }
                }}
              />
            </React.Suspense>
          </ChunkErrorBoundary>
        );
      }

      return (
        <ChunkErrorBoundary fallbackTitle="Erro ao carregar o Painel Administrativo" onGoHome={() => navigateTo('/')}>
          <React.Suspense
            fallback={
              <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                <span className="text-xs text-zinc-400 font-medium">Carregando painel administrativo...</span>
              </div>
            }
          >
            <AdminDashboard
              businessId={adminBusinessId || 'joao-barber'}
              onGoToPublicPage={() => navigateTo('/')}
              onLogout={() => {
                // Handled via onAuthStateChanged, user state resets to null
              }}
            />
          </React.Suspense>
        </ChunkErrorBoundary>
      );
    }

    // Em build de produção (PROD), caso o Firebase não esteja configurado,
    // o acesso administrativo em modo Mock é sumariamente BLOQUEADO.
    if (!isFirebaseConfigured) {
      if (import.meta.env.PROD) {
        return (
          <ProductionConfigError
            title="Painel Administrativo Indisponível"
            description="Os serviços de autenticação e banco de dados em nuvem não foram inicializados para este ambiente de produção. Por segurança estrita, o acesso administrativo permanece bloqueado até a conclusão da configuração das variáveis de ambiente."
            onGoHome={() => navigateTo('/')}
          />
        );
      }

      // Modo Demonstração exclusivo para ambiente onde o Firebase não está configurado (Preview do Google AI Studio)
      return (
        <ChunkErrorBoundary fallbackTitle="Erro ao carregar o Painel Administrativo" onGoHome={() => navigateTo('/')}>
          <React.Suspense
            fallback={
              <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                <span className="text-xs text-zinc-400 font-medium">Carregando painel administrativo (Demo)...</span>
              </div>
            }
          >
            <AdminDashboard
              onGoToPublicPage={() => navigateTo('/')}
              onLogout={() => navigateTo('/')}
            />
          </React.Suspense>
        </ChunkErrorBoundary>
      );
    }
  }

  // Render Master Dashboard if path is /master (Área Restrita do Superadministrador)
  if (currentPath.startsWith('/master')) {
    // Quando o Firebase está configurado no ambiente (Produção / Staging),
    // o acesso ao SaaS Master é estritamente autenticado e autorizado.
    if (isFirebaseConfigured) {
      if (isAuthChecking || isMasterAuthChecking) {
        return (
          <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <span className="text-xs text-zinc-400 font-medium">Validando privilégios de Superadministrador...</span>
          </div>
        );
      }

      // Caso 1: Usuário não autenticado no Firebase Auth -> Exibe Login do Master
      if (!adminUser) {
        return (
          <ChunkErrorBoundary fallbackTitle="Erro ao carregar Login do Superadministrador" onGoHome={() => navigateTo('/')}>
            <React.Suspense
              fallback={
                <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  <span className="text-xs text-zinc-400 font-medium">Carregando login do Superadministrador...</span>
                </div>
              }
            >
              <MasterLogin
                onLoginSuccess={() => {
                  // Transição automática disparada via onAuthStateChanged
                }}
                onGoToPublicPage={() => navigateTo('/')}
                onGoToAdminPage={() => navigateTo('/admin')}
              />
            </React.Suspense>
          </ChunkErrorBoundary>
        );
      }

      // Caso 2: Usuário autenticado, mas NÃO possui privilégios de Master (ex: barbeiro comum) -> Tela 403 amigável
      if (!isMasterAuthorized) {
        return (
          <ChunkErrorBoundary fallbackTitle="Erro ao carregar Módulo Master" onGoHome={() => navigateTo('/')}>
            <React.Suspense
              fallback={
                <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  <span className="text-xs text-zinc-400 font-medium">Carregando...</span>
                </div>
              }
            >
              <MasterAccessDenied
                userEmail={adminUser.email}
                onLogout={async () => {
                  try {
                    await signOutAdmin();
                  } catch (e) {
                    console.error('[Master] Erro ao encerrar sessão:', e);
                  }
                }}
                onGoToAdminPage={() => navigateTo('/admin')}
                onGoToPublicPage={() => navigateTo('/')}
                onRefreshPermissions={async () => {
                  try {
                    const authorized = await isAuthorizedMasterUser(adminUser, true);
                    setIsMasterAuthorized(authorized);
                    return authorized;
                  } catch (err) {
                    console.warn('[MasterAuth] Erro ao recarregar claims do usuário:', err);
                    return false;
                  }
                }}
              />
            </React.Suspense>
          </ChunkErrorBoundary>
        );
      }

      // Caso 3: Autenticado e plenamente autorizado como Superadmin Master -> Renderiza MasterDashboard
      return (
        <ChunkErrorBoundary fallbackTitle="Erro ao carregar o Painel Master" onGoHome={() => navigateTo('/')}>
          <React.Suspense
            fallback={
              <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <span className="text-xs text-zinc-400 font-medium">Carregando painel do Superadministrador...</span>
              </div>
            }
          >
            <MasterDashboard
              onNavigateHome={() => navigateTo('/')}
              onNavigateAdmin={() => navigateTo('/admin')}
              onLogout={async () => {
                try {
                  await signOutAdmin();
                } catch (e) {
                  console.error('[Master] Erro ao encerrar sessão:', e);
                }
              }}
            />
          </React.Suspense>
        </ChunkErrorBoundary>
      );
    }

    // Em build de produção (PROD), caso o Firebase não esteja configurado,
    // o acesso Master em modo Mock é sumariamente BLOQUEADO.
    if (!isFirebaseConfigured) {
      if (import.meta.env.PROD) {
        return (
          <ProductionConfigError
            title="Painel Master Indisponível"
            description="Os serviços de autenticação e banco de dados em nuvem não foram inicializados para este ambiente de produção. Por segurança estrita, o acesso ao painel Master permanece bloqueado até a conclusão da configuração das variáveis de ambiente."
            onGoHome={() => navigateTo('/')}
          />
        );
      }

      // Modo Demonstração exclusivo para ambiente sem Firebase (Preview AI Studio)
      return (
        <ChunkErrorBoundary fallbackTitle="Erro ao carregar o Painel Master" onGoHome={() => navigateTo('/')}>
          <React.Suspense
            fallback={
              <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <span className="text-xs text-zinc-400 font-medium">Carregando painel do Superadministrador (Demo)...</span>
              </div>
            }
          >
            <MasterDashboard
              onNavigateHome={() => navigateTo('/')}
              onNavigateAdmin={() => navigateTo('/admin')}
              onLogout={() => navigateTo('/')}
            />
          </React.Suspense>
        </ChunkErrorBoundary>
      );
    }
  }

  // Tratamento de estados da rota pública dinâmica /b/:slug
  if (isSlugRoute) {
    if (routeStatus === 'loading') {
      return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <span className="text-xs text-zinc-400 font-medium">Carregando catálogo da barbearia...</span>
        </div>
      );
    }

    if (routeStatus !== 'success') {
      return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center pb-16 antialiased">
          <BusinessRouteError
            type={routeStatus}
            slug={routeSlug}
            errorMessage={routeErrorMessage}
            onRetry={loadRouteCatalog}
            onGoHome={() => navigateTo('/')}
          />
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-16 antialiased">
      <main className="w-full max-w-3xl mx-auto px-3.5 sm:px-6 pt-4 sm:pt-6">
        {/* If appointment confirmed, render Confirmation View */}
        {confirmedAppointment ? (
          <BookingConfirmation
            appointment={confirmedAppointment}
            onResetToHome={handleReset}
          />
        ) : (
          /* Main Booking Flow */
          <div className="space-y-6">
            {/* Minimal Header */}
            <MinimalHeader barbershop={barbershop} />

            {/* Step Progress Bar (3 Steps) */}
            <ProgressBar
              currentStep={currentStep}
              totalSteps={3}
              onBack={handleBackStep}
              onJumpToStep={handleJumpToStep}
              canJumpToStep={canJumpToStep}
            />

            {/* Main Interactive Form Area - Single Column Focused Layout */}
            <div className="w-full space-y-6">
              {/* ETAPA 1: ESCOLHER SERVIÇO */}
              {currentStep === 1 && (
                <div className="animate-fade-in">
                  <ServiceSelector
                    categories={serviceCategories}
                    isLoading={isLoadingServices}
                    selectedServices={bookingState.services}
                    selectedService={bookingState.service}
                    onToggleService={handleToggleService}
                    onContinue={() => setCurrentStep(2)}
                  />
                </div>
              )}

              {/* ETAPA 2: ESCOLHER PROFISSIONAL, DATA E HORÁRIO */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-fade-in">
                  {eligibleProfessionals.length === 0 ? (
                    <div className="p-6 bg-red-950/40 border border-red-800/80 rounded-2xl text-center space-y-3">
                      <p className="text-red-300 font-bold text-base">
                        Nenhum profissional disponível para todos os serviços selecionados.
                      </p>
                      <p className="text-xs text-red-400">
                        Por favor, volte à etapa anterior e ajuste sua seleção de serviços.
                      </p>
                      <button
                        type="button"
                        onClick={handleBackStep}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Voltar para Serviços
                      </button>
                    </div>
                  ) : (
                    <>
                      <ProfessionalSelector
                        professionals={eligibleProfessionals}
                        selectedProfessional={bookingState.professional}
                        onSelectProfessional={handleSelectProfessional}
                      />

                      <DateAndTimeSelector
                        days={upcomingDays}
                        selectedDate={bookingState.selectedDate}
                        onSelectDate={handleSelectDate}
                        timeSlots={availableTimeSlots}
                        selectedTime={bookingState.selectedTime}
                        onSelectTime={handleSelectTime}
                        selectedService={bookingState.service}
                        isLoading={isLoadingTimeSlots}
                        fetchError={timeSlotsError}
                        onRetry={() => bookingState.selectedDate && fetchDayAppointments(bookingState.selectedDate.dateString)}
                        hasConflictError={slotConflictError}
                        onBack={handleBackStep}
                        onContinue={() => setCurrentStep(3)}
                      />
                    </>
                  )}
                </div>
              )}

              {/* ETAPA 3: INFORMAR DADOS DO CLIENTE E REVISÃO */}
              {currentStep === 3 && (
                <div className="animate-fade-in">
                  <CustomerForm
                    clientInfo={bookingState.clientInfo}
                    onChangeClientInfo={handleClientInfoChange}
                    bookingState={bookingState}
                    onEditStep={handleJumpToStep}
                    onBack={handleBackStep}
                    onConfirm={handleConfirmAppointment}
                    isSubmitting={isSubmitting}
                    errorMessage={submitErrorMessage}
                  />
                </div>
              )}
            </div>

            {/* Secondary Barbershop Info Footer (At the bottom, non-intrusive) */}
            <BarbershopInfoFooter barbershop={barbershop} />
          </div>
        )}
      </main>

      {/* Dev Edge Cases Test Panel */}
      <DevEdgeCasesModal
        simulateConflict={simulateConflict}
        onToggleSimulateConflict={setSimulateConflict}
        singleBarberMode={false}
        onToggleSingleBarberMode={() => {}}
        fullyBookedMode={fullyBookedMode}
        onToggleFullyBookedMode={setFullyBookedMode}
        onResetState={handleReset}
        onNavigateTo={navigateTo}
        currentPath={currentPath}
      />
    </div>
  );
}
