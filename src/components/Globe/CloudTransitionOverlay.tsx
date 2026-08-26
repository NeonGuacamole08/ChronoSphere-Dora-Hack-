import React, { useEffect, useState } from 'react';
import { ambientSound } from '../../utils/audio';

interface CloudTransitionOverlayProps {
  isActive: boolean;
  onTransitionComplete?: () => void;
  destinationLabel?: string;
}

export const CloudTransitionOverlay: React.FC<CloudTransitionOverlayProps> = ({
  isActive,
  onTransitionComplete,
  destinationLabel,
}) => {
  const [phase, setPhase] = useState<'idle' | 'diving' | 'clearing'>('idle');

  useEffect(() => {
    if (!isActive) {
      setPhase('idle');
      return;
    }

    // 1. Play Cloud Dive Whoosh Sound
    ambientSound.playCloudDiveWhooshSound(1.6);
    setPhase('diving');

    // 2. Schedule fog dispersal & landing impact chime
    const clearTimer = setTimeout(() => {
      setPhase('clearing');
      ambientSound.playLandingImpactChimeSound();
    }, 900);

    // 3. Complete transition
    const endTimer = setTimeout(() => {
      setPhase('idle');
      if (onTransitionComplete) {
        onTransitionComplete();
      }
    }, 1600);

    return () => {
      clearTimeout(clearTimer);
      clearTimeout(endTimer);
    };
  }, [isActive, onTransitionComplete]);

  if (!isActive && phase === 'idle') return null;

  return (
    <div
      className={`fixed inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden transition-opacity duration-500 ${
        phase === 'diving'
          ? 'opacity-100'
          : phase === 'clearing'
          ? 'opacity-0'
          : 'opacity-0'
      }`}
    >
      {/* Background Volumetric Cloud Whiteout Base */}
      <div
        className={`absolute inset-0 bg-white transition-all duration-700 ease-out ${
          phase === 'diving' ? 'opacity-90 scale-105' : 'opacity-0 scale-150'
        }`}
      />

      {/* Layer 1: Outer Atmospheric Vapor Rings (Scaling rapidly outward) */}
      <div
        className={`absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.95)_0%,rgba(240,249,255,0.85)_45%,rgba(224,242,254,0.4)_75%,transparent_100%)] transition-transform duration-1000 ease-in-out ${
          phase === 'diving' ? 'scale-100' : 'scale-250 blur-xl'
        }`}
      />

      {/* Layer 2: Rapidly Expanding Wispy Cloud Banks */}
      <div
        className={`absolute w-[180vw] h-[180vh] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,1)_0%,rgba(248,250,252,0.8)_35%,rgba(224,231,255,0.4)_65%,transparent_80%)] blur-2xl transition-all duration-800 ease-in ${
          phase === 'diving' ? 'scale-110 opacity-95 rotate-6' : 'scale-300 opacity-0 -rotate-12'
        }`}
      />

      {/* Layer 3: Dynamic Atmospheric Condensation Swirls (SVG Wisps) */}
      <svg
        className={`absolute w-full h-full opacity-60 transition-transform duration-1000 ease-out ${
          phase === 'diving' ? 'scale-100' : 'scale-180 opacity-0'
        }`}
        viewBox="0 0 1000 1000"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="cloud-distortion" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="4" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="60" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <circle cx="500" cy="500" r="380" fill="white" filter="url(#cloud-distortion)" opacity="0.8" />
        <circle cx="480" cy="520" r="280" fill="#f0f9ff" filter="url(#cloud-distortion)" opacity="0.9" />
        <circle cx="520" cy="460" r="190" fill="#e0f2fe" filter="url(#cloud-distortion)" opacity="0.95" />
      </svg>

      {/* Layer 4: Speed Lines / Atmospheric Entry Wind Lines */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
          phase === 'diving' ? 'opacity-80' : 'opacity-0'
        }`}
      >
        <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(255,255,255,0.6)_60%,rgba(255,255,255,0.95)_100%)] animate-pulse" />
      </div>

      {/* Target Destination Entry Callout Pill */}
      {destinationLabel && (
        <div
          className={`relative z-10 px-5 py-2.5 rounded-full bg-[#140e06]/90 border-2 border-amber-400 text-amber-100 font-serif font-bold text-sm shadow-2xl backdrop-blur-xl flex items-center gap-2.5 transition-all duration-500 ${
            phase === 'diving' ? 'scale-100 opacity-100 translate-y-0' : 'scale-125 opacity-0 -translate-y-6'
          }`}
        >
          <span className="text-base animate-bounce">⚡</span>
          <span>Entering Atmospheric Grid • {destinationLabel}</span>
        </div>
      )}
    </div>
  );
};
