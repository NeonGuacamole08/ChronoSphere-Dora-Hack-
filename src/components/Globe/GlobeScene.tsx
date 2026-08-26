import React, { useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { Capsule } from '../../types';
import { EarthMesh } from './EarthMesh';
import { Clouds } from './Clouds';
import { AtmosphereGlow } from './AtmosphereGlow';
import { CapsulePin } from './CapsulePin';
import { HeatmapLayer } from './HeatmapLayer';
import { CameraController } from './CameraController';
import { generateEarthTextures } from './textureGenerator';
import { UserLocation3DPin } from './UserLocation3DPin';
import { UserLocation } from '../../utils/useUserLocation';

interface GlobeSceneProps {
  capsules: Capsule[];
  selectedCapsule: Capsule | null;
  targetCoordinates?: { lat: number; lng: number } | null;
  userLocation?: UserLocation | null;
  onFocusUserLocation?: () => void;
  onSelectCapsule: (capsule: Capsule) => void;
  onCoordinatesPicked?: (coords: { lat: number; lng: number; point: THREE.Vector3 }) => void;
  showHeatmap: boolean;
  flyInTrigger: number;
  onFlyInComplete?: () => void;
  isPlantingMode: boolean;
  isJudgeOverride?: boolean;
  activeUsername?: string;
  onTriggerCloudDive?: (coords: { lat: number; lng: number }) => void;
  onZoomPastThreshold?: () => void;
}

export const GlobeScene: React.FC<GlobeSceneProps> = ({
  capsules,
  selectedCapsule,
  targetCoordinates,
  userLocation,
  onFocusUserLocation,
  onSelectCapsule,
  onCoordinatesPicked,
  showHeatmap,
  flyInTrigger,
  onFlyInComplete,
  isPlantingMode,
  isJudgeOverride = false,
  activeUsername = 'DoraHacksJudge',
  onTriggerCloudDive,
  onZoomPastThreshold,
}) => {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  const textures = useMemo(() => {
    return generateEarthTextures();
  }, []);

  return (
    <div
      className="relative w-full h-full select-none touch-none"
      style={{ touchAction: 'none' }}
    >
      <Canvas
        camera={{ position: [0, 24, 18], fov: 45, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
        resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}
        className="w-full h-full touch-none"
        style={{ touchAction: 'none' }}
      >
        {/* Deep Cosmic Lighting */}
        <ambientLight intensity={0.95} color="#e0f2fe" />
        <directionalLight
          position={[12, 14, 10]}
          intensity={2.2}
          color="#ffffff"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight
          position={[-12, -4, -10]}
          intensity={0.35}
          color="#38bdf8"
        />
        <hemisphereLight
          args={['#38bdf8', '#082f49', 0.5]}
        />

        {/* Dynamic Skydiving Fly-In & Focus Controller */}
        <CameraController
          selectedCapsule={selectedCapsule}
          targetCoordinates={targetCoordinates}
          flyInTrigger={flyInTrigger}
          onFlyInComplete={onFlyInComplete}
          controlsRef={controlsRef}
          onTriggerCloudDive={onTriggerCloudDive}
          onZoomPastThreshold={onZoomPastThreshold}
        />

        {/* Smooth Air-Gliding Orbit Controls with momentum damping */}
        <OrbitControls
          ref={controlsRef}
          enableDamping={true}
          dampingFactor={0.05}
          enablePan={false}
          enableRotate={true}
          enableZoom={true}
          minDistance={2.45}
          maxDistance={9.5}
          rotateSpeed={0.7}
          zoomSpeed={0.85}
          autoRotate={false}
          autoRotateSpeed={0.2}
        />

        {/* 3D Earth Globe and Surface Click Raycaster */}
        <group rotation={[0, 0, 0]}>
          <EarthMesh
            onCoordinatesPicked={onCoordinatesPicked}
            radius={2.0}
          />

          {/* Wispy Cloud Blanket with independent rotation */}
          <Clouds texture={textures.cloudsMap} radius={2.028} />

          {/* Soft Cyan/Azure Atmosphere Glow */}
          <AtmosphereGlow radius={2.0} />

          {/* 3D Glowing Memory Heatmap Overlay */}
          <HeatmapLayer
            capsules={capsules}
            visible={showHeatmap}
            radius={2.018}
          />

          {/* User's Live Location 3D Pin with Cute Astro-Explorer Mascot */}
          {userLocation && (
            <UserLocation3DPin
              lat={userLocation.lat}
              lng={userLocation.lng}
              accuracy={userLocation.accuracy}
              radius={2.0}
              onFocusUser={onFocusUserLocation || (() => {})}
            />
          )}

          {/* Time Capsule 3D Pins with projection beams, physical pedestals, and golden rings */}
          {capsules.map((capsule) => (
            <CapsulePin
              key={capsule.id}
              capsule={capsule}
              isSelected={selectedCapsule?.id === capsule.id}
              onSelect={onSelectCapsule}
              radius={2.0}
              isJudgeOverride={isJudgeOverride}
              activeUsername={activeUsername}
            />
          ))}
        </group>
      </Canvas>
    </div>
  );
};
