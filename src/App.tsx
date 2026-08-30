/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { AllCapsulesModal } from './components/Modals/AllCapsulesModal';
import { AuthModal } from './components/Modals/AuthModal';
import { ResetPasswordModal } from './components/Modals/ResetPasswordModal';
import { GuestRecommendationModal } from './components/Modals/GuestRecommendationModal';
import { StreetMapView } from './components/Map/StreetMapView';
import { ProximityToast } from './components/Map/ProximityToast';
import { CloudTransitionOverlay } from './components/Globe/CloudTransitionOverlay';
import { useUserLocation, ProximityAlertEvent } from './utils/useUserLocation';
import { fetchCountryDetails, getCountryCodeFromCoordinates } from './utils/countries';
import { GeocodingResult } from './utils/mapbox';
import { ambientSound } from './utils/audio';
import { supabaseAuth, capsulesDb, AppUser, createGuestUser, logGuestVisit } from './utils/supabase';
import { AlertTriangle, X } from 'lucide-react';
import { SEED_EVENT_CAPSULES } from './data/seedEvents';
import { ScavengerEvent, EventBroadcastHint } from './types';
import { eventsStorage } from './utils/eventsStorage';
import {
  SupportedLanguage,
  getStoredLanguage,
  setStoredLanguage,
  hasSelectedInitialLanguage,
} from './utils/i18n';
import { LanguageSelectModal } from './components/Modals/LanguageSelectModal';
import { ActiveEventBanner } from './components/Events/ActiveEventBanner';
import { EventHintNotification } from './components/Events/EventHintNotification';
import { EventsDashboardModal } from './components/Events/EventsDashboardModal';
import { EventLeaderboardModal } from './components/Events/EventLeaderboardModal';
import { EventMissionControlModal } from './components/Events/EventMissionControlModal';
import { EventCluesModal } from './components/Events/EventCluesModal';

const STORAGE_KEY = 'chronospheres_capsules_v8';
const LEGACY_STORAGE_KEY = 'chronospheres_dao_capsules_v7';

