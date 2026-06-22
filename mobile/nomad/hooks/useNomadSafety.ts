import { useCallback } from 'react';

import { localNomadOverlayAdapters } from '../adapters/localNomadAdapters';
import type { NomadOverlayAdapters } from '../adapters/walletAdapter';

export function useNomadSafety(adapters: NomadOverlayAdapters = localNomadOverlayAdapters) {
  const safety = adapters.safety;

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
