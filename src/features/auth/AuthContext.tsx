import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { isFirebaseConfigured } from '../../lib/firebase/config';

export interface Me { uid: string; displayName: string; handle: string; email: string | null }
interface Ctx { configured: boolean; loading: boolean; me: Me | null; refresh: () => void; signOut: () => Promise<void> }
const C = createContext<Ctx>({ configured: false, loading: false, me: null, refresh: () => undefined, signOut: async () => undefined });
export const useAuth = () => useContext(C);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [me, setMe] = useState<Me | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    let off: (() => void) | undefined, dead = false;
    void (async () => {
      try {
        const a = await import('../../services/auth');
        const s = await import('../../services/social');
        off = a.watchAuth(async (u) => {
          if (dead) return;
          if (!u) { setMe(null); setLoading(false); return; }
          let handle = '';
          try { handle = (await s.myProfile(u.uid))?.handle ?? ''; } catch { /* offline */ }
          if (!dead) { setMe({ uid: u.uid, displayName: u.displayName, handle, email: u.email }); setLoading(false); }
        });
      } catch { setLoading(false); }
    })();
    return () => { dead = true; off?.(); };
  }, [tick]);
  const signOut = async () => { const a = await import('../../services/auth'); await a.logout(); setMe(null); };
  return <C.Provider value={{ configured: isFirebaseConfigured, loading, me, refresh: () => setTick((t) => t + 1), signOut }}>{children}</C.Provider>;
}
