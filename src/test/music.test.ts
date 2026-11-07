import { vi } from 'vitest';
import { refreshMusic, setTrack, trackForGame, TRACK_COUNT, unlockMusic } from '../utils/music';
import { getProgress, patchSettings } from '../features/progression/store';

describe('musik latar (mp3)', () => {
  it('aman dipanggil tanpa dukungan audio', () => { expect(() => { setTrack('utama'); unlockMusic(); refreshMusic(); }).not.toThrow(); });
  it('volume bawaan sedang dan bisa diubah', () => { expect(getProgress().settings.musicVol).toBe(0.7); patchSettings({ musicVol: 1 }); expect(getProgress().settings.musicVol).toBe(1); patchSettings({ musicVol: 0.7 }); });
  it('jumlah mp3 per kategori sesuai', () => { expect(TRACK_COUNT).toEqual({ utama: 4, cozy: 7, party: 2, quiz: 3, board: 3 }); });
  it('game dipetakan ke kategori musik yang tepat', () => {
    expect(trackForGame({ group: 'pengetahuan' })).toBe('quiz');
    expect(trackForGame({ group: 'pasangan' })).toBe('cozy');
    expect(trackForGame({ group: 'grup' })).toBe('party');
    expect(trackForGame({ group: 'arkade', mechanic: 'whack' })).toBe('party');
    expect(trackForGame({ group: 'kartu' })).toBe('board');
    expect(trackForGame({ group: 'arkade', mechanic: 'tictactoe' })).toBe('board');
  });
  it('memutar mp3 sesuai kategori, pindah kategori, dan berhenti saat dimatikan', async () => {
    vi.useFakeTimers();
    const played: string[] = [];
    class FakeAudio { src = ''; preload = ''; paused = true; duration = NaN; currentTime = 0; onended: unknown = null; onerror: unknown = null;
      play() { this.paused = false; played.push(this.src); return Promise.resolve(); } pause() { this.paused = true; } }
    const param = () => ({ value: 0, cancelScheduledValues() { /* */ }, setValueAtTime() { /* */ }, linearRampToValueAtTime() { /* */ }, setTargetAtTime() { /* */ } });
    class FakeAC { currentTime = 0; state = 'running'; destination = {}; resume() { return Promise.resolve(); }
      createGain() { return { gain: param(), connect() { /* */ } }; } createBiquadFilter() { return { type: '', frequency: { value: 0 }, gain: { value: 0 }, connect() { /* */ } }; }
      createDynamicsCompressor() { return { threshold: { value: 0 }, knee: { value: 0 }, ratio: { value: 0 }, attack: { value: 0 }, release: { value: 0 }, connect() { /* */ } }; } createMediaElementSource() { return { connect() { /* */ } }; } }
    (window as unknown as { AudioContext: unknown }).AudioContext = FakeAC;
    (window as unknown as { Audio: unknown }).Audio = FakeAudio;
    (globalThis as unknown as { Audio: unknown }).Audio = FakeAudio;
    patchSettings({ music: true });
    setTrack('quiz'); unlockMusic();
    await vi.advanceTimersByTimeAsync(300);
    expect(played.some((s) => /audio\/music\/quiz-[1-3]\.mp3$/.test(s))).toBe(true);
    setTrack('party');
    await vi.advanceTimersByTimeAsync(300);
    expect(played.some((s) => /audio\/music\/party-[1-2]\.mp3$/.test(s))).toBe(true);
    patchSettings({ music: false }); refreshMusic();
    const before = played.length; await vi.advanceTimersByTimeAsync(2000); expect(played.length).toBe(before);
    vi.useRealTimers();
  });
});
