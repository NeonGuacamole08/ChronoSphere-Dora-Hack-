import React, { useState, useEffect, useRef } from 'react';
import {
  Globe,
  Search,
  Plus,
  Layers,
  Volume2,
  VolumeX,
  HelpCircle,
  MapPin,
  ChevronDown,
  Server,
  Flame,
  ShieldCheck,
  User,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { searchMapboxPlaces, GeocodingResult } from '../../utils/mapbox';
import { AppUser } from '../../utils/supabase';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectLocation: (result: GeocodingResult) => void;
  onOpenCreate: () => void;
  onToggleLayers: () => void;
  showHeatmap: boolean;
  isAudioMuted: boolean;
  onToggleAudio: () => void;
  onOpenHelp: () => void;
  onOpenBackendHub?: () => void;
  currentUser: AppUser | null;
  onOpenAuthModal: (mode?: 'signin' | 'signup') => void;
  onSignOut: () => void;
  capsulesCount: number;
  totalCapsulesCount: number;
  onDropPinClick: () => void;
  isPlantingMode: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onSelectLocation,
  onOpenCreate,
  onToggleLayers,
  showHeatmap,
  isAudioMuted,
  onToggleAudio,
  onOpenHelp,
  onOpenBackendHub,
  currentUser,
  onOpenAuthModal,
  onSignOut,
  capsulesCount,
  totalCapsulesCount,
  onDropPinClick,
  isPlantingMode,
}) => {
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Debounced Mapbox Geocoding Search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await searchMapboxPlaces(searchQuery);
        setSuggestions(results);
        setShowDropdown(results.length > 0);
      } catch (e) {
        console.error('Search error:', e);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(e.target as Node)
      ) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (place: GeocodingResult) => {
    onSelectLocation(place);
    setShowDropdown(false);
    onSearchChange(place.name);
  };

  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  return (
    <header className="absolute top-2 left-2 right-2 sm:top-3 sm:left-3 sm:right-3 md:top-4 md:left-4 md:right-4 z-40 flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-2.5 lg:gap-3 pointer-events-auto select-none">
      <div className="flex items-center justify-between w-full md:w-auto gap-2 shrink-0">
        {/* 1. LEFT: ChronoSpheres Brand */}
        <div className="flex items-center gap-2 md:gap-2.5 shrink-0">
          {/* Glowing Globe Circle Emblem */}
          <div className="w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-full bg-[#0c1b2f]/90 border-2 border-cyan-400 flex items-center justify-center text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.4)] shrink-0">
            <Globe className="w-4 h-4 md:w-4.5 md:h-4.5 lg:w-5 lg:h-5 stroke-[1.9] text-cyan-300" />
          </div>

          {/* Brand Text */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-sans font-bold text-sm sm:text-base md:text-lg lg:text-xl text-white tracking-tight leading-none drop-shadow">
                ChronoSpheres
              </span>
            </div>
            <span className="text-[9px] md:text-[10px] lg:text-[11px] text-cyan-200/70 font-sans tracking-tight mt-0.5 font-medium hidden sm:inline">
              3D Earth Time Capsules
            </span>
          </div>
        </div>

        {/* Mobile Search Toggle & Mobile Plant Button on small screens (<md) */}
        <div className="flex items-center gap-1.5 md:hidden">
          <button
            type="button"
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className="w-8 h-8 rounded-xl bg-[#0c1626]/90 border border-cyan-500/40 text-cyan-300 flex items-center justify-center text-xs"
            title="Search Places"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onOpenCreate}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#208b9e] text-white text-[11px] font-bold border border-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-100" />
            <span>Plant</span>
          </button>
        </div>
      </div>

      {/* 2. CENTER: Search Bar with Embedded 'Drop Pin' Action */}
      <div
        ref={searchContainerRef}
        className={`relative flex-1 min-w-0 max-w-full md:max-w-[240px] lg:max-w-sm xl:max-w-md mx-0 md:mx-1 lg:mx-2 ${
          isMobileSearchOpen ? 'block w-full' : 'hidden md:block'
        }`}
      >
        <div className="relative flex items-center bg-[#0c1626]/90 backdrop-blur-md rounded-full border border-cyan-500/40 shadow-[0_0_20px_rgba(4,20,38,0.7)] px-2.5 md:px-3 py-1 md:py-1.5">
          <Search className="w-3.5 h-3.5 md:w-4 md:h-4 text-cyan-400/90 shrink-0 ml-0.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setShowDropdown(true);
            }}
            placeholder="Search city, address..."
            className="w-full min-w-0 text-[11px] md:text-xs px-2 py-0.5 md:py-1 bg-transparent text-cyan-50 placeholder:text-cyan-200/50 focus:outline-none font-sans truncate"
          />

          {/* Embedded Drop Pin Action Button inside Search Bar */}
          <button
            type="button"
            onClick={onDropPinClick}
            className={`flex items-center gap-1 px-2 py-0.5 md:py-1 rounded-full text-[10px] md:text-[11px] font-medium shrink-0 transition cursor-pointer border ${
              isPlantingMode
                ? 'bg-cyan-500 text-stone-950 border-cyan-300 ring-2 ring-cyan-400/50 font-bold'
                : 'bg-[#14233b] hover:bg-[#1a2f4d] text-cyan-200 border-cyan-500/40'
            }`}
            title="Drop a pin at searched location or on globe"
          >
            <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="hidden sm:inline">Drop Pin</span>
          </button>
        </div>

        {/* Mapbox Autocomplete Suggestions Dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 md:mt-2 rounded-2xl bg-[#0b1320]/95 backdrop-blur-lg border border-cyan-500/40 shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-1.5 space-y-0.5 max-h-52 md:max-h-60 overflow-y-auto">
              <span className="text-[9px] md:text-[10px] uppercase font-bold text-cyan-400 px-2.5 py-1 block">
                Mapbox Precision Coordinates
              </span>
              {suggestions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    handleSuggestionClick(item);
                    setIsMobileSearchOpen(false);
                  }}
                  className="w-full text-left px-2.5 md:px-3 py-1.5 md:py-2 rounded-xl text-[11px] md:text-xs hover:bg-cyan-950/80 text-cyan-100 transition cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2 truncate">
                    <MapPin className="w-3 h-3 md:w-3.5 md:h-3.5 text-cyan-400 group-hover:scale-110 transition-transform shrink-0" />
                    <span className="truncate font-medium">{item.placeName}</span>
                  </div>
                  <span className="text-[9px] md:text-[10px] font-mono text-cyan-300/60 shrink-0 ml-2">
                    {item.lat.toFixed(2)}°, {item.lng.toFixed(2)}°
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. RIGHT: Action Buttons Cluster */}
      <div className="flex items-center justify-end gap-1 md:gap-1.5 lg:gap-2 shrink-0 flex-nowrap">
        {/* + Plant Capsule Glowing Button (Tablet & Desktop) */}
        <button
          type="button"
          onClick={onOpenCreate}
          className="hidden md:flex items-center gap-1 md:gap-1.5 px-2.5 md:px-3 lg:px-4 py-1.5 md:py-2 rounded-full bg-[#208b9e] hover:bg-[#1fa1bc] text-white text-[11px] md:text-xs font-bold transition shadow-[0_0_20px_rgba(6,182,212,0.5)] border border-cyan-300 hover:shadow-cyan-400/60 cursor-pointer shrink-0"
          title="Plant a new encrypted time capsule"
        >
          <Plus className="w-3.5 h-3.5 md:w-4 md:h-4 text-cyan-100 stroke-[2.5]" />
          <span className="hidden lg:inline">Plant Capsule</span>
          <span className="inline lg:hidden">Plant</span>
        </button>

        {/* 3. TOTAL PIN COUNT STACK BADGE & HEATMAP TOGGLE */}
        <button
          type="button"
          onClick={onToggleLayers}
          className={`flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 lg:px-3 py-1.5 md:py-2 rounded-xl border text-[11px] md:text-xs font-medium transition shadow-md cursor-pointer shrink-0 ${
            showHeatmap
              ? 'bg-amber-500/30 text-amber-200 border-amber-400 ring-2 ring-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.4)] font-bold'
              : 'bg-[#0c1626]/90 text-stone-200 border-cyan-500/40 hover:bg-[#13233a]'
          }`}
          title="Total Active Pins Stack & 3D Glowing Memory Heatmap Overlay"
        >
          <Layers className={`w-3.5 h-3.5 md:w-4 md:h-4 ${showHeatmap ? 'text-amber-400' : 'text-cyan-300'}`} />
          <span className="hidden xl:inline font-semibold">
            {showHeatmap ? 'Heatmap' : 'Pins'}
          </span>
          {/* Dynamic Pin Count Stack Badge */}
          <span
            id="total-pin-count-badge"
            className="text-[9px] md:text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-900/90 text-cyan-200 border border-cyan-400/60 font-mono font-bold shadow-inner"
            title={`${capsulesCount} visible capsules on globe`}
          >
            {capsulesCount}
          </span>
        </button>

        {/* Backend Hub */}
        {onOpenBackendHub && (
          <button
            type="button"
            onClick={onOpenBackendHub}
            className="w-7 h-7 sm:w-8 sm:h-8 md:w-8.5 md:h-8.5 lg:w-9 lg:h-9 rounded-xl bg-[#0c1626]/90 hover:bg-[#13233a] text-cyan-300 border border-cyan-500/40 transition shadow-md flex items-center justify-center font-bold text-xs cursor-pointer shrink-0"
            title="Backend Hub: Supabase Edge Functions, Resend & Arweave"
          >
            <Server className="w-3.5 h-3.5 md:w-4 md:h-4 text-cyan-300" />
          </button>
        )}

        {/* Audio / Sound Toggle Button */}
        <button
          type="button"
          onClick={onToggleAudio}
          className={`w-7 h-7 sm:w-8 sm:h-8 md:w-8.5 md:h-8.5 lg:w-9 lg:h-9 rounded-xl border flex items-center justify-center transition shadow-md cursor-pointer shrink-0 ${
            !isAudioMuted
              ? 'bg-cyan-950/90 text-cyan-300 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
              : 'bg-[#0c1626]/90 text-white border-cyan-500/40 hover:bg-[#13233a]'
          }`}
          title={isAudioMuted ? 'Unmute Ambient Sound' : 'Mute Ambient Sound'}
        >
          {!isAudioMuted ? (
            <Volume2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-cyan-300" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 md:w-4 md:h-4 text-stone-300" />
          )}
        </button>

        {/* Help Button ('?') */}
        <button
          type="button"
          onClick={onOpenHelp}
          className="w-7 h-7 sm:w-8 sm:h-8 md:w-8.5 md:h-8.5 lg:w-9 lg:h-9 rounded-xl bg-[#0c1626]/90 hover:bg-[#13233a] text-white border border-cyan-500/40 transition shadow-md flex items-center justify-center font-bold text-xs cursor-pointer shrink-0"
          title="Interactive Guide & Website Tutorial"
        >
          <HelpCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </button>

        {/* 2. REAL SUPABASE AUTHENTICATION BADGE & USER DROPDOWN */}
        <div className="relative shrink-0" ref={userDropdownRef}>
          {currentUser ? (
            <button
              type="button"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 lg:px-3 py-1 md:py-1.5 rounded-xl bg-[#0c1626]/90 hover:bg-[#13233a] text-white border border-emerald-500/50 text-[10px] md:text-xs font-semibold transition cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.25)]"
              title={`Logged in as ${currentUser.username} (${currentUser.email})`}
            >
              <img
                src={currentUser.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=explorer'}
                alt={currentUser.username}
                className="w-4 h-4 md:w-5 md:h-5 rounded-full border border-emerald-400 object-cover bg-stone-900 shrink-0"
              />
              <span className="max-w-[60px] md:max-w-[85px] lg:max-w-[110px] truncate font-medium text-emerald-100 hidden sm:inline">
                {currentUser.username}
              </span>
              <ShieldCheck className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-400 shrink-0" />
              <ChevronDown className="w-2.5 h-2.5 md:w-3 md:h-3 text-cyan-400/80 shrink-0" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenAuthModal('signin')}
              className="flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 lg:px-3 py-1 md:py-1.5 rounded-xl bg-gradient-to-r from-emerald-900/90 to-teal-900/90 hover:from-emerald-800 hover:to-teal-800 text-emerald-100 border border-emerald-400/60 text-[10px] md:text-xs font-bold transition cursor-pointer shadow-md"
            >
              <User className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-300" />
              <span className="hidden sm:inline">Auth</span>
            </button>
          )}

          {/* User Profile / Supabase Menu Dropdown */}
          {showUserDropdown && currentUser && (
            <div className="absolute right-0 top-full mt-2 w-64 p-3 rounded-2xl bg-[#0b1320]/95 backdrop-blur-md border border-emerald-500/50 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-cyan-500/30">
                <img
                  src={currentUser.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=explorer'}
                  alt={currentUser.username}
                  className="w-9 h-9 rounded-full border border-emerald-400 object-cover bg-stone-900"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-white truncate">
                    {currentUser.username}
                  </div>
                  <div className="text-[11px] text-emerald-300/80 truncate">
                    {currentUser.email}
                  </div>
                </div>
              </div>

              <div className="space-y-1 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserDropdown(false);
                    onOpenAuthModal('profile' as any);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs hover:bg-cyan-950/70 text-cyan-100 transition cursor-pointer flex items-center justify-between"
                >
                  <span>Account & Decryption Key</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowUserDropdown(false);
                    onSignOut();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs hover:bg-rose-950/70 text-rose-300 transition cursor-pointer flex items-center justify-between border-t border-cyan-500/20 mt-1 pt-1.5"
                >
                  <span>Sign Out</span>
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
