import { vi } from 'vitest';
import { refreshMusic, setTrack, unlockMusic } from '../utils/music';
import { melodyFor, mtof, STYLES, type Track } from '../utils/musicEngine';
import { getProgress, patchSettings } from '../features/progression/store';

const TRACKS: Track[] = ['lobi', 'game', 'arkade'];
describe('musik latar', () => {
  it('aman dipanggil tanpa dukungan audio', () => { expect(() => { setTrack('lobi'); unlockMusic(); refreshMusic(); }).not.toThrow(); });
  it('frekuensi MIDI benar', () => { expect(mtof(69)).toBeCloseTo(440); expect(mtof(57)).toBeCloseTo(220); expect(mtof(60)).toBeCloseTo(261.63, 1); });
  it('volume bawaan sedang dan bisa diubah', () => { expect(getProgress().settings.musicVol).toBe(0.55); patchSettings({ musicVol: 1 }); expect(getProgress().settings.musicVol).toBe(1); patchSettings({ musicVol: 0.55 }); });
  it('tiap lagu punya progresi 4 akor dan tempo wajar', () => { for (const t of TRACKS) { const s = STYLES[t]; expect(s.chords.length).toBe(4); expect(s.bpm).toBeGreaterThan(60); expect(s.bpm).toBeLessThan(200); } });
  it('melodi deterministik, variatif antar bar, dan berada di tangga nada', () => {
    for (const t of TRACKS) {
      expect(melodyFor(t, 5)).toEqual(melodyFor(t, 5));
      const bars = Array.from({ length: 8 }, (_, i) => JSON.stringify(melodyFor(t, i)));
      expect(new Set(bars).size).toBeGreaterThan(3);
      const s = STYLES[t], allowed = new Set(s.scale);
      for (let b = 0; b < 8; b++) for (const n of melodyFor(t, b)) if (n != null) expect(allowed.has(((n - s.root) % 12 + 12) % 12)).toBe(true);
    }
  });
  it('menjadwalkan banyak nada saat aktif dan berhenti saat dimatikan', async () => {
    vi.useFakeTimers();
    let made = 0;
    const node = (): unknown => new Proxy({}, { get: (_t, p) => (p === 'gain' || p === 'frequency' || p === 'detune' ? new Proxy({}, { get: () => () => undefined, set: () => true }) : () => undefined), set: () => true });
    class FakeAC { currentTime = 0; sampleRate = 44100; state = 'running'; destination = {}; resume() { return Promise.resolve(); } suspend() { return Promise.resolve(); }
      createGain() { return node(); } createOscillator() { made++; return node(); } createBiquadFilter() { return node(); } createConvolver() { return node(); } createDelay() { return node(); }
      createDynamicsCompressor() { return node(); } createWaveShaper() { return node(); } createBufferSource() { return node(); }
      createBuffer(_c: number, len: number) { return { getChannelData: () => new Float32Array(len) }; } }
    (window as unknown as { AudioContext: unknown }).AudioContext = FakeAC;
    patchSettings({ music: true });
    setTrack('game'); unlockMusic();
    for (let i = 0; i < 6; i++) await vi.advanceTimersByTimeAsync(200);
    expect(made).toBeGreaterThan(0);
    patchSettings({ music: false }); refreshMusic(); const before = made; await vi.advanceTimersByTimeAsync(2000); expect(made).toBe(before);
    vi.useRealTimers();
  });
});
