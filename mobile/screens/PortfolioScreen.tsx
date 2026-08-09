import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { useNomadRecovery, useNomadSecurity, useNomadTravel, useNomadWallet } from '../nomad';
import { useAppState } from '../state/appState';
import { BottomNav, C, NomadBrandMark, NomadPage, Panel, ProgressBar, useNomadLayout } from '../ui/NomadShell';

type RouteName =
  | 'Portfolio'
  | 'Wallets'
  | 'SendBitcoin'
  | 'ReceiveBitcoin'
  | 'Swap'
  | 'TravelMode'
  | 'SecurityCenter'
  | 'Settings'
  | 'RecoveryCenter'
  | 'CreateOwnerAuthority'
  | 'NomadWatch'
  | 'VoltaireProtocols'
  | 'BlockPagesSafety';

type Asset = {
  symbol: string;
  amount: string;
  value: string;
  mark: string;
  tint: string;
  textColor?: string;
};

type EcosystemItem = {
  label: string;
  kind: 'nomad' | 'autodefi' | 'blockpages' | 'payroll' | 'guardian' | 'lottery' | 'retirement';
  color: string;
  route: RouteName;
};

function SecureShield({ size = 30, color = C.green, locked = false }: { size?: number; color?: string; locked?: boolean }) {
  return (
    <Svg accessibilityLabel="Secure shield" width={size} height={size * 1.15} viewBox="0 0 54 62" fill="none">
      <Path d="M27 3 49 13v17c0 16-9 27-22 34C14 57 5 46 5 30V13Z" fill="#021420" stroke={color} strokeWidth="3" />
      {locked ? (
        <><Rect x="18" y="28" width="18" height="15" rx="3" stroke={color} strokeWidth="3" /><Path d="M22 28v-5a5 5 0 0 1 10 0v5M27 34v4" stroke={color} strokeWidth="3" strokeLinecap="round" /></>
      ) : <Path d="m17 31 7 7 14-16" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />}
    </Svg>
  );
}

function EyeIcon({ size = 20 }: { size?: number }) {
  return <Svg accessibilityLabel="Balance visibility" width={size} height={size * 0.7} viewBox="0 0 32 22" fill="none"><Path d="M2 11s5-9 14-9 14 9 14 9-5 9-14 9S2 11 2 11Z" stroke="#b9c6d8" strokeWidth="2" /><Circle cx="16" cy="11" r="4" stroke="#b9c6d8" strokeWidth="2" /></Svg>;
}

function BellIcon({ size = 24 }: { size?: number }) {
  return <Svg accessibilityLabel="Alerts" width={size} height={size} viewBox="0 0 32 32" fill="none"><Path d="M8 21h16l-2-3v-6a6 6 0 0 0-12 0v6l-2 3Z" stroke="#b7c4d9" strokeWidth="2.2" strokeLinejoin="round" /><Path d="M13 24a3 3 0 0 0 6 0" stroke="#b7c4d9" strokeWidth="2.2" strokeLinecap="round" /></Svg>;
}

function PlaneIcon({ size = 24, color = C.green }: { size?: number; color?: string }) {
  return <Svg accessibilityLabel="Travel" width={size} height={size} viewBox="0 0 32 32" fill="none"><Path d="m4 18 10-3 6-10 3 1-2 10 6 4-1 3-7-2-4 7-2-1 1-8-9 2-1-3Z" fill={color} stroke={color} strokeLinejoin="round" /></Svg>;
}

function VoltaireMark({ size = 30 }: { size?: number }) {
  return <Svg accessibilityLabel="Voltaire Protocols" width={size} height={size} viewBox="0 0 48 48" fill="none"><Path d="M23 14C18 6 10 5 5 7c2 7 6 13 14 15-8 1-13 6-15 12 7 3 14 1 20-5M25 14c5-8 13-9 18-7-2 7-6 13-14 15 8 1 13 6 15 12-7 3-14 1-20-5" fill="#47208e" stroke={C.purple} strokeWidth="2" strokeLinejoin="round" /><Path d="M24 13v22" stroke={C.purple} strokeWidth="3" strokeLinecap="round" /></Svg>;
}

type SecurityKind = 'storage' | 'authority' | 'device' | 'recovery';

