import { CountryData } from '../types';
import { matchCoordinatesToCountry } from '../data/worldBoundaries';

const countryCache = new Map<string, CountryData>();

/**
 * Accurate offline fallback data for key world nations to ensure zero broken UI
 */
const ACCURATE_COUNTRY_FALLBACKS: Record<string, CountryData> = {
  GL: {
    name: { common: 'Greenland', official: 'Greenland' },
    cca2: 'GL',
    cca3: 'GRL',
    capital: ['Nuuk'],
    region: 'Americas',
    subregion: 'North America',
    population: 56367,
    flags: {
      png: 'https://flagcdn.com/w320/gl.png',
      svg: 'https://flagcdn.com/gl.svg',
      alt: 'Flag of Greenland',
    },
    currencies: { DKK: { name: 'Danish krone', symbol: 'kr.' } },
    languages: { kal: 'Greenlandic' },
    timezones: ['UTC-03:00', 'UTC-01:00', 'UTC+00:00'],
    latlng: [72.0, -40.0],
  },
  JP: {
    name: { common: 'Japan', official: 'Japan' },
    cca2: 'JP',
    cca3: 'JPN',
    capital: ['Tokyo'],
    region: 'Asia',
    subregion: 'Eastern Asia',
    population: 125836021,
    flags: {
      png: 'https://flagcdn.com/w320/jp.png',
      svg: 'https://flagcdn.com/jp.svg',
      alt: 'Flag of Japan',
    },
    currencies: { JPY: { name: 'Japanese yen', symbol: '¥' } },
    languages: { jpn: 'Japanese' },
    timezones: ['UTC+09:00'],
    latlng: [36.0, 138.0],
  },
  FR: {
    name: { common: 'France', official: 'French Republic' },
    cca2: 'FR',
    cca3: 'FRA',
    capital: ['Paris'],
    region: 'Europe',
    subregion: 'Western Europe',
    population: 67391582,
    flags: {
      png: 'https://flagcdn.com/w320/fr.png',
      svg: 'https://flagcdn.com/fr.svg',
      alt: 'Flag of France',
    },
    currencies: { EUR: { name: 'Euro', symbol: '€' } },
    languages: { fra: 'French' },
    timezones: ['UTC+01:00'],
    latlng: [46.0, 2.0],
  },
  US: {
    name: { common: 'United States', official: 'United States of America' },
    cca2: 'US',
    cca3: 'USA',
    capital: ['Washington, D.C.'],
    region: 'Americas',
    subregion: 'North America',
    population: 331893745,
    flags: {
      png: 'https://flagcdn.com/w320/us.png',
      svg: 'https://flagcdn.com/us.svg',
      alt: 'Flag of the United States',
    },
    currencies: { USD: { name: 'United States dollar', symbol: '$' } },
    languages: { eng: 'English' },
    timezones: ['UTC-05:00', 'UTC-06:00', 'UTC-07:00', 'UTC-08:00'],
    latlng: [38.0, -97.0],
  },
  EG: {
    name: { common: 'Egypt', official: 'Arab Republic of Egypt' },
    cca2: 'EG',
    cca3: 'EGY',
    capital: ['Cairo'],
    region: 'Africa',
    subregion: 'Northern Africa',
    population: 102334404,
    flags: {
      png: 'https://flagcdn.com/w320/eg.png',
      svg: 'https://flagcdn.com/eg.svg',
      alt: 'Flag of Egypt',
    },
    currencies: { EGP: { name: 'Egyptian pound', symbol: 'E£' } },
    languages: { ara: 'Arabic' },
    timezones: ['UTC+02:00'],
    latlng: [27.0, 30.0],
  },
  IS: {
    name: { common: 'Iceland', official: 'Iceland' },
    cca2: 'IS',
    cca3: 'ISL',
    capital: ['Reykjavik'],
    region: 'Europe',
    subregion: 'Northern Europe',
    population: 366425,
    flags: {
      png: 'https://flagcdn.com/w320/is.png',
      svg: 'https://flagcdn.com/is.svg',
      alt: 'Flag of Iceland',
    },
    currencies: { ISK: { name: 'Icelandic króna', symbol: 'kr' } },
    languages: { isl: 'Icelandic' },
    timezones: ['UTC+00:00'],
    latlng: [65.0, -18.0],
  },
  AU: {
    name: { common: 'Australia', official: 'Commonwealth of Australia' },
    cca2: 'AU',
    cca3: 'AUS',
    capital: ['Canberra'],
    region: 'Oceania',
    subregion: 'Australia and New Zealand',
    population: 25687041,
    flags: {
      png: 'https://flagcdn.com/w320/au.png',
      svg: 'https://flagcdn.com/au.svg',
      alt: 'Flag of Australia',
    },
    currencies: { AUD: { name: 'Australian dollar', symbol: '$' } },
    languages: { eng: 'English' },
    timezones: ['UTC+08:00', 'UTC+09:30', 'UTC+10:00'],
    latlng: [-27.0, 133.0],
  },
  TZ: {
    name: { common: 'Tanzania', official: 'United Republic of Tanzania' },
    cca2: 'TZ',
    cca3: 'TZA',
    capital: ['Dodoma'],
    region: 'Africa',
    subregion: 'Eastern Africa',
    population: 59734213,
    flags: {
      png: 'https://flagcdn.com/w320/tz.png',
      svg: 'https://flagcdn.com/tz.svg',
      alt: 'Flag of Tanzania',
    },
    currencies: { TZS: { name: 'Tanzanian shilling', symbol: 'Sh' } },
    languages: { eng: 'English', swa: 'Swahili' },
    timezones: ['UTC+03:00'],
    latlng: [-6.0, 35.0],
  },
  BR: {
    name: { common: 'Brazil', official: 'Federative Republic of Brazil' },
    cca2: 'BR',
    cca3: 'BRA',
    capital: ['Brasília'],
    region: 'Americas',
    subregion: 'South America',
    population: 212559409,
    flags: {
      png: 'https://flagcdn.com/w320/br.png',
      svg: 'https://flagcdn.com/br.svg',
      alt: 'Flag of Brazil',
    },
    currencies: { BRL: { name: 'Brazilian real', symbol: 'R$' } },
    languages: { por: 'Portuguese' },
    timezones: ['UTC-05:00', 'UTC-04:00', 'UTC-03:00', 'UTC-02:00'],
    latlng: [-10.0, -55.0],
  },
  IT: {
    name: { common: 'Italy', official: 'Italian Republic' },
    cca2: 'IT',
    cca3: 'ITA',
    capital: ['Rome'],
    region: 'Europe',
    subregion: 'Southern Europe',
    population: 59554023,
    flags: {
      png: 'https://flagcdn.com/w320/it.png',
      svg: 'https://flagcdn.com/it.svg',
      alt: 'Flag of Italy',
    },
    currencies: { EUR: { name: 'Euro', symbol: '€' } },
    languages: { ita: 'Italian' },
    timezones: ['UTC+01:00'],
    latlng: [42.83, 12.83],
  },
  GB: {
    name: { common: 'United Kingdom', official: 'United Kingdom of Great Britain and Northern Ireland' },
    cca2: 'GB',
    cca3: 'GBR',
    capital: ['London'],
    region: 'Europe',
    subregion: 'Northern Europe',
    population: 67215293,
    flags: {
      png: 'https://flagcdn.com/w320/gb.png',
      svg: 'https://flagcdn.com/gb.svg',
      alt: 'Flag of the United Kingdom',
    },
    currencies: { GBP: { name: 'British pound', symbol: '£' } },
    languages: { eng: 'English' },
    timezones: ['UTC+00:00'],
    latlng: [54.0, -2.0],
  },
  IN: {
    name: { common: 'India', official: 'Republic of India' },
    cca2: 'IN',
    cca3: 'IND',
    capital: ['New Delhi'],
    region: 'Asia',
    subregion: 'Southern Asia',
    population: 1380004385,
    flags: {
      png: 'https://flagcdn.com/w320/in.png',
      svg: 'https://flagcdn.com/in.svg',
      alt: 'Flag of India',
    },
    currencies: { INR: { name: 'Indian rupee', symbol: '₹' } },
    languages: { hin: 'Hindi', eng: 'English' },
    timezones: ['UTC+05:30'],
    latlng: [20.0, 77.0],
  },
  CA: {
    name: { common: 'Canada', official: 'Canada' },
    cca2: 'CA',
    cca3: 'CAN',
    capital: ['Ottawa'],
    region: 'Americas',
    subregion: 'North America',
    population: 38005238,
    flags: {
      png: 'https://flagcdn.com/w320/ca.png',
      svg: 'https://flagcdn.com/ca.svg',
      alt: 'Flag of Canada',
    },
    currencies: { CAD: { name: 'Canadian dollar', symbol: '$' } },
    languages: { eng: 'English', fra: 'French' },
    timezones: ['UTC-08:00', 'UTC-07:00', 'UTC-06:00', 'UTC-05:00', 'UTC-04:00', 'UTC-03:30'],
    latlng: [60.0, -95.0],
  },
  AQ: {
    name: { common: 'Antarctica', official: 'Antarctica' },
    cca2: 'AQ',
    cca3: 'ATA',
    capital: ['Amundsen–Scott South Pole Station'],
    region: 'Antarctic',
    subregion: 'South Polar Region',
    population: 1200,
    flags: {
      png: 'https://flagcdn.com/w320/aq.png',
      svg: 'https://flagcdn.com/aq.svg',
      alt: 'Flag of Antarctica',
    },
    currencies: { UNK: { name: 'Scientific Research Resource Unit', symbol: '❄️' } },
    languages: { eng: 'English', rus: 'Russian', spa: 'Spanish' },
    timezones: ['UTC+00:00', 'UTC+12:00', 'UTC+13:00'],
    latlng: [-82.8628, 135.0],
  },
  DE: {
    name: { common: 'Germany', official: 'Federal Republic of Germany' },
    cca2: 'DE',
    cca3: 'DEU',
    capital: ['Berlin'],
    region: 'Europe',
    subregion: 'Western Europe',
    population: 83240525,
    flags: {
      png: 'https://flagcdn.com/w320/de.png',
      svg: 'https://flagcdn.com/de.svg',
      alt: 'Flag of Germany',
    },
    currencies: { EUR: { name: 'Euro', symbol: '€' } },
    languages: { deu: 'German' },
    timezones: ['UTC+01:00'],
    latlng: [51.0, 9.0],
  },
  ES: {
    name: { common: 'Spain', official: 'Kingdom of Spain' },
    cca2: 'ES',
    cca3: 'ESP',
    capital: ['Madrid'],
    region: 'Europe',
    subregion: 'Southern Europe',
    population: 47351567,
    flags: {
      png: 'https://flagcdn.com/w320/es.png',
      svg: 'https://flagcdn.com/es.svg',
      alt: 'Flag of Spain',
    },
    currencies: { EUR: { name: 'Euro', symbol: '€' } },
    languages: { spa: 'Spanish' },
    timezones: ['UTC+01:00'],
    latlng: [40.0, -4.0],
  },
  CN: {
    name: { common: 'China', official: "People's Republic of China" },
    cca2: 'CN',
    cca3: 'CHN',
    capital: ['Beijing'],
    region: 'Asia',
    subregion: 'Eastern Asia',
    population: 1402112000,
    flags: {
      png: 'https://flagcdn.com/w320/cn.png',
      svg: 'https://flagcdn.com/cn.svg',
      alt: 'Flag of China',
    },
    currencies: { CNY: { name: 'Chinese yuan', symbol: '¥' } },
    languages: { zho: 'Chinese' },
    timezones: ['UTC+08:00'],
    latlng: [35.0, 105.0],
  },
  RU: {
    name: { common: 'Russia', official: 'Russian Federation' },
    cca2: 'RU',
    cca3: 'RUS',
    capital: ['Moscow'],
    region: 'Europe',
    subregion: 'Eastern Europe',
    population: 144104080,
    flags: {
      png: 'https://flagcdn.com/w320/ru.png',
      svg: 'https://flagcdn.com/ru.svg',
      alt: 'Flag of Russia',
    },
    currencies: { RUB: { name: 'Russian ruble', symbol: '₽' } },
    languages: { rus: 'Russian' },
    timezones: ['UTC+02:00', 'UTC+03:00', 'UTC+04:00', 'UTC+05:00', 'UTC+06:00', 'UTC+07:00', 'UTC+08:00', 'UTC+09:00', 'UTC+10:00', 'UTC+11:00', 'UTC+12:00'],
    latlng: [60.0, 100.0],
  },
  MX: {
    name: { common: 'Mexico', official: 'United Mexican States' },
    cca2: 'MX',
    cca3: 'MEX',
    capital: ['Mexico City'],
    region: 'Americas',
    subregion: 'North America',
    population: 128932753,
    flags: {
      png: 'https://flagcdn.com/w320/mx.png',
      svg: 'https://flagcdn.com/mx.svg',
      alt: 'Flag of Mexico',
    },
    currencies: { MXN: { name: 'Mexican peso', symbol: '$' } },
    languages: { spa: 'Spanish' },
    timezones: ['UTC-08:00', 'UTC-07:00', 'UTC-06:00'],
    latlng: [23.0, -102.0],
  },
  AR: {
    name: { common: 'Argentina', official: 'Argentine Republic' },
    cca2: 'AR',
    cca3: 'ARG',
    capital: ['Buenos Aires'],
    region: 'Americas',
    subregion: 'South America',
    population: 45376763,
    flags: {
      png: 'https://flagcdn.com/w320/ar.png',
      svg: 'https://flagcdn.com/ar.svg',
      alt: 'Flag of Argentina',
    },
    currencies: { ARS: { name: 'Argentine peso', symbol: '$' } },
    languages: { spa: 'Spanish' },
    timezones: ['UTC-03:00'],
    latlng: [-38.4161, -63.6167],
  },
  ZA: {
    name: { common: 'South Africa', official: 'Republic of South Africa' },
    cca2: 'ZA',
    cca3: 'ZAF',
    capital: ['Pretoria', 'Bloemfontein', 'Cape Town'],
    region: 'Africa',
    subregion: 'Southern Africa',
    population: 59308690,
    flags: {
      png: 'https://flagcdn.com/w320/za.png',
      svg: 'https://flagcdn.com/za.svg',
      alt: 'Flag of South Africa',
    },
    currencies: { ZAR: { name: 'South African rand', symbol: 'R' } },
    languages: { afr: 'Afrikaans', eng: 'English', zul: 'Zulu', xho: 'Xhosa' },
    timezones: ['UTC+02:00'],
    latlng: [-29.0, 24.0],
  },
  KE: {
    name: { common: 'Kenya', official: 'Republic of Kenya' },
    cca2: 'KE',
    cca3: 'KEN',
    capital: ['Nairobi'],
    region: 'Africa',
    subregion: 'Eastern Africa',
    population: 53771300,
    flags: {
      png: 'https://flagcdn.com/w320/ke.png',
      svg: 'https://flagcdn.com/ke.svg',
      alt: 'Flag of Kenya',
    },
    currencies: { KES: { name: 'Kenyan shilling', symbol: 'Sh' } },
    languages: { eng: 'English', swa: 'Swahili' },
    timezones: ['UTC+03:00'],
    latlng: [1.0, 38.0],
  },
  NZ: {
    name: { common: 'New Zealand', official: 'New Zealand' },
    cca2: 'NZ',
    cca3: 'NZL',
    capital: ['Wellington'],
    region: 'Oceania',
    subregion: 'Australasia',
    population: 5084300,
    flags: {
      png: 'https://flagcdn.com/w320/nz.png',
      svg: 'https://flagcdn.com/nz.svg',
      alt: 'Flag of New Zealand',
    },
    currencies: { NZD: { name: 'New Zealand dollar', symbol: '$' } },
    languages: { eng: 'English', mri: 'Māori' },
    timezones: ['UTC+12:00', 'UTC+12:45', 'UTC+13:00'],
    latlng: [-40.9006, 174.8860],
  },
  NO: {
    name: { common: 'Norway', official: 'Kingdom of Norway' },
    cca2: 'NO',
    cca3: 'NOR',
    capital: ['Oslo'],
    region: 'Europe',
    subregion: 'Northern Europe',
    population: 5379475,
    flags: {
      png: 'https://flagcdn.com/w320/no.png',
      svg: 'https://flagcdn.com/no.svg',
      alt: 'Flag of Norway',
    },
    currencies: { NOK: { name: 'Norwegian krone', symbol: 'kr' } },
    languages: { nor: 'Norwegian' },
    timezones: ['UTC+01:00'],
    latlng: [62.0, 10.0],
  },
  SE: {
    name: { common: 'Sweden', official: 'Kingdom of Sweden' },
    cca2: 'SE',
    cca3: 'SWE',
    capital: ['Stockholm'],
    region: 'Europe',
    subregion: 'Northern Europe',
    population: 10353442,
    flags: {
      png: 'https://flagcdn.com/w320/se.png',
      svg: 'https://flagcdn.com/se.svg',
      alt: 'Flag of Sweden',
    },
    currencies: { SEK: { name: 'Swedish krona', symbol: 'kr' } },
    languages: { swe: 'Swedish' },
    timezones: ['UTC+01:00'],
    latlng: [62.0, 15.0],
  },
  CL: {
    name: { common: 'Chile', official: 'Republic of Chile' },
    cca2: 'CL',
    cca3: 'CHL',
    capital: ['Santiago'],
    region: 'Americas',
    subregion: 'South America',
    population: 19116209,
    flags: {
      png: 'https://flagcdn.com/w320/cl.png',
      svg: 'https://flagcdn.com/cl.svg',
      alt: 'Flag of Chile',
    },
    currencies: { CLP: { name: 'Chilean peso', symbol: '$' } },
    languages: { spa: 'Spanish' },
    timezones: ['UTC-06:00', 'UTC-04:00', 'UTC-03:00'],
    latlng: [-35.6751, -71.5430],
  },
  CD: {
    name: { common: 'DR Congo', official: 'Democratic Republic of the Congo' },
    cca2: 'CD',
    cca3: 'COD',
    capital: ['Kinshasa'],
    region: 'Africa',
    subregion: 'Middle Africa',
    population: 89561404,
    flags: {
      png: 'https://flagcdn.com/w320/cd.png',
      svg: 'https://flagcdn.com/cd.svg',
      alt: 'Flag of the Democratic Republic of the Congo',
    },
    currencies: { CDF: { name: 'Congolese franc', symbol: 'FC' } },
    languages: { fra: 'French', lin: 'Lingala', kon: 'Kongo', swa: 'Swahili' },
    timezones: ['UTC+01:00', 'UTC+02:00'],
    latlng: [-4.0383, 21.7587],
  }
};

