import { useEffect } from 'react';
import { refreshMusic, setTrack, type Track } from '../utils/music';
import { useProgress } from '../features/progression/store';
export function useMusic(track: Track | null) {
  const on = useProgress().settings.music;
  useEffect(() => { if (track) setTrack(track); }, [track]);
  useEffect(() => { refreshMusic(); }, [on]);
}
