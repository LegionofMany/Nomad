import React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

export const C = {
  bg: '#01060d',
  panel: 'rgba(4,16,30,.96)',
  panel2: 'rgba(3,13,26,.84)',
  border: '#0b4778',
  borderSoft: 'rgba(49,148,255,.17)',
  blue: '#3194ff',
  green: '#28e978',
  purple: '#9270ff',
  orange: '#ffad18',
  red: '#ff4b4b',
  yellow: '#ffbd18',
  text: '#ffffff',
  muted: '#aebbd0',
  muted2: '#7f91a8',
};

type GlyphKind = 'home' | 'wallet' | 'travel' | 'security' | 'recovery' | 'insights' | 'scan' | 'watch' | 'settings';

function glyphForRoute(route: string): GlyphKind {
  if (/Wallet|Send|Receive|Swap/.test(route)) return 'wallet';
  if (/Travel|POS|TopUp/.test(route)) return 'travel';
  if (/Recovery|Unlock|Clock|Authority|Recovered/.test(route)) return 'recovery';
  if (/Security|Emergency/.test(route)) return 'security';
  if (/Insights/.test(route)) return 'insights';
  if (/BlockPages|AddressSafety/.test(route)) return 'scan';
  if (/Watch/.test(route)) return 'watch';
  if (/Settings/.test(route)) return 'settings';
  return 'home';
}

