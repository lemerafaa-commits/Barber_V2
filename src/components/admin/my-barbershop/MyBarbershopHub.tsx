import React from 'react';
import {
  Store,
  Phone,
  MapPin,
  Clock,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { BusinessProfile, MyBarbershopSection } from '../../../types/businessProfile';

interface MyBarbershopHubProps {
  profile: BusinessProfile;
  onNavigateSection: (section: MyBarbershopSection) => void;
}

export const MyBarbershopHub: React.FC<MyBarbershopHubProps> = ({
  profile,
  onNavigateSection,
}) => {
  // Count open days for preview
  const openDaysCount = Object.values(profile.openingHours).filter(
    (day) => (day as { isOpen: boolean }).isOpen
  ).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title & Contextual Header */}
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-black text-white font-['Montserrat',sans-serif] flex items-center gap-2">
          <Store className="w-6 h-6 text-amber-500" />
          <span>Minha Barbearia</span>
        </h2>
        <p className="text-sm text-zinc-400">
          Gerencie a identidade, canais de contato, endereço e horários de funcionamento da sua barbearia.
        </p>
      </div>

      {/* 4 Clickable Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 1. IDENTIDADE */}
        <button
          type="button"
          onClick={() => onNavigateSection('identity')}
          className="p-5 sm:p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 hover:border-amber-500/50 hover:bg-zinc-900 transition-all text-left group flex flex-col justify-between space-y-4 cursor-pointer shadow-sm hover:shadow-amber-500/5"
        >
          <div className="flex items-start justify-between w-full">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div className="w-8 h-8 rounded-lg bg-zinc-800/80 flex items-center justify-center text-zinc-400 group-hover:text-amber-400 group-hover:bg-amber-500/10 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400/90">
                Apresentação
              </span>
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
              Identidade
            </h3>
            <p className="text-xs text-zinc-400 line-clamp-2">
              Foto/logo, nome do estabelecimento e descrição da sua marca.
            </p>
          </div>

          <div className="pt-2 border-t border-zinc-800/60 flex items-center gap-2 text-xs text-zinc-400">
            <span className="font-medium text-white">{profile.name}</span>
          </div>
        </button>

        {/* 2. CONTATO */}
        <button
          type="button"
          onClick={() => onNavigateSection('contact')}
          className="p-5 sm:p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 hover:border-amber-500/50 hover:bg-zinc-900 transition-all text-left group flex flex-col justify-between space-y-4 cursor-pointer shadow-sm hover:shadow-amber-500/5"
        >
          <div className="flex items-start justify-between w-full">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
              <Phone className="w-6 h-6" />
            </div>
            <div className="w-8 h-8 rounded-lg bg-zinc-800/80 flex items-center justify-center text-zinc-400 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400/90">
                Canais
              </span>
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
              Contato
            </h3>
            <p className="text-xs text-zinc-400 line-clamp-2">
              WhatsApp para atendimento e perfil do Instagram.
            </p>
          </div>

          <div className="pt-2 border-t border-zinc-800/60 flex items-center gap-2 text-xs text-zinc-400">
            <span className="font-medium text-white">{profile.whatsapp}</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400">{profile.instagram}</span>
          </div>
        </button>

        {/* 3. LOCALIZAÇÃO */}
        <button
          type="button"
          onClick={() => onNavigateSection('location')}
          className="p-5 sm:p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 hover:border-amber-500/50 hover:bg-zinc-900 transition-all text-left group flex flex-col justify-between space-y-4 cursor-pointer shadow-sm hover:shadow-amber-500/5"
        >
          <div className="flex items-start justify-between w-full">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div className="w-8 h-8 rounded-lg bg-zinc-800/80 flex items-center justify-center text-zinc-400 group-hover:text-sky-400 group-hover:bg-sky-500/10 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-sky-400/90">
                Endereço
              </span>
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-sky-300 transition-colors">
              Localização
            </h3>
            <p className="text-xs text-zinc-400 line-clamp-2">
              Endereço físico completo, bairro, número, cidade e estado.
            </p>
          </div>

          <div className="pt-2 border-t border-zinc-800/60 flex items-center gap-2 text-xs text-zinc-400">
            <span className="font-medium text-white truncate">
              {profile.address.street}, {profile.address.number} - {profile.address.city}/{profile.address.state}
            </span>
          </div>
        </button>

        {/* 4. HORÁRIOS */}
        <button
          type="button"
          onClick={() => onNavigateSection('hours')}
          className="p-5 sm:p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 hover:border-amber-500/50 hover:bg-zinc-900 transition-all text-left group flex flex-col justify-between space-y-4 cursor-pointer shadow-sm hover:shadow-amber-500/5"
        >
          <div className="flex items-start justify-between w-full">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div className="w-8 h-8 rounded-lg bg-zinc-800/80 flex items-center justify-center text-zinc-400 group-hover:text-purple-400 group-hover:bg-purple-500/10 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-purple-400/90">
                Funcionamento
              </span>
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
              Horários
            </h3>
            <p className="text-xs text-zinc-400 line-clamp-2">
              Dias de abertura, horários de início e término semanais.
            </p>
          </div>

          <div className="pt-2 border-t border-zinc-800/60 flex items-center gap-2 text-xs text-zinc-400">
            <span className="font-medium text-white">{openDaysCount} dias por semana</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400">09:00 — 19:00</span>
          </div>
        </button>
      </div>
    </div>
  );
};
