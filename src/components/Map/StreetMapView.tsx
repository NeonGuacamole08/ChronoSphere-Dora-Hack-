import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
  Circle,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Globe,
  Navigation,
  MapPin,
  Sparkles,
  Unlock,
  Radio,
  Eye,
  Crosshair,
  Flame,
  Snowflake,
  Volume2,
  VolumeX,
  Target,
  X,
  Plus,
  Check,
  MousePointerClick,
  Layers,
} from 'lucide-react';
import { Capsule, Coordinates } from '../../types';
import { UserLocation } from '../../utils/useUserLocation';
import { formatDistanceText, getDistanceInMeters } from '../../utils/proximity';
import { reverseGeocodeMapbox } from '../../utils/mapbox';
import { ambientSound } from '../../utils/audio';
import { CuteExplorerMascot, getCuteUserLocationSvgString } from '../Navigation/CuteExplorerMascot';

// Fix default Leaflet marker icon asset resolution in Vite / React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Safeguard Leaflet DOM position getter/setter against race conditions during unmount & rapid re-renders
if (typeof window !== 'undefined' && L && L.DomUtil) {
  const originalGetPosition = L.DomUtil.getPosition;
  L.DomUtil.getPosition = function (el: HTMLElement) {
    if (!el) {
      return new L.Point(0, 0);
    }
    try {
      if ((el as any)._leaflet_pos) {
        return (el as any)._leaflet_pos;
      }
      return originalGetPosition ? originalGetPosition.call(this, el) : new L.Point(0, 0);
    } catch {
      return (el as any)?._leaflet_pos || new L.Point(0, 0);
    }
  };

  const originalSetPosition = L.DomUtil.setPosition;
  L.DomUtil.setPosition = function (el: HTMLElement, point: L.Point) {
    if (!el) return;
    try {
      if (originalSetPosition) {
        originalSetPosition.call(this, el, point);
      } else {
        (el as any)._leaflet_pos = point;
        el.style.left = point.x + 'px';
        el.style.top = point.y + 'px';
      }
    } catch {
      if (el) {
        (el as any)._leaflet_pos = point;
      }
    }
  };
}

interface StreetMapViewProps {
  capsules: Capsule[];
  selectedCapsule: Capsule | null;
  targetCoordinates?: { lat: number; lng: number } | null;
  onSelectCapsule: (capsule: Capsule) => void;
  onSwitchTo3D: () => void;
  onOpenCreateWithCoords: (coords: Coordinates) => void;
  isPlantingMode: boolean;
  onTogglePlantingMode?: () => void;
  userLocation: UserLocation | null;
  onSimulateLocation?: (lat: number, lng: number) => void;
  initialCenter?: { lat: number; lng: number; zoom?: number };
}

// Tile layers available for free OSM exploration
const TILE_STYLES = [
  {
    id: 'osm_standard',
    name: 'OpenStreetMap Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  {
    id: 'carto_voyager',
    name: 'Carto Voyager (Streets & POIs)',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    maxZoom: 20,
  },
  {
    id: 'carto_dark',
    name: 'Dark Matter (Night Grid)',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    maxZoom: 20,
  },
];