export function NomadGlyph({ kind, color = C.blue, size = 24 }: { kind: GlyphKind; color?: string; size?: number }) {
  const stroke = { stroke: color, strokeWidth: 2.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  let artwork: React.ReactNode;

  switch (kind) {
    case 'wallet':
      artwork = <><Rect x="6" y="12" width="36" height="27" rx="8" {...stroke} /><Path d="M31 21h12v11H31a5.5 5.5 0 0 1 0-11Z" {...stroke} /><Circle cx="34" cy="26.5" r="1.8" fill={color} /></>;
      break;
    case 'travel':
      artwork = <><Path d="m7 27 34-16-10 29-7-11-17-2Z" {...stroke} /><Path d="m24 29 7-7" {...stroke} /></>;
      break;
    case 'security':
      artwork = <><Path d="M24 5 40 12v12c0 11-6 18-16 23C14 42 8 35 8 24V12Z" {...stroke} /><Path d="m16 25 6 6 11-13" {...stroke} /></>;
      break;
    case 'recovery':
      artwork = <><Path d="M12 18a15 15 0 1 1-2 13" {...stroke} /><Path d="M12 8v10H2" {...stroke} /><Path d="M24 16v10l7 4" {...stroke} /></>;
      break;
    case 'insights':
      artwork = <><Path d="M7 40V24h8v16M20 40V15h8v25M33 40V8h8v32" {...stroke} /><Path d="M5 40h38" {...stroke} /></>;
      break;
    case 'scan':
      artwork = <><Path d="M17 7H8v10M31 7h9v10M17 41H8V31M31 41h9V31" {...stroke} /><Path d="M14 24h20" {...stroke} /><Circle cx="24" cy="24" r="7" {...stroke} /></>;
      break;
    case 'watch':
      artwork = <><Path d="M18 4h12l2 8H16l2-8ZM16 36h16l-2 8H18l-2-8Z" {...stroke} /><Rect x="11" y="11" width="26" height="26" rx="8" {...stroke} /><Path d="M18 24h12M24 18v12" {...stroke} /></>;
      break;
    case 'settings':
      artwork = <><Circle cx="24" cy="24" r="7" {...stroke} /><Path d="M24 5v6M24 37v6M5 24h6M37 24h6M10.5 10.5l4.2 4.2M33.3 33.3l4.2 4.2M37.5 10.5l-4.2 4.2M14.7 33.3l-4.2 4.2" {...stroke} /></>;
      break;
    default:
      artwork = <><Path d="M8 25 24 10l16 15v15H28V29h-8v11H8Z" {...stroke} /><Path d="M15 18h18" opacity={0.45} {...stroke} /></>;
  }

  return <Svg accessibilityLabel={`${kind} icon`} width={size} height={size} viewBox="0 0 48 48" fill="none">{artwork}</Svg>;
}

function NomadBrandMark({ size = 44 }: { size?: number }) {
  return (
    <Svg accessibilityLabel="Nomad shield" width={size} height={size * 1.125} viewBox="0 0 64 72" fill="none">
      <Defs><LinearGradient id="nomadBrand" x1="8" y1="4" x2="56" y2="66"><Stop stopColor="#54c7ff" /><Stop offset="1" stopColor="#1668ff" /></LinearGradient></Defs>
      <Path d="M32 3 57 14v20c0 18-10 30-25 38C17 64 7 52 7 34V14Z" fill="#041425" stroke="url(#nomadBrand)" strokeWidth="4" />
      <Path d="M15 38h9l5-9 7 16 5-10h8" stroke={C.blue} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const railNav: Array<{ label: string; route: string; kind: GlyphKind }> = [
  { label: 'Home', route: 'Portfolio', kind: 'home' },
  { label: 'Wallets', route: 'Wallets', kind: 'wallet' },
  { label: 'Travel', route: 'TravelMode', kind: 'travel' },
  { label: 'Security', route: 'SecurityCenter', kind: 'security' },
  { label: 'Recovery', route: 'RecoveryCenter', kind: 'recovery' },
  { label: 'Insights', route: 'NomadInsights', kind: 'insights' },
  { label: 'Reqrium', route: 'BlockPagesSafety', kind: 'scan' },
  { label: 'Nomad Watch', route: 'NomadWatch', kind: 'watch' },
];

function routeIsActive(current: string, route: string) {
  if (route === 'Wallets') return /Wallets|SendBitcoin|ReceiveBitcoin|Swap/.test(current);
  if (route === 'TravelMode') return /Travel|TopUp|POS/.test(current);
  if (route === 'SecurityCenter') return /Security|Emergency/.test(current);
  if (route === 'RecoveryCenter') return /Recovery|Unlock|Clock|Authority|Recovered/.test(current);
  if (route === 'NomadInsights') return /Insights/.test(current);
  if (route === 'BlockPagesSafety') return /BlockPages|AddressSafety/.test(current);
  return current === route;
}

function DesktopRail({ activeRoute }: { activeRoute: string }) {
  const navigation = useNavigation<any>();
  return (
    <View style={styles.rail}>
      <Pressable accessibilityRole="button" accessibilityLabel="Open Nomad Home" onPress={() => navigation.navigate('Portfolio')} style={styles.railBrand}>
        <NomadBrandMark size={43} />
        <View>
          <Text style={styles.railWordmark}>NOMAD</Text>
          <Text style={styles.railFoundation}>VOLTAIRE PROTOCOLS</Text>
        </View>
      </Pressable>
      <View style={styles.railMode}><View style={styles.railModeDot} /><Text style={styles.railModeText}>CLOSED BETA · TEST MODE</Text></View>
      <View style={styles.railNav}>
        {railNav.map((item) => {
          const selected = routeIsActive(activeRoute, item.route);
          return (
            <Pressable accessibilityRole="button" accessibilityLabel={`Open ${item.label}`} key={item.route} onPress={() => navigation.navigate(item.route)} style={({ pressed }) => [styles.railItem, selected && styles.railItemActive, pressed && styles.railItemPressed]}>
              <View style={[styles.railIcon, selected && styles.railIconActive]}><NomadGlyph kind={item.kind} color={selected ? C.blue : C.muted2} size={21} /></View>
              <Text style={[styles.railLabel, selected && styles.railLabelActive]}>{item.label}</Text>
              {selected ? <View style={styles.railIndicator} /> : null}
            </Pressable>
          );
        })}
      </View>
      <View style={styles.railFooter}>
        <View style={styles.railNetwork}><View style={styles.railNetworkDot} /><Text style={styles.railNetworkText}>LOCAL SAFETY LAYER</Text></View>
        <Text style={styles.railFootnote}>Non-custodial preview</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Open Settings" onPress={() => navigation.navigate('Settings')} style={styles.railSettings}>
          <NomadGlyph kind="settings" color={activeRoute === 'Settings' ? C.blue : C.muted} size={20} />
          <Text style={[styles.railSettingsText, activeRoute === 'Settings' && { color: C.blue }]}>Settings</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function useNomadLayout() {
  const { width } = useWindowDimensions();
  return { width, compact: width < 620, desktop: width >= 980 };
}

export function NomadPage({ children, maxWidth = 860 }: { children: React.ReactNode; maxWidth?: number }) {
  const { compact, desktop } = useNomadLayout();
  const route = useRoute();
  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={styles.ambientBlue} />
      <View pointerEvents="none" style={styles.ambientPurple} />
      {desktop ? <DesktopRail activeRoute={route.name} /> : null}
      <ScrollView
        style={styles.contentScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.page,
          { paddingHorizontal: compact ? 14 : desktop ? 34 : 24, maxWidth: desktop ? Math.max(maxWidth, 1080) : maxWidth },
        ]}
      >
        {children}
      </ScrollView>
    </View>
  );
}

export function Panel({ children, style, tone = 'blue' }: { children: React.ReactNode; style?: object; tone?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' }) {
  const border = tone === 'green' ? '#098f49' : tone === 'red' ? '#8c252d' : tone === 'yellow' ? '#795711' : tone === 'purple' ? '#54318d' : C.border;
  const backgroundColor = tone === 'green' ? 'rgba(0,37,24,.92)' : tone === 'red' ? 'rgba(37,7,12,.88)' : C.panel;
  return <View style={[styles.panel, { borderColor: border, backgroundColor }, style]}>{children}</View>;
}

export function RoundIcon({ symbol, color = C.blue, size = 48, filled = false }: { symbol: string; color?: string; size?: number; filled?: boolean }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 1, borderColor: color, backgroundColor: filled ? `${color}22` : '#061424', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color, fontSize: size * .48, fontWeight: '900' }}>{symbol}</Text>
    </View>
  );
}

export function SystemPill({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.status, compact && styles.statusCompact]}>
      <Text style={styles.statusIcon}>◇</Text>
      <View>
        <Text style={[styles.statusTop, compact && { fontSize: 9 }]}>All Systems</Text>
        <Text style={[styles.statusBottom, compact && { fontSize: 10 }]}>SECURE</Text>
      </View>
    </View>
  );
}

