import React, { useState } from 'react';
import * as THREE from 'three';
import { Capsule, CountryData, Coordinates } from '../../types';
import { GlobeScene } from './GlobeScene';
import { SkyBackground } from './SkyBackground';
import { fetchCountryDetails, getCountryCodeFromCoordinates } from '../../utils/countries';
import { reverseGeocodeMapbox } from '../../utils/mapbox';

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

  const handleCoordinatesPicked = async (coords: { lat: number; lng: number; point: THREE.Vector3 }) => {
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
      resolvedCountryCode = fallbackMatch.countryCode;
      resolvedCountryName = fallbackMatch.countryName;
    }

    // 3. Fetch full REST Countries details for the exact clicked country
    if (resolvedCountryCode) {
      const fetchedCountry = await fetchCountryDetails(resolvedCountryCode);
      if (fetchedCountry) {
        onCountrySelected(fetchedCountry);
      }
    }

    const finalName = resolvedPlaceName || `${resolvedCountryName || 'Earth Location'} (${coords.lat.toFixed(2)}°, ${coords.lng.toFixed(2)}°)`;

    const newCoord: Coordinates = {
      lat: coords.lat,
      lng: coords.lng,
      name: finalName,
      country: resolvedCountryName || 'Global',
    };

    setClickedCoord(newCoord);

    // If in planting mode or clicked directly, trigger creation modal with coordinates
    if (isPlantingMode) {
      onOpenCreateWithCoords(newCoord);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Drifting Cosmic Stars & Atmospheric Horizon Background */}
      <SkyBackground />

      {/* 3D Interactive Photorealistic Earth Scene */}
      <div className="relative z-10 w-full h-full">
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
    </div>
  );
};
