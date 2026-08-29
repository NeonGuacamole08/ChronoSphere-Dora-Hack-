import { SupportedLanguage } from './i18n';

// Memory cache for translated texts to make dynamic UI snappy & prevent duplicate API requests
const translationMemoryCache = new Map<string, string>();
const LOCAL_CACHE_PREFIX = 'chronospheres_trans_v2_';

function getCacheKey(text: string, targetLang: string): string {
  return `${targetLang}:::${text.trim()}`;
}

/**
 * Translate dynamic user-generated content (capsule titles, letters/memories, hints, chat messages)
 * into the selected target language.
 *
 * Uses /api/translate backend endpoint (Gemini/Google Translate) with smart fallbacks & client-side caching.
 */
export async function translateDynamicText(
  text: string,
  targetLang: SupportedLanguage = 'en',
  sourceLang: string = 'auto'
): Promise<string> {
  if (!text || !text.trim()) return text;
  
  // If target is English and source looks English, or text is pure numbers/symbols
  if (/^[\d\s\p{P}]+$/u.test(text)) return text;

  const cacheKey = getCacheKey(text, targetLang);

  // 1. Check in-memory cache
  if (translationMemoryCache.has(cacheKey)) {
    return translationMemoryCache.get(cacheKey)!;
  }

  // 2. Check localStorage cache
  try {
    const stored = localStorage.getItem(LOCAL_CACHE_PREFIX + cacheKey);
    if (stored) {
      translationMemoryCache.set(cacheKey, stored);
      return stored;
    }
  } catch {
    // ignore localStorage read error
  }

  // 3. Request translation from backend API route
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        targetLanguage: targetLang,
        sourceLanguage: sourceLang,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.translatedText) {
        const result = data.translatedText;
        translationMemoryCache.set(cacheKey, result);
        try {
          localStorage.setItem(LOCAL_CACHE_PREFIX + cacheKey, result);
        } catch {}
        return result;
      }
    }
  } catch (err) {
    console.warn('[Translation API] Server translation error, falling back to direct endpoint:', err);
  }

  // 4. Fallback: Direct lightweight Google Translate public endpoint
  try {
    const encoded = encodeURIComponent(text);
    const gUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encoded}`;
    const gRes = await fetch(gUrl);
    if (gRes.ok) {
      const gData = await gRes.json();
      if (Array.isArray(gData) && Array.isArray(gData[0])) {
        const fullTranslation = gData[0].map((item: any) => item[0]).join('');
        if (fullTranslation) {
          translationMemoryCache.set(cacheKey, fullTranslation);
          try {
            localStorage.setItem(LOCAL_CACHE_PREFIX + cacheKey, fullTranslation);
          } catch {}
          return fullTranslation;
        }
      }
    }
  } catch (fallbackErr) {
    console.warn('[Translation] Fallback translation notice:', fallbackErr);
  }

  // Return original text if translation fails
  return text;
}

/**
 * Batch translate multiple strings at once
 */
export async function batchTranslateDynamicText(
  texts: string[],
  targetLang: SupportedLanguage
): Promise<string[]> {
  return Promise.all(texts.map((t) => translateDynamicText(t, targetLang)));
}
