import React, { useState } from 'react';
import {
  ArrowLeft,
  MapPin,
  Building2,
  CheckCircle2,
  Save,
} from 'lucide-react';
import { BusinessProfile } from '../../../types/businessProfile';

interface LocationSectionProps {
  profile: BusinessProfile;
  onSave: (updates: Partial<BusinessProfile>) => Promise<void>;
  onBack: () => void;
  isSaving?: boolean;
}

export const LocationSection: React.FC<LocationSectionProps> = ({
  profile,
  onSave,
  onBack,
  isSaving = false,
}) => {
  const [street, setStreet] = useState(profile.address.street);
  const [number, setNumber] = useState(profile.address.number);
  const [neighborhood, setNeighborhood] = useState(profile.address.neighborhood);
  const [city, setCity] = useState(profile.address.city);
  const [state, setState] = useState(profile.address.state);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setSaveErrorMessage(null);
    try {
      await onSave({
        address: {
          street,
          number,
          neighborhood,
          city,
          state,
        },
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
          <span className="text-sky-500 font-black tracking-wider text-xs uppercase px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">
            LOCALIZAÇÃO
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-['Montserrat',sans-serif]">
          Endereço Físico
        </h2>
        <p className="text-sm text-zinc-400">
          Informe onde seus clientes podem encontrar sua barbearia.
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
      <form onSubmit={handleSubmit} className="p-5 sm:p-7 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 space-y-5">
        {/* Rua / Logradouro & Número */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-2">
            <label htmlFor="address-street" className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
              Rua / Logradouro
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <MapPin className="w-4 h-4" />
              </div>
              <input
                id="address-street"
                type="text"
                required
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Rua Exemplo"
                className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm text-white placeholder-zinc-600 outline-none font-medium transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="address-number" className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
              Número
            </label>
            <input
              id="address-number"
              type="text"
              required
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="123"
              className="w-full px-3.5 py-3 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm text-white placeholder-zinc-600 outline-none font-medium transition-all"
            />
          </div>
        </div>

        {/* Bairro, Cidade & Estado */}
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
          <div className="sm:col-span-3 space-y-2">
            <label htmlFor="address-neighborhood" className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
              Bairro
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Building2 className="w-4 h-4" />
              </div>
              <input
                id="address-neighborhood"
                type="text"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Centro"
                className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm text-white placeholder-zinc-600 outline-none font-medium transition-all"
              />
            </div>
          </div>

          <div className="sm:col-span-2 space-y-2">
            <label htmlFor="address-city" className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
              Cidade
            </label>
            <input
              id="address-city"
              type="text"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Poços de Caldas"
              className="w-full px-3.5 py-3 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm text-white placeholder-zinc-600 outline-none font-medium transition-all"
            />
          </div>

          <div className="sm:col-span-1 space-y-2">
            <label htmlFor="address-state" className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
              UF
            </label>
            <input
              id="address-state"
              type="text"
              maxLength={2}
              required
              value={state}
              onChange={(e) => setState(e.target.value.toUpperCase())}
              placeholder="MG"
              className="w-full px-3.5 py-3 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm text-white placeholder-zinc-600 outline-none font-medium transition-all text-center uppercase"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-3 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md shadow-sky-500/20 active:scale-[0.99] cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Salvando...' : 'SALVAR ALTERAÇÕES'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
