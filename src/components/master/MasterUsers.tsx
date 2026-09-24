import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  ShieldCheck,
  Briefcase,
  UserCheck,
  UserX,
  X,
  Filter,
} from 'lucide-react';
import { MasterUser, UserRole, UserStatus } from '../../types/master';

interface MasterUsersProps {
  users: MasterUser[];
}

export const MasterUsers: React.FC<MasterUsersProps> = ({ users }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.businessName && u.businessName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || u.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Usuários da Plataforma
          </h2>
          <p className="text-xs text-zinc-400">
            Diretório consolidado de administradores da plataforma e das barbearias
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800">
            Total: <strong className="text-white">{users.length}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
            Master: <strong>{users.filter((u) => u.role === 'master').length}</strong>
          </span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="master-user-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, e-mail ou barbearia..."
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

        {/* Role Filters */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                roleFilter === 'all'
                  ? 'bg-zinc-800 text-white font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('master')}
              className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                roleFilter === 'master'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Master
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('business_admin')}
              className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                roleFilter === 'business_admin'
                  ? 'bg-zinc-800 text-white font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Business Admin
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 uppercase tracking-wider text-[10px] font-semibold">
                <th className="py-3.5 px-4 sm:px-6">Nome</th>
                <th className="py-3.5 px-4">E-mail</th>
                <th className="py-3.5 px-4">Função</th>
                <th className="py-3.5 px-4">Barbearia Vinculada</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Último Acesso</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Criado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    Nenhum usuário encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isMaster = user.role === 'master';

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-zinc-950/40 transition-colors"
                    >
                      {/* Name */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              isMaster
                                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                                : 'bg-zinc-800 text-zinc-300'
                            }`}
                          >
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-white block">{user.name}</span>
                            <span className="text-[10px] text-zinc-400 font-mono">{user.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 text-zinc-300 font-mono text-[11px]">
                        {user.email}
                      </td>

                      {/* Função */}
                      <td className="py-3.5 px-4">
                        {isMaster ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                            <ShieldCheck className="w-3 h-3" />
                            Master
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                            <Briefcase className="w-3 h-3 text-zinc-400" />
                            Business Admin
                          </span>
                        )}
                      </td>

                      {/* Barbearia */}
                      <td className="py-3.5 px-4">
                        {user.businessName ? (
                          <span className="text-zinc-200 font-medium">
                            {user.businessName}
                          </span>
                        ) : (
                          <span className="text-zinc-500 italic">Global (Toda a Rede)</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {user.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            Suspenso
                          </span>
                        )}
                      </td>

                      {/* Último acesso */}
                      <td className="py-3.5 px-4 text-zinc-400 text-[11px]">
                        {user.lastLoginAt}
                      </td>

                      {/* Criado em */}
                      <td className="py-3.5 px-4 sm:px-6 text-right text-zinc-400 text-[11px]">
                        {user.createdAt}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-950/40 flex items-center justify-between text-xs text-zinc-400">
          <span>
            Exibindo {filteredUsers.length} de {users.length} usuários
          </span>
          <span className="text-[11px]">
            Preparado para Firebase Authentication + Custom Claims
          </span>
        </div>
      </div>
    </div>
  );
};
