export interface GeocodingResult {
  id: string;
  name: string;
  placeName: string;
  lat: number;
  lng: number;
  countryCode?: string;
  countryName?: string;
}

const DEFAULT_MAPBOX_TOKEN =
  ((import.meta as any).env?.VITE_MAPBOX_ACCESS_TOKEN as string) ||
  'pk.eyJ1IjoiY2hyb25vc3BoZXJlcyIsImEiOiJjbTdtNWU4ZTEwMDB5MmxxMzl0NG1qNWs4In0.example';

// Curated world cities and landmarks for instant matching and robust offline resilience
const CURATED_WORLD_PLACES: GeocodingResult[] = [
  { id: 'place_tokyo', name: 'Tokyo', placeName: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503, countryCode: 'JP', countryName: 'Japan' },
  { id: 'place_paris', name: 'Paris', placeName: 'Paris, Île-de-France, France', lat: 48.8566, lng: 2.3522, countryCode: 'FR', countryName: 'France' },
  { id: 'place_greenland', name: 'Greenland', placeName: 'Nuuk, Greenland', lat: 72.0, lng: -40.0, countryCode: 'GL', countryName: 'Greenland' },
  { id: 'place_kenya', name: 'Kenya', placeName: 'Nairobi, Kenya', lat: -1.2921, lng: 36.8219, countryCode: 'KE', countryName: 'Kenya' },
  { id: 'place_cape_canaveral', name: 'Cape Canaveral', placeName: 'Cape Canaveral, Florida, United States', lat: 28.5729, lng: -80.6490, countryCode: 'US', countryName: 'United States' },
  { id: 'place_newyork', name: 'New York', placeName: 'New York City, New York, United States', lat: 40.7128, lng: -74.0060, countryCode: 'US', countryName: 'United States' },
  { id: 'place_london', name: 'London', placeName: 'London, Greater London, United Kingdom', lat: 51.5074, lng: -0.1278, countryCode: 'GB', countryName: 'United Kingdom' },
  { id: 'place_rome', name: 'Rome', placeName: 'Rome, Lazio, Italy', lat: 41.9028, lng: 12.4964, countryCode: 'IT', countryName: 'Italy' },
  { id: 'place_cairo', name: 'Cairo', placeName: 'Cairo, Egypt', lat: 30.0444, lng: 31.2357, countryCode: 'EG', countryName: 'Egypt' },
  { id: 'place_reykjavik', name: 'Reykjavik', placeName: 'Reykjavik, Iceland', lat: 64.1466, lng: -21.9426, countryCode: 'IS', countryName: 'Iceland' },
  { id: 'place_sydney', name: 'Sydney', placeName: 'Sydney, New South Wales, Australia', lat: -33.8688, lng: 151.2093, countryCode: 'AU', countryName: 'Australia' },
  { id: 'place_rio', name: 'Rio de Janeiro', placeName: 'Rio de Janeiro, Brazil', lat: -22.9068, lng: -43.1729, countryCode: 'BR', countryName: 'Brazil' },
  { id: 'place_mumbai', name: 'Mumbai', placeName: 'Mumbai, Maharashtra, India', lat: 19.0760, lng: 72.8777, countryCode: 'IN', countryName: 'India' },
  { id: 'place_tanzania', name: 'Serengeti', placeName: 'Serengeti National Park, Tanzania', lat: -2.3333, lng: 34.8333, countryCode: 'TZ', countryName: 'Tanzania' },
  { id: 'place_sanfrancisco', name: 'San Francisco', placeName: 'San Francisco, California, United States', lat: 37.7749, lng: -122.4194, countryCode: 'US', countryName: 'United States' },
  { id: 'place_berlin', name: 'Berlin', placeName: 'Berlin, Germany', lat: 52.5200, lng: 13.4050, countryCode: 'DE', countryName: 'Germany' },
  { id: 'place_dubai', name: 'Dubai', placeName: 'Dubai, United Arab Emirates', lat: 25.2048, lng: 55.2708, countryCode: 'AE', countryName: 'United Arab Emirates' },
  { id: 'place_singapore', name: 'Singapore', placeName: 'Singapore', lat: 1.3521, lng: 103.8198, countryCode: 'SG', countryName: 'Singapore' },
  { id: 'place_seoul', name: 'Seoul', placeName: 'Seoul, South Korea', lat: 37.5665, lng: 126.9780, countryCode: 'KR', countryName: 'South Korea' },
];

