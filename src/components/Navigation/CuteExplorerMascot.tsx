import React from 'react';

interface CuteExplorerMascotProps {
  className?: string;
  size?: number;
  animate?: boolean;
}

export const CuteExplorerMascot: React.FC<CuteExplorerMascotProps> = ({
  className = '',
  size = 32,
  animate = true,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${animate ? 'hover:scale-110 transition-transform' : ''}`}
    >
      <defs>
        {/* Glow & Gradients */}
        <radialGradient id="cuteHelmetGrad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#cffafe" />
          <stop offset="100%" stopColor="#67e8f9" />
        </radialGradient>
        <radialGradient id="cuteVisorGrad" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="80%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </radialGradient>
        <linearGradient id="cuteEarGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        <filter id="cuteGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#06b6d4" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* Backpack / Propulsion Jets */}
      <rect x="10" y="24" width="28" height="12" rx="6" fill="#0284c7" />
      <circle cx="16" cy="36" r="3" fill="#38bdf8" />
      <circle cx="32" cy="36" r="3" fill="#38bdf8" />

      {/* Cute Explorer Ears / Side Antennas */}
      <path d="M7 17C7 13 11 11 13 14L15 22H9C7.8 22 7 20 7 17Z" fill="url(#cuteEarGrad)" />
      <path d="M41 17C41 13 37 11 35 14L33 22H39C40.2 22 41 20 41 17Z" fill="url(#cuteEarGrad)" />
      {/* Inner cute pink ear details */}
      <path d="M9 17C9 15 11 13 12 15L13.5 20H10C9.5 20 9 19 9 17Z" fill="#fda4af" />
      <path d="M39 17C39 15 37 13 36 15L34.5 20H38C38.5 20 39 19 39 17Z" fill="#fda4af" />

      {/* Main Cute Helmet Sphere */}
      <circle cx="24" cy="23" r="17" fill="url(#cuteHelmetGrad)" stroke="#0891b2" strokeWidth="1.5" filter="url(#cuteGlow)" />

      {/* Starry Top Antenna */}
      <path d="M24 6V1" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" />
      <polygon points="24,0 25.5,3.5 29,4 26,6.5 27,10 24,8 21,10 22,6.5 19,4 22.5,3.5" fill="#facc15" stroke="#ca8a04" strokeWidth="0.5" />

      {/* Cute Dark Visor */}
      <rect x="12" y="14" width="24" height="17" rx="8.5" fill="url(#cuteVisorGrad)" stroke="#38bdf8" strokeWidth="1.2" />

      {/* Sparkly Star Glint in Visor Glass */}
      <ellipse cx="17" cy="18" rx="2.5" ry="1.5" transform="rotate(-25 17 18)" fill="#ffffff" opacity="0.8" />
      <circle cx="31" cy="18" r="1.2" fill="#ffffff" opacity="0.6" />

      {/* Happy Expressive Anime Eyes (^ ‿ ^) */}
      <path d="M16 22C17 19.5 20 19.5 21 22" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M27 22C28 19.5 31 19.5 32 22" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" />

      {/* Cute Little Smile */}
      <path d="M22 25.5C23 27 25 27 26 25.5" stroke="#67e8f9" strokeWidth="1.5" strokeLinecap="round" />

      {/* Sweet Blush Cheeks */}
      <ellipse cx="14.5" cy="24" rx="2" ry="1.2" fill="#fb7185" opacity="0.9" />
      <ellipse cx="33.5" cy="24" rx="2" ry="1.2" fill="#fb7185" opacity="0.9" />

      {/* Neck Collar Ring */}
      <rect x="18" y="38" width="12" height="4" rx="2" fill="#0891b2" />
    </svg>
  );
};

export function getCuteUserLocationSvgString(heading: number = 0): string {
  return `
    <div class="relative flex flex-col items-center select-none cursor-pointer group" style="transform: translate(-50%, -50%);">
      <!-- Pulsing Radar Halo Rings -->
      <div class="absolute w-20 h-20 rounded-full bg-cyan-400/20 border border-cyan-400/50 animate-ping pointer-events-none -translate-y-1"></div>
      <div class="absolute w-12 h-12 rounded-full bg-cyan-500/25 border border-cyan-300 pointer-events-none -translate-y-1"></div>

      <!-- Heading Direction Arrow -->
      <div class="absolute -top-3.5 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[12px] border-b-cyan-400 filter drop-shadow(0 0 5px #22d3ee) transition-transform duration-300" style="transform: rotate(${heading}deg); transform-origin: center 22px;"></div>

      <!-- Cute "You" Floating Star Pill Badge -->
      <div class="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-[#0c1626]/95 border border-cyan-400 text-cyan-200 text-[10px] font-bold shadow-lg mb-1 flex items-center gap-1 backdrop-blur-md group-hover:scale-110 transition-transform">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span class="font-mono tracking-wide text-white">You</span>
        <span class="text-amber-300 text-[9px]">✨</span>
      </div>

      <!-- Cute Chibi Astro-Explorer Mascot SVG -->
      <div class="relative w-11 h-11 rounded-2xl bg-gradient-to-b from-[#0c1e36] to-[#061220] border-2 border-cyan-300 shadow-[0_6px_20px_rgba(6,182,212,0.6)] flex items-center justify-center group-hover:scale-115 group-active:scale-95 transition-all duration-200">
        <svg width="34" height="34" viewBox="0 0 48 48" fill="none" class="animate-pulse" style="animation-duration: 3s;">
          <rect x="10" y="24" width="28" height="12" rx="6" fill="#0284c7" />
          <path d="M7 17C7 13 11 11 13 14L15 22H9C7.8 22 7 20 7 17Z" fill="#38bdf8" />
          <path d="M41 17C41 13 37 11 35 14L33 22H39C40.2 22 41 20 41 17Z" fill="#38bdf8" />
          <path d="M9 17C9 15 11 13 12 15L13.5 20H10C9.5 20 9 19 9 17Z" fill="#fda4af" />
          <path d="M39 17C39 15 37 13 36 15L34.5 20H38C38.5 20 39 19 39 17Z" fill="#fda4af" />
          <circle cx="24" cy="23" r="17" fill="#e0f2fe" stroke="#0891b2" stroke-width="1.5" />
          <path d="M24 6V1" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" />
          <polygon points="24,0 25.5,3.5 29,4 26,6.5 27,10 24,8 21,10 22,6.5 19,4 22.5,3.5" fill="#facc15" stroke="#ca8a04" stroke-width="0.5" />
          <rect x="12" y="14" width="24" height="17" rx="8.5" fill="#0f172a" stroke="#38bdf8" stroke-width="1.2" />
          <ellipse cx="17" cy="18" rx="2.5" ry="1.5" transform="rotate(-25 17 18)" fill="#ffffff" opacity="0.8" />
          <circle cx="31" cy="18" r="1.2" fill="#ffffff" opacity="0.6" />
          <path d="M16 22C17 19.5 20 19.5 21 22" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round" />
          <path d="M27 22C28 19.5 31 19.5 32 22" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round" />
          <path d="M22 25.5C23 27 25 27 26 25.5" stroke="#67e8f9" stroke-width="1.5" stroke-linecap="round" />
          <ellipse cx="14.5" cy="24" rx="2" ry="1.2" fill="#fb7185" opacity="0.9" />
          <ellipse cx="33.5" cy="24" rx="2" ry="1.2" fill="#fb7185" opacity="0.9" />
        </svg>
      </div>

      <!-- Small Ground Shadow -->
      <div class="w-6 h-1.5 bg-black/40 rounded-full blur-[1px] mt-0.5"></div>
    </div>
  `;
}
