export const SEMITONES = [0, -2, -4, -5, -7, -9, -11, -12];
export class BondAudio {
  constructor() { this.context = null; this.volume = .65; this.muted = false; this.shared = null; this.overrides = new Map(); this.active = new Set(); }
  async init() {
    if (!this.context) {
      this.context = new AudioContext(); this.master = this.context.createGain();
      this.limiter = this.context.createDynamicsCompressor(); this.limiter.threshold.value = -12; this.limiter.ratio.value = 8;
      this.destination = this.context.createMediaStreamDestination();
      this.master.connect(this.limiter); this.limiter.connect(this.context.destination); this.limiter.connect(this.destination);
      this.updateVolume();
    }
    if (this.context.state === 'suspended') await this.context.resume();
  }
  updateVolume() { if (this.master) this.master.gain.value = this.muted ? 0 : this.volume; }
  async decode(file) { await this.init(); return this.context.decodeAudioData(await file.arrayBuffer()); }
  stopAll() { for (const source of this.active) { try { source.stop(); } catch {} } this.active.clear(); }
  play(level, stageId) {
    if (!this.context || this.context.state !== 'running') return;
    const custom = this.overrides.get(stageId), buffer = custom || this.shared, t = this.context.currentTime;
    const envelope = this.context.createGain(); envelope.connect(this.master);
    let source;
    if (buffer) {
      source = this.context.createBufferSource(); source.buffer = buffer;
      source.playbackRate.value = 2 ** (SEMITONES[level] / 12);
      const duration = Math.min(buffer.duration / source.playbackRate.value, 3);
      envelope.gain.setValueAtTime(0, t); envelope.gain.linearRampToValueAtTime(.85, t + .006);
      envelope.gain.setValueAtTime(.85, t + Math.max(.006, duration - .035)); envelope.gain.linearRampToValueAtTime(0, t + duration);
      source.connect(envelope); source.start(t); source.stop(t + duration);
    } else {
      source = this.context.createOscillator(); source.type = 'sine';
      const frequency = 330 * 2 ** (SEMITONES[level] / 12);
      source.frequency.setValueAtTime(frequency * 1.55, t); source.frequency.exponentialRampToValueAtTime(frequency, t + .06);
      envelope.gain.setValueAtTime(.001, t); envelope.gain.exponentialRampToValueAtTime(.55, t + .008); envelope.gain.exponentialRampToValueAtTime(.001, t + .5);
      source.connect(envelope); source.start(t); source.stop(t + .52);
    }
    this.active.add(source); source.onended = () => { this.active.delete(source); envelope.disconnect(); source.disconnect(); };
  }
}
