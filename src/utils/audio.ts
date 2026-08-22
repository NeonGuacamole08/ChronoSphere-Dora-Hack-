// Light and airy, peaceful quiet Harp & Flute ambient music with dynamic Air-Gliding breeze

class AmbientSoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private timerId: number | null = null;
  private fluteTimerId: number | null = null;

  // Air Gliding Wind Nodes (Only active during active zoom-in motion)
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windNoiseSource: AudioBufferSourceNode | null = null;
  private windStopTimeout: number | null = null;

  // Frequencies for a light Celtic/Lydian harp scale
  private readonly harpScale = [
    261.63, // C4
    329.63, // E4
    392.00, // G4
    493.88, // B4
    523.25, // C5
    587.33, // D5
    659.25, // E5
    783.99, // G5
    880.00, // A5
    1046.50, // C6
    1174.66, // D6
    1318.51, // E6
  ];

  // Peaceful, serene flute melody notes
  private readonly fluteMelody = [
    523.25, // C5
    659.25, // E5
    783.99, // G5
    880.00, // A5
    783.99, // G5
    659.25, // E5
    587.33, // D5
    523.25, // C5
    659.25, // E5
    783.99, // G5
    1046.50, // C6
    880.00, // A5
    783.99, // G5
    659.25, // E5
  ];

  private fluteStep = 0;

  // Initialize or get the shared AudioContext
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

  // Create looped stereo airy breeze noise buffer (high/mid frequency only, zero sub rumble)
  private createAirBreezeBuffer(ctx: AudioContext): AudioBuffer {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Soft airy filtered noise
        b0 = 0.96 * b0 + white * 0.08;
        b1 = 0.94 * b1 + white * 0.12;
        b2 = 0.88 * b2 + white * 0.22;
        data[i] = (b0 + b1 + b2) * 0.08;
      }
    }
    return buffer;
  }

  // Pure crystalline plucked harp note (Zero hum, zero drone)
  private playHarpPluck(freq: number, pan: number = 0, velocity: number = 1.0) {
    const ctx = this.getAudioContext();
    if (!ctx || !this.masterGain || !this.isPlaying) return;
    try {
      const now = ctx.currentTime;

      // Pure harp tone
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);

      // Delicate sparkle harmonic
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, now);

      // Note envelope - crisp pluck and smooth acoustic decay
      const noteGain = ctx.createGain();
      const peakVol = 0.15 * velocity;
      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(peakVol, now + 0.012);
      noteGain.gain.exponentialRampToValueAtTime(peakVol * 0.35, now + 0.3);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

      // Soft high-pass to completely eliminate any low frequency rumble or hum
      const highPass = ctx.createBiquadFilter();
      highPass.type = 'highpass';
      highPass.frequency.setValueAtTime(180, now);

      // Spatial stereo panning
      let panner: StereoPannerNode | null = null;
      if (ctx.createStereoPanner) {
        panner = ctx.createStereoPanner();
        panner.pan.setValueAtTime(pan, now);
      }

      osc1.connect(noteGain);
      osc2.connect(noteGain);
      noteGain.connect(highPass);

      if (panner) {
        highPass.connect(panner);
        panner.connect(this.masterGain);
      } else {
        highPass.connect(this.masterGain);
      }

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 2.1);
      osc2.stop(now + 2.1);
    } catch {
      // Audio context error handling
    }
  }

  // Pure, serene flute melody with natural vibrato (Zero hum, zero drone)
  private playFluteNote(freq: number, duration: number = 2.6) {
    const ctx = this.getAudioContext();
    if (!ctx || !this.masterGain || !this.isPlaying) return;
    try {
      const now = ctx.currentTime;

      // Flute primary tone
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Subtle vibrato LFO (5.0 Hz)
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(5.0, now);
      lfoGain.gain.setValueAtTime(freq * 0.005, now);
      lfo.connect(osc.frequency);

      // Flute envelope (gentle attack, graceful sustain, soft decay)
      const noteGain = ctx.createGain();
      const peakVol = 0.14;
      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(peakVol, now + 0.4);
      noteGain.gain.setValueAtTime(peakVol * 0.85, now + duration - 0.6);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      // Highpass filter to strictly eliminate any bass hum
      const highPass = ctx.createBiquadFilter();
      highPass.type = 'highpass';
      highPass.frequency.setValueAtTime(250, now);

      osc.connect(noteGain);
      noteGain.connect(highPass);
      highPass.connect(this.masterGain);

      lfo.start(now);
      osc.start(now);

      lfo.stop(now + duration);
      osc.stop(now + duration);
    } catch {
      // Audio context error handling
    }
  }

  // Harp Arpeggio sequence (spaced, quiet, melodic)
  private scheduleHarpLoop() {
    if (!this.isPlaying) return;

    // Pick 3-4 delicate harp notes in a cascade
    const chord = [
      this.harpScale[Math.floor(Math.random() * 3)],
      this.harpScale[3 + Math.floor(Math.random() * 3)],
      this.harpScale[6 + Math.floor(Math.random() * 3)],
      this.harpScale[8 + Math.floor(Math.random() * 4)],
    ];

    chord.forEach((freq, idx) => {
      const delayMs = idx * (200 + Math.random() * 40);
      setTimeout(() => {
        if (!this.isPlaying) return;
        const pan = (idx - 1.5) * 0.35;
        const velocity = 0.7 + Math.random() * 0.35;
        this.playHarpPluck(freq, pan, velocity);
      }, delayMs);
    });

    // Next harp cascade in 2.6 to 4.2 seconds
    const nextInterval = 2600 + Math.random() * 1600;
    this.timerId = window.setTimeout(() => this.scheduleHarpLoop(), nextInterval);
  }

  // Flute Melodic phrasing (peaceful, spacious)
  private scheduleFluteLoop() {
    if (!this.isPlaying) return;

    const currentNote = this.fluteMelody[this.fluteStep % this.fluteMelody.length];
    this.fluteStep++;

    const noteDuration = 2.4 + Math.random() * 0.6;
    this.playFluteNote(currentNote, noteDuration);

    const nextInterval = (noteDuration + 1.6 + Math.random() * 1.8) * 1000;
    this.fluteTimerId = window.setTimeout(() => this.scheduleFluteLoop(), nextInterval);
  }

  // ==========================================
  // DYNAMIC AIR-GLIDING BREEZE (ON ZOOM ONLY)
  // ==========================================

  private initWindNodes(ctx: AudioContext) {
    if (this.windGain && this.windFilter) return;

    try {
      // 1. Wind Gain - strictly starts at 0 (completely silent when stationary)
      this.windGain = ctx.createGain();
      this.windGain.gain.setValueAtTime(0.00001, ctx.currentTime);

      // 2. High Bandpass Filter (pure airy wind whistle with no low hum)
      this.windFilter = ctx.createBiquadFilter();
      this.windFilter.type = 'bandpass';
      this.windFilter.frequency.setValueAtTime(800, ctx.currentTime);
      this.windFilter.Q.setValueAtTime(2.2, ctx.currentTime);

      // 3. Air Breeze Loop
      const noiseBuffer = this.createAirBreezeBuffer(ctx);
      this.windNoiseSource = ctx.createBufferSource();
      this.windNoiseSource.buffer = noiseBuffer;
      this.windNoiseSource.loop = true;

      // Connect graph
      this.windNoiseSource.connect(this.windFilter);
      this.windFilter.connect(this.windGain);
      this.windGain.connect(ctx.destination);

      this.windNoiseSource.start();
    } catch {
      // Audio node initialization fallback
    }
  }

  /**
   * Update the real-time air gliding breeze sound when zooming in.
   */
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
    
    // Dynamic air rush frequency (higher airy breeze, no low frequency hum)
    const targetFreq = 750 + intensity * 1200;
    const targetVolume = 0.03 + intensity * 0.09;

    try {
      if (this.windGain && this.windFilter) {
        this.windFilter.frequency.setTargetAtTime(targetFreq, now, 0.08);
        this.windGain.gain.setTargetAtTime(targetVolume, now, 0.05);
      }
    } catch {}

    // Fade out to absolute silence when zoom motion stops
    this.windStopTimeout = window.setTimeout(() => {
      this.stopAirGlide();
    }, 200);
  }

  /**
   * Smoothly fade out the air gliding sound to silence when zoom stops.
   */
  public stopAirGlide() {
    if (!this.windGain || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      this.windGain.gain.setTargetAtTime(0.00001, now, 0.2);
    } catch {}
  }

  /**
   * Instant air-glide swoosh triggered on discrete zoom events
   */
  public triggerGlideSwoosh(intensity: number = 0.7) {
    this.updateAirGlide(intensity * 3.2);
  }

  // ==========================================
  // BACKGROUND HARP & FLUTE CONTROL
  // ==========================================

  public start() {
    if (this.isPlaying) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      // Master output volume - clearly audible and pleasant
      this.masterGain = ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      this.masterGain.gain.exponentialRampToValueAtTime(0.095, ctx.currentTime + 1.2);
      this.masterGain.connect(ctx.destination);

      this.isPlaying = true;
      this.fluteStep = 0;

      // Start gentle harp plucks immediately
      this.scheduleHarpLoop();

      // Start airy flute phrase after a short gentle introduction
      this.fluteTimerId = window.setTimeout(() => {
        this.scheduleFluteLoop();
      }, 1000);
    } catch (e) {
      console.warn('Web Audio API not supported or autoplay blocked:', e);
    }
  }

  public stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;

    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.fluteTimerId !== null) {
      clearTimeout(this.fluteTimerId);
      this.fluteTimerId = null;
    }

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
  }

  public toggle(): boolean {
    if (this.isPlaying) {
      this.stop();
      return true; // isMuted: true
    } else {
      this.start();
      return false; // isMuted: false
    }
  }
}

export const ambientSound = new AmbientSoundManager();
