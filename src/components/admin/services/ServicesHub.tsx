import React, { useState } from 'react';
import {
  Scissors,
  Plus,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  Layers,
  Power,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { AdminService, ServiceCategoryDefinition, ServiceCategoryId } from '../../../types/admin';
import {
  DEFAULT_SERVICE_CATEGORIES,
  groupServicesByCategory,
} from '../../../services/adminServiceDomain';
import {
  createFirestoreService,
  updateFirestoreService,
  toggleFirestoreServiceActive,
  getFirestoreServices,
  CANONICAL_BUSINESS_ID,
} from '../../../services/firebase/services';
import { ServiceCard } from './ServiceCard';
import { ServiceFormModal } from './ServiceFormModal';

interface ServicesHubProps {
  services: AdminService[];
  onServicesChange: (updatedServices: AdminService[]) => void;
  isLoading?: boolean;
  onRefresh?: () => Promise<void>;
}

export const ServicesHub: React.FC<ServicesHubProps> = ({
  services,
  onServicesChange,
  isLoading = false,
  onRefresh,
}) => {
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedServiceToEdit, setSelectedServiceToEdit] = useState<AdminService | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Feedback banner state
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  // Handlers
  const handleOpenAddModal = () => {
    setSelectedServiceToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (service: AdminService) => {
    setSelectedServiceToEdit(service);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setSelectedServiceToEdit(null);
  };

  const handleSaveService = async (serviceData: {
    name: string;
    categoryId: ServiceCategoryId;
    description: string;
    price: number;
    durationMinutes: number;
    active: boolean;
  }) => {
    setIsSaving(true);
    try {
      if (selectedServiceToEdit) {
        // Update in Cloud Firestore
        await updateFirestoreService(selectedServiceToEdit.id, serviceData);

        const categoryDef = DEFAULT_SERVICE_CATEGORIES.find((c) => c.id === serviceData.categoryId);
        const updatedList = services.map((s) =>
          s.id === selectedServiceToEdit.id
            ? {
                ...s,
                ...serviceData,
                categoryName: categoryDef?.name || serviceData.categoryId,
                updatedAt: new Date().toISOString(),
              }
            : s
        );

        onServicesChange(updatedList);
        showFeedback(`Serviço "${serviceData.name}" atualizado com sucesso no Firestore!`);
        setIsModalOpen(false);
        setSelectedServiceToEdit(null);
      } else {
        // Create in Cloud Firestore
        const createdService = await createFirestoreService(serviceData, CANONICAL_BUSINESS_ID);
        onServicesChange([...services, createdService]);
        showFeedback(`Serviço "${serviceData.name}" adicionado com sucesso no Firestore!`);
        setIsModalOpen(false);
        setSelectedServiceToEdit(null);
      }
    } catch (err: any) {
      console.error('Erro ao salvar serviço no Firestore:', err);
      const message = err?.message || 'Falha ao salvar o serviço no Firestore. Tente novamente.';
      showFeedback(message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    const targetService = services.find((s) => s.id === id);
    if (!targetService) return;

    const nextActive = !targetService.active;
    setTogglingId(id);

    try {
      // Persist active status toggle in Cloud Firestore
      await toggleFirestoreServiceActive(id, nextActive);

      const updatedList = services.map((s) =>
        s.id === id ? { ...s, active: nextActive, updatedAt: new Date().toISOString() } : s
      );

      onServicesChange(updatedList);
      showFeedback(
        `Serviço "${targetService.name}" ${nextActive ? 'ativado' : 'desativado'} com sucesso!`,
        'info'
      );
    } catch (err: any) {
      console.error('Erro ao alternar status do serviço no Firestore:', err);
      showFeedback('Falha ao atualizar o status no Firestore.', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  // Metrics derived from services
  const totalCount = services.length;
  const activeCount = services.filter((s) => s.active).length;
  const inactiveCount = totalCount - activeCount;

  // Grouped services
  const groupedCategories = groupServicesByCategory(services, DEFAULT_SERVICE_CATEGORIES);

  const getCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'Razor':
        return (
          <span className="text-sm leading-none select-none" role="img" aria-label="barba">
            🧔
          </span>
        );
      default:
        return <Scissors className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Feedback Toast Notification Banner */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-lg transition-all animate-fadeIn ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
              : feedbackMessage.type === 'error'
              ? 'bg-red-950/80 border-red-500/40 text-red-300'
              : 'bg-zinc-900/90 border-amber-500/40 text-amber-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : feedbackMessage.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-bold tracking-wide">
              {feedbackMessage.text}
            </span>
          </div>
          <span className="text-[11px] text-zinc-400 font-mono shrink-0">
            Cloud Firestore
          </span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800/80 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Scissors className="w-4 h-4" />
            </div>
            <span className="text-amber-500 font-extrabold tracking-wider text-xs uppercase">
              Catálogo de Atendimentos
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white font-['Montserrat',sans-serif]">
            Meus Serviços
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xl">
            Configure os serviços oferecidos, valores e tempos de atendimento sincronizados diretamente no Cloud Firestore.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              title="Atualizar serviços do Firestore"
              className="p-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          )}

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex-1 sm:flex-initial px-5 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>ADICIONAR SERVIÇO</span>
          </button>
        </div>
      </div>

      {/* Loading Overlay / Indicator */}
      {isLoading && (
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-center gap-3 text-zinc-400 text-xs">
          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
          <span>Sincronizando serviços com Cloud Firestore...</span>
        </div>
      )}

      {/* Overview Metrics Strip */}
      <section className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
        {/* Total */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 text-center">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">
            Total
          </span>
          <span className="text-xl sm:text-2xl font-black text-white font-['Montserrat',sans-serif]">
            {totalCount}
          </span>
        </div>

        {/* Ativos */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 text-center">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-0.5">
            Ativos
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-400 font-['Montserrat',sans-serif]">
            {activeCount}
          </span>
        </div>

        {/* Inativos */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 text-center">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">
            Inativos
          </span>
          <span className="text-xl sm:text-2xl font-black text-zinc-400 font-['Montserrat',sans-serif]">
            {inactiveCount}
          </span>
        </div>
      </section>

      {/* Categories Grouping Sections */}
      <div className="space-y-6">
        {groupedCategories.map(({ category, services: categoryServices }) => {
          return (
            <section
              key={category.id}
              className="p-5 sm:p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/60 space-y-4"
            >
              {/* Category Section Header */}
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-zinc-800 text-zinc-300 border border-zinc-700/50">
                    {getCategoryIcon(category.iconName)}
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider font-['Montserrat',sans-serif]">
                      {category.name}
                    </h3>
                    <p className="text-xs text-zinc-400">{category.description}</p>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded-full border border-zinc-800">
                  {categoryServices.length} serviço{categoryServices.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Services Grid for Category */}
              {categoryServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {categoryServices.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      onEdit={handleOpenEditModal}
                      onToggleActive={handleToggleActive}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-zinc-950/40 border border-dashed border-zinc-800 text-center space-y-2">
                  <p className="text-xs sm:text-sm text-zinc-400 font-medium">
                    Nenhum serviço cadastrado na categoria "{category.name}".
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenAddModal}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Cadastrar serviço nesta categoria</span>
                  </button>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Reusable Form Modal for Add and Edit */}
      <ServiceFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveService}
        serviceToEdit={selectedServiceToEdit}
        isSaving={isSaving}
      />
    </div>
  );
};

