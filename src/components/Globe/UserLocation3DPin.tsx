import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { latLngToVector3 } from '../../utils/coordinates';
import { CuteExplorerMascot } from '../Navigation/CuteExplorerMascot';
import { Sparkles, Navigation } from 'lucide-react';

interface UserLocation3DPinProps {
  lat: number;
  lng: number;
  accuracy?: number;
  radius?: number;
  onFocusUser: () => void;
}

export const UserLocation3DPin: React.FC<UserLocation3DPinProps> = ({
  lat,
  lng,
  radius = 2.0,
  onFocusUser,
}) => {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const waveRingRef = useRef<THREE.Mesh>(null);

  // Position on the 3D sphere surface
  const position = useMemo(() => {
    return latLngToVector3(lat, lng, radius);
  }, [lat, lng, radius]);

  const rotation = useMemo(() => {
    const normal = position.clone().normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);
    const euler = new THREE.Euler().setFromQuaternion(quaternion);
    return euler;
  }, [position]);

  // Subtle floating and wave expansion
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ringRef.current) {
      const scale = 1 + Math.sin(t * 3) * 0.08;
      ringRef.current.scale.set(scale, scale, scale);
    }
    if (waveRingRef.current) {
      const wave = (t * 0.8) % 1;
      const waveScale = 1 + wave * 1.8;
      waveRingRef.current.scale.set(waveScale, waveScale, waveScale);
      (waveRingRef.current.material as THREE.MeshBasicMaterial).opacity = (1 - wave) * 0.6;
    }
  });

  // Restore cursor on unmount
  useEffect(() => {
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, []);

  return (
    <group position={position} rotation={rotation} ref={groupRef}>
      {/* Surface Base Ring */}
      <mesh ref={ringRef} position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.02, 0.038, 32]} />
        <meshBasicMaterial
          color="#06b6d4"
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Expanding Holographic Wave Ring */}
      <mesh ref={waveRingRef} position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.025, 0.045, 32]} />
        <meshBasicMaterial
          color="#22d3ee"
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Vertical Light Projection Cone/Cylinder */}
      <mesh position={[0, 0.035, 0]}>
        <cylinderGeometry args={[0.003, 0.02, 0.07, 16, 1, true]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Interactive Cute Avatar Mascot Billboard HTML */}
      <Html
        position={[0, 0.08, 0]}
        center
        distanceFactor={6.5}
        zIndexRange={[100, 0]}
        style={{ pointerEvents: 'auto' }}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            onFocusUser();
          }}
          onMouseEnter={() => {
            setHovered(true);
            document.body.style.cursor = 'pointer';
          }}
          onMouseLeave={() => {
            setHovered(false);
            document.body.style.cursor = 'auto';
          }}
          className="flex flex-col items-center select-none cursor-pointer group animate-in fade-in zoom-in-75 duration-300"
          style={{ transform: 'translate3d(0, -10px, 0)' }}
          title="Your Live Location - Click to zoom here!"
        >
          {/* Cute Floating "You" Badge */}
          <div
            className={`whitespace-nowrap px-2.5 py-0.5 rounded-full bg-[#0c1626]/95 border border-cyan-400 text-white text-[11px] font-bold shadow-[0_4px_16px_rgba(6,182,212,0.6)] flex items-center gap-1 backdrop-blur-md transition-transform duration-200 ${
              hovered ? 'scale-115 -translate-y-1' : 'hover:scale-110'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-cyan-200">You</span>
            <Sparkles className="w-3 h-3 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
          </div>

          {/* Cute Mascot Avatar */}
          <div
            className={`relative mt-1 p-1 rounded-2xl bg-gradient-to-br from-[#0c1e36] to-[#040e1a] border-2 border-cyan-300 shadow-[0_8px_24px_rgba(6,182,212,0.7)] flex items-center justify-center transition-all duration-200 ${
              hovered ? 'scale-120 rotate-3 ring-4 ring-cyan-400/50' : 'group-hover:scale-110'
            }`}
          >
            <CuteExplorerMascot size={32} animate={false} />
          </div>

          {/* Tooltip on Hover */}
          {hovered && (
            <div className="absolute -bottom-8 whitespace-nowrap px-2.5 py-1 rounded-xl bg-[#08121e]/98 border border-cyan-400/80 text-cyan-200 text-[10px] font-mono shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-1 z-50 flex items-center gap-1.5">
              <Navigation className="w-3 h-3 text-cyan-400 fill-cyan-400 animate-bounce" />
              <span>Click to fly to your location</span>
            </div>
          )}
        </div>
      </Html>
    </group>
  );
};
