class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  private ensureCtx(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  private playTone(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType,
    gainVal: number,
    delay = 0
  ): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, freqStart), now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + duration);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(gainVal, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  private playNoise(duration: number, gainVal: number, filterFreq = 900): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;

    const sampleCount = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleCount * 0.45));
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  }

  playBatSwing(): void {
    this.playTone(280, 95, 0.11, 'triangle', 0.12);
    this.playNoise(0.09, 0.07, 1200);
  }

  playBatHit(): void {
    this.playTone(170, 58, 0.12, 'sawtooth', 0.16);
    this.playNoise(0.08, 0.14, 700);
  }

  playNailgun(): void {
    this.playTone(540, 140, 0.07, 'square', 0.09);
    this.playNoise(0.05, 0.11, 2200);
  }

  playTesla(): void {
    this.playTone(980, 320, 0.14, 'sawtooth', 0.11);
    this.playTone(1450, 480, 0.12, 'sine', 0.08, 0.02);
  }

  playReload(): void {
    this.playTone(320, 480, 0.08, 'triangle', 0.08);
    this.playTone(480, 660, 0.09, 'triangle', 0.09, 0.1);
  }

  playEmptyClick(): void {
    this.playTone(220, 180, 0.04, 'square', 0.06);
  }

  playExplosion(): void {
    this.playTone(125, 32, 0.45, 'sawtooth', 0.25);
    this.playNoise(0.48, 0.28, 620);
  }

  playDecoyThrow(): void {
    this.playTone(340, 580, 0.1, 'sine', 0.08);
  }

  playDecoyPop(): void {
    this.playTone(760, 210, 0.08, 'square', 0.1);
    this.playTone(940, 240, 0.07, 'square', 0.08, 0.06);
  }

  playLootPickup(): void {
    this.playTone(520, 780, 0.1, 'sine', 0.1);
    this.playTone(780, 1040, 0.12, 'sine', 0.09, 0.06);
  }

  playKeyItemPickup(): void {
    this.playTone(440, 660, 0.12, 'triangle', 0.13);
    this.playTone(660, 880, 0.14, 'triangle', 0.13, 0.09);
    this.playTone(880, 1320, 0.2, 'sine', 0.14, 0.18);
  }

  playChaiHeal(): void {
    this.playTone(390, 585, 0.12, 'sine', 0.11);
    this.playTone(585, 780, 0.16, 'sine', 0.11, 0.08);
  }

  playAlarmSiren(): void {
    this.playTone(620, 920, 0.22, 'sawtooth', 0.1);
    this.playTone(920, 620, 0.22, 'sawtooth', 0.1, 0.22);
    this.playTone(620, 920, 0.22, 'sawtooth', 0.09, 0.44);
  }

  playZombieHit(): void {
    this.playTone(190, 88, 0.07, 'triangle', 0.09);
  }

  playPlayerHurt(): void {
    this.playTone(165, 65, 0.18, 'sawtooth', 0.18);
    this.playNoise(0.14, 0.13, 550);
  }

  playBruteSlam(): void {
    this.playTone(110, 35, 0.32, 'sawtooth', 0.22);
    this.playNoise(0.28, 0.2, 420);
  }

  playPuzzleTap(success = true): void {
    if (success) {
      this.playTone(640, 920, 0.08, 'sine', 0.11);
    } else {
      this.playTone(220, 120, 0.16, 'sawtooth', 0.12);
    }
  }

  playEscapeStart(): void {
    this.playTone(330, 660, 0.18, 'triangle', 0.14);
    this.playTone(495, 990, 0.22, 'triangle', 0.14, 0.14);
  }

  playVictory(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.playTone(n, n * 1.01, 0.26, 'triangle', 0.15, idx * 0.11);
    });
  }

  playGameOver(): void {
    this.playTone(320, 180, 0.24, 'sawtooth', 0.15);
    this.playTone(180, 90, 0.38, 'sawtooth', 0.15, 0.22);
  }
}

export const soundEngine = new SoundEngine();
