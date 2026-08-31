import React from 'react';
import { MapPin, Instagram, MessageCircle, Clock, ShieldCheck } from 'lucide-react';
import { Barbershop } from '../types/booking';

interface BarbershopInfoFooterProps {
  barbershop: Barbershop;
}

export const BarbershopInfoFooter: React.FC<BarbershopInfoFooterProps> = ({ barbershop }) => {
  return (
    <footer className="w-full mt-12 pt-8 border-t border-zinc-800/80 text-zinc-400 space-y-6">
      <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 p-0.5 shadow-md flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-[14px] bg-zinc-950 flex items-center justify-center overflow-hidden">
              <img
                src={barbershop.logoUrl}
                alt={barbershop.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-black text-white font-['Montserrat',sans-serif] uppercase tracking-wider">
              Sobre a barbearia
            </h2>
            <p className="text-xs text-amber-400 font-semibold">{barbershop.name}</p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
          "{barbershop.tagline}" — {barbershop.description}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
            <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-zinc-200">{barbershop.address}, {barbershop.city} - {barbershop.state}</span>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-zinc-200">{barbershop.openingHoursText || 'Terça a Sábado: 09:00 - 19:00'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <a
            href={barbershop.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
          >
            <Instagram className="w-4 h-4 text-pink-400" />
            <span>{barbershop.instagramHandle}</span>
          </a>

          <span className="text-zinc-700">•</span>

          <a
            href={barbershop.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp Barão</span>
          </a>
        </div>
      </div>

      <div className="text-center text-[11px] text-zinc-600 flex items-center justify-center gap-1 pb-4">
        <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
        <span>SaaS Multiempresa de Agendamento Online • Barbearia</span>
      </div>
    </footer>
  );
};