// Helper: Custom Animated HTML DivIcon creator for Leaflet
function createCapsuleDivIcon(
  capsule: Capsule,
  isSelected: boolean,
  isHunting: boolean
): L.DivIcon {
  const isInstant = capsule.public_unlock_mode === 'instant_find';
  const isUnlocked = new Date(capsule.unlock_timestamp).getTime() <= Date.now();
  const districtLabel = capsule.location_name ? capsule.location_name.split(',')[0].trim() : 'Local Pin';

  const pinGradient = isInstant
    ? 'from-amber-400 via-amber-500 to-amber-600'
    : isUnlocked
    ? 'from-emerald-400 via-emerald-500 to-emerald-600'
    : 'from-amber-600 via-amber-700 to-stone-900';

  const pinBorder = isInstant
    ? 'border-yellow-200'
    : isUnlocked
    ? 'border-emerald-200'
    : 'border-amber-400';

  const iconHtml = `
    <div class="relative flex flex-col items-center select-none group" style="transform: translate(-50%, -100%);">
      ${
        isHunting || isSelected
          ? `
            <div class="absolute -top-6 w-24 h-24 rounded-full bg-amber-400/20 border border-amber-400/60 animate-ping pointer-events-none"></div>
            <div class="absolute -top-3 w-16 h-16 rounded-full bg-amber-500/25 border border-amber-300/80 animate-pulse pointer-events-none"></div>
          `
          : ''
      }

      <!-- Mini Callout Badge -->
      <div class="mb-1 px-2.5 py-0.5 rounded-full bg-[#120a05]/95 border border-amber-400/80 text-amber-100 text-[11px] font-bold shadow-2xl whitespace-nowrap backdrop-blur-md flex items-center gap-1.5 ${
        isSelected
          ? 'scale-110 ring-2 ring-amber-400 bg-amber-950 text-amber-200'
          : 'opacity-90 hover:opacity-100 hover:scale-105'
      }">
        <span class="text-xs">${isInstant ? '⚡' : isUnlocked ? '🔓' : '🔒'}</span>
        <span class="max-w-[130px] truncate">${capsule.title || districtLabel}</span>
      </div>

      <!-- Capsule Core Marker Icon -->
      <div class="relative w-8 h-8 rounded-2xl bg-gradient-to-br ${pinGradient} border-2 ${pinBorder} shadow-2xl flex items-center justify-center transition-transform ${
        isSelected ? 'scale-120 ring-4 ring-amber-400 animate-bounce' : 'hover:scale-110'
      }">
        ${
          isInstant
            ? '<svg class="w-4 h-4 text-stone-950 font-black fill-current" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>'
            : isUnlocked
            ? '<svg class="w-4 h-4 text-emerald-950 font-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke-width="2.5"/><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke-width="2.5"/></svg>'
            : '<svg class="w-4 h-4 text-amber-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke-width="2.5"/><path d="M7 11V7a5 5 0 0 1 9.9-1" stroke-width="2.5"/></svg>'
        }
      </div>

      <!-- Anchor point -->
      <div class="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] border-t-amber-600 -mt-0.5"></div>
      <div class="w-3 h-1 bg-black/40 rounded-full blur-[1px] mt-0.5"></div>
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: 'custom-leaflet-capsule-marker',
    iconSize: [32, 48],
    iconAnchor: [16, 48],
    popupAnchor: [0, -48],
  });
}

// User Live GPS Icon with Cute Astro-Explorer Mascot
function createUserLocationDivIcon(heading: number = 0): L.DivIcon {
  return L.divIcon({
    html: getCuteUserLocationSvgString(heading),
    className: 'custom-leaflet-user-marker',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -28],
  });
}

// Internal Child Component: Map Lifecycle & Cleanup Guard
function MapLifecycleGuard() {
  const map = useMap();
  useEffect(() => {
    return () => {
      try {
        map.stop();
        map.closePopup();
      } catch {
        // ignore
      }
    };
  }, [map]);
  return null;
}

// Internal Child Component: Interactive Map Click & Zoom Events Engine with useMapEvents
function MapEventsHandler({
  onMapClick,
  onZoomChange,
}: {
  onMapClick: (lat: number, lng: number) => void;
  onZoomChange?: (zoom: number) => void;
}) {
  const map = useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
    contextmenu(e) {
      e.originalEvent.preventDefault();
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
    zoomend() {
      if (onZoomChange) {
        onZoomChange(map.getZoom());
      }
    },
  });
  return null;
}

// Internal Child Component: Programmatic Map Pan/Fly Handler
function MapController({
  center,
  zoom,
  targetCoords,
  selectedCapsule,
}: {
  center: [number, number];
  zoom?: number;
  targetCoords?: { lat: number; lng: number } | null;
  selectedCapsule?: Capsule | null;
}) {
  const map = useMap();

  useEffect(() => {
    try {
      if (selectedCapsule) {
        map.flyTo([selectedCapsule.lat, selectedCapsule.lng], 16, {
          duration: 1.2,
        });
      } else if (targetCoords) {
        map.flyTo([targetCoords.lat, targetCoords.lng], 15, {
          duration: 1.2,
        });
      }
    } catch {
      // ignore
    }

    return () => {
      try {
        map.stop();
      } catch {
        // ignore
      }
    };
  }, [map, selectedCapsule, targetCoords]);

  return null;
}

export const StreetMapView: React.FC<StreetMapViewProps> = ({
  capsules,
  selectedCapsule,
  targetCoordinates,
  onSelectCapsule,
  onSwitchTo3D,
  onOpenCreateWithCoords,
  isPlantingMode,
  onTogglePlantingMode,
  userLocation,
  onSimulateLocation,
  initialCenter,
}) => {
  const mapRef = useRef<L.Map | null>(null);

  // Selected tile layer style
  const [selectedStyleId, setSelectedStyleId] = useState<string>('osm_standard');
  const [showStyleMenu, setShowStyleMenu] = useState<boolean>(false);

  // Local Drop Pin & Geocoding state
  const [isLocalDropMode, setIsLocalDropMode] = useState<boolean>(isPlantingMode);
  const [isGeocodingDrop, setIsGeocodingDrop] = useState<boolean>(false);
  const [dropPreviewCoord, setDropPreviewCoord] = useState<Coordinates | null>(null);

  // Selected street capsule & Scavenger hunt state
  const [activeStreetCapsule, setActiveStreetCapsule] = useState<Capsule | null>(null);
  const [huntingCapsule, setHuntingCapsule] = useState<Capsule | null>(null);
  const [isRadarAudioActive, setIsRadarAudioActive] = useState<boolean>(true);
  const radarAudioTimerRef = useRef<number | null>(null);

  // Sync isPlantingMode prop
  useEffect(() => {
    setIsLocalDropMode(isPlantingMode);
  }, [isPlantingMode]);

  // Derive initial map center
  const centerLat =
    selectedCapsule?.lat ||
    targetCoordinates?.lat ||
    initialCenter?.lat ||
    userLocation?.lat ||
    48.8566;
  const centerLng =
    selectedCapsule?.lng ||
    targetCoordinates?.lng ||
    initialCenter?.lng ||
    userLocation?.lng ||
    2.3522;

  // Real-Time Device Geolocation on Component Mount
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation && !selectedCapsule && !targetCoordinates && !initialCenter) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          if (mapRef.current) {
            mapRef.current.flyTo([latitude, longitude], 15, {
              duration: 1.5,
            });
          }
        },
        (err) => {
          console.warn('Leaflet geolocation notice:', err.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
  }, [selectedCapsule, targetCoordinates, initialCenter]);

  // Seamless Zoom-Out Return to Globe View (z <= 3)
  const hasTriggeredZoomOutRef = useRef<boolean>(false);
  const handleMapZoomChange = useCallback(
    (currentZoom: number) => {
      if (currentZoom <= 3 && !hasTriggeredZoomOutRef.current) {
        hasTriggeredZoomOutRef.current = true;
        ambientSound.playCloudDiveWhooshSound(1.4);
        setTimeout(() => {
          onSwitchTo3D();
        }, 50);
        setTimeout(() => {
          hasTriggeredZoomOutRef.current = false;
        }, 2500);
      }
    },
    [onSwitchTo3D]
  );

  // Click-to-Pin Engine: Capture coordinates & trigger creation modal
  const handleMapClick = useCallback(
    async (lat: number, lng: number) => {
      // If in planting mode OR local drop mode OR explicit pin drop
      ambientSound.playPinDropSound();
      setIsGeocodingDrop(true);
      setDropPreviewCoord({ lat, lng });

      try {
        const geoInfo = await reverseGeocodeMapbox(lat, lng);
        const locationName = geoInfo.placeName || `Street Point (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`;
        const countryName = geoInfo.countryName || 'OpenStreetMap Coordinates';

        onOpenCreateWithCoords({
          lat,
          lng,
          name: locationName,
          country: countryName,
        });
      } catch (err) {
        onOpenCreateWithCoords({
          lat,
          lng,
          name: `Street Point (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`,
          country: 'OpenStreetMap Coordinates',
        });
      } finally {
        setIsGeocodingDrop(false);
        setIsLocalDropMode(false);
        setDropPreviewCoord(null);
      }
    },
    [onOpenCreateWithCoords]
  );

  // Proximity Distance to Hunting Capsule
  const huntingDistanceMeters = useMemo(() => {
    if (!huntingCapsule || !userLocation) return null;
    return getDistanceInMeters(userLocation.lat, userLocation.lng, huntingCapsule.lat, huntingCapsule.lng);
  }, [huntingCapsule, userLocation]);

  const unlockThreshold = huntingCapsule?.unlock_radius_meters || 20;
  const isHuntingTargetReached =
    huntingDistanceMeters !== null && huntingDistanceMeters <= Math.max(20, unlockThreshold);

  // Proximity Hot / Cold Rating
  const proximityStatus = useMemo(() => {
    if (huntingDistanceMeters === null) return { text: 'Searching...', color: 'text-stone-400', level: 'cold', factor: 0.1 };
    if (huntingDistanceMeters <= 20) return { text: '⚡ Sizzling Hot! (Target In Reach)', color: 'text-emerald-400', level: 'sizzling', factor: 1.0 };
    if (huntingDistanceMeters <= 60) return { text: '🔥 Burning Hot!', color: 'text-orange-400', level: 'hot', factor: 0.8 };
    if (huntingDistanceMeters <= 150) return { text: '🌡️ Getting Warm...', color: 'text-amber-300', level: 'warm', factor: 0.5 };
    return { text: '❄️ Cold (Keep moving)', color: 'text-cyan-300', level: 'cold', factor: 0.2 };
  }, [huntingDistanceMeters]);

  // Dynamic Radar Sonar Beep Loop
  useEffect(() => {
    if (!huntingCapsule || !isRadarAudioActive || huntingDistanceMeters === null) {
      if (radarAudioTimerRef.current) {
        clearInterval(radarAudioTimerRef.current);
        radarAudioTimerRef.current = null;
      }
      return;
    }

    const factor = proximityStatus.factor;
    const intervalMs = Math.max(350, Math.floor(1800 - factor * 1400));

    if (radarAudioTimerRef.current) {
      clearInterval(radarAudioTimerRef.current);
    }

    radarAudioTimerRef.current = window.setInterval(() => {
      ambientSound.playRadarPulseBeep(factor);
    }, intervalMs);

    return () => {
      if (radarAudioTimerRef.current) {
        clearInterval(radarAudioTimerRef.current);
        radarAudioTimerRef.current = null;
      }
    };
  }, [huntingCapsule, isRadarAudioActive, huntingDistanceMeters, proximityStatus.factor]);

  // Nearest Public Capsule Discovery Alert
  const nearestPublicCapsule = useMemo(() => {
    if (!userLocation || !capsules.length) return null;
    let closest: { capsule: Capsule; distance: number } | null = null;

    for (const cap of capsules) {
      if (cap.access_type !== 'public' || cap.is_draft) continue;
      const dist = getDistanceInMeters(userLocation.lat, userLocation.lng, cap.lat, cap.lng);
      if (dist <= 500) {
        if (!closest || dist < closest.distance) {
          closest = { capsule: cap, distance: dist };
        }
      }
    }
    return closest;
  }, [userLocation, capsules]);

  // Actions
  const handleStartHunt = (capsule: Capsule) => {
    setHuntingCapsule(capsule);
    setActiveStreetCapsule(capsule);
    if (mapRef.current) {
      mapRef.current.flyTo([capsule.lat, capsule.lng], 16, { duration: 1.2 });
    }
  };

  const handleStopHunt = () => {
    setHuntingCapsule(null);
  };

  const handleCenterOnUser = () => {
    if (!mapRef.current || !userLocation) return;
    mapRef.current.flyTo([userLocation.lat, userLocation.lng], 16, { duration: 1.2 });
  };

  const handleToggleDropPinMode = () => {
    if (onTogglePlantingMode) {
      onTogglePlantingMode();
    } else {
      setIsLocalDropMode((prev) => !prev);
    }
  };

  const handleDropAtMapCenter = () => {
    if (!mapRef.current) return;
    const center = mapRef.current.getCenter();
    handleMapClick(center.lat, center.lng);
  };

  const activeTileStyle =
    TILE_STYLES.find((s) => s.id === selectedStyleId) || TILE_STYLES[0];

  const isDropModeActive = isLocalDropMode || isPlantingMode;

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-[#0e1726]">
      {/* Leaflet MapContainer Component */}
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={initialCenter?.zoom || 14}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        ref={mapRef}
        zoomControl={false}
      >
        {/* OpenStreetMap Tile Layer */}
        <TileLayer
          url={activeTileStyle.url}
          attribution={activeTileStyle.attribution}
          maxZoom={activeTileStyle.maxZoom}
        />

        {/* Map Lifecycle & Cleanup Guard */}
        <MapLifecycleGuard />

        {/* Map Click & Zoom Events Listener (Auto zoom-out switch to Globe when z <= 3) */}
        <MapEventsHandler
          onMapClick={handleMapClick}
          onZoomChange={handleMapZoomChange}
        />

        {/* Programmatic Center and Pan controller */}
        <MapController
          center={[centerLat, centerLng]}
          targetCoords={targetCoordinates}
          selectedCapsule={selectedCapsule}
        />

        {/* Render Leaflet Markers for Stored Supabase Capsules */}
        {capsules.map((cap) => {
          if (cap.is_draft) return null;
          const isSelected = selectedCapsule?.id === cap.id || activeStreetCapsule?.id === cap.id;
          const isHunting = huntingCapsule?.id === cap.id;
          const customIcon = createCapsuleDivIcon(cap, isSelected, isHunting);

          return (
            <React.Fragment key={cap.id}>
              {/* Unlock zone perimeter circle */}
              {isSelected && (
                <Circle
                  center={[cap.lat, cap.lng]}
                  radius={cap.unlock_radius_meters || 50}
                  pathOptions={{
                    color: '#f59e0b',
                    fillColor: '#f59e0b',
                    fillOpacity: 0.15,
                    weight: 1.5,
                    dashArray: '4, 6',
                  }}
                />
              )}

              <Marker
                position={[cap.lat, cap.lng]}
                icon={customIcon}
                eventHandlers={{
                  click: () => {
                    onSelectCapsule(cap);
                    setActiveStreetCapsule(cap);
                  },
                }}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="p-1 space-y-1.5 text-stone-900 min-w-[160px]">
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <span>{cap.public_unlock_mode === 'instant_find' ? '⚡' : '🔒'}</span>
                      <span className="truncate">{cap.title}</span>
                    </div>
                    <p className="text-[10.5px] text-stone-600 truncate">{cap.location_name}</p>
                    <div className="flex items-center justify-between pt-1 border-t border-stone-200">
                      <button
                        type="button"
                        onClick={() => handleStartHunt(cap)}
                        className="px-2 py-1 rounded-md bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-[10.5px] transition cursor-pointer"
                      >
                        Hunt Mode
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectCapsule(cap)}
                        className="px-2 py-1 rounded-md bg-stone-800 hover:bg-stone-700 text-white font-bold text-[10.5px] transition cursor-pointer"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}

        {/* User GPS Location Marker with Cute Mascot */}
        {userLocation && (
          <>
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={userLocation.accuracy || 25}
              pathOptions={{
                color: '#06b6d4',
                fillColor: '#06b6d4',
                fillOpacity: 0.12,
                weight: 1.5,
              }}
            />
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={createUserLocationDivIcon(userLocation.heading || 0)}
              zIndexOffset={1000}
              eventHandlers={{
                click: () => {
                  handleCenterOnUser();
                },
              }}
            >
              <Popup className="custom-leaflet-user-popup">
                <div className="p-2 space-y-2 text-stone-900 min-w-[200px] text-center sm:text-left select-none">
                  <div className="flex items-center gap-2 border-b border-stone-200 pb-1.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
                      <CuteExplorerMascot size={24} animate={false} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-xs font-bold text-cyan-900">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>You Are Here!</span>
                      </div>
                      <p className="text-[10.5px] text-stone-500 font-mono">
                        {userLocation.lat.toFixed(4)}°, {userLocation.lng.toFixed(4)}°
                      </p>
                    </div>
                  </div>

                  {userLocation.locationName && (
                    <p className="text-xs text-stone-700 font-semibold leading-tight">
                      📍 {userLocation.locationName}
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onOpenCreateWithCoords({
                          lat: userLocation.lat,
                          lng: userLocation.lng,
                          name: userLocation.locationName || 'Current Location',
                        });
                      }}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-[11px] transition shadow cursor-pointer text-center"
                    >
                      Plant Capsule
                    </button>
                    <button
                      type="button"
                      onClick={handleCenterOnUser}
                      className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-white font-bold text-[11px] transition cursor-pointer"
                      title="Center map on me"
                    >
                      Center
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {/* Temporary Preview Drop Marker (Fixed responsive layout) */}
        {dropPreviewCoord && (
          <Marker
            position={[dropPreviewCoord.lat, dropPreviewCoord.lng]}
            icon={L.divIcon({
              html: `
                <div class="custom-drop-marker-wrapper flex flex-col items-center select-none pointer-events-none" style="transform: translate(-50%, -100%);">
                  <div class="whitespace-nowrap px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-stone-950 text-[11px] font-black shadow-2xl mb-1 border border-white/90 ring-2 ring-amber-400/50 flex items-center gap-1.5 backdrop-blur-md">
                    <span class="text-xs">📍</span>
                    <span>Planting Capsule...</span>
                  </div>
                  <div class="relative w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border-2 border-white shadow-2xl flex items-center justify-center ring-4 ring-amber-400/70 animate-bounce">
                    <span class="text-xs font-black">⚡</span>
                  </div>
                  <div class="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] border-t-amber-500 -mt-0.5"></div>
                </div>
              `,
              className: 'custom-drop-marker-container',
              iconSize: [44, 60],
              iconAnchor: [22, 60],
            })}
          />
        )}
      </MapContainer>

      {/* Floating Top Control Header: Explore Mode Indicator & Back Button */}
      <div className="absolute top-20 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        {/* Return to 3D Globe Button with Explore Mode label */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onSwitchTo3D}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#120a05]/90 border border-amber-500/50 text-amber-100 hover:text-white hover:bg-amber-950/80 font-bold text-xs shadow-xl backdrop-blur-md transition-all duration-200 cursor-pointer active:scale-95 group"
          >
            <Globe className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
            <span>3D Globe</span>
          </button>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#120a05]/85 border border-amber-500/30 text-amber-300 text-[11px] font-mono tracking-wide backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Explore Mode
          </span>
        </div>

        {/* Tile Layer Selector */}
        <div className="pointer-events-auto relative">
          <button
            type="button"
            onClick={() => setShowStyleMenu((prev) => !prev)}
            className="px-3 py-2 rounded-xl bg-[#120a05]/90 border border-amber-500/50 text-amber-300 hover:text-amber-100 backdrop-blur-md shadow-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="Switch OpenStreetMap Tile Layer"
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">OSM Tiles</span>
          </button>

          {showStyleMenu && (
            <div className="absolute right-0 mt-2 w-60 rounded-xl bg-[#120a05]/98 border border-amber-500/50 shadow-2xl p-1.5 space-y-1 backdrop-blur-xl z-30 animate-in fade-in">
              <div className="px-2.5 py-1 text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                OpenStreetMap Layers
              </div>
              {TILE_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => {
                    setSelectedStyleId(style.id);
                    setShowStyleMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                    selectedStyleId === style.id
                      ? 'bg-amber-900/80 text-amber-100 border border-amber-400/40'
                      : 'text-amber-200/80 hover:bg-amber-950/70 hover:text-amber-100'
                  }`}
                >
                  <span>{style.name}</span>
                  {selectedStyleId === style.id && <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* DROP PIN ACTIVE HUD BANNER */}
      {isDropModeActive && (
        <div className="absolute top-32 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-md z-30 p-3 rounded-xl bg-[#120a05]/95 border border-amber-400 text-amber-100 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-3 duration-300">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center shrink-0 shadow-lg ring-2 ring-amber-300 animate-pulse font-bold">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1">
                  <MousePointerClick className="w-3 h-3" />
                  Explore Mode Pin Placement
                </div>
                <p className="text-xs text-amber-100 font-bold truncate">
                  Click anywhere on OpenStreetMap to bury capsule
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleDropAtMapCenter}
                disabled={isGeocodingDrop}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-lg transition flex items-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50"
                title="Drop pin at map center"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Center</span>
              </button>

              <button
                type="button"
                onClick={handleToggleDropPinMode}
                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition cursor-pointer"
                title="Cancel drop mode"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discovery Alert Card: "Hunt Mode Alert - Capsule Near You!" */}
      {!huntingCapsule && nearestPublicCapsule && !isDropModeActive && (
        <div className="absolute top-32 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-md z-30 p-3.5 rounded-xl bg-[#120a05]/95 border border-amber-400 text-amber-100 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-3 duration-300">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 text-amber-950 flex items-center justify-center shrink-0 shadow-lg ring-2 ring-amber-300 animate-pulse">
                <Radio className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  Hunt Mode Alert
                </div>
                <h4 className="font-serif font-bold text-xs sm:text-sm text-amber-100 truncate">
                  Capsule near you at {Math.round(nearestPublicCapsule.distance)}m!
                </h4>
                <p className="text-[11px] text-amber-200/75 truncate">
                  {nearestPublicCapsule.capsule.title} • {nearestPublicCapsule.capsule.location_name}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleStartHunt(nearestPublicCapsule.capsule)}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs shadow-lg transition flex items-center gap-1 cursor-pointer shrink-0 active:scale-95"
            >
              <Target className="w-3.5 h-3.5" />
              <span>Hunt Mode</span>
            </button>
          </div>
        </div>
      )}

      {/* HUNT MODE RADAR HUD */}
      {huntingCapsule && (
        <div className="absolute top-32 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-lg z-30 p-4 rounded-2xl bg-[#120a05]/95 border border-amber-400 text-amber-100 shadow-2xl backdrop-blur-2xl animate-in slide-in-from-top-4 duration-300 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center shrink-0 font-bold shadow-lg">
                <Crosshair className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-black animate-ping" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" />
                  Hunt Mode Radar Active
                </span>
                <h3 className="font-serif font-bold text-sm text-amber-100 truncate">
                  {huntingCapsule.title}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsRadarAudioActive((prev) => !prev)}
                className="p-1.5 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-300 hover:text-white transition cursor-pointer"
                title={isRadarAudioActive ? 'Mute radar ping' : 'Enable radar ping'}
              >
                {isRadarAudioActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
              </button>

              <button
                type="button"
                onClick={handleStopHunt}
                className="p-1.5 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-400 hover:text-white transition cursor-pointer"
                title="Exit Hunt Mode"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Proximity Hot / Cold Gauge Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className={`font-bold flex items-center gap-1 ${proximityStatus.color}`}>
                {proximityStatus.level === 'sizzling' || proximityStatus.level === 'hot' ? (
                  <Flame className="w-3.5 h-3.5 animate-bounce text-orange-400" />
                ) : (
                  <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
                )}
                {proximityStatus.text}
              </span>
              <span className="font-bold text-amber-200">
                {huntingDistanceMeters !== null ? `${Math.round(huntingDistanceMeters)}m` : 'Calculating GPS...'}
              </span>
            </div>

            <div className="w-full h-2.5 rounded-full bg-stone-900 overflow-hidden border border-amber-500/40 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  proximityStatus.level === 'sizzling'
                    ? 'bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-400 animate-pulse'
                    : proximityStatus.level === 'hot'
                    ? 'bg-gradient-to-r from-amber-600 to-orange-500'
                    : proximityStatus.level === 'warm'
                    ? 'bg-gradient-to-r from-yellow-600 to-amber-500'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-500'
                }`}
                style={{ width: `${Math.max(8, Math.min(100, (1 - (huntingDistanceMeters || 200) / 200) * 100))}%` }}
              />
            </div>
          </div>

          {/* Unlock Reached Banner OR Teleport Simulator */}
          <div className="pt-1 flex flex-wrap items-center justify-between gap-2 border-t border-amber-500/30">
            {isHuntingTargetReached ? (
              <div className="w-full flex items-center justify-between bg-emerald-950/80 border border-emerald-400/80 p-2.5 rounded-xl animate-bounce">
                <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Capsule Reached! ({formatDistanceText(huntingDistanceMeters || 0)})</span>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectCapsule(huntingCapsule)}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs shadow-lg transition flex items-center gap-1 cursor-pointer"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Unlock Capsule</span>
                </button>
              </div>
            ) : (
              onSimulateLocation && (
                <div className="w-full flex items-center justify-between gap-1 text-[10.5px]">
                  <span className="text-stone-400">Evaluator Teleport:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onSimulateLocation(huntingCapsule.lat + 0.0001, huntingCapsule.lng + 0.0001)}
                      className="px-2 py-1 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 font-bold transition cursor-pointer"
                    >
                      Arrival (15m)
                    </button>
                    <button
                      type="button"
                      onClick={() => onSimulateLocation(huntingCapsule.lat + 0.0006, huntingCapsule.lng + 0.0006)}
                      className="px-2 py-1 rounded-lg bg-amber-900/80 hover:bg-amber-800 text-amber-200 font-bold transition cursor-pointer"
                    >
                      Approach (75m)
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* SLENDER "PLANT CAPSULE" BUTTON DESIGN & GPS RE-CENTER (Explore Mode) */}
      <div className="absolute bottom-6 right-4 sm:right-6 z-20 flex items-center gap-2 pointer-events-auto">
        <button
          type="button"
          onClick={handleToggleDropPinMode}
          className={`flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl backdrop-blur-md font-bold text-xs sm:text-sm shadow-xl transition-all duration-200 cursor-pointer active:scale-95 border ${
            isDropModeActive
              ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400/30 animate-pulse'
              : 'bg-[#120a05]/90 hover:bg-[#1c1008] border-amber-500/50 text-amber-100 hover:border-amber-400 hover:text-white shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
          }`}
          title="Click on OpenStreetMap to bury a memory capsule"
        >
          {isDropModeActive ? (
            <>
              <Check className="w-4 h-4 text-emerald-400 font-bold" />
              <span className="tracking-wide">Click Map to Place Pin</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 text-amber-400 stroke-[2.5]" />
              <span className="tracking-wide">Plant Capsule</span>
            </>
          )}
        </button>

        {/* Cute "My Location" Action Button */}
        {userLocation && (
          <button
            type="button"
            onClick={handleCenterOnUser}
            className="flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-[#120a05]/95 hover:bg-[#1c1008] border border-cyan-500/50 text-cyan-200 hover:text-white hover:border-cyan-400 backdrop-blur-md shadow-xl transition-all duration-200 cursor-pointer active:scale-95 group"
            title="Fly to My Live Location"
          >
            <div className="w-5 h-5 rounded-lg bg-cyan-950/90 border border-cyan-400/60 flex items-center justify-center text-cyan-300 group-hover:scale-110 transition-transform">
              <CuteExplorerMascot size={18} animate={false} />
            </div>
            <span className="text-xs font-bold font-mono hidden sm:inline">My Location</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>
        )}
      </div>

      {/* Selected Capsule Bottom-Left Street Card */}
      {activeStreetCapsule && !huntingCapsule && !isDropModeActive && (
        <div className="absolute bottom-6 left-4 right-20 sm:right-auto sm:max-w-md z-20 p-3.5 rounded-xl bg-[#120a05]/95 border border-amber-500/80 text-amber-100 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base">
                {activeStreetCapsule.public_unlock_mode === 'instant_find' ? '⚡' : '🔒'}
              </span>
              <div className="min-w-0">
                <h3 className="font-serif font-bold text-sm text-amber-200 truncate">
                  {activeStreetCapsule.title}
                </h3>
                <span className="text-[11px] text-amber-300/80 flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="truncate">{activeStreetCapsule.location_name}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleStartHunt(activeStreetCapsule)}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-lg transition flex items-center gap-1 cursor-pointer active:scale-95"
                title="Start Hunt Mode"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Hunt Mode</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectCapsule(activeStreetCapsule)}
                className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-200 font-bold text-xs shadow-lg transition flex items-center gap-1 cursor-pointer"
                title="View Capsule Details"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
