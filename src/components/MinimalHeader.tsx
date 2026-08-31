import React, { useState } from 'react';
import { Scissors, Info, MapPin, Instagram, MessageCircle, Clock, X } from 'lucide-react';
import { Barbershop } from '../types/booking';

interface MinimalHeaderProps {
  barbershop: Barbershop;
}

export const MinimalHeader: React.FC<MinimalHeaderProps> = ({ barbershop }) => {
  const [showInfoModal, setShowInfoModal] = useState(false);

  return (
    <>
      {/* Minimal Top Header Bar */}
      <header className="w-full bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-3.5 sm:p-4 mb-6 flex items-center justify-between shadow-lg backdrop-blur-md">
        {/* Left: Small Logo + Barbershop Name */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 p-0.5 shadow-md flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-[10px] bg-zinc-950 flex items-center justify-center overflow-hidden">
              <img
                src={barbershop.logoUrl}
                alt={barbershop.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <Scissors className="w-5 h-5 text-amber-400 absolute hidden" />
            </div>
          </div>
          <div>
            <h1 className="font-black text-base sm:text-lg tracking-wider text-white font-['Montserrat',sans-serif] uppercase leading-none">
              {barbershop.name}
            </h1>
            <p className="text-[11px] text-zinc-400 font-medium mt-0.5 hidden sm:block">
              Agendamento Online
            </p>
          </div>
        </div>

        {/* Right: Info Button */}
        <button
          type="button"
          onClick={() => setShowInfoModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700/80 text-zinc-300 hover:text-white text-xs font-semibold border border-zinc-700/60 transition-all cursor-pointer focus:outline-none"
          aria-label="Ver informações da barbearia"
        >
          <Info className="w-3.5 h-3.5 text-amber-400" />
          <span>Informações</span>
        </button>
      </header>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white font-['Montserrat',sans-serif] uppercase">
                    {barbershop.name}
                  </h3>
                  <p className="text-xs text-amber-400 font-semibold">{barbershop.tagline}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              {barbershop.description}
            </p>

            {/* Details List */}
            <div className="space-y-3 pt-1 text-xs sm:text-sm">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">{barbershop.address}</p>
                  <p className="text-zinc-400 text-xs">{barbershop.city} - {barbershop.state}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Horário de funcionamento</p>
                  <p className="text-zinc-400 text-xs">{barbershop.openingHoursText || 'Terça a Sábado: 09:00 às 19:00'}</p>
                </div>
              </div>
            </div>

            {/* Social Buttons */}
            <div className="flex gap-2.5 pt-2">
              <a
                href={barbershop.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-2 border border-zinc-700/60"
              >
                <Instagram className="w-4 h-4 text-pink-400" />
                <span>Instagram</span>
              </a>

              <a
                href={barbershop.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 border border-emerald-800/50"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp</span>
              </a>
            </div>

            <button
              type="button"
              onClick={() => setShowInfoModal(false)}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-wider"
            >
              Voltar ao agendamento
            </button>
          </div>
        </div>
      )}
    </>
  );
};
