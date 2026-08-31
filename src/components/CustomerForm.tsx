import React from 'react';
import { User, Phone, ShieldCheck, CheckCircle2, ArrowLeft, Loader2, Edit2, Clock } from 'lucide-react';
import { ClientInfo, BookingState, StepNumber } from '../types/booking';
import { formatBrazilianPhone, isValidBrazilianPhone } from '../utils/phoneMask';

interface CustomerFormProps {
  clientInfo: ClientInfo;
  onChangeClientInfo: (info: ClientInfo) => void;
  bookingState?: BookingState;
  onEditStep?: (step: StepNumber) => void;
  onBack?: () => void;
  onConfirm?: () => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  clientInfo,
  onChangeClientInfo,
  bookingState,
  onEditStep,
  onBack,
  onConfirm,
  isSubmitting = false,
  errorMessage = null,
}) => {
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeClientInfo({
      ...clientInfo,
      name: e.target.value,
    });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBrazilianPhone(e.target.value);
    onChangeClientInfo({
      ...clientInfo,
      phone: formatted,
    });
  };

  const isPhoneValid = isValidBrazilianPhone(clientInfo.phone);
  const isNameValid = clientInfo.name.trim().length >= 3;

  const selectedServices =
    bookingState?.services && bookingState.services.length > 0
      ? bookingState.services
      : bookingState?.service
      ? [bookingState.service]
      : [];

  const totalPrice = selectedServices.reduce((acc, s) => acc + s.price, 0);

  const canConfirm =
    isNameValid &&
    isPhoneValid &&
    selectedServices.length > 0 &&
    Boolean(bookingState?.selectedDate) &&
    Boolean(bookingState?.selectedTime);

  return (
    <section className="w-full space-y-6 pt-1">
      {/* Top Back Link */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Data e Horário</span>
        </button>
      )}

      {/* Section Header */}
      <div>
        <span className="text-xs font-bold tracking-wider text-amber-500 uppercase">
          Etapa 3
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-white font-['Montserrat',sans-serif] mt-0.5">
          Só falta confirmar
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Confira seu agendamento e informe seus dados.
        </p>
      </div>

      {/* Central Confirmation & Form Block */}
      <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <h3 className="font-extrabold text-sm sm:text-base uppercase tracking-wider text-amber-400 font-['Montserrat',sans-serif]">
            SEU AGENDAMENTO
          </h3>
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 bg-zinc-800 px-2.5 py-1 rounded-full border border-zinc-700">
            Revisão Final
          </span>
        </div>

        {/* Section 1: SERVIÇOS */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>✂️</span> SERVIÇOS SELECIONADOS ({selectedServices.length})
            </span>
            {onEditStep && (
              <button
                type="button"
                onClick={() => onEditStep(1)}
                className="px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-amber-400 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors border border-zinc-700/60"
              >
                <Edit2 className="w-3 h-3" />
                <span>Alterar</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            {selectedServices.length === 0 ? (
              <p className="text-xs text-zinc-500 italic p-3 rounded-xl bg-zinc-950/80 border border-zinc-800">
                Nenhum serviço selecionado.
              </p>
            ) : (
              selectedServices.map((srv) => (
                <div
                  key={srv.id}
                  className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-bold text-white text-sm sm:text-base">
                      {srv.name}
                    </p>
                    {srv.selectedOption && (
                      <p className="text-xs text-amber-400 font-medium mt-0.5">
                        Estilo: {srv.selectedOption}
                      </p>
                    )}
                    <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400 inline" />
                      <span>{srv.durationMinutes} minutos</span>
                    </p>
                  </div>
                  <span className="text-lg font-black text-amber-400 font-['Montserrat',sans-serif] shrink-0">
                    R$ {srv.price.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="border-t border-zinc-800/80" />

        {/* Section 2: DATA E HORÁRIO */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>📅</span> DATA E HORÁRIO
            </span>
            {onEditStep && (
              <button
                type="button"
                onClick={() => onEditStep(2)}
                className="px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-amber-400 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors border border-zinc-700/60"
              >
                <Edit2 className="w-3 h-3" />
                <span>Alterar</span>
              </button>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between gap-3">
            <div>
              <p className="font-bold text-white text-sm sm:text-base capitalize">
                {bookingState?.selectedDate?.fullFormattedDate || 'Data não selecionada'}
              </p>
              <p className="text-xs text-amber-400 font-mono font-bold mt-0.5">
                {bookingState?.selectedTime ? `${bookingState.selectedTime}h` : 'Horário não selecionado'}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-800/80" />

        {/* Section 3: SEUS DADOS */}
        <div className="space-y-4">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>👤</span> SEUS DADOS
          </span>

          {/* Name Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Seu nome *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={clientInfo.name}
                onChange={handleNameChange}
                placeholder="Como podemos te chamar?"
                className="w-full pl-10 pr-10 py-3.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-white placeholder-zinc-600 text-sm font-medium transition-all outline-none"
              />
              {isNameValid && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
            </div>
            {clientInfo.name.length > 0 && !isNameValid && (
              <p className="text-[11px] text-amber-400 font-medium">
                Por favor, informe seu nome completo (no mínimo 3 letras).
              </p>
            )}
          </div>

          {/* Phone Input with Mask */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Seu celular (WhatsApp) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                value={clientInfo.phone}
                onChange={handlePhoneChange}
                placeholder="(00) 00000-0000"
                maxLength={15}
                className="w-full pl-10 pr-10 py-3.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-white placeholder-zinc-600 text-sm font-medium transition-all outline-none font-mono"
              />
              {isPhoneValid && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
            </div>
            {clientInfo.phone.length > 0 && !isPhoneValid && (
              <p className="text-[11px] text-amber-400 font-medium">
                Informe um celular com DDD ex: (35) 99988-7766
              </p>
            )}
          </div>

          <div className="pt-1 flex items-center gap-2 text-xs text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Sem senhas ou cadastro. Agendamento direto e seguro.</span>
          </div>
        </div>

        <div className="border-t border-zinc-800/80" />

        {/* Section 4: TOTAL */}
        {selectedServices.length > 0 && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-amber-200 uppercase tracking-wider">TOTAL</span>
              <p className="text-[11px] text-zinc-400">Pagar no local no dia do atendimento</p>
            </div>
            <span className="text-2xl font-black text-amber-400 font-['Montserrat',sans-serif]">
              R$ {totalPrice.toFixed(2).replace('.', ',')}
            </span>
          </div>
        )}
      </div>

      {/* CONFIRMAR AGENDAMENTO Button */}
      {onConfirm && (
        <div className="pt-2 space-y-3">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-2">
              <span className="shrink-0 text-base">⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="button"
            disabled={!canConfirm || isSubmitting}
            onClick={onConfirm}
            className={`w-full py-4 px-6 rounded-2xl font-black text-base sm:text-lg uppercase tracking-wider shadow-xl transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer ${
              !canConfirm
                ? 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                : isSubmitting
                ? 'bg-amber-500/80 text-zinc-950 cursor-wait'
                : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 hover:shadow-amber-500/20 active:scale-[0.99]'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-zinc-950" />
                <span>CONFIRMANDO SEU HORÁRIO...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 text-zinc-950 stroke-[2.5]" />
                <span>CONFIRMAR AGENDAMENTO</span>
              </>
            )}
          </button>

          {!canConfirm && (
            <p className="text-center text-xs text-zinc-500">
              Preencha seu nome e celular WhatsApp para habilitar a confirmação.
            </p>
          )}

          {onBack && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar e escolher outra data</span>
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
