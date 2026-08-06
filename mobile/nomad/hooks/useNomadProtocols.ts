import { useCallback, useEffect, useMemo, useState } from 'react';

import { useNomadAdapters } from '../adapters/NomadAdaptersProvider';
import type {
  ArkriliumProtocolsAdapter,
  ArkriliumProtocolsState,
  ArkriliumProtocolRow,
  ArkriliumHealthItem,
  NomadOverlayAdapters,
  NomadProtocolsState,
} from '../adapters';

const fallbackProtocols: ArkriliumProtocolsState = {
  status: 'offline',
  activeProtocols: 0,
  totalProtocols: 6,
  networkUptime: 'Not verified',
  globalNodes: 'Not connected',
  countries: '—',
  message: 'Arkrilium protocol evidence has not been loaded.',
  protocols: [],
  health: [],
  checkedAt: new Date(0).toISOString(),
  remoteTelemetryConnected: false,
  dataSource: 'local_adapter_evidence',
  check: {
    id: 'protocol-check-not-run',
    checkedAt: new Date(0).toISOString(),
    status: 'attention_required',
    available: 0,
    limited: 0,
    notConfigured: 0,
    unavailable: 6,
  },
};

function isArkriliumAdapter(adapter: unknown): adapter is ArkriliumProtocolsAdapter {
  return Boolean(
    adapter
    && typeof (adapter as ArkriliumProtocolsAdapter).getArkriliumProtocolsState === 'function'
    && typeof (adapter as ArkriliumProtocolsAdapter).runProtocolCheck === 'function',
  );
}

function routeForProtocol(title: string) {
  if (/security/i.test(title)) return 'SecurityCenter';
  if (/key|recovery/i.test(title)) return 'RecoveryCenter';
  if (/notary|verification/i.test(title)) return 'BlockPagesSafety';
  if (/interoperability|swap/i.test(title)) return 'Swap';
  return 'Settings';
}

function extendBaseState(base: NomadProtocolsState): ArkriliumProtocolsState {
  const checkedAt = new Date().toISOString();
  const protocols: ArkriliumProtocolRow[] = base.protocols.map((item, index) => ({
    ...item,
    id: (['security_layer', 'interoperability', 'key_management', 'notary_verification', 'data_transmission', 'governance'][index] ?? 'data_transmission') as ArkriliumProtocolRow['id'],
    title: item.title.replace(/Voltaire Protocols?/gi, 'Arkrilium').replace(/Voltaire/gi, 'Arkrilium'),
    subtitle: item.subtitle.replace(/Voltaire Protocols?/gi, 'Arkrilium').replace(/Voltaire/gi, 'Arkrilium'),
    detail: `${item.detail.replace(/Voltaire Protocols?/gi, 'Arkrilium').replace(/Voltaire/gi, 'Arkrilium')} Provider evidence is not available from this adapter.`,
    status: 'limited',
    statusLabel: 'LIMITED',
    uptime: 'LIMITED',
    route: routeForProtocol(item.title),
    source: 'not_connected',
    provider: 'Legacy protocol adapter',
    checkedAt,
  }));
  const health: ArkriliumHealthItem[] = base.health.map((item) => ({
    ...item,
    status: 'review',
  }));

  return {
    ...base,
    status: 'degraded',
    activeProtocols: 0,
    networkUptime: 'Not verified',
    globalNodes: 'Not connected',
    countries: '—',
    message: base.message.replace(/Voltaire Protocols?/gi, 'Arkrilium protocols').replace(/Voltaire/gi, 'Arkrilium'),
    protocols,
    health,
    checkedAt,
    remoteTelemetryConnected: false,
    dataSource: 'local_adapter_evidence',
    check: {
      id: `legacy-protocol-check-${Date.now()}`,
      checkedAt,
      status: 'attention_required',
      available: 0,
      limited: protocols.length,
      notConfigured: 0,
      unavailable: Math.max(0, 6 - protocols.length),
    },
  };
}

export type NomadProtocolsHookState = {
  protocols: ArkriliumProtocolsState;
  loading: boolean;
  error: string | null;
  refresh(): Promise<ArkriliumProtocolsState | void>;
  runCheck(): Promise<ArkriliumProtocolsState | void>;
};

export function useNomadProtocols(adapterOverride?: NomadOverlayAdapters): NomadProtocolsHookState {
  const providerAdapters = useNomadAdapters();
  const protocolAdapter = (adapterOverride ?? providerAdapters).protocols;
  const [protocols, setProtocols] = useState<ArkriliumProtocolsState>(fallbackProtocols);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (forceCheck: boolean) => {
    if (!protocolAdapter) {
      setError('Arkrilium protocol adapter is not connected.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const next = isArkriliumAdapter(protocolAdapter)
        ? forceCheck
          ? await protocolAdapter.runProtocolCheck()
          : await protocolAdapter.getArkriliumProtocolsState()
        : extendBaseState(await protocolAdapter.getProtocolsState());
      setProtocols(next);
      return next;
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load Arkrilium protocol evidence.');
      return undefined;
    } finally {
      setLoading(false);
    }
  }, [protocolAdapter]);

  useEffect(() => {
    void load(false);
  }, [load]);

  const refresh = useCallback(() => load(false), [load]);
  const runCheck = useCallback(() => load(true), [load]);

  return useMemo(
    () => ({ protocols, loading, error, refresh, runCheck }),
    [protocols, loading, error, refresh, runCheck],
  );
}
