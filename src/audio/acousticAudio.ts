class AcousticAudioEngine {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private masterGain: GainNode | null = null;
  private isRunning: boolean = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(20000, this.ctx.currentTime);

      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0, this.ctx.currentTime);

      this.filterNode.connect(this.gainNode);
      this.gainNode.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public start(frequency: number, volume: number = 0.5) {
    this.initContext();
    if (!this.ctx || !this.filterNode || !this.gainNode) return;

    if (!this.isRunning) {
      this.osc = this.ctx.createOscillator();
      this.osc.type = 'sine';
      this.osc.frequency.setValueAtTime(Math.max(20, Math.min(10000, frequency)), this.ctx.currentTime);
      this.osc.connect(this.filterNode);
      this.osc.start();
      this.isRunning = true;
    } else if (this.osc) {
      this.osc.frequency.setTargetAtTime(Math.max(20, Math.min(10000, frequency)), this.ctx.currentTime, 0.05);
    }

    this.setVolume(volume);
  }

  public update(frequency: number, attenuationDB: number, isMuted: boolean, volume: number) {
    if (!this.ctx || !this.isRunning) return;

    if (isMuted) {
      this.gainNode?.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      return;
    }

    // Set frequency
    if (this.osc) {
      this.osc.frequency.setTargetAtTime(Math.max(20, Math.min(10000, frequency)), this.ctx.currentTime, 0.05);
    }

    // Calculate linear gain from attenuation dB:
    // gain = 10^(-dB / 20)
    // Clamp so it doesn't vanish entirely, giving an audible reference if very quiet
    const linearGain = Math.max(0.0001, Math.pow(10, -Math.min(80, Math.max(0, attenuationDB)) / 20));
    const finalGain = linearGain * volume * 0.4;

    if (this.gainNode) {
      this.gainNode.gain.setTargetAtTime(finalGain, this.ctx.currentTime, 0.05);
    }

    // Adjust filter cutoff based on transmission: heavy walls block high frequencies more
    if (this.filterNode) {
      const cutoff = Math.max(200, 10000 * Math.pow(10, -attenuationDB / 40));
      this.filterNode.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.08);
    }
  }

  public setVolume(volume: number) {
    if (!this.ctx || !this.masterGain) return;
    this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, volume * 0.5)), this.ctx.currentTime, 0.05);
  }

  public stop() {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
    setTimeout(() => {
      if (this.osc) {
        try {
          this.osc.stop();
          this.osc.disconnect();
        } catch {
          // ignore
        }
        this.osc = null;
      }
      this.isRunning = false;
    }, 100);
  }

  public playPulse() {
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const pulseOsc = this.ctx.createOscillator();
    const pulseGain = this.ctx.createGain();
    
    pulseOsc.type = 'triangle';
    pulseOsc.frequency.setValueAtTime(300, now);
    pulseOsc.frequency.exponentialRampToValueAtTime(80, now + 0.15);

    pulseGain.gain.setValueAtTime(0.4, now);
    pulseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    pulseOsc.connect(pulseGain);
    pulseGain.connect(this.masterGain || this.ctx.destination);

    pulseOsc.start(now);
    pulseOsc.stop(now + 0.25);
  }
}

export const acousticAudio = new AcousticAudioEngine();
