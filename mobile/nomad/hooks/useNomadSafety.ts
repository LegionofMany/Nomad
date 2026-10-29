import { useCallback } from 'react';

import { useNomadAdapters } from '../adapters';
import type { NomadOverlayAdapters } from '../adapters/walletAdapter';

export function useNomadSafety(adapters?: NomadOverlayAdapters) {
  const contextAdapters = useNomadAdapters();
  const safety = (adapters ?? contextAdapters).safety;

  const scanAddress = useCallback(
    async (address: string) => {
      if (!safety) throw new Error('Nomad safety adapter is not connected.');
      return safety.scanAddress(address);
    },
    [safety],
  );

  const scanUrl = useCallback(
    async (url: string) => {
      if (!safety) throw new Error('Nomad safety adapter is not connected.');
      return safety.scanUrl(url);
    },
    [safety],
  );

  return { scanAddress, scanUrl };
}