export function PageHeader({
  title,
  subtitle,
  icon = '◇',
  color = C.green,
  back = true,
  status = true,
  help = false,
  helpRoute = 'Settings',
  right,
}: {
  title: string;
  subtitle?: string;
  icon?: string;
  color?: string;
  back?: boolean;
  status?: boolean;
  help?: boolean;
  helpRoute?: string;
  right?: React.ReactNode;
}) {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {back ? <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable> : null}
        <RoundIcon symbol={icon} color={color} size={compact ? 43 : 52} />
        <View style={styles.headerCopy}>
          <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.headerTitle, { fontSize: compact ? 24 : 31 }]}>{title}</Text>
          {subtitle ? <Text numberOfLines={2} style={[styles.headerSub, { fontSize: compact ? 11 : 14 }]}>{subtitle}</Text> : null}
        </View>
      </View>
      <View style={styles.headerRight}>
        {right}
        {status ? <SystemPill compact={compact} /> : null}
        {help ? <Pressable accessibilityRole="button" accessibilityLabel="Open Help" onPress={() => navigation.navigate(helpRoute)} style={styles.help}><Text style={styles.helpText}>?</Text></Pressable> : null}
      </View>
    </View>
  );
}

export function SectionLabel({ children, color = C.text, style }: { children: React.ReactNode; color?: string; style?: object }) {
  return <Text style={[styles.section, { color }, style]}>{children}</Text>;
}

export function Divider() { return <View style={styles.divider} />; }

export function ProgressBar({ value, color = C.green, height = 8 }: { value: number; color?: string; height?: number }) {
  return <View style={[styles.track, { height }]}><View style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: '100%', borderRadius: height, backgroundColor: color }} /></View>;
}

export function PrimaryButton({ label, subtitle, icon, onPress, tone = 'blue', disabled = false }: { label: string; subtitle?: string; icon?: string; onPress?: () => void; tone?: 'blue' | 'green' | 'red'; disabled?: boolean }) {
  const inactive = disabled || !onPress;
  const bg = tone === 'green' ? '#0bd34f' : tone === 'red' ? '#941f2b' : '#0b65f4';
  return (
    <Pressable disabled={inactive} onPress={onPress} style={({ pressed }) => [styles.primary, { backgroundColor: bg, opacity: inactive ? .45 : pressed ? .78 : 1 }]}>
      {icon ? <Text style={styles.primaryIcon}>{icon}</Text> : null}
      <View style={{ flex: 1 }}><Text style={styles.primaryLabel}>{label}</Text>{subtitle ? <Text style={styles.primarySub}>{subtitle}</Text> : null}</View>
      <Text style={styles.primaryArrow}>›</Text>
    </Pressable>
  );
}

const defaultNav = [
  ['⌂', 'Home', 'Portfolio'],
  ['▣', 'Wallets', 'Wallets'],
  ['✈', 'Travel', 'TravelMode'],
  ['◇', 'Security', 'SecurityCenter'],
  ['⚙', 'Settings', 'Settings'],
] as const;

