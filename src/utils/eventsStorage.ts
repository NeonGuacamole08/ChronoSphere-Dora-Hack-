import { ScavengerEvent, EventBroadcastHint, EventDiscoveryRecord, LeaderboardParticipant, Capsule } from '../types';
import { SEED_EVENTS, SEED_EVENT_CAPSULES } from '../data/seedEvents';

const EVENTS_STORAGE_KEY = 'chronospheres_events_v3';
const ACTIVE_EVENT_KEY = 'chronospheres_active_event_id_v3';
const DISCOVERIES_STORAGE_KEY = 'chronospheres_discoveries_v3';
const USER_JOINED_EVENTS_KEY = 'chronospheres_joined_events_v3';

export const eventsStorage = {
  getEvents: (): ScavengerEvent[] => {
    try {
      const stored = localStorage.getItem(EVENTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ScavengerEvent[];
        // Merge with seed events if missing
        const existingIds = new Set(parsed.map((e) => e.id));
        const merged = [...parsed];
        for (const se of SEED_EVENTS) {
          if (!existingIds.has(se.id)) {
            merged.push(se);
          }
        }
        return merged;
      }
    } catch (e) {
      console.warn('Failed to load events from storage:', e);
    }
    return SEED_EVENTS;
  },

  saveEvents: (events: ScavengerEvent[]) => {
    try {
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
    } catch (e) {
      console.error('Failed to save events:', e);
    }
  },

  getJoinedEventIds: (): string[] => {
    try {
      const stored = localStorage.getItem(USER_JOINED_EVENTS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      // fallback
    }
    // By default, join the public global odyssey
    return ['event_global_odyssey'];
  },

  joinEvent: (eventId: string) => {
    try {
      const joined = eventsStorage.getJoinedEventIds();
      if (!joined.includes(eventId)) {
        joined.push(eventId);
        localStorage.setItem(USER_JOINED_EVENTS_KEY, JSON.stringify(joined));
      }
    } catch (e) {
      // ignore
    }
  },

  getActiveEventId: (): string | null => {
    try {
      return localStorage.getItem(ACTIVE_EVENT_KEY);
    } catch {
      return null;
    }
  },

  setActiveEventId: (eventId: string | null) => {
    try {
      if (eventId) {
        localStorage.setItem(ACTIVE_EVENT_KEY, eventId);
      } else {
        localStorage.removeItem(ACTIVE_EVENT_KEY);
      }
    } catch {
      // ignore
    }
  },

  createEvent: (eventData: Omit<ScavengerEvent, 'id' | 'hints_broadcasted' | 'discoveries' | 'created_at'>): ScavengerEvent => {
    const events = eventsStorage.getEvents();
    const newEvent: ScavengerEvent = {
      ...eventData,
      id: `event_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      hints_broadcasted: [],
      discoveries: [],
      created_at: new Date().toISOString(),
    };
    const updated = [newEvent, ...events];
    eventsStorage.saveEvents(updated);
    eventsStorage.joinEvent(newEvent.id);
    return newEvent;
  },

  verifyAccessCode: (code: string): { success: boolean; event?: ScavengerEvent; message: string } => {
    const events = eventsStorage.getEvents();
    const normalized = code.trim().toUpperCase();
    const match = events.find(
      (e) => e.secret_access_code && e.secret_access_code.toUpperCase() === normalized
    );

    if (match) {
      eventsStorage.joinEvent(match.id);
      return { success: true, event: match, message: `Access granted to "${match.title}"!` };
    }
    return { success: false, message: 'Invalid secret access code. Please check with your host.' };
  },

  canUserAccessEvent: (event: ScavengerEvent, username: string): boolean => {
    if (event.is_public) return true;
    const joined = eventsStorage.getJoinedEventIds();
    if (joined.includes(event.id)) return true;

    // Check direct handle invitation (@username)
    if (event.invited_handles && event.invited_handles.length > 0) {
      const cleanUser = username.toLowerCase().replace('@', '').trim();
      const isInvited = event.invited_handles.some((h) => {
        const cleanHandle = h.toLowerCase().replace('@', '').trim();
        return cleanHandle === cleanUser || cleanHandle === 'guest' || cleanHandle === 'explorer';
      });
      if (isInvited) return true;
    }

    // Check creator
    if (event.creator_username.toLowerCase().replace('@', '') === username.toLowerCase().replace('@', '')) {
      return true;
    }

    return false;
  },

  recordDiscovery: (eventId: string, capsuleId: string, username: string): { isNew: boolean; totalFound: number } => {
    const events = eventsStorage.getEvents();
    const event = events.find((e) => e.id === eventId);
    if (!event) return { isNew: false, totalFound: 0 };

    if (!event.discoveries) event.discoveries = [];

    const existing = event.discoveries.find(
      (d) => d.capsule_id === capsuleId && d.username.toLowerCase() === username.toLowerCase()
    );

    if (existing) {
      const userFound = event.discoveries.filter((d) => d.username.toLowerCase() === username.toLowerCase()).length;
      return { isNew: false, totalFound: userFound };
    }

    const newRecord: EventDiscoveryRecord = {
      event_id: eventId,
      capsule_id: capsuleId,
      username,
      discovered_at: new Date().toISOString(),
    };

    event.discoveries.push(newRecord);
    eventsStorage.saveEvents(events);

    // Trigger window event so all views update in real-time
    try {
      window.dispatchEvent(new CustomEvent('chronospheres_discovery', { detail: newRecord }));
    } catch {
      // ignore
    }

    const userFound = event.discoveries.filter((d) => d.username.toLowerCase() === username.toLowerCase()).length;
    return { isNew: true, totalFound: userFound };
  },

  broadcastHint: (eventId: string, capsuleId: string, capsuleTitle: string, hintText: string): EventBroadcastHint | null => {
    const events = eventsStorage.getEvents();
    const event = events.find((e) => e.id === eventId);
    if (!event) return null;

    const newHint: EventBroadcastHint = {
      id: `hint_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      event_id: eventId,
      capsule_id: capsuleId,
      capsule_title: capsuleTitle,
      hint_text: hintText.trim(),
      sent_at: new Date().toISOString(),
    };

    if (!event.hints_broadcasted) event.hints_broadcasted = [];
    event.hints_broadcasted.push(newHint);
    eventsStorage.saveEvents(events);

    // Dispatch global in-app notification event
    try {
      window.dispatchEvent(new CustomEvent('chronospheres_hint_broadcast', { detail: newHint }));
    } catch {
      // ignore
    }

    return newHint;
  },

  calculateLeaderboard: (event: ScavengerEvent, currentUsername: string): LeaderboardParticipant[] => {
    const discoveries = event.discoveries || [];
    const eventStartTime = new Date(event.start_timestamp).getTime();

    // Group discoveries by username
    const userStatsMap = new Map<string, { count: number; lastTime: number; firstTime: number }>();

    // Include standard competitors if empty
    const competitorSeed = [
      { username: '@carl_sagan_vault', count: 3, lastTime: eventStartTime + 6 * 3600 * 1000 },
      { username: '@kai_traveler', count: 2, lastTime: eventStartTime + 8 * 3600 * 1000 },
      { username: '@elena_star', count: 2, lastTime: eventStartTime + 9 * 3600 * 1000 },
      { username: '@maya', count: 1, lastTime: eventStartTime + 10 * 3600 * 1000 },
    ];

    if (discoveries.length === 0 && event.is_public) {
      for (const comp of competitorSeed) {
        userStatsMap.set(comp.username, {
          count: comp.count,
          lastTime: comp.lastTime,
          firstTime: eventStartTime,
        });
      }
    } else {
      for (const d of discoveries) {
        const time = new Date(d.discovered_at).getTime();
        const current = userStatsMap.get(d.username) || { count: 0, lastTime: time, firstTime: time };
        current.count += 1;
        if (time > current.lastTime) current.lastTime = time;
        if (time < current.firstTime) current.firstTime = time;
        userStatsMap.set(d.username, current);
      }
    }

    // Ensure current user is in the list
    if (!userStatsMap.has(currentUsername)) {
      userStatsMap.set(currentUsername, {
        count: discoveries.filter((d) => d.username.toLowerCase() === currentUsername.toLowerCase()).length,
        lastTime: Date.now(),
        firstTime: Date.now(),
      });
    }

    const participants: LeaderboardParticipant[] = [];

    userStatsMap.forEach((val, uname) => {
      const elapsedSeconds = Math.max(1, Math.round((val.lastTime - eventStartTime) / 1000));
      const cleanUname = uname.startsWith('@') ? uname.substring(1) : uname;
      participants.push({
        username: uname,
        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanUname)}`,
        capsules_found: val.count,
        total_event_capsules: event.capsule_ids.length,
        completion_time_seconds: val.count > 0 ? elapsedSeconds : undefined,
        last_discovery_at: new Date(val.lastTime).toISOString(),
        is_current_user: uname.toLowerCase() === currentUsername.toLowerCase(),
      });
    });

    // Rank: 1. Total capsules found descending, 2. completion time ascending
    participants.sort((a, b) => {
      if (b.capsules_found !== a.capsules_found) {
        return b.capsules_found - a.capsules_found;
      }
      return (a.completion_time_seconds || 999999) - (b.completion_time_seconds || 999999);
    });

    return participants;
  },

  updateEvent: (updatedEvent: ScavengerEvent): void => {
    const events = eventsStorage.getEvents();
    const index = events.findIndex((e) => e.id === updatedEvent.id);
    if (index !== -1) {
      events[index] = updatedEvent;
      eventsStorage.saveEvents(events);
    }
  },
};
