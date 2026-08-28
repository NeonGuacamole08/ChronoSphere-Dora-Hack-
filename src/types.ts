export interface Pin {
  id?: string;
  user_id?: string | null;
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  media_urls?: string[];
  is_public: boolean;
  created_at?: string;
}

export type AttachmentType = 'photo' | 'image' | 'audio' | 'letter' | 'text' | 'document';

export interface CapsuleAttachment {
  id: string;
  type: AttachmentType;
  title?: string;
  name?: string;
  file_name?: string;
  data_url?: string;
  url?: string;
  text_content?: string;
  content?: string;
  size_bytes?: number;
  size?: number;
  mime_type?: string;
  mimeType?: string;
  duration?: number;
  created_at?: string;
}

export interface Capsule {
  id: string;
  user_id?: string | null;
  title: string;
  message: string;
  created_at: string;
  unlock_timestamp: string; // ISO 8601 string
  lat: number;
  lng: number;
  location_name: string;
  country_code: string;
  country_name: string;
  creator_username: string;
  creator_email: string;
  access_type: 'public' | 'private';
  public_unlock_mode?: 'instant_find' | 'time_locked';
  unlock_radius_meters?: number;
  recipient_username?: string;
  recipient_email?: string;
  tagged_users?: string[];
  photo_url?: string;
  audio_url?: string;
  audio_duration?: number;
  attachments?: CapsuleAttachment[];
  spotify_uri?: string;
  spotify_track_id?: string;
  spotify_title?: string;
  spotify_artist?: string;
  arweave_tx_id: string;
  encryption_signature: string;
  is_encrypted: boolean;
  is_draft?: boolean;
  notified: boolean;
  tags?: string[];
  is_found?: boolean;
  event_id?: string;
  event_hint?: string;
  order_in_hunt?: number;
}

export interface EventBroadcastHint {
  id: string;
  event_id: string;
  capsule_id: string;
  capsule_title: string;
  hint_text: string;
  sent_at: string;
}

export interface EventDiscoveryRecord {
  event_id: string;
  capsule_id: string;
  username: string;
  discovered_at: string;
}

export interface LeaderboardParticipant {
  username: string;
  avatar_url?: string;
  capsules_found: number;
  total_event_capsules: number;
  completion_time_seconds?: number;
  last_discovery_at?: string;
  is_current_user?: boolean;
}

export interface ScavengerEvent {
  id: string;
  title: string;
  description: string;
  creator_id: string;
  creator_username: string;
  is_public: boolean;
  secret_access_code?: string;
  invited_handles?: string[];
  start_timestamp: string; // ISO 8601 string
  end_timestamp: string; // ISO 8601 string
  capsule_ids: string[];
  banner_url?: string;
  theme_color?: string;
  hints_broadcasted: EventBroadcastHint[];
  discoveries?: EventDiscoveryRecord[];
  created_at: string;
}

export interface CountryData {
  name: {
    common: string;
    official: string;
  };
  cca2: string;
  cca3: string;
  capital?: string[];
  region: string;
  subregion?: string;
  population: number;
  flags: {
    png: string;
    svg: string;
    alt?: string;
  };
  currencies?: Record<string, { name: string; symbol: string }>;
  languages?: Record<string, string>;
  timezones?: string[];
  latlng: [number, number];
  area?: number;
}

export interface Coordinates {
  lat: number;
  lng: number;
  name?: string;
  country?: string;
}

export interface ArweaveBackupPayload {
  app: string;
  version: string;
  capsule_id: string;
  arweave_tx_id: string;
  created_at: string;
  unlock_timestamp: string;
  coordinates: {
    lat: number;
    lng: number;
    location_name: string;
    country_name: string;
  };
  access_control: {
    type: 'public' | 'private';
    creator: string;
    recipient?: string;
  };
  encrypted_envelope: {
    algorithm: string;
    ciphertext: string;
    iv: string;
    checksum: string;
    media_links: {
      photo?: string;
      audio?: string;
      spotify_uri?: string;
    };
  };
  verification_status: 'verified_on_arweave_permaweb' | 'pending';
}
