import { getSupabaseClient, getRegisteredAccounts } from './supabase';
import { SupportedLanguage } from './i18n';

const LOCAL_STORAGE_VISITOR_TOKEN_KEY = 'chronospheres_visitor_token_v1';
const SESSION_STORAGE_SESSION_ID_KEY = 'chronospheres_session_id_v1';
const LOCAL_STORAGE_GUEST_VISITS_LOG = 'chronospheres_guest_visits_log_v1';

export interface GuestVisitRecord {
  id: string;
  session_id: string;
  visitor_token: string;
  user_id: string;
  is_guest: boolean;
  user_agent: string;
  preferred_language: SupportedLanguage;
  visited_at: string;
}

export interface LiveAnalyticsSummary {
  totalGuestHeadcount: number; // COUNT(DISTINCT session_id) from guest_visits
  totalCapsuleCreators: number; // COUNT(DISTINCT user_id) from capsules
  totalSessionsRecorded: number;
  totalUniqueVisitorTokens: number;
  uniqueVisitorTokens: number;
  totalGuestVisits: number;
  languageDistribution: Record<string, number>;
  creatorsList: Array<{
    userId: string;
    username: string;
    capsulesCount: number;
  }>;
  recentVisits: Array<{
    id: string;
    session_id: string;
    visitor_token: string;
    visited_at: string;
    preferred_language: string;
  }>;
  recentGuestVisits: Array<{
    session_id: string;
    visitor_token: string;
    is_guest: boolean;
    visited_at: string;
    preferred_language: string;
  }>;
  creatorBreakdown: {
    authenticatedUsersCount: number;
    guestCreatorsCount: number;
    distinctCreatorHandles: string[];
  };
}

/**
 * Get or create the unique visitor token (stored persistently in localStorage)
 */
export function getOrCreateVisitorToken(): string {
  try {
    let token = localStorage.getItem(LOCAL_STORAGE_VISITOR_TOKEN_KEY);
    if (!token) {
      token = `vis_${Math.random().toString(36).substring(2, 11)}_${Date.now().toString(36)}`;
      localStorage.setItem(LOCAL_STORAGE_VISITOR_TOKEN_KEY, token);
    }
    return token;
  } catch {
    return `vis_guest_${Date.now()}`;
  }
}

/**
 * Get or create the unique browser session ID (stored in sessionStorage for per-session tracking)
 */
export function getOrCreateSessionId(): string {
  try {
    let sessId = sessionStorage.getItem(SESSION_STORAGE_SESSION_ID_KEY);
    if (!sessId) {
      sessId = `sess_${Math.random().toString(36).substring(2, 11)}_${Date.now().toString(36)}`;
      sessionStorage.setItem(SESSION_STORAGE_SESSION_ID_KEY, sessId);
    }
    return sessId;
  } catch {
    return `sess_${Date.now()}`;
  }
}

/**
 * Log a visit when entering Guest Mode or loading the app
 * Inserts into Supabase `guest_visits` table and mirrors to server & localStorage
 */
