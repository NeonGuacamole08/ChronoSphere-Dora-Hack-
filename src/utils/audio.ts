// Royalty-free 100% Web Audio soundscape engine with 4 distinct ambient themes:
// 1. Nostalgic (Peaceful celestial Harp & Flute)
// 2. Haunting (Mystical, eerie glass bells & ethereal atmosphere)
// 3. Upbeat (Joyful acoustic marimba & bright melodic arpeggios)
// 4. Sad (Poignant melancholic cello & gentle emotional piano chords)

export type SoundTheme = 'nostalgic' | 'haunting' | 'upbeat' | 'sad';

export interface SoundThemeInfo {
  id: SoundTheme;
  name: string;
  tag: string;
  description: string;
  badgeColor: string;
  iconName: string;
}

export const SOUND_THEMES: SoundThemeInfo[] = [
  {
    id: 'nostalgic',
    name: 'Nostalgic',
    tag: 'Harp & Flute',
    description: 'Serene Celtic harp arpeggios and airy wooden flute melodies.',
    badgeColor: 'from-amber-600 to-emerald-600',
    iconName: 'Sparkles',
  },
  {
    id: 'haunting',
    name: 'Haunting',
    tag: 'Ethereal Glass Bells',
    description: 'Mystical glass chimes, eerie minor harmonies, and deep atmospheric echoes.',
    badgeColor: 'from-purple-600 to-indigo-800',
    iconName: 'Ghost',
  },
  {
    id: 'upbeat',
    name: 'Upbeat',
    tag: 'Acoustic Marimba',
    description: 'Joyful bright kalimba rhythm and uplifting rhythmic melodies.',
    badgeColor: 'from-amber-500 to-yellow-600',
    iconName: 'Sun',
  },
  {
    id: 'sad',
    name: 'Sad',
    tag: 'Melancholic Cello & Piano',
    description: 'Poignant, heartfelt solo cello phrases and slow emotional minor piano chords.',
    badgeColor: 'from-blue-700 to-slate-800',
    iconName: 'Heart',
  },
];

class AmbientSoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private currentTheme: SoundTheme = 'nostalgic';

  private primaryLoopTimer: number | null = null;
  private secondaryLoopTimer: number | null = null;
  private stepIndex: number = 0;

  // Air Gliding Wind Nodes (Only active during active zoom-in motion)
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windNoiseSource: AudioBufferSourceNode | null = null;
  private windStopTimeout: number | null = null;

  // Listeners for UI state synchronizations
  private listeners: Array<(theme: SoundTheme, isPlaying: boolean) => void> = [];

  constructor() {
    // Attempt auto-resume on first user interaction in browser
    if (typeof window !== 'undefined') {
      const handleUserGesture = () => {
        if (!this.isPlaying) {
          this.start();
        } else if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        window.removeEventListener('click', handleUserGesture);
        window.removeEventListener('keydown', handleUserGesture);
        window.removeEventListener('touchstart', handleUserGesture);
      };
      window.addEventListener('click', handleUserGesture, { once: true });
      window.addEventListener('keydown', handleUserGesture, { once: true });
      window.addEventListener('touchstart', handleUserGesture, { once: true });
    }
  }

  public subscribe(callback: (theme: SoundTheme, isPlaying: boolean) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb(this.currentTheme, this.isPlaying));
  }

  public getTheme(): SoundTheme {
    return this.currentTheme;
  }

  public getThemesList(): SoundThemeInfo[] {
    return SOUND_THEMES;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public setTheme(theme: SoundTheme) {
    if (this.currentTheme === theme && this.isPlaying) return;
    this.currentTheme = theme;
    this.stepIndex = 0;

    if (this.isPlaying) {
      this.clearTimers();
      this.startThemeLoops();
    }
    this.notify();
  }

  private getAudioContext(): AudioContext | null {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private clearTimers() {
    if (this.primaryLoopTimer !== null) {
      clearTimeout(this.primaryLoopTimer);
      this.primaryLoopTimer = null;
    }
    if (this.secondaryLoopTimer !== null) {
      clearTimeout(this.secondaryLoopTimer);
      this.secondaryLoopTimer = null;
    }
  }

  // =========================================================================
  // 1. NOSTALGIC THEME: Celestial Harp & Airy Flute
  // =========================================================================
  private readonly nostalgicHarpScale = [
    261.63, 329.63, 392.00, 493.88, 523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66,
  ];
  private readonly nostalgicFluteMelody = [
    523.25, 659.25, 783.99, 880.00, 783.99, 659.25, 587.33, 523.25, 659.25, 783.99, 1046.50,
  ];

  private playNostalgicHarp(freq: number, pan: number = 0, velocity: number = 1.0) {
    const ctx = this.getAudioContext();
    if (!ctx || !this.masterGain || !this.isPlaying) return;
    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);

      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, now);

      const noteGain = ctx.createGain();
      const peak = 0.16 * velocity;
      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(peak, now + 0.012);
      noteGain.gain.exponentialRampToValueAtTime(peak * 0.35, now + 0.3);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.1);

      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.setValueAtTime(180, now);

      let panner: StereoPannerNode | null = null;
      if (ctx.createStereoPanner) {
        panner = ctx.createStereoPanner();
        panner.pan.setValueAtTime(pan, now);
      }

      osc1.connect(noteGain);
      osc2.connect(noteGain);
      noteGain.connect(hp);

      if (panner) {
        hp.connect(panner);
        panner.connect(this.masterGain);
      } else {
        hp.connect(this.masterGain);
      }

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 2.2);
      osc2.stop(now + 2.2);
    } catch {}
  }

  private playNostalgicFlute(freq: number, duration: number = 2.6) {
    const ctx = this.getAudioContext();
    if (!ctx || !this.masterGain || !this.isPlaying) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(5.0, now);
      lfoGain.gain.setValueAtTime(freq * 0.006, now);
      lfo.connect(osc.frequency);

      const noteGain = ctx.createGain();
      const peak = 0.15;
      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(peak, now + 0.4);
      noteGain.gain.setValueAtTime(peak * 0.85, now + duration - 0.6);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.setValueAtTime(250, now);

      osc.connect(noteGain);
      noteGain.connect(hp);
      hp.connect(this.masterGain);

      lfo.start(now);
      osc.start(now);
      lfo.stop(now + duration);
      osc.stop(now + duration);
    } catch {}
  }

  // =========================================================================
  // 2. HAUNTING THEME: Mystical Glass Bells & Minor Ethereal Chimes
  // =========================================================================
  private readonly hauntingScale = [
    220.00, // A3
    261.63, // C4
    293.66, // D4
    311.13, // Eb4 (mystical minor)
    392.00, // G4
    440.00, // A4
    523.25, // C5
    587.33, // D5
    622.25, // Eb5
    783.99, // G5
    880.00, // A5
  ];

  private playHauntingGlassBell(freq: number, pan: number = 0, velocity: number = 1.0) {
    const ctx = this.getAudioContext();
    if (!ctx || !this.masterGain || !this.isPlaying) return;
    try {
      const now = ctx.currentTime;
      // High chime bell oscillator
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);

      // Glass inharmonic overtone (ratio 2.76)
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2.756, now);

      // Shimmering metallic 5th overtone
      const osc3 = ctx.createOscillator();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(freq * 4.02, now);

      const noteGain = ctx.createGain();
      const peak = 0.14 * velocity;
      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(peak, now + 0.008);
      noteGain.gain.exponentialRampToValueAtTime(peak * 0.4, now + 0.5);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.4);

      const bandFilter = ctx.createBiquadFilter();
      bandFilter.type = 'bandpass';
      bandFilter.frequency.setValueAtTime(freq * 1.5, now);
      bandFilter.Q.setValueAtTime(1.4, now);

      let panner: StereoPannerNode | null = null;
      if (ctx.createStereoPanner) {
        panner = ctx.createStereoPanner();
        panner.pan.setValueAtTime(pan, now);
      }

      osc1.connect(noteGain);
      osc2.connect(noteGain);
      osc3.connect(noteGain);
      noteGain.connect(bandFilter);

      if (panner) {
        bandFilter.connect(panner);
        panner.connect(this.masterGain);
      } else {
        bandFilter.connect(this.masterGain);
      }

      osc1.start(now);
      osc2.start(now);
      osc3.start(now);
      osc1.stop(now + 3.5);
      osc2.stop(now + 3.5);
      osc3.stop(now + 3.5);
    } catch {}
  }

  private playHauntingEtherealPad(freq: number, duration: number = 3.6) {
    const ctx = this.getAudioContext();
    if (!ctx || !this.masterGain || !this.isPlaying) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      // Slow mystical chorus detune
      const oscDetune = ctx.createOscillator();
      oscDetune.type = 'sine';
      oscDetune.frequency.setValueAtTime(freq * 1.003, now);

      const noteGain = ctx.createGain();
      const peak = 0.09;
      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(peak, now + 1.1);
      noteGain.gain.setValueAtTime(peak * 0.9, now + duration - 0.8);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.setValueAtTime(220, now);

      osc.connect(noteGain);
      oscDetune.connect(noteGain);
      noteGain.connect(hp);
      hp.connect(this.masterGain);

      osc.start(now);
      oscDetune.start(now);
      osc.stop(now + duration);
      oscDetune.stop(now + duration);
    } catch {}
  }

  // =========================================================================
  // 3. UPBEAT THEME: Acoustic Marimba & Joyful Melodic Arpeggios
  // =========================================================================
  private readonly upbeatScale = [
    261.63, // C4
    293.66, // D4
    329.63, // E4
    392.00, // G4
    440.00, // A4
    523.25, // C5
    587.33, // D5
    659.25, // E5
    783.99, // G5
    880.00, // A5
    1046.50, // C6
  ];

  private playUpbeatMarimba(freq: number, pan: number = 0, velocity: number = 1.0) {
    const ctx = this.getAudioContext();
    if (!ctx || !this.masterGain || !this.isPlaying) return;
    try {
      const now = ctx.currentTime;
      // Woody wooden bar impact
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);

      // Bright mallet contact
      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 3, now);

      const noteGain = ctx.createGain();
      const peak = 0.17 * velocity;
      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(peak, now + 0.005);
      noteGain.gain.exponentialRampToValueAtTime(peak * 0.2, now + 0.12);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.setValueAtTime(200, now);

      let panner: StereoPannerNode | null = null;
      if (ctx.createStereoPanner) {
        panner = ctx.createStereoPanner();
        panner.pan.setValueAtTime(pan, now);
      }

      osc1.connect(noteGain);
      osc2.connect(noteGain);
      noteGain.connect(hp);

      if (panner) {
        hp.connect(panner);
        panner.connect(this.masterGain);
      } else {
        hp.connect(this.masterGain);
      }

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.9);
      osc2.stop(now + 0.9);
    } catch {}
  }

  // =========================================================================
  // 4. SAD THEME: Poignant Cello & Melancholic Gentle Piano Chords
  // =========================================================================
  private readonly sadCelloNotes = [
    220.00, // A3
    246.94, // B3
    261.63, // C4
    293.66, // D4
    329.63, // E4
    349.23, // F4
    392.00, // G4
    440.00, // A4
  ];

  private readonly sadPianoChords = [
    [220.00, 261.63, 329.63], // Am (A3, C4, E4)
    [174.61, 261.63, 349.23], // F (F3, C4, F4)
    [261.63, 329.63, 392.00], // C (C4, E4, G4)
    [196.00, 246.94, 293.66], // G (G3, B3, D4)
    [164.81, 246.94, 329.63], // Em (E3, B3, E4)
    [146.83, 220.00, 261.63], // Dm (D3, A3, C4)
  ];

  private playSadPianoChord(chord: number[]) {
    const ctx = this.getAudioContext();
    if (!ctx || !this.masterGain || !this.isPlaying) return;
    try {
      const now = ctx.currentTime;
      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const overtone = ctx.createOscillator();
        overtone.type = 'triangle';
        overtone.frequency.setValueAtTime(freq * 2, now);

        const noteGain = ctx.createGain();
        const peak = 0.11;
        noteGain.gain.setValueAtTime(0.0001, now);
        noteGain.gain.linearRampToValueAtTime(peak, now + 0.04 + idx * 0.03);
        noteGain.gain.exponentialRampToValueAtTime(peak * 0.45, now + 0.8);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.6);

        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.setValueAtTime(140, now);

        osc.connect(noteGain);
        overtone.connect(noteGain);
        noteGain.connect(hp);
        hp.connect(this.masterGain!);

        osc.start(now);
        overtone.start(now);
        osc.stop(now + 3.7);
        overtone.stop(now + 3.7);
      });
    } catch {}
  }

  private playSadCello(freq: number, duration: number = 3.2) {
    const ctx = this.getAudioContext();
    if (!ctx || !this.masterGain || !this.isPlaying) return;
    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(freq, now);

      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq, now);

      // Deep expressive cello vibrato (4.2 Hz)
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(4.2, now);
      lfoGain.gain.setValueAtTime(freq * 0.007, now);
      lfo.connect(osc1.frequency);
      lfo.connect(osc2.frequency);

      const noteGain = ctx.createGain();
      const peak = 0.12;
      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(peak, now + 0.6); // slow bow attack
      noteGain.gain.setValueAtTime(peak * 0.9, now + duration - 0.7);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      // Warm cello body filter
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(950, now);

      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.setValueAtTime(180, now);

      osc1.connect(noteGain);
      osc2.connect(noteGain);
      noteGain.connect(filter);
      filter.connect(hp);
      hp.connect(this.masterGain);

      lfo.start(now);
      osc1.start(now);
      osc2.start(now);
      lfo.stop(now + duration);
      osc1.stop(now + duration);
      osc2.stop(now + duration);
    } catch {}
  }

  // =========================================================================
  // SCHEDULING LOOPS FOR THE ACTIVE THEME
  // =========================================================================
  private startThemeLoops() {
    if (!this.isPlaying) return;

    switch (this.currentTheme) {
      case 'nostalgic':
        this.runNostalgicLoop();
        break;
      case 'haunting':
        this.runHauntingLoop();
        break;
      case 'upbeat':
        this.runUpbeatLoop();
        break;
      case 'sad':
        this.runSadLoop();
        break;
    }
  }

  private runNostalgicLoop() {
    if (!this.isPlaying || this.currentTheme !== 'nostalgic') return;

    // Harp cascade
    const chord = [
      this.nostalgicHarpScale[Math.floor(Math.random() * 3)],
      this.nostalgicHarpScale[3 + Math.floor(Math.random() * 3)],
      this.nostalgicHarpScale[6 + Math.floor(Math.random() * 3)],
      this.nostalgicHarpScale[8 + Math.floor(Math.random() * 3)],
    ];

    chord.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.isPlaying || this.currentTheme !== 'nostalgic') return;
        this.playNostalgicHarp(freq, (idx - 1.5) * 0.35, 0.7 + Math.random() * 0.4);
      }, idx * 210);
    });

    // Flute phrase every other cascade
    if (this.stepIndex % 2 === 0) {
      const fluteNote = this.nostalgicFluteMelody[Math.floor(Math.random() * this.nostalgicFluteMelody.length)];
      setTimeout(() => {
        if (!this.isPlaying || this.currentTheme !== 'nostalgic') return;
        this.playNostalgicFlute(fluteNote, 2.6);
      }, 500);
    }
    this.stepIndex++;

    this.primaryLoopTimer = window.setTimeout(() => this.runNostalgicLoop(), 2800 + Math.random() * 1200);
  }

  private runHauntingLoop() {
    if (!this.isPlaying || this.currentTheme !== 'haunting') return;

    // Eerie glass bell chime
    const bellNotes = [
      this.hauntingScale[Math.floor(Math.random() * 3)],
      this.hauntingScale[4 + Math.floor(Math.random() * 3)],
      this.hauntingScale[7 + Math.floor(Math.random() * 4)],
    ];

    bellNotes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.isPlaying || this.currentTheme !== 'haunting') return;
        this.playHauntingGlassBell(freq, (idx - 1) * 0.5, 0.8 + Math.random() * 0.4);
      }, idx * 450);
    });

    // Atmospheric minor drone swell
    if (this.stepIndex % 2 === 0) {
      const padFreq = this.hauntingScale[Math.floor(Math.random() * 4)];
      setTimeout(() => {
        if (!this.isPlaying || this.currentTheme !== 'haunting') return;
        this.playHauntingEtherealPad(padFreq, 3.8);
      }, 300);
    }
    this.stepIndex++;

    this.primaryLoopTimer = window.setTimeout(() => this.runHauntingLoop(), 3400 + Math.random() * 1400);
  }

  private runUpbeatLoop() {
    if (!this.isPlaying || this.currentTheme !== 'upbeat') return;

    // Rhythmic syncopated marimba groove
    const pattern = [
      this.upbeatScale[Math.floor(Math.random() * 3)],
      this.upbeatScale[2 + Math.floor(Math.random() * 3)],
      this.upbeatScale[4 + Math.floor(Math.random() * 3)],
      this.upbeatScale[6 + Math.floor(Math.random() * 3)],
      this.upbeatScale[Math.floor(Math.random() * 4)],
    ];

    pattern.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.isPlaying || this.currentTheme !== 'upbeat') return;
        const pan = (idx % 2 === 0 ? 0.3 : -0.3) * (0.5 + Math.random() * 0.5);
        this.playUpbeatMarimba(freq, pan, 0.85 + Math.random() * 0.3);
      }, idx * 175);
    });

    this.stepIndex++;
    this.primaryLoopTimer = window.setTimeout(() => this.runUpbeatLoop(), 1250 + Math.random() * 400);
  }

  private runSadLoop() {
    if (!this.isPlaying || this.currentTheme !== 'sad') return;

    // Gentle emotional piano chord
    const chordIndex = this.stepIndex % this.sadPianoChords.length;
    const chord = this.sadPianoChords[chordIndex];
    this.playSadPianoChord(chord);

    // Poignant solo cello counter-melody
    const celloFreq = this.sadCelloNotes[Math.floor(Math.random() * this.sadCelloNotes.length)];
    setTimeout(() => {
      if (!this.isPlaying || this.currentTheme !== 'sad') return;
      this.playSadCello(celloFreq, 3.4);
    }, 600);

    this.stepIndex++;
    this.primaryLoopTimer = window.setTimeout(() => this.runSadLoop(), 3600 + Math.random() * 1000);
  }

  // =========================================================================
  // DYNAMIC AIR GLIDE (WIND ON ACTIVE ZOOM)
  // =========================================================================
  private initWindNodes(ctx: AudioContext) {
    if (this.windGain && this.windFilter) return;
    try {
      this.windGain = ctx.createGain();
      this.windGain.gain.setValueAtTime(0.00001, ctx.currentTime);

      this.windFilter = ctx.createBiquadFilter();
      this.windFilter.type = 'bandpass';
      this.windFilter.frequency.setValueAtTime(800, ctx.currentTime);
      this.windFilter.Q.setValueAtTime(2.2, ctx.currentTime);

      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
      for (let channel = 0; channel < 2; channel++) {
        const data = buffer.getChannelData(channel);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.96 * b0 + white * 0.08;
          b1 = 0.94 * b1 + white * 0.12;
          b2 = 0.88 * b2 + white * 0.22;
          data[i] = (b0 + b1 + b2) * 0.08;
        }
      }

      this.windNoiseSource = ctx.createBufferSource();
      this.windNoiseSource.buffer = buffer;
      this.windNoiseSource.loop = true;

      this.windNoiseSource.connect(this.windFilter);
      this.windFilter.connect(this.windGain);
      this.windGain.connect(ctx.destination);

      this.windNoiseSource.start();
    } catch {}
  }

  public updateAirGlide(zoomSpeed: number) {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    if (!this.windGain || !this.windFilter) {
      this.initWindNodes(ctx);
    }

    if (this.windStopTimeout !== null) {
      clearTimeout(this.windStopTimeout);
      this.windStopTimeout = null;
    }

    const now = ctx.currentTime;
    const intensity = Math.min(1.0, Math.max(0.05, zoomSpeed * 0.25));
    const targetFreq = 750 + intensity * 1200;
    const targetVolume = 0.03 + intensity * 0.09;

    try {
      if (this.windGain && this.windFilter) {
        this.windFilter.frequency.setTargetAtTime(targetFreq, now, 0.08);
        this.windGain.gain.setTargetAtTime(targetVolume, now, 0.05);
      }
    } catch {}

    this.windStopTimeout = window.setTimeout(() => {
      this.stopAirGlide();
    }, 200);
  }

  public stopAirGlide() {
    if (!this.windGain || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      this.windGain.gain.setTargetAtTime(0.00001, now, 0.2);
    } catch {}
  }

  public triggerGlideSwoosh(intensity: number = 0.7) {
    this.updateAirGlide(intensity * 3.2);
  }

  // =========================================================================
  // LIFECYCLE CONTROLS
  // =========================================================================
  public start() {
    if (this.isPlaying) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      this.masterGain = ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      this.masterGain.gain.exponentialRampToValueAtTime(0.11, ctx.currentTime + 1.2);
      this.masterGain.connect(ctx.destination);

      this.isPlaying = true;
      this.stepIndex = 0;
      this.startThemeLoops();
      this.notify();
    } catch (e) {
      console.warn('Audio Context start blocked:', e);
    }
  }

  public stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.clearTimers();

    if (this.masterGain && this.ctx) {
      try {
        this.masterGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);
        setTimeout(() => {
          this.masterGain = null;
        }, 550);
      } catch {
        this.masterGain = null;
      }
    }
    this.notify();
  }

  public toggle(): boolean {
    if (this.isPlaying) {
      this.stop();
      return true; // isMuted = true
    } else {
      this.start();
      return false; // isMuted = false
    }
  }
}

export const ambientSound = new AmbientSoundManager();
