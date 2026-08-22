/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Capsule, CountryData, Coordinates } from './types';
import { SEED_CAPSULES } from './data/seedCapsules';
import { Header } from './components/Navigation/Header';
import { GlobeControlsOverlay } from './components/Navigation/GlobeControlsOverlay';
import { GlobeView } from './components/Globe/GlobeView';
import { CapsuleModal } from './components/Modals/CapsuleModal';
import { CreateCapsuleModal } from './components/Modals/CreateCapsuleModal';
import { CountryDrawer } from './components/Country/CountryDrawer';
import { OfflineViewerModal } from './components/OfflineViewer/OfflineViewerModal';
import { BackendHubModal } from './components/BackendHub/BackendHubModal';
import { HelpModal } from './components/Modals/HelpModal';
import { WelcomeGuideModal } from './components/Modals/WelcomeGuideModal';
import { AuthModal } from './components/Modals/AuthModal';
import { fetchCountryDetails, getCountryCodeFromCoordinates } from './utils/countries';
import { GeocodingResult } from './utils/mapbox';
import { ambientSound } from './utils/audio';
import { supabaseAuth, AppUser } from './utils/supabase';

const STORAGE_KEY = 'chronospheres_capsules_v8';
const LEGACY_STORAGE_KEY = 'chronospheres_dao_capsules_v7';