export async function logGuestVisit(options?: {
  userId?: string;
  isGuest?: boolean;
  language?: SupportedLanguage;
}): Promise<void> {
  const visitorToken = getOrCreateVisitorToken();
  const sessionId = getOrCreateSessionId();
  const isGuest = options?.isGuest ?? true;
  const userId = options?.userId || (isGuest ? `guest_${visitorToken.slice(0, 10)}` : 'auth_user');
  const language = options?.language || 'en';
  const nowIso = new Date().toISOString();

  const record: GuestVisitRecord = {
    id: `gv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    session_id: sessionId,
    visitor_token: visitorToken,
    user_id: userId,
    is_guest: isGuest,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    preferred_language: language,
    visited_at: nowIso,
  };

  // 1. Save to local fallback cache
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_GUEST_VISITS_LOG);
    const list: GuestVisitRecord[] = raw ? JSON.parse(raw) : [];
    // Only log once per session_id in local storage if already recorded
    const existingIndex = list.findIndex((v) => v.session_id === sessionId);
    if (existingIndex >= 0) {
      list[existingIndex].visited_at = nowIso;
      list[existingIndex].preferred_language = language;
    } else {
      list.unshift(record);
    }
    // keep up to 100 recent sessions
    localStorage.setItem(LOCAL_STORAGE_GUEST_VISITS_LOG, JSON.stringify(list.slice(0, 100)));
  } catch (e) {
    console.warn('Local visitor logging notice:', e);
  }

  // 2. Insert into Supabase `guest_visits` table
  try {
    const client = getSupabaseClient();
    await client.from('guest_visits').insert({
      session_id: sessionId,
      visitor_token: visitorToken,
      user_id: userId,
      is_guest: isGuest,
      user_agent: record.user_agent,
      preferred_language: language,
      visited_at: nowIso,
    });
  } catch (supabaseErr) {
    // Graceful fallback if table does not exist yet or permissions are restricted
  }

  // 3. Dispatch to server analytics endpoint
  try {
    fetch('/api/analytics/log-visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    }).catch(() => {});
  } catch {}
}

/**
 * Fetch live analytics:
 * - Total Guest Headcount: COUNT(DISTINCT session_id) from guest_visits
 * - Total Capsule Creators: COUNT(DISTINCT user_id) from capsules
 */
export async function fetchLiveAnalytics(allCapsulesList?: any[]): Promise<LiveAnalyticsSummary> {
  let distinctGuestSessions = new Set<string>();
  let distinctVisitorTokens = new Set<string>();
  let recentVisits: Array<{
    id: string;
    session_id: string;
    visitor_token: string;
    visited_at: string;
    preferred_language: string;
    is_guest?: boolean;
  }> = [];
  let distinctCreatorIds = new Set<string>();
  let distinctCreatorHandles = new Set<string>();
  let guestCreatorCount = 0;
  let authCreatorCount = 0;
  let totalGuestVisits = 0;
  const languageDistribution: Record<string, number> = { en: 1 };
  const creatorMap = new Map<string, { userId: string; username: string; capsulesCount: number }>();

  // 1. Gather creator stats from local capsules cache & seed
  if (Array.isArray(allCapsulesList) && allCapsulesList.length > 0) {
    allCapsulesList.forEach((c) => {
      const creatorKey = c.creator_id || c.creator_email || c.creator_username || 'anonymous_creator';
      distinctCreatorIds.add(creatorKey);
      const handle = c.creator_username || c.creator_email || 'Explorer';
      if (c.creator_username) {
        distinctCreatorHandles.add(c.creator_username);
      }

      if (!creatorMap.has(creatorKey)) {
        creatorMap.set(creatorKey, { userId: creatorKey, username: handle, capsulesCount: 1 });
      } else {
        const item = creatorMap.get(creatorKey)!;
        item.capsulesCount++;
      }

      if (
        creatorKey.startsWith('guest_') ||
        (c.creator_username && c.creator_username.toLowerCase().includes('guest'))
      ) {
        guestCreatorCount++;
      } else {
        authCreatorCount++;
      }
    });
  }

  // Also include registered accounts as verified creators
  const regAccounts = getRegisteredAccounts();
  regAccounts.forEach((acc) => {
    distinctCreatorIds.add(acc.id);
    distinctCreatorHandles.add(acc.username);
    if (!creatorMap.has(acc.id)) {
      creatorMap.set(acc.id, { userId: acc.id, username: acc.username, capsulesCount: 0 });
    }
  });

  // 2. Query Supabase `guest_visits` & `capsules` tables
  try {
    const client = getSupabaseClient();

    // Query guest_visits
    const { data: visitsData, error: visitsError } = await client
      .from('guest_visits')
      .select('id, session_id, visitor_token, user_id, is_guest, preferred_language, visited_at')
      .order('visited_at', { ascending: false })
      .limit(200);

    if (!visitsError && Array.isArray(visitsData) && visitsData.length > 0) {
      totalGuestVisits = visitsData.length;
      visitsData.forEach((v) => {
        if (v.session_id) distinctGuestSessions.add(v.session_id);
        if (v.visitor_token) distinctVisitorTokens.add(v.visitor_token);
        if (v.preferred_language) {
          languageDistribution[v.preferred_language] = (languageDistribution[v.preferred_language] || 0) + 1;
        }
      });
      recentVisits = visitsData.slice(0, 10).map((v) => ({
        id: v.id || `v_${Math.random()}`,
        session_id: v.session_id || '',
        visitor_token: v.visitor_token || '',
        visited_at: v.visited_at || new Date().toISOString(),
        preferred_language: v.preferred_language || 'en',
        is_guest: v.is_guest ?? true,
      }));
    }

    // Query capsules for distinct user_id
    const { data: capsulesData, error: capError } = await client
      .from('capsules')
      .select('creator_id, creator_username, creator_email, user_id');

    if (!capError && Array.isArray(capsulesData) && capsulesData.length > 0) {
      capsulesData.forEach((row: any) => {
        const uId = row.user_id || row.creator_id || row.creator_email || row.creator_username;
        if (uId) {
          distinctCreatorIds.add(uId);
        }
        if (row.creator_username) {
          distinctCreatorHandles.add(row.creator_username);
        }
      });
    }
  } catch (err) {
    console.warn('Supabase analytics fetch notice:', err);
  }

  // 3. Fallback / Merge with local storage log
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_GUEST_VISITS_LOG);
    if (raw) {
      const localList: GuestVisitRecord[] = JSON.parse(raw);
      totalGuestVisits = Math.max(totalGuestVisits, localList.length);
      localList.forEach((v) => {
        if (v.session_id) distinctGuestSessions.add(v.session_id);
        if (v.visitor_token) distinctVisitorTokens.add(v.visitor_token);
        if (v.preferred_language) {
          languageDistribution[v.preferred_language] = (languageDistribution[v.preferred_language] || 0) + 1;
        }
      });
      if (recentVisits.length === 0) {
        recentVisits = localList.slice(0, 10).map((v) => ({
          id: v.id,
          session_id: v.session_id,
          visitor_token: v.visitor_token,
          visited_at: v.visited_at,
          preferred_language: v.preferred_language || 'en',
          is_guest: v.is_guest,
        }));
      }
    }
  } catch {}

  // Ensure current session is accounted for
  const currentSess = getOrCreateSessionId();
  const currentTok = getOrCreateVisitorToken();
  distinctGuestSessions.add(currentSess);
  distinctVisitorTokens.add(currentTok);
  if (recentVisits.length === 0) {
    recentVisits.push({
      id: 'current_session',
      session_id: currentSess,
      visitor_token: currentTok,
      visited_at: new Date().toISOString(),
      preferred_language: 'en',
      is_guest: true,
    });
  }

  const totalGuestHeadcount = Math.max(distinctGuestSessions.size, 1);
  const totalCapsuleCreators = Math.max(distinctCreatorIds.size, 1);
  const totalUniqueVisitorTokens = Math.max(distinctVisitorTokens.size, 1);
  const creatorsList = Array.from(creatorMap.values());

  return {
    totalGuestHeadcount,
    totalCapsuleCreators,
    totalSessionsRecorded: distinctGuestSessions.size,
    totalUniqueVisitorTokens,
    uniqueVisitorTokens: totalUniqueVisitorTokens,
    totalGuestVisits: Math.max(totalGuestVisits, distinctGuestSessions.size),
    languageDistribution,
    creatorsList,
    recentVisits,
    recentGuestVisits: recentVisits.map((v) => ({
      session_id: v.session_id,
      visitor_token: v.visitor_token,
      is_guest: v.is_guest ?? true,
      visited_at: v.visited_at,
      preferred_language: v.preferred_language,
    })),
    creatorBreakdown: {
      authenticatedUsersCount: Math.max(authCreatorCount, regAccounts.length),
      guestCreatorsCount: Math.max(guestCreatorCount, 1),
      distinctCreatorHandles: Array.from(distinctCreatorHandles),
    },
  };
}
