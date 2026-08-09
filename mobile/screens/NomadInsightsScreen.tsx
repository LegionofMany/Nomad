import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { useNomadInsights, useNomadSecurity } from '../nomad';
import type {
  NomadInsightStat,
  NomadInsightsPeriod,
  NomadInsightsSeriesPoint,
  NomadPerformanceRow,
  NomadSpendingCategory,
} from '../nomad';
import {
  BottomNav,
  C,
  NomadPage,
  Panel,
  useNomadLayout,
} from '../ui/NomadShell';

type InsightArtworkKind =
  | 'insights'
  | 'shield'
  | 'help'
  | 'eye'
  | 'wallet'
  | 'travel'
  | 'investment'
  | 'assets'
  | 'insight'
  | 'destination'
  | 'trophy'
  | 'save'
  | 'spend';

const periods: NomadInsightsPeriod[] = ['7D', '1M', '3M', '1Y'];
const periodLabels: Record<NomadInsightsPeriod, string> = {
  '7D': 'Last 7 Days',
  '1M': 'This Month',
  '3M': 'Last 3 Months',
  '1Y': 'This Year',
};
const statArtwork: Record<string, InsightArtworkKind> = {
  'Wallet Balance': 'wallet',
  'Travel Pocket': 'travel',
  'Non-Stable Assets': 'investment',
  Investments: 'investment',
  'Total Assets': 'assets',
};
const assetColors: Record<string, string> = {
  BTC: '#ff9900',
  HBAR: '#7251ff',
  XRP: '#d8e0ea',
  XLM: '#168cff',
  XDC: '#1d73cc',
  ADA: '#168cff',
  ALGO: '#3778d6',
  ETH: '#8e8fa8',
  USDC: '#168cff',
  USDT: '#35f883',
  DAI: '#f4b731',
};

