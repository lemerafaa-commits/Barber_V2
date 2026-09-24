import React, { useState, useMemo } from 'react';
import {
  Store,
  Search,
  Plus,
  Filter,
  Eye,
  MoreVertical,
  Calendar,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Building2,
  X,
} from 'lucide-react';
import { MasterBusiness, BusinessStatus } from '../../types/master';
import { MasterBusinessDetailModal } from './MasterBusinessDetailModal';

interface MasterBusinessesProps {
  businesses: MasterBusiness[];
}

export const MasterBusinesses: React.FC<MasterBusinessesProps> = ({ businesses }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | BusinessStatus>('all');
  const [selectedBusiness, setSelectedBusiness] = useState<MasterBusiness | null>(null);
  const [isNewBusinessModalOpen, setIsNewBusinessModalOpen] = useState(false);

  // Filtered businesses
  const filteredBusinesses = useMemo(() => {
    return businesses.filter((biz) => {
      const matchesSearch =
        biz.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        biz.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        biz.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        biz.city.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || biz.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [businesses, searchTerm, statusFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header / Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Store className="w-5 h-5 text-indigo-400" />
            Barbearias Cadastradas
          </h2>
          <p className="text-xs text-zinc-400">
            {businesses.length} estabelecimentos na rede da plataforma
          </p>
        </div>

        {/* Action button */}
        <button
          id="master-new-business-btn"
          type="button"
          onClick={() => setIsNewBusinessModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm shadow-indigo-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Barbearia</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="master-business-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, slug, proprietário ou cidade..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-[11px] font-medium text-zinc-400 mr-1 hidden sm:inline">Status:</span>
          {(
            [
              { id: 'all', label: 'Todas' },
              { id: 'active', label: 'Ativas' },
              { id: 'trial', label: 'Trial' },
              { id: 'suspended', label: 'Suspensas' },
            ] as const
          ).map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setStatusFilter(filter.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === filter.id
                  ? 'bg-zinc-800 text-white border border-zinc-700 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Businesses Table */}
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 uppercase tracking-wider text-[10px] font-semibold">
                <th className="py-3.5 px-4 sm:px-6">Nome / Barbearia</th>
                <th className="py-3.5 px-4">Proprietário</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Agendamentos</th>
                <th className="py-3.5 px-4">Plano</th>
                <th className="py-3.5 px-4">Criada em</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {filteredBusinesses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    Nenhuma barbearia encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredBusinesses.map((biz) => {
                  return (
                    <tr
                      key={biz.id}
                      className="hover:bg-zinc-950/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedBusiness(biz)}
                    >
                      {/* Name & Slug */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                            <Store className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                              {biz.name}
                            </div>
                            <div className="text-[11px] text-zinc-400 font-mono">
                              /{biz.slug} • {biz.city}-{biz.state}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Owner */}
                      <td className="py-4 px-4">
                        <div className="font-medium text-zinc-200">{biz.ownerName}</div>
                        <div className="text-[11px] text-zinc-400">{biz.ownerEmail}</div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {biz.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Ativa
                          </span>
                        ) : biz.status === 'trial' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                            Trial
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            Suspensa
                          </span>
                        )}
                      </td>

                      {/* Agendamentos */}
                      <td className="py-4 px-4 text-center">
                        <span className="font-bold text-white">{biz.appointmentCount}</span>
                      </td>

                      {/* Plano */}
                      <td className="py-4 px-4">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                            biz.plan === 'enterprise'
                              ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                              : biz.plan === 'pro'
                              ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                              : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                          }`}
                        >
                          {biz.plan}
                        </span>
                      </td>

                      {/* Criada em */}
                      <td className="py-4 px-4 text-zinc-400 text-[11px] whitespace-nowrap">
                        {biz.createdAt}
                      </td>

                      {/* Ações */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBusiness(biz);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Ver Detalhes</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/40 flex items-center justify-between text-xs text-zinc-400">
          <span>
            Exibindo {filteredBusinesses.length} de {businesses.length} barbearias
          </span>
          <span className="text-[11px]">Camada Multi-Tenant Preparada</span>
        </div>
      </div>

      {/* Business Details Drawer / Modal */}
      <MasterBusinessDetailModal
        business={selectedBusiness}
        onClose={() => setSelectedBusiness(null)}
      />

      {/* Nova Barbearia Mock Modal */}
      {isNewBusinessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs"
            onClick={() => setIsNewBusinessModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                Cadastrar Nova Barbearia
              </h3>
              <button
                type="button"
                onClick={() => setIsNewBusinessModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Nome da Barbearia</label>
                <input
                  type="text"
                  placeholder="Ex: Dom Pedro Barber"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200"
                />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Slug único da URL</label>
                <div className="flex items-center gap-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-400">
                  <span>barbersaas.com.br/</span>
                  <input
                    type="text"
                    placeholder="dom-pedro"
                    className="bg-transparent text-white focus:outline-none w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">E-mail do Proprietário</label>
                <input
                  type="email"
                  placeholder="proprietario@exemplo.com"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200"
                />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Plano Inicial</label>
                <select className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200">
                  <option value="trial_pro">Trial Pro (14 dias grátis)</option>
                  <option value="starter">Starter - R$ 99/mês</option>
                  <option value="pro">Pro - R$ 189/mês</option>
                  <option value="enterprise">Enterprise - R$ 349/mês</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsNewBusinessModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(
                    'Demonstração visual: Em fases futuras, esta ação criará o Tenant no Firestore e o usuário no Firebase Auth.'
                  );
                  setIsNewBusinessModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500"
              >
                Criar Barbearia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
