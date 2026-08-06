import React, { createContext, useContext, useMemo } from 'react';

import { localNomadOverlayAdapters } from './localNomadAdapters';
import { nomadSwapAdapter } from './nomadSwapAdapter';
import { nomadTravelAdapter } from './nomadTravelAdapter';
import type { NomadOverlayAdapters } from './walletAdapter';

type NomadAdaptersProviderProps = {
  adapters?: NomadOverlayAdapters;
  children: React.ReactNode;
};

const NomadAdaptersContext = createContext<NomadOverlayAdapters | null>(null);

export function mergeNomadAdapters(overrides?: NomadOverlayAdapters): NomadOverlayAdapters {
  return {
    ...localNomadOverlayAdapters,
    travel: nomadTravelAdapter,
    swap: nomadSwapAdapter,
    ...(overrides ?? {}),
  };
}

export function NomadAdaptersProvider({ adapters, children }: NomadAdaptersProviderProps) {
  const mergedAdapters = useMemo(() => mergeNomadAdapters(adapters), [adapters]);

  return (
    <NomadAdaptersContext.Provider value={mergedAdapters}>
      {children}
    </NomadAdaptersContext.Provider>
  );
}

export function useNomadAdapters(): NomadOverlayAdapters {
  return useContext(NomadAdaptersContext) ?? {
    ...localNomadOverlayAdapters,
    travel: nomadTravelAdapter,
    swap: nomadSwapAdapter,
  };
}
