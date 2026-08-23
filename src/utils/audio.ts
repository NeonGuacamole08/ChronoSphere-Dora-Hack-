// 100% Royalty-free Web Audio soundscape engine with 4 distinct ambient themes:
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
  private isPlaying: boolean = true; // ON by default
  private currentTheme: SoundTheme = 'nostalgic';

  private primaryLoopTimer: number | null = null;
  private secondaryLoopTimer: number | null = null;
  private stepIndex: number = 0;

  // Listeners for UI state synchronization
  private listeners: Array<(theme: SoundTheme, isPlaying: boolean) => void> = [];

  constructor() {
    // Attempt auto-start on first user interaction in browser (due to autoplay policy)
    if (typeof window !== 'undefined') {
      const handleUserGesture = () => {
        if (this.isPlaying) {
          this.ensurePlaying();
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
    // Immediately notify current state
    callback(this.currentTheme, this.isPlaying);
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

  private ensurePlaying() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      if (!this.masterGain) {
        this.masterGain = ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
        this.masterGain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.8);
        this.masterGain.connect(ctx.destination);
      } else {
        this.masterGain.gain.cancelScheduledValues(ctx.currentTime);
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, ctx.currentTime);
        this.masterGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.3);
      }

      this.clearTimers();
      this.startThemeLoops();
    } catch (e) {
      console.warn('Audio start error:', e);
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
      const peak = 0.14;
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
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);

      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2.756, now);

      const osc3 = ctx.createOscillator();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(freq * 4.02, now);

      const noteGain = ctx.createGain();
      const peak = 0.13 * velocity;
      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(peak, now + 0.008);
      noteGain.gain.exponentialRampToValueAtTime(peak * 0.4, now + 0.5);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

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
      osc1.stop(now + 3.3);
      osc2.stop(now + 3.3);
      osc3.stop(now + 3.3);
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

      const oscDetune = ctx.createOscillator();
      oscDetune.type = 'sine';
      oscDetune.frequency.setValueAtTime(freq * 1.003, now);

      const noteGain = ctx.createGain();
      const peak = 0.08;
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
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);

      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 3, now);

      const noteGain = ctx.createGain();
      const peak = 0.15 * velocity;
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

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(4.2, now);
      lfoGain.gain.setValueAtTime(freq * 0.007, now);
      lfo.connect(osc1.frequency);
      lfo.connect(osc2.frequency);

      const noteGain = ctx.createGain();
      const peak = 0.11;
      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(peak, now + 0.6);
      noteGain.gain.setValueAtTime(peak * 0.9, now + duration - 0.7);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

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

    const chordIndex = this.stepIndex % this.sadPianoChords.length;
    const chord = this.sadPianoChords[chordIndex];
    this.playSadPianoChord(chord);

    const celloFreq = this.sadCelloNotes[Math.floor(Math.random() * this.sadCelloNotes.length)];
    setTimeout(() => {
      if (!this.isPlaying || this.currentTheme !== 'sad') return;
      this.playSadCello(celloFreq, 3.4);
    }, 600);

    this.stepIndex++;
    this.primaryLoopTimer = window.setTimeout(() => this.runSadLoop(), 3600 + Math.random() * 1000);
  }

  // =========================================================================
  // LIFECYCLE CONTROLS
  // =========================================================================
  public start() {
    this.isPlaying = true;
    this.ensurePlaying();
    this.notify();
  }

  public stop() {
    this.isPlaying = false;
    this.clearTimers();

    if (this.masterGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        this.masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.3);
      } catch {}
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

  // =========================================================================
  // BURIAL & LOCK SOUND SEQUENCE
  // =========================================================================
  public playShovelDigSound() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Filtered noise burst for soil scraping
      const bufferSize = ctx.sampleRate * 0.35;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(450, now);
      bandpass.Q.setValueAtTime(1.8, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.001, now);
      noiseGain.gain.linearRampToValueAtTime(0.25, now + 0.06);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      noise.connect(bandpass);
      bandpass.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 0.36);
    } catch (e) {
      console.warn('Could not play shovel sound:', e);
    }
  }

  public playSoilPatSound() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {
      console.warn('Could not play soil pat sound:', e);
    }
  }

  public playBurialLockSound() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // 1. Heavy Metallic Lock Click / Snap
      const snapOsc = ctx.createOscillator();
      snapOsc.type = 'triangle';
      snapOsc.frequency.setValueAtTime(800, now);
      snapOsc.frequency.exponentialRampToValueAtTime(80, now + 0.12);

      const snapGain = ctx.createGain();
      snapGain.gain.setValueAtTime(0.35, now);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      snapOsc.connect(snapGain);
      snapGain.connect(ctx.destination);
      snapOsc.start(now);
      snapOsc.stop(now + 0.2);

      // 2. Earth Soil Impact / Deep Rumble Thud
      const thudOsc = ctx.createOscillator();
      thudOsc.type = 'sine';
      thudOsc.frequency.setValueAtTime(140, now + 0.05);
      thudOsc.frequency.exponentialRampToValueAtTime(45, now + 0.7);

      const thudGain = ctx.createGain();
      thudGain.gain.setValueAtTime(0.001, now);
      thudGain.gain.linearRampToValueAtTime(0.4, now + 0.08);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(180, now);

      thudOsc.connect(thudGain);
      thudGain.connect(lowpass);
      lowpass.connect(ctx.destination);
      thudOsc.start(now + 0.05);
      thudOsc.stop(now + 0.9);

      // 3. Shimmering Cryptographic Seal Chime
      const chimeFreqs = [523.25, 659.25, 783.99, 1046.5];
      chimeFreqs.forEach((freq, i) => {
        const cOsc = ctx.createOscillator();
        cOsc.type = 'sine';
        cOsc.frequency.setValueAtTime(freq, now + 0.2 + i * 0.07);

        const cGain = ctx.createGain();
        cGain.gain.setValueAtTime(0.001, now + 0.2 + i * 0.07);
        cGain.gain.linearRampToValueAtTime(0.12, now + 0.22 + i * 0.07);
        cGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4 + i * 0.07);

        cOsc.connect(cGain);
        cGain.connect(ctx.destination);
        cOsc.start(now + 0.2 + i * 0.07);
        cOsc.stop(now + 1.5 + i * 0.07);
      });
    } catch (e) {
      console.warn('Could not play burial sound:', e);
    }
  }
}

export const ambientSound = new AmbientSoundManager();