function SecurityArtwork({ kind, size = 30 }: { kind: SecurityKind; size?: number }) {
  const stroke = { stroke: C.green, strokeWidth: 2.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  let artwork: React.ReactNode;
  if (kind === 'storage') artwork = <><Path d="M16 3 28 8v9c0 8-4 13-12 17C8 30 4 25 4 17V8Z" {...stroke} /><Rect x="11" y="15" width="10" height="9" rx="2" {...stroke} /><Path d="M13 15v-2a3 3 0 0 1 6 0v2M16 19v2" {...stroke} /></>;
  else if (kind === 'authority') artwork = <><Path d="M16 3 28 8v9c0 8-4 13-12 17C8 30 4 25 4 17V8Z" {...stroke} /><Path d="m10 18 4 4 8-9" {...stroke} /></>;
  else if (kind === 'device') artwork = <><Rect x="7" y="4" width="19" height="27" rx="3" {...stroke} /><Path d="M12 9h9M12 14h9M12 19h5M23 22v8M19 26h8" {...stroke} /></>;
  else artwork = <><Circle cx="16" cy="18" r="9" {...stroke} /><Path d="M16 5v5M16 26v5M3 18h5M24 18h5M8 10l4 4M24 10l-4 4" {...stroke} /><Circle cx="16" cy="18" r="3" {...stroke} /></>;
  return <Svg accessibilityLabel={`${kind} security status`} width={size} height={size} viewBox="0 0 32 36" fill="none">{artwork}</Svg>;
}

function EcosystemArtwork({ kind, color, size }: { kind: EcosystemItem['kind']; color: string; size: number }) {
  const stroke = { stroke: color, strokeWidth: 2.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  let artwork: React.ReactNode;
  if (kind === 'nomad') artwork = <><Path d="M24 7 39 13v11c0 11-6 18-15 23-9-5-15-12-15-23V13Z" fill="#07224c" {...stroke} /><Path d="M14 27h6l4-7 5 12 4-7h4" {...stroke} /></>;
  else if (kind === 'autodefi') artwork = <><Circle cx="17" cy="18" r="8" {...stroke} /><Circle cx="31" cy="18" r="8" {...stroke} /><Circle cx="24" cy="31" r="8" {...stroke} /></>;
  else if (kind === 'guardian') artwork = <><Path d="M24 6 39 12v12c0 10-6 17-15 22C15 41 9 34 9 24V12Z" fill="#063b24" {...stroke} /><Circle cx="24" cy="21" r="4" {...stroke} /><Path d="M17 33c1-5 4-7 7-7s6 2 7 7" {...stroke} /></>;
  else if (kind === 'lottery') artwork = <><Circle cx="24" cy="24" r="15" fill="#35157b" {...stroke} /><Circle cx="24" cy="24" r="6" {...stroke} /><Path d="M24 5v7M24 36v7" {...stroke} /></>;
  else if (kind === 'retirement') artwork = <><Circle cx="24" cy="24" r="14" {...stroke} /><Circle cx="24" cy="24" r="5" {...stroke} /><Path d="M24 5v5M24 38v5M5 24h5M38 24h5M11 11l4 4M37 11l-4 4M11 37l4-4M37 37l-4-4" {...stroke} /></>;
  else artwork = null;

  return (
    <View style={[styles.ecoIcon, { width: size, height: size, borderRadius: size / 2, borderColor: color }]}>
      {kind === 'blockpages' ? <Text style={[styles.logoNumber, { color, fontSize: size * 0.32 }]}>411</Text> : null}
      {kind === 'payroll' ? <Text style={[styles.logoDollar, { color, fontSize: size * 0.52 }]}>$</Text> : null}
      {artwork ? <Svg width={size * 0.75} height={size * 0.75} viewBox="0 0 48 48" fill="none">{artwork}</Svg> : null}
    </View>
  );
}

function PortfolioChart({ style }: { style?: any }) {
  return (
    <Svg accessibilityLabel="Portfolio value trend" width="100%" height="100%" viewBox="0 0 520 190" fill="none" style={style}>
      <Defs><LinearGradient id="portfolioFill" x1="0" y1="0" x2="0" y2="190"><Stop stopColor={C.blue} stopOpacity={0.4} /><Stop offset="1" stopColor={C.blue} stopOpacity={0} /></LinearGradient></Defs>
      <G opacity={0.16} stroke={C.blue}><Path d="M0 42h520M0 84h520M0 126h520M0 168h520" /><Path d="M80 0v190M170 0v190M260 0v190M350 0v190M440 0v190" /></G>
      <Path d="M8 165 C42 160 53 154 78 145 S116 148 145 131 S177 116 208 121 S243 98 273 89 S311 99 335 79 S370 62 396 70 S430 50 454 31 S488 45 512 11 L512 190 L8 190Z" fill="url(#portfolioFill)" />
      <Path d="M8 165 C42 160 53 154 78 145 S116 148 145 131 S177 116 208 121 S243 98 273 89 S311 99 335 79 S370 62 396 70 S430 50 454 31 S488 45 512 11" stroke={C.blue} strokeWidth="5" strokeLinecap="round" />
    </Svg>
  );
}

function WorldBackdrop({ style, color = C.green }: { style?: any; color?: string }) {
  const gradientId = color === C.blue ? 'worldGlowBlue' : 'worldGlowGreen';
  return (
    <Svg pointerEvents="none" width="100%" height="100%" viewBox="0 0 640 240" fill="none" style={style}>
      <Defs><LinearGradient id={gradientId} x1="0" y1="0" x2="640" y2="240"><Stop stopColor={color} stopOpacity={0.12} /><Stop offset="1" stopColor={color} stopOpacity={0} /></LinearGradient></Defs>
      <Rect width="640" height="240" fill={`url(#${gradientId})`} />
      <G stroke={color} strokeOpacity={0.23} strokeWidth="1.4"><Path d="M86 92c54-36 128-52 196-42 74 11 121 55 190 57 54 2 88-20 122-37" /><Path d="M74 136c76-27 139-19 198 10 63 31 130 35 210 5 46-17 79-34 116-27" /><Ellipse cx="457" cy="130" rx="142" ry="81" /><Ellipse cx="457" cy="130" rx="92" ry="81" /><Ellipse cx="457" cy="130" rx="42" ry="81" /><Path d="M315 130h284M335 92h244M335 169h244" /></G>
      <G fill={color} opacity={0.3}><Circle cx="408" cy="103" r="3" /><Circle cx="438" cy="83" r="2" /><Circle cx="492" cy="104" r="2" /><Circle cx="535" cy="145" r="3" /><Circle cx="462" cy="166" r="2" /></G>
    </Svg>
  );
}

function ActionArtwork({ kind, size }: { kind: 'send' | 'receive' | 'swap' | 'travel'; size: number }) {
  return (
    <Svg accessibilityLabel={`${kind} action`} width={size} height={size} viewBox="0 0 64 64" fill="none">
      {kind === 'send' ? <><Circle cx="32" cy="32" r="26" fill="#06244a" stroke={C.blue} strokeWidth="3" /><Path d="M32 47V18m0 0L21 29m11-11 11 11" stroke={C.blue} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /></> : null}
      {kind === 'receive' ? <Path d="M32 9v36m0 0L19 32m13 13 13-13M15 54h34" stroke={C.blue} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /> : null}
      {kind === 'swap' ? <Path d="M13 22h36m0 0-9-9m9 9-9 9M51 43H15m0 0 9-9m-9 9 9 9" stroke={C.blue} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /> : null}
      {kind === 'travel' ? <><Rect x="11" y="21" width="39" height="30" rx="4" stroke={C.blue} strokeWidth="4" /><Path d="M22 21v-7h17v7M45 40h13M52 33v14" stroke={C.blue} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></> : null}
    </Svg>
  );
}

const previewAssets: Asset[] = [
  { symbol: 'BTC', amount: '0.3567', value: '$22,123.10', mark: '₿', tint: '#ff9814' },
  { symbol: 'HBAR', amount: '3,250.00', value: '$1,250.25', mark: 'H', tint: '#6544e9' },
  { symbol: 'XRP', amount: '1,250.00', value: '$750.00', mark: 'X', tint: '#111821' },
  { symbol: 'XLM', amount: '5,200.00', value: '$310.40', mark: 'S', tint: '#0f7ff7' },
];

const assetVisuals: Record<string, Pick<Asset, 'mark' | 'tint' | 'textColor'>> = {
  BTC: { mark: '₿', tint: '#ff9814' },
  HBAR: { mark: 'H', tint: '#6544e9' },
  XRP: { mark: 'X', tint: '#111821' },
  XLM: { mark: 'S', tint: '#0f7ff7' },
  ETH: { mark: 'Ξ', tint: '#6574ca' },
  USDC: { mark: '$', tint: '#2775ca' },
  USDT: { mark: '₮', tint: '#26a17b' },
  DAI: { mark: 'D', tint: '#f5ac37' },
};

const ecosystem: EcosystemItem[] = [
  { label: 'Nomad', kind: 'nomad', color: C.blue, route: 'Portfolio' },
  { label: 'AutoDeFi', kind: 'autodefi', color: C.blue, route: 'VoltaireProtocols' },
  { label: 'BlockPages411', kind: 'blockpages', color: C.purple, route: 'BlockPagesSafety' },
  { label: 'Sovereign\nPayroll', kind: 'payroll', color: C.green, route: 'VoltaireProtocols' },
  { label: 'Guardian\nTrader', kind: 'guardian', color: C.green, route: 'VoltaireProtocols' },
  { label: 'Quantum\nLottery', kind: 'lottery', color: C.purple, route: 'VoltaireProtocols' },
  { label: 'Decentralized\nRetirement', kind: 'retirement', color: C.orange, route: 'VoltaireProtocols' },
];

function Token({ asset, size }: { asset: Asset; size: number }) {
  const markSize = size * 0.68;
  let mark: React.ReactNode = <Text style={{ color: asset.textColor ?? '#fff', fontSize: size * 0.46, fontWeight: '900' }}>{asset.mark}</Text>;
  if (asset.symbol === 'HBAR') mark = <Svg width={markSize} height={markSize} viewBox="0 0 32 32" fill="none"><Path d="M8 5v22M24 5v22M8 12h16M8 20h16" stroke="#fff" strokeWidth="3" strokeLinecap="round" /></Svg>;
  if (asset.symbol === 'XRP') mark = <Svg width={markSize} height={markSize} viewBox="0 0 32 32" fill="none"><Path d="M5 7c3 0 4 1 6 3l5 5 5-5c2-2 3-3 6-3M5 25c3 0 4-1 6-3l5-5 5 5c2 2 3 3 6 3" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" /></Svg>;
  if (asset.symbol === 'XLM') mark = <Svg width={markSize} height={markSize} viewBox="0 0 32 32" fill="none"><Circle cx="16" cy="16" r="10" stroke="#fff" strokeWidth="2.4" /><Path d="M4 21 28 10M5 25l23-11" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" /></Svg>;
  return (
    <View style={[styles.token, { width: size, height: size, borderRadius: size / 2, backgroundColor: asset.tint }]}>
      {mark}
    </View>
  );
}

function ActionCard({ kind, label, route }: { kind: 'send' | 'receive' | 'swap' | 'travel'; label: string; route: RouteName }) {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => navigation.navigate(route)}
      style={({ pressed }) => [styles.actionCard, compact && styles.actionCardCompact, pressed && styles.pressed]}
    >
      <ActionArtwork kind={kind} size={compact ? 31 : 58} />
      <Text style={[styles.actionLabel, compact && styles.actionLabelCompact]}>{label}</Text>
    </Pressable>
  );
}

