import React, { useState, useEffect } from 'react';
import {
  X,
  Camera,
  Scissors,
  Clock,
  Check,
  AlertCircle,
  Coffee,
  Plus,
  Trash2,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Barber,
  DaySchedule,
  BarberStatus,
  BarberServiceMode,
  AdminService,
  BarberServiceConfig,
  ServiceDurationMode,
  ScheduleBreak,
} from '../../../types/admin';
import { DEFAULT_WEEKLY_SCHEDULE } from '../../../data/adminMockData';

interface AdminBarberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (barberData: Omit<Barber, 'id' | 'createdAt'> & { id?: string }) => void;
  initialBarber?: Barber | null;
  services: AdminService[];
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=250&q=80',
];

export const AdminBarberFormModal: React.FC<AdminBarberFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialBarber,
  services,
}) => {
  const isEditing = Boolean(initialBarber);

  // Basic Information
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [photoUrl, setPhotoUrl] = useState(AVATAR_PRESETS[0]);
  const [status, setStatus] = useState<BarberStatus>('active');

  // Services Configuration
  const [serviceMode, setServiceMode] = useState<BarberServiceMode>('all');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  // Record of serviceId -> BarberServiceConfig (durationMode, customDurationMinutes)
  const [serviceConfigs, setServiceConfigs] = useState<Record<string, BarberServiceConfig>>({});

  // Schedule Configuration
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_WEEKLY_SCHEDULE);
  // Accordion state for schedule days (Segunda-feira: dayOfWeek 1 starts expanded)
  const [expandedDays, setExpandedDays] = useState<number[]>([1]);

  // Form Validation
  const [errors, setErrors] = useState<{ name?: string; whatsapp?: string }>({});

  useEffect(() => {
    if (initialBarber) {
      setName(initialBarber.name);
      setWhatsapp(initialBarber.whatsapp);
      setEmail(initialBarber.email || '');
      setPhotoUrl(initialBarber.photoUrl);
      setStatus(initialBarber.status);
      setServiceMode(initialBarber.serviceMode);
      setSelectedServiceIds(initialBarber.serviceIds || []);

      // Load existing service configs
      const configsMap: Record<string, BarberServiceConfig> = {};
      if (initialBarber.serviceConfigs && initialBarber.serviceConfigs.length > 0) {
        initialBarber.serviceConfigs.forEach((cfg) => {
          configsMap[cfg.serviceId] = { ...cfg };
        });
      } else {
        // If not explicit, create default configs for selected services
        (initialBarber.serviceIds || []).forEach((id) => {
          configsMap[id] = {
            serviceId: id,
            durationMode: 'default',
            customDurationMinutes: null,
          };
        });
      }
      setServiceConfigs(configsMap);

      // Normalize schedule: ensure breaks array is populated
      const normalizedSchedule = (initialBarber.schedule || DEFAULT_WEEKLY_SCHEDULE).map((day) => {
        let breaks: ScheduleBreak[] = [];
        if (day.breaks && Array.isArray(day.breaks) && day.breaks.length > 0) {
          breaks = day.breaks.map((b) => ({ ...b }));
        } else if (day.breakStartTime && day.breakEndTime) {
          breaks = [{ startTime: day.breakStartTime, endTime: day.breakEndTime }];
        }
        return {
          ...day,
          breaks,
        };
      });
      setSchedule(normalizedSchedule);
    } else {
      // Add new barber: reset to defaults
      setName('');
      setWhatsapp('');
      setEmail('');
      setPhotoUrl(AVATAR_PRESETS[0]);
      setStatus('active');
      setServiceMode('all');
      setSelectedServiceIds([]);
      setServiceConfigs({});

      // Default schedule with breaks initialized
      const initialSchedule = DEFAULT_WEEKLY_SCHEDULE.map((day) => {
        const breaks: ScheduleBreak[] =
          day.breakStartTime && day.breakEndTime
            ? [{ startTime: day.breakStartTime, endTime: day.breakEndTime }]
            : [];
        return {
          ...day,
          breaks,
        };
      });
      setSchedule(initialSchedule);
    }
    // Reset accordion to have Segunda-feira expanded by default
    setExpandedDays([1]);
    setErrors({});
  }, [initialBarber, isOpen]);

  if (!isOpen) return null;

  // Active catalog services, plus any service already selected for this barber even if currently inactive in the catalog
  const availableServices = services.filter(
    (svc) => svc.active !== false || selectedServiceIds.includes(svc.id)
  );

  // Toggle service selection in "Personalizar serviços"
  const handleToggleService = (serviceId: string, defaultDuration: number) => {
    setSelectedServiceIds((prev) => {
      const isSelected = prev.includes(serviceId);
      if (isSelected) {
        return prev.filter((id) => id !== serviceId);
      } else {
        // Ensure serviceConfig entry exists
        setServiceConfigs((cMap) => ({
          ...cMap,
          [serviceId]: cMap[serviceId] || {
            serviceId,
            durationMode: 'default',
            customDurationMinutes: defaultDuration,
          },
        }));
        return [...prev, serviceId];
      }
    });
  };

  // Change duration mode for a specific service: 'default' vs 'custom'
  const handleDurationModeChange = (
    serviceId: string,
    mode: ServiceDurationMode,
    defaultDuration: number
  ) => {
    setServiceConfigs((prev) => {
      const current = prev[serviceId] || {
        serviceId,
        durationMode: 'default',
        customDurationMinutes: defaultDuration,
      };

      return {
        ...prev,
        [serviceId]: {
          ...current,
          durationMode: mode,
          customDurationMinutes:
            mode === 'custom' ? current.customDurationMinutes || defaultDuration : null,
        },
      };
    });
  };

  // Change custom duration minutes for a service
  const handleCustomDurationChange = (serviceId: string, minutes: number) => {
    setServiceConfigs((prev) => {
      const current = prev[serviceId] || {
        serviceId,
        durationMode: 'custom',
        customDurationMinutes: minutes,
      };
      return {
        ...prev,
        [serviceId]: {
          ...current,
          customDurationMinutes: Math.max(5, minutes),
        },
      };
    });
  };

  // Schedule management handlers
  const handleToggleDayOff = (dayIndex: number) => {
    setSchedule((prev) => {
      const next = [...prev];
      const target = next[dayIndex];
      const newIsDayOff = !target.isDayOff;

      let breaks = target.breaks ? [...target.breaks] : [];
      // If switching from off to active and has no breaks, add standard break
      if (!newIsDayOff && breaks.length === 0) {
        breaks = [{ startTime: '12:00', endTime: '13:00' }];
      }

      next[dayIndex] = {
        ...target,
        isDayOff: newIsDayOff,
        breaks,
      };
      return next;
    });
  };

  const handleWorkingHoursChange = (
    dayIndex: number,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    setSchedule((prev) => {
      const next = [...prev];
      next[dayIndex] = { ...next[dayIndex], [field]: value };
      return next;
    });
  };

  const handleAddBreak = (dayIndex: number) => {
    setSchedule((prev) => {
      const next = [...prev];
      const day = next[dayIndex];
      const breaks = day.breaks ? [...day.breaks] : [];

      // Determine smart start time for next break
      const newBreak: ScheduleBreak = {
        startTime: breaks.length === 0 ? '12:00' : '16:00',
        endTime: breaks.length === 0 ? '13:00' : '16:30',
      };

      next[dayIndex] = {
        ...day,
        breaks: [...breaks, newBreak],
      };
      return next;
    });
  };

  const handleUpdateBreak = (
    dayIndex: number,
    breakIndex: number,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    setSchedule((prev) => {
      const next = [...prev];
      const day = next[dayIndex];
      const breaks = day.breaks ? [...day.breaks] : [];

      if (breaks[breakIndex]) {
        breaks[breakIndex] = {
          ...breaks[breakIndex],
          [field]: value,
        };
      }

      next[dayIndex] = {
        ...day,
        breaks,
      };
      return next;
    });
  };

  const handleRemoveBreak = (dayIndex: number, breakIndex: number) => {
    setSchedule((prev) => {
      const next = [...prev];
      const day = next[dayIndex];
      const breaks = day.breaks ? [...day.breaks] : [];
      breaks.splice(breakIndex, 1);

      next[dayIndex] = {
        ...day,
        breaks,
      };
      return next;
    });
  };

  // Accordion toggle handler for schedule days
  const handleToggleDayAccordion = (dayOfWeek: number) => {
    setExpandedDays((prev) =>
      prev.includes(dayOfWeek)
        ? prev.filter((d) => d !== dayOfWeek)
        : [...prev, dayOfWeek]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { name?: string; whatsapp?: string } = {};
    if (!name.trim()) newErrors.name = 'Nome completo é obrigatório.';
    if (!whatsapp.trim()) newErrors.whatsapp = 'Número de WhatsApp é obrigatório.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Prepare configs list
    const finalConfigs: BarberServiceConfig[] =
      serviceMode === 'custom'
        ? selectedServiceIds.map((sId) => {
            const cfg = serviceConfigs[sId];
            const svc = services.find((s) => s.id === sId);
            const isCustom = cfg?.durationMode === 'custom';
            return {
              serviceId: sId,
              serviceName: svc ? svc.name : cfg?.serviceName || '',
              durationMode: isCustom ? 'custom' : 'default',
              customDurationMinutes: isCustom
                ? typeof cfg?.customDurationMinutes === 'number' && cfg.customDurationMinutes > 0
                  ? cfg.customDurationMinutes
                  : svc?.durationMinutes || 30
                : null,
            };
          })
        : [];

    // Normalize schedule for output: ensure both breaks array and legacy breakStartTime are set
    const finalSchedule: DaySchedule[] = schedule.map((day) => {
      const breaks = day.breaks || [];
      return {
        ...day,
        breaks,
        breakStartTime: breaks.length > 0 ? breaks[0].startTime : '',
        breakEndTime: breaks.length > 0 ? breaks[0].endTime : '',
      };
    });

    onSave({
      ...(initialBarber ? { id: initialBarber.id } : {}),
      businessId: initialBarber?.businessId || 'joao-barber',
      name: name.trim(),
      whatsapp: whatsapp.trim(),
      email: email.trim() || undefined,
      photoUrl,
      status,
      serviceMode,
      serviceIds: serviceMode === 'all' ? [] : selectedServiceIds,
      serviceConfigs: finalConfigs,
      schedule: finalSchedule,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div
        className="w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 my-6 max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white font-['Montserrat',sans-serif]">
              {isEditing ? 'Editar Barbeiro' : 'Adicionar Novo Barbeiro'}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              {isEditing
                ? 'Atualize os dados, serviços, duração personalizada e horários deste profissional.'
                : 'Cadastre um novo barbeiro na equipe da sua barbearia.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7">
          {/* Avatar selection */}
          <div className="space-y-2.5">
            <label className="text-xs uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-amber-500" />
              Foto de Perfil / Avatar
            </label>
            <div className="flex flex-wrap items-center gap-4">
              <img
                src={photoUrl}
                alt="Avatar selecionado"
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover border-2 border-amber-500 shadow-md shadow-amber-500/10"
              />
              <div className="space-y-1.5">
                <span className="text-[11px] text-zinc-400 block font-medium">
                  Selecione um avatar ilustrativo:
                </span>
                <div className="flex items-center gap-2">
                  {AVATAR_PRESETS.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPhotoUrl(url)}
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border-2 transition-transform cursor-pointer ${
                        photoUrl === url
                          ? 'border-amber-500 scale-105 shadow-sm'
                          : 'border-zinc-700 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Basic Info: Name, WhatsApp, Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-300">
                Nome Completo <span className="text-amber-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Matheus Oliveira"
                className={`w-full px-4 py-2.5 rounded-xl bg-zinc-950 border text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                  errors.name ? 'border-rose-500' : 'border-zinc-800 focus:border-amber-500'
                }`}
              />
              {errors.name && (
                <span className="text-[11px] text-rose-400 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.name}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-300">
                WhatsApp <span className="text-amber-500">*</span>
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="(15) 99999-9999"
                className={`w-full px-4 py-2.5 rounded-xl bg-zinc-950 border text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                  errors.whatsapp ? 'border-rose-500' : 'border-zinc-800 focus:border-amber-500'
                }`}
              />
              {errors.whatsapp && (
                <span className="text-[11px] text-rose-400 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.whatsapp}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-300">
                E-mail <span className="text-zinc-500 font-normal">(opcional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="barbeiro@exemplo.com"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-300">
                Status do Barbeiro
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStatus('active')}
                  className={`flex-1 py-2.5 px-3.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                    status === 'active'
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 shadow-sm'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                  Ativo (disponível para agendamentos)
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('inactive')}
                  className={`flex-1 py-2.5 px-3.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                    status === 'inactive'
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-300 shadow-sm'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${status === 'inactive' ? 'bg-zinc-400' : 'bg-zinc-600'}`} />
                  Inativo (indisponível)
                </button>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* REFINAMENTO 1: SERVIÇOS & DURAÇÃO PERSONALIZADA          */}
          {/* ======================================================== */}
          <div className="space-y-4 pt-5 border-t border-zinc-800/80">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs uppercase font-bold text-zinc-300 tracking-wider flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-amber-500" />
                  Configuração de Serviços e Duração
                </label>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Defina os serviços que o barbeiro realiza e adapte o tempo de atendimento individual.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setServiceMode('all')}
                className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-colors ${
                  serviceMode === 'all'
                    ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-sm'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400">Todos os serviços</span>
                  {serviceMode === 'all' && <Check className="w-4 h-4 text-amber-500" />}
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  O barbeiro atende qualquer serviço da barbearia com a duração padrão do catálogo.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setServiceMode('custom')}
                className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-colors ${
                  serviceMode === 'custom'
                    ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-sm'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400">Personalizar serviços</span>
                  {serviceMode === 'custom' && <Check className="w-4 h-4 text-amber-500" />}
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  Selecione serviços específicos e ajuste o tempo de atendimento deste profissional.
                </p>
              </button>
            </div>

            {/* Custom Services & Individual Durations */}
            {serviceMode === 'custom' && (
              <div className="space-y-3 p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200">
                    Selecione os serviços de {name || 'este profissional'}:
                  </span>
                  <span className="text-[11px] text-amber-400 font-semibold font-mono">
                    {selectedServiceIds.length} selecionado(s)
                  </span>
                </div>

                <div className="space-y-3">
                  {availableServices.map((svc) => {
                    const isChecked = selectedServiceIds.includes(svc.id);
                    const config = serviceConfigs[svc.id] || {
                      serviceId: svc.id,
                      durationMode: 'default',
                      customDurationMinutes: svc.durationMinutes,
                    };
                    const isCustomDuration = config.durationMode === 'custom';

                    return (
                      <div
                        key={svc.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isChecked
                            ? 'bg-zinc-900/90 border-amber-500/30 text-white shadow-sm'
                            : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {/* Service Top Row: Checkbox + Name + Price & Standard Duration */}
                        <div className="flex items-center justify-between gap-3">
                          <label className="flex items-center gap-3 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleService(svc.id, svc.durationMinutes)}
                              className="w-4 h-4 rounded border-zinc-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-zinc-950 cursor-pointer"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white block">
                                  {svc.name}
                                </span>
                                {svc.active === false && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                                    Inativo no catálogo
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-zinc-400">
                                Padrão do catálogo: {svc.durationMinutes} min
                              </span>
                            </div>
                          </label>

                          <span className="text-xs font-black text-amber-400 font-mono">
                            R$ {svc.price.toFixed(2)}
                          </span>
                        </div>

                        {/* Duration Options (displayed when service is checked) */}
                        {isChecked && (
                          <div className="mt-3 pt-3 border-t border-zinc-800/80 space-y-2.5 animate-in fade-in duration-150">
                            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                              Duração do atendimento
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-xs">
                              {/* Option 1: Usar padrão */}
                              <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                                <input
                                  type="radio"
                                  name={`duration-mode-${svc.id}`}
                                  checked={!isCustomDuration}
                                  onChange={() =>
                                    handleDurationModeChange(svc.id, 'default', svc.durationMinutes)
                                  }
                                  className="text-amber-500 focus:ring-amber-500 border-zinc-700 cursor-pointer"
                                />
                                <span>Usar padrão ({svc.durationMinutes} min)</span>
                              </label>

                              {/* Option 2: Personalizar duração */}
                              <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                                <input
                                  type="radio"
                                  name={`duration-mode-${svc.id}`}
                                  checked={isCustomDuration}
                                  onChange={() =>
                                    handleDurationModeChange(svc.id, 'custom', svc.durationMinutes)
                                  }
                                  className="text-amber-500 focus:ring-amber-500 border-zinc-700 cursor-pointer"
                                />
                                <span>Personalizar duração</span>
                              </label>
                            </div>

                            {/* Custom Duration Input when selected */}
                            {isCustomDuration && (
                              <div className="flex items-center gap-3 pt-1 animate-in fade-in duration-150">
                                <span className="text-xs text-zinc-400">Duração personalizada:</span>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    min={5}
                                    max={240}
                                    step={5}
                                    value={config.customDurationMinutes || svc.durationMinutes}
                                    onChange={(e) =>
                                      handleCustomDurationChange(
                                        svc.id,
                                        parseInt(e.target.value, 10) || 5
                                      )
                                    }
                                    className="w-20 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white font-mono text-xs focus:outline-none focus:border-amber-500 text-center"
                                  />
                                  <span className="text-xs text-amber-400 font-semibold">min</span>
                                </div>

                                {/* Quick options for convenience */}
                                <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-zinc-800">
                                  {[30, 40, 45, 50, 60].map((quickMin) => (
                                    <button
                                      key={quickMin}
                                      type="button"
                                      onClick={() => handleCustomDurationChange(svc.id, quickMin)}
                                      className={`px-2 py-1 rounded text-[10px] font-mono transition-colors ${
                                        config.customDurationMinutes === quickMin
                                          ? 'bg-amber-500 text-zinc-950 font-bold'
                                          : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
                                      }`}
                                    >
                                      {quickMin}m
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {availableServices.length === 0 && (
                    <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-center text-xs text-zinc-400">
                      Nenhum serviço ativo disponível no catálogo. Cadastre ou reative serviços em &quot;Meus Serviços&quot;.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* REFINAMENTO 2: HORÁRIOS DE ATENDIMENTO — CLAREZA VISUAL  */}
          {/* ======================================================== */}
          <div className="space-y-4 pt-5 border-t border-zinc-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <label className="text-xs uppercase font-bold text-zinc-300 tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  Horários Individuais de Atendimento
                </label>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Cada dia é configurado individualmente com jornada de trabalho e múltiplos intervalos.
                </p>
              </div>
            </div>

            {/* Individual Day Cards Accordion: CLAREZA > COMPACTAÇÃO */}
            <div className="space-y-2.5">
              {schedule.map((day, dayIdx) => {
                const isActive = !day.isDayOff;
                const breaks = day.breaks || [];
                const isExpanded = expandedDays.includes(day.dayOfWeek);

                return (
                  <div
                    key={day.dayOfWeek}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      isActive
                        ? 'bg-zinc-950/70 border-zinc-800/90 shadow-sm'
                        : 'bg-zinc-950/30 border-zinc-900 opacity-80'
                    }`}
                  >
                    {/* Day Header (Click to expand/collapse) */}
                    <div
                      onClick={() => handleToggleDayAccordion(day.dayOfWeek)}
                      className={`w-full flex items-center justify-between gap-3 p-3.5 sm:p-4 cursor-pointer select-none transition-colors hover:bg-zinc-900/40 ${
                        isExpanded ? 'border-b border-zinc-900' : ''
                      }`}
                      role="button"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleToggleDayAccordion(day.dayOfWeek);
                        }
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <Calendar
                          className={`w-4 h-4 transition-colors ${
                            isActive ? 'text-amber-500' : 'text-zinc-500'
                          }`}
                        />
                        <h4 className="text-sm font-black uppercase tracking-wide text-white font-['Montserrat',sans-serif]">
                          {day.dayName}-feira
                        </h4>
                        {!isExpanded && (
                          <span className="hidden sm:inline-block text-[11px] text-zinc-500 font-medium ml-1.5">
                            {isActive
                              ? `${day.startTime} — ${day.endTime}${
                                  breaks.length > 0
                                    ? ` • ${breaks.length} intervalo${breaks.length > 1 ? 's' : ''}`
                                    : ''
                                }`
                              : '• Folga'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3">
                        {/* Clear Active / Folga Control (Stops propagation so it doesn't toggle accordion) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleDayOff(dayIdx);
                          }}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            isActive
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                          }`}
                          title={
                            isActive
                              ? 'Clique para marcar como folga'
                              : 'Clique para ativar este dia'
                          }
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isActive
                                ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                                : 'bg-zinc-600'
                            }`}
                          />
                          <span>{isActive ? '● Ativo' : '○ Folga'}</span>
                        </button>

                        {/* Accordion Arrow Icon */}
                        <div className="p-1 rounded-lg text-zinc-400 hover:text-white transition-colors">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-zinc-300" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-zinc-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Day Content (Visible when expanded) */}
                    {isExpanded && (
                      <div className="p-4 sm:p-5 pt-3.5 space-y-4 animate-in fade-in duration-150">
                        {!isActive ? (
                          /* DIA DE FOLGA: Muted friendly note, no inputs shown */
                          <div className="py-2 flex items-center gap-2.5 text-xs text-zinc-400">
                            <Coffee className="w-4 h-4 text-zinc-500 shrink-0" />
                            <span>Este profissional não atende neste dia.</span>
                          </div>
                        ) : (
                          /* DIA ATIVO: Working hours + Multiple breaks */
                          <>
                            {/* 1. Working Hours */}
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                                Horário de atendimento
                              </label>
                              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-zinc-500">De:</span>
                                  <input
                                    type="time"
                                    value={day.startTime}
                                    onChange={(e) =>
                                      handleWorkingHoursChange(
                                        dayIdx,
                                        'startTime',
                                        e.target.value
                                      )
                                    }
                                    className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                                  />
                                </div>
                                <span className="text-zinc-500 text-xs">até</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-zinc-500">Às:</span>
                                  <input
                                    type="time"
                                    value={day.endTime}
                                    onChange={(e) =>
                                      handleWorkingHoursChange(
                                        dayIdx,
                                        'endTime',
                                        e.target.value
                                      )
                                    }
                                    className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* 2. Intervals / Breaks */}
                            <div className="space-y-2 pt-3 border-t border-zinc-900">
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                                  <Coffee className="w-3.5 h-3.5 text-amber-500/80" />
                                  Intervalos de pausa
                                </label>

                                <button
                                  type="button"
                                  onClick={() => handleAddBreak(dayIdx)}
                                  className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-bold px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-colors cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                  Adicionar intervalo
                                </button>
                              </div>

                              {breaks.length === 0 ? (
                                <p className="text-xs text-zinc-500 italic py-1">
                                  Nenhum intervalo configurado (expediente contínuo).
                                </p>
                              ) : (
                                <div className="space-y-2 pt-1">
                                  {breaks.map((brk, bIdx) => (
                                    <div
                                      key={bIdx}
                                      className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs"
                                    >
                                      <div className="flex items-center gap-2 sm:gap-3">
                                        <span className="text-zinc-400 font-medium text-[11px] min-w-[70px]">
                                          {breaks.length > 1
                                            ? `Intervalo ${bIdx + 1}`
                                            : 'Intervalo'}
                                        </span>
                                        <input
                                          type="time"
                                          value={brk.startTime}
                                          onChange={(e) =>
                                            handleUpdateBreak(
                                              dayIdx,
                                              bIdx,
                                              'startTime',
                                              e.target.value
                                            )
                                          }
                                          className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                                        />
                                        <span className="text-zinc-500 text-xs">→</span>
                                        <input
                                          type="time"
                                          value={brk.endTime}
                                          onChange={(e) =>
                                            handleUpdateBreak(
                                              dayIdx,
                                              bIdx,
                                              'endTime',
                                              e.target.value
                                            )
                                          }
                                          className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                                        />
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => handleRemoveBreak(dayIdx, bIdx)}
                                        className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                        title="Remover este intervalo"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-5 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-colors shadow-md shadow-amber-500/20 cursor-pointer"
            >
              {isEditing ? 'Salvar Alterações' : 'Adicionar Barbeiro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