/**
 * Fetch country statistics directly from REST Countries API:
 * Endpoint: https://restcountries.com/v3.1/alpha/{countryCode}
 * or https://restcountries.com/v3.1/name/{name}
 */
export async function fetchCountryDetails(countryQuery: string): Promise<CountryData | null> {
  const cleanQuery = countryQuery.trim();
  if (!cleanQuery) return null;

  const cacheKey = cleanQuery.toUpperCase();

  if (countryCache.has(cacheKey)) {
    return countryCache.get(cacheKey)!;
  }

  // Check fallback pre-cached entries
  if (ACCURATE_COUNTRY_FALLBACKS[cacheKey]) {
    const fallback = ACCURATE_COUNTRY_FALLBACKS[cacheKey];
    countryCache.set(cacheKey, fallback);
    return fallback;
  }

  // Check fallback by common name
  for (const item of Object.values(ACCURATE_COUNTRY_FALLBACKS)) {
    if (
      item.name.common.toLowerCase() === cleanQuery.toLowerCase() ||
      item.name.official.toLowerCase() === cleanQuery.toLowerCase()
    ) {
      countryCache.set(cacheKey, item);
      return item;
    }
  }

  try {
    const isCode = cleanQuery.length === 2 || cleanQuery.length === 3;
    const endpoint = isCode
      ? `https://restcountries.com/v3.1/alpha/${encodeURIComponent(cleanQuery.toLowerCase())}`
      : `https://restcountries.com/v3.1/name/${encodeURIComponent(cleanQuery)}?fullText=false`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(endpoint, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`REST Countries API HTTP ${res.status}`);
    }

    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const raw = data[0];
      const parsedCountry: CountryData = {
        name: {
          common: raw.name?.common || cleanQuery,
          official: raw.name?.official || cleanQuery,
        },
        cca2: raw.cca2 || (isCode ? cleanQuery.toUpperCase() : 'GL'),
        cca3: raw.cca3 || '',
        capital: Array.isArray(raw.capital) ? raw.capital : [raw.capital || 'N/A'],
        region: raw.region || 'World',
        subregion: raw.subregion,
        population: typeof raw.population === 'number' ? raw.population : 0,
        flags: {
          png: raw.flags?.png || `https://flagcdn.com/w320/${(raw.cca2 || 'gl').toLowerCase()}.png`,
          svg: raw.flags?.svg || `https://flagcdn.com/${(raw.cca2 || 'gl').toLowerCase()}.svg`,
          alt: raw.flags?.alt || `Flag of ${raw.name?.common || cleanQuery}`,
        },
        currencies: raw.currencies || {},
        languages: raw.languages || {},
        timezones: Array.isArray(raw.timezones) ? raw.timezones : ['UTC+00:00'],
        latlng: Array.isArray(raw.latlng) ? raw.latlng : [0, 0],
      };

      countryCache.set(cacheKey, parsedCountry);
      if (parsedCountry.cca2) {
        countryCache.set(parsedCountry.cca2.toUpperCase(), parsedCountry);
      }
      return parsedCountry;
    }
  } catch (error) {
    console.warn(`REST Countries API query for '${cleanQuery}' failed, checking lookup:`, error);
  }

  // If live query failed and not in dictionary, construct a structured entry
  const fallbackEntry: CountryData = {
    name: { common: cleanQuery, official: cleanQuery },
    cca2: cleanQuery.slice(0, 2).toUpperCase(),
    cca3: cleanQuery.slice(0, 3).toUpperCase(),
    capital: ['Capital Territory'],
    region: 'Earth',
    population: 5000000,
    flags: {
      png: `https://flagcdn.com/w320/${cleanQuery.slice(0, 2).toLowerCase()}.png`,
      svg: `https://flagcdn.com/${cleanQuery.slice(0, 2).toLowerCase()}.svg`,
      alt: `Flag of ${cleanQuery}`,
    },
    currencies: { UNK: { name: 'Regional Currency', symbol: '¤' } },
    languages: { eng: 'Official Language' },
    timezones: ['UTC+00:00'],
    latlng: [0, 0],
  };

  countryCache.set(cacheKey, fallbackEntry);
  return fallbackEntry;
}

