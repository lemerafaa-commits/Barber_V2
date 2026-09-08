import React, { useState } from 'react';
import {
  CheckCircle2,
  Calendar,
  MessageCircle,
  Home,
  Clock,
  User,
  Scissors,
  MapPin,
  Download,
  ExternalLink,
  Share2,
  Sparkles
} from 'lucide-react';
import { Appointment } from '../types/booking';
import {
  generateGoogleCalendarUrl,
  downloadIcsFile,
  generateWhatsAppLink
} from '../utils/calendar';

interface BookingConfirmationProps {
  appointment: Appointment;
  onResetToHome: () => void;
}

export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  appointment,
  onResetToHome,
}) => {
  const [showCalendarOptions, setShowCalendarOptions] = useState(false);

  const googleCalUrl = generateGoogleCalendarUrl(appointment);
  const whatsappUrl = generateWhatsAppLink(appointment);

  return (
    <section className="w-full max-w-lg mx-auto py-4 space-y-6 animate-fade-in">
      {/* Top Success Badge */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl text-center space-y-4 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Animated Checkmark Circle */}
        <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 text-zinc-950 shadow-xl ring-8 ring-emerald-500/20">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>

        {/* Title & Subtitle */}
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Reserva Confirmada
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-['Montserrat',sans-serif] tracking-tight">
            Agendamento confirmado!
          </h2>
          <p className="text-sm text-zinc-300 mt-1">
            Seu horário está reservado com sucesso na barbearia.
          </p>
          {appointment.clientInfo?.whatsappOptIn && (
            <p className="text-xs text-emerald-400/90 mt-1.5 flex items-center justify-center gap-1.5 font-medium">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Enviamos a confirmação para o seu WhatsApp.</span>
            </p>
          )}
        </div>

        {/* Appointment Code Badge */}
        <div className="inline-block px-4 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 font-mono">
          Código da reserva: <strong className="text-amber-400 font-bold">{appointment.code}</strong>
        </div>

        {/* Summary Card Details */}
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 text-left space-y-3">
          <div className="pb-2.5 border-b border-zinc-800 space-y-2">
            <div className="flex items-center gap-2">
              <Scissors className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
                Serviço(s) agendado(s):
              </span>
            </div>
            <div className="space-y-1.5 pl-6">
              {(appointment.services && appointment.services.length > 0
                ? appointment.services
                : [appointment.service]
              ).map((srv, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs sm:text-sm">
                  <div>
                    <span className="font-bold text-white">{srv.name}</span>
                    {srv.selectedOption && (
                      <span className="block text-[11px] font-medium text-amber-400">
                        Estilo: {srv.selectedOption}
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-amber-400 ml-2">
                    R$ {srv.price.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-zinc-400">Data:</span>
            </div>
            <span className="font-bold text-white text-sm capitalize">
              {appointment.formattedDate}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-zinc-400">Horário:</span>
            </div>
            <span className="font-bold text-amber-400 text-base font-['Montserrat',sans-serif]">
              {appointment.time} ({appointment.durationMinutes} min)
            </span>
          </div>

          <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-zinc-400">Profissional:</span>
            </div>
            <span className="font-bold text-white text-sm">
              {appointment.professional.name}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-zinc-400">Local:</span>
            </div>
            <span className="font-bold text-white text-sm">
              {appointment.barbershop.name}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {/* Add to Calendar Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCalendarOptions(!showCalendarOptions)}
              className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Adicionar à agenda</span>
            </button>

            {/* Calendar Options Dropdown */}
            {showCalendarOptions && (
              <div className="mt-2 p-2 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1 shadow-2xl animate-fade-in text-left">
                <a
                  href={googleCalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-zinc-800 text-xs font-semibold text-zinc-200"
                >
                  <span className="flex items-center gap-2">
                    <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                    Google Calendar
                  </span>
                  <span className="text-[10px] text-zinc-500">Abrir web</span>
                </a>

                <button
                  type="button"
                  onClick={() => downloadIcsFile(appointment)}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-zinc-800 text-xs font-semibold text-zinc-200 text-left"
                >
                  <span className="flex items-center gap-2">
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    Apple / Outlook / iCal (.ics)
                  </span>
                  <span className="text-[10px] text-zinc-500">Baixar arquivo</span>
                </button>
              </div>
            )}
          </div>

          {/* WhatsApp Confirmation Button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Falar pelo WhatsApp</span>
          </a>

          {/* Return Home Secondary Button */}
          <button
            type="button"
            onClick={onResetToHome}
            className="w-full py-3 px-4 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 border border-zinc-700/50 mt-4 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Voltar para o início</span>
          </button>
        </div>
      </div>
    </section>
  );
};
