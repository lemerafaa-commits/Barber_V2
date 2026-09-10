import React, { useState, useEffect, useMemo } from 'react';
import { MinimalHeader } from './components/MinimalHeader';
import { ProgressBar } from './components/ProgressBar';
import { ServiceSelector } from './components/ServiceSelector';
import { DateAndTimeSelector } from './components/DateAndTimeSelector';
import { CustomerForm } from './components/CustomerForm';
import { BookingConfirmation } from './components/BookingConfirmation';
import { BarbershopInfoFooter } from './components/BarbershopInfoFooter';
import { DevEdgeCasesModal } from './components/DevEdgeCasesModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminLogin } from './components/admin/AdminLogin';
import { User } from 'firebase/auth';
import { subscribeToAuthChanges } from './services/firebase/auth';
import { Loader2 } from 'lucide-react';

import {
  BookingState,
  StepNumber,
  Service,
  ServiceCategory,
  DayOption,
  Appointment,
  Barbershop
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
  getFirestoreServices,
  adminServicesToBookingCategories,
} from './services/firebase/services';
import {
  loadBusinessProfile,
  businessProfileToBarbershop,
  DEFAULT_BUSINESS_PROFILE
} from './services/businessProfileData';
import { triggerWhatsAppConfirmation } from './services/notifications/clientNotification';

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

  // Firebase Auth state for protected admin access
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      setAdminUser(user);
      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  // Current active step in progressive disclosure (1: Service, 2: Date & Time, 3: Customer Data)
  const [currentStep, setCurrentStep] = useState<StepNumber>(1);

  // Dynamic Barbershop info fetched from Firestore (with resilient fallback)
  const [barbershop, setBarbershop] = useState<Barbershop>(() =>
    businessProfileToBarbershop(DEFAULT_BUSINESS_PROFILE)
  );

  useEffect(() => {
    async function fetchBarbershopInfo() {
      try {
        const profile = await loadBusinessProfile('joao-barber');
        setBarbershop(businessProfileToBarbershop(profile));
      } catch (err) {
        console.warn('Usando perfil padrão da barbearia:', err);
      }
    }
    fetchBarbershopInfo();
  }, []);

  // Dynamic Service categories fetched from Firestore (fallback to MOCK_SERVICE_CATEGORIES)
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>(MOCK_SERVICE_CATEGORIES);
  const [isLoadingServices, setIsLoadingServices] = useState<boolean>(false);

  useEffect(() => {
    async function fetchServices() {
      try {
        const firestoreServices = await getFirestoreServices('joao-barber');
        if (firestoreServices && firestoreServices.length > 0) {
          const categories = adminServicesToBookingCategories(firestoreServices);
          if (categories.length > 0) {
            setServiceCategories(categories);
          }
        }
      } catch (err) {
        console.warn('Utilizando catálogo padrão de serviços da barbearia:', err);
      } finally {
        setIsLoadingServices(false);
      }
    }
    fetchServices();
  }, []);

  // Dev state for edge case testing
  const [simulateConflict, setSimulateConflict] = useState(false);
  const [fullyBookedMode, setFullyBookedMode] = useState(false);

  // Booking details state
  const [bookingState, setBookingState] = useState<BookingState>({
    services: [],
    service: null,
    professional: MOCK_PROFESSIONALS[0], // Auto assigned default professional in backend
    isAnyProfessional: true,
    selectedDate: null,
    selectedTime: null,
    clientInfo: {
      name: '',
      phone: '',
      whatsappOptIn: false,
    },
  });

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
      const records = await getFirestoreAppointmentsByDate(dateStr, 'joao-barber');
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
  }, [bookingState.selectedDate?.dateString]);

  // Total duration of all selected services
  const totalDurationMinutes = useMemo(() => {
    if (!bookingState.services || bookingState.services.length === 0) return 30;
    return bookingState.services.reduce((sum, s) => sum + Number(s.durationMinutes), 0);
  }, [bookingState.services]);

  // Compute available time slots for chosen date, appointments, and total duration
  const availableTimeSlots = useMemo(() => {
    if (!bookingState.selectedDate) return [];
    return getAvailableTimeSlots(
      bookingState.selectedDate.dateString,
      dayAppointments,
      totalDurationMinutes,
      fullyBookedMode
    );
  }, [bookingState.selectedDate, dayAppointments, totalDurationMinutes, fullyBookedMode]);

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
        id: `${category.id}-${option.id}`,
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
    if (step === 3) return bookingState.services.length > 0 && Boolean(bookingState.selectedDate) && Boolean(bookingState.selectedTime);
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
    if (isAuthChecking) {
      return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <span className="text-xs text-zinc-400 font-medium">Verificando autorização...</span>
        </div>
      );
    }

    if (!adminUser) {
      return (
        <AdminLogin
          onLoginSuccess={() => {
            // State automatically transitions via onAuthStateChanged
          }}
          onGoToPublicPage={() => navigateTo('/')}
        />
      );
    }

    return (
      <AdminDashboard
        onGoToPublicPage={() => navigateTo('/')}
        onLogout={() => {
          // Handled via onAuthStateChanged, user state resets to null
        }}
      />
    );
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

              {/* ETAPA 2: ESCOLHER DATA E HORÁRIO */}
              {currentStep === 2 && (
                <div className="animate-fade-in">
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
      />
    </div>
  );
}
