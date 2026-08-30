import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  ChevronRight,
  ChevronLeft,
  Globe2,
  MapPin,
  Lock,
  Unlock,
  Clock,
  Sparkles,
  Music,
  Mic,
  Image as ImageIcon,
  Trophy,
  Flame,
  Volume2,
  VolumeX,
  Compass,
  ShieldCheck,
  Package,
  Layers,
  ArrowRight,
  CheckCircle2,
  Radio,
  Search,
  Key,
} from 'lucide-react';
import { ambientSound, SoundTheme, SOUND_THEMES } from '../../utils/audio';
import { SupportedLanguage, translate, LANGUAGES } from '../../utils/i18n';

interface InteractiveDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPlantModal?: () => void;
  onOpenVault?: () => void;
  onOpenEvents?: () => void;
  onOpenHeatmap?: () => void;
  onToggleStreetView?: () => void;
  language?: SupportedLanguage;
  onSelectLanguage?: (lang: SupportedLanguage) => void;
}

interface DemoChapter {
  id: string;
  title: string;
  subtitle: string;
  durationSeconds: number;
  icon: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  renderVisual: (isPlaying: boolean, stepProgress: number) => React.ReactNode;
  keyPoints: string[];
}

export const InteractiveDemoModal: React.FC<InteractiveDemoModalProps> = ({
  isOpen,
  onClose,
  onOpenPlantModal,
  onOpenVault,
  onOpenEvents,
  onOpenHeatmap,
  onToggleStreetView,
  language = 'en',
  onSelectLanguage,
}) => {
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [chapterProgress, setChapterProgress] = useState<number>(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(() => !ambientSound.getIsPlaying());

  const progressIntervalRef = useRef<any>(null);

  // Define the 7 Demo Chapters
  const chapters: DemoChapter[] = [
    // 1. 3D Globe & Precision Navigation
    {
      id: 'globe_nav',
      title: '1. 3D Celestial Earth & Precision Navigation',
      subtitle: 'Spin, orbit, and fly to any coordinates or city on Earth with high-precision search.',
      durationSeconds: 8,
      icon: <Globe2 className="w-4 h-4 text-cyan-400" />,
      actionText: 'Explore Earth Globe',
      keyPoints: [
        'Interactive Three.js 3D Earth with realistic atmospheric shaders and coordinate grid.',
        'Search any landmark, city, or address using the Mapbox search bar with instant fly-to cameras.',
        'Click anywhere on the globe or country borders to view live REST Countries statistics.',
      ],
      renderVisual: (playing, prog) => (
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-[#07111e] overflow-hidden select-none p-4">
          {/* Animated 3D Globe Ring Simulation */}
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
            {/* Atmosphere glow */}
            <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-2xl animate-pulse" />
            <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr from-[#0f2847] via-[#1a4a75] to-[#0a1e36] border-2 border-cyan-400/60 shadow-[0_0_35px_rgba(6,182,212,0.4)] flex items-center justify-center relative overflow-hidden">
              {/* Rotating continents simulation */}
              <div
                className="absolute inset-0 opacity-40 bg-[radial-gradient(#22d3ee_1px,transparent_1px)] [background-size:12px_12px]"
                style={{
                  transform: `rotate(${prog * 360}deg)`,
                  transition: 'transform 0.1s linear',
                }}
              />
              {/* Center target crosshair */}
              <div className="w-8 h-8 rounded-full border border-dashed border-amber-400 flex items-center justify-center animate-spin">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
              </div>
            </div>

            {/* Orbiting Pin Beacons */}
            <div
              className="absolute flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/90 border border-amber-400 text-amber-300 text-[10px] font-mono shadow-lg"
              style={{
                top: `${30 + Math.sin(prog * Math.PI * 2) * 20}%`,
                left: `${20 + Math.cos(prog * Math.PI * 2) * 25}%`,
              }}
            >
              <MapPin className="w-3 h-3 text-amber-400 animate-bounce" />
              <span>Tokyo (35.67°, 139.65°)</span>
            </div>

            <div
              className="absolute flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-400 text-emerald-300 text-[10px] font-mono shadow-lg"
              style={{
                bottom: `${25 + Math.cos(prog * Math.PI * 2) * 15}%`,
                right: `${15 + Math.sin(prog * Math.PI * 2) * 20}%`,
              }}
            >
              <MapPin className="w-3 h-3 text-emerald-400 animate-bounce" />
              <span>Paris (48.85°, 2.35°)</span>
            </div>
          </div>

          {/* Search bar simulation bar */}
          <div className="mt-3 w-full max-w-sm px-3 py-1.5 rounded-xl bg-[#0b1728] border border-cyan-500/50 flex items-center gap-2 text-xs text-cyan-200 shadow-md">
            <Search className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="font-mono text-[11px] truncate text-cyan-100">
              Fly to: {prog < 0.5 ? 'Mount Fuji, Japan' : 'Eiffel Tower, France'}
            </span>
            <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-cyan-900 text-cyan-300 font-mono">
              3D ORBIT
            </span>
          </div>
        </div>
      ),
    },

    // 2. Planting Cryptographic Capsules
    {
      id: 'planting_capsules',
      title: '2. Planting Cryptographic Time Capsules',
      subtitle: 'Bury letters, voice recordings, photo memories, and Spotify tracks sealed in time.',
      durationSeconds: 8,
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      actionText: 'Plant a Capsule Now',
      onAction: onOpenPlantModal,
      keyPoints: [
        'Rich multimedia attachments: Voice recordings, Spotify audio tracks, and photo memories.',
        'Choose public discovery on the Earth globe or private encrypted address sharing.',
        'Automatic reverse geocoding tags the exact country, territory, and GPS coordinates.',
      ],
      renderVisual: (playing, prog) => (
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-[#180f08] overflow-hidden select-none p-4">
          {/* Animated Capsule Card Mockup */}
          <div className="w-full max-w-sm rounded-2xl bg-[#241509] border border-amber-500/50 p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-600 to-yellow-400 text-stone-950 flex items-center justify-center font-bold">
                  <MapPin className="w-4 h-4 text-stone-950" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">"Letter to the Future 2030"</div>
                  <div className="text-[10px] text-amber-300/80">Kyoto Bamboo Forest, Japan</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-600/40 text-[9px] font-mono">
                SEALED
              </span>
            </div>

            {/* Media Attachment Simulation */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-xl bg-[#170c04] border border-amber-600/40 flex flex-col items-center justify-center text-center gap-1">
                <Mic className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="text-[9px] text-amber-200 font-mono">0:45 Audio</span>
              </div>
              <div className="p-2 rounded-xl bg-[#170c04] border border-emerald-600/40 flex flex-col items-center justify-center text-center gap-1">
                <Music className="w-4 h-4 text-emerald-400" />
                <span className="text-[9px] text-emerald-200 font-mono">Spotify Track</span>
              </div>
              <div className="p-2 rounded-xl bg-[#170c04] border border-cyan-600/40 flex flex-col items-center justify-center text-center gap-1">
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                <span className="text-[9px] text-cyan-200 font-mono">Photo Attached</span>
              </div>
            </div>

            {/* Golden cryptographic seal ring */}
            <div className="p-2 rounded-xl bg-amber-950/70 border border-amber-500/40 flex items-center justify-between text-[10px] text-amber-300 font-mono">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                Ed25519 Signed
              </span>
              <span className="text-amber-200">Arweave: #ARW_KYOTO_01</span>
            </div>
          </div>
        </div>
      ),
    },

    // 3. Encrypted Vault Safe & Real-Time Locks
    {
      id: 'vault_safe',
      title: '3. Encrypted Vault Safe & Time Timers',
      subtitle: 'Your personal inventory of locked and unlocked time capsules with AES-256 GCM security.',
      durationSeconds: 8,
      icon: <Package className="w-4 h-4 text-yellow-400" />,
      actionText: 'Open My Safe',
      onAction: onOpenVault,
      keyPoints: [
        'Real-time live countdown timers ticking down to the exact second of unlocking.',
        'Filter between Time-Locked, Unlocked memories, and private encrypted drafts.',
        'Download offline backup packages containing all memory letters, audio, and metadata.',
      ],
      renderVisual: (playing, prog) => (
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-[#130b05] overflow-hidden select-none p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#1f1207] border-2 border-amber-500/50 p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-950 border border-amber-400 flex items-center justify-center text-amber-300">
                  <Lock className="w-4 h-4 text-amber-400 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white">Chrono Safe Inventory</h4>
                  <p className="text-[10px] text-amber-300/70">AES-256 GCM Cryptographic Storage</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500 text-[10px] font-mono font-bold">
                17 In Safe
              </span>
            </div>

            {/* Countdown timer mockup */}
            <div className="p-3 rounded-xl bg-[#120903] border border-amber-600/40 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-amber-100">"Tokyo Cyberpunk Reunion"</div>
                <div className="text-[10px] text-amber-400/80 flex items-center gap-1 font-mono mt-0.5">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>Unlocks in: 02d 14h 32m 18s</span>
                </div>
              </div>
              <span className="px-2 py-1 rounded-lg bg-yellow-950 border border-yellow-500/50 text-yellow-300 text-[10px] font-bold font-mono">
                LOCKED
              </span>
            </div>

            {/* Unlocked ready mockup */}
            <div className="p-3 rounded-xl bg-[#120903] border border-emerald-600/40 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-emerald-100">"The Great Pyramid Stargazer Seal"</div>
                <div className="text-[10px] text-emerald-400/80 flex items-center gap-1 font-mono mt-0.5">
                  <Unlock className="w-3 h-3 text-emerald-400" />
                  <span>Unlocked & Ready to excavate</span>
                </div>
              </div>
              <span className="px-2 py-1 rounded-lg bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-[10px] font-bold font-mono">
                READY
              </span>
            </div>
          </div>
        </div>
      ),
    },

    // 4. Scavenger Hunt Quests & Clues
    {
      id: 'scavenger_hunts',
      title: '4. Scavenger Hunt Quests & GPS Radar',
      subtitle: 'Join global historical missions, solve geographic riddles, and track distances in real-time.',
      durationSeconds: 8,
      icon: <Trophy className="w-4 h-4 text-purple-400" />,
      actionText: 'View Active Hunts',
      onAction: onOpenEvents,
      keyPoints: [
        'Global quest missions in Cairo, Tokyo, Paris, Rome, and London.',
        'Live proximity distance radar showing exact kilometers to the hidden capsule checkpoint.',
        'Unlock riddle clues sequentially to unearth historical artifacts and win explorer trophies.',
      ],
      renderVisual: (playing, prog) => (
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-[#170a1c] overflow-hidden select-none p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#24102c] border border-purple-500/50 p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-950 border border-purple-400 flex items-center justify-center text-purple-300">
                  <Trophy className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white">Secrets of the Pharaohs</h4>
                  <p className="text-[10px] text-purple-300/80">Cairo, Egypt • 3 Stage Mystery Quest</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-400 text-[10px] font-mono font-bold">
                STAGE 2/3
              </span>
            </div>

            {/* Radar Simulation */}
            <div className="p-3 rounded-xl bg-[#14061a] border border-purple-600/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-purple-900/80 border border-purple-400 flex items-center justify-center text-purple-200 animate-spin">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-purple-100">Live Proximity Radar</div>
                  <div className="text-[10px] text-purple-300/80 font-mono">
                    Target Distance: {(120 + Math.sin(prog * 10) * 15).toFixed(0)}m away
                  </div>
                </div>
              </div>
              <span className="px-2 py-1 rounded bg-purple-950 text-purple-300 border border-purple-500/50 text-[10px] font-bold font-mono">
                HOT BEACON
              </span>
            </div>

            {/* Riddle Clue Snippet */}
            <p className="text-[11px] text-purple-200/80 italic bg-purple-950/40 p-2 rounded-lg border-l-2 border-purple-400">
              "Where the ancient shadow falls at noon beneath the gaze of the Sphinx..."
            </p>
          </div>
        </div>
      ),
    },

    // 5. 3D Glowing Heatmap & Global Directory
    {
      id: 'heatmap_archive',
      title: '5. 3D Glowing Heatmap & Global Archive',
      subtitle: 'Track planetary memory density with glowing thermal rings and direct camera jumps.',
      durationSeconds: 8,
      icon: <Flame className="w-4 h-4 text-rose-400" />,
      actionText: 'Open Global Archive',
      onAction: onOpenHeatmap,
      keyPoints: [
        'Dynamic 3D glowing thermal shaders visualizing memory clusters worldwide.',
        'Global capsule directory indexing every public memory across 12+ nations.',
        'Quick jump shortcuts to memory hotspots in Tokyo, Paris, New York, Cairo, and Sydney.',
      ],
      renderVisual: (playing, prog) => (
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-[#150a0a] overflow-hidden select-none p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#241010] border border-rose-500/50 p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-400 text-stone-950 flex items-center justify-center font-bold">
                  <Flame className="w-4 h-4 text-stone-950 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white">Global Archive & 3D Heatmap</h4>
                  <p className="text-[10px] text-rose-300/80">17 Capsules Indexed in Realtime</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 text-[10px] font-bold">
                ACTIVE
              </span>
            </div>

            {/* Hotspots shortcut row */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {['Tokyo (3)', 'Paris (2)', 'London (2)', 'New York (2)', 'Cairo (2)'].map((h, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-lg bg-[#381616] text-rose-200 border border-rose-600/40 text-[10px] font-mono whitespace-nowrap"
                >
                  {h}
                </span>
              ))}
            </div>

            <div className="p-2.5 rounded-xl bg-[#160707] border border-rose-600/40 flex items-center justify-between text-xs">
              <span className="text-[11px] text-rose-200 font-medium">Memory Cluster Density: High</span>
              <span className="text-[10px] font-mono text-amber-400 font-bold">12 COUNTRIES</span>
            </div>
          </div>
        </div>
      ),
    },

    // 6. Procedural Ambient Soundscapes & Street Map Mode
    {
      id: 'ambient_audio',
      title: '6. Procedural Ambient Audio & Dual Map Engines',
      subtitle: 'Real-time 4-theme procedural soundscapes and seamless street-level satellite views.',
      durationSeconds: 8,
      icon: <Volume2 className="w-4 h-4 text-emerald-400" />,
      actionText: 'Toggle Street Map',
      onAction: onToggleStreetView,
      keyPoints: [
        '4 Procedural ambient soundscapes: Nostalgic (Harp), Haunting (Glass Bells), Upbeat (Marimba), Sad (Cello).',
        'Dual navigation modes: Switch freely between 3D Celestial Globe and 2D Mapbox Street Map.',
        'Independent audio mixer with quick mute and harmonic chord progression generation.',
      ],
      renderVisual: (playing, prog) => (
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-[#071912] overflow-hidden select-none p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#0c291e] border border-emerald-500/50 p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-400 flex items-center justify-center text-emerald-300">
                  <Music className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white">Procedural Web Audio Synth</h4>
                  <p className="text-[10px] text-emerald-300/80">Mathematical Realtime Chords</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-400 text-[10px] font-mono font-bold">
                SYNTH ON
              </span>
            </div>

            {/* Sound waveform simulation */}
            <div className="h-12 rounded-xl bg-[#05140f] border border-emerald-600/40 p-2 flex items-center justify-center gap-1">
              {[16, 28, 42, 24, 38, 48, 30, 20, 36, 44, 22, 32, 40, 26, 18].map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-emerald-400 rounded-full transition-all duration-150"
                  style={{
                    height: `${Math.max(6, (h * (0.5 + Math.sin(prog * 20 + i) * 0.5)))}px`,
                  }}
                />
              ))}
            </div>

            {/* 4 Theme Pills */}
            <div className="grid grid-cols-4 gap-1.5 text-center text-[9px] font-mono">
              <span className="p-1 rounded bg-amber-950/80 text-amber-300 border border-amber-500/40">Nostalgic</span>
              <span className="p-1 rounded bg-purple-950/80 text-purple-300 border border-purple-500/40">Haunting</span>
              <span className="p-1 rounded bg-yellow-950/80 text-yellow-300 border border-yellow-500/40">Upbeat</span>
              <span className="p-1 rounded bg-blue-950/80 text-blue-300 border border-blue-500/40">Sad</span>
            </div>
          </div>
        </div>
      ),
    },

    // 7. Fast-Forward Time Travel Simulator
    {
      id: 'time_simulator',
      title: '7. DoraHacks Time Warp Fast-Forward',
      subtitle: 'Advance world time by hours, days, or years to test real-time unsealing instantly.',
      durationSeconds: 8,
      icon: <FastForward className="w-4 h-4 text-amber-400" />,
      actionText: 'Start Exploring',
      onAction: onClose,
      keyPoints: [
        'Use the bottom fast-forward buttons: [+1 Hour], [+1 Day], [+1 Week], and [+1 Year].',
        'Simulate future world dates to test automatic cryptographic unsealing without waiting.',
        'Reset back to real-time Earth clock with a single click at any time.',
      ],
      renderVisual: (playing, prog) => (
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-[#1c1206] overflow-hidden select-none p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#2e1c0a] border border-amber-500/50 p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-950 border border-amber-400 flex items-center justify-center text-amber-300">
                  <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white">Time Travel World Clock</h4>
                  <p className="text-[10px] text-amber-300/80">Simulate Unlocking at Warp Speed</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-400 text-[10px] font-mono font-bold animate-pulse">
                WARP ACTIVE
              </span>
            </div>

            {/* Time Warp Warpfield Buttons */}
            <div className="grid grid-cols-4 gap-1.5">
              <button type="button" className="py-1.5 rounded-lg bg-[#1a0e05] border border-amber-600/40 text-amber-300 text-[10px] font-mono font-bold">
                +1 Hour
              </button>
              <button type="button" className="py-1.5 rounded-lg bg-[#1a0e05] border border-amber-600/40 text-amber-300 text-[10px] font-mono font-bold">
                +1 Day
              </button>
              <button type="button" className="py-1.5 rounded-lg bg-[#1a0e05] border border-amber-600/40 text-amber-300 text-[10px] font-mono font-bold">
                +1 Week
              </button>
              <button type="button" className="py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 text-[10px] font-mono font-extrabold shadow-sm">
                +1 Year
              </button>
            </div>

            <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-between text-[10px] text-emerald-300 font-mono">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                3 Capsules Unsealed by Warp
              </span>
              <span className="text-emerald-200">2027-08-30</span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const currentChapter = chapters[currentChapterIndex];

  // Autoplay Timer Loop
  useEffect(() => {
    if (!isOpen || !isPlaying) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    const intervalStep = 50; // ms
    const totalSteps = (currentChapter.durationSeconds * 1000) / intervalStep / playbackSpeed;

    progressIntervalRef.current = setInterval(() => {
      setChapterProgress((prev) => {
        const next = prev + 1 / totalSteps;
        if (next >= 1) {
          // Advance to next chapter
          if (currentChapterIndex < chapters.length - 1) {
            setCurrentChapterIndex((c) => c + 1);
            return 0;
          } else {
            // Loop back or stay at end
            setCurrentChapterIndex(0);
            return 0;
          }
        }
        return next;
      });
    }, intervalStep);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isOpen, isPlaying, currentChapterIndex, currentChapter.durationSeconds, playbackSpeed, chapters.length]);

  if (!isOpen) return null;

  const handleDismiss = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('chronospheres_welcome_dismissed', 'true');
      } catch (e) {
        console.warn(e);
      }
    }
    // Start procedural sound if user hasn't muted
    if (!ambientSound.getIsPlaying()) {
      ambientSound.start();
    }
    onClose();
  };

  const handleNextChapter = () => {
    if (currentChapterIndex < chapters.length - 1) {
      setCurrentChapterIndex((prev) => prev + 1);
      setChapterProgress(0);
    }
  };

  const handlePrevChapter = () => {
    if (currentChapterIndex > 0) {
      setCurrentChapterIndex((prev) => prev - 1);
      setChapterProgress(0);
    }
  };

  const handleSelectChapter = (index: number) => {
    setCurrentChapterIndex(index);
    setChapterProgress(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="interactive-feature-demo-player-modal"
        className="relative w-full max-w-4xl max-h-[94vh] parchment-card border-2 border-amber-800/40 rounded-2xl sm:rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden text-amber-950 font-sans"
      >
        {/* 1. PLAYER HEADER & DEMO BANNER (Tree Bark Banner) */}
        <div className="tree-bark-banner px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between border-b border-amber-800/40 shrink-0 text-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-stone-950 flex items-center justify-center shadow-md shrink-0">
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-stone-950 stroke-none" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-serif font-bold text-sm sm:text-base text-amber-100 tracking-tight leading-tight">
                  Interactive Feature Video Demo
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-400/50 text-[9px] sm:text-[10px] font-mono font-bold text-amber-300">
                  Chapter {currentChapterIndex + 1} of {chapters.length}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-amber-200/80">
                Visual animated guide showing every core capability in ChronoSpheres.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            {onSelectLanguage && (
              <div className="hidden sm:flex items-center gap-1 bg-black/30 border border-amber-500/40 rounded-xl px-2 py-1 text-xs text-amber-200">
                <select
                  value={language}
                  onChange={(e) => onSelectLanguage(e.target.value as SupportedLanguage)}
                  className="bg-transparent text-amber-200 font-bold text-xs focus:outline-none cursor-pointer pr-1"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-[#2c1d11] text-amber-100">
                      {lang.flag} {lang.nativeName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Skip Demo Button */}
            <button
              type="button"
              onClick={handleDismiss}
              className="px-3 py-1.5 rounded-xl bg-black/30 hover:bg-black/50 text-amber-200 hover:text-white border border-amber-500/40 text-xs font-bold transition cursor-pointer"
            >
              Skip Demo
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 rounded-xl bg-black/30 hover:bg-black/50 text-amber-200 hover:text-white transition cursor-pointer border border-amber-500/40"
              aria-label="Close demo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. CINEMATIC VIDEO VIEWPORT / SIMULATION CANVAS */}
        <div className="relative w-full aspect-[16/9] max-h-[340px] bg-black flex items-center justify-center overflow-hidden border-b border-amber-800/30">
          {/* Active Chapter Visual Simulation */}
          {currentChapter.renderVisual(isPlaying, chapterProgress)}

          {/* Overlay Play / Pause Floating Indicator when paused */}
          {!isPlaying && (
            <div
              onClick={() => setIsPlaying(true)}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-stone-950 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 fill-stone-950 stroke-none ml-1" />
              </div>
            </div>
          )}

          {/* Chapter Subtitle Banner (Bottom of Screen) */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 sm:p-4 text-center pointer-events-none">
            <h3 className="font-serif font-bold text-sm sm:text-base text-amber-50 drop-shadow-md">
              {currentChapter.title}
            </h3>
            <p className="text-[11px] sm:text-xs text-amber-200/90 font-sans max-w-xl mx-auto drop-shadow-sm mt-0.5">
              {currentChapter.subtitle}
            </p>
          </div>
        </div>

        {/* 3. VIDEO CONTROLS & TIMELINE SCRUBBER */}
        <div className="px-4 sm:px-6 py-2.5 bg-amber-900/10 border-b border-amber-800/20 flex flex-col gap-2 shrink-0">
          {/* Progress bar across chapters */}
          <div className="relative w-full h-1.5 bg-amber-950/20 rounded-full overflow-hidden flex gap-1">
            {chapters.map((ch, idx) => {
              const isPast = idx < currentChapterIndex;
              const isCurrent = idx === currentChapterIndex;
              return (
                <div
                  key={ch.id}
                  onClick={() => handleSelectChapter(idx)}
                  className="flex-1 h-full bg-amber-900/20 cursor-pointer relative overflow-hidden rounded-full hover:bg-amber-900/40"
                  title={ch.title}
                >
                  <div
                    className={`h-full transition-all duration-75 ${
                      isPast
                        ? 'bg-amber-700 w-full'
                        : isCurrent
                        ? 'bg-gradient-to-r from-amber-600 to-amber-800'
                        : 'w-0'
                    }`}
                    style={isCurrent ? { width: `${chapterProgress * 100}%` } : undefined}
                  />
                </div>
              );
            })}
          </div>

          {/* Player controls toolbar */}
          <div className="flex items-center justify-between gap-2 text-xs">
            {/* Left: Play/Pause/Prev/Next */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={handlePrevChapter}
                disabled={currentChapterIndex === 0}
                className="p-1.5 rounded-lg bg-white hover:bg-amber-50 disabled:opacity-30 text-amber-950 border border-amber-700/30 transition cursor-pointer shadow-xs"
                title="Previous Feature"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-amber-100 font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm border border-amber-500/40"
                title={isPlaying ? 'Pause Demo' : 'Play Demo'}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-amber-200 stroke-none" />
                    <span className="hidden sm:inline">Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-amber-200 stroke-none" />
                    <span className="hidden sm:inline">Play</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleNextChapter}
                disabled={currentChapterIndex === chapters.length - 1}
                className="p-1.5 rounded-lg bg-white hover:bg-amber-50 disabled:opacity-30 text-amber-950 border border-amber-700/30 transition cursor-pointer shadow-xs"
                title="Next Feature"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentChapterIndex(0);
                  setChapterProgress(0);
                }}
                className="p-1.5 rounded-lg bg-white hover:bg-amber-50 text-amber-900 border border-amber-700/30 transition cursor-pointer hidden sm:block shadow-xs"
                title="Restart from Beginning"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Center / Right: Speed & Audio Controls */}
            <div className="flex items-center gap-2">
              {/* Playback speed pills */}
              <div className="flex items-center bg-white rounded-lg p-0.5 border border-amber-700/30 text-[10px] font-mono font-bold shadow-xs">
                {[1, 1.5, 2].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                      playbackSpeed === spd ? 'bg-amber-800 text-amber-100' : 'text-amber-950/70 hover:text-amber-950'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>

              {/* Sound toggle */}
              <button
                type="button"
                onClick={() => {
                  ambientSound.toggle();
                  setIsAudioMuted(!ambientSound.getIsPlaying());
                }}
                className={`p-1.5 rounded-lg border transition cursor-pointer shadow-xs ${
                  !isAudioMuted
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-600'
                    : 'bg-white text-stone-600 border-amber-700/30'
                }`}
                title={!isAudioMuted ? 'Mute Atmosphere Music' : 'Unmute Atmosphere Music'}
              >
                {!isAudioMuted ? <Volume2 className="w-3.5 h-3.5 text-emerald-700 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* 4. CHAPTER SELECTION PILLS & KEY POINTS */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-[#faf5ec]/60 custom-scrollbar">
          {/* Horizontal Chapter Track */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {chapters.map((ch, idx) => {
              const isSelected = idx === currentChapterIndex;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => handleSelectChapter(idx)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition cursor-pointer shadow-xs ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-700 to-amber-900 text-amber-100 border-amber-600 shadow-sm font-bold'
                      : 'bg-white hover:bg-amber-50 text-amber-950/80 border-amber-800/25'
                  }`}
                >
                  <span className="shrink-0">{ch.icon}</span>
                  <span>{ch.title.split('.')[1] || ch.title}</span>
                </button>
              );
            })}
          </div>

          {/* Current Chapter Highlights Card */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-amber-800/25 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h4 className="font-bold text-xs sm:text-sm text-amber-950 flex items-center gap-2 font-serif">
                <Sparkles className="w-4 h-4 text-amber-700" />
                <span>Feature Summary & Highlights</span>
              </h4>

              {currentChapter.actionText && currentChapter.onAction && (
                <button
                  type="button"
                  onClick={() => {
                    handleDismiss();
                    if (currentChapter.onAction) currentChapter.onAction();
                  }}
                  className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-amber-100 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm border border-amber-500/40"
                >
                  <span>{currentChapter.actionText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <ul className="space-y-1.5 text-xs text-amber-950/90">
              {currentChapter.keyPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 5. FOOTER & "DON'T SHOW AGAIN" CHECKBOX (Tree Bark Banner) */}
        <div className="tree-bark-banner px-4 sm:px-6 py-3 border-t border-amber-800/40 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 text-xs text-amber-100">
          <label className="flex items-center gap-2 text-amber-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded border-amber-500 text-amber-600 focus:ring-amber-400 accent-amber-600 cursor-pointer"
            />
            <span className="text-[11px] sm:text-xs">Don't show this demo on startup (Access anytime via '?' button)</span>
          </label>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleDismiss}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md w-full sm:w-auto"
            >
              <span>Start Exploring Earth</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
