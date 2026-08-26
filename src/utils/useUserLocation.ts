import { useState, useEffect, useCallback, useRef } from 'react';
import { Capsule } from '../types';
import { getDistanceInMeters } from './proximity';
import { reverseGeocodeMapbox } from './mapbox';

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number | null;
  speed?: number | null;
  isSimulated?: boolean;
  locationName?: string;
}

export interface ProximityAlertEvent {
  capsule: Capsule;
  distanceMeters: number;
  timestamp: number;
}

const DEFAULT_FALLBACK_LOCATION: UserLocation = {
  lat: 51.5074,
  lng: -0.1278,
  accuracy: 15,
  heading: 0,
  speed: 0,
  isSimulated: true,
  locationName: 'London, United Kingdom',
};

const SAVED_LOCATION_KEY = 'chronospheres_last_known_user_location';

export function useUserLocation(
  capsules: Capsule[],
  onProximityAlert?: (event: ProximityAlertEvent) => void
) {
  // Initialize with saved location or fallback so user live location icon is immediately visible
  const [userLocation, setUserLocation] = useState<UserLocation>(() => {
    try {
      const saved = localStorage.getItem(SAVED_LOCATION_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return DEFAULT_FALLBACK_LOCATION;
  });

  const [geoError, setGeoError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(true);
  const notifiedCapsulesRef = useRef<Set<string>>(new Set());

  // Helper to reverse geocode user location
  const updateLocationDetails = useCallback(async (lat: number, lng: number, rest: Partial<UserLocation>) => {
    let name = rest.locationName;
    if (!name) {
      try {
        const geo = await reverseGeocodeMapbox(lat, lng);
        name = geo.placeName;
      } catch {
        name = `${lat.toFixed(3)}°, ${lng.toFixed(3)}°`;
      }
    }

    const updated: UserLocation = {
      lat,
      lng,
      locationName: name,
      ...rest,
    };

    setUserLocation(updated);
    try {
      localStorage.setItem(SAVED_LOCATION_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }, []);

  // Request high-accuracy GPS position
  const requestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGeoError('Geolocation is not supported by your browser.');
      setIsLocating(false);
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateLocationDetails(pos.coords.latitude, pos.coords.longitude, {
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          isSimulated: false,
        });
        setGeoError(null);
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation one-time check note:', err.message);
        setGeoError(err.message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
    );
  }, [updateLocationDetails]);

  // Watch real-time GPS position
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGeoError('Geolocation is not supported by your browser.');
      setIsLocating(false);
      return;
    }

    requestLocation();

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        updateLocationDetails(pos.coords.latitude, pos.coords.longitude, {
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          isSimulated: false,
        });
        setGeoError(null);
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation watch note:', err.message);
        setGeoError(err.message);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [requestLocation, updateLocationDetails]);

  // Distance computation helper for any capsule
  const getDistanceToCapsule = useCallback(
    (capsule: Capsule): number | null => {
      if (!userLocation) return null;
      return getDistanceInMeters(userLocation.lat, userLocation.lng, capsule.lat, capsule.lng);
    },
    [userLocation]
  );

  // Proximity Alert monitoring
  useEffect(() => {
    if (!userLocation || !capsules.length || !onProximityAlert) return;

    for (const cap of capsules) {
      if (cap.access_type !== 'public' || cap.is_draft) continue;

      const dist = getDistanceInMeters(userLocation.lat, userLocation.lng, cap.lat, cap.lng);
      const alertRadius = cap.unlock_radius_meters || 150;

      // If user is within radius and hasn't been notified this session
      if (dist <= alertRadius) {
        if (!notifiedCapsulesRef.current.has(cap.id)) {
          notifiedCapsulesRef.current.add(cap.id);
          onProximityAlert({
            capsule: cap,
            distanceMeters: dist,
            timestamp: Date.now(),
          });
        }
      }
    }
  }, [userLocation, capsules, onProximityAlert]);

  // Teleport simulator for testing proximity & instant find without physical travel
  const simulateLocation = useCallback((lat: number, lng: number) => {
    updateLocationDetails(lat, lng, {
      accuracy: 10,
      isSimulated: true,
    });
  }, [updateLocationDetails]);

  return {
    userLocation,
    geoError,
    isLocating,
    requestLocation,
    getDistanceToCapsule,
    simulateLocation,
    setUserLocation,
  };
}
