import React, { useState } from 'react';
import {
  ArrowLeft,
  Store,
  Image as ImageIcon,
  CheckCircle2,
  Save,
} from 'lucide-react';
import { BusinessProfile } from '../../../types/businessProfile';

interface IdentitySectionProps {
  profile: BusinessProfile;
  onSave: (updates: Partial<BusinessProfile>) => Promise<void>;
  onBack: () => void;
  isSaving?: boolean;
}

export const IdentitySection: React.FC<IdentitySectionProps> = ({
  profile,
  onSave,
  onBack,
  isSaving = false,
}) => {
  const [name, setName] = useState(profile.name);
  const [description, setDescription] = useState(profile.description);
  const [logoUrl, setLogoUrl] = useState(profile.logoUrl);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setSaveErrorMessage(null);
    try {
      await onSave({
        name,
        description,
        logoUrl,
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
          <span className="text-amber-500 font-black tracking-wider text-xs uppercase px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
            IDENTIDADE
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-['Montserrat',sans-serif]">
          Identidade Visual & Apresentação
        </h2>
        <p className="text-sm text-zinc-400">
          Personalize como sua barbearia aparece para seus clientes.
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
        {/* Foto / Logo Preview */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
            Foto / Logo da Barbearia
          </label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-zinc-950 border-2 border-zinc-800 overflow-hidden flex items-center justify-center shrink-0 relative group">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo preview"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={() => setLogoUrl('')}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-zinc-600">
                  <ImageIcon className="w-8 h-8" />
                </div>
              )}
            </div>

            <div className="space-y-1.5 flex-1 w-full">
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="URL da imagem (ex: https://...)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm text-white placeholder-zinc-600 outline-none transition-all"
              />
              <p className="text-[11px] text-zinc-500">
                URL da foto de perfil ou logotipo para exibição no cabeçalho.
              </p>
            </div>
          </div>
        </div>

        {/* Nome da Barbearia */}
        <div className="space-y-2">
          <label htmlFor="barbershop-name" className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
            Nome da Barbearia
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
              <Store className="w-4 h-4" />
            </div>
            <input
              id="barbershop-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Barbearia"
              className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm text-white placeholder-zinc-600 outline-none font-medium transition-all"
            />
          </div>
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <label htmlFor="barbershop-description" className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
            Descrição / Slogan
          </label>
          <textarea
            id="barbershop-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Estilo, precisão e cuidado."
            className="w-full px-3.5 py-3 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm text-white placeholder-zinc-600 outline-none transition-all resize-none"
          />
          <p className="text-[11px] text-zinc-500">
            Uma breve apresentação exibida aos clientes no rodapé e cabeçalho.
          </p>
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md shadow-amber-500/20 active:scale-[0.99] cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Salvando...' : 'SALVAR ALTERAÇÕES'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
