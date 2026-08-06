import React, { createContext, useContext, useMemo } from 'react';

import { localNomadOverlayAdapters } from './localNomadAdapters';
import { nomadInsightsAdapter } from './nomadInsightsAdapter';
import { nomadProtocolsAdapter } from './nomadProtocolsAdapter';
import { nomadRecoveryAdapter } from './nomadRecoveryAdapter';
import { nomadSafetyAdapter } from './nomadSafetyAdapter';
import { nomadSecurityBridgeAdapter } from './nomadSecurityBridgeAdapter';
import { nomadSettingsAdapter } from './nomadSettingsAdapter';
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
    recovery: nomadRecoveryAdapter,
    security: nomadSecurityBridgeAdapter,
    settings: nomadSettingsAdapter,
    insights: nomadInsightsAdapter,
    protocols: nomadProtocolsAdapter,
    safety: nomadSafetyAdapter,
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
    recovery: nomadRecoveryAdapter,
    security: nomadSecurityBridgeAdapter,
    settings: nomadSettingsAdapter,
    insights: nomadInsightsAdapter,
    protocols: nomadProtocolsAdapter,
    safety: nomadSafetyAdapter,
  };
}
