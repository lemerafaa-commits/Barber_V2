import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  CheckCircle2,
  Scissors,
  DollarSign,
  User,
  Phone,
  Sparkles,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Store,
  History,
  Layers,
  LogOut,
  Users,
} from 'lucide-react';
import { AdminAppointment, AdminService } from '../../types/admin';
import { MOCK_ADMIN_APPOINTMENTS } from '../../data/adminMockData';
import {
  getAppointmentsByDate,
  getActiveAppointments,
  getNextAppointment,
  getCompletedAppointments,
  getCancelledAppointments,
  getDatesWithAppointments,
  updateAppointmentStatus,
  formatCurrencyBRL,
  getFriendlyDateLabel,
} from '../../services/adminAppointmentDomain';
import {
  getFirestoreAppointmentsForAdmin,
  updateFirestoreAppointmentStatus,
} from '../../services/firebase/appointments';
import {
  INITIAL_ADMIN_SERVICES,
} from '../../services/adminServiceDomain';
import {
  getFirestoreServices,
} from '../../services/firebase/services';
import { BusinessProfile, MyBarbershopSection } from '../../types/businessProfile';
import {
  DEFAULT_BUSINESS_PROFILE,
  loadBusinessProfile,
  saveBusinessProfile,
} from '../../services/businessProfileData';
import { MyBarbershopHub } from './my-barbershop/MyBarbershopHub';
import { IdentitySection } from './my-barbershop/IdentitySection';
import { ContactSection } from './my-barbershop/ContactSection';
import { LocationSection } from './my-barbershop/LocationSection';
import { HoursSection } from './my-barbershop/HoursSection';
import { NextAppointmentCard } from './appointments/NextAppointmentCard';
import { AppointmentItemCard } from './appointments/AppointmentItemCard';
import { AppointmentCalendar } from './appointments/AppointmentCalendar';
import { HistoryAppointmentsSection } from './appointments/HistoryAppointmentsSection';
import { AppointmentConfirmationModal, AppointmentActionType } from './appointments/AppointmentConfirmationModal';
import { ServicesHub } from './services/ServicesHub';
import { AdminTeam } from './team/AdminTeam';
import { signOutAdmin } from '../../services/firebase/auth';
import { isFirebaseConfigured } from '../../services/firebase/config';

