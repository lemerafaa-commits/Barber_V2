import React, { useState } from 'react';
import {
  ArrowLeft,
  Phone,
  Instagram,
  CheckCircle2,
  Save,
} from 'lucide-react';
import { BusinessProfile } from '../../../types/businessProfile';

interface ContactSectionProps {
  profile: BusinessProfile;
  onSave: (updates: Partial<BusinessProfile>) => Promise<void>;
  onBack: () => void;
  isSaving?: boolean;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  profile,
  onSave,
  onBack,
  isSaving = false,
}) => {
  const [whatsapp, setWhatsapp] = useState(profile.whatsapp);
  const [instagram, setInstagram] = useState(profile.instagram);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setSaveErrorMessage(null);
    try {
      await onSave({
        whatsapp,
        instagram,
      });
      setSaveSuccessMessage('Alterações salvas com sucesso!');
      setTimeout(() => {
        setSaveSuccessMessage(null);
      }, 4000);
    } catch (err: any) {
      setSaveErrorMessage('Erro ao salvar alterações. Tente novamente.');
      setTimeout(() => {
        setSaveErrorMessage(null);
      }, 5000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer py-1"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar para Minha Barbearia</span>
      </button>

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-emerald-500 font-black tracking-wider text-xs uppercase px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
            CONTATO
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-['Montserrat',sans-serif]">
          Canais de Contato
        </h2>
        <p className="text-sm text-zinc-400">
          Configure os canais de contato da sua barbearia.
        </p>
      </div>

      {/* Success Notification */}
      {saveSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* Error Notification */}
      {saveErrorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <span>{saveErrorMessage}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="p-5 sm:p-7 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 space-y-6">
        {/* WhatsApp */}
        <div className="space-y-2">
          <label htmlFor="barbershop-whatsapp" className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
            WhatsApp para Agendamentos e Dúvidas
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-500">
              <Phone className="w-4 h-4" />
            </div>
            <input
              id="barbershop-whatsapp"
              type="text"
              required
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="(15) 99999-9999"
              className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-white placeholder-zinc-600 outline-none font-medium transition-all"
            />
          </div>
          <p className="text-[11px] text-zinc-500">
            Número onde os clientes enviarão confirmações e dúvidas pelo WhatsApp.
          </p>
        </div>

        {/* Instagram */}
        <div className="space-y-2">
          <label htmlFor="barbershop-instagram" className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
            Perfil do Instagram
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-pink-500">
              <Instagram className="w-4 h-4" />
            </div>
            <input
              id="barbershop-instagram"
              type="text"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="@barbearia"
              className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-sm text-white placeholder-zinc-600 outline-none font-medium transition-all"
            />
          </div>
          <p className="text-[11px] text-zinc-500">
            @ da sua barbearia para o botão direto de redes sociais.
          </p>
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md shadow-emerald-500/20 active:scale-[0.99] cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Salvando...' : 'SALVAR ALTERAÇÕES'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
