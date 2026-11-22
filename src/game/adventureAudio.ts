class AdventureSound {
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

  setMuted(m: boolean): void {
    this.muted = m;
  }

  isMuted(): boolean {
    return this.muted;
  }

  private tone(f1: number, f2: number, dur: number, type: OscillatorType, vol: number, delay = 0): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f1, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, f2), now + dur);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  playTap(): void {
    this.tone(420, 520, 0.06, 'sine', 0.07);
  }

  playPickup(): void {
    this.tone(520, 780, 0.1, 'triangle', 0.1);
    this.tone(780, 1040, 0.14, 'sine', 0.1, 0.07);
  }

  playPuzzleSolve(): void {
    [523.25, 659.25, 783.99].forEach((n, i) => {
      this.tone(n, n * 1.02, 0.16, 'triangle', 0.12, i * 0.08);
    });
  }

  playError(): void {
    this.tone(240, 150, 0.18, 'sawtooth', 0.09);
  }

  playNoiseAlert(): void {
    this.tone(440, 290, 0.14, 'square', 0.07);
    this.tone(290, 220, 0.18, 'square', 0.07, 0.12);
  }

  playShhh(): void {
    this.tone(680, 420, 0.2, 'sine', 0.08);
  }

  playDistract(): void {
    this.tone(740, 380, 0.08, 'triangle', 0.11);
    this.tone(620, 920, 0.1, 'triangle', 0.09, 0.08);
  }

  playDoorUnlock(): void {
    this.tone(330, 495, 0.14, 'triangle', 0.12);
    this.tone(495, 660, 0.2, 'sine', 0.12, 0.1);
  }

  playPowerOn(): void {
    this.tone(180, 540, 0.35, 'sawtooth', 0.1);
    this.tone(540, 880, 0.25, 'sine', 0.1, 0.18);
  }

  playGhostlySight(): void {
    this.tone(260, 620, 0.28, 'sine', 0.1);
    this.tone(390, 880, 0.32, 'triangle', 0.08, 0.06);
  }

  playVictory(): void {
    [523.25, 659.25, 783.99, 1046.5].forEach((n, i) => {
      this.tone(n, n * 1.01, 0.28, 'triangle', 0.13, i * 0.11);
    });
  }

  playGameOver(): void {
    this.tone(310, 190, 0.25, 'triangle', 0.12);
    this.tone(190, 110, 0.36, 'triangle', 0.12, 0.22);
  }
}

export const adventureSound = new AdventureSound();