export default function App() {
  // 1. Capsule State (initialized from localStorage or seed capsules)
  const [capsules, setCapsules] = useState<Capsule[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Filter out old guide pin if present
        return parsed.filter((c: Capsule) => c.id !== 'cap_guide_start_here');
      }
    } catch (e) {
      console.warn('Could not read from localStorage:', e);
    }
    return SEED_CAPSULES;
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(capsules));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  }, [capsules]);

  // 2. Real Supabase Authentication State
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup' | 'config'>('signin');

  // Load existing Supabase auth session on mount
  useEffect(() => {
    supabaseAuth.getUser().then((user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        // Default guest/explorer identity until signed in
        setCurrentUser({
          id: 'usr_explorer_01',
          email: 'explorer@earth.org',
          username: '@earth_explorer',
          avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=earth_explorer&backgroundColor=0c1b2f,063327',
          role: 'user',
          is_verified: true,
          provider: 'email',
        });
      }
    });
  }, []);

  const activeUsername = currentUser?.username || '@earth_explorer';

  // 3. Fast-Forward Time Travel State for Evaluation
  const [simulatedTimeOffsetMs, setSimulatedTimeOffsetMs] = useState<number>(0);

  // 4. Search & Mapbox Coordinates
  const [searchQuery, setSearchQuery] = useState('');
  const [targetCoordinates, setTargetCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  // 5. 3D Scene Controls & Audio
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [flyInTrigger, setFlyInTrigger] = useState(1);
  const [isPlantingMode, setIsPlantingMode] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(true);

  // 6. Modals & Panels State
  const [selectedCapsule, setSelectedCapsule] = useState<Capsule | null>(null);
  const [isCapsuleModalOpen, setIsCapsuleModalOpen] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createCoords, setCreateCoords] = useState<Coordinates | null>(null);

  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  const [isCountryDrawerOpen, setIsCountryDrawerOpen] = useState(false);

  const [offlineCapsule, setOfflineCapsule] = useState<Capsule | null>(null);
  const [isOfflineViewerOpen, setIsOfflineViewerOpen] = useState(false);

  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isWelcomeGuideOpen, setIsWelcomeGuideOpen] = useState(false);
  const [isBackendHubOpen, setIsBackendHubOpen] = useState(false);

  // Filtered capsules accounting for search query
  const filteredCapsules = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return capsules.filter((cap) => {
      if (!query) return true;
      return (
        cap.title.toLowerCase().includes(query) ||
        cap.location_name.toLowerCase().includes(query) ||
        cap.country_name.toLowerCase().includes(query) ||
        cap.creator_username.toLowerCase().includes(query) ||
        cap.message.toLowerCase().includes(query) ||
        cap.tags?.some((t) => t.toLowerCase().includes(query))
      );
    });
  }, [capsules, searchQuery]);

  // Audio Toggle
  const handleToggleAudio = () => {
    const isMutedNow = ambientSound.toggle();
    setIsAudioMuted(isMutedNow);
  };

  // Fast forward time by hours
  const handleFastForwardHours = (hours: number) => {
    const additionalMs = hours * 3600 * 1000;
    setSimulatedTimeOffsetMs((prev) => prev + additionalMs);
  };

  // Reset simulated time travel
  const handleResetTimeOffset = () => {
    setSimulatedTimeOffsetMs(0);
  };

  // Mapbox Geocoding Result Clicked in Search Bar
  const handleSelectLocation = async (place: GeocodingResult) => {
    // 1. Set target coordinates for smooth 3D camera flight with zero drift
    setTargetCoordinates({ lat: place.lat, lng: place.lng });
    setSelectedCapsule(null);

    // 2. Fetch REST Countries details for side drawer
    const { countryCode } = getCountryCodeFromCoordinates(place.lat, place.lng);
    const codeToFetch = place.countryCode || countryCode;
    const countryInfo = await fetchCountryDetails(codeToFetch);
    if (countryInfo) {
      setSelectedCountry(countryInfo);
      setIsCountryDrawerOpen(true);
    }
  };

  // Handle "Drop Pin" button click in Search Bar or Bottom Right
  const handleDropPinClick = () => {
    if (targetCoordinates) {
      // Pre-fill creation modal with current searched coordinates
      setCreateCoords({
        lat: targetCoordinates.lat,
        lng: targetCoordinates.lng,
        name: searchQuery || 'Target Coordinates',
      });
      setIsCreateModalOpen(true);
      setIsPlantingMode(false);
    } else {
      // Toggle cursor planting mode on the 3D globe
      setIsPlantingMode((prev) => !prev);
    }
  };

  // Handle capsule click: Open capsule modal and fetch country details
  const handleSelectCapsule = async (capsule: Capsule) => {
    setSelectedCapsule(capsule);
    setIsPlantingMode(false);
    setIsCapsuleModalOpen(true);

    // Trigger country info drawer
    if (capsule.country_code) {
      const countryInfo = await fetchCountryDetails(capsule.country_code);
      if (countryInfo) {
        setSelectedCountry(countryInfo);
      }
    }
  };

  // Delete Capsule Pin
  const handleDeleteCapsule = (capsuleId: string) => {
    setCapsules((prev) => prev.filter((c) => c.id !== capsuleId));
    if (selectedCapsule && selectedCapsule.id === capsuleId) {
      setSelectedCapsule(null);
      setIsCapsuleModalOpen(false);
    }
  };

  // Handle Planting modal with coordinates picked from globe
  const handleOpenCreateWithCoords = (coords: Coordinates) => {
    setCreateCoords(coords);
    setIsCreateModalOpen(true);
    setIsPlantingMode(false);
  };

  // Add newly created capsule
  const handleSaveCapsule = (newCap: Capsule) => {
    setCapsules((prev) => [newCap, ...prev]);
    setSearchQuery(''); // Ensure new pin is not filtered out by an active search
    setTargetCoordinates({ lat: newCap.lat, lng: newCap.lng }); // Fly 3D camera to the newly planted pin
    setSelectedCapsule(newCap);
    setIsCapsuleModalOpen(true);
    setIsPlantingMode(false);
  };

  // Fast-Forward / Test Unlock override
  const handleUnlockTest = (capsuleId: string) => {
    setCapsules((prev) =>
      prev.map((c) =>
        c.id === capsuleId
          ? {
              ...c,
              unlock_timestamp: new Date(Date.now() - 1000).toISOString(),
              is_encrypted: false,
            }
          : c
      )
    );
    if (selectedCapsule && selectedCapsule.id === capsuleId) {
      setSelectedCapsule({
        ...selectedCapsule,
        unlock_timestamp: new Date(Date.now() - 1000).toISOString(),
        is_encrypted: false,
      });
    }
  };

  // Open Offline Viewer Inspector
  const handleOpenOfflineViewer = (capsule: Capsule) => {
    setOfflineCapsule(capsule);
    setIsOfflineViewerOpen(true);
  };

  // Country Selected from globe click
  const handleCountrySelected = (country: CountryData) => {
    setSelectedCountry(country);
    setIsCountryDrawerOpen(true);
  };

  // Plant capsule inside specific country from drawer
  const handlePlantInCountry = (country: CountryData) => {
    const lat = country.latlng?.[0] || 0;
    const lng = country.latlng?.[1] || 0;
    setCreateCoords({
      lat,
      lng,
      name: `${country.capital?.[0] || country.name.common}, ${country.name.common}`,
      country: country.name.common,
    });
    setIsCountryDrawerOpen(false);
    setIsCreateModalOpen(true);
  };

  // Open Auth Modal
  const handleOpenAuth = (mode: 'signin' | 'signup' | 'config' = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (user: AppUser) => {
    setCurrentUser(user);
  };

  const handleSignOut = () => {
    setCurrentUser(null);
  };

  // Backend Hub: Trigger Notification Scan Simulator
  const handleTriggerNotificationScan = () => {
    const effectiveNow = Date.now() + simulatedTimeOffsetMs;
    const newlyNotified: Capsule[] = [];

    setCapsules((prev) =>
      prev.map((cap) => {
        const unlockDate = new Date(cap.unlock_timestamp).getTime();
        if (unlockDate <= effectiveNow && !cap.notified) {
          const updated = { ...cap, notified: true };
          newlyNotified.push(updated);
          return updated;
        }
        return cap;
      })
    );

    return {
      notifiedCount: newlyNotified.length,
      newlyNotified,
    };
  };

  return (
    <div className="relative w-screen w-full h-screen h-dvh max-w-full overflow-hidden select-none bg-[#0a192f] text-stone-100">
      {/* 1. TOP HEADER with dynamic Total Pin Count Stack Badge & Real Supabase Auth */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectLocation={handleSelectLocation}
        onOpenCreate={() => {
          setCreateCoords(null);
          setIsCreateModalOpen(true);
        }}
        onToggleLayers={() => setShowHeatmap((prev) => !prev)}
        showHeatmap={showHeatmap}
        isAudioMuted={isAudioMuted}
        onToggleAudio={handleToggleAudio}
        onOpenHelp={() => setIsWelcomeGuideOpen(true)}
        onOpenBackendHub={() => setIsBackendHubOpen(true)}
        currentUser={currentUser}
        onOpenAuthModal={handleOpenAuth}
        onSignOut={handleSignOut}
        capsulesCount={filteredCapsules.length}
        totalCapsulesCount={capsules.length}
        onDropPinClick={handleDropPinClick}
        isPlantingMode={isPlantingMode}
      />

      {/* 2. 3D EARTH GLOBE CANVAS VIEW with Cloud Layers, Smooth Physics & Zero-Drift Coordinate Math */}
      <GlobeView
        capsules={filteredCapsules}
        selectedCapsule={selectedCapsule}
        targetCoordinates={targetCoordinates}
        onSelectCapsule={handleSelectCapsule}
        showHeatmap={showHeatmap}
        flyInTrigger={flyInTrigger}
        onFlyInComplete={() => {
          try {
            if (localStorage.getItem('chronospheres_welcome_dismissed') !== 'true') {
              setIsWelcomeGuideOpen(true);
            }
          } catch (e) {
            setIsWelcomeGuideOpen(true);
          }
        }}
        onOpenCreateWithCoords={handleOpenCreateWithCoords}
        onCountrySelected={handleCountrySelected}
        isPlantingMode={isPlantingMode}
        onTogglePlantingMode={() => setIsPlantingMode((prev) => !prev)}
        isJudgeOverride={false}
        activeUsername={activeUsername}
      />

      {/* 3. BOTTOM CONTROLS: Realtime Clock + Fast-Forward [+1h, +1d, +1w, +1y] + Pin Counter */}
      <GlobeControlsOverlay
        onFastForward={handleFastForwardHours}
        onResetTime={handleResetTimeOffset}
        simulatedTimeOffsetMs={simulatedTimeOffsetMs}
        isPlantingMode={isPlantingMode}
        onTogglePlantingMode={() => setIsPlantingMode((prev) => !prev)}
        capsules={capsules}
        onSelectCapsule={handleSelectCapsule}
      />

      {/* 4. REST Countries Live Data Side Drawer */}
      <CountryDrawer
        country={selectedCountry}
        capsules={capsules}
        isOpen={isCountryDrawerOpen}
        onClose={() => setIsCountryDrawerOpen(false)}
        onSelectCapsule={handleSelectCapsule}
        onPlantInCountry={handlePlantInCountry}
      />

      {/* 5. Capsule Modal (Media, Arweave Transaction, Spotify, Delete Pin) */}
      <CapsuleModal
        capsule={selectedCapsule}
        isOpen={isCapsuleModalOpen}
        onClose={() => {
          setIsCapsuleModalOpen(false);
          setSelectedCapsule(null);
        }}
        activeUsername={activeUsername}
        onUnlockTest={handleUnlockTest}
        onOpenOfflineViewer={handleOpenOfflineViewer}
        onDeleteCapsule={handleDeleteCapsule}
        onOpenTutorial={() => setIsWelcomeGuideOpen(true)}
        isJudgeOverride={false}
        simulatedTimeOffsetMs={simulatedTimeOffsetMs}
      />

      {/* 6. Create Capsule Modal (Planted by Authenticated User) */}
      <CreateCapsuleModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreateCoords(null);
        }}
        onSaveCapsule={handleSaveCapsule}
        initialCoords={createCoords}
        activeUsername={activeUsername}
        currentUser={currentUser}
      />

      {/* 7. Offline Standalone HTML & Arweave Payload Inspector */}
      <OfflineViewerModal
        capsule={offlineCapsule}
        isOpen={isOfflineViewerOpen}
        onClose={() => {
          setIsOfflineViewerOpen(false);
          setOfflineCapsule(null);
        }}
      />

      {/* 8. Light Brown Parchment Welcome & Site Guide Modal (shown after landing sequence) */}
      <WelcomeGuideModal
        isOpen={isWelcomeGuideOpen}
        onClose={() => setIsWelcomeGuideOpen(false)}
        onOpenPlantModal={() => {
          setCreateCoords(null);
          setIsCreateModalOpen(true);
        }}
        onOpenBackendHub={() => setIsBackendHubOpen(true)}
      />

      {/* 9. Help / Protocol Guide Modal */}
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      {/* 10. Real Supabase Authentication Modal (Email/Password & Google OAuth) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onAuthSuccess={handleAuthSuccess}
        onSignOut={handleSignOut}
        initialMode={authModalMode}
      />

      {/* 11. Backend Hub (Supabase SQL RLS + Deno Edge Function + Resend Simulator) */}
      <BackendHubModal
        isOpen={isBackendHubOpen}
        onClose={() => setIsBackendHubOpen(false)}
        capsules={capsules}
        onTriggerNotificationScan={handleTriggerNotificationScan}
      />
    </div>
  );
}
