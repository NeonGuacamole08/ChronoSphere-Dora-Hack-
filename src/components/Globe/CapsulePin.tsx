import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Capsule } from '../../types';
import { latLngToVector3 } from '../../utils/coordinates';
import { Sparkles, Lock, KeyRound } from 'lucide-react';

interface CapsulePinProps {
  capsule: Capsule;
  isSelected: boolean;
  onSelect: (capsule: Capsule) => void;
  radius?: number;
  isJudgeOverride?: boolean;
  activeUsername?: string;
}

export const CapsulePin: React.FC<CapsulePinProps> = ({
  capsule,
  isSelected,
  onSelect,
  radius = 2.0,
  isJudgeOverride = false,
  activeUsername = 'DoraHacksJudge',
}) => {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const pedestalRef = useRef<THREE.Mesh>(null);

  // Clean up cursor if unmounted while hovered
  useEffect(() => {
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, []);

  // Determine if active user has permission to access this capsule's content
  const hasAccess = useMemo(() => {
    if (isJudgeOverride) return true;
    if (activeUsername.toLowerCase() === 'dorahacksjudge') return true;
    if (capsule.access_type === 'public') return true;
    if (capsule.creator_username.toLowerCase() === activeUsername.toLowerCase()) return true;
    if (
      capsule.recipient_username &&
      capsule.recipient_username.toLowerCase() === activeUsername.toLowerCase()
    ) {
      return true;
    }
    return false;
  }, [capsule, activeUsername, isJudgeOverride]);

  // Position and outward orientation on the sphere
  const position = useMemo(() => {
    return latLngToVector3(capsule.lat, capsule.lng, radius);
  }, [capsule.lat, capsule.lng, radius]);

  const rotation = useMemo(() => {
    const normal = position.clone().normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);
    return new THREE.Euler().setFromQuaternion(quaternion);
  }, [position]);

  // Subtle pulsing animation on the beam & top beacon ring
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ringRef.current) {
      const pulse = 1 + Math.sin(t * 3.5 + capsule.lat) * 0.08;
      ringRef.current.scale.set(pulse, pulse, pulse);
    }
    if (beamRef.current) {
      const beamGlow = 0.75 + Math.sin(t * 2.5 + capsule.lng) * 0.15;
      (beamRef.current.material as THREE.MeshBasicMaterial).opacity =
        hovered || isSelected ? 0.95 : beamGlow;
    }
  });

  const beamHeight = 0.38;

  // Prominently show title pill for selected capsule or hovered
  const showTitlePill = isSelected || hovered;

  // Visual theme colors based on access & status
  const beamColor = !hasAccess
    ? '#f43f5e'
    : capsule.access_type === 'private'
    ? '#eab308'
    : '#67e8f9';

  const ringColor = !hasAccess ? '#fb7185' : '#facc15';

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(capsule);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* 1. PHYSICAL MANIFESTATION: Solid Metallic Anchor Pedestal embedded in Earth's Crust */}
      <mesh
        ref={pedestalRef}
        position={[0, 0.02, 0]}
      >
        <cylinderGeometry args={[0.022, 0.034, 0.04, 16]} />
        <meshStandardMaterial
          color={!hasAccess ? '#4c0519' : '#1e293b'}
          metalness={0.85}
          roughness={0.25}
        />
      </mesh>

      {/* 2. Physical Capsule Core (Floating Inset Vault Body) */}
      <mesh position={[0, 0.06, 0]}>
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshStandardMaterial
          color={!hasAccess ? '#e11d48' : '#38bdf8'}
          emissive={!hasAccess ? '#881337' : '#0284c7'}
          emissiveIntensity={0.6}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* 3. Glowing Radial Projection Light Beam */}
      <mesh
        ref={beamRef}
        position={[0, beamHeight / 2 + 0.03, 0]}
      >
        <cylinderGeometry args={[0.005, 0.015, beamHeight, 16]} />
        <meshBasicMaterial
          color={beamColor}
          transparent
          opacity={hovered || isSelected ? 0.95 : 0.8}
        />
      </mesh>

      {/* 4. Surface Base Impact Glow Ring on Earth */}
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.038, 24]} />
        <meshBasicMaterial
          color={!hasAccess ? '#e11d48' : '#38bdf8'}
          transparent
          opacity={0.65}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 5. Golden Circular Ring Target at the tip of the beam */}
      <mesh
        ref={ringRef}
        position={[0, beamHeight + 0.03, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[0.036, 0.005, 16, 32]} />
        <meshBasicMaterial
          color={ringColor}
          transparent
          opacity={1.0}
        />
      </mesh>

      {/* 6. Floating 3D Label Badge */}
      {showTitlePill && (
        <Html
          position={[0, beamHeight + 0.05, 0]}
          center
          distanceFactor={6.5}
          zIndexRange={[20, 0]}
        >
          <div className="relative pointer-events-auto cursor-pointer select-none">
            {/* Conditional Badge Styling depending on Access */}
            {hasAccess ? (
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md transition-all duration-200 transform whitespace-nowrap border shadow-xl ${
                  isSelected
                    ? 'bg-[#063327]/95 text-emerald-100 border-emerald-300 ring-2 ring-emerald-400 scale-105'
                    : 'bg-[#083023]/90 text-emerald-100 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                }`}
              >
                {capsule.access_type === 'private' ? (
                  <KeyRound className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                )}
                <span className="font-sans font-medium text-xs tracking-tight text-emerald-100">
                  {capsule.title.length > 24
                    ? `${capsule.title.slice(0, 22)}...`
                    : capsule.title}
                </span>
              </div>
            ) : (
              /* Restricted Private Badge for Unauthorized Users */
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md transition-all duration-200 transform whitespace-nowrap border shadow-xl ${
                  isSelected
                    ? 'bg-[#3b0d14]/95 text-rose-100 border-rose-400 ring-2 ring-rose-500 scale-105'
                    : 'bg-[#29090e]/90 text-rose-200 border-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="font-sans font-medium text-xs tracking-tight text-rose-100">
                  Private ({capsule.creator_username})
                </span>
              </div>
            )}

            {/* Hover Detailed Tooltip Card */}
            {hovered && !isSelected && (
              <div className="absolute left-1/2 bottom-full -translate-x-1/2 mb-2 w-56 p-3 rounded-2xl bg-[#0b1320]/95 backdrop-blur-md border border-cyan-400/50 shadow-2xl text-left pointer-events-none z-30">
                <div className="flex items-center justify-between border-b border-cyan-500/30 pb-1 mb-1.5">
                  <span className="text-[10px] font-bold text-cyan-300 truncate">
                    {capsule.location_name}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                    capsule.access_type === 'public'
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                  }`}>
                    {capsule.access_type}
                  </span>
                </div>

                {hasAccess ? (
                  <>
                    <div className="text-[11px] text-stone-200 line-clamp-2">
                      {capsule.message}
                    </div>
                    <div className="mt-1.5 text-[9px] text-cyan-400/80 font-mono flex items-center justify-between">
                      <span>By {capsule.creator_username}</span>
                      <span>Arweave Anchored</span>
                    </div>
                  </>
                ) : (
                  <div className="text-[11px] text-rose-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>Locked vault: Only creator & tagged recipient can decrypt.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};
