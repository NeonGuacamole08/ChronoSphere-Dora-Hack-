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