/**
 * Searches locations using Mapbox Geocoding API with fallback
 */
export async function searchMapboxPlaces(
  query: string,
  token: string = DEFAULT_MAPBOX_TOKEN
): Promise<GeocodingResult[]> {
  const clean = query.trim();
  if (!clean || clean.length < 2) return [];

  // Check Mapbox API first
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      clean
    )}.json?access_token=${token}&types=place,locality,neighborhood,address,poi,country,region&limit=6`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.features && Array.isArray(data.features) && data.features.length > 0) {
        return data.features.map((f: any) => {
          const lng = f.center?.[0] ?? 0;
          const lat = f.center?.[1] ?? 0;
          const countryContext = f.context?.find((c: any) => c.id.startsWith('country'));
          return {
            id: f.id,
            name: f.text || f.place_name,
            placeName: f.place_name,
            lat,
            lng,
            countryCode: countryContext?.short_code?.toUpperCase(),
            countryName: countryContext?.text,
          };
        });
      }
    }
  } catch (err) {
    // Mapbox network / rate limit catch
  }

  // Fallback 1: OpenStreetMap / Nominatim API
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      clean
    )}&limit=5&addressdetails=1`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(nominatimUrl, {
      signal: controller.signal,
      headers: { 'Accept-Language': 'en' },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item: any) => ({
          id: `osm_${item.place_id}`,
          name: item.name || item.display_name.split(',')[0],
          placeName: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          countryCode: item.address?.country_code?.toUpperCase(),
          countryName: item.address?.country,
        }));
      }
    }
  } catch (err) {
    // Fallback catch
  }

  // Fallback 2: Curated instant list matching
  const lower = clean.toLowerCase();
  const matched = CURATED_WORLD_PLACES.filter(
    (p) =>
      p.name.toLowerCase().includes(lower) ||
      p.placeName.toLowerCase().includes(lower) ||
      p.countryName?.toLowerCase().includes(lower)
  );

  return matched;
}

/**
 * Reverse geocode coordinates to place name
 */
export async function reverseGeocodeMapbox(
  lat: number,
  lng: number,
  token: string = DEFAULT_MAPBOX_TOKEN
): Promise<{ placeName: string; countryCode?: string; countryName?: string }> {
  // Polar Antarctica detection
  if (lat <= -60) {
    return {
      placeName: `Antarctica (${Math.abs(lat).toFixed(2)}°S, ${Math.abs(lng).toFixed(2)}°${lng >= 0 ? 'E' : 'W'})`,
      countryCode: 'AQ',
      countryName: 'Antarctica',
    };
  }

  // 1. Try Mapbox Geocoding API
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&limit=1`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        const f = data.features[0];
        const countryContext = f.context?.find((c: any) => c.id.startsWith('country'));
        return {
          placeName: f.place_name,
          countryCode: countryContext?.short_code?.toUpperCase(),
          countryName: countryContext?.text,
        };
      }
    }
  } catch (err) {
    // Mapbox network fallback
  }

  // 2. Try OpenStreetMap Nominatim reverse geocoding
  try {
    const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(osmUrl, {
      signal: controller.signal,
      headers: { 'Accept-Language': 'en' },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.display_name) {
        return {
          placeName: data.display_name,
          countryCode: data.address?.country_code?.toUpperCase(),
          countryName: data.address?.country,
        };
      }
    }
  } catch (err) {
    // OSM network fallback
  }

  // Fallback to coordinates string
  return {
    placeName: `Coordinates (${lat.toFixed(3)}°, ${lng.toFixed(3)}°)`,
  };
}
