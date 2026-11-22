/**
 * The Arkrilium apps that connect to Nomad.
 *
 * Each app's web address is set at build time (see eas.json), for example
 *   EXPO_PUBLIC_REQRIUM_URL=https://reqrium.example
 * Until an address is set, the app shows as "not linked yet" and the Open button is off.
 * Only https addresses are ever opened. The environment variables are written out in full on
 * purpose: Expo only replaces EXPO_PUBLIC_ variables that appear literally in the code.
 */

export type EcosystemAppId = 'reqrium' | 'guardian-trader' | 'syaxio' | 'zonycs';

export interface EcosystemApp {
  id: EcosystemAppId;
  name: string;
  role: string;
  summary: string;
  /** What this app can do with Nomad. "(planned)" items are not built yet. */
  withNomad: string[];
  url?: string;
}

export const ECOSYSTEM_APPS: EcosystemApp[] = [
  {
    id: 'reqrium',
    name: 'Reqrium',
    role: 'Identity and verification',
    summary: 'Verify who you are once, then prove it to other apps without handing over your documents.',
    withNomad: [
      'Sign in with your wallet',
      'Show a "verified" proof to another app, only when you approve it',
      'Your documents stay with Reqrium. They never reach Nomad.',
    ],
    url: process.env.EXPO_PUBLIC_REQRIUM_URL,
  },
  {
    id: 'guardian-trader',
    name: 'Guardian Trader',
    role: 'Trading with limits',
    summary: 'Trade from a pocket with a spending limit you set, so one bad trade cannot reach everything else.',
    withNomad: ['Sign in with your wallet', 'Trading allowance with a limit you set (planned)'],
    url: process.env.EXPO_PUBLIC_GUARDIAN_TRADER_URL,
  },
  {
    id: 'syaxio',
    name: 'Syaxio',
    role: 'Business accounting and payroll',
    summary: 'Accounting and payroll for businesses, connected to a business wallet.',
    withNomad: ['Sign in with your wallet', 'Read-only view of a business wallet for bookkeeping (planned). It can see, never spend.'],
    url: process.env.EXPO_PUBLIC_SYAXIO_URL,
  },
  {
    id: 'zonycs',
    name: 'Zonycs',
    role: 'Marketplace',
    summary: 'Buy and sell items with crypto.',
    withNomad: [
      'Sign in with your wallet',
      'Pay for items. You approve every payment on this phone.',
      'Show a verified-seller proof (needs Reqrium)',
    ],
    url: process.env.EXPO_PUBLIC_ZONYCS_URL,
  },
];

export function findEcosystemApp(id: string | undefined): EcosystemApp | undefined {
  return ECOSYSTEM_APPS.find((app) => app.id === id);
}

/** Only real https addresses are opened. */
export function openableUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' ? parsed.toString() : null;
  } catch {
    return null;
  }
}
