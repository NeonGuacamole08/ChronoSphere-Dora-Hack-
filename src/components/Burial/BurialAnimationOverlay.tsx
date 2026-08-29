import React, { useEffect, useRef, useState } from 'react';
import { Lock, Sparkles, MapPin, CheckCircle2 } from 'lucide-react';
import { ambientSound } from '../../utils/audio';

interface BurialAnimationOverlayProps {
  locationName: string;
  countryName: string;
  onAnimationComplete: () => void;
}

interface DirtParticle {
  x: number;
  y: number;
  z: number; // depth: 10 to 1200+ rushing towards camera screen
  vx: number;
  vy: number;
  vz: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  color: string;
  alpha: number;
  shape: 'clod' | 'pebble' | 'splat' | 'spark';
  landedOnScreen?: boolean;
}

export const BurialAnimationOverlay: React.FC<BurialAnimationOverlayProps> = ({
  locationName,
  countryName,
  onAnimationComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [animStage, setAnimStage] = useState<'digging' | 'descending' | 'flattening' | 'sealed'>('digging');
  const [isLockClosed, setIsLockClosed] = useState(false);

  useEffect(() => {
    // 1. Digging sound at start
    ambientSound.playShovelDigSound();

    // 2. Descending & lock sound
    const lockTimer = setTimeout(() => {
      setAnimStage('descending');
      setIsLockClosed(true);
      ambientSound.playBurialLockSound();
    }, 850);

    // 3. Shovel flattening phase
    const flattenTimer = setTimeout(() => {
      setAnimStage('flattening');
      ambientSound.playSoilPatSound();
    }, 1800);

    // 4. Sealed & glowing confirmation
    const sealTimer = setTimeout(() => {
      setAnimStage('sealed');
      ambientSound.playSoilPatSound();
    }, 2450);

    // 5. Complete animation and return to 3D Globe
    const completeTimer = setTimeout(() => {
      onAnimationComplete();
    }, 3100);

    return () => {
      clearTimeout(lockTimer);
      clearTimeout(flattenTimer);
      clearTimeout(sealTimer);
      clearTimeout(completeTimer);
    };
  }, [onAnimationComplete]);

  // Full-screen 2D canvas animation for shovel digging, dirt flying at camera, and soil smoothing
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
      '#2a160b', // very dark rich humus
      '#3d2110', // dark brown loam
      '#5c3418', // rich clay earth
      '#7a4923', // brown soil
      '#996232', // light sandy earth
      '#d97706', // gold soil glint
      '#f59e0b', // bright amber mica spark
    ];

    // Generate burst of dirt particles hitting screen
    const particles: DirtParticle[] = [];
    const particleCount = width < 640 ? 140 : 260;
    const centerX = width / 2;
    const groundY = height * 0.62;

    for (let i = 0; i < particleCount; i++) {
      const angle = -Math.PI * 0.15 - Math.random() * Math.PI * 0.7; // upwards and outwards
      const speed = 4 + Math.random() * 12;
      const isSpark = Math.random() < 0.2;

      particles.push({
        x: centerX + (Math.random() - 0.5) * 80,
        y: groundY - 20 - Math.random() * 40,
        z: 20 + Math.random() * 150,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 4,
        vy: Math.sin(angle) * speed,
        vz: 22 + Math.random() * 38, // Fast forward velocity straight at viewport
        size: isSpark ? 2 + Math.random() * 3 : 6 + Math.random() * 18,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.3,
        color: SOIL_COLORS[Math.floor(Math.random() * SOIL_COLORS.length)],
        alpha: 0.95 + Math.random() * 0.05,
        shape: isSpark
          ? 'spark'
          : Math.random() < 0.4
          ? 'clod'
          : Math.random() < 0.75
          ? 'pebble'
          : 'splat',
      });
    }

    const startTime = performance.now();

    // Helper: Draw custom SVG shovel spade and wooden handle on canvas
    const drawShovel = (
      posX: number,
      posY: number,
      angleRad: number,
      scale: number,
      hasDirtOnSpade: boolean
    ) => {
      ctx.save();
      ctx.translate(posX, posY);
      ctx.rotate(angleRad);
      ctx.scale(scale, scale);

      // 1. Shovel Wooden Shaft / Handle
      ctx.lineWidth = 10;
      ctx.strokeStyle = '#854d0e';
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -130);
      ctx.stroke();

      // Shaft wood grain highlight
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#b45309';
      ctx.beginPath();
      ctx.moveTo(2, -10);
      ctx.lineTo(2, -125);
      ctx.stroke();

      // Top D-Handle Grip
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(0, -145, 14, Math.PI, 0);
      ctx.stroke();
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-12, -142, 24, 6);

      // 2. Shovel Steel Spade Head
      ctx.beginPath();
      ctx.moveTo(-22, 0);
      ctx.lineTo(22, 0);
      ctx.lineTo(26, 45);
      ctx.quadraticCurveTo(0, 75, -26, 45);
      ctx.closePath();

      // Spade Metallic Steel Gradient
      const spadeGrad = ctx.createLinearGradient(-26, 0, 26, 60);
      spadeGrad.addColorStop(0, '#64748b');
      spadeGrad.addColorStop(0.4, '#94a3b8');
      spadeGrad.addColorStop(0.7, '#cbd5e1');
      spadeGrad.addColorStop(1, '#475569');
      ctx.fillStyle = spadeGrad;
      ctx.fill();

      // Steel Spade Outline
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#334155';
      ctx.stroke();

      // Center Ridge
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 60);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Fresh soil clods clinging to spade
      if (hasDirtOnSpade) {
        ctx.fillStyle = '#3d2110';
        ctx.beginPath();
        ctx.arc(-8, 30, 9, 0, Math.PI * 2);
        ctx.arc(6, 40, 11, 0, Math.PI * 2);
        ctx.arc(-2, 50, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    const render = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      ctx.clearRect(0, 0, width, height);

      // Fade-out multiplier for soil overlay as animation wraps up
      let groundAlpha = 1.0;
      if (elapsed > 2.5) {
        groundAlpha = Math.max(0, 1.0 - (elapsed - 2.5) / 0.55);
      }

      ctx.save();
      ctx.globalAlpha = groundAlpha;

      // --- 1. Draw Earth Cross-Section (Soil Layers & Pit) ---
      const pitWidth = Math.min(300, width * 0.45);

      // Calculate hole opening and closing factor (0 = closed/flush, 1 = fully open)
      let holeFactor = 0;
      if (elapsed < 0.85) {
        holeFactor = Math.min(1.0, elapsed / 0.7);
      } else if (elapsed < 1.7) {
        holeFactor = 1.0;
      } else if (elapsed <= 2.5) {
        // Flattening & Filling back up
        const fillT = Math.min(1.0, (elapsed - 1.7) / 0.75);
        holeFactor = Math.max(0, 1.0 - fillT);
      } else {
        holeFactor = 0;
      }

      // Dark underground bedrock layer
      ctx.fillStyle = '#1c0f07';
      ctx.fillRect(0, groundY, width, height - groundY);

      // Top Soil Loam Gradient
      const soilGrad = ctx.createLinearGradient(0, groundY, 0, groundY + 120);
      soilGrad.addColorStop(0, '#45220c');
      soilGrad.addColorStop(0.4, '#311707');
      soilGrad.addColorStop(1, '#1c0f07');
      ctx.fillStyle = soilGrad;
      ctx.fillRect(0, groundY, width, height - groundY);

      // Surface Grass / Moss Layer
      ctx.fillStyle = '#22542a';
      ctx.fillRect(0, groundY - 4, width, 6);
      ctx.fillStyle = '#38733e';
      for (let x = 0; x < width; x += 12) {
        ctx.fillRect(x, groundY - 8 + (x % 3), 4, 6);
      }

      // Excavated Hole in the Ground (Animates open and smoothly fills back up to 0)
      if (holeFactor > 0.01) {
        ctx.beginPath();
        const holeRadiusX = Math.max(0.001, (pitWidth / 2) * holeFactor);
        const holeRadiusY = Math.max(0.001, 28 * holeFactor);
        ctx.ellipse(centerX, groundY + 10 * holeFactor, holeRadiusX, holeRadiusY, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#0a0502';
        ctx.fill();
        ctx.lineWidth = Math.max(1, 3 * holeFactor);
        ctx.strokeStyle = '#5c3418';
        ctx.stroke();

        // Soil mound on sides from digging (shrinks and flattens out)
        if (elapsed > 0.3) {
          ctx.fillStyle = '#3d2110';
          const moundRadiusX = Math.max(0.001, 35 * holeFactor);
          const moundRadiusY = Math.max(0.001, 14 * holeFactor);
          // Left dirt mound
          ctx.beginPath();
          ctx.ellipse(
            centerX - pitWidth * 0.55 * holeFactor,
            groundY - 4 * holeFactor,
            moundRadiusX,
            moundRadiusY,
            -0.15,
            0,
            Math.PI * 2
          );
          ctx.fill();
          // Right dirt mound
          ctx.beginPath();
          ctx.ellipse(
            centerX + pitWidth * 0.55 * holeFactor,
            groundY - 4 * holeFactor,
            moundRadiusX,
            moundRadiusY,
            0.15,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }

      // If filling/filled, draw smoothed soil & fresh surface grass patch across the burial spot
      if (elapsed > 1.7) {
        const fillT = Math.min(1.0, (elapsed - 1.7) / 0.75);
        ctx.save();
        ctx.globalAlpha = groundAlpha * fillT;
        // Fresh smoothed topsoil strip
        ctx.fillStyle = '#4a2810';
        ctx.beginPath();
        ctx.ellipse(centerX, groundY, Math.max(0.001, pitWidth * 0.4), 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Fresh grass sprouts covering the smoothed spot
        ctx.fillStyle = '#38733e';
        for (let x = centerX - pitWidth * 0.38; x <= centerX + pitWidth * 0.38; x += 10) {
          ctx.fillRect(x, groundY - 7 + (Math.abs(Math.sin(x)) * 3), 3, 5);
        }
        ctx.restore();
      }

      // --- 2. Shovel Animation Based on Timeline ---
      if (elapsed < 0.85) {
        // Phase 1: Shovel Digging Down & Throwing Dirt
        const digT = Math.min(1.0, elapsed / 0.7);
        let shovelX = centerX + 40;
        let shovelY = groundY - 60;
        let shovelAngle = Math.PI * 0.2;
        let shovelScale = 1.0;

        if (digT < 0.4) {
          // Plunging down into soil
          const t = digT / 0.4;
          shovelX = centerX + 30 - t * 20;
          shovelY = groundY - 80 + t * 90;
          shovelAngle = Math.PI * 0.15 - t * 0.3;
        } else if (digT < 0.7) {
          // Scooping & lifting
          const t = (digT - 0.4) / 0.3;
          shovelX = centerX + 10 - t * 50;
          shovelY = groundY + 10 - t * 90;
          shovelAngle = -Math.PI * 0.15 - t * 0.6;
        } else {
          // Flinging dirt toward camera
          const t = (digT - 0.7) / 0.3;
          shovelX = centerX - 40 - t * 30;
          shovelY = groundY - 80 - t * 40;
          shovelAngle = -Math.PI * 0.75 - t * 0.3;
          shovelScale = 1.0 + t * 0.3; // growing larger as it flings forward
        }

        drawShovel(shovelX, shovelY, shovelAngle, shovelScale, digT < 0.75);
      } else if (elapsed >= 1.7 && elapsed <= 2.5) {
        // Phase 3: Shovel Smoothing & Flattening Soil Over Buried Spot
        const flatT = (elapsed - 1.7) / 0.8;
        const patCycle = (flatT * 4) % 1.0; // 4 rhythmic pats
        const patCount = Math.floor(flatT * 4);

        const patOffset = Math.sin(patCycle * Math.PI);
        const shovelX = centerX - 60 + patCount * 38;
        const shovelY = groundY - 10 - patOffset * 28;
        const shovelAngle = Math.PI * 0.48; // flat horizontal patting angle

        drawShovel(shovelX, shovelY, shovelAngle, 0.95, false);

        // Small soil impact dust puffs on each pat
        if (patOffset > 0.85) {
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(shovelX, groundY + 2, 28, 6, 0, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(160, 110, 60, 0.35)';
          ctx.fill();
          ctx.restore();
        }
      }

      ctx.restore(); // restore groundAlpha

      // --- 3. Update & Render Flying Dirt Particles ("Hitting the screen") ---
      if (elapsed > 0.25) {
        particles.forEach((p) => {
          p.z += p.vz;
          p.x += p.vx * (1 + p.z / 250);
          p.y += p.vy * (1 + p.z / 250) + 0.35; // gentle gravity
          p.rotation += p.rotSpeed;

          // 3D perspective projection scaling
          const scale = Math.max(0.2, p.z / 100);
          const currentSize = p.size * scale;
          const fadeDistance = 1100;
          const currentAlpha = Math.max(0, p.alpha * (1 - p.z / fadeDistance));

          if (currentAlpha > 0.01) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.globalAlpha = Math.min(1.0, currentAlpha);
            ctx.fillStyle = p.color;

            if (p.shape === 'spark') {
              ctx.shadowColor = '#f59e0b';
              ctx.shadowBlur = 12;
              ctx.beginPath();
              ctx.arc(0, 0, currentSize, 0, Math.PI * 2);
              ctx.fill();
            } else if (p.shape === 'clod') {
              // Chunky polygonal dirt clod
              ctx.beginPath();
              ctx.moveTo(-currentSize, -currentSize * 0.7);
              ctx.lineTo(currentSize * 0.8, -currentSize);
              ctx.lineTo(currentSize, currentSize * 0.6);
              ctx.lineTo(-currentSize * 0.4, currentSize);
              ctx.closePath();
              ctx.fill();
            } else if (p.shape === 'splat') {
              // Organic mud splash splatter
              ctx.beginPath();
              ctx.arc(0, 0, currentSize * 0.8, 0, Math.PI * 2);
              ctx.arc(currentSize * 0.6, -currentSize * 0.4, currentSize * 0.35, 0, Math.PI * 2);
              ctx.arc(-currentSize * 0.5, currentSize * 0.5, currentSize * 0.3, 0, Math.PI * 2);
              ctx.fill();
            } else {
              // Pebble / stone
              const pebbleR1 = Math.max(0.001, currentSize);
              const pebbleR2 = Math.max(0.001, currentSize * 0.65);
              ctx.beginPath();
              ctx.ellipse(0, 0, pebbleR1, pebbleR2, 0, 0, Math.PI * 2);
              ctx.fill();
            }

            ctx.restore();
          }
        });
      }

      // --- 4. Golden Seal Sparkles over Flattened Soil ---
      if (elapsed > 2.3 && elapsed < 3.0) {
        const sealT = Math.min(1.0, (elapsed - 2.3) / 0.5);
        const sealFade = elapsed > 2.7 ? Math.max(0, 1 - (elapsed - 2.7) / 0.3) : 1.0;
        ctx.save();
        ctx.globalAlpha = sealFade;
        ctx.beginPath();
        const sealRadiusX = Math.max(0.001, 44 * sealT);
        const sealRadiusY = Math.max(0.001, 14 * sealT);
        ctx.ellipse(centerX, groundY, sealRadiusX, sealRadiusY, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 158, 11, ${0.4 * (1 - sealT * 0.5)})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(251, 191, 36, ${0.85 * (1 - sealT * 0.2)})`;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden transition-opacity duration-700 ${
        animStage === 'sealed' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* 1. 2D Fullscreen Physics & Shovel Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-20"
      />

      {/* 2. Atmospheric Soil Vignette Background */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 bg-radial from-amber-950/40 via-[#1c0f07]/80 to-[#0a0502]/95 z-10 ${
          animStage === 'sealed' ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* 3. Central Time Capsule Descending & Locking Graphic */}
      <div className="relative z-30 flex flex-col items-center justify-center p-4 text-center select-none -translate-y-4 sm:-translate-y-10 will-change-transform">
        {/* Outer Glowing Energy Seal */}
        <div
          style={{ willChange: 'transform, opacity' }}
          className={`relative w-36 h-36 sm:w-56 sm:h-56 flex items-center justify-center rounded-full transition-all duration-700 ${
            animStage === 'descending'
              ? 'scale-105 shadow-[0_0_90px_rgba(217,119,6,0.7)] translate-y-8 sm:translate-y-12'
              : animStage === 'flattening' || animStage === 'sealed'
              ? 'scale-75 opacity-0 translate-y-16 sm:translate-y-24'
              : 'scale-100'
          }`}
        >
          {/* Rotating Cryptographic Rune Ring */}
          <div
            style={{ willChange: 'transform' }}
            className={`absolute inset-0 rounded-full border-2 border-dashed border-amber-400/60 transition-transform duration-1000 ${
              isLockClosed ? 'rotate-180 scale-105 border-amber-300' : 'rotate-45'
            }`}
          />
          <div className="absolute inset-2 rounded-full border border-amber-500/30 animate-ping opacity-25" />

          {/* Heavy Metallic Time Capsule Cylinder (Top & Bottom halves snapping shut) */}
          <div className="relative w-20 h-28 sm:w-28 sm:h-40 rounded-2xl bg-gradient-to-b from-amber-700 via-amber-900 to-stone-900 border-2 border-amber-400/90 shadow-2xl overflow-hidden flex flex-col items-center justify-between p-1.5 sm:p-2 will-change-transform">
            {/* Top Metallic Cap */}
            <div
              style={{ willChange: 'transform' }}
              className={`w-full h-8 sm:h-10 rounded-lg bg-gradient-to-b from-amber-300 to-amber-600 border-b border-amber-800 shadow-md flex items-center justify-center transition-transform duration-300 ${
                isLockClosed ? 'translate-y-0' : '-translate-y-2'
              }`}
            >
              <div className="w-6 sm:w-8 h-1 bg-amber-900/60 rounded-full" />
            </div>

            {/* Glowing Center Wax Seal with Lock */}
            <div className="relative my-auto flex items-center justify-center">
              <div
                style={{ willChange: 'transform, opacity' }}
                className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isLockClosed
                    ? 'bg-gradient-to-br from-rose-600 via-amber-600 to-amber-800 ring-2 sm:ring-4 ring-amber-300 shadow-[0_0_35px_rgba(245,158,11,0.9)]'
                    : 'bg-amber-950/80 ring-2 ring-amber-500/40'
                }`}
              >
                {isLockClosed ? (
                  <Lock className="w-5 h-5 sm:w-7 sm:h-7 text-amber-100 animate-bounce" />
                ) : (
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 animate-pulse" />
                )}
              </div>
            </div>

            {/* Bottom Metallic Base */}
            <div
              style={{ willChange: 'transform' }}
              className={`w-full h-8 sm:h-10 rounded-lg bg-gradient-to-t from-amber-300 to-amber-600 border-t border-amber-800 shadow-md flex items-center justify-center transition-transform duration-300 ${
                isLockClosed ? 'translate-y-0' : 'translate-y-2'
              }`}
            >
              <div className="w-6 sm:w-8 h-1 bg-amber-900/60 rounded-full" />
            </div>
          </div>
        </div>

        {/* Dynamic Status HUD Card */}
        <div
          style={{ willChange: 'transform, opacity' }}
          className={`mt-4 px-4 sm:px-6 py-2 sm:py-2.5 rounded-2xl parchment-card border border-amber-400/80 shadow-2xl max-w-sm transition-all duration-500 ${
            animStage === 'sealed' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
          }`}
        >
          <div className="flex items-center justify-center gap-2 text-amber-950 font-serif font-bold text-sm sm:text-base">
            {animStage === 'digging' ? (
              <>
                <span className="text-base">⛏️</span>
                <span>Digging Soil & Excavating...</span>
              </>
            ) : animStage === 'descending' ? (
              <>
                <Lock className="w-4 h-4 text-amber-800 animate-spin" />
                <span>Descending & Locking Capsule...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Smoothing Soil & Sealing Pin...</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-stone-700 mt-0.5 flex items-center justify-center gap-1">
            <MapPin className="w-3 h-3 text-amber-800 shrink-0" />
            <span className="truncate">
              {locationName}, {countryName}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};
