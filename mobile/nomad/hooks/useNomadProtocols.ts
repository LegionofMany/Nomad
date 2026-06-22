import { useCallback, useEffect, useMemo, useState } from 'react';

import { useNomadAdapters } from '../adapters/NomadAdaptersProvider';
import type { NomadOverlayAdapters, NomadProtocolsState } from '../adapters/walletAdapter';

const fallbackProtocols: NomadProtocolsState = {
  status: 'active',
  activeProtocols: 6,
  totalProtocols: 6,
  networkUptime: '99.99%',
  globalNodes: '1,248',
  countries: '32',
  message: 'The Voltaire Protocols are operating optimally.',
  protocols: [
    { title: 'Voltaire Security Layer', subtitle: 'Multi-layered security and threat protection', detail: 'ACTIVE  •  All systems secure', uptime: '99.99%', icon: '♢', color: '#35f883' },
    { title: 'Voltaire Interoperability Protocol (VIP)', subtitle: 'Cross-chain communication and asset mobility', detail: 'ACTIVE  •  42 Chains Connected', uptime: '99.98%', icon: '⌘', color: '#00e5ff' },
    { title: 'Voltaire Key Management Protocol (VKP)', subtitle: 'Sovereign key control and recovery framework', detail: 'ACTIVE  •  You own your keys', uptime: '100%', icon: '⚿', color: '#9b4dff' },
    { title: 'Voltaire Notary Protocol (VNP)', subtitle: 'Decentralized verification and digital notary', detail: 'ACTIVE  •  1,003 Notaries', uptime: '99.97%', icon: '▤', color: '#ffcc33' },
    { title: 'Voltaire Data Transmission Protocol (VDTP)', subtitle: 'Encrypted data routing and secure messaging', detail: 'ACTIVE  •  Private & Encrypted', uptime: '99.99%', icon: '⌁', color: '#00e5ff' },
    { title: 'Voltaire Governance Protocol (VGP)', subtitle: 'Community governance and protocol evolution', detail: 'ACTIVE  •  Proposals Live', uptime: '100%', icon: '♙', color: '#9b4dff' },
  ],
  health: [
    { label: 'Block Finality', value: '2.1 sec', note: 'Excellent', icon: '◷' },
    { label: 'Transaction Success', value: '99.97%', note: 'Excellent', icon: '✓' },
    { label: 'Security Events', value: '0', note: 'Last 7 Days', icon: '♢' },
    { label: 'Alerts', value: '0', note: 'All Clear', icon: '♧' },
    { label: 'Nodes Online', value: '1,248 / 1,300', note: '95.9%', icon: '◎' },
  ],
};

export function useNomadProtocols(adapterOverride?: NomadOverlayAdapters) {
  const providerAdapters = useNomadAdapters();
  const adapters = adapterOverride ?? providerAdapters;
  const protocolAdapter = adapters.protocols;
  const [protocols, setProtocols] = useState<NomadProtocolsState>(fallbackProtocols);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!protocolAdapter) {
      setError('Nomad protocols adapter is not connected.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setProtocols(await protocolAdapter.getProtocolsState());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load Voltaire Protocol state.');
    } finally {
      setLoading(false);
    }
  }, [protocolAdapter]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return useMemo(() => ({ protocols, loading, error, refresh }), [protocols, loading, error, refresh]);
}