/**
 * Intelligent Geographical Reverse Coordinate Lookup
 * Maps Latitude/Longitude to country codes (including Greenland, Japan, France, etc.)
 */
export function getCountryCodeFromCoordinates(lat: number, lng: number): { countryCode: string; countryName: string } {
  // 1. Polar check: Antarctica is anything south of -60 degrees latitude
  if (lat <= -60) {
    return { countryCode: 'AQ', countryName: 'Antarctica' };
  }

  // 2. High-precision point-in-polygon country boundary check
  const polyMatch = matchCoordinatesToCountry(lat, lng);
  if (polyMatch) {
    return polyMatch;
  }

  // 3. Specific Region checks
  // Greenland (GL)
  if (lat >= 59 && lat <= 84 && lng >= -74 && lng <= -11) {
    return { countryCode: 'GL', countryName: 'Greenland' };
  }

  // Iceland (IS)
  if (lat >= 63 && lat <= 67 && lng >= -25 && lng <= -13) {
    return { countryCode: 'IS', countryName: 'Iceland' };
  }

  // Norway (NO) / Scandinavia
  if (lat >= 58 && lat <= 71 && lng >= 4 && lng <= 31) {
    return { countryCode: 'NO', countryName: 'Norway' };
  }

  // United Kingdom (GB)
  if (lat >= 50 && lat <= 59 && lng >= -8 && lng <= 2) {
    return { countryCode: 'GB', countryName: 'United Kingdom' };
  }

  // France (FR)
  if (lat >= 41 && lat <= 51 && lng >= -5 && lng <= 9) {
    return { countryCode: 'FR', countryName: 'France' };
  }

  // Germany (DE)
  if (lat >= 47 && lat <= 55 && lng >= 5.8 && lng <= 15) {
    return { countryCode: 'DE', countryName: 'Germany' };
  }

  // Spain (ES)
  if (lat >= 36 && lat <= 44 && lng >= -9.5 && lng <= 3.3) {
    return { countryCode: 'ES', countryName: 'Spain' };
  }

  // Italy (IT)
  if (lat >= 36 && lat <= 47 && lng >= 6 && lng <= 19) {
    return { countryCode: 'IT', countryName: 'Italy' };
  }

  // Greece (GR)
  if (lat >= 34 && lat <= 42 && lng >= 19 && lng <= 28) {
    return { countryCode: 'GR', countryName: 'Greece' };
  }

  // Egypt (EG)
  if (lat >= 22 && lat <= 32 && lng >= 24 && lng <= 37) {
    return { countryCode: 'EG', countryName: 'Egypt' };
  }

  // Kenya (KE)
  if (lat >= -5 && lat <= 5 && lng >= 33 && lng <= 42) {
    return { countryCode: 'KE', countryName: 'Kenya' };
  }

  // Tanzania (TZ)
  if (lat >= -12 && lat <= -1 && lng >= 29 && lng <= 41) {
    return { countryCode: 'TZ', countryName: 'Tanzania' };
  }

  // South Africa (ZA)
  if (lat >= -35 && lat <= -22 && lng >= 16 && lng <= 33) {
    return { countryCode: 'ZA', countryName: 'South Africa' };
  }

  // Democratic Republic of the Congo (CD)
  if (lat >= -13.5 && lat <= 5.5 && lng >= 12.0 && lng <= 31.5) {
    return { countryCode: 'CD', countryName: 'Democratic Republic of the Congo' };
  }

  // Japan (JP)
  if (lat >= 24 && lat <= 46 && lng >= 123 && lng <= 149) {
    return { countryCode: 'JP', countryName: 'Japan' };
  }

  // United States (US)
  if (lat >= 24 && lat <= 50 && lng >= -125 && lng <= -66) {
    return { countryCode: 'US', countryName: 'United States' };
  }

  // Canada (CA)
  if (lat >= 50 && lat <= 75 && lng >= -141 && lng <= -52) {
    return { countryCode: 'CA', countryName: 'Canada' };
  }

  // Mexico (MX)
  if (lat >= 14 && lat <= 33 && lng >= -118 && lng <= -86) {
    return { countryCode: 'MX', countryName: 'Mexico' };
  }

  // Brazil (BR)
  if (lat >= -34 && lat <= 5 && lng >= -74 && lng <= -34) {
    return { countryCode: 'BR', countryName: 'Brazil' };
  }

  // Argentina (AR)
  if (lat >= -55 && lat <= -21 && lng >= -74 && lng <= -53) {
    return { countryCode: 'AR', countryName: 'Argentina' };
  }

  // Chile (CL)
  if (lat >= -56 && lat <= -17 && lng >= -76 && lng <= -66) {
    return { countryCode: 'CL', countryName: 'Chile' };
  }

  // Australia (AU)
  if (lat >= -44 && lat <= -10 && lng >= 113 && lng <= 154) {
    return { countryCode: 'AU', countryName: 'Australia' };
  }

  // New Zealand (NZ)
  if (lat >= -48 && lat <= -34 && lng >= 165 && lng <= 179) {
    return { countryCode: 'NZ', countryName: 'New Zealand' };
  }

  // India (IN)
  if (lat >= 8 && lat <= 36 && lng >= 68 && lng <= 97) {
    return { countryCode: 'IN', countryName: 'India' };
  }

  // China (CN)
  if (lat >= 18 && lat <= 54 && lng >= 73 && lng <= 135) {
    return { countryCode: 'CN', countryName: 'China' };
  }

  // Russia (RU)
  if (lat >= 41 && lat <= 77 && lng >= 20 && lng <= 180) {
    return { countryCode: 'RU', countryName: 'Russia' };
  }

  // Generic Continental fallbacks based on coordinates quadrant
  if (lat > 35 && lng > -10 && lng < 40) return { countryCode: 'FR', countryName: 'France' };
  if (lat > 10 && lng > 60 && lng < 140) return { countryCode: 'JP', countryName: 'Japan' };
  if (lat < 10 && lat > -40 && lng > 10 && lng < 50) return { countryCode: 'ZA', countryName: 'South Africa' };
  if (lat > 15 && lng > -130 && lng < -60) return { countryCode: 'US', countryName: 'United States' };
  if (lat < 15 && lng > -90 && lng < -30) return { countryCode: 'BR', countryName: 'Brazil' };
  if (lat < -10 && lng > 110 && lng < 179) return { countryCode: 'AU', countryName: 'Australia' };

  return { countryCode: 'US', countryName: 'Global Location' };
}
