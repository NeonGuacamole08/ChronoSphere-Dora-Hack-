class AmbientSoundManager {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;
  private oscillators: OscillatorNode[] = [];

  public start() {
    if (this.isPlaying) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0.01, this.ctx.currentTime);
      this.gainNode.gain.exponentialRampToValueAtTime(0.08, this.ctx.currentTime + 2.0);
      this.gainNode.connect(this.ctx.destination);

      // Low ethereal sine waves for cosmic ambient wind
      const freqs = [108, 162, 216, 324];
      this.oscillators = freqs.map((freq) => {
        const osc = this.ctx!.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime);

        const panner = this.ctx!.createStereoPanner ? this.ctx!.createStereoPanner() : null;
        if (panner) {
          panner.pan.setValueAtTime((Math.random() - 0.5) * 0.8, this.ctx!.currentTime);
          osc.connect(panner);
          panner.connect(this.gainNode!);
        } else {
          osc.connect(this.gainNode!);
        }

        osc.start();
        return osc;
      });

      this.isPlaying = true;
    } catch (e) {
      console.warn('Web Audio API not supported or autoplay blocked:', e);
    }
  }

  public stop() {
    if (!this.isPlaying || !this.ctx || !this.gainNode) return;
    try {
      this.gainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.8);
      setTimeout(() => {
        this.oscillators.forEach((osc) => {
          try {
            osc.stop();
            osc.disconnect();
          } catch (e) {}
        });
        this.oscillators = [];
        this.ctx?.close();
        this.ctx = null;
        this.isPlaying = false;
      }, 850);
    } catch (e) {
      this.isPlaying = false;
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
