import React, { useState } from 'react';
import { Music, Disc, Sparkles, ExternalLink } from 'lucide-react';

interface SpotifyEmbedProps {
  spotifyUri?: string;
  onSelectTrack?: (track: { uri: string; id: string; title: string; artist: string }) => void;
  isEditable?: boolean;
}

// Popular curated atmospheric soundtracks for time capsules
const SUGGESTED_SOUNDTRACKS = [
  { id: '4cOdK2wGLETKBW3PvgPWqT', uri: 'spotify:track:4cOdK2wGLETKBW3PvgPWqT', title: 'Merry Christmas Mr. Lawrence', artist: 'Ryuichi Sakamoto', tag: 'Nostalgic' },
  { id: '1bDbXMyjaUIooNwFE9MO0N', uri: 'spotify:track:1bDbXMyjaUIooNwFE9MO0N', title: 'Holocene', artist: 'Bon Iver', tag: 'Open Nature' },
  { id: '37ZTPQh7bclh05rN6h2n74', uri: 'spotify:track:37ZTPQh7bclh05rN6h2n74', title: 'La Vie En Rose', artist: 'Édith Piaf', tag: 'Parisian' },
  { id: '612VcBwwACCR6cwE5L19i3', uri: 'spotify:track:612VcBwwACCR6cwE5L19i3', title: 'Hoppípolla', artist: 'Sigur Rós', tag: 'Celestial' },
  { id: '3AJwUDP919kvQ9QcozQPxg', uri: 'spotify:track:3AJwUDP919kvQ9QcozQPxg', title: 'Yellow', artist: 'Coldplay', tag: 'Memory' },
  { id: '3VbGC8u3l9089q8A3b9u6L', uri: 'spotify:track:3VbGC8u3l9089q8A3b9u6L', title: 'The Girl From Ipanema', artist: 'Stan Getz, Astrud Gilberto', tag: 'Sunset Bossa' },
];

/**
 * Extracts embed type and ID from a Spotify URI or URL
 */
export function parseSpotifyId(input: string): { type: 'track' | 'album' | 'playlist'; id: string } | null {
  if (!input) return null;

  // URI format: spotify:track:4cOdK2wGLETKBW3PvgPWqT
  const uriMatch = input.match(/spotify:(track|album|playlist):([a-zA-Z0-9]+)/);
  if (uriMatch) {
    return { type: uriMatch[1] as 'track' | 'album' | 'playlist', id: uriMatch[2] };
  }

  // URL format: https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT?si=...
  const urlMatch = input.match(/open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
  if (urlMatch) {
    return { type: urlMatch[1] as 'track' | 'album' | 'playlist', id: urlMatch[2] };
  }

  // Raw ID fallback
  if (/^[a-zA-Z0-9]{22}$/.test(input.trim())) {
    return { type: 'track', id: input.trim() };
  }

  return null;
}

export const SpotifyEmbed: React.FC<SpotifyEmbedProps> = ({
  spotifyUri,
  onSelectTrack,
  isEditable = false,
}) => {
  const [inputVal, setInputVal] = useState(spotifyUri || '');
  const parsed = parseSpotifyId(spotifyUri || inputVal);

  const handleInputChange = (val: string) => {
    setInputVal(val);
    const result = parseSpotifyId(val);
    if (result && onSelectTrack) {
      onSelectTrack({
        uri: `spotify:${result.type}:${result.id}`,
        id: result.id,
        title: 'Spotify Track',
        artist: 'Embedded Artist',
      });
    }
  };

  const handleSelectSuggested = (item: typeof SUGGESTED_SOUNDTRACKS[0]) => {
    setInputVal(item.uri);
    if (onSelectTrack) {
      onSelectTrack({
        uri: item.uri,
        id: item.id,
        title: item.title,
        artist: item.artist,
      });
    }
  };

  return (
    <div className="space-y-3">
      {isEditable && (
        <div className="p-3 rounded-xl parchment-subtle border border-amber-300/80 space-y-2.5">
          <label className="text-xs font-semibold text-amber-950 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-emerald-600" />
              Soundtrack (Spotify Track or Playlist)
            </span>
            <span className="text-[10px] text-emerald-800 font-mono">PKCE Compatible</span>
          </label>

          <div className="relative">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Paste Spotify Link or URI (e.g. spotify:track:4cOdK2wG...)"
              className="w-full text-xs px-3 py-2 pl-8 rounded-lg bg-white border border-amber-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
            />
            <Disc className="w-3.5 h-3.5 text-emerald-600 absolute left-2.5 top-2.5" />
          </div>

          {/* Soundtrack Inspiration Chips */}
          <div>
            <div className="text-[10px] text-stone-500 flex items-center gap-1 mb-1.5">
              <Sparkles className="w-3 h-3 text-amber-600" />
              Suggested Atmospheric Memory Tracks:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_SOUNDTRACKS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectSuggested(item)}
                  className={`text-[10px] px-2 py-1 rounded-md transition border cursor-pointer ${
                    parsed?.id === item.id
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-400 font-medium'
                      : 'bg-white/80 hover:bg-amber-100 text-stone-700 border-amber-200'
                  }`}
                >
                  {item.artist} - {item.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Spotify Embedded Web Player */}
      {parsed ? (
        <div className="rounded-xl overflow-hidden shadow-md border border-stone-200 bg-stone-900">
          <iframe
            title="Spotify Web Player"
            src={`https://open.spotify.com/embed/${parsed.type}/${parsed.id}?utm_source=generator&theme=0`}
            width="100%"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="w-full rounded-xl"
          />
        </div>
      ) : isEditable ? null : (
        <div className="p-3 bg-stone-100 rounded-lg text-xs text-stone-500 text-center italic">
          No soundtrack attached to this memory.
        </div>
      )}
    </div>
  );
};