interface AdminDashboardProps {
  onGoToPublicPage?: () => void;
  onLogout?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onGoToPublicPage, onLogout }) => {
  // Appointments state initialized with mock data if Firebase is not configured, or empty array while loading from Firestore
  const [appointments, setAppointments] = useState<AdminAppointment[]>(() =>
    !isFirebaseConfigured ? MOCK_ADMIN_APPOINTMENTS : []
  );
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(isFirebaseConfigured);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    type: AppointmentActionType;
    appointment: AdminAppointment;
  } | null>(null);

  // Main space navigation: Agendamentos vs Meus Serviços vs Minha Barbearia vs Equipe
  const [mainSpace, setMainSpace] = useState<'agendamentos' | 'meus-servicos' | 'minha-barbearia' | 'equipe'>('agendamentos');

  // Services state initialized with domain mock services, populated from Firestore
  const [services, setServices] = useState<AdminService[]>(INITIAL_ADMIN_SERVICES);
  const [isLoadingServices, setIsLoadingServices] = useState(false);

  // Sub tab for Agendamentos: "operacao" (Hoje / foco operacional) vs "calendario" (Explorar datas)
  const [activeTab, setActiveTab] = useState<'operacao' | 'calendario'>('operacao');

  // Business Profile states
  const [profileSection, setProfileSection] = useState<MyBarbershopSection>('hub');
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>(DEFAULT_BUSINESS_PROFILE);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Today reference in ISO (YYYY-MM-DD)
  const today = new Date();
  const year = today.getFullYear();
  const monthStr = String(today.getMonth() + 1).padStart(2, '0');
  const dayStr = String(today.getDate()).padStart(2, '0');
  const todayFormattedIso = `${year}-${monthStr}-${dayStr}`;

  // Selected date state for viewing/filtering appointments
  const [selectedDate, setSelectedDate] = useState<string>(todayFormattedIso);

  // Fetch real services from Firestore
  const fetchServices = async () => {
    if (!isFirebaseConfigured) return;
    setIsLoadingServices(true);
    try {
      const firestoreServices = await getFirestoreServices('joao-barber');
      if (firestoreServices && firestoreServices.length > 0) {
        setServices(firestoreServices);
      }
    } catch (err) {
      console.warn('Erro ao carregar serviços do Firestore:', err);
    } finally {
      setIsLoadingServices(false);
    }
  };

  // Load services on mount
  useEffect(() => {
    fetchServices();
  }, []);

  // Load real appointments from Firestore
  useEffect(() => {
    async function fetchAppointments() {
      if (!isFirebaseConfigured) {
        setAppointments(MOCK_ADMIN_APPOINTMENTS);
        setIsLoadingAppointments(false);
        return;
      }
      setIsLoadingAppointments(true);
      try {
        const realAppointments = await getFirestoreAppointmentsForAdmin('joao-barber');
        setAppointments(realAppointments);
      } catch (err) {
        console.warn('Agendamentos remotos inacessíveis (regras ou conexão):', err);
      } finally {
        setIsLoadingAppointments(false);
      }
    }

    fetchAppointments();
  }, []);

  // Load business profile on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        const profile = await loadBusinessProfile();
        setBusinessProfile(profile);
      } catch (err) {
        console.warn('Using default business profile state:', err);
      }
    }
    fetchProfile();
  }, []);

  // Save profile handler (prepared for future Firestore layer)
  const handleSaveProfile = async (updates: Partial<BusinessProfile>) => {
    setIsSavingProfile(true);
    try {
      const response = await saveBusinessProfile(updates);
      if (response.success && response.data) {
        setBusinessProfile(response.data);
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Auto-dismiss success notification
  useEffect(() => {
    if (actionSuccess) {
      const timer = setTimeout(() => {
        setActionSuccess(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess]);

  // Status transition handlers using domain functions
  const handleStartAppointment = (id: string) => {
    const result = updateAppointmentStatus(appointments, id, 'in_progress');
    if (result.success) {
      setAppointments(result.updatedAppointments);
    }
  };

  // Intercept action and open confirmation modal
  const handleRequestComplete = (id: string) => {
    const apt = appointments.find((a) => a.id === id);
    if (apt) {
      setPendingAction({ type: 'complete', appointment: apt });
    }
  };

  const handleRequestCancel = (id: string) => {
    const apt = appointments.find((a) => a.id === id);
    if (apt) {
      setPendingAction({ type: 'cancel', appointment: apt });
    }
  };

  const handleCloseModal = () => {
    if (completingId || cancellingId) return; // Prevent closing while processing
    setPendingAction(null);
  };

  const handleConfirmAction = async () => {
    if (!pendingAction || completingId || cancellingId) return;
    const { type, appointment } = pendingAction;
    const id = appointment.id;
    setActionError(null);
    setActionSuccess(null);

    if (type === 'complete') {
      setCompletingId(id);
      try {
        const response = await updateFirestoreAppointmentStatus(id, 'completed');
        if (response.success) {
          const result = updateAppointmentStatus(appointments, id, 'completed');
          if (result.success) {
            setAppointments(result.updatedAppointments);
          }
          setActionSuccess('✓ Atendimento concluído com sucesso.');
          setPendingAction(null);
        } else {
          setActionError('Não foi possível concluir o atendimento. Tente novamente.');
          setPendingAction(null);
        }
      } catch (err) {
        console.error('Erro ao concluir atendimento:', err);
        setActionError('Não foi possível concluir o atendimento. Tente novamente.');
        setPendingAction(null);
      } finally {
        setCompletingId(null);
      }
    } else if (type === 'cancel') {
      setCancellingId(id);
      try {
        const response = await updateFirestoreAppointmentStatus(id, 'cancelled');
        if (response.success) {
          const result = updateAppointmentStatus(appointments, id, 'cancelled');
          if (result.success) {
            setAppointments(result.updatedAppointments);
          }
          setActionSuccess('✓ Agendamento cancelado com sucesso.');
          setPendingAction(null);
        } else {
          setActionError('Não foi possível cancelar o agendamento. Tente novamente.');
          setPendingAction(null);
        }
      } catch (err) {
        console.error('Erro ao cancelar agendamento:', err);
        setActionError('Não foi possível cancelar o agendamento. Tente novamente.');
        setPendingAction(null);
      } finally {
        setCancellingId(null);
      }
    }
  };

  // Domain queries derived from state
  const datesWithAppointments = getDatesWithAppointments(appointments, todayFormattedIso);
  const dateAppointments = getAppointmentsByDate(appointments, selectedDate);
  const activeDateAppointments = getActiveAppointments(dateAppointments);
  const nextSpotlightAppointment = getNextAppointment(dateAppointments);
  const completedDateAppointments = getCompletedAppointments(dateAppointments);
  const cancelledDateAppointments = getCancelledAppointments(dateAppointments);

  // Revenue calculation for non-cancelled appointments of the selected date
  const totalRevenuePredicted = dateAppointments
    .filter((a) => a.status !== 'cancelled')
    .reduce((sum, item) => sum + item.totalPrice, 0);

  // Active appointments count for badge
  const totalActiveTodayCount = getActiveAppointments(
    getAppointmentsByDate(appointments, todayFormattedIso)
  ).length;

  const isViewingToday = selectedDate === todayFormattedIso;
  const friendlyDateTitle = getFriendlyDateLabel(selectedDate);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-20 antialiased">
      {/* Top Header / Barbershop Branding */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-amber-500 font-black tracking-wider text-xs uppercase px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                PAINEL DO BARBEIRO
              </span>
              <span className="text-xs text-zinc-400 font-mono">/admin</span>
              {!isFirebaseConfigured && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Modo demonstração
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-['Montserrat',sans-serif] mt-1 flex items-center gap-2">
              <span>{businessProfile.name || 'Barbearia'}</span>
            </h1>
            <p className="text-sm text-zinc-400 font-medium">
              Bom dia 👋
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Date Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-amber-400 font-bold text-xs tracking-wide">
              <CalendarIcon className="w-4 h-4 text-amber-500" />
              <span>{getFriendlyDateLabel(todayFormattedIso)}</span>
            </div>

            {/* Link to public view for easy preview */}
            {onGoToPublicPage && (
              <button
                type="button"
                onClick={onGoToPublicPage}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
                title="Ver página pública de agendamento"
              >
                <span>Ver Agendamento Público</span>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
              </button>
            )}

            {/* Logout button */}
            <button
              id="admin-logout-btn"
              type="button"
              onClick={async () => {
                if (isFirebaseConfigured) {
                  try {
                    await signOutAdmin();
                  } catch (e) {
                    console.error('Erro ao encerrar sessão:', e);
                  }
                }
                if (onLogout) onLogout();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/30 text-zinc-400 hover:text-red-400 text-xs font-semibold transition-colors cursor-pointer"
              title="Sair do painel administrativo"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>

        {/* Primary Admin Navigation: Agendamentos vs Meus Serviços vs Minha Barbearia */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between border-t border-zinc-900 pt-2 pb-2 gap-2">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => {
                setMainSpace('agendamentos');
              }}
              className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                mainSpace === 'agendamentos'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Agendamentos</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMainSpace('meus-servicos');
              }}
              className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                mainSpace === 'meus-servicos'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Scissors className="w-4 h-4" />
              <span>Meus Serviços</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMainSpace('minha-barbearia');
                setProfileSection('hub');
              }}
              className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                mainSpace === 'minha-barbearia'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Minha Barbearia</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMainSpace('equipe');
              }}
              className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                mainSpace === 'equipe'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Equipe</span>
            </button>
          </div>

          {/* Sub-tabs for Agendamentos */}
          {mainSpace === 'agendamentos' && (
            <div className="flex gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800/80">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('operacao');
                  setSelectedDate(todayFormattedIso);
                }}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  activeTab === 'operacao' && isViewingToday
                    ? 'bg-zinc-800 text-amber-400 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Hoje ({totalActiveTodayCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('calendario')}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  activeTab === 'calendario' || !isViewingToday
                    ? 'bg-zinc-800 text-amber-400 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Calendário
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {mainSpace === 'meus-servicos' ? (
          <ServicesHub
            services={services}
            onServicesChange={setServices}
            isLoading={isLoadingServices}
            onRefresh={fetchServices}
          />
        ) : mainSpace === 'minha-barbearia' ? (
          <div className="space-y-6">
            {profileSection === 'hub' && (
              <MyBarbershopHub
                profile={businessProfile}
                onNavigateSection={setProfileSection}
              />
            )}

            {profileSection === 'identity' && (
              <IdentitySection
                profile={businessProfile}
                onSave={handleSaveProfile}
                onBack={() => setProfileSection('hub')}
                isSaving={isSavingProfile}
              />
            )}

            {profileSection === 'contact' && (
              <ContactSection
                profile={businessProfile}
                onSave={handleSaveProfile}
                onBack={() => setProfileSection('hub')}
                isSaving={isSavingProfile}
              />
            )}

            {profileSection === 'location' && (
              <LocationSection
                profile={businessProfile}
                onSave={handleSaveProfile}
                onBack={() => setProfileSection('hub')}
                isSaving={isSavingProfile}
              />
            )}

            {profileSection === 'hours' && (
              <HoursSection
                profile={businessProfile}
                onSave={handleSaveProfile}
                onBack={() => setProfileSection('hub')}
                isSaving={isSavingProfile}
              />
            )}
          </div>
        ) : mainSpace === 'equipe' ? (
          <AdminTeam
            services={services}
            businessId={businessProfile.businessId || 'joao-barber'}
            onRefreshServices={fetchServices}
          />
        ) : (
          <>
            {/* Action error notification if any operation fails */}
            {actionError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-between gap-3">
                <span>{actionError}</span>
                <button
                  type="button"
                  onClick={() => setActionError(null)}
                  className="text-rose-400 hover:text-rose-200 cursor-pointer font-bold px-1"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Action success notification after Firestore confirmation */}
            {actionSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{actionSuccess}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActionSuccess(null)}
                  className="text-emerald-400 hover:text-emerald-200 cursor-pointer font-bold px-1"
                >
                  ✕
                </button>
              </div>
            )}

            {/* 1. TOP METRICS STRIP: Selected Date Overview & Revenue */}
            <section id="metric-overview" className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Daily Clients Counter */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/80 shadow-md flex items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                    AGENDAMENTOS NA DATA
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-white font-['Montserrat',sans-serif]">
                      {dateAppointments.length}
                    </span>
                    <span className="text-xs text-zinc-400 font-medium">
                      ({activeDateAppointments.length} ativos • {completedDateAppointments.length} concluídos)
                    </span>
                  </div>
                </div>
                <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <User className="w-5 h-5 stroke-[2.5]" />
                </div>
              </div>

              {/* Predicted Revenue */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/80 shadow-md flex items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                    FATURAMENTO PREVISTO
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-['Montserrat',sans-serif]">
                      {formatCurrencyBRL(totalRevenuePredicted)}
                    </span>
                    <span className="text-xs text-zinc-400 font-medium">
                      previsto no dia
                    </span>
                  </div>
                </div>
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <TrendingUp className="w-5 h-5 stroke-[2.5]" />
                </div>
              </div>
            </section>

            {/* 2. PRÓXIMO ATENDIMENTO (Spotlight Card with direct actions) */}
            {nextSpotlightAppointment && (
              <NextAppointmentCard
                appointment={nextSpotlightAppointment}
                onComplete={handleRequestComplete}
                onCancel={handleRequestCancel}
              />
            )}

            {/* 3. CALENDAR SECTION (Accessible via Tab or inline explorer) */}
            {(activeTab === 'calendario' || !isViewingToday) && (
              <section id="secao-calendario" className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-amber-500" />
                    SELECIONAR DATA
                  </h2>
                  {!isViewingToday && (
                    <button
                      type="button"
                      onClick={() => setSelectedDate(todayFormattedIso)}
                      className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                    >
                      ← Voltar para Hoje
                    </button>
                  )}
                </div>

                <AppointmentCalendar
                  selectedDate={selectedDate}
                  onSelectDate={(date) => {
                    setSelectedDate(date);
                  }}
                  datesWithAppointments={datesWithAppointments}
                />
              </section>
            )}

            {/* 4. AGENDA DO DIA SELECIONADO (Chronological Active List) */}
            <section id="agenda-do-dia" className="space-y-3">
              <div className="flex items-center justify-between pt-1">
                <h2 className="text-base sm:text-lg font-black text-white tracking-wide uppercase flex items-center gap-2 font-['Montserrat',sans-serif]">
                  <Scissors className="w-5 h-5 text-amber-500" />
                  <span>AGENDA DE {friendlyDateTitle}</span>
                </h2>
                <span className="text-xs text-zinc-400 font-mono">
                  {activeDateAppointments.length} ativo{activeDateAppointments.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Active appointments list */}
              {isLoadingAppointments && appointments.length === 0 ? (
                <div className="p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-center space-y-2">
                  <div className="inline-block w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-2" />
                  <p className="text-sm font-semibold text-zinc-300">
                    Carregando agendamentos do Firestore...
                  </p>
                </div>
              ) : activeDateAppointments.length > 0 ? (
                <div className="space-y-2.5">
                  {activeDateAppointments.map((item) => {
                    const isNext = nextSpotlightAppointment?.id === item.id;

                    return (
                      <AppointmentItemCard
                        key={item.id}
                        appointment={item}
                        isNext={isNext}
                        onComplete={handleRequestComplete}
                        onCancel={handleRequestCancel}
                        showActions={true}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-center space-y-2">
                  <p className="text-sm font-semibold text-zinc-300">
                    Nenhum atendimento pendente para {friendlyDateTitle.toLowerCase()}.
                  </p>
                  <p className="text-xs text-zinc-400">
                    Todos os horários desta data foram concluídos, cancelados ou estão livres.
                  </p>
                </div>
              )}
            </section>

            {/* 5. HISTÓRICO DO DIA (Concluídos e Cancelados) */}
            <HistoryAppointmentsSection
              completedAppointments={completedDateAppointments}
              cancelledAppointments={cancelledDateAppointments}
            />

            {/* Toggle to open calendar if currently in 'operacao' tab */}
            {activeTab === 'operacao' && isViewingToday && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setActiveTab('calendario')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <CalendarIcon className="w-4 h-4 text-amber-400" />
                  <span>Abrir Calendário Completo</span>
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Confirmation Modal for Complete / Cancel operations */}
      <AppointmentConfirmationModal
        isOpen={Boolean(pendingAction)}
        type={pendingAction?.type || null}
        appointment={pendingAction?.appointment || null}
        isProcessing={Boolean(completingId || cancellingId)}
        onConfirm={handleConfirmAction}
        onClose={handleCloseModal}
      />
    </div>
  );
};