export function BottomNav({ active, fifth, items }: { active: string; fifth?: readonly [string, string, string]; items?: ReadonlyArray<readonly [string, string, string]> }) {
  const navigation = useNavigation<any>();
  const currentRoute = useRoute();
  const { desktop } = useNomadLayout();
  const nav = items ?? (fifth ? [...defaultNav.slice(0, 4), fifth] : defaultNav);
  const hasNamedActiveItem = nav.some(([, label]) => label === active);
  if (desktop) return null;
  return (
    <View style={styles.bottomNav}>
      {nav.map(([, label, route]) => {
        const selected = hasNamedActiveItem ? label === active : routeIsActive(currentRoute.name, route);
        return (
          <Pressable accessibilityRole="button" accessibilityLabel={`Open ${label}`} key={`${label}-${route}`} onPress={() => navigation.navigate(route)} style={[styles.navItem, selected && styles.navItemActive]}>
            <NomadGlyph kind={glyphForRoute(route)} color={selected ? C.blue : C.muted} size={24} />
            <Text style={[styles.navLabel, selected && styles.navSelected]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function InfoRow({ icon, title, subtitle, value, color = C.green, onPress, last = false }: { icon: string; title: string; subtitle?: string; value?: string; color?: string; onPress?: () => void; last?: boolean }) {
  const content = (
    <View style={[styles.infoRow, !last && styles.infoBorder]}>
      <RoundIcon symbol={icon} color={color} size={42} filled />
      <View style={styles.infoCopy}><Text style={styles.infoTitle}>{title}</Text>{subtitle ? <Text style={styles.infoSub}>{subtitle}</Text> : null}</View>
      {value ? <Text style={[styles.infoValue, { color }]}>{value}</Text> : null}
      {onPress ? <Text style={styles.chevron}>›</Text> : null}
    </View>
  );
  return onPress ? <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress}>{content}</Pressable> : content;
}

export function MiniMetric({ label, value, sub, color = C.green }: { label: string; value: string; sub?: string; color?: string }) {
  return <View style={styles.mini}><Text style={styles.miniLabel}>{label}</Text><Text style={styles.miniValue}>{value}</Text>{sub ? <Text style={[styles.miniSub, { color }]}>{sub}</Text> : null}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: C.bg, position: 'relative', overflow: 'hidden' },
  ambientBlue: { position: 'absolute', top: -240, left: '16%', width: 620, height: 620, borderRadius: 310, opacity: .14, backgroundColor: '#0755b8', ...Platform.select({ web: { filter: 'blur(120px)' } as any, default: {} }) },
  ambientPurple: { position: 'absolute', right: -260, bottom: -260, width: 620, height: 620, borderRadius: 310, opacity: .1, backgroundColor: '#5724b7', ...Platform.select({ web: { filter: 'blur(130px)' } as any, default: {} }) },
  contentScroll: { flex: 1 },
  page: { width: '100%', alignSelf: 'center', paddingTop: 22, paddingBottom: 28 },
  panel: { borderWidth: 1, borderRadius: 20, overflow: 'hidden', ...Platform.select({ web: { boxShadow: '0 18px 58px rgba(0,0,0,.3)', backdropFilter: 'blur(18px)' } as any, default: {} }) },
  rail: { width: 242, flexShrink: 0, borderRightWidth: 1, borderRightColor: 'rgba(49,148,255,.16)', backgroundColor: 'rgba(2,10,20,.94)', paddingHorizontal: 15, paddingTop: 21, paddingBottom: 19, zIndex: 10, ...Platform.select({ web: { boxShadow: '18px 0 55px rgba(0,0,0,.22)', backdropFilter: 'blur(24px)' } as any, default: {} }) },
  railBrand: { minHeight: 61, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 5 },
  railWordmark: { color: C.text, fontSize: 22, fontWeight: '900', letterSpacing: 1.7 },
  railFoundation: { color: C.blue, fontSize: 7, fontWeight: '900', letterSpacing: 1.2, marginTop: 2 },
  railMode: { minHeight: 31, marginTop: 14, marginHorizontal: 4, borderWidth: 1, borderColor: 'rgba(40,233,120,.24)', borderRadius: 10, backgroundColor: 'rgba(40,233,120,.05)', paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 7 },
  railModeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green, ...Platform.select({ web: { boxShadow: '0 0 10px rgba(40,233,120,.85)' } as any, default: {} }) },
  railModeText: { color: '#aeeec8', fontSize: 7, fontWeight: '900', letterSpacing: .8 },
  railNav: { marginTop: 24, gap: 5 },
  railItem: { minHeight: 48, borderRadius: 13, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', position: 'relative' },
  railItemActive: { borderWidth: 1, borderColor: 'rgba(49,148,255,.2)', backgroundColor: 'rgba(49,148,255,.1)' },
  railItemPressed: { opacity: .72 },
  railIcon: { width: 31, height: 31, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  railIconActive: { backgroundColor: 'rgba(49,148,255,.11)' },
  railLabel: { color: C.muted, fontSize: 12, fontWeight: '700', marginLeft: 8 },
  railLabelActive: { color: C.text, fontWeight: '900' },
  railIndicator: { position: 'absolute', right: -1, width: 3, height: 22, borderRadius: 3, backgroundColor: C.blue, ...Platform.select({ web: { boxShadow: '0 0 13px rgba(49,148,255,.8)' } as any, default: {} }) },
  railFooter: { marginTop: 'auto', borderTopWidth: 1, borderTopColor: C.borderSoft, paddingTop: 15, paddingHorizontal: 4 },
  railNetwork: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  railNetworkDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green },
  railNetworkText: { color: C.green, fontSize: 7, fontWeight: '900', letterSpacing: .8 },
  railFootnote: { color: C.muted2, fontSize: 9, marginTop: 6 },
  railSettings: { minHeight: 42, marginTop: 13, borderRadius: 11, backgroundColor: 'rgba(255,255,255,.025)', paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center' },
  railSettingsText: { color: C.muted, fontSize: 11, fontWeight: '800', marginLeft: 10 },
  header: { minHeight: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 18 },
  headerLeft: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  back: { width: 35, height: 46, alignItems: 'flex-start', justifyContent: 'center' },
  backText: { color: C.text, fontSize: 45, lineHeight: 45, fontWeight: '200' },
  headerCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  headerTitle: { color: C.text, fontWeight: '900' },
  headerSub: { color: '#c5d0df', marginTop: 3, lineHeight: 18 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#0a3c64', borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: 'rgba(3,16,30,.96)' },
  statusCompact: { gap: 4, paddingHorizontal: 7, paddingVertical: 6 },
  statusIcon: { color: C.green, fontSize: 23, fontWeight: '900' },
  statusTop: { color: '#d9e5f4', fontSize: 11 },
  statusBottom: { color: C.green, fontSize: 12, fontWeight: '900' },
  help: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#0a3c64', alignItems: 'center', justifyContent: 'center' },
  helpText: { color: C.green, fontSize: 22, fontWeight: '800' },
  section: { fontSize: 17, fontWeight: '900', letterSpacing: .1 },
  divider: { height: 1, backgroundColor: C.borderSoft },
  track: { flex: 1, borderRadius: 9, backgroundColor: 'rgba(255,255,255,.11)', overflow: 'hidden' },
  primary: { minHeight: 82, marginTop: 18, borderRadius: 17, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 14, ...Platform.select({ web: { boxShadow: '0 12px 32px rgba(0,90,255,.2)' } as any, default: {} }) },
  primaryIcon: { color: '#fff', fontSize: 30, fontWeight: '900' },
  primaryLabel: { color: '#fff', fontSize: 20, fontWeight: '900' },
  primarySub: { color: 'rgba(255,255,255,.78)', fontSize: 12, marginTop: 4 },
  primaryArrow: { color: '#fff', fontSize: 34 },
  bottomNav: { minHeight: 76, marginTop: 20, borderWidth: 1, borderColor: '#0a426e', borderRadius: 19, backgroundColor: 'rgba(3,13,25,.98)', flexDirection: 'row', alignItems: 'center', padding: 6, zIndex: 30, ...Platform.select({ web: { position: 'sticky', bottom: 10, boxShadow: '0 18px 45px rgba(0,0,0,.54)', backdropFilter: 'blur(24px)' } as any, default: {} }) },
  navItem: { flex: 1, minHeight: 66, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  navItemActive: { backgroundColor: 'rgba(0,78,170,.12)' },
  navLabel: { color: '#aebacc', fontSize: 10, marginTop: 5 },
  navSelected: { color: C.blue },
  infoRow: { minHeight: 78, paddingHorizontal: 15, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' },
  infoBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  infoCopy: { flex: 1, minWidth: 0, marginLeft: 13 },
  infoTitle: { color: C.text, fontSize: 15, fontWeight: '800' },
  infoSub: { color: C.muted, fontSize: 11, marginTop: 4 },
  infoValue: { fontSize: 13, fontWeight: '800', textAlign: 'right', marginLeft: 8 },
  chevron: { color: '#b8c5d7', fontSize: 27, marginLeft: 7 },
  mini: { flex: 1, minWidth: 0, paddingHorizontal: 10 },
  miniLabel: { color: C.muted, fontSize: 10 },
  miniValue: { color: C.text, fontSize: 17, fontWeight: '800', marginTop: 6 },
  miniSub: { fontSize: 10, fontWeight: '700', marginTop: 5 },
});