export default function App() {
  // 1. Capsule State (Loads all public worldwide capsules and user's pins)
  const [capsules, setCapsules] = useState<Capsule[]>([]);

  // 2. Real Supabase Authentication State & Session Persistence (Defaults to Guest Mode)
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => createGuestUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup' | 'forgot_password'>('signin');
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);

  // 2b. Language Localization State (Language selection comes first before tutorial!)
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(() => {
    return getStoredLanguage() || 'en';
  });
  const [isInitialLanguageSetup, setIsInitialLanguageSetup] = useState<boolean>(() => {
    return !hasSelectedInitialLanguage();
  });
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState<boolean>(() => {
    return !hasSelectedInitialLanguage();
  });

  // 2c. Scavenger Hunt Events State
  const [events, setEvents] = useState<ScavengerEvent[]>(() => eventsStorage.getEvents());
  const [activeEventId, setActiveEventId] = useState<string | null>(() => eventsStorage.getActiveEventId());
  const [isEventsDashboardOpen, setIsEventsDashboardOpen] = useState<boolean>(false);
  const [activeLeaderboardEvent, setActiveLeaderboardEvent] = useState<ScavengerEvent | null>(null);
  const [activeMissionControlEvent, setActiveMissionControlEvent] = useState<ScavengerEvent | null>(null);
  const [activeCluesEvent, setActiveCluesEvent] = useState<ScavengerEvent | null>(null);
  const [broadcastHintToast, setBroadcastHintToast] = useState<EventBroadcastHint | null>(null);

  // Helper to load all public capsules worldwide and user's personal pins (merges SEED_EVENT_CAPSULES)
  const loadUserCapsules = async () => {
    const remoteCapsules = await capsulesDb.fetchCapsules();
    if (remoteCapsules && remoteCapsules.length > 0) {
      const existingIds = new Set(remoteCapsules.map((c) => c.id));
      const missingEventCapsules = SEED_EVENT_CAPSULES.filter((c) => !existingIds.has(c.id));
      setCapsules([...remoteCapsules, ...missingEventCapsules]);
    } else {
      setCapsules([...SEED_CAPSULES, ...SEED_EVENT_CAPSULES]);
    }
  };

  // Listen for real-time dispatched clues from Event Mission Control
  useEffect(() => {
    const handleHintBroadcast = (e: any) => {
      if (e.detail) {
        setBroadcastHintToast(e.detail);
      }
    };
    window.addEventListener('chronospheres_hint_broadcast', handleHintBroadcast);
    return () => window.removeEventListener('chronospheres_hint_broadcast', handleHintBroadcast);
  }, []);

  // On App Initialization: Check for existing verified session, otherwise ensure Guest Explorer mode
  useEffect(() => {
    const initSession = async () => {
      try {
        const u = await supabaseAuth.getUser();
        if (u && !u.isGuest && u.is_verified) {
          setCurrentUser(u);
        } else {
          setCurrentUser(createGuestUser());
          logGuestVisit('app_init_guest');
        }
      } catch (e) {
        console.warn('Init session check:', e);
        setCurrentUser(createGuestUser());
        logGuestVisit('app_init_guest_fallback');
      }
      // Always load public capsules so world map is interactive immediately
      loadUserCapsules();
    };

    initSession();

    // App Launch Audio: Play high-altitude gliding whoosh as globe materializes
    ambientSound.playLaunchAirGlidingSound(3.8);

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

  // 5. Map View Mode (3D Globe vs 2D Snap Map Street View) & Controls
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [flyInTrigger, setFlyInTrigger] = useState(1);
  const [isPlantingMode, setIsPlantingMode] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  // Atmospheric Cloud Pass-Through Zoom Transition State
  const [isCloudDiving, setIsCloudDiving] = useState(false);
  const [cloudDiveLabel, setCloudDiveLabel] = useState<string>('');

  const handleTriggerCloudDive = useCallback(
    (coords?: { lat: number; lng: number }, label?: string) => {
      if (coords) {
        setTargetCoordinates(coords);
      }
      if (label) {
        setCloudDiveLabel(label);
      } else if (coords) {
        setCloudDiveLabel(`${coords.lat.toFixed(2)}°, ${coords.lng.toFixed(2)}°`);
      } else {
        setCloudDiveLabel('Street-Level Vector Grid');
      }

      setIsCloudDiving(true);

      // Switch underlying view layer to 2D after cloud dive accelerates
      setTimeout(() => {
        setViewMode('2d');
      }, 700);
    },
    []
  );

  // Proximity Alert Toast State
  const [activeProximityAlert, setActiveProximityAlert] = useState<ProximityAlertEvent | null>(null);

  const handleProximityAlert = useCallback((event: ProximityAlertEvent) => {
    setActiveProximityAlert(event);
  }, []);

  // Real-time User GPS location & Proximity Engine
  const { userLocation, simulateLocation, getDistanceToCapsule } = useUserLocation(
    capsules,
    handleProximityAlert
  );

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

  // All Capsules Global Archive & Heatmap Modal State
  const [isAllCapsulesModalOpen, setIsAllCapsulesModalOpen] = useState(false);

  // 2-Second Burial Animation State
  const [buryingCapsule, setBuryingCapsule] = useState<Capsule | null>(null);

  // 2-Second Excavation & Unsealing Animation State
  const [excavatingCapsule, setExcavatingCapsule] = useState<Capsule | null>(null);

  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  const [isCountryDrawerOpen, setIsCountryDrawerOpen] = useState(false);

  const [offlineCapsule, setOfflineCapsule] = useState<Capsule | null>(null);
  const [isOfflineViewerOpen, setIsOfflineViewerOpen] = useState(false);

  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isWelcomeGuideOpen, setIsWelcomeGuideOpen] = useState<boolean>(() => {
    // If language was already chosen previously, show guide unless user dismissed it
    if (hasSelectedInitialLanguage()) {
      try {
        return localStorage.getItem('chronospheres_welcome_dismissed') !== 'true';
      } catch {
        return false;
      }
    }
    // Choosing the language MUST come first! So tutorial remains closed until language is picked.
    return false;
  });
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

  // Derived active hunt event
  const activeEvent = useMemo(() => {
    if (!activeEventId) return null;
    return events.find((e) => e.id === activeEventId) || null;
  }, [events, activeEventId]);

  // Filtered capsules accounting for search query, active event window, and excluding in-progress drafts
  const filteredCapsules = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const effectiveNow = Date.now() + simulatedTimeOffsetMs;

    return capsules.filter((cap) => {
      if (cap.is_draft) return false;

      // Event Capsule Visibility Logic:
      // Reveal event capsules on the map only while the event start and end timestamps are active
      // or if the user has explicitly joined the hunt
      if (cap.event_id) {
        const ev = events.find((e) => e.id === cap.event_id);
        if (ev) {
          const startTime = new Date(ev.start_timestamp).getTime();
          const endTime = new Date(ev.end_timestamp).getTime();
          const isEventActive = effectiveNow >= startTime && effectiveNow <= endTime;
          const isUserInHunt = activeEventId === ev.id;
          if (!isEventActive && !isUserInHunt) {
            return false;
          }
        }
      }

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
  }, [capsules, searchQuery, events, activeEventId, simulatedTimeOffsetMs]);

  // Handle Language Selection (Enforces Language Selection -> Tutorial sequence)
  const handleSelectLanguage = (lang: SupportedLanguage, isInitial = false) => {
    setCurrentLanguage(lang);
    setStoredLanguage(lang);
    setIsLanguageModalOpen(false);

    // If this was initial setup on app startup, immediately open the tutorial in the selected language!
    if (isInitial || isInitialLanguageSetup) {
      setIsInitialLanguageSetup(false);
      setIsWelcomeGuideOpen(true);
    }
  };

  // Handle Starting / Joining a Scavenger Hunt Event
  const handleStartHunt = (event: ScavengerEvent) => {
    eventsStorage.setActiveEventId(event.id);
    setActiveEventId(event.id);
    setIsEventsDashboardOpen(false);

    // Smoothly fly camera to first capsule of this event if available
    const firstEventCap = capsules.find((c) => event.capsule_ids.includes(c.id));
    if (firstEventCap) {
      setTargetCoordinates({ lat: firstEventCap.lat, lng: firstEventCap.lng });
    }
  };

  // Handle Leaving a Scavenger Hunt Event
  const handleLeaveHunt = () => {
    eventsStorage.setActiveEventId(null);
    setActiveEventId(null);
  };

  // Handle Event Creation from Host UI
  const handleCreateEvent = (newEventData: any) => {
    const created = eventsStorage.createEvent(newEventData);
    setEvents(eventsStorage.getEvents());
    handleStartHunt(created);
  };

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
  const handleDropPinClick = useCallback(() => {
    if (targetCoordinates) {
      setCreateCoords({
        lat: targetCoordinates.lat,
        lng: targetCoordinates.lng,
        name: searchQuery || 'Target Coordinates',
      });
      setIsCreateModalOpen(true);
      setIsPlantingMode(false);
      setTargetCoordinates(null);
    } else {
      setIsPlantingMode((prev) => !prev);
    }
  }, [targetCoordinates, searchQuery]);

  // Handle focus on user's live GPS location
  const handleFocusUserLocation = useCallback(() => {
    if (!userLocation) return;
    ambientSound.playCloudDiveWhooshSound(1.2);
    setTargetCoordinates({ lat: userLocation.lat, lng: userLocation.lng });
    setFlyInTrigger((prev) => prev + 1);
  }, [userLocation]);

  // Handle capsule click: if unlocked, trigger 2-second excavation animation; otherwise open modal directly
  const handleSelectCapsule = useCallback(
    async (capsule: Capsule, forceExcavate = false) => {
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
    },
    [simulatedTimeOffsetMs]
  );

  // Complete excavation sequence & reveal unlocked capsule modal
  const handleExcavationComplete = useCallback(() => {
    if (excavatingCapsule) {
      setSelectedCapsule(excavatingCapsule);
      setIsCapsuleModalOpen(true);

      // If this capsule is part of the active event, record discovery on the live leaderboard
      if (activeEventId && excavatingCapsule.event_id === activeEventId) {
        eventsStorage.recordDiscovery(
          activeEventId,
          excavatingCapsule.id,
          activeUsername
        );
        setEvents(eventsStorage.getEvents());
      }

      // Mark capsule as found in Supabase public.capsules (triggers Realtime updates to Event Owner Dashboard)
      capsulesDb.markCapsuleFound(excavatingCapsule.id, excavatingCapsule.event_id);
      setCapsules((prev) =>
        prev.map((c) => (c.id === excavatingCapsule.id ? { ...c, is_found: true } : c))
      );

      setExcavatingCapsule(null);
    }
  }, [excavatingCapsule, activeEventId, currentUser?.id, activeUsername]);

  // Delete Capsule Pin from local state and Supabase
  const handleDeleteCapsule = useCallback(async (capsuleId: string) => {
    setCapsules((prev) => prev.filter((c) => c.id !== capsuleId));
    setSelectedCapsule((prev) => (prev?.id === capsuleId ? null : prev));
    setIsCapsuleModalOpen(false);
    await capsulesDb.deleteCapsule(capsuleId);
  }, []);

  // Handle Planting modal with coordinates picked from globe
  const handleOpenCreateWithCoords = useCallback((coords: Coordinates) => {
    setDraftToEdit(null);
    setSelectedCapsule(null);
    setTargetCoordinates(null);
    setCreateCoords(coords);
    setIsCreateModalOpen(true);
    setIsPlantingMode(false);
  }, []);

  // Save capsule as an in-progress draft (bypasses burial, stores in My Vault -> Drafts)
  const handleSaveDraft = useCallback(
    async (draftCap: Capsule) => {
      // Dynamic marker array update
      setCapsules((prev) => [draftCap, ...prev.filter((c) => c.id !== draftCap.id)]);
      setIsCreateModalOpen(false);
      setDraftToEdit(null);
      setCreateCoords(null);
      setIsPlantingMode(false);
      setTargetCoordinates(null);
      setVaultInitialTab('drafts');
      setIsVaultOpen(true);

      // Persist draft in Supabase database
      await capsulesDb.saveCapsule(draftCap, currentUser?.id);
    },
    [currentUser?.id]
  );

  // Resume editing a saved draft from My Vault
  const handleResumeDraft = useCallback((draft: Capsule) => {
    setIsVaultOpen(false);
    setSelectedCapsule(null);
    setTargetCoordinates(null);
    setDraftToEdit(draft);
    setCreateCoords({
      lat: draft.lat,
      lng: draft.lng,
      name: draft.location_name,
      country: draft.country_name,
    });
    setIsCreateModalOpen(true);
  }, []);

  // Add newly created capsule & initiate Burial Animation Sequence + Supabase Sync
  const handleSaveCapsule = useCallback(
    async (newCap: Capsule) => {
      setIsVaultOpen(false);
      setIsCountryDrawerOpen(false);
      setIsCapsuleModalOpen(false);
      setDraftToEdit(null);
      setCreateCoords(null);
      setIsPlantingMode(false);
      setSearchQuery('');
      setTargetCoordinates({ lat: newCap.lat, lng: newCap.lng });

      // Dynamic Marker Array Update: append new pin immediately into state so it renders on globe right away
      setCapsules((prev) => [newCap, ...prev.filter((c) => c.id !== newCap.id)]);

      // Persist to Supabase database
      await capsulesDb.saveCapsule(newCap, currentUser?.id);

      // Trigger 2-second Burial animation overlay
      setBuryingCapsule(newCap);
    },
    [currentUser?.id]
  );

  // Complete burial sequence & settle camera on placed pin
  const handleBurialAnimationComplete = useCallback(() => {
    if (buryingCapsule) {
      const isGuest = Boolean(
        currentUser?.isGuest ||
        currentUser?.role === 'guest' ||
        buryingCapsule.creator_username.toLowerCase().includes('guest') ||
        buryingCapsule.id.startsWith('guest_')
      );

      // Ensure pin exists in state
      setCapsules((prev) => [buryingCapsule, ...prev.filter((c) => c.id !== buryingCapsule.id)]);
      setTargetCoordinates(null);

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
  }, [buryingCapsule, currentUser, hasCompletedGuestFeedback]);

  const handleCloseGuestRecommendation = useCallback(() => {
    setIsGuestRecommendationOpen(false);
    setHasCompletedGuestFeedback(true);
    if (guestFirstPlantedCapsule) {
      setSelectedCapsule(guestFirstPlantedCapsule);
      setIsCapsuleModalOpen(true);
    }
  }, [guestFirstPlantedCapsule]);

  // Handle "View on Globe" from My Vault Drawer
  const handleViewVaultCapsuleOnGlobe = useCallback((capsule: Capsule) => {
    setIsVaultOpen(false);
    setSearchQuery('');
    setTargetCoordinates({ lat: capsule.lat, lng: capsule.lng });
    setSelectedCapsule(capsule);
  }, []);

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
    logGuestVisit('continue_as_guest');
    setIsAuthModalOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await supabaseAuth.signOut();
    } catch (e) {
      console.warn('handleSignOut error:', e);
    }
    setCurrentUser(createGuestUser());
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
        onToggleLayers={() => {
          setShowHeatmap(true);
          setIsAllCapsulesModalOpen((prev) => !prev);
        }}
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
        vaultCapsulesCount={vaultCapsules.length}
        onDropPinClick={handleDropPinClick}
        isPlantingMode={isPlantingMode}
        onOpenEvents={() => setIsEventsDashboardOpen(true)}
        activeEventId={activeEventId}
        currentLanguage={currentLanguage}
        onOpenLanguageSelect={() => {
          setIsInitialLanguageSetup(false);
          setIsLanguageModalOpen(true);
        }}
        onSelectLanguage={handleSelectLanguage}
        viewMode={viewMode}
        onSwitchTo3D={() => setViewMode('3d')}
        onSwitchTo2D={() => setViewMode('2d')}
        onToggleViewMode={() => setViewMode((prev) => (prev === '3d' ? '2d' : '3d'))}
      />

      {/* Active Scavenger Hunt Event Top Banner */}
      {activeEvent && (
        <ActiveEventBanner
          event={activeEvent}
          capsules={capsules}
          userDiscoveredCount={
            activeEvent.discoveries?.filter(
              (d) => d.username.toLowerCase() === activeUsername.toLowerCase()
            ).length || 0
          }
          onOpenLeaderboard={() => setActiveLeaderboardEvent(activeEvent)}
          onOpenMissionControl={() => setActiveMissionControlEvent(activeEvent)}
          onOpenHints={() => setActiveCluesEvent(activeEvent)}
          onExitHunt={handleLeaveHunt}
          isOwner={
            activeEvent.creator_username.toLowerCase().replace('@', '') ===
            activeUsername.toLowerCase().replace('@', '')
          }
        />
      )}

      {/* Dispatched Clue / Broadcaster Toast Notification */}
      {broadcastHintToast && (
        <EventHintNotification
          hint={broadcastHintToast}
          onDismiss={() => setBroadcastHintToast(null)}
          onOpenClues={() => {
            const ev = events.find((e) => e.id === broadcastHintToast.event_id);
            if (ev) setActiveCluesEvent(ev);
            setBroadcastHintToast(null);
          }}
        />
      )}

      {/* Guest Mode Active Floating Notice - Positioned safely below all header action buttons for all screen types */}
      {currentUser?.isGuest && showGuestBanner && (
        <div className="absolute top-28 sm:top-32 md:top-36 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 sm:gap-2.5 py-1.5 px-3 sm:px-4 rounded-full bg-[#140e06]/98 border-2 border-amber-500/80 text-amber-100 text-[10.5px] sm:text-xs shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 max-w-[94vw] w-auto whitespace-nowrap">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <span className="font-bold text-amber-300">Guest Mode:</span>
            <span className="text-amber-100/90 sm:hidden">Pins won't be saved</span>
            <span className="text-amber-100/90 hidden sm:inline">None of your data, pins, or vaults will be saved.</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 pl-1.5 border-l border-amber-500/40">
            <button
              type="button"
              onClick={() => handleOpenAuth('signup')}
              className="px-2.5 sm:px-3 py-0.5 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-[10px] sm:text-[11px] transition shadow-xs cursor-pointer active:scale-95"
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => setShowGuestBanner(false)}
              className="p-0.5 rounded-full text-amber-400/70 hover:text-amber-100 transition cursor-pointer"
              title="Dismiss notice"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. MAP ENGINE: 3D EARTH GLOBE vs EXPLORE MODE (2D OPENSTREETMAP) */}
      {viewMode === '3d' ? (
        <GlobeView
          capsules={filteredCapsules}
          selectedCapsule={selectedCapsule}
          targetCoordinates={targetCoordinates}
          userLocation={userLocation}
          onFocusUserLocation={handleFocusUserLocation}
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
          onTriggerCloudDive={handleTriggerCloudDive}
        />
      ) : (
        <StreetMapView
          capsules={filteredCapsules}
          selectedCapsule={selectedCapsule}
          targetCoordinates={targetCoordinates}
          onSelectCapsule={handleSelectCapsule}
          onSwitchTo3D={() => setViewMode('3d')}
          onOpenCreateWithCoords={handleOpenCreateWithCoords}
          isPlantingMode={isPlantingMode}
          onTogglePlantingMode={() => setIsPlantingMode((prev) => !prev)}
          userLocation={userLocation}
          onSimulateLocation={simulateLocation}
          initialCenter={
            targetCoordinates
              ? { lat: targetCoordinates.lat, lng: targetCoordinates.lng, zoom: 14 }
              : selectedCapsule
              ? { lat: selectedCapsule.lat, lng: selectedCapsule.lng, zoom: 15 }
              : userLocation
              ? { lat: userLocation.lat, lng: userLocation.lng, zoom: 14 }
              : undefined
          }
        />
      )}

      {/* Atmospheric Cloud Pass-Through Zoom Transition Overlay */}
      <CloudTransitionOverlay
        isActive={isCloudDiving}
        onTransitionComplete={() => setIsCloudDiving(false)}
        destinationLabel={cloudDiveLabel}
      />

      {/* Real-time Proximity Alert Toast */}
      {activeProximityAlert && (
        <ProximityToast
          capsule={activeProximityAlert.capsule}
          distanceMeters={activeProximityAlert.distanceMeters}
          onOpenCapsule={(cap) => {
            handleSelectCapsule(cap);
            setActiveProximityAlert(null);
          }}
          onClose={() => setActiveProximityAlert(null)}
        />
      )}

      {/* 3. BOTTOM CONTROLS: Realtime Clock + Fast-Forward [+1h, +1d, +1w, +1y] */}
      <GlobeControlsOverlay
        onFastForward={handleFastForwardHours}
        onResetTime={handleResetTimeOffset}
        simulatedTimeOffsetMs={simulatedTimeOffsetMs}
        isPlantingMode={isPlantingMode}
        onTogglePlantingMode={() => setIsPlantingMode((prev) => !prev)}
        capsules={capsules}
        onSelectCapsule={handleSelectCapsule}
        onFocusUserLocation={handleFocusUserLocation}
        language={currentLanguage}
      />

      {/* 4. REST Countries Live Data Side Drawer */}
      <CountryDrawer
        country={selectedCountry}
        capsules={capsules}
        isOpen={isCountryDrawerOpen}
        onClose={() => setIsCountryDrawerOpen(false)}
        onSelectCapsule={handleSelectCapsule}
        onPlantInCountry={handlePlantInCountry}
        language={currentLanguage}
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

      {/* 5.5. All Capsules Global Archive & 3D Memory Heatmap Directory Modal */}
      <AllCapsulesModal
        isOpen={isAllCapsulesModalOpen}
        onClose={() => setIsAllCapsulesModalOpen(false)}
        capsules={capsules}
        simulatedTimeOffsetMs={simulatedTimeOffsetMs}
        showHeatmap={showHeatmap}
        onToggleHeatmap={() => setShowHeatmap((prev) => !prev)}
        onSelectCapsuleOnGlobe={handleViewVaultCapsuleOnGlobe}
        onOpenCapsuleModal={(cap) => handleSelectCapsule(cap, true)}
        language={currentLanguage}
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
          setTargetCoordinates(null);
        }}
        activeUsername={activeUsername}
        onUnlockTest={handleUnlockTest}
        onOpenOfflineViewer={handleOpenOfflineViewer}
        onDeleteCapsule={handleDeleteCapsule}
        onOpenTutorial={() => setIsWelcomeGuideOpen(true)}
        isJudgeOverride={false}
        simulatedTimeOffsetMs={simulatedTimeOffsetMs}
        userLocation={userLocation}
        onSimulateLocation={simulateLocation}
        language={currentLanguage}
      />

      {/* 9. Create Capsule Modal */}
      <CreateCapsuleModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreateCoords(null);
          setDraftToEdit(null);
          setIsPlantingMode(false);
          setTargetCoordinates(null);
        }}
        onSaveCapsule={handleSaveCapsule}
        onSaveDraft={handleSaveDraft}
        draftToEdit={draftToEdit}
        initialCoords={createCoords}
        activeUsername={activeUsername}
        currentUser={currentUser}
        language={currentLanguage}
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

      {/* 11. Welcome & Site Guide Modal (Tutorial) */}
      <WelcomeGuideModal
        isOpen={isWelcomeGuideOpen && !isLanguageModalOpen}
        onClose={() => setIsWelcomeGuideOpen(false)}
        language={currentLanguage}
        onSelectLanguage={handleSelectLanguage}
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
        language={currentLanguage}
        onSelectLanguage={handleSelectLanguage}
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

      {/* 17. Initial Language Preference Selection Modal */}
      <LanguageSelectModal
        isOpen={isLanguageModalOpen}
        onSelectLanguage={(lang) => handleSelectLanguage(lang, isInitialLanguageSetup)}
        currentLanguage={currentLanguage}
        onClose={() => setIsLanguageModalOpen(false)}
        isInitialSetup={isInitialLanguageSetup}
      />

      {/* 18. Scavenger Hunt Competitions & Private Party Events Dashboard */}
      <EventsDashboardModal
        isOpen={isEventsDashboardOpen}
        onClose={() => setIsEventsDashboardOpen(false)}
        events={events}
        allCapsules={capsules}
        currentUsername={activeUsername}
        activeEventId={activeEventId}
        onStartHunt={handleStartHunt}
        onOpenLeaderboard={(ev) => setActiveLeaderboardEvent(ev)}
        onOpenMissionControl={(ev) => setActiveMissionControlEvent(ev)}
        onCreateEvent={handleCreateEvent}
        language={currentLanguage}
      />

      {/* 19. Event Real-Time Leaderboard Modal */}
      {activeLeaderboardEvent && (
        <EventLeaderboardModal
          isOpen={Boolean(activeLeaderboardEvent)}
          onClose={() => setActiveLeaderboardEvent(null)}
          event={activeLeaderboardEvent}
          leaderboard={eventsStorage.calculateLeaderboard(activeLeaderboardEvent, activeUsername)}
          currentUsername={activeUsername}
        />
      )}

      {/* 20. Event Owner Mission Control Modal */}
      {activeMissionControlEvent && (
        <EventMissionControlModal
          isOpen={Boolean(activeMissionControlEvent)}
          onClose={() => setActiveMissionControlEvent(null)}
          event={activeMissionControlEvent}
          capsules={capsules}
          language={currentLanguage}
          onBroadcastHint={(capsuleId, capsuleTitle, hintText) => {
            eventsStorage.broadcastHint(
              activeMissionControlEvent.id,
              capsuleId,
              capsuleTitle,
              hintText
            );
            setEvents(eventsStorage.getEvents());
          }}
        />
      )}

      {/* 21. Event Clues & Riddle Intel Modal */}
      {activeCluesEvent && (
        <EventCluesModal
          isOpen={Boolean(activeCluesEvent)}
          onClose={() => setActiveCluesEvent(null)}
          event={activeCluesEvent}
          capsules={capsules}
        />
      )}
    </div>
  );
}


