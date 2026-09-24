import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Scissors,
  Clock,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Edit3,
  Power,
  Eye,
  Calendar,
  Loader2,
} from 'lucide-react';
import { Barber, AdminService } from '../../../types/admin';
import { MOCK_BARBERS } from '../../../data/adminMockData';
import {
  getFirestoreProfessionals,
  createFirestoreProfessional,
  updateFirestoreProfessional,
  setProfessionalStatus,
} from '../../../services/firebase/professionals';
import { AdminBarberFormModal } from './AdminBarberFormModal';
import { AdminBarberDetailsModal } from './AdminBarberDetailsModal';
import { AdminBarberDeactivateModal } from './AdminBarberDeactivateModal';

interface AdminTeamProps {
  services: AdminService[];
  businessId?: string;
  onRefreshServices?: () => Promise<void>;
}

export const AdminTeam: React.FC<AdminTeamProps> = ({
  services,
  businessId = 'joao-barber',
  onRefreshServices,
}) => {
  const [barbers, setBarbers] = useState<Barber[]>(MOCK_BARBERS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);

  const [detailsBarber, setDetailsBarber] = useState<Barber | null>(null);

  const [deactivatingBarber, setDeactivatingBarber] = useState<Barber | null>(null);

  // Refresh services on mount if handler provided
  useEffect(() => {
    if (onRefreshServices) {
      onRefreshServices().catch((err) => {
        console.warn('[AdminTeam] Aviso ao atualizar catálogo de serviços:', err);
      });
    }
  }, [onRefreshServices]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await getFirestoreProfessionals(businessId);
        if (isMounted) {
          setBarbers(data);
        }
      } catch (err) {
        console.warn('Utilizando profissionais locais/demo:', err);
        if (isMounted) {
          setBarbers(MOCK_BARBERS);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [businessId]);

  // Filtered barbers
  const filteredBarbers = barbers.filter((barber) => {
    if (filterStatus === 'active' && barber.status !== 'active') return false;
    if (filterStatus === 'inactive' && barber.status !== 'inactive') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = barber.name.toLowerCase().includes(q);
      const matchPhone = barber.whatsapp.toLowerCase().includes(q);
      const matchEmail = (barber.email || '').toLowerCase().includes(q);
      return matchName || matchPhone || matchEmail;
    }

    return true;
  });

  const activeCount = barbers.filter((b) => b.status === 'active').length;
  const inactiveCount = barbers.filter((b) => b.status === 'inactive').length;

  // Handlers for Firestore / Service Actions
  const handleSaveBarber = async (barberData: Omit<Barber, 'id' | 'createdAt'> & { id?: string }) => {
    setActionError(null);
    console.info('[Equipe UI] Salvando profissional:', { isEdit: Boolean(barberData.id), name: barberData.name, businessId });
    try {
      if (barberData.id) {
        // Edit existing in Firestore
        await updateFirestoreProfessional(barberData.id, barberData);
        setBarbers((prev) =>
          prev.map((b) =>
            b.id === barberData.id
              ? {
                  ...b,
                  ...barberData,
                  updatedAt: new Date().toISOString(),
                }
              : b
          )
        );
      } else {
        // Create new in Firestore
        const savedBarber = await createFirestoreProfessional({
          ...barberData,
          businessId,
        });
        setBarbers((prev) => [savedBarber, ...prev]);
      }
    } catch (err: any) {
      console.error('[Equipe UI] Erro ao salvar profissional:', err);
      let errorMsg = 'Não foi possível salvar o profissional no banco de dados.';
      try {
        const parsed = JSON.parse(err.message);
        if (parsed?.error) {
          if (
            parsed.error.includes('Missing or insufficient permissions') ||
            parsed.error.includes('permission-denied')
          ) {
            errorMsg =
              'Permissão negada no Firestore (permission-denied): As regras para a coleção /professionals precisam ser atualizadas no Firebase Console.';
          } else {
            errorMsg = `Erro Firestore: ${parsed.error}`;
          }
        }
      } catch {
        if (err?.message) {
          errorMsg = `Erro: ${err.message}`;
        }
      }
      setActionError(errorMsg);
    }
  };

  const handleDeactivateBarber = async (barberId: string) => {
    setActionError(null);
    console.info('[Equipe UI] Desativando profissional ID:', barberId);
    try {
      await setProfessionalStatus(barberId, 'inactive');
      setBarbers((prev) =>
        prev.map((b) => (b.id === barberId ? { ...b, status: 'inactive', active: false } : b))
      );
    } catch (err: any) {
      console.error('[Equipe UI] Erro ao desativar profissional:', err);
      setActionError('Não foi possível desativar o profissional no banco de dados. Tente novamente.');
    }
  };

  const handleActivateBarber = async (barberId: string) => {
    setActionError(null);
    console.info('[Equipe UI] Reativando profissional ID:', barberId);
    try {
      await setProfessionalStatus(barberId, 'active');
      setBarbers((prev) =>
        prev.map((b) => (b.id === barberId ? { ...b, status: 'active', active: true } : b))
      );
    } catch (err: any) {
      console.error('[Equipe UI] Erro ao ativar profissional:', err);
      setActionError('Não foi possível ativar o profissional no banco de dados. Tente novamente.');
    }
  };

  // Helper to summarize weekly schedule into compact label
  const getScheduleSummary = (schedule: Barber['schedule']) => {
    const activeDays = schedule.filter((d) => !d.isDayOff);
    if (activeDays.length === 0) return 'Sem horários definidos';
    if (activeDays.length === 7) return 'Atende todos os dias';

    const dayNames = activeDays.map((d) => d.dayName.slice(0, 3));
    return `${dayNames.join(', ')} (${activeDays[0].startTime} - ${activeDays[0].endTime})`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Action error notification if any operation fails */}
      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in duration-150">
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

      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-white font-['Montserrat',sans-serif]">
              Equipe
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-semibold border border-zinc-700 flex items-center gap-1.5">
              {isLoading && <Loader2 className="w-3 h-3 text-amber-500 animate-spin" />}
              {barbers.length} profissionais
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Gerencie os profissionais que atendem nesta barbearia.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingBarber(null);
            setIsFormModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs sm:text-sm transition-all shadow-md shadow-amber-500/20 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Adicionar barbeiro</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800/80">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              filterStatus === 'all'
                ? 'bg-amber-500 text-zinc-950'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            Todos ({barbers.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              filterStatus === 'active'
                ? 'bg-amber-500 text-zinc-950'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            Ativos ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('inactive')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              filterStatus === 'inactive'
                ? 'bg-amber-500 text-zinc-950'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            Inativos ({inactiveCount})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar barbeiro..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Barbers Table / Cards */}
      {filteredBarbers.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-zinc-500">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Nenhum barbeiro encontrado</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {searchQuery
              ? 'Nenhum profissional corresponde aos filtros de busca informados.'
              : 'Cadastre o primeiro barbeiro para começar a gerenciar sua equipe.'}
          </p>
          {!searchQuery && (
            <button
              type="button"
              onClick={() => {
                setEditingBarber(null);
                setIsFormModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 text-xs font-bold hover:bg-amber-400 transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Adicionar Primeiro Barbeiro
            </button>
          )}
        </div>
      ) : (
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800/80 bg-zinc-950/60 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Profissional</th>
                  <th className="py-3.5 px-4">Contato</th>
                  <th className="py-3.5 px-4">Serviços</th>
                  <th className="py-3.5 px-4">Horários</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-xs">
                {filteredBarbers.map((barber) => {
                  const isActive = barber.status === 'active';
                  return (
                    <tr
                      key={barber.id}
                      className={`hover:bg-zinc-800/40 transition-colors ${
                        !isActive ? 'opacity-60 bg-zinc-950/30' : ''
                      }`}
                    >
                      {/* Barber Avatar & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={barber.photoUrl}
                            alt={barber.name}
                            className="w-10 h-10 rounded-xl object-cover border border-zinc-700/80 shrink-0"
                          />
                          <div>
                            <button
                              type="button"
                              onClick={() => setDetailsBarber(barber)}
                              className="font-bold text-white hover:text-amber-400 transition-colors cursor-pointer text-left block"
                            >
                              {barber.name}
                            </button>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              ID: {barber.id.slice(0, 10)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact: WhatsApp and Email */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-zinc-200 font-medium">
                            <Phone className="w-3 h-3 text-amber-500/80" />
                            <span>{barber.whatsapp}</span>
                          </div>
                          {barber.email && (
                            <div className="text-[11px] text-zinc-500 truncate max-w-[160px]">
                              {barber.email}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Services */}
                      <td className="py-3.5 px-4">
                        {barber.serviceMode === 'all' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            <Scissors className="w-3 h-3" />
                            Todos os serviços
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                            {barber.serviceIds.length} serviços selecionados
                          </span>
                        )}
                      </td>

                      {/* Schedule Summary */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] max-w-[180px]">
                          <Clock className="w-3 h-3 text-zinc-500 shrink-0" />
                          <span className="truncate" title={getScheduleSummary(barber.schedule)}>
                            {getScheduleSummary(barber.schedule)}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                            Inativo
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDetailsBarber(barber)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Ver detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingBarber(barber);
                              setIsFormModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Editar barbeiro"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {isActive ? (
                            <button
                              type="button"
                              onClick={() => setDeactivatingBarber(barber)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Desativar barbeiro"
                            >
                              <Power className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleActivateBarber(barber.id)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                              title="Ativar barbeiro"
                            >
                              <Power className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-zinc-800/80">
            {filteredBarbers.map((barber) => {
              const isActive = barber.status === 'active';
              return (
                <div
                  key={barber.id}
                  className={`p-4 space-y-3 ${!isActive ? 'opacity-60 bg-zinc-950/40' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={barber.photoUrl}
                        alt={barber.name}
                        className="w-12 h-12 rounded-xl object-cover border border-zinc-700"
                      />
                      <div>
                        <h4 className="font-bold text-white text-sm">{barber.name}</h4>
                        <div className="text-xs text-zinc-400 mt-0.5">{barber.whatsapp}</div>
                      </div>
                    </div>

                    {isActive ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Ativo
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                        Inativo
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {barber.serviceMode === 'all' ? (
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px]">
                        Todos os serviços
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 text-[11px]">
                        {barber.serviceIds.length} serviços
                      </span>
                    )}

                    <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      {getScheduleSummary(barber.schedule)}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800/60">
                    <button
                      type="button"
                      onClick={() => setDetailsBarber(barber)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                    >
                      Ver detalhes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBarber(barber);
                        setIsFormModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-amber-400 transition-colors"
                    >
                      Editar
                    </button>
                    {isActive ? (
                      <button
                        type="button"
                        onClick={() => setDeactivatingBarber(barber)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      >
                        Desativar
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleActivateBarber(barber.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      >
                        Ativar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Form Modal: Add or Edit Barber */}
      <AdminBarberFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingBarber(null);
        }}
        onSave={handleSaveBarber}
        initialBarber={editingBarber}
        services={services}
      />

      {/* Details Modal */}
      {detailsBarber && (
        <AdminBarberDetailsModal
          barber={detailsBarber}
          services={services}
          isOpen={Boolean(detailsBarber)}
          onClose={() => setDetailsBarber(null)}
          onEdit={() => {
            const b = detailsBarber;
            setDetailsBarber(null);
            setEditingBarber(b);
            setIsFormModalOpen(true);
          }}
          onToggleStatus={() => {
            const b = detailsBarber;
            setDetailsBarber(null);
            if (b.status === 'active') {
              setDeactivatingBarber(b);
            } else {
              handleActivateBarber(b.id);
            }
          }}
        />
      )}

      {/* Deactivate Confirmation Modal */}
      {deactivatingBarber && (
        <AdminBarberDeactivateModal
          barber={deactivatingBarber}
          isOpen={Boolean(deactivatingBarber)}
          onClose={() => setDeactivatingBarber(null)}
          onConfirm={() => handleDeactivateBarber(deactivatingBarber.id)}
        />
      )}
    </div>
  );
};
