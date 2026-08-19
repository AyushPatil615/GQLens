import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────
export type AppMode = 'learning' | 'production';

interface ModeContextValue {
  mode:    AppMode;
  setMode: (m: AppMode) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────
const ModeContext = createContext<ModeContextValue>({
  mode:    'learning',
  setMode: () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppMode>('learning');
  return (
    <ModeContext.Provider value={{ mode, setMode }}>
      {children}
    </ModeContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAppMode(): ModeContextValue {
  return useContext(ModeContext);
}