function parsePercent(value: string) {
  const parsed = Number(value.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function parseMoney(value: string) {
  const parsed = Number(value.replace(/,/g, '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? Math.abs(parsed) : 0;
}

function InsightsArtwork({ kind, color = C.green, size = 40 }: { kind: InsightArtworkKind; color?: string; size?: number }) {
  const stroke = {
    stroke: color,
    strokeWidth: 2.4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  let artwork: React.ReactNode;

  switch (kind) {
    case 'insights':
      artwork = <><Circle cx="24" cy="24" r="20" {...stroke} /><Path d="M12 35V25M20 35V17M28 35V22M36 35V11M10 20l9-7 8 4 10-9" {...stroke} /><Path d="m32 8 5 0 0 5" {...stroke} /></>;
      break;
    case 'shield':
      artwork = <><Path d="M24 4 41 12v13c0 11-6 18-17 23C13 43 7 36 7 25V12Z" {...stroke} /><Path d="m15 25 6 6 12-14" {...stroke} /></>;
      break;
    case 'help':
      artwork = <><Circle cx="24" cy="24" r="19" {...stroke} /><Path d="M18 18c1-5 11-7 13-1 2 5-5 6-7 10v3M24 37h.1" {...stroke} /></>;
      break;
    case 'eye':
      artwork = <><Path d="M4 24s7-12 20-12 20 12 20 12-7 12-20 12S4 24 4 24Z" {...stroke} /><Circle cx="24" cy="24" r="6" {...stroke} /></>;
      break;
    case 'wallet':
      artwork = <><Rect x="6" y="12" width="36" height="27" rx="5" {...stroke} /><Path d="M6 19h30M29 24h13v10H29a5 5 0 0 1 0-10Z" {...stroke} /><Circle cx="33" cy="29" r="1.5" fill={color} /></>;
      break;
    case 'travel':
      artwork = <><Path d="m6 22 36-14-12 34-6-13-13-1Z" {...stroke} /><Path d="m24 29 8-9" {...stroke} /></>;
      break;
    case 'investment':
      artwork = <><Circle cx="24" cy="24" r="18" {...stroke} /><Path d="M24 6v18h18M24 24 11 36M28 10a15 15 0 0 1 13 14" {...stroke} /></>;
      break;
    case 'assets':
      artwork = <><Ellipse cx="24" cy="11" rx="13" ry="6" {...stroke} /><Path d="M11 11v10c0 3 6 6 13 6s13-3 13-6V11M11 21v10c0 3 6 6 13 6s13-3 13-6V21M11 31v6c0 3 6 6 13 6s13-3 13-6v-6" {...stroke} /></>;
      break;
    case 'insight':
      artwork = <><Path d="M24 4 40 12v12c0 10-6 18-16 23C14 42 8 34 8 24V12Z" {...stroke} /><Path d="m24 15 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" {...stroke} /></>;
      break;
    case 'destination':
      artwork = <><Path d="M9 39h30M14 35h20M17 35V22h14v13M13 22h22M16 18h16M20 14h8M24 7v7M9 22l15-8 15 8" {...stroke} /></>;
      break;
    case 'trophy':
      artwork = <><Path d="M15 7h18v10c0 9-4 15-9 15s-9-6-9-15Z" {...stroke} /><Path d="M15 12H7v5c0 6 4 10 10 10M33 12h8v5c0 6-4 10-10 10M24 32v7M16 43h16" {...stroke} /><Path d="m24 12 2 4 5 1-4 3 1 5-4-2-4 2 1-5-4-3 5-1Z" {...stroke} /></>;
      break;
    case 'save':
      artwork = <><Rect x="8" y="13" width="32" height="25" rx="5" {...stroke} /><Path d="M8 20h32M29 25h11v9H29a4 4 0 0 1 0-9Z" {...stroke} /></>;
      break;
    case 'spend':
      artwork = <><Path d="M24 4 40 12v12c0 10-6 18-16 23C14 42 8 34 8 24V12Z" {...stroke} /><Path d="M28 17c-1-2-7-2-8 1-2 5 10 3 9 9-1 4-8 4-10 1M24 14v18" {...stroke} /></>;
      break;
    default:
      artwork = null;
  }

  return <Svg accessibilityLabel={kind + ' insights icon'} width={size} height={size} viewBox="0 0 48 48" fill="none">{artwork}</Svg>;
}

function SystemStatusPill({ label, color, compact }: { label: string; color: string; compact: boolean }) {
  return (
    <View accessibilityLabel={'All Systems ' + label} style={[styles.systemPill, compact && styles.systemPillCompact, { borderColor: color + '55' }]}>
      <InsightsArtwork kind="shield" color={color} size={compact ? 27 : 35} />
      <View>
        <Text style={[styles.systemTop, compact && styles.systemTopCompact]}>All Systems</Text>
        <Text style={[styles.systemBottom, compact && styles.systemBottomCompact, { color }]}>{label}</Text>
      </View>
    </View>
  );
}

function InsightsHeader({ compact, label, color }: { compact: boolean; label: string; color: string }) {
  const navigation = useNavigation<any>();
  return (
    <View style={[styles.header, compact && styles.headerCompact]}>
      <View style={styles.headerBrand}>
        <View style={[styles.headerIcon, compact && styles.headerIconCompact]}><InsightsArtwork kind="insights" color={C.green} size={compact ? 35 : 47} /></View>
        <View style={styles.headerCopy}>
          <Text numberOfLines={1} style={[styles.headerTitle, compact && styles.headerTitleCompact]}>Nomad Insights</Text>
          <Text numberOfLines={1} style={[styles.headerSubtitle, compact && styles.headerSubtitleCompact]}>Your spending. Your savings. Your freedom.</Text>
        </View>
      </View>
      <View style={[styles.headerActions, compact && styles.headerActionsCompact]}>
        <SystemStatusPill label={label} color={color} compact={compact} />
        <Pressable testID="insights-header-help" accessibilityRole="button" accessibilityLabel="Open Nomad Insights help" onPress={() => navigation.navigate('Settings')} style={({ pressed }) => [styles.helpButton, compact && styles.helpButtonCompact, pressed && styles.pressed]}>
          <InsightsArtwork kind="help" color="#c8d4e6" size={compact ? 25 : 33} />
        </Pressable>
      </View>
    </View>
  );
}

function buildLinePath(points: NomadInsightsSeriesPoint[], width: number, height: number) {
  if (!points.length) return '';
  const values = points.map((point) => point.value);
  const maximum = Math.max(...values);
  const minimum = Math.min(...values);
  const range = maximum - minimum;
  return points.map((point, index) => {
    const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * width;
    const normalized = range > 0 ? (point.value - minimum) / range : .5;
    const y = height - 12 - normalized * (height - 24);
    return (index === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1);
  }).join(' ');
}

function LineChart({ points, color, historyAvailable, compact }: { points: NomadInsightsSeriesPoint[]; color: string; historyAvailable: boolean; compact: boolean }) {
  const width = 360;
  const height = compact ? 94 : 132;
  const path = buildLinePath(points, width, height);
  const values = points.map((point) => point.value);
  const maximum = Math.max(...values, 0);
  const minimum = Math.min(...values, 0);
  const range = maximum - minimum;

  return (
    <View style={[styles.lineChart, compact && styles.lineChartCompact]}>
      <Svg width="100%" height="100%" viewBox={'0 0 ' + width + ' ' + height} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="insightsLineFill" x1="0" y1="0" x2="0" y2="1"><Stop stopColor={color} stopOpacity={historyAvailable ? .28 : .08} /><Stop offset="1" stopColor={color} stopOpacity="0" /></LinearGradient>
        </Defs>
        <G stroke={color} strokeOpacity=".13" strokeDasharray="3 6">
          <Path d={'M0 20H' + width} /><Path d={'M0 ' + (height / 2) + 'H' + width} /><Path d={'M0 ' + (height - 18) + 'H' + width} />
          {[40, 100, 160, 220, 280, 340].map((x) => <Path key={x} d={'M' + x + ' 5V' + (height - 6)} />)}
        </G>
        {path ? <Path d={path + ' L' + width + ' ' + height + ' L0 ' + height + ' Z'} fill="url(#insightsLineFill)" /> : null}
        {path ? <Path d={path} stroke={color} strokeWidth={historyAvailable ? 3 : 2} strokeDasharray={historyAvailable ? undefined : '7 5'} fill="none" /> : null}
        {points.map((point, index) => {
          const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * width;
          const normalized = range > 0 ? (point.value - minimum) / range : .5;
          const y = height - 12 - normalized * (height - 24);
          return <Circle key={point.label + '-' + index} cx={x} cy={y} r={historyAvailable ? 4 : index === points.length - 1 ? 4 : 2.5} fill={color} opacity={historyAvailable ? 1 : .62} />;
        })}
      </Svg>
      {!historyAvailable ? <Text style={styles.chartNotice}>CURRENT SNAPSHOT · HISTORY UNAVAILABLE</Text> : null}
    </View>
  );
}

function StatCard({ item, compact }: { item: NomadInsightStat; compact: boolean }) {
  const displayLabel = item.label === 'Non-Stable Assets' ? 'Investments' : item.label;
  const kind = statArtwork[item.label] || 'assets';
  return (
    <View style={[styles.statCard, compact && styles.statCardCompact]}>
      <View style={styles.statHeading}><InsightsArtwork kind={kind} color={item.color} size={compact ? 25 : 32} /><Text numberOfLines={1} style={[styles.statLabel, compact && styles.statLabelCompact]}>{displayLabel}</Text></View>
      <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.statValue, compact && styles.statValueCompact]}>{item.value}</Text>
      <Text numberOfLines={1} style={[styles.statNote, compact && styles.statNoteCompact, { color: item.color }]}>{item.note}</Text>
    </View>
  );
}

function PeriodDropdown({ selected, open, loading, compact, onToggle, onSelect }: { selected: NomadInsightsPeriod; open: boolean; loading: boolean; compact: boolean; onToggle(): void; onSelect(period: NomadInsightsPeriod): void }) {
  return (
    <View style={styles.periodWrap}>
      <Pressable testID="insights-period-dropdown" accessibilityRole="button" accessibilityLabel={'Change insights period. ' + periodLabels[selected]} disabled={loading} onPress={onToggle} style={[styles.periodButton, compact && styles.periodButtonCompact, loading && styles.disabled]}>
        <Text style={[styles.periodLabel, compact && styles.periodLabelCompact]}>{loading ? 'Updating…' : periodLabels[selected]}</Text><Text style={styles.periodChevron}>{open ? '⌃' : '⌄'}</Text>
      </Pressable>
      {open ? (
        <View style={[styles.periodMenu, compact && styles.periodMenuCompact]}>
          {periods.map((item) => <Pressable key={item} testID={'insights-period-' + item.toLowerCase()} accessibilityRole="button" accessibilityLabel={'Show ' + periodLabels[item]} onPress={() => onSelect(item)} style={[styles.periodOption, item === selected && styles.periodOptionActive]}><Text style={[styles.periodOptionText, item === selected && styles.periodOptionTextActive]}>{periodLabels[item]}</Text></Pressable>)}
        </View>
      ) : null}
    </View>
  );
}

function DonutChart({ categories, total, compact }: { categories: NomadSpendingCategory[]; total: string; compact: boolean }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const totalPercent = categories.reduce((sum, category) => sum + parsePercent(category.percent), 0);

  return (
    <View style={[styles.donutWrap, compact && styles.donutWrapCompact]}>
      <Svg accessibilityLabel={'Spending distribution totaling ' + total} width={compact ? 132 : 176} height={compact ? 132 : 176} viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r={radius} fill="none" stroke="#243144" strokeWidth="15" />
        {totalPercent > 0 ? categories.map((category) => {
          const percent = parsePercent(category.percent);
          const dash = circumference * percent / 100;
          const dashOffset = -circumference * offset / 100;
          offset += percent;
          return <Circle key={category.label} cx="50" cy="50" r={radius} fill="none" stroke={category.color} strokeWidth="15" strokeDasharray={dash + ' ' + (circumference - dash)} strokeDashoffset={dashOffset} transform="rotate(-90 50 50)" />;
        }) : null}
      </Svg>
      <View style={styles.donutCenter}><Text numberOfLines={1} adjustsFontSizeToFit style={[styles.donutTotal, compact && styles.donutTotalCompact]}>{total}</Text><Text style={[styles.donutLabel, compact && styles.donutLabelCompact]}>Total Spent</Text></View>
    </View>
  );
}

function CategoryLegend({ item, compact }: { item: NomadSpendingCategory; compact: boolean }) {
  return (
    <View style={[styles.categoryRow, compact && styles.categoryRowCompact]}>
      <View style={[styles.categoryDot, { backgroundColor: item.color }]} />
      <Text numberOfLines={1} style={[styles.categoryLabel, compact && styles.categoryLabelCompact]}>{item.label}</Text>
      <Text style={[styles.categoryPercent, compact && styles.categoryPercentCompact]}>{item.percent}</Text>
      <Text style={[styles.categoryAmount, compact && styles.categoryAmountCompact]}>{item.amount}</Text>
    </View>
  );
}

function SnapshotSparkline({ color, compact }: { color: string; compact: boolean }) {
  return (
    <Svg accessibilityLabel="Current price snapshot; market history unavailable" width={compact ? 91 : 150} height={compact ? 30 : 38} viewBox="0 0 150 38">
      <Path d="M2 23 22 23 35 23 49 23 64 23 78 23 93 23 108 23 126 23 148 23" stroke={color} strokeWidth="2" strokeDasharray="5 4" fill="none" />
      <Circle cx="148" cy="23" r="3.5" fill={color} />
    </Svg>
  );
}

function PerformanceRow({ item, last, compact }: { item: NomadPerformanceRow; last: boolean; compact: boolean }) {
  const navigation = useNavigation<any>();
  const color = assetColors[item.symbol] || C.blue;
  return (
    <Pressable testID={'insights-performance-' + item.symbol.toLowerCase()} accessibilityRole="button" accessibilityLabel={'Open ' + item.asset + ' wallet'} onPress={() => navigation.navigate('Wallets', { asset: item.symbol })} style={({ pressed }) => [styles.performanceRow, compact && styles.performanceRowCompact, !last && styles.rowBorder, pressed && styles.pressed]}>
      <View style={[styles.assetBadge, compact && styles.assetBadgeCompact, { borderColor: color, backgroundColor: color + '18' }]}><Text style={[styles.assetMark, compact && styles.assetMarkCompact, { color }]}>{item.icon}</Text></View>
      <View style={styles.assetCopy}><Text style={[styles.assetName, compact && styles.assetNameCompact]}>{item.asset}</Text><Text style={[styles.assetSymbol, compact && styles.assetSymbolCompact]}>{item.symbol}</Text></View>
      <SnapshotSparkline color={item.positive ? C.green : C.red} compact={compact} />
      <Text style={[styles.assetPrice, compact && styles.assetPriceCompact]}>{item.price}</Text>
      <View style={styles.changeCopy}><Text style={[styles.assetChange, compact && styles.assetChangeCompact, { color: item.change.startsWith('-') ? C.red : C.green }]}>{item.change}</Text><Text style={styles.snapshotText}>SNAPSHOT</Text></View>
    </Pressable>
  );
}

function ScoreRing({ score, compact }: { score: number; compact: boolean }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference * Math.max(0, Math.min(100, score)) / 100;
  return (
    <View style={[styles.scoreRing, compact && styles.scoreRingCompact]}>
      <Svg width={compact ? 88 : 120} height={compact ? 88 : 120} viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r={radius} fill="none" stroke="#1e5039" strokeWidth="8" />
        <Circle cx="50" cy="50" r={radius} fill="none" stroke={C.green} strokeWidth="8" strokeLinecap="round" strokeDasharray={progress + ' ' + (circumference - progress)} transform="rotate(-90 50 50)" />
      </Svg>
      <View style={styles.scoreCenter}><Text style={[styles.scoreValue, compact && styles.scoreValueCompact]}>{score}</Text><Text style={[styles.scoreOut, compact && styles.scoreOutCompact]}>/100</Text></View>
    </View>
  );
}

function ChecklistItem({ kind, label, complete, compact }: { kind: InsightArtworkKind; label: string; complete: boolean; compact: boolean }) {
  const color = complete ? C.green : C.yellow;
  return (
    <View style={[styles.checkItem, compact && styles.checkItemCompact]}>
      <InsightsArtwork kind={kind} color={color} size={compact ? 21 : 27} />
      <Text style={[styles.checkLabel, compact && styles.checkLabelCompact]}>{label}</Text>
      <View style={[styles.checkMark, compact && styles.checkMarkCompact, { backgroundColor: color }]}><Text style={styles.checkMarkText}>{complete ? '✓' : '!'}</Text></View>
    </View>
  );
}

export default function NomadInsightsScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { insights, period, loading, error, refresh, setPeriod } = useNomadInsights();
  const { security, loading: securityLoading } = useNomadSecurity();
  const [periodOpen, setPeriodOpen] = useState(false);

  const frozen = security.status === 'frozen';
  const securityReview = security.status === 'warning';
  const systemLabel = securityLoading ? 'CHECKING' : frozen ? 'FROZEN' : securityReview ? 'REVIEW' : 'SECURE';
  const systemColor = securityLoading ? C.blue : frozen ? C.red : securityReview ? C.yellow : C.green;
  const performance = insights.performanceRows.slice(0, 5);
  const sourceLabel = insights.transactionFeedStatus === 'wallet_ledger' ? 'WALLET LEDGER' : 'TRAVEL PREVIEW ACTIVITY';
  const travelActive = insights.travelDateRange.startsWith('Active');
  const savingHeadroom = parseMoney(insights.topSavings) > 0;
  const budgetTotal = insights.budgets.reduce((sum, item) => sum + parseMoney(item.total), 0);
  const spendingMindful = budgetTotal > 0 && parseMoney(insights.spendingTotal) <= budgetTotal;

  const choosePeriod = (next: NomadInsightsPeriod) => {
    setPeriodOpen(false);
    void setPeriod(next);
  };

  return (
    <NomadPage maxWidth={980}>
      <InsightsHeader compact={compact} label={systemLabel} color={systemColor} />

      {error ? <View style={styles.errorBanner}><Text style={styles.errorText}>{error}</Text><Pressable accessibilityRole="button" accessibilityLabel="Retry Nomad Insights" onPress={() => void refresh()} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></Pressable></View> : null}

      <Panel tone="green" style={[styles.overviewPanel, compact && styles.overviewPanelCompact]}>
        <Text style={[styles.eyebrow, compact && styles.eyebrowCompact]}>OVERVIEW</Text>
        <View style={[styles.portfolioRow, compact && styles.portfolioRowCompact]}>
          <View style={styles.portfolioCopy}>
            <View style={styles.portfolioLabelRow}><Text style={[styles.portfolioLabel, compact && styles.portfolioLabelCompact]}>Total Portfolio Value</Text><InsightsArtwork kind="eye" color="#a8b5c8" size={compact ? 20 : 25} /></View>
            <View style={styles.portfolioValueRow}><Text numberOfLines={1} adjustsFontSizeToFit style={[styles.portfolioValue, compact && styles.portfolioValueCompact]}>{insights.totalPortfolioValue}</Text><Text style={[styles.usd, compact && styles.usdCompact]}>USD</Text></View>
            <Text numberOfLines={2} style={[insights.historyAvailable ? styles.growth : styles.historyUnavailable, compact && styles.historyCompact]}>{insights.historyAvailable ? insights.monthlyGrowth + ' (' + insights.monthlyGrowthPercent + ')  ' + periodLabels[period] : 'No historical ledger · Current balance snapshot'}</Text>
          </View>
          <LineChart points={insights.portfolioSeries} color={insights.historyAvailable ? C.green : C.yellow} historyAvailable={insights.historyAvailable} compact={compact} />
        </View>
        <View style={[styles.statGrid, compact && styles.statGridCompact]}>{insights.statCards.map((item) => <StatCard key={item.label} item={item} compact={compact} />)}</View>
      </Panel>

      <Panel style={[styles.sectionPanel, compact && styles.sectionPanelCompact]}>
        <View style={styles.sectionHeading}>
          <View><Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>SPENDING OVERVIEW</Text><Text style={[styles.sectionSub, compact && styles.sectionSubCompact]}>{sourceLabel}</Text></View>
          <PeriodDropdown selected={period} open={periodOpen} loading={loading} compact={compact} onToggle={() => setPeriodOpen((current) => !current)} onSelect={choosePeriod} />
        </View>
        <View style={[styles.spendingBody, compact && styles.spendingBodyCompact]}>
          <View style={[styles.spendingSummary, compact && styles.spendingSummaryCompact]}>
            <Text style={[styles.spendingLabel, compact && styles.spendingLabelCompact]}>Total Spent ({periodLabels[period]})</Text>
            <Text style={[styles.spendingValue, compact && styles.spendingValueCompact]}>{insights.spendingTotal}</Text>
            <Text numberOfLines={2} style={[styles.spendingDelta, compact && styles.spendingDeltaCompact, { color: insights.spendingDelta.startsWith('-') ? C.green : C.yellow }]}>{insights.spendingDelta}</Text>
          </View>
          <DonutChart categories={insights.spendingCategories} total={insights.spendingTotal} compact={compact} />
          <View style={[styles.categories, compact && styles.categoriesCompact]}>{insights.spendingCategories.map((item) => <CategoryLegend key={item.label} item={item} compact={compact} />)}</View>
        </View>
        <Pressable testID="insights-top-insight" accessibilityRole="button" accessibilityLabel="Open detailed spending insights" onPress={() => navigation.navigate('NomadInsightsSpending')} style={({ pressed }) => [styles.insightRow, compact && styles.insightRowCompact, pressed && styles.pressed]}>
          <View style={[styles.insightIcon, compact && styles.insightIconCompact]}><InsightsArtwork kind="insight" color={C.green} size={compact ? 27 : 35} /></View>
          <View style={styles.insightCopy}><Text style={[styles.insightTitle, compact && styles.insightTitleCompact]}>Top Insight</Text><Text numberOfLines={2} style={[styles.insightText, compact && styles.insightTextCompact]}>{insights.topInsight}</Text></View>
          <Text style={[styles.chevron, compact && styles.chevronCompact]}>›</Text>
        </Pressable>
      </Panel>

      <Panel style={[styles.travelPanel, compact && styles.travelPanelCompact]}>
        <View style={styles.sectionHeading}>
          <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>TRAVEL ACTIVITY</Text>
          <Pressable testID="insights-travel" accessibilityRole="button" accessibilityLabel="View all Travel Pocket activity" onPress={() => navigation.navigate('TravelMode')}><Text style={[styles.link, compact && styles.linkCompact]}>View All Trips  ›</Text></Pressable>
        </View>
        <View style={[styles.travelBody, compact && styles.travelBodyCompact]}>
          <View style={[styles.destinationIcon, compact && styles.destinationIconCompact]}><InsightsArtwork kind="destination" color={C.green} size={compact ? 39 : 52} /><View style={styles.regionBadge}><Text style={styles.regionBadgeText}>{insights.travelLocation.toLowerCase().includes('japan') ? '🇯🇵' : '✈'}</Text></View></View>
          <View style={[styles.travelCopy, compact && styles.travelCopyCompact]}>
            <View style={styles.travelNameRow}><Text numberOfLines={1} style={[styles.travelName, compact && styles.travelNameCompact]}>{insights.travelLocation}</Text><View style={[styles.travelStatus, { backgroundColor: travelActive ? 'rgba(32,239,112,.18)' : 'rgba(255,196,0,.16)' }]}><Text style={[styles.travelStatusText, { color: travelActive ? C.green : C.yellow }]}>{travelActive ? 'ACTIVE' : 'READY'}</Text></View></View>
            <Text numberOfLines={2} style={[styles.travelDate, compact && styles.travelDateCompact]}>{insights.travelDateRange}</Text>
            <Text style={styles.travelSource}>{sourceLabel}</Text>
          </View>
          <View style={[styles.travelMetric, compact && styles.travelMetricCompact]}><Text style={styles.travelMetricLabel}>Spent from Pocket</Text><Text style={[styles.travelMetricValue, compact && styles.travelMetricValueCompact]}>{insights.travelPocketSpent}</Text><Text style={styles.travelMetricSub}>{insights.travelPocketSpentUsd}</Text></View>
          <View style={[styles.travelMetric, compact && styles.travelMetricCompact]}><Text style={styles.travelMetricLabel}>Daily Average</Text><Text style={[styles.travelMetricValue, compact && styles.travelMetricValueCompact]}>{insights.travelDailyAverage}</Text><Text style={styles.travelMetricSub}>{insights.travelDailyAverageUsd}</Text></View>
        </View>
      </Panel>

      <Panel style={[styles.performancePanel, compact && styles.performancePanelCompact]}>
        <View style={styles.sectionHeading}>
          <View><Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>PORTFOLIO PERFORMANCE</Text><Text style={[styles.sectionSub, compact && styles.sectionSubCompact]}>Current prices · market history unavailable</Text></View>
          <Text style={[styles.periodStatic, compact && styles.periodStaticCompact]}>{periodLabels[period]}  ⌄</Text>
        </View>
        <View style={styles.performanceList}>{performance.length ? performance.map((item, index) => <PerformanceRow key={item.symbol} item={item} last={index === performance.length - 1} compact={compact} />) : <Text style={styles.emptyText}>No wallet assets are available for portfolio snapshots.</Text>}</View>
      </Panel>

      <Panel tone="green" style={[styles.freedomPanel, compact && styles.freedomPanelCompact]}>
        <View style={[styles.freedomIntro, compact && styles.freedomIntroCompact]}><InsightsArtwork kind="trophy" color={C.green} size={compact ? 43 : 56} /><View style={styles.freedomCopy}><Text style={[styles.freedomTitle, compact && styles.freedomTitleCompact]}>Freedom Score</Text><Text numberOfLines={2} style={[styles.freedomText, compact && styles.freedomTextCompact]}>Calculated from connected evidence—not a financial promise.</Text></View></View>
        <ScoreRing score={insights.freedomScore} compact={compact} />
        <View style={[styles.checklist, compact && styles.checklistCompact]}>
          <ChecklistItem kind="save" label="Save consistently" complete={savingHeadroom} compact={compact} />
          <ChecklistItem kind="spend" label="Spend mindfully" complete={spendingMindful} compact={compact} />
          <ChecklistItem kind="travel" label="Travel freely" complete={travelActive} compact={compact} />
        </View>
      </Panel>

      <BottomNav active="Insights" items={[
        ['⌂', 'Home', 'Portfolio'],
        ['▣', 'Wallets', 'Wallets'],
        ['✈', 'Travel', 'TravelMode'],
        ['◇', 'Security', 'SecurityCenter'],
        ['⌁', 'Insights', 'NomadInsights'],
      ]} />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: .7 },
  disabled: { opacity: .5 },
  header: { minHeight: 82, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  headerCompact: { minHeight: 58, marginBottom: 10, gap: 7 },
  headerBrand: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 13 },
  headerIcon: { width: 57, height: 57, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
  headerIconCompact: { width: 42, height: 42, borderRadius: 21 },
  headerCopy: { flex: 1, minWidth: 0 },
  headerTitle: { color: C.text, fontSize: 31, fontWeight: '900', letterSpacing: -.7 },
  headerTitleCompact: { fontSize: 19 },
  headerSubtitle: { color: '#c8d2df', fontSize: 13, marginTop: 3 },
  headerSubtitleCompact: { fontSize: 8, marginTop: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  headerActionsCompact: { gap: 5 },
  systemPill: { minHeight: 54, borderWidth: 1, borderRadius: 999, backgroundColor: 'rgba(2,15,27,.94)', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  systemPillCompact: { minHeight: 39, paddingHorizontal: 8, gap: 4 },
  systemTop: { color: '#d8e3ef', fontSize: 11 },
  systemTopCompact: { fontSize: 7.5 },
  systemBottom: { fontSize: 13, fontWeight: '900', marginTop: 1 },
  systemBottomCompact: { fontSize: 8.5 },
  helpButton: { width: 45, height: 45, borderRadius: 23, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  helpButtonCompact: { width: 34, height: 34, borderRadius: 17 },
  errorBanner: { marginBottom: 12, borderWidth: 1, borderColor: C.red, borderRadius: 10, padding: 11, flexDirection: 'row', alignItems: 'center' },
  errorText: { flex: 1, color: C.red, fontSize: 10 },
  retryButton: { borderWidth: 1, borderColor: C.red, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  retryText: { color: C.red, fontSize: 9, fontWeight: '900' },
  overviewPanel: { padding: 22, overflow: 'hidden' },
  overviewPanelCompact: { padding: 12 },
  eyebrow: { color: C.green, fontSize: 13, fontWeight: '900' },
  eyebrowCompact: { fontSize: 9.5 },
  portfolioRow: { minHeight: 170, flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 10 },
  portfolioRowCompact: { minHeight: 119, gap: 8, marginTop: 5 },
  portfolioCopy: { flex: 1, minWidth: 0 },
  portfolioLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  portfolioLabel: { color: '#fff', fontSize: 14 },
  portfolioLabelCompact: { fontSize: 9.5 },
  portfolioValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 7, marginTop: 8 },
  portfolioValue: { flexShrink: 1, color: '#fff', fontSize: 48, fontWeight: '900', letterSpacing: -1.2 },
  portfolioValueCompact: { fontSize: 31 },
  usd: { color: '#fff', fontSize: 14 },
  usdCompact: { fontSize: 9.5 },
  growth: { color: C.green, fontSize: 11, fontWeight: '900', marginTop: 8 },
  historyUnavailable: { color: C.yellow, fontSize: 10, lineHeight: 15, marginTop: 8 },
  historyCompact: { fontSize: 7.5, lineHeight: 10, marginTop: 4 },
  lineChart: { flex: 1, minWidth: 310, height: 142, position: 'relative' },
  lineChartCompact: { minWidth: 155, height: 98 },
  chartNotice: { position: 'absolute', right: 3, bottom: 0, color: C.yellow, fontSize: 7, fontWeight: '900' },
  statGrid: { flexDirection: 'row', gap: 10, marginTop: 12 },
  statGridCompact: { gap: 6, marginTop: 7 },
  statCard: { flex: 1, minWidth: 0, minHeight: 118, borderWidth: 1, borderColor: C.border, borderRadius: 12, backgroundColor: 'rgba(0,25,45,.72)', padding: 12 },
  statCardCompact: { minHeight: 79, borderRadius: 8, padding: 7 },
  statHeading: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  statLabel: { flex: 1, color: '#fff', fontSize: 10 },
  statLabelCompact: { fontSize: 7 },
  statValue: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 15 },
  statValueCompact: { fontSize: 13.5, marginTop: 9 },
  statNote: { fontSize: 10, fontWeight: '900', marginTop: 8 },
  statNoteCompact: { fontSize: 7, marginTop: 4 },
  sectionPanel: { marginTop: 17, padding: 20 },
  sectionPanelCompact: { marginTop: 10, padding: 11 },
  sectionHeading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  sectionTitle: { color: '#fff', fontSize: 14, fontWeight: '900' },
  sectionTitleCompact: { fontSize: 10 },
  sectionSub: { color: C.muted, fontSize: 8, marginTop: 4 },
  sectionSubCompact: { fontSize: 6.5, marginTop: 2 },
  periodWrap: { position: 'relative', zIndex: 4 },
  periodButton: { minWidth: 150, minHeight: 43, borderWidth: 1, borderColor: C.border, borderRadius: 9, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  periodButtonCompact: { minWidth: 104, minHeight: 31, borderRadius: 7, paddingHorizontal: 9 },
  periodLabel: { color: '#fff', fontSize: 10 },
  periodLabelCompact: { fontSize: 7.5 },
  periodChevron: { color: '#c8d4e5', fontSize: 14 },
  periodMenu: { position: 'absolute', top: 47, right: 0, width: 165, borderWidth: 1, borderColor: C.border, borderRadius: 9, backgroundColor: '#04111f', padding: 4, zIndex: 10 },
  periodMenuCompact: { top: 34, width: 122 },
  periodOption: { minHeight: 34, borderRadius: 6, justifyContent: 'center', paddingHorizontal: 10 },
  periodOptionActive: { backgroundColor: 'rgba(32,239,112,.12)' },
  periodOptionText: { color: C.muted, fontSize: 9 },
  periodOptionTextActive: { color: C.green, fontWeight: '900' },
  spendingBody: { minHeight: 195, flexDirection: 'row', alignItems: 'center', gap: 19, marginTop: 13 },
  spendingBodyCompact: { minHeight: 128, gap: 9, marginTop: 7 },
  spendingSummary: { flex: .75, minWidth: 170 },
  spendingSummaryCompact: { minWidth: 85 },
  spendingLabel: { color: '#c9d3df', fontSize: 10 },
  spendingLabelCompact: { fontSize: 7 },
  spendingValue: { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 8 },
  spendingValueCompact: { fontSize: 18, marginTop: 5 },
  spendingDelta: { fontSize: 10, fontWeight: '900', marginTop: 7 },
  spendingDeltaCompact: { fontSize: 7, lineHeight: 10, marginTop: 4 },
  donutWrap: { width: 176, height: 176, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  donutWrapCompact: { width: 132, height: 132 },
  donutCenter: { position: 'absolute', alignItems: 'center' },
  donutTotal: { maxWidth: 104, color: '#fff', fontSize: 16, fontWeight: '900' },
  donutTotalCompact: { maxWidth: 76, fontSize: 11 },
  donutLabel: { color: '#fff', fontSize: 9, marginTop: 5 },
  donutLabelCompact: { fontSize: 6.5, marginTop: 3 },
  categories: { flex: 1, minWidth: 240 },
  categoriesCompact: { minWidth: 115 },
  categoryRow: { minHeight: 31, flexDirection: 'row', alignItems: 'center' },
  categoryRowCompact: { minHeight: 21 },
  categoryDot: { width: 9, height: 9, borderRadius: 5, marginRight: 8 },
  categoryLabel: { flex: 1, color: '#fff', fontSize: 9.5 },
  categoryLabelCompact: { fontSize: 6.5 },
  categoryPercent: { color: '#fff', fontSize: 10, fontWeight: '900', minWidth: 34, textAlign: 'right' },
  categoryPercentCompact: { fontSize: 7, minWidth: 24 },
  categoryAmount: { color: '#c7d0dd', fontSize: 9, minWidth: 65, textAlign: 'right', marginLeft: 9 },
  categoryAmountCompact: { fontSize: 6.5, minWidth: 44, marginLeft: 5 },
  insightRow: { minHeight: 67, marginTop: 12, borderWidth: 1, borderColor: C.green, borderRadius: 11, backgroundColor: 'rgba(4,75,36,.25)', padding: 11, flexDirection: 'row', alignItems: 'center' },
  insightRowCompact: { minHeight: 49, marginTop: 7, borderRadius: 8, padding: 7 },
  insightIcon: { width: 43, height: 43, borderRadius: 10, backgroundColor: 'rgba(32,239,112,.1)', alignItems: 'center', justifyContent: 'center' },
  insightIconCompact: { width: 31, height: 31, borderRadius: 7 },
  insightCopy: { flex: 1, minWidth: 0, marginLeft: 10 },
  insightTitle: { color: C.green, fontSize: 11, fontWeight: '900' },
  insightTitleCompact: { fontSize: 8 },
  insightText: { color: '#fff', fontSize: 9, lineHeight: 14, marginTop: 4 },
  insightTextCompact: { fontSize: 6.5, lineHeight: 9, marginTop: 2 },
  chevron: { color: C.green, fontSize: 27, marginLeft: 7 },
  chevronCompact: { fontSize: 20, marginLeft: 3 },
  travelPanel: { marginTop: 17, padding: 19 },
  travelPanelCompact: { marginTop: 10, padding: 10 },
  link: { color: C.green, fontSize: 10, fontWeight: '900' },
  linkCompact: { fontSize: 7.5 },
  travelBody: { minHeight: 112, flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 11 },
  travelBodyCompact: { minHeight: 77, gap: 8, marginTop: 6 },
  destinationIcon: { width: 77, height: 77, borderRadius: 39, borderWidth: 1, borderColor: C.green, backgroundColor: 'rgba(32,239,112,.09)', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  destinationIconCompact: { width: 54, height: 54, borderRadius: 27 },
  regionBadge: { position: 'absolute', right: -2, bottom: -2, minWidth: 28, height: 20, borderRadius: 5, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  regionBadgeText: { fontSize: 12 },
  travelCopy: { flex: 1, minWidth: 150 },
  travelCopyCompact: { minWidth: 112 },
  travelNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  travelName: { flexShrink: 1, color: '#fff', fontSize: 16, fontWeight: '900' },
  travelNameCompact: { fontSize: 11 },
  travelStatus: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  travelStatusText: { fontSize: 8, fontWeight: '900' },
  travelDate: { color: '#c8d2df', fontSize: 9, marginTop: 6 },
  travelDateCompact: { fontSize: 6.5, marginTop: 3 },
  travelSource: { color: C.muted, fontSize: 7, marginTop: 5 },
  travelMetric: { minWidth: 130, borderLeftWidth: 1, borderLeftColor: C.borderSoft, paddingLeft: 15 },
  travelMetricCompact: { minWidth: 86, paddingLeft: 8 },
  travelMetricLabel: { color: C.muted, fontSize: 8 },
  travelMetricValue: { color: '#fff', fontSize: 16, fontWeight: '900', marginTop: 7 },
  travelMetricValueCompact: { fontSize: 11, marginTop: 4 },
  travelMetricSub: { color: '#c8d2df', fontSize: 8, marginTop: 4 },
  performancePanel: { marginTop: 17, padding: 19 },
  performancePanelCompact: { marginTop: 10, padding: 10 },
  periodStatic: { color: '#c8d2df', fontSize: 10 },
  periodStaticCompact: { fontSize: 7.5 },
  performanceList: { marginTop: 8 },
  performanceRow: { minHeight: 67, flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  performanceRowCompact: { minHeight: 46, paddingVertical: 5 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  assetBadge: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  assetBadgeCompact: { width: 30, height: 30, borderRadius: 15 },
  assetMark: { fontSize: 19, fontWeight: '900' },
  assetMarkCompact: { fontSize: 13 },
  assetCopy: { flex: 1, minWidth: 95, marginLeft: 11 },
  assetName: { color: '#fff', fontSize: 11, fontWeight: '900' },
  assetNameCompact: { fontSize: 8 },
  assetSymbol: { color: C.muted, fontSize: 8, marginTop: 3 },
  assetSymbolCompact: { fontSize: 6, marginTop: 1 },
  assetPrice: { color: '#fff', fontSize: 10, minWidth: 86, textAlign: 'right' },
  assetPriceCompact: { fontSize: 7.5, minWidth: 57 },
  changeCopy: { minWidth: 62, alignItems: 'flex-end', marginLeft: 9 },
  assetChange: { fontSize: 10, fontWeight: '900' },
  assetChangeCompact: { fontSize: 7.5 },
  snapshotText: { color: C.muted, fontSize: 5.5, marginTop: 2 },
  emptyText: { color: C.muted, fontSize: 9, lineHeight: 14, paddingVertical: 15 },
  freedomPanel: { minHeight: 120, marginTop: 17, padding: 16, flexDirection: 'row', alignItems: 'center' },
  freedomPanelCompact: { minHeight: 84, marginTop: 10, padding: 10 },
  freedomIntro: { flex: 1, minWidth: 230, flexDirection: 'row', alignItems: 'center' },
  freedomIntroCompact: { minWidth: 145 },
  freedomCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  freedomTitle: { color: '#fff', fontSize: 15, fontWeight: '900' },
  freedomTitleCompact: { fontSize: 10.5 },
  freedomText: { color: '#c8d2df', fontSize: 8.5, lineHeight: 13, marginTop: 4 },
  freedomTextCompact: { fontSize: 6.5, lineHeight: 9, marginTop: 2 },
  scoreRing: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', position: 'relative', marginHorizontal: 18 },
  scoreRingCompact: { width: 88, height: 88, marginHorizontal: 9 },
  scoreCenter: { position: 'absolute', alignItems: 'center' },
  scoreValue: { color: '#fff', fontSize: 30, fontWeight: '900' },
  scoreValueCompact: { fontSize: 22 },
  scoreOut: { color: '#fff', fontSize: 10, marginTop: 1 },
  scoreOutCompact: { fontSize: 7 },
  checklist: { flex: 1, minWidth: 230 },
  checklistCompact: { minWidth: 142 },
  checkItem: { minHeight: 33, flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkItemCompact: { minHeight: 22, gap: 5 },
  checkLabel: { flex: 1, color: '#fff', fontSize: 10 },
  checkLabelCompact: { fontSize: 7 },
  checkMark: { width: 21, height: 21, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  checkMarkCompact: { width: 15, height: 15, borderRadius: 8 },
  checkMarkText: { color: '#02140a', fontSize: 10, fontWeight: '900' },
});
