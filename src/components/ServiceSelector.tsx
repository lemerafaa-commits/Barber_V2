import React from 'react';
import { Scissors, Check, Sparkles, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { Service, ServiceCategory, ServiceOption } from '../types/booking';

interface ServiceSelectorProps {
  categories?: ServiceCategory[];
  services?: Service[];
  selectedService?: Service | null;
  selectedServices?: Service[];
  isLoading?: boolean;
  onSelectService?: (service: Service) => void;
  onToggleService?: (category: ServiceCategory, option: ServiceOption) => void;
  onContinue: () => void;
}

export const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  categories = [],
  selectedService,
  selectedServices = selectedService ? [selectedService] : [],
  isLoading = false,
  onSelectService,
  onToggleService,
  onContinue,
}) => {
  const getCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-amber-400" />;
      case 'Razor':
        return (
          <span className="text-lg leading-none select-none" role="img" aria-label="barba">
            🧔
          </span>
        );
      default:
        return <Scissors className="w-5 h-5 text-amber-400" />;
    }
  };

  const handleOptionClick = (category: ServiceCategory, option: ServiceOption) => {
    if (onToggleService) {
      onToggleService(category, option);
    } else if (onSelectService) {
      const serviceToSelect: Service = {
        id: `${category.id}-${option.id}`,
        categoryId: category.id,
        name: category.name,
        selectedOption: option.name,
        price: option.priceOverride ?? category.price,
        durationMinutes: option.durationOverride ?? category.durationMinutes,
        description: category.description,
        iconName: category.iconName,
        popular: category.popular,
      };
      onSelectService(serviceToSelect);
    }
  };

  const hasSelectedServices = selectedServices.length > 0;

  return (
    <section className="w-full space-y-4">
      {/* Section Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs font-bold tracking-wider text-amber-500 uppercase">
            Etapa 1
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-['Montserrat',sans-serif] mt-0.5">
            O que você quer fazer?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Escolha um serviço para começar seu agendamento.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Preço fixo no local</span>
        </div>
      </div>

      {/* Categories Stack */}
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-400">
          <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
          <span className="text-xs font-medium">Carregando serviços disponíveis...</span>
        </div>
      ) : categories.length === 0 ? (
        <div className="p-8 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center space-y-2">
          <Scissors className="w-8 h-8 text-zinc-600 mx-auto" />
          <h3 className="font-bold text-white text-sm">Nenhum serviço disponível no momento</h3>
          <p className="text-xs text-zinc-400">Por favor, volte novamente em instantes.</p>
        </div>
      ) : (
        <div className="space-y-4 pt-1">
          {categories.map((category) => {
            const selectedForCategory = selectedServices.find(
              (s) => s.categoryId === category.id
            );
            const isCategoryActive = Boolean(selectedForCategory);

            return (
              <div
                key={category.id}
                className={`relative p-4 sm:p-5 rounded-2xl transition-all duration-200 border ${
                  isCategoryActive
                    ? 'bg-zinc-900/95 border-amber-500/80 ring-1 ring-amber-500/30 shadow-xl shadow-amber-500/5'
                    : 'bg-zinc-900/70 hover:bg-zinc-900/90 border-zinc-800/90'
                }`}
              >
                {/* Popular Badge */}
                {category.popular && (
                  <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-[10px] font-black uppercase tracking-wider text-zinc-950 shadow-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3 fill-zinc-950" />
                    <span>Mais Pedido</span>
                  </div>
                )}

                {/* Category Header */}
                <div className="flex items-start justify-between gap-3 mb-3.5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 sm:p-3 rounded-xl transition-colors ${
                        isCategoryActive ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-800/80 text-zinc-400'
                      }`}
                    >
                      {getCategoryIcon(category.iconName)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base sm:text-lg text-white uppercase tracking-wider font-['Montserrat',sans-serif]">
                        {category.name}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">{category.description}</p>
                    </div>
                  </div>

                  {isCategoryActive && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30 shrink-0">
                      <Check className="w-3.5 h-3.5" />
                      Selecionado
                    </span>
                  )}
                </div>

                {/* Options Section */}
                <div className="my-2">
                  <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2.5">
                    Escolha o estilo:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {category.options.map((option) => {
                      const isOptionSelected =
                        selectedForCategory?.selectedOption === option.name;
                      const optPrice = option.priceOverride ?? category.price;
                      const optDuration = option.durationOverride ?? category.durationMinutes;

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleOptionClick(category, option)}
                          className={`p-3 sm:p-3.5 rounded-xl text-left transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer focus:outline-none ${
                            isOptionSelected
                              ? 'bg-amber-500 text-zinc-950 font-extrabold border-2 border-amber-400 shadow-md shadow-amber-500/20 ring-2 ring-amber-500/30'
                              : 'bg-zinc-950/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div
                              className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                isOptionSelected
                                  ? 'bg-zinc-950 text-amber-400'
                                  : 'border border-zinc-700 bg-zinc-900/60'
                              }`}
                            >
                              {isOptionSelected && (
                                <Check className="w-3 h-3 stroke-[3]" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span
                                className={`block text-xs sm:text-sm font-bold truncate ${
                                  isOptionSelected ? 'text-zinc-950 font-black' : 'text-zinc-200'
                                }`}
                              >
                                {option.name}
                              </span>
                              <span
                                className={`block text-[11px] mt-0.5 font-medium ${
                                  isOptionSelected ? 'text-zinc-900 font-semibold' : 'text-zinc-400'
                                }`}
                              >
                                {optDuration} min · R$ {optPrice.toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CONTINUAR Button */}
      <div className="pt-4">
        <button
          type="button"
          disabled={!hasSelectedServices}
          onClick={onContinue}
          className={`w-full py-4 px-6 rounded-2xl font-black text-base sm:text-lg uppercase tracking-wider shadow-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
            !hasSelectedServices
              ? 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
              : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/20 active:scale-[0.99]'
          }`}
        >
          <span>CONTINUAR</span>
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>
        {!hasSelectedServices && (
          <p className="text-center text-xs text-zinc-500 mt-2">
            Escolha pelo menos um serviço para habilitar o botão.
          </p>
        )}
      </div>
    </section>
  );
};
