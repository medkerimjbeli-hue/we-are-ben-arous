import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { loadPublicCatalog, type PublicCatalog } from './catalog';

interface State { catalog: PublicCatalog | null; error: string | null; loading: boolean; reload: () => void }
const Ctx = createContext<State | null>(null);

export function CatalogProvider({ children, initial }: { children: ReactNode; initial?: PublicCatalog }) {
  const [catalog, setCatalog] = useState<PublicCatalog | null>(initial ?? null);
  const [error, setError] = useState<string | null>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (initial && n === 0) return;
    let alive = true;
    setError(null);
    loadPublicCatalog().then((c) => alive && setCatalog(c)).catch((e: Error) => alive && setError(e.message));
    return () => { alive = false; };
  }, [n, initial]);
  const reload = useCallback(() => setN((x) => x + 1), []);
  const value = useMemo(() => ({ catalog, error, loading: !catalog && !error, reload }), [catalog, error, reload]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCatalog() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCatalog outside CatalogProvider');
  return v;
}
