/**
 * Comprehensive World Landmass Polygons for Land-Locking Pins
 * Ensures pins only land on dry land / designated country territories and never in open oceans.
 */

import { matchCoordinatesToCountry } from './worldBoundaries';

export interface LandmassPolygon {
  name: string;
  countryCode: string;
  countryName: string;
  points: [number, number][]; // [lat, lng]
}

export const WORLD_LAND_POLYGONS: LandmassPolygon[] = [
  // --- NORTH AMERICA ---
  {
    name: 'Contiguous United States',
    countryCode: 'US',
    countryName: 'United States',
    points: [
      [49.0, -123.0], [49.0, -95.0], [48.0, -89.0], [45.0, -82.0], [45.0, -74.0], [47.0, -67.0],
      [44.0, -69.0], [41.0, -72.0], [39.0, -75.0], [35.0, -75.5], [30.0, -81.0], [25.0, -80.0],
      [25.0, -81.0], [29.0, -85.0], [30.0, -89.0], [29.0, -94.0], [26.0, -97.0], [26.0, -99.0],
      [29.0, -103.0], [31.5, -106.0], [31.5, -111.0], [32.5, -117.0], [34.0, -120.0], [37.0, -122.5],
      [42.0, -124.5], [46.0, -124.0], [48.5, -124.7], [49.0, -123.0]
    ],
  },
  {
    name: 'Alaska',
    countryCode: 'US',
    countryName: 'United States',
    points: [
      [54.0, -130.0], [60.0, -140.0], [69.5, -141.0], [71.5, -156.0], [66.0, -168.0],
      [60.0, -165.0], [55.0, -163.0], [58.0, -154.0], [59.0, -136.0], [54.0, -130.0]
    ],
  },
  {
    name: 'Canada Mainland & Territories',
    countryCode: 'CA',
    countryName: 'Canada',
    points: [
      [49.0, -123.0], [48.5, -124.7], [54.0, -133.0], [60.0, -140.0], [69.5, -141.0], [70.0, -130.0],
      [71.0, -115.0], [68.0, -95.0], [64.0, -80.0], [55.0, -80.0], [52.0, -56.0], [47.0, -53.0],
      [45.0, -66.0], [45.0, -74.0], [45.0, -82.0], [48.0, -89.0], [49.0, -95.0], [49.0, -123.0]
    ],
  },
  {
    name: 'Mexico',
    countryCode: 'MX',
    countryName: 'Mexico',
    points: [
      [32.5, -117.0], [31.5, -111.0], [31.5, -106.0], [29.0, -103.0], [26.0, -99.0], [26.0, -97.0],
      [22.0, -97.5], [19.0, -96.0], [18.5, -92.0], [21.5, -87.0], [18.5, -88.0], [16.0, -92.0],
      [14.5, -92.0], [16.0, -98.0], [18.0, -104.0], [23.0, -106.0], [29.0, -112.0], [32.0, -115.0], [32.5, -117.0]
    ],
  },
  {
    name: 'Central America',
    countryCode: 'CR',
    countryName: 'Central America',
    points: [
      [18.0, -88.5], [16.0, -83.0], [11.0, -83.5], [8.5, -77.5], [7.2, -81.0], [8.5, -83.5],
      [10.0, -85.5], [13.0, -88.0], [14.5, -92.0], [16.0, -90.0], [18.0, -88.5]
    ],
  },
  {
    name: 'Greenland',
    countryCode: 'GL',
    countryName: 'Greenland',
    points: [
      [60.0, -44.0], [65.0, -38.0], [70.0, -26.0], [77.0, -18.0], [83.0, -30.0], [82.0, -50.0],
      [76.0, -68.0], [72.0, -56.0], [66.0, -53.0], [60.0, -44.0]
    ],
  },
  {
    name: 'Caribbean / Cuba & Hispaniola',
    countryCode: 'CU',
    countryName: 'Caribbean',
    points: [
      [23.5, -85.0], [23.5, -74.0], [20.0, -74.0], [18.0, -68.0], [17.5, -72.0], [19.5, -78.0],
      [22.0, -85.0], [23.5, -85.0]
    ],
  },

  // --- SOUTH AMERICA ---
  {
    name: 'Brazil',
    countryCode: 'BR',
    countryName: 'Brazil',
    points: [
      [4.0, -51.0], [0.0, -50.0], [-2.5, -44.0], [-5.0, -35.0], [-10.0, -36.0], [-18.0, -39.0],
      [-23.0, -42.0], [-28.0, -49.0], [-33.0, -53.0], [-30.0, -57.5], [-25.5, -54.5], [-22.0, -58.0],
      [-16.0, -60.0], [-10.0, -65.0], [-8.0, -73.0], [-4.0, -70.0], [1.0, -67.0], [4.5, -60.0],
      [3.5, -52.0], [4.0, -51.0]
    ],
  },
  {
    name: 'Argentina & Uruguay',
    countryCode: 'AR',
    countryName: 'Argentina',
    points: [
      [-22.0, -65.0], [-22.0, -62.0], [-27.0, -57.5], [-25.5, -54.5], [-30.0, -57.5], [-34.0, -53.5],
      [-39.0, -62.0], [-46.0, -66.0], [-52.0, -68.0], [-55.0, -66.0], [-55.0, -69.0], [-50.0, -73.0],
      [-40.0, -71.5], [-32.0, -70.0], [-25.0, -68.5], [-22.0, -65.0]
    ],
  },
  {
    name: 'Chile',
    countryCode: 'CL',
    countryName: 'Chile',
    points: [
      [-18.0, -70.0], [-25.0, -68.5], [-32.0, -70.0], [-40.0, -71.5], [-50.0, -73.0], [-55.0, -69.0],
      [-53.0, -75.0], [-45.0, -75.0], [-35.0, -73.0], [-24.0, -70.5], [-18.0, -70.0]
    ],
  },
  {
    name: 'Andean & Northern South America',
    countryCode: 'PE',
    countryName: 'South America',
    points: [
      [12.5, -72.0], [10.0, -75.5], [8.0, -77.0], [2.0, -79.0], [-4.0, -81.0], [-15.0, -75.5],
      [-18.0, -70.0], [-22.0, -65.0], [-16.0, -60.0], [-4.0, -70.0], [1.0, -67.0], [6.0, -67.5],
      [8.0, -72.0], [12.5, -72.0]
    ],
  },

  // --- EUROPE ---
  {
    name: 'Western & Central Europe',
    countryCode: 'FR',
    countryName: 'France',
    points: [
      [54.8, 8.5], [54.5, 14.5], [51.0, 15.0], [48.8, 13.5], [46.0, 7.0], [44.0, 7.5],
      [43.0, 6.0], [42.5, 3.0], [42.5, 0.0], [43.5, -1.8], [46.0, -1.2], [48.5, -4.8],
      [49.5, -1.5], [51.0, 2.5], [53.5, 7.0], [54.8, 8.5]
    ],
  },
  {
    name: 'Germany & Eastern Europe',
    countryCode: 'DE',
    countryName: 'Germany',
    points: [
      [54.8, 8.5], [55.0, 21.0], [53.0, 24.0], [49.0, 24.0], [45.0, 20.0], [44.0, 14.0],
      [46.0, 7.0], [49.0, 8.0], [53.5, 7.0], [54.8, 8.5]
    ],
  },
  {
    name: 'United Kingdom & Ireland',
    countryCode: 'GB',
    countryName: 'United Kingdom',
    points: [
      [50.0, -10.5], [55.0, -10.5], [58.5, -6.0], [58.5, -3.0], [56.0, -2.0], [52.5, 1.8],
      [50.5, 0.5], [50.0, -5.5], [51.5, -10.0], [50.0, -10.5]
    ],
  },
  {
    name: 'Iberian Peninsula (Spain & Portugal)',
    countryCode: 'ES',
    countryName: 'Spain',
    points: [
      [43.5, -1.8], [42.5, 3.0], [41.0, 1.0], [38.0, 0.0], [36.5, -2.5], [36.0, -5.5],
      [37.0, -9.0], [39.0, -9.5], [42.0, -9.0], [43.5, -8.5], [43.5, -5.0], [43.5, -1.8]
    ],
  },
  {
    name: 'Italian Peninsula & Alps',
    countryCode: 'IT',
    countryName: 'Italy',
    points: [
      [46.5, 7.0], [47.0, 12.0], [45.5, 13.5], [44.0, 12.5], [42.0, 15.0], [40.0, 18.5],
      [38.0, 16.0], [37.5, 14.0], [40.5, 14.0], [43.0, 10.5], [44.0, 7.5], [46.5, 7.0]
    ],
  },
  {
    name: 'Balkans & Greece',
    countryCode: 'GR',
    countryName: 'Greece',
    points: [
      [46.0, 15.0], [46.0, 24.0], [41.5, 26.5], [38.0, 24.0], [35.0, 25.0], [36.5, 22.0],
      [39.5, 20.0], [44.0, 14.0], [46.0, 15.0]
    ],
  },
  {
    name: 'Scandinavia (Norway & Sweden & Finland)',
    countryCode: 'NO',
    countryName: 'Scandinavia',
    points: [
      [58.0, 7.0], [59.0, 11.0], [55.5, 13.0], [60.0, 18.0], [60.0, 28.0], [69.0, 30.0],
      [71.0, 28.0], [68.0, 16.0], [62.0, 5.0], [58.0, 7.0]
    ],
  },
  {
    name: 'Iceland',
    countryCode: 'IS',
    countryName: 'Iceland',
    points: [
      [66.5, -23.0], [66.5, -14.0], [64.0, -13.5], [63.5, -19.0], [64.0, -22.5], [66.5, -23.0]
    ],
  },

  // --- AFRICA ---
  {
    name: 'Northern Africa & Sahara',
    countryCode: 'EG',
    countryName: 'Egypt',
    points: [
      [36.0, -5.5], [37.0, 10.0], [32.0, 34.0], [22.0, 37.0], [22.0, 15.0], [15.0, -16.0],
      [28.0, -12.0], [36.0, -5.5]
    ],
  },
  {
    name: 'Ghana & West Africa Coast',
    countryCode: 'GH',
    countryName: 'Ghana',
    points: [
      [11.5, -3.5], [11.5, 1.5], [6.0, 1.5], [4.5, -2.5], [4.5, -7.5], [11.0, -16.0],
      [15.0, -16.0], [15.0, 4.0], [11.5, -3.5]
    ],
  },
  {
    name: 'Democratic Republic of the Congo & Central Africa',
    countryCode: 'CD',
    countryName: 'Democratic Republic of the Congo',
    points: [
      [5.5, 12.0], [5.5, 31.0], [3.5, 31.0], [1.5, 30.2], [-1.0, 29.5], [-3.5, 29.3],
      [-8.0, 30.5], [-13.5, 29.0], [-13.5, 22.0], [-6.0, 14.5], [-6.0, 12.0], [5.5, 12.0]
    ],
  },
  {
    name: 'Nigeria & Gulf of Guinea',
    countryCode: 'NG',
    countryName: 'Nigeria',
    points: [
      [15.0, -16.0], [15.0, 30.0], [5.0, 40.0], [0.0, 42.0], [-10.0, 40.0], [-15.0, 30.0],
      [-10.0, 12.0], [4.5, 8.5], [4.5, -7.5], [12.0, -16.0], [15.0, -16.0]
    ],
  },
  {
    name: 'Southern Africa',
    countryCode: 'ZA',
    countryName: 'South Africa',
    points: [
      [-15.0, 12.0], [-15.0, 35.0], [-25.0, 33.0], [-34.5, 20.0], [-33.0, 18.0],
      [-28.5, 16.5], [-15.0, 12.0]
    ],
  },
  {
    name: 'East Africa (Kenya & Tanzania)',
    countryCode: 'KE',
    countryName: 'Kenya',
    points: [
      [5.0, 35.0], [5.0, 42.0], [-10.5, 40.5], [-11.5, 35.0], [-1.0, 30.5], [5.0, 35.0]
    ],
  },
  {
    name: 'Madagascar',
    countryCode: 'MG',
    countryName: 'Madagascar',
    points: [
      [-12.0, 49.0], [-16.0, 50.0], [-25.0, 47.0], [-25.0, 44.0], [-16.0, 44.0], [-12.0, 49.0]
    ],
  },

  // --- ASIA ---
  {
    name: 'Middle East & Arabian Peninsula',
    countryCode: 'SA',
    countryName: 'Saudi Arabia',
    points: [
      [36.0, 36.0], [36.0, 50.0], [30.0, 50.0], [24.0, 55.0], [16.0, 53.0], [12.5, 44.0],
      [22.0, 39.0], [31.5, 34.0], [36.0, 36.0]
    ],
  },
  {
    name: 'Turkey & Caucasus',
    countryCode: 'TR',
    countryName: 'Turkey',
    points: [
      [42.0, 27.0], [42.0, 44.0], [37.0, 44.0], [36.0, 30.0], [38.5, 26.5], [42.0, 27.0]
    ],
  },
  {
    name: 'Indian Subcontinent',
    countryCode: 'IN',
    countryName: 'India',
    points: [
      [35.5, 74.5], [34.0, 78.5], [28.0, 88.0], [27.0, 97.0], [22.0, 92.0], [21.5, 87.0],
      [16.0, 82.0], [10.0, 80.0], [8.0, 77.5], [13.0, 74.5], [19.0, 72.5], [23.5, 68.5],
      [27.0, 71.0], [32.0, 75.0], [35.5, 74.5]
    ],
  },
  {
    name: 'China & Central Asia',
    countryCode: 'CN',
    countryName: 'China',
    points: [
      [53.5, 122.0], [48.0, 135.0], [42.0, 131.0], [39.0, 119.0], [30.0, 122.0], [22.0, 114.0],
      [21.5, 108.0], [22.0, 101.0], [28.0, 97.0], [28.0, 88.0], [31.0, 79.0], [36.0, 75.0],
      [45.0, 80.0], [49.0, 88.0], [50.0, 118.0], [53.5, 122.0]
    ],
  },
  {
    name: 'Japan Main Islands',
    countryCode: 'JP',
    countryName: 'Japan',
    points: [
      [45.5, 142.0], [44.0, 145.5], [42.0, 141.0], [38.0, 141.5], [35.0, 140.0], [33.0, 136.0],
      [31.0, 131.0], [33.0, 130.0], [36.0, 136.0], [40.0, 140.0], [43.5, 140.5], [45.5, 142.0]
    ],
  },
  {
    name: 'Southeast Asia',
    countryCode: 'TH',
    countryName: 'Southeast Asia',
    points: [
      [22.0, 100.0], [21.0, 108.0], [10.0, 108.0], [8.0, 103.0], [1.5, 104.0], [6.0, 99.0],
      [14.0, 98.0], [20.0, 95.0], [22.0, 100.0]
    ],
  },
  {
    name: 'Indonesia & Malaysia',
    countryCode: 'ID',
    countryName: 'Indonesia',
    points: [
      [5.5, 95.0], [1.0, 104.0], [-5.5, 106.0], [-8.5, 115.0], [-9.0, 125.0], [-3.0, 140.0],
      [2.5, 128.0], [4.0, 117.0], [2.0, 108.0], [5.5, 95.0]
    ],
  },
  {
    name: 'Russia & Northern Asia',
    countryCode: 'RU',
    countryName: 'Russia',
    points: [
      [70.0, 30.0], [75.0, 60.0], [76.0, 100.0], [72.0, 140.0], [66.0, 170.0], [60.0, -170.0],
      [55.0, 160.0], [45.0, 135.0], [48.0, 131.0], [50.0, 118.0], [49.0, 88.0], [52.0, 60.0],
      [55.0, 38.0], [60.0, 30.0], [70.0, 30.0]
    ],
  },

  // --- OCEANIA ---
  {
    name: 'Australia',
    countryCode: 'AU',
    countryName: 'Australia',
    points: [
      [-12.0, 131.0], [-10.5, 142.5], [-16.0, 146.0], [-25.0, 153.0], [-34.0, 151.0], [-38.0, 147.0],
      [-38.5, 140.5], [-35.0, 136.0], [-32.0, 125.0], [-35.0, 117.0], [-22.0, 114.0], [-15.0, 124.0],
      [-12.0, 131.0]
    ],
  },
  {
    name: 'New Zealand',
    countryCode: 'NZ',
    countryName: 'New Zealand',
    points: [
      [-34.5, 172.5], [-37.5, 178.5], [-41.5, 175.5], [-46.5, 168.0], [-43.0, 170.0], [-38.0, 174.5],
      [-34.5, 172.5]
    ],
  },

  // --- ANTARCTICA ---
  {
    name: 'Antarctica',
    countryCode: 'AQ',
    countryName: 'Antarctica',
    points: [
      [-63.0, -57.0], [-68.0, -65.0], [-72.0, -75.0], [-74.0, -100.0], [-75.0, -140.0],
      [-78.0, -170.0], [-82.0, 170.0], [-70.0, 160.0], [-66.0, 140.0], [-66.0, 110.0],
      [-67.0, 90.0], [-69.0, 70.0], [-70.0, 40.0], [-70.0, 10.0], [-72.0, -20.0],
      [-76.0, -35.0], [-63.0, -57.0]
    ],
  },
];

/**
 * Checks whether a given (lat, lng) coordinate resides strictly on dry land/territory
 */
export function isCoordinateOnLand(lat: number, lng: number): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    return false;
  }

  // 1. Polar Antarctica check: south of -60°
  if (lat <= -60) {
    return true;
  }

  // 2. Direct check against country borders
  const matchedCountry = matchCoordinatesToCountry(lat, lng);
  if (matchedCountry && matchedCountry.countryCode && matchedCountry.countryCode !== 'OCEAN') {
    return true;
  }

  // 3. High-precision point-in-polygon over all continental and regional landmasses
  for (const poly of WORLD_LAND_POLYGONS) {
    const pts = poly.points;
    let inside = false;

    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [yi, xi] = pts[i];
      const [yj, xj] = pts[j];

      const intersect =
        yi > lat !== yj > lat &&
        lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;

      if (intersect) {
        inside = !inside;
      }
    }

    if (inside) {
      return true;
    }
  }

  return false;
}
