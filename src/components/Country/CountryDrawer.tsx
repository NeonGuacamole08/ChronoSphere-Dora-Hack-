import React from 'react';
import { CountryData, Capsule } from '../../types';
import {
  X,
  Users,
  Building,
  Coins,
  Globe2,
  Clock,
  MapPin,
  Compass,
  Lock,
  Unlock,
} from 'lucide-react';

interface CountryDrawerProps {
  country: CountryData | null;
  capsules: Capsule[];
  isOpen: boolean;
  onClose: () => void;
  onSelectCapsule: (capsule: Capsule) => void;
  onPlantInCountry: (country: CountryData) => void;
}

export const CountryDrawer: React.FC<CountryDrawerProps> = ({
  country,
  capsules,
  isOpen,
  onClose,
  onSelectCapsule,
  onPlantInCountry,
}) => {
  if (!isOpen || !country) return null;

  const countryCapsules = capsules.filter(
    (c) =>
      c.country_code?.toUpperCase() === country.cca2?.toUpperCase() ||
      c.country_name?.toLowerCase() === country.name?.common?.toLowerCase()
  );

  // Dynamic formatting per REST Countries API specs:
  // Currency: Object.values(response[0].currencies)[0].name + " (" + Object.values(response[0].currencies)[0].symbol + ")"
  const currenciesArray = country.currencies ? Object.values(country.currencies) : [];
  const primaryCurrency = currenciesArray.length > 0
    ? `${currenciesArray[0].name}${currenciesArray[0].symbol ? ` (${currenciesArray[0].symbol})` : ''}`
    : 'Local Currency';

  // Languages: Object.values(response[0].languages).join(', ')
  const languagesStr = country.languages
    ? Object.values(country.languages).join(', ')
    : 'Official Language';

  // Population: response[0].population.toLocaleString()
  const populationStr = typeof country.population === 'number'
    ? country.population.toLocaleString()
    : 'N/A';

  // Capital: response[0].capital[0]
  const capitalStr = country.capital?.[0] || 'N/A';

  // Timezone: response[0].timezones[0]
  const timezoneStr = country.timezones?.[0] || 'UTC';

  return (
    <div className="fixed top-20 right-5 bottom-6 w-96 max-w-[calc(100vw-2.5rem)] z-40 flex flex-col rounded-2xl parchment-card border-2 border-amber-800/30 overflow-hidden shadow-2xl animate-in slide-in-from-right-8 duration-300">
      {/* Wood Trim Header */}
      <div className="tree-bark-banner px-5 py-4 text-amber-50 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          {country.flags?.png && (
            <img
              src={country.flags.png}
              alt={country.flags.alt || country.name.common}
              className="w-8 h-5 object-cover rounded shadow-xs ring-1 ring-amber-300/40"
            />
          )}
          <div>
            <h3 className="font-serif font-bold text-lg leading-none carved-wood-text">
              {country.name.common}
            </h3>
            <span className="text-[11px] carved-wood-subtext font-sans tracking-wide">
              {country.region} {country.subregion ? `• ${country.subregion}` : ''}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-amber-950/60 text-amber-200 hover:text-white transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Country Live Statistics Grid dynamically bound from REST Countries API */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-2.5 rounded-xl parchment-subtle border border-amber-300/60 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-amber-800 flex items-center gap-1">
              <Building className="w-3 h-3 text-amber-700" />
              Capital
            </span>
            <p className="text-xs font-semibold text-stone-900 mt-0.5 truncate">
              {capitalStr}
            </p>
          </div>

          <div className="p-2.5 rounded-xl parchment-subtle border border-amber-300/60 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-amber-800 flex items-center gap-1">
              <Users className="w-3 h-3 text-amber-700" />
              Population
            </span>
            <p className="text-xs font-semibold text-stone-900 mt-0.5 truncate">
              {populationStr}
            </p>
          </div>

          <div className="p-2.5 rounded-xl parchment-subtle border border-amber-300/60 col-span-2 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-amber-800 flex items-center gap-1">
              <Coins className="w-3 h-3 text-amber-700" />
              Currency
            </span>
            <p className="text-xs font-semibold text-stone-800 mt-0.5 truncate">
              {primaryCurrency}
            </p>
          </div>

          <div className="p-2.5 rounded-xl parchment-subtle border border-amber-300/60 col-span-2 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-amber-800 flex items-center gap-1">
              <Globe2 className="w-3 h-3 text-amber-700" />
              Languages & Timezone
            </span>
            <p className="text-xs font-semibold text-stone-800 mt-0.5">
              {languagesStr} • <span className="font-mono text-[11px] text-amber-900">{timezoneStr}</span>
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => onPlantInCountry(country)}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-amber-100 font-semibold text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <MapPin className="w-3.5 h-3.5 text-amber-300" />
          Plant New Capsule in {country.name.common}
        </button>

        {/* Local Active Time Capsules */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between border-b border-amber-200 pb-1.5">
            <h4 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-amber-700" />
              Time Capsules in Region ({countryCapsules.length})
            </h4>
          </div>

          {countryCapsules.length === 0 ? (
            <div className="p-4 rounded-xl parchment-subtle text-center text-xs text-stone-600 italic border border-dashed border-amber-300">
              No time capsules planted here yet. Be the first to bury an encrypted memory token!
            </div>
          ) : (
            <div className="space-y-2">
              {countryCapsules.map((cap) => {
                const isUnlocked = new Date(cap.unlock_timestamp).getTime() <= Date.now();
                return (
                  <div
                    key={cap.id}
                    onClick={() => onSelectCapsule(cap)}
                    className="p-3 rounded-xl bg-white/80 hover:bg-amber-100/70 border border-amber-200 transition shadow-xs cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-serif font-semibold text-xs text-stone-900 group-hover:text-amber-950 line-clamp-1">
                        {cap.title}
                      </div>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 flex items-center gap-1 ${
                          isUnlocked
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {isUnlocked ? <Unlock className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                        {isUnlocked ? 'Unlocked' : 'Locked'}
                      </span>
                    </div>

                    <div className="mt-1.5 text-[10px] text-stone-500 flex items-center justify-between">
                      <span>By {cap.creator_username}</span>
                      <span className="font-mono text-amber-900">
                        {new Date(cap.unlock_timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
