import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

interface RainModeContextValue {
  /** True when Plan B should be displayed */
  rainActive: boolean;
  /** Whether the user manually forced rain mode */
  manualOverride: boolean;
  /** API-derived auto-trigger (>40% rain probability) */
  autoTrigger: boolean;
  setManualOverride: (v: boolean) => void;
  setAutoTrigger: (v: boolean) => void;
}

const RainModeContext = createContext<RainModeContextValue | null>(null);

export function RainModeProvider({ children }: { children: ReactNode }) {
  const [manualOverride, setManualOverride] = useState(false);
  const [autoTrigger, setAutoTrigger] = useState(false);

  const value = useMemo<RainModeContextValue>(
    () => ({
      manualOverride,
      autoTrigger,
      rainActive: manualOverride || autoTrigger,
      setManualOverride,
      setAutoTrigger,
    }),
    [manualOverride, autoTrigger]
  );

  return <RainModeContext.Provider value={value}>{children}</RainModeContext.Provider>;
}

export function useRainMode() {
  const ctx = useContext(RainModeContext);
  if (!ctx) throw new Error('useRainMode must be used within RainModeProvider');
  return ctx;
}
