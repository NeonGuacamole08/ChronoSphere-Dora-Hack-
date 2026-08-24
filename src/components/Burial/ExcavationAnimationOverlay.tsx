import React, { useEffect, useRef, useState } from 'react';
import { Unlock, Sparkles, MapPin, FastForward, CheckCircle2 } from 'lucide-react';
import { ambientSound } from '../../utils/audio';

interface ExcavationAnimationOverlayProps {
  locationName: string;
  countryName: string;
  capsuleTitle: string;
  onAnimationComplete: () => void;
}

interface DirtParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  color: string;
  alpha: number;
  shape: 'clod' | 'pebble' | 'splat' | 'spark';
}

export const ExcavationAnimationOverlay: React.FC<ExcavationAnimationOverlayProps> = ({
  locationName,
  countryName,
  capsuleTitle,
  onAnimationComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [animStage, setAnimStage] = useState<'clearing' | 'ascending' | 'unlocking' | 'revealed'>('clearing');
  const [isLockUnlocked, setIsLockUnlocked] = useState(false);

  useEffect(() => {
    // 1. Play excavation sound effect sequence
    ambientSound.playExcavationUnsealSound();

    // Stage 1: Shovel clearing topsoil (0 - 0.7s)
    // Stage 2: Capsule ascending with golden aura (0.7s - 1.3s)
    const ascendTimer = setTimeout(() => {
      setAnimStage('ascending');
    }, 700);

    // Stage 3: Lock snaps open & unseals (1.3s - 2.0s)
    const unlockTimer = setTimeout(() => {
      setAnimStage('unlocking');
      setIsLockUnlocked(true);
    }, 1300);

    // Stage 4: Revealed & transition (2.0s - 2.5s)
    const revealTimer = setTimeout(() => {
      setAnimStage('revealed');
    }, 2100);

    // Stage 5: Complete animation & display capsule modal
    const completeTimer = setTimeout(() => {
      onAnimationComplete();
    }, 2600);

    return () => {
      clearTimeout(ascendTimer);
      clearTimeout(unlockTimer);
      clearTimeout(revealTimer);
      clearTimeout(completeTimer);
    };
  }, [onAnimationComplete]);

  // Full-screen 2D canvas animation for shovel excavating, dirt flying outward, and glowing ground burst
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const SOIL_COLORS = [
      '#2a160b',
      '#3d2110',
      '#5c3418',
      '#7a4923',
      '#996232',
      '#d97706',
      '#f59e0b',
      '#34d399',
      '#10b981',
    ];

    // Generate burst of dirt particles clearing away from center
    const particles: DirtParticle[] = [];
    const particleCount = 120;
    const centerX = width / 2;
    const groundY = height * 0.72;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.random() * Math.PI) + Math.PI; // Upward spray
      const speed = 4 + Math.random() * 14;
      const isSpark = Math.random() > 0.65;

      particles.push({
        x: centerX + (Math.random() - 0.5) * 140,
        y: groundY - Math.random() * 20,
        z: 40 + Math.random() * 300,
        vx: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
        vy: Math.sin(angle) * speed - 3,
        vz: 10 + Math.random() * 25,
        size: isSpark ? 2 + Math.random() * 3 : 5 + Math.random() * 12,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.25,
        color: isSpark ? '#fde047' : SOIL_COLORS[Math.floor(Math.random() * SOIL_COLORS.length)],
        alpha: 0.85 + Math.random() * 0.15,
        shape: isSpark ? 'spark' : Math.random() > 0.4 ? 'clod' : 'pebble',
      });
    }

    const startTime = performance.now();

    // Helper: Draw metallic shovel clearing dirt
    const drawShovel = (x: number, y: number, angle: number, scale: number = 1.0) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.scale(scale, scale);

      // Wooden Handle
      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.roundRect(-4, -130, 8, 110, 4);
      ctx.fill();
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Top grip
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.roundRect(-14, -145, 28, 16, 4);
      ctx.fill();
      ctx.stroke();

      // Steel Blade
      const bladeGrad = ctx.createLinearGradient(-26, -20, 26, 40);
      bladeGrad.addColorStop(0, '#e2e8f0');
      bladeGrad.addColorStop(0.5, '#94a3b8');
      bladeGrad.addColorStop(1, '#475569');

      ctx.fillStyle = bladeGrad;
      ctx.beginPath();
      ctx.moveTo(-24, -20);
      ctx.lineTo(24, -20);
      ctx.lineTo(26, 22);
      ctx.bezierCurveTo(20, 44, 0, 52, 0, 52);
      ctx.bezierCurveTo(0, 52, -20, 44, -26, 22);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Soil scoop on blade
      ctx.fillStyle = '#5c3418';
      ctx.beginPath();
      ctx.ellipse(0, 10, 16, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const render = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      ctx.clearRect(0, 0, width, height);

      // Fade-out ground layer towards the end of sequence
      let groundAlpha = 1.0;
      if (elapsed > 2.0) {
        groundAlpha = Math.max(0, 1.0 - (elapsed - 2.0) / 0.5);
      }

      ctx.save();
      ctx.globalAlpha = groundAlpha;

      // 1. Earth Cross-Section opening back up
      const pitWidth = Math.min(320, width * 0.48);
      const holeFactor = Math.min(1.0, elapsed / 0.7);

      // Underground bedrock
      ctx.fillStyle = '#1c0f07';
      ctx.fillRect(0, groundY, width, height - groundY);

      // Soil strata
      ctx.fillStyle = '#3d2110';
      ctx.fillRect(0, groundY, width, 40);
      ctx.fillStyle = '#5c3418';
      ctx.fillRect(0, groundY + 40, width, 50);

      // Surface grass border
      ctx.fillStyle = '#2d5a27';
      ctx.fillRect(0, groundY - 6, width, 8);

      // Excavated opening in the ground with golden ascension glow
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(centerX, groundY + 10, (pitWidth / 2) * holeFactor, 32 * holeFactor, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#0a0502';
      ctx.fill();
      ctx.lineWidth = 3 * holeFactor;
      ctx.strokeStyle = '#f59e0b';
      ctx.stroke();

      // Radiant glow beam emanating upward from the excavated hole
      if (elapsed > 0.5) {
        const glowT = Math.min(1.0, (elapsed - 0.5) / 0.6);
        const beamGrad = ctx.createRadialGradient(
          centerX,
          groundY + 10,
          10,
          centerX,
          groundY - 120,
          pitWidth * 0.8
        );
        beamGrad.addColorStop(0, `rgba(251, 191, 36, ${0.45 * glowT})`);
        beamGrad.addColorStop(0.5, `rgba(16, 185, 129, ${0.25 * glowT})`);
        beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(centerX - pitWidth * 0.45, groundY);
        ctx.lineTo(centerX + pitWidth * 0.45, groundY);
        ctx.lineTo(centerX + pitWidth * 0.7, groundY - 260);
        ctx.lineTo(centerX - pitWidth * 0.7, groundY - 260);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // 2. Shovel Excavation Clearing Movement
      if (elapsed < 0.9) {
        const scoopT = elapsed / 0.85;
        const shovelX = centerX + Math.sin(scoopT * Math.PI * 2) * 50 - 20;
        const shovelY = groundY - 20 - Math.sin(scoopT * Math.PI) * 45;
        const shovelAngle = -0.4 + Math.sin(scoopT * Math.PI * 2) * 0.5;

        drawShovel(shovelX, shovelY, shovelAngle, 1.05);
      }

      ctx.restore(); // Restore groundAlpha

      // 3. Dirt & Gold Sparkle Particles Clearing Outward
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.32; // Gravity
        p.z += p.vz;
        p.rotation += p.rotSpeed;

        const screenScale = Math.max(0.2, 1 + p.z / 350);
        const renderSize = p.size * screenScale;
        const pAlpha = Math.max(0, p.alpha * (1 - elapsed / 2.3));

        if (pAlpha <= 0 || p.y > height + 80) return;

        ctx.save();
        ctx.globalAlpha = pAlpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (p.shape === 'spark') {
          ctx.fillStyle = p.color;
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(0, 0, renderSize, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.roundRect(-renderSize / 2, -renderSize / 2, renderSize, renderSize * 0.8, 3);
          ctx.fill();
        }

        ctx.restore();
      });

      // 4. Flash Burst when Unlocking
      if (elapsed > 1.3 && elapsed < 1.9) {
        const flashT = (elapsed - 1.3) / 0.6;
        const flashAlpha = Math.sin(flashT * Math.PI) * 0.45;
        ctx.save();
        const flashGrad = ctx.createRadialGradient(
          centerX,
          height * 0.48,
          20,
          centerX,
          height * 0.48,
          width * 0.5
        );
        flashGrad.addColorStop(0, `rgba(52, 211, 153, ${flashAlpha})`);
        flashGrad.addColorStop(0.5, `rgba(251, 191, 36, ${flashAlpha * 0.6})`);
        flashGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = flashGrad;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }

      if (elapsed < 2.8) {
        animId = requestAnimationFrame(render);
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden transition-opacity duration-500 ${
        animStage === 'revealed' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background vignette & atmospheric glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-stone-950/80 via-amber-950/40 to-black/90 backdrop-blur-xs pointer-events-none" />

      {/* 1. 2D Fullscreen Physics & Shovel Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* 2. Top Info Header */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 text-center px-4 w-full max-w-md">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 shadow-lg text-emerald-300 text-xs font-mono font-bold uppercase tracking-wider backdrop-blur-md animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Excavating Unlocked Capsule</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-serif font-bold text-amber-100 drop-shadow-md truncate max-w-full">
          {capsuleTitle || 'Ancient Memory'}
        </h2>

        <div className="flex items-center gap-1 text-xs text-amber-300/80 font-mono">
          <MapPin className="w-3 h-3 text-amber-400" />
          <span>
            {locationName}, {countryName}
          </span>
        </div>
      </div>

      {/* 3. Skip Button in Top Right */}
      <div className="absolute top-6 right-6 z-30">
        <button
          type="button"
          onClick={onAnimationComplete}
          className="px-3.5 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-amber-200 border border-amber-500/40 hover:border-amber-400 font-mono text-xs font-bold transition shadow-lg backdrop-blur-md flex items-center gap-1.5 cursor-pointer"
        >
          <span>Skip</span>
          <FastForward className="w-3.5 h-3.5 text-amber-300" />
        </button>
      </div>

      {/* 4. Center 3D Ascending Capsule & Snapping Lock Visual */}
      <div
        style={{ willChange: 'transform, opacity' }}
        className={`relative z-20 flex flex-col items-center justify-center transition-all duration-700 ${
          animStage === 'clearing'
            ? 'translate-y-36 sm:translate-y-48 scale-75 opacity-40'
            : animStage === 'ascending'
            ? 'translate-y-0 scale-100 opacity-100'
            : 'translate-y-0 scale-105 opacity-100'
        }`}
      >
        {/* Radiant Aureole Glow Rings */}
        <div className="absolute -inset-10 bg-gradient-to-r from-emerald-500/30 via-amber-400/30 to-teal-500/30 rounded-full blur-2xl animate-pulse pointer-events-none" />

        {/* Outer Cylinder Body */}
        <div
          style={{ willChange: 'transform, opacity' }}
          className="relative w-36 h-48 sm:w-44 sm:h-60 rounded-3xl bg-gradient-to-b from-stone-800 via-amber-950 to-stone-900 border-2 border-amber-400/70 shadow-2xl p-3.5 sm:p-4 flex flex-col items-center justify-between overflow-hidden"
        >
          {/* Metallic Ribbing Lines */}
          <div className="absolute inset-x-0 top-6 h-0.5 bg-amber-500/40" />
          <div className="absolute inset-x-0 bottom-6 h-0.5 bg-amber-500/40" />
          <div className="absolute -left-12 -right-12 top-1/2 -translate-y-1/2 h-20 bg-gradient-to-r from-amber-400/10 via-emerald-400/20 to-amber-400/10 rotate-12 pointer-events-none" />

          {/* Top Status LED */}
          <div className="w-full flex items-center justify-between px-1">
            <span className="text-[8px] sm:text-[9px] font-mono text-amber-400 font-bold uppercase tracking-wider">
              ARWEAVE VAULT
            </span>
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                isLockUnlocked
                  ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                  : 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
              }`}
            />
          </div>

          {/* Central Glowing Lock Emblem (Transitions from locked to unlocked) */}
          <div className="relative my-auto flex flex-col items-center">
            <div
              style={{ willChange: 'transform' }}
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 shadow-xl ${
                isLockUnlocked
                  ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300 scale-110 shadow-[0_0_24px_rgba(52,211,153,0.6)]'
                  : 'bg-amber-950/90 border-amber-400 text-amber-300 scale-100'
              }`}
            >
              {isLockUnlocked ? (
                <Unlock className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-300 animate-bounce" />
              ) : (
                <Unlock className="w-8 h-8 sm:w-10 sm:h-10 text-amber-300 rotate-12" />
              )}
            </div>

            {/* Status Label */}
            <span
              className={`mt-1.5 sm:mt-2 font-mono text-[10px] sm:text-xs font-bold tracking-widest uppercase transition-colors ${
                isLockUnlocked ? 'text-emerald-300' : 'text-amber-300'
              }`}
            >
              {isLockUnlocked ? 'SEAL BROKEN' : 'UNEARTHING...'}
            </span>
          </div>

          {/* Bottom coordinates badge */}
          <div className="text-[8px] sm:text-[9px] font-mono text-stone-400 text-center truncate max-w-full">
            MEMORIES SECURED
          </div>
        </div>

        {/* Bottom Sequence Progress Hint */}
        <div className="mt-3 sm:mt-4 flex items-center gap-2 text-xs font-mono text-amber-200/90 bg-black/50 px-3 py-1 rounded-full border border-amber-500/30">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Opening Vault Contents...</span>
        </div>
      </div>
    </div>
  );
};
