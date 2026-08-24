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
import { MyVaultDrawer } from './components/Vault/MyVaultDrawer';
import { BurialAnimationOverlay } from './components/Burial/BurialAnimationOverlay';
import { ExcavationAnimationOverlay } from './components/Burial/ExcavationAnimationOverlay';
import { OfflineViewerModal } from './components/OfflineViewer/OfflineViewerModal';
import { BackendHubModal } from './components/BackendHub/BackendHubModal';
import { HelpModal } from './components/Modals/HelpModal';
import { WelcomeGuideModal } from './components/Modals/WelcomeGuideModal';
import { AuthModal } from './components/Modals/AuthModal';
import { ResetPasswordModal } from './components/Modals/ResetPasswordModal';
import { GuestRecommendationModal } from './components/Modals/GuestRecommendationModal';
import { fetchCountryDetails, getCountryCodeFromCoordinates } from './utils/countries';
import { GeocodingResult } from './utils/mapbox';
import { ambientSound } from './utils/audio';
import { supabaseAuth, capsulesDb, AppUser, createGuestUser } from './utils/supabase';
import { AlertTriangle, X } from 'lucide-react';

const STORAGE_KEY = 'chronospheres_capsules_v8';
const LEGACY_STORAGE_KEY = 'chronospheres_dao_capsules_v7';