function SecurityItem({ kind, label, value, route, last }: { kind: SecurityKind; label: string; value: string; route: RouteName; last?: boolean }) {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      onPress={() => navigation.navigate(route)}
      style={({ pressed }) => [styles.securityItem, compact && styles.securityItemCompact, last && styles.securityItemLast, pressed && styles.pressed]}
    >
      <SecurityArtwork kind={kind} size={compact ? 24 : 30} />
      <Text style={[styles.securityLabel, compact && styles.securityLabelCompact]}>{label}</Text>
      <Text style={[styles.securityValue, compact && styles.securityValueCompact]}>{value}</Text>
    </Pressable>
  );
}

export default function PortfolioScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { walletStatus } = useAppState();
  const { totalBalance, assets: liveAssets, loading } = useNomadWallet();
  const { travelPocket } = useNomadTravel();
  const { security } = useNomadSecurity();
  const { recovery, ownerAuthorityRequest } = useNomadRecovery();
  const [hideBalance, setHideBalance] = useState(false);

  const assets = useMemo<Asset[]>(() => {
    const mapped = liveAssets.slice(0, 4).map((asset) => {
      const visual = assetVisuals[asset.symbol.toUpperCase()] ?? {
        mark: asset.symbol.slice(0, 1).toUpperCase(),
        tint: '#0a355d',
      };
      return { symbol: asset.symbol, amount: asset.balance, value: asset.fiatValueUsd, ...visual };
    });
    return mapped.length ? mapped : previewAssets;
  }, [liveAssets]);

  const portfolioValue = liveAssets.length ? totalBalance : '$24,832.45';
  const displayPortfolioValue = hideBalance ? '••••••••' : portfolioValue;
  const systemLabel = security.status === 'frozen' ? 'FROZEN' : security.status === 'warning' ? 'REVIEW' : 'SECURE';
  const systemColor = security.status === 'frozen' ? C.red : security.status === 'warning' ? C.yellow : C.green;
  const pocketBalance = travelPocket.pocketBalanceLocal || travelPocket.pocketBalanceFiat || '0.021 BTC';
  const pocketFiat = travelPocket.pocketBalanceFiat || '$1,312.21';
  const dailyLimit = travelPocket.dailyLimitLocal || '0.050 BTC';
  const tripLimit = travelPocket.tripLimitLocal || '0.500 BTC';
  const expiryLabel = travelPocket.expiresAt
    ? new Date(travelPocket.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Not set';
  const ownerAuthorityValue = ownerAuthorityRequest.status === 'pending' ? 'Pending' : recovery.signerQuorum > 0 ? 'Active' : 'Set Up';
  const recoveryValue = recovery.recoveryStatus === 'protected' ? 'Ready' : recovery.recoveryStatus === 'locked' ? 'Locked' : 'Review';
  const deviceValue = security.status === 'warning' ? 'Review' : 'Verified';

  return (
    <NomadPage maxWidth={1040}>
      <View style={[styles.header, compact && styles.headerCompact]}>
        <WorldBackdrop color={C.blue} style={styles.headerBackdrop} />
        <View style={styles.brandRow}>
          <NomadBrandMark size={compact ? 38 : 68} />
          <View style={styles.brandCopy}>
            <Text style={[styles.brandTitle, compact && styles.brandTitleCompact]}>NOMAD</Text>
            <Text style={[styles.brandSub, compact && styles.brandSubCompact]}>Built on <Text style={styles.blue}>Voltaire Protocols</Text></Text>
          </View>
        </View>

        <View style={[styles.headerActions, compact && styles.headerActionsCompact]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open Security Center"
            onPress={() => navigation.navigate('SecurityCenter')}
            style={[styles.statusPill, compact && styles.statusCompact]}
          >
            <SecureShield size={compact ? 19 : 29} color={systemColor} />
            <View>
              <Text style={[styles.statusTop, compact && styles.statusTopCompact]}>All Systems</Text>
              <Text style={[styles.statusBottom, compact && styles.statusBottomCompact, { color: systemColor }]}>{systemLabel}</Text>
            </View>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Open alerts" onPress={() => navigation.navigate('SecurityCenter')} style={[styles.alertButton, compact && styles.alertButtonCompact]}>
            <BellIcon size={compact ? 19 : 24} />
            <View style={[styles.alertDot, compact && styles.alertDotCompact]} />
          </Pressable>
        </View>
      </View>

      <Panel style={[styles.heroCard, compact && styles.heroCardCompact]}>
        <WorldBackdrop color={C.blue} style={styles.heroBackdrop} />
        <View style={[styles.heroTop, compact && styles.heroTopCompact]}>
          <View style={styles.balanceArea}>
            <Pressable accessibilityRole="button" accessibilityLabel={hideBalance ? 'Show portfolio balance' : 'Hide portfolio balance'} onPress={() => setHideBalance((value) => !value)} style={styles.eyebrowRow}>
              <Text style={[styles.eyebrow, compact && styles.eyebrowCompact]}>Total Portfolio Value</Text>
              <EyeIcon size={compact ? 16 : 20} />
            </Pressable>
            <View style={styles.balanceLine}>
              <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.balance, compact && styles.balanceCompact]}>{displayPortfolioValue}</Text>
              {!hideBalance ? <Text style={[styles.currency, compact && styles.currencyCompact]}>USD</Text> : null}
            </View>
            <Text style={[styles.change, compact && styles.changeCompact]}>{loading ? 'Syncing wallet data…' : '▲ 1.82% (24h)'}</Text>
          </View>
          <PortfolioChart style={[styles.chart, compact && styles.chartCompact]} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.assetRow, compact && styles.assetRowCompact]}>
          {assets.map((asset) => (
            <Pressable key={asset.symbol} accessibilityRole="button" accessibilityLabel={`Open ${asset.symbol} wallet`} onPress={() => navigation.navigate('Wallets')} style={({ pressed }) => [styles.asset, compact && styles.assetCompact, pressed && styles.pressed]}>
              <Token asset={asset} size={compact ? 26 : 50} />
              <Text style={[styles.assetSymbol, compact && styles.assetSymbolCompact]}>{asset.symbol}</Text>
              <Text style={[styles.assetAmount, compact && styles.assetAmountCompact]}>{asset.amount}</Text>
              <Text style={[styles.assetValue, compact && styles.assetValueCompact]}>{asset.value}</Text>
            </Pressable>
          ))}
          <Pressable accessibilityRole="button" accessibilityLabel="View all wallets" onPress={() => navigation.navigate('Wallets')} style={({ pressed }) => [styles.asset, compact && styles.assetCompact, pressed && styles.pressed]}>
            <View style={[styles.token, styles.moreToken, { width: compact ? 26 : 50, height: compact ? 26 : 50, borderRadius: 25 }]}>
              <Text style={[styles.moreText, compact && styles.moreTextCompact]}>•••</Text>
            </View>
            <Text style={[styles.assetSymbol, compact && styles.assetSymbolCompact]}>More</Text>
          </Pressable>
        </ScrollView>
      </Panel>

      <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>Quick Actions</Text>
      <View style={[styles.actionGrid, compact && styles.actionGridCompact]}>
        <ActionCard kind="send" label="Send" route="SendBitcoin" />
        <ActionCard kind="receive" label="Receive" route="ReceiveBitcoin" />
        <ActionCard kind="swap" label="Swap" route="Swap" />
        <ActionCard kind="travel" label="Travel" route="TravelMode" />
      </View>

      <Panel tone="green" style={[styles.travelCard, compact && styles.sectionCardCompact]}>
        <WorldBackdrop style={styles.travelBackdrop} />
        <Pressable accessibilityRole="button" accessibilityLabel="Open Travel Pocket" onPress={() => navigation.navigate('TravelMode')} style={[styles.cardHeader, compact && styles.cardHeaderCompact]}>
          <View style={styles.titleRow}>
            <PlaneIcon size={compact ? 20 : 24} />
            <Text style={[styles.travelTitle, compact && styles.travelTitleCompact]}>Travel Pocket</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={[styles.activePill, compact && styles.activePillCompact]}>{travelPocket.enabled ? 'ACTIVE' : 'READY'}</Text>
            <Text style={[styles.menuDots, compact && styles.menuDotsCompact]}>•••</Text>
          </View>
        </Pressable>

        <View style={[styles.travelMetrics, compact && styles.travelMetricsCompact]}>
          <View style={[styles.travelMetric, compact && styles.travelMetricCompact]}>
            <Text style={[styles.metricLabel, compact && styles.metricLabelCompact]}>Balance</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.metricValue, compact && styles.metricValueCompact]}>{pocketBalance}</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.metricSub, compact && styles.metricSubCompact]}>{pocketFiat}</Text>
          </View>
          <View style={[styles.travelMetric, compact && styles.travelMetricCompact]}>
            <Text style={[styles.metricLabel, compact && styles.metricLabelCompact]}>Daily Limit</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.metricValue, compact && styles.metricValueCompact]}>{dailyLimit}</Text>
            <View style={styles.progressRow}><ProgressBar value={travelPocket.spentTodayPercent ?? 42} color={C.green} height={compact ? 5 : 8} /><Text style={[styles.progressText, compact && styles.progressTextCompact]}>{travelPocket.spentTodayPercent ?? 42}%</Text></View>
          </View>
          <View style={[styles.travelMetric, compact && styles.travelMetricCompact]}>
            <Text style={[styles.metricLabel, compact && styles.metricLabelCompact]}>Trip Limit</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.metricValue, compact && styles.metricValueCompact]}>{tripLimit}</Text>
            <View style={styles.progressRow}><ProgressBar value={travelPocket.tripSpentPercent ?? 30} color={C.green} height={compact ? 5 : 8} /><Text style={[styles.progressText, compact && styles.progressTextCompact]}>{travelPocket.tripSpentPercent ?? 30}%</Text></View>
          </View>
          <View style={[styles.travelMetric, compact && styles.travelMetricCompact, styles.travelMetricLast]}>
            <Text style={[styles.metricLabel, compact && styles.metricLabelCompact]}>Expires</Text>
            <Text numberOfLines={2} adjustsFontSizeToFit style={[styles.metricValue, compact && styles.metricValueCompact]}>{expiryLabel}</Text>
          </View>
        </View>

        <Pressable accessibilityRole="button" accessibilityLabel="Manage Travel Pocket" onPress={() => navigation.navigate('TravelMode')} style={({ pressed }) => [styles.manageTravel, compact && styles.manageTravelCompact, pressed && styles.pressed]}>
          <Text style={[styles.manageTravelText, compact && styles.manageTravelTextCompact]}>Manage Travel Pocket</Text>
          <Text style={[styles.greenArrow, compact && styles.arrowCompact]}>›</Text>
        </Pressable>
      </Panel>

      <Panel style={[styles.securityCard, compact && styles.sectionCardCompact]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Open Security Center" onPress={() => navigation.navigate('SecurityCenter')} style={[styles.cardHeader, compact && styles.cardHeaderCompact]}>
          <View style={styles.titleRow}>
            <SecureShield size={compact ? 19 : 27} color={C.blue} />
            <Text style={[styles.securityTitle, compact && styles.securityTitleCompact]}>Security Center</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={[styles.securePill, compact && styles.securePillCompact]}>{systemLabel}</Text>
            <Text style={[styles.blueArrow, compact && styles.arrowCompact]}>›</Text>
          </View>
        </Pressable>
        <View style={[styles.securityGrid, compact && styles.securityGridCompact]}>
          <SecurityItem kind="storage" label="Secure Storage" value={security.status === 'warning' ? 'Review' : 'Secure'} route="Settings" />
          <SecurityItem kind="authority" label="Owner Authority" value={ownerAuthorityValue} route="CreateOwnerAuthority" />
          <SecurityItem kind="device" label="Device Integrity" value={deviceValue} route="NomadWatch" />
          <SecurityItem kind="recovery" label="Recovery Status" value={recoveryValue} route="RecoveryCenter" last />
        </View>
      </Panel>

      <Panel style={[styles.ecosystemCard, compact && styles.sectionCardCompact]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Explore Voltaire Ecosystem" onPress={() => navigation.navigate('VoltaireProtocols')} style={[styles.cardHeader, compact && styles.cardHeaderCompact]}>
          <View style={styles.titleRow}>
            <VoltaireMark size={compact ? 21 : 30} />
            <Text style={[styles.ecoTitle, compact && styles.ecoTitleCompact]}>Voltaire Ecosystem</Text>
          </View>
          <Text style={[styles.exploreText, compact && styles.exploreTextCompact]}>Explore All  ›</Text>
        </Pressable>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.ecoRow, compact && styles.ecoRowCompact]}>
          {ecosystem.map((item) => (
            <Pressable key={item.label} accessibilityRole="button" accessibilityLabel={`Open ${item.label.replace('\n', ' ')}`} onPress={() => navigation.navigate(item.route)} style={({ pressed }) => [styles.ecoItem, compact && styles.ecoItemCompact, pressed && styles.pressed]}>
              <EcosystemArtwork kind={item.kind} color={item.color} size={compact ? 39 : 58} />
              <Text style={[styles.ecoLabel, compact && styles.ecoLabelCompact]}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </Panel>

      <BottomNav active="Home" />
      {Platform.OS === 'web' && walletStatus !== 'unlocked' && !compact ? <Text style={styles.previewNote}>Secure browser preview • Wallet actions still require owner approval.</Text> : null}
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 17 },
  headerCompact: { gap: 5, marginBottom: 10 },
  headerBackdrop: { position: 'absolute', top: -28, right: 70, width: '62%', height: 105, opacity: 0.28 },
  brandRow: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center' },
  brandCopy: { flex: 1, minWidth: 0, marginLeft: 10 },
  brandTitle: { color: '#fff', fontSize: 36, lineHeight: 40, fontWeight: '900', letterSpacing: 1.1 },
  brandTitleCompact: { fontSize: 20, lineHeight: 23, letterSpacing: 0.7 },
  brandSub: { color: '#fff', fontSize: 12, marginTop: 3 },
  brandSubCompact: { fontSize: 9, marginTop: 1 },
  blue: { color: C.blue, fontWeight: '900' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  headerActionsCompact: { gap: 5 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#0b3f68', borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12, backgroundColor: 'rgba(3,16,30,.96)' },
  statusCompact: { paddingVertical: 4, paddingHorizontal: 8, gap: 4 },
  statusTop: { color: '#dbe5f2', fontSize: 11 },
  statusTopCompact: { fontSize: 8 },
  statusBottom: { fontSize: 12, fontWeight: '900' },
  statusBottomCompact: { fontSize: 9 },
  alertButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: '#0b3f68', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(3,16,30,.96)' },
  alertButtonCompact: { width: 31, height: 31, borderRadius: 16 },
  alertDot: { position: 'absolute', top: 5, right: 5, width: 8, height: 8, borderRadius: 4, backgroundColor: C.blue },
  alertDotCompact: { top: 3, right: 3, width: 5, height: 5, borderRadius: 3 },
  heroCard: { minHeight: 338, padding: 25, position: 'relative' },
  heroCardCompact: { padding: 13, minHeight: 174, borderRadius: 12 },
  heroBackdrop: { position: 'absolute', top: 0, right: 0, width: '75%', height: 188, opacity: 0.43 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  heroTopCompact: { gap: 2, minHeight: 72 },
  balanceArea: { flex: 1.05, minWidth: 0, zIndex: 2 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 7 },
  eyebrow: { color: '#f2f6fb', fontSize: 15 },
  eyebrowCompact: { fontSize: 10 },
  balanceLine: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 9 },
  balance: { flexShrink: 1, color: '#fff', fontSize: 62, lineHeight: 68, fontWeight: '900', letterSpacing: -2.2 },
  balanceCompact: { fontSize: 32, lineHeight: 36, letterSpacing: -0.9 },
  currency: { color: '#fff', fontSize: 15 },
  currencyCompact: { fontSize: 10 },
  change: { color: C.green, fontSize: 15, fontWeight: '900', marginTop: 4 },
  changeCompact: { fontSize: 10, marginTop: 2 },
  chart: { flex: 0.97, minWidth: 120, height: 160, zIndex: 1 },
  chartCompact: { minWidth: 96, height: 72 },
  assetRow: { paddingTop: 26, paddingBottom: 2, flexGrow: 1, justifyContent: 'space-between' },
  assetRowCompact: { paddingTop: 10, paddingBottom: 0 },
  asset: { minWidth: 82, paddingHorizontal: 5, alignItems: 'center' },
  assetCompact: { minWidth: 66, paddingHorizontal: 3 },
  token: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.16)', marginBottom: 7, shadowColor: '#168cff', shadowOpacity: 0.22, shadowRadius: 9, shadowOffset: { width: 0, height: 0 } },
  moreToken: { backgroundColor: '#06172a', borderColor: '#164976' },
  moreText: { color: '#dce7f5', fontSize: 18, fontWeight: '900' },
  moreTextCompact: { fontSize: 10 },
  assetSymbol: { color: '#fff', fontSize: 12, fontWeight: '900' },
  assetSymbolCompact: { fontSize: 9 },
  assetAmount: { color: '#f2f6fb', fontSize: 10, marginTop: 4 },
  assetAmountCompact: { fontSize: 8, marginTop: 2 },
  assetValue: { color: C.muted, fontSize: 9, marginTop: 3 },
  assetValueCompact: { fontSize: 7, marginTop: 1 },
  sectionTitle: { color: '#fff', fontSize: 19, fontWeight: '900', marginTop: 23, marginBottom: 11 },
  sectionTitleCompact: { fontSize: 13, marginTop: 12, marginBottom: 8 },
  actionGrid: { flexDirection: 'row', gap: 10 },
  actionGridCompact: { gap: 7 },
  actionCard: { flex: 1, minWidth: 0, minHeight: 124, borderWidth: 1, borderColor: C.border, borderRadius: 15, backgroundColor: C.panel, alignItems: 'center', justifyContent: 'center' },
  actionCardCompact: { minHeight: 63, borderRadius: 10 },
  actionLabel: { color: '#fff', fontSize: 14, fontWeight: '800', marginTop: 4 },
  actionLabelCompact: { fontSize: 11, marginTop: 2 },
  travelCard: { marginTop: 18, position: 'relative' },
  securityCard: { marginTop: 18 },
  ecosystemCard: { marginTop: 18 },
  sectionCardCompact: { marginTop: 10, borderRadius: 12 },
  travelBackdrop: { position: 'absolute', right: 0, bottom: 0, width: '58%', height: '88%', opacity: 0.34 },
  cardHeader: { minHeight: 65, paddingHorizontal: 18, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.borderSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, zIndex: 2 },
  cardHeaderCompact: { minHeight: 35, paddingHorizontal: 12, paddingVertical: 6, gap: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardSub: { color: C.muted, fontSize: 9, marginTop: 3 },
  travelTitle: { color: C.green, fontSize: 17, fontWeight: '900' },
  travelTitleCompact: { fontSize: 12 },
  activePill: { color: C.green, borderWidth: 1, borderColor: C.green, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, fontSize: 10, fontWeight: '900', backgroundColor: 'rgba(32,239,112,.07)' },
  activePillCompact: { paddingHorizontal: 8, paddingVertical: 3, fontSize: 8 },
  menuDots: { color: C.green, fontSize: 18, fontWeight: '900' },
  menuDotsCompact: { fontSize: 12 },
  travelMetrics: { flexDirection: 'row', padding: 13, zIndex: 2 },
  travelMetricsCompact: { flexWrap: 'nowrap', padding: 6 },
  travelMetric: { flex: 1, minWidth: 132, padding: 10, borderRightWidth: 1, borderRightColor: 'rgba(32,239,112,.18)' },
  travelMetricCompact: { minWidth: 0, paddingHorizontal: 7, paddingVertical: 5 },
  travelMetricLast: { borderRightWidth: 0 },
  metricLabel: { color: C.muted, fontSize: 10 },
  metricLabelCompact: { fontSize: 8 },
  metricValue: { color: '#fff', fontSize: 16, fontWeight: '800', marginVertical: 7 },
  metricValueCompact: { fontSize: 11, marginVertical: 4, minHeight: 14 },
  metricSub: { color: C.muted, fontSize: 9 },
  metricSubCompact: { fontSize: 7 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressText: { color: '#dce8e2', fontSize: 10 },
  progressTextCompact: { fontSize: 7 },
  manageTravel: { minHeight: 57, paddingHorizontal: 18, borderTopWidth: 1, borderTopColor: 'rgba(32,239,112,.16)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 2 },
  manageTravelCompact: { minHeight: 30, paddingHorizontal: 12 },
  manageTravelText: { color: C.green, fontSize: 13, fontWeight: '800' },
  manageTravelTextCompact: { fontSize: 10 },
  greenArrow: { color: C.green, fontSize: 28 },
  securityTitle: { color: '#fff', fontSize: 17, fontWeight: '900' },
  securityTitleCompact: { fontSize: 12 },
  securePill: { color: C.blue, borderWidth: 1, borderColor: C.blue, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, fontSize: 9, fontWeight: '900' },
  securePillCompact: { paddingHorizontal: 7, paddingVertical: 3, fontSize: 8 },
  blueArrow: { color: C.blue, fontSize: 28 },
  arrowCompact: { fontSize: 20 },
  securityGrid: { flexDirection: 'row', padding: 8 },
  securityGridCompact: { padding: 4 },
  securityItem: { flex: 1, minWidth: 0, alignItems: 'center', paddingVertical: 11, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: C.borderSoft },
  securityItemCompact: { paddingVertical: 7, paddingHorizontal: 3 },
  securityItemLast: { borderRightWidth: 0 },
  securityLabel: { color: '#fff', fontSize: 9, textAlign: 'center', marginTop: 8 },
  securityLabelCompact: { fontSize: 8, marginTop: 4 },
  securityValue: { color: C.green, fontSize: 9, fontWeight: '900', marginTop: 5 },
  securityValueCompact: { fontSize: 8, marginTop: 3 },
  ecoTitle: { color: C.purple, fontSize: 17, fontWeight: '900' },
  ecoTitleCompact: { fontSize: 12 },
  exploreText: { color: C.blue, fontSize: 11, fontWeight: '900' },
  exploreTextCompact: { fontSize: 9 },
  ecoRow: { paddingHorizontal: 12, paddingVertical: 18 },
  ecoRowCompact: { paddingHorizontal: 8, paddingVertical: 9 },
  ecoItem: { width: 88, alignItems: 'center' },
  ecoItemCompact: { width: 52 },
  ecoIcon: { width: 58, height: 58, borderRadius: 29, borderWidth: 2, backgroundColor: '#061526', alignItems: 'center', justifyContent: 'center', shadowColor: '#168cff', shadowOpacity: 0.2, shadowRadius: 9, shadowOffset: { width: 0, height: 0 } },
  logoNumber: { fontWeight: '900' },
  logoDollar: { fontWeight: '900' },
  ecoLabel: { color: '#fff', fontSize: 9, lineHeight: 13, textAlign: 'center', marginTop: 8 },
  ecoLabelCompact: { fontSize: 7, lineHeight: 9, marginTop: 4 },
  previewNote: { color: C.muted2, textAlign: 'center', fontSize: 9, marginTop: 10 },
});
