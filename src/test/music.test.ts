import { vi } from 'vitest';
import { degreeFreq, refreshMusic, setTrack, TRACKS, unlockMusic } from '../utils/music';
import { patchSettings } from '../features/progression/store';

describe('musik latar', () => {
  it('aman dipanggil tanpa dukungan audio', () => { expect(() => { setTrack('lobi'); unlockMusic(); refreshMusic(); }).not.toThrow(); });
  it('frekuensi nada pentatonik benar', () => { expect(degreeFreq(220, 0, 0)).toBeCloseTo(220); expect(degreeFreq(220, 0, 5)).toBeCloseTo(440); expect(degreeFreq(220, 12, 0)).toBeCloseTo(440); });
  it('tiga lagu punya pola 16 langkah', () => { for (const t of Object.values(TRACKS)) { expect(t.lead.length).toBe(16); expect(t.bass.length).toBe(16); } });
  it('menjadwalkan nada saat aktif dan berhenti saat dimatikan', async () => {
    vi.useFakeTimers();
    let made = 0;
    const node = () => new Proxy({}, { get: (_t, p) => (p === 'gain' || p === 'frequency' ? new Proxy({}, { get: () => () => undefined, set: () => true }) : () => undefined), set: () => true });
    class FakeAC { currentTime = 0; state = 'running'; destination = {}; resume() { return Promise.resolve(); } suspend() { return Promise.resolve(); }
      createGain() { return node(); } createOscillator() { made++; return node(); } createBuffer() { return { getChannelData: () => new Float32Array(8) }; } createBufferSource() { return node(); } }
    (window as unknown as { AudioContext: unknown }).AudioContext = FakeAC;
    patchSettings({ music: true });
    setTrack('game'); unlockMusic();
    const tick = async () => { for (let i = 0; i < 6; i++) await vi.advanceTimersByTimeAsync(200); };
    await tick();
    expect(made).toBeGreaterThan(0);
    patchSettings({ music: false }); refreshMusic(); const before = made; await vi.advanceTimersByTimeAsync(2000); expect(made).toBe(before);
    vi.useRealTimers();
  });
});
