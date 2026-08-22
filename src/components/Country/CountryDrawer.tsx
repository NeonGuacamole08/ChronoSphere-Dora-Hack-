import React, { useState } from 'react';
import { CountryData, Capsule } from '../../types';
import {
  X,
  Users,
  Building,
  Coins,
  Globe2,
  MapPin,
  Compass,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
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
  const [isCollapsed, setIsCollapsed] = useState(false);

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
    <aside
      aria-label="Country Information and Capsules"
      className={`fixed z-40 flex flex-col rounded-2xl parchment-card border-2 border-amber-800/30 overflow-hidden shadow-2xl backdrop-blur-md transition-all duration-300 ${
        // Mobile / Small screen bottom-sheet styles:
        'inset-x-2 bottom-2 top-auto md:inset-x-auto ' +
        // Tablet (md: 768px-1023px) slide-over drawer styles: slim width (320px) so it doesn't squash the 3D globe:
        'md:top-20 md:right-3 md:bottom-auto md:w-80 md:max-w-[320px] ' +
        // Desktop (lg: 1024px+) wider drawer styles:
        'lg:right-5 lg:w-96 lg:max-w-[380px] ' +
        // Height & collapse states:
        (isCollapsed
          ? 'max-h-[56px] md:max-h-[58px]'
          : 'max-h-[70dvh] md:max-h-[calc(100vh-140px)] lg:max-h-[calc(100vh-120px)]')
      } animate-in slide-in-from-bottom-6 md:slide-in-from-right-6`}
    >
      {/* Wood Trim Header */}
      <div className="tree-bark-banner px-3 py-2.5 sm:px-3.5 sm:py-3 md:px-4 md:py-3 text-amber-50 flex items-center justify-between shadow-md select-none shrink-0">
        <div
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="flex items-center gap-2 sm:gap-2.5 md:gap-3 cursor-pointer min-w-0 flex-1 group"
          title={isCollapsed ? 'Expand Country Details' : 'Collapse Drawer'}
        >
          {country.flags?.png && (
            <img
              src={country.flags.png}
              alt={country.flags.alt || country.name.common}
              className="w-6 h-3.5 sm:w-7 sm:h-4 md:w-8 md:h-5 object-cover rounded shadow-xs ring-1 ring-amber-300/40 shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="font-serif font-bold text-sm sm:text-base md:text-base leading-none carved-wood-text truncate">
                {country.name.common}
              </h3>
              {isCollapsed && (
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-900/80 text-amber-200 border border-amber-400/50 font-bold shrink-0">
                  {countryCapsules.length} {countryCapsules.length === 1 ? 'capsule' : 'capsules'}
                </span>
              )}
            </div>
            {!isCollapsed && (
              <span className="text-[9px] sm:text-[10px] md:text-[11px] carved-wood-subtext font-sans tracking-wide truncate block">
                {country.region} {country.subregion ? `• ${country.subregion}` : ''}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          {/* Collapse/Expand Toggle Button */}
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="p-1 sm:p-1.5 rounded-full hover:bg-amber-950/60 text-amber-200 hover:text-white transition cursor-pointer"
            title={isCollapsed ? 'Expand Details' : 'Collapse into Peek Bar'}
          >
            {isCollapsed ? (
              <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            )}
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1 sm:p-1.5 rounded-full hover:bg-amber-950/60 text-amber-200 hover:text-white transition cursor-pointer"
            title="Close Drawer"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* Main Scrollable Content */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-3 sm:p-3.5 md:p-4 space-y-3 sm:space-y-3.5 md:space-y-4">
          {/* Country Live Statistics Grid dynamically bound from REST Countries API */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-xl parchment-subtle border border-amber-300/60 shadow-xs">
              <span className="text-[9px] uppercase font-bold text-amber-800 flex items-center gap-1">
                <Building className="w-2.5 h-2.5 text-amber-700" />
                Capital
              </span>
              <p className="text-[11px] font-semibold text-stone-900 mt-0.5 truncate">
                {capitalStr}
              </p>
            </div>

            <div className="p-2 rounded-xl parchment-subtle border border-amber-300/60 shadow-xs">
              <span className="text-[9px] uppercase font-bold text-amber-800 flex items-center gap-1">
                <Users className="w-2.5 h-2.5 text-amber-700" />
                Population
              </span>
              <p className="text-[11px] font-semibold text-stone-900 mt-0.5 truncate">
                {populationStr}
              </p>
            </div>

            <div className="p-2 rounded-xl parchment-subtle border border-amber-300/60 col-span-2 shadow-xs">
              <span className="text-[9px] uppercase font-bold text-amber-800 flex items-center gap-1">
                <Coins className="w-2.5 h-2.5 text-amber-700" />
                Currency
              </span>
              <p className="text-[11px] font-semibold text-stone-800 mt-0.5 truncate">
                {primaryCurrency}
              </p>
            </div>

            <div className="p-2 rounded-xl parchment-subtle border border-amber-300/60 col-span-2 shadow-xs">
              <span className="text-[9px] uppercase font-bold text-amber-800 flex items-center gap-1">
                <Globe2 className="w-2.5 h-2.5 text-amber-700" />
                Languages & Timezone
              </span>
              <p className="text-[11px] font-semibold text-stone-800 mt-0.5">
                {languagesStr} • <span className="font-mono text-[10px] text-amber-900">{timezoneStr}</span>
              </p>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={() => onPlantInCountry(country)}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-amber-100 font-semibold text-xs transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-300" />
            Plant Capsule in {country.name.common}
          </button>

          {/* Local Active Time Capsules */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-amber-200 pb-1">
              <h4 className="font-serif font-bold text-xs sm:text-sm text-stone-900 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-amber-700" />
                Time Capsules ({countryCapsules.length})
              </h4>
            </div>

            {countryCapsules.length === 0 ? (
              <div className="p-3 rounded-xl parchment-subtle text-center text-[11px] text-stone-600 italic border border-dashed border-amber-300">
                No time capsules planted here yet. Be the first to bury an encrypted memory!
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                {countryCapsules.map((cap) => {
                  const isUnlocked = new Date(cap.unlock_timestamp).getTime() <= Date.now();
                  return (
                    <div
                      key={cap.id}
                      onClick={() => onSelectCapsule(cap)}
                      className="p-2.5 rounded-xl bg-white/80 hover:bg-amber-100/70 border border-amber-200 transition shadow-xs cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="font-serif font-semibold text-[11px] sm:text-xs text-stone-900 group-hover:text-amber-950 line-clamp-1">
                          {cap.title}
                        </div>
                        <span
                          className={`text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 flex items-center gap-1 ${
                            isUnlocked
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {isUnlocked ? <Unlock className="w-2 h-2" /> : <Lock className="w-2 h-2" />}
                          {isUnlocked ? 'Unlocked' : 'Locked'}
                        </span>
                      </div>

                      <div className="mt-1 text-[9px] text-stone-500 flex items-center justify-between">
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
      )}
    </aside>
  );
};
