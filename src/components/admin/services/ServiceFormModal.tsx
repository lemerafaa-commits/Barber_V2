import React, { useState, useEffect } from 'react';
import { X, Scissors, Clock, DollarSign, Sparkles, Check, AlertCircle } from 'lucide-react';
import { AdminService, ServiceCategoryId } from '../../../types/admin';
import {
  DEFAULT_SERVICE_CATEGORIES,
  validateServiceInput,
} from '../../../services/adminServiceDomain';

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (serviceData: {
    name: string;
    categoryId: ServiceCategoryId;
    description: string;
    price: number;
    durationMinutes: number;
    active: boolean;
  }) => void;
  serviceToEdit?: AdminService | null;
  isSaving?: boolean;
}

const DURATION_PRESETS = [15, 20, 25, 30, 40, 50, 60, 75, 90];

export const ServiceFormModal: React.FC<ServiceFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  serviceToEdit,
  isSaving = false,
}) => {
  const isEditing = Boolean(serviceToEdit);

  // Form local states
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<ServiceCategoryId>('cabelo');
  const [description, setDescription] = useState('');
  const [priceInput, setPriceInput] = useState('45,00');
  const [durationMinutes, setDurationMinutes] = useState<number>(40);
  const [active, setActive] = useState(true);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset or populate fields when modal opens or serviceToEdit changes
  useEffect(() => {
    if (isOpen) {
      if (serviceToEdit) {
        setName(serviceToEdit.name);
        setCategoryId(serviceToEdit.categoryId);
        setDescription(serviceToEdit.description || '');
        setPriceInput(serviceToEdit.price.toFixed(2).replace('.', ','));
        setDurationMinutes(serviceToEdit.durationMinutes);
        setActive(serviceToEdit.active);
      } else {
        // Defaults for adding new service
        setName('');
        setCategoryId('cabelo');
        setDescription('');
        setPriceInput('45,00');
        setDurationMinutes(40);
        setActive(true);
      }
      setErrors({});
    }
  }, [isOpen, serviceToEdit]);

  if (!isOpen) return null;

  // Convert Brazilian formatted price string ("45,00" or "45.00") to numeric float
  const parsePrice = (val: string): number => {
    const cleaned = val.replace(/[^\d.,]/g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const numericPrice = parsePrice(priceInput);
    const numericDuration = Number(durationMinutes);

    const validation = validateServiceInput({
      name,
      categoryId,
      price: numericPrice,
      durationMinutes: numericDuration,
    });

    if (!validation.isValid) {
      setErrors(validation.errors as Record<string, string>);
      return;
    }

    onSave({
      name: name.trim(),
      categoryId,
      description: description.trim(),
      price: numericPrice,
      durationMinutes: numericDuration,
      active,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Scissors className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider font-['Montserrat',sans-serif]">
                {isEditing ? 'Editar Serviço' : 'Adicionar Serviço'}
              </h3>
              <p className="text-xs text-zinc-400">
                {isEditing
                  ? 'Atualize os detalhes, preço e tempo do serviço.'
                  : 'Preencha as informações do novo serviço oferecido.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Nome do Serviço */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
              Nome do Serviço <span className="text-amber-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
              }}
              placeholder="Ex: Corte Degradê Navalhado"
              className={`w-full px-4 py-3 rounded-xl bg-zinc-900 border text-sm text-white placeholder-zinc-500 focus:outline-none transition-all ${
                errors.name
                  ? 'border-red-500/80 focus:border-red-500 ring-1 ring-red-500/30'
                  : 'border-zinc-800 focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30'
              }`}
            />
            {errors.name && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.name}</span>
              </p>
            )}
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
              Categoria <span className="text-amber-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {DEFAULT_SERVICE_CATEGORIES.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategoryId(cat.id);
                      if (errors.categoryId)
                        setErrors((prev) => ({ ...prev, categoryId: '' }));
                    }}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 text-amber-400 ring-1 ring-amber-500/30 font-bold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850'
                    }`}
                  >
                    <span className="text-xs font-extrabold uppercase tracking-wide">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.categoryId && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.categoryId}</span>
              </p>
            )}
          </div>

          {/* Preço e Duração em duas colunas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Preço */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Preço (R$) <span className="text-amber-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 font-bold text-sm">
                  R$
                </div>
                <input
                  type="text"
                  value={priceInput}
                  onChange={(e) => {
                    setPriceInput(e.target.value);
                    if (errors.price) setErrors((prev) => ({ ...prev, price: '' }));
                  }}
                  placeholder="45,00"
                  className={`w-full pl-11 pr-4 py-3 rounded-xl bg-zinc-900 border text-sm font-bold text-white placeholder-zinc-500 focus:outline-none transition-all ${
                    errors.price
                      ? 'border-red-500/80 focus:border-red-500 ring-1 ring-red-500/30'
                      : 'border-zinc-800 focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30'
                  }`}
                />
              </div>
              {errors.price && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.price}</span>
                </p>
              )}
            </div>

            {/* Duração em Minutos */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Duração (Minutos) <span className="text-amber-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400">
                  <Clock className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  min="5"
                  max="360"
                  step="5"
                  value={durationMinutes || ''}
                  onChange={(e) => {
                    setDurationMinutes(parseInt(e.target.value, 10) || 0);
                    if (errors.durationMinutes)
                      setErrors((prev) => ({ ...prev, durationMinutes: '' }));
                  }}
                  placeholder="40"
                  className={`w-full pl-10 pr-12 py-3 rounded-xl bg-zinc-900 border text-sm font-bold text-white placeholder-zinc-500 focus:outline-none transition-all ${
                    errors.durationMinutes
                      ? 'border-red-500/80 focus:border-red-500 ring-1 ring-red-500/30'
                      : 'border-zinc-800 focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30'
                  }`}
                />
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-400 text-xs font-semibold">
                  min
                </div>
              </div>
              {errors.durationMinutes && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.durationMinutes}</span>
                </p>
              )}
            </div>
          </div>

          {/* Duração - Chips de Atalho */}
          <div>
            <span className="block text-[11px] font-semibold text-zinc-400 mb-1.5">
              Sugestões rápidas de duração:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {DURATION_PRESETS.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => {
                    setDurationMinutes(minutes);
                    if (errors.durationMinutes)
                      setErrors((prev) => ({ ...prev, durationMinutes: '' }));
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    durationMinutes === minutes
                      ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  {minutes}m
                </button>
              ))}
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
              Descrição / Detalhes <span className="text-zinc-500 text-[10px]">(Opcional)</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Corte completo com lavagem, alinhamento e finalização com pomada modeladora."
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30 transition-all resize-none"
            />
          </div>

          {/* Status Ativo / Inativo */}
          <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-white block">
                Disponibilidade do Serviço
              </span>
              <p className="text-xs text-zinc-400 mt-0.5">
                {active
                  ? 'O serviço está ativo e disponível para agendamentos.'
                  : 'O serviço está inativo (oculto para novos agendamentos).'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActive(!active)}
              className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                active ? 'bg-emerald-500' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  active ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-zinc-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="min-h-[44px] px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-500/20 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isEditing ? 'Salvar Alterações' : 'Salvar Serviço'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