export default function App() {
  // 1. Capsule State (Loads all public worldwide capsules and user's pins)
  const [capsules, setCapsules] = useState<Capsule[]>([]);

  // 2. Real Supabase Authentication State & Session Persistence
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup' | 'forgot_password'>('signin');
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);

  // Helper to load all public capsules worldwide and user's personal pins
  const loadUserCapsules = async () => {
    const remoteCapsules = await capsulesDb.fetchCapsules();
    if (remoteCapsules && remoteCapsules.length > 0) {
      setCapsules(remoteCapsules);
    } else {
      setCapsules(SEED_CAPSULES);
    }
  };

  // On App Initialization: Restore session if present, otherwise load public world pins
  useEffect(() => {
    const initSession = async () => {
      try {
        const u = await supabaseAuth.getUser();
        if (u) {
          setCurrentUser(u);
        }
      } catch (e) {
        console.warn('Init session check:', e);
      }
      // Always load public capsules so world map is interactive immediately
      loadUserCapsules();
    };

    initSession();

    // Check if the current URL points to /reset-password or has Supabase recovery tokens
    const isResetUrl =
      window.location.pathname.includes('/reset-password') ||
      window.location.hash.includes('type=recovery') ||
      window.location.hash.includes('access_token=');

    if (isResetUrl) {
      setIsResetPasswordModalOpen(true);
    }

    const subscription = supabaseAuth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsResetPasswordModalOpen(true);
      }
      if (session?.user) {
        supabaseAuth.getUser().then((u) => {
          if (u) {
            setCurrentUser(u);
            loadUserCapsules();
          }
        });
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        loadUserCapsules();
      }
    });

    return () => {
      subscription?.unsubscribe?.();
    };
  }, []);

  const activeUsername = currentUser?.username || (currentUser?.isGuest ? 'Guest Explorer' : 'Explorer');

  // Personal Vault Isolation: For new accounts, vault starts completely empty (0 items)
  const vaultCapsules = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.isGuest) {
      return capsules.filter(
        (c) =>
          c.creator_username.toLowerCase() === 'guest' ||
          c.creator_username.toLowerCase() === 'guest explorer' ||
          c.id.startsWith('guest_')
      );
    }
    const uname = (currentUser.username || '').toLowerCase();
    const cleanUname = uname.startsWith('@') ? uname.substring(1) : uname;
    const uid = currentUser.id;

    return capsules.filter((c) => {
      if (c.user_id && c.user_id === uid) return true;
      const cCreator = (c.creator_username || '').toLowerCase().replace('@', '');
      if (cCreator === cleanUname) return true;
      const cRecip = (c.recipient_username || '').toLowerCase().replace('@', '');
      if (cRecip && cRecip === cleanUname) return true;
      if (c.tagged_users && c.tagged_users.some((t) => t.toLowerCase().replace('@', '') === cleanUname)) {
        return true;
      }
      return false;
    });
  }, [capsules, currentUser]);

  // 3. Fast-Forward Time Travel State for Evaluation
  const [simulatedTimeOffsetMs, setSimulatedTimeOffsetMs] = useState<number>(0);

  // 4. Search & Mapbox Coordinates
  const [searchQuery, setSearchQuery] = useState('');
  const [targetCoordinates, setTargetCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  // 5. 3D Scene Controls & Audio
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [flyInTrigger, setFlyInTrigger] = useState(1);
  const [isPlantingMode, setIsPlantingMode] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  // Sync isAudioMuted with ambientSound engine
  useEffect(() => {
    const unsubscribe = ambientSound.subscribe((_, isPlaying) => {
      setIsAudioMuted(!isPlaying);
    });
    return unsubscribe;
  }, []);

  // 6. Modals & Panels State
  const [selectedCapsule, setSelectedCapsule] = useState<Capsule | null>(null);
  const [isCapsuleModalOpen, setIsCapsuleModalOpen] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createCoords, setCreateCoords] = useState<Coordinates | null>(null);
  const [draftToEdit, setDraftToEdit] = useState<Capsule | null>(null);

  // My Vault Drawer State
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [vaultInitialTab, setVaultInitialTab] = useState<'locked' | 'unlocked' | 'drafts'>('locked');

  // 2-Second Burial Animation State
  const [buryingCapsule, setBuryingCapsule] = useState<Capsule | null>(null);

  // 2-Second Excavation & Unsealing Animation State
  const [excavatingCapsule, setExcavatingCapsule] = useState<Capsule | null>(null);

  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  const [isCountryDrawerOpen, setIsCountryDrawerOpen] = useState(false);

  const [offlineCapsule, setOfflineCapsule] = useState<Capsule | null>(null);
  const [isOfflineViewerOpen, setIsOfflineViewerOpen] = useState(false);

  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isWelcomeGuideOpen, setIsWelcomeGuideOpen] = useState(false);
  const [isBackendHubOpen, setIsBackendHubOpen] = useState(false);

  // Floating Guest Warning Banner State with 7-second auto-dismiss
  const [showGuestBanner, setShowGuestBanner] = useState(false);

  useEffect(() => {
    if (currentUser?.isGuest) {
      setShowGuestBanner(true);
      const timer = setTimeout(() => {
        setShowGuestBanner(false);
      }, 7000);
      return () => clearTimeout(timer);
    } else {
      setShowGuestBanner(false);
    }
  }, [currentUser?.isGuest, currentUser?.id]);

  // Mandatory Guest Recommendation Modal (triggers on guest's 1st pin placement)
  const [isGuestRecommendationOpen, setIsGuestRecommendationOpen] = useState(false);
  const [guestFirstPlantedCapsule, setGuestFirstPlantedCapsule] = useState<Capsule | null>(null);
  const [hasCompletedGuestFeedback, setHasCompletedGuestFeedback] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem('treasurefest_guest_recommendation_completed'));
    } catch {
      return false;
    }
  });

  // Filtered capsules accounting for search query and excluding in-progress drafts from globe view
  const filteredCapsules = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return capsules.filter((cap) => {
      if (cap.is_draft) return false;
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
    setTargetCoordinates({ lat: place.lat, lng: place.lng });
    setSelectedCapsule(null);

    const { countryCode } = getCountryCodeFromCoordinates(place.lat, place.lng);
    const codeToFetch = place.countryCode || countryCode;
    const countryInfo = await fetchCountryDetails(codeToFetch);
    if (countryInfo) {
      setSelectedCountry(countryInfo);
      setIsCountryDrawerOpen(true);
    }
  };

  // Handle "Drop Pin" button click
  const handleDropPinClick = () => {
    if (targetCoordinates) {
      setCreateCoords({
        lat: targetCoordinates.lat,
        lng: targetCoordinates.lng,
        name: searchQuery || 'Target Coordinates',
      });
      setIsCreateModalOpen(true);
      setIsPlantingMode(false);
    } else {
      setIsPlantingMode((prev) => !prev);
    }
  };

  // Handle capsule click: if unlocked, trigger 2-second excavation animation; otherwise open modal directly
  const handleSelectCapsule = async (capsule: Capsule, forceExcavate = false) => {
    setIsPlantingMode(false);

    // 1. Smoothly fly camera direct to capsule coordinates
    setTargetCoordinates({ lat: capsule.lat, lng: capsule.lng });

    // 2. Fetch REST Countries details
    if (capsule.country_code) {
      fetchCountryDetails(capsule.country_code).then((info) => {
        if (info) setSelectedCountry(info);
      });
    }

    const effectiveTime = Date.now() + simulatedTimeOffsetMs;
    const isUnlocked =
      new Date(capsule.unlock_timestamp).getTime() <= effectiveTime || capsule.is_encrypted === false;

    if (isUnlocked || forceExcavate) {
      // Close any open drawers/modals first
      setIsCapsuleModalOpen(false);
      setIsVaultOpen(false);
      // Play 2-second excavation unearthing sequence
      setExcavatingCapsule(capsule);
    } else {
      setSelectedCapsule(capsule);
      setIsCapsuleModalOpen(true);
    }
  };

  // Complete excavation sequence & reveal unlocked capsule modal
  const handleExcavationComplete = () => {
    if (excavatingCapsule) {
      setSelectedCapsule(excavatingCapsule);
      setIsCapsuleModalOpen(true);
      setExcavatingCapsule(null);
    }
  };

  // Delete Capsule Pin from local state and Supabase
  const handleDeleteCapsule = async (capsuleId: string) => {
    setCapsules((prev) => prev.filter((c) => c.id !== capsuleId));
    if (selectedCapsule && selectedCapsule.id === capsuleId) {
      setSelectedCapsule(null);
      setIsCapsuleModalOpen(false);
    }
    await capsulesDb.deleteCapsule(capsuleId);
  };

  // Handle Planting modal with coordinates picked from globe
  const handleOpenCreateWithCoords = (coords: Coordinates) => {
    setDraftToEdit(null);
    setCreateCoords(coords);
    setIsCreateModalOpen(true);
    setIsPlantingMode(false);
  };

  // Save capsule as an in-progress draft (bypasses burial, stores in My Vault -> Drafts)
  const handleSaveDraft = async (draftCap: Capsule) => {
    setCapsules((prev) => [draftCap, ...prev.filter((c) => c.id !== draftCap.id)]);
    setIsCreateModalOpen(false);
    setDraftToEdit(null);
    setCreateCoords(null);
    setVaultInitialTab('drafts');
    setIsVaultOpen(true);

    // Persist draft in Supabase database
    await capsulesDb.saveCapsule(draftCap, currentUser?.id);
  };

  // Resume editing a saved draft from My Vault
  const handleResumeDraft = (draft: Capsule) => {
    setIsVaultOpen(false);
    setDraftToEdit(draft);
    setCreateCoords({
      lat: draft.lat,
      lng: draft.lng,
      name: draft.location_name,
      country: draft.country_name,
    });
    setIsCreateModalOpen(true);
  };

  // Add newly created capsule & initiate Burial Animation Sequence + Supabase Sync
  const handleSaveCapsule = async (newCap: Capsule) => {
    setIsVaultOpen(false);
    setIsCountryDrawerOpen(false);
    setIsCapsuleModalOpen(false);
    setDraftToEdit(null);

    // Remove any previous draft version
    setCapsules((prev) => prev.filter((c) => c.id !== newCap.id));

    // Smoothly fly 3D camera direct to capsule coordinates
    setSearchQuery('');
    setTargetCoordinates({ lat: newCap.lat, lng: newCap.lng });
    setIsPlantingMode(false);

    // Persist to Supabase database
    await capsulesDb.saveCapsule(newCap, currentUser?.id);

    // Trigger 2-second Burial animation overlay
    setBuryingCapsule(newCap);
  };

  // Complete burial sequence & settle camera on placed pin
  const handleBurialAnimationComplete = () => {
    if (buryingCapsule) {
      const isGuest = Boolean(
        currentUser?.isGuest ||
        currentUser?.role === 'guest' ||
        buryingCapsule.creator_username.toLowerCase().includes('guest') ||
        buryingCapsule.id.startsWith('guest_')
      );

      setCapsules((prev) => [buryingCapsule, ...prev]);

      // If guest and hasn't yet submitted mandatory recommendation review
      if (isGuest && !hasCompletedGuestFeedback) {
        setGuestFirstPlantedCapsule(buryingCapsule);
        setIsGuestRecommendationOpen(true);
      } else {
        setSelectedCapsule(buryingCapsule);
        setIsCapsuleModalOpen(true);
      }
      setBuryingCapsule(null);
    }
  };

  const handleCloseGuestRecommendation = () => {
    setIsGuestRecommendationOpen(false);
    setHasCompletedGuestFeedback(true);
    if (guestFirstPlantedCapsule) {
      setSelectedCapsule(guestFirstPlantedCapsule);
      setIsCapsuleModalOpen(true);
    }
  };

  // Handle "View on Globe" from My Vault Drawer
  const handleViewVaultCapsuleOnGlobe = (capsule: Capsule) => {
    setIsVaultOpen(false);
    setSearchQuery('');
    setTargetCoordinates({ lat: capsule.lat, lng: capsule.lng });
    setSelectedCapsule(capsule);
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
  const handleOpenAuth = (mode: 'signin' | 'signup' | 'forgot_password' = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = async (user: AppUser) => {
    setCurrentUser(user);
    await loadUserCapsules();
  };

  const handleContinueAsGuest = () => {
    const guestUser = createGuestUser();
    setCurrentUser(guestUser);
    setIsAuthModalOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await supabaseAuth.signOut();
    } catch (e) {
      console.warn('handleSignOut error:', e);
    }
    setCurrentUser(null);
    loadUserCapsules();
    setIsVaultOpen(false);
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
          capsulesDb.updateCapsuleNotified(cap.id);
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
      {/* 1. TOP HEADER with Total Pin Count Stack Badge & Real Supabase Auth */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectLocation={handleSelectLocation}
        onOpenCreate={() => {
          setCreateCoords(null);
          setIsCreateModalOpen(true);
        }}
        onOpenVault={() => setIsVaultOpen(true)}
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

      {/* Guest Mode Active Floating Notice - Automatically disappears after 7 seconds */}
      {currentUser?.isGuest && showGuestBanner && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-950/95 border border-amber-500/80 text-amber-200 text-xs shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 max-w-[95vw] whitespace-normal">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="leading-tight text-[11px] sm:text-xs">
            <strong>Guest Mode:</strong> None of your data, pins, vaults, or shares will be saved.
          </span>
          <button
            type="button"
            onClick={() => handleOpenAuth('signup')}
            className="ml-1 px-2.5 py-0.5 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-[10px] sm:text-[11px] transition shadow-xs cursor-pointer shrink-0"
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => setShowGuestBanner(false)}
            className="ml-0.5 p-1 rounded-full text-amber-400/70 hover:text-amber-200 transition cursor-pointer"
            title="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. 3D EARTH GLOBE CANVAS VIEW */}
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

      {/* 3. BOTTOM CONTROLS: Realtime Clock + Fast-Forward [+1h, +1d, +1w, +1y] */}
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

      {/* 5. 'My Vault' / Capsule Inventory Slide-out Drawer */}
      <MyVaultDrawer
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        capsules={vaultCapsules}
        simulatedTimeOffsetMs={simulatedTimeOffsetMs}
        initialTab={vaultInitialTab}
        onSelectCapsuleOnGlobe={handleViewVaultCapsuleOnGlobe}
        onOpenCapsuleModal={(cap) => handleSelectCapsule(cap, true)}
        onResumeDraft={handleResumeDraft}
        onDeleteCapsule={handleDeleteCapsule}
        currentUser={currentUser}
        onOpenAuthModal={() => handleOpenAuth('signin')}
      />

      {/* 6. 2-Second Dirt Burial Particle & Lock Animation Overlay */}
      {buryingCapsule && (
        <BurialAnimationOverlay
          locationName={buryingCapsule.location_name}
          countryName={buryingCapsule.country_name}
          onAnimationComplete={handleBurialAnimationComplete}
        />
      )}

      {/* 7. 2-Second Soil Excavation, Shovel Particles & Unsealing Animation Overlay */}
      {excavatingCapsule && (
        <ExcavationAnimationOverlay
          locationName={excavatingCapsule.location_name}
          countryName={excavatingCapsule.country_name}
          capsuleTitle={excavatingCapsule.title}
          onAnimationComplete={handleExcavationComplete}
        />
      )}

      {/* 8. Capsule Modal (Media, Arweave Transaction, Spotify, Delete Pin) */}
      <CapsuleModal
        capsule={selectedCapsule}
        isOpen={isCapsuleModalOpen && !buryingCapsule && !excavatingCapsule}
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

      {/* 9. Create Capsule Modal */}
      <CreateCapsuleModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreateCoords(null);
          setDraftToEdit(null);
        }}
        onSaveCapsule={handleSaveCapsule}
        onSaveDraft={handleSaveDraft}
        draftToEdit={draftToEdit}
        initialCoords={createCoords}
        activeUsername={activeUsername}
        currentUser={currentUser}
      />

      {/* 10. Offline Standalone HTML & Arweave Payload Inspector */}
      <OfflineViewerModal
        capsule={offlineCapsule}
        isOpen={isOfflineViewerOpen}
        onClose={() => {
          setIsOfflineViewerOpen(false);
          setOfflineCapsule(null);
        }}
      />

      {/* 11. Welcome & Site Guide Modal */}
      <WelcomeGuideModal
        isOpen={isWelcomeGuideOpen}
        onClose={() => setIsWelcomeGuideOpen(false)}
        onOpenPlantModal={() => {
          setCreateCoords(null);
          setIsCreateModalOpen(true);
        }}
        onOpenBackendHub={() => setIsBackendHubOpen(true)}
      />

      {/* 12. Help / Protocol Guide Modal */}
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      {/* 13. Real Supabase Authentication Modal (Email/Password & Forgot Password) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onAuthSuccess={handleAuthSuccess}
        onSignOut={handleSignOut}
        onContinueAsGuest={handleContinueAsGuest}
        initialMode={authModalMode}
      />

      {/* 14. Reset Password View/Modal (Redirect from Supabase password recovery email) */}
      <ResetPasswordModal
        isOpen={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        onSuccess={() => {
          handleOpenAuth('signin');
        }}
      />

      {/* 15. Backend Hub (Supabase SQL RLS + Deno Edge Function + Resend Simulator) */}
      <BackendHubModal
        isOpen={isBackendHubOpen}
        onClose={() => setIsBackendHubOpen(false)}
        capsules={capsules}
        onTriggerNotificationScan={handleTriggerNotificationScan}
      />

      {/* 16. Mandatory Guest Recommendation & Review Modal (Post 1st-Pin Burial) */}
      <GuestRecommendationModal
        isOpen={isGuestRecommendationOpen}
        onClose={handleCloseGuestRecommendation}
        capsuleJustPlanted={guestFirstPlantedCapsule}
        onOpenSignUp={() => handleOpenAuth('signup')}
      />
    </div>
  );
}


