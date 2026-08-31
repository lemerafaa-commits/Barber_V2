import React from 'react';
import { MapPin, Instagram, MessageCircle, Star, Scissors } from 'lucide-react';
import { Barbershop } from '../types/booking';

interface BarberHeaderProps {
  barbershop: Barbershop;
}

export const BarberHeader: React.FC<BarberHeaderProps> = ({ barbershop }) => {
  return (
    <header className="relative w-full overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl mb-6">
      {/* Cover Backdrop Image with Gradient Overlay */}
      <div className="relative h-32 sm:h-40 w-full overflow-hidden">
        <img
          src={barbershop.coverUrl}
          alt={barbershop.name}
          className="h-full w-full object-cover object-center opacity-40 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent" />
        
        {/* Rating Badge in top right */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/80 backdrop-blur-md border border-amber-500/30 text-xs font-semibold text-amber-400 shadow-lg">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{barbershop.rating}</span>
          <span className="text-zinc-400 font-normal">({barbershop.reviewCount})</span>
        </div>
      </div>

      {/* Main Barbershop Header Content */}
      <div className="relative px-4 sm:px-6 pb-6 -mt-12 sm:-mt-14 flex flex-col items-center text-center">
        {/* Logo Avatar */}
        <div className="relative mb-3">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl p-1 bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 shadow-2xl ring-4 ring-zinc-900">
            <div className="w-full h-full rounded-xl overflow-hidden bg-zinc-950 flex items-center justify-center">
              <img
                src={barbershop.logoUrl}
                alt={barbershop.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback icon if image fails
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <Scissors className="w-10 h-10 text-amber-400 absolute hidden" />
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 p-1.5 bg-amber-500 text-zinc-950 rounded-lg shadow-md">
            <Scissors className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        </div>

        {/* Title & Tagline */}
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-['Montserrat',sans-serif] uppercase">
          {barbershop.name}
        </h1>
        
        <p className="mt-1.5 text-sm sm:text-base text-zinc-300 font-medium max-w-md italic">
          "{barbershop.tagline}"
        </p>

        {/* Location Pill */}
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-xs sm:text-sm text-zinc-300">
          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-medium text-zinc-200">
            📍 {barbershop.city} - {barbershop.state}
          </span>
          <span className="text-zinc-500 hidden sm:inline">•</span>
          <span className="text-zinc-400 text-xs hidden sm:inline">{barbershop.address}</span>
        </div>

        {/* Social Links / Action Buttons */}
        <div className="mt-4 flex items-center justify-center gap-2.5 sm:gap-3 w-full max-w-xs">
          <a
            href={barbershop.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-800/90 hover:bg-zinc-700/90 text-zinc-200 text-xs sm:text-sm font-semibold transition-all border border-zinc-700/50 hover:border-amber-500/30 group"
          >
            <Instagram className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform" />
            <span>Instagram</span>
          </a>

          <a
            href={barbershop.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 text-xs sm:text-sm font-semibold transition-all border border-emerald-800/40 hover:border-emerald-600/50 group"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    </header>
  );
};
