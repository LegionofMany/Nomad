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
import { useNavigation } from '@react-navigation/native';

export const C = {
  bg: '#020812',
  panel: 'rgba(3,16,29,.97)',
  panel2: 'rgba(2,13,25,.82)',
  border: '#0a426d',
  borderSoft: 'rgba(22,132,255,.16)',
  blue: '#168cff',
  green: '#20ef70',
  purple: '#8752ff',
  orange: '#ffad18',
  red: '#ff4b4b',
  yellow: '#ffbd18',
  text: '#ffffff',
  muted: '#aebbd0',
  muted2: '#7f91a8',
};

export function useNomadLayout() {
  const { width } = useWindowDimensions();
  return { width, compact: width < 620, desktop: width >= 980 };
}

export function NomadPage({ children, maxWidth = 860 }: { children: React.ReactNode; maxWidth?: number }) {
  const { compact, desktop } = useNomadLayout();
  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.page,
          { paddingHorizontal: compact ? 14 : 24, maxWidth: desktop ? Math.max(maxWidth, 1080) : maxWidth },
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
  right,
}: {
  title: string;
  subtitle?: string;
  icon?: string;
  color?: string;
  back?: boolean;
  status?: boolean;
  help?: boolean;
  right?: React.ReactNode;
}) {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {back ? <Pressable onPress={() => navigation.goBack()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable> : null}
        <RoundIcon symbol={icon} color={color} size={compact ? 43 : 52} />
        <View style={styles.headerCopy}>
          <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.headerTitle, { fontSize: compact ? 24 : 31 }]}>{title}</Text>
          {subtitle ? <Text numberOfLines={2} style={[styles.headerSub, { fontSize: compact ? 11 : 14 }]}>{subtitle}</Text> : null}
        </View>
      </View>
      <View style={styles.headerRight}>
        {right}
        {status ? <SystemPill compact={compact} /> : null}
        {help ? <Pressable style={styles.help}><Text style={styles.helpText}>?</Text></Pressable> : null}
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
  const bg = tone === 'green' ? '#0bd34f' : tone === 'red' ? '#941f2b' : '#0b65f4';
  return (
    <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.primary, { backgroundColor: bg, opacity: disabled ? .45 : pressed ? .78 : 1 }]}>
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
  const nav = items ?? (fifth ? [...defaultNav.slice(0, 4), fifth] : defaultNav);
  return (
    <View style={styles.bottomNav}>
      {nav.map(([icon, label, route]) => {
        const selected = label === active;
        return (
          <Pressable key={`${label}-${route}`} onPress={() => navigation.navigate(route)} style={[styles.navItem, selected && styles.navItemActive]}>
            <Text style={[styles.navIcon, selected && styles.navSelected]}>{icon}</Text>
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
  return onPress ? <Pressable onPress={onPress}>{content}</Pressable> : content;
}

export function MiniMetric({ label, value, sub, color = C.green }: { label: string; value: string; sub?: string; color?: string }) {
  return <View style={styles.mini}><Text style={styles.miniLabel}>{label}</Text><Text style={styles.miniValue}>{value}</Text>{sub ? <Text style={[styles.miniSub, { color }]}>{sub}</Text> : null}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  page: { width: '100%', alignSelf: 'center', paddingTop: 18, paddingBottom: 24 },
  panel: { borderWidth: 1, borderRadius: 18, overflow: 'hidden', ...Platform.select({ web: { boxShadow: '0 16px 55px rgba(0,0,0,.28)' } as any, default: {} }) },
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
  bottomNav: { minHeight: 84, marginTop: 20, borderWidth: 1, borderColor: '#0a3559', borderRadius: 18, backgroundColor: 'rgba(3,14,25,.98)', flexDirection: 'row', alignItems: 'center', padding: 6 },
  navItem: { flex: 1, minHeight: 66, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  navItemActive: { backgroundColor: 'rgba(0,78,170,.12)' },
  navIcon: { color: '#aebacc', fontSize: 25 },
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
