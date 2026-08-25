import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { Capsule, CountryData, Coordinates } from '../../types';
import { GlobeScene } from './GlobeScene';
import { SkyBackground } from './SkyBackground';
import { fetchCountryDetails, getCountryCodeFromCoordinates, isCoordinateOnLand } from '../../utils/countries';
import { reverseGeocodeMapbox } from '../../utils/mapbox';
import { LandWarningToast } from './LandWarningToast';

interface GlobeViewProps {
  capsules: Capsule[];
  selectedCapsule: Capsule | null;
  targetCoordinates?: { lat: number; lng: number } | null;
  onSelectCapsule: (capsule: Capsule) => void;
  showHeatmap: boolean;
  flyInTrigger: number;
  onFlyInComplete?: () => void;
  onOpenCreateWithCoords: (coords: Coordinates) => void;
  onCountrySelected: (country: CountryData) => void;
  isPlantingMode: boolean;
  onTogglePlantingMode: () => void;
  isJudgeOverride?: boolean;
  activeUsername?: string;
}

export const GlobeView: React.FC<GlobeViewProps> = ({
  capsules,
  selectedCapsule,
  targetCoordinates,
  onSelectCapsule,
  showHeatmap,
  flyInTrigger,
  onFlyInComplete,
  onOpenCreateWithCoords,
  onCountrySelected,
  isPlantingMode,
  isJudgeOverride = false,
  activeUsername = 'DoraHacksJudge',
}) => {
  const [, setClickedCoord] = useState<Coordinates | null>(null);
  const [showOceanWarning, setShowOceanWarning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep references to latest callbacks and flags to completely avoid stale closures
  const isPlantingModeRef = useRef(isPlantingMode);
  const onOpenCreateWithCoordsRef = useRef(onOpenCreateWithCoords);
  const onCountrySelectedRef = useRef(onCountrySelected);

  useEffect(() => {
    isPlantingModeRef.current = isPlantingMode;
  }, [isPlantingMode]);

  useEffect(() => {
    onOpenCreateWithCoordsRef.current = onOpenCreateWithCoords;
  }, [onOpenCreateWithCoords]);

  useEffect(() => {
    onCountrySelectedRef.current = onCountrySelected;
  }, [onCountrySelected]);

  // Recalibrate Three.js canvas size on container resize
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      window.dispatchEvent(new Event('resize'));
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleCoordinatesPicked = useCallback(
    async (coords: { lat: number; lng: number; point: THREE.Vector3 }) => {
      // Check whether clicked coordinate is strictly on landmass
      const onLand = isCoordinateOnLand(coords.lat, coords.lng);

      // 1. First attempt Mapbox high-precision reverse geocode for exact country and location
      let resolvedCountryCode: string | undefined;
      let resolvedCountryName: string | undefined;
      let resolvedPlaceName: string | undefined;

      try {
        const reverseRes = await reverseGeocodeMapbox(coords.lat, coords.lng);
        if (reverseRes.countryCode) {
          resolvedCountryCode = reverseRes.countryCode;
          resolvedCountryName = reverseRes.countryName;
        }
        resolvedPlaceName = reverseRes.placeName;
      } catch (e) {
        console.warn('Mapbox reverse geocoding fallback:', e);
      }

      // 2. Fallback to high-precision point-in-polygon country boundary matcher if needed
      if (!resolvedCountryCode) {
        const fallbackMatch = getCountryCodeFromCoordinates(coords.lat, coords.lng);
        if (fallbackMatch.countryCode !== 'OCEAN') {
          resolvedCountryCode = fallbackMatch.countryCode;
          resolvedCountryName = fallbackMatch.countryName;
        }
      }

      // If clicked point has neither land polygon match nor geocoded place, it's open ocean
      const isTerrestrial = onLand || Boolean(resolvedCountryCode && resolvedCountryCode !== 'OCEAN');

      if (!isTerrestrial) {
        // Show non-intrusive ocean warning toast and disallow planting in ocean
        setShowOceanWarning(true);
        return;
      }

      // 3. Fetch full REST Countries details for the exact clicked country
      if (resolvedCountryCode && resolvedCountryCode !== 'OCEAN') {
        const fetchedCountry = await fetchCountryDetails(resolvedCountryCode);
        if (fetchedCountry && onCountrySelectedRef.current) {
          onCountrySelectedRef.current(fetchedCountry);
        }
      }

      const finalName =
        resolvedPlaceName ||
        `${resolvedCountryName || 'Land Location'} (${coords.lat.toFixed(2)}°, ${coords.lng.toFixed(2)}°)`;

      const newCoord: Coordinates = {
        lat: coords.lat,
        lng: coords.lng,
        name: finalName,
        country: resolvedCountryName || 'Global',
      };

      setClickedCoord(newCoord);

      // If in planting mode or clicked directly to plant, trigger creation modal with fresh coordinates
      if (isPlantingModeRef.current && onOpenCreateWithCoordsRef.current) {
        onOpenCreateWithCoordsRef.current(newCoord);
      }
    },
    []
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full w-screen h-screen h-dvh overflow-hidden touch-none"
      style={{ touchAction: 'none' }}
    >
      {/* Drifting Cosmic Stars & Atmospheric Horizon Background */}
      <SkyBackground />

      {/* 3D Interactive Photorealistic Earth Scene */}
      <div className="relative z-10 w-full h-full h-dvh touch-none" style={{ touchAction: 'none' }}>
        <GlobeScene
          capsules={capsules}
          selectedCapsule={selectedCapsule}
          targetCoordinates={targetCoordinates}
          onSelectCapsule={onSelectCapsule}
          onCoordinatesPicked={handleCoordinatesPicked}
          showHeatmap={showHeatmap}
          flyInTrigger={flyInTrigger}
          onFlyInComplete={onFlyInComplete}
          isPlantingMode={isPlantingMode}
          isJudgeOverride={isJudgeOverride}
          activeUsername={activeUsername}
        />
      </div>

      {/* Non-intrusive Ocean Click Notification */}
      <LandWarningToast
        isOpen={showOceanWarning}
        onClose={() => setShowOceanWarning(false)}
      />
    </div>
  );
};
