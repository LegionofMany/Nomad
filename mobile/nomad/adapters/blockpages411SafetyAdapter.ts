import type { NomadSafetyAdapter, NomadSafetyScanResult } from './walletAdapter';
import { scanUrlWithBlockpages411, type Blockpages411ClientConfig } from '../services/blockpages411Client';

export type Blockpages411SafetyAdapterOptions = Blockpages411ClientConfig & {
  fallback?: NomadSafetyAdapter;
};

function fallbackFailure(message: string): NomadSafetyScanResult {
  return {
    score: 0,
    risk: 'high',
    summary: message,
    provider: 'blockpages',
    checkedAt: new Date().toISOString(),
  };
}

export function createBlockpages411SafetyAdapter(options: Blockpages411SafetyAdapterOptions = {}): NomadSafetyAdapter {
  const { fallback, ...clientConfig } = options;

  return {
    async scanUrl(url: string) {
      try {
        return await scanUrlWithBlockpages411(url, clientConfig);
      } catch (error) {
        if (fallback) return fallback.scanUrl(url);
        const message = error instanceof Error ? error.message : 'Blockpages411 live scanner is unavailable.';
        return fallbackFailure(message);
      }
    },

    async scanAddress(address: string) {
      // Address scanning remains behind the safety adapter boundary. Until the Blockpages411
      // service exposes the address route, preserve the local scanner fallback.
      if (fallback) return fallback.scanAddress(address);
      const normalized = address.trim();
      if (!normalized) return fallbackFailure('No address supplied.');
      return {
        score: 70,
        risk: 'medium',
        summary: 'Blockpages411 address intelligence is not connected yet. URL scanner is live-ready; address scanner still requires the threat-intel address endpoint.',
        provider: 'blockpages',
        checkedAt: new Date().toISOString(),
      };
    },
  };
}
