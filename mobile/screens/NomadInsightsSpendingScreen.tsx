import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { useNomadInsights, useNomadSecurity } from '../nomad';
import type {
  NomadBudgetItem,
  NomadInsightStat,
  NomadInsightsPeriod,
  NomadInsightsSeriesPoint,
  NomadSpendingCategory,
  NomadSpendingTransaction,
} from '../nomad';
import { BottomNav, C, NomadPage, Panel, useNomadLayout } from '../ui/NomadShell';

type InsightTab = 'Overview' | 'Spending' | 'Savings' | 'Portfolio' | 'Trends';
type SpendingArtworkKind =
  | 'back'
  | 'insights'
  | 'shield'
  | 'help'
  | 'info'
  | 'calendar'
  | 'dining'
  | 'shopping'
  | 'transport'
  | 'travel'
  | 'other'
  | 'insight'
  | 'merchant'
  | 'budget';

const tabs: InsightTab[] = ['Overview', 'Spending', 'Savings', 'Portfolio', 'Trends'];
const periods: NomadInsightsPeriod[] = ['7D', '1M', '3M', '1Y'];
const periodLabels: Record<NomadInsightsPeriod, string> = {
  '7D': 'Last 7 Days',
  '1M': 'This Month',
  '3M': 'Last 3 Months',
  '1Y': 'This Year',
};
const categoryArtwork: Record<string, SpendingArtworkKind> = {
  'Food & Dining': 'dining',
  Shopping: 'shopping',
  Transport: 'transport',
  Travel: 'travel',
  Other: 'other',
};

function parseMoney(value?: string) {
  const parsed = Number((value ?? '').replace(/,/g, '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? Math.abs(parsed) : 0;
}

function parsePercent(value?: string) {
  const parsed = Number((value ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function formatBudgetValue(value: string) {
  const amount = parseMoney(value);
  return '$' + amount.toLocaleString('en-US', { maximumFractionDigits: amount % 1 ? 2 : 0 });
}

function SpendingArtwork({ kind, color = C.green, size = 40 }: { kind: SpendingArtworkKind; color?: string; size?: number }) {
  const stroke = {
    stroke: color,
    strokeWidth: 2.35,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  let artwork: React.ReactNode;

  switch (kind) {
    case 'back':
      artwork = <><Path d="M38 24H10M20 12 8 24l12 12" {...stroke} /></>;
      break;
    case 'insights':
      artwork = <><Circle cx="24" cy="24" r="20" {...stroke} /><Path d="M12 35V25M20 35V17M28 35V22M36 35V11M10 20l9-7 8 4 10-9" {...stroke} /><Path d="m32 8 5 0 0 5" {...stroke} /></>;
      break;
    case 'shield':
      artwork = <><Path d="M24 4 41 12v13c0 11-6 18-17 23C13 43 7 36 7 25V12Z" {...stroke} /><Path d="m15 25 6 6 12-14" {...stroke} /></>;
      break;
    case 'help':
      artwork = <><Circle cx="24" cy="24" r="19" {...stroke} /><Path d="M18 18c1-5 11-7 13-1 2 5-5 6-7 10v3M24 37h.1" {...stroke} /></>;
      break;
    case 'info':
      artwork = <><Circle cx="24" cy="24" r="17" {...stroke} /><Path d="M24 21v12M24 14h.1" {...stroke} /></>;
      break;
    case 'calendar':
      artwork = <><Rect x="8" y="11" width="32" height="29" rx="4" {...stroke} /><Path d="M8 20h32M16 6v10M32 6v10M15 27h4M23 27h4M31 27h3M15 34h4M23 34h4" {...stroke} /></>;
      break;
    case 'dining':
      artwork = <><Path d="M12 7v16M7 7v9c0 4 10 4 10 0V7M12 23v18M30 7c-7 7-7 17 0 20v14M30 7v20h8" {...stroke} /></>;
      break;
    case 'shopping':
      artwork = <><Path d="M10 17h28l-2 25H12Z" {...stroke} /><Path d="M17 17c0-9 14-9 14 0" {...stroke} /></>;
      break;
    case 'transport':
      artwork = <><Path d="m9 30 4-13h22l4 13v9H9ZM13 17l4-7h14l4 7M9 30h30M15 34h.1M33 34h.1M12 39v4M36 39v4" {...stroke} /></>;
      break;
    case 'travel':
      artwork = <><Path d="m6 22 36-14-12 34-6-13-13-1Z" {...stroke} /><Path d="m24 29 8-9" {...stroke} /></>;
      break;
    case 'other':
      artwork = <><Circle cx="24" cy="24" r="18" {...stroke} /><Circle cx="16" cy="24" r="1.6" fill={color} /><Circle cx="24" cy="24" r="1.6" fill={color} /><Circle cx="32" cy="24" r="1.6" fill={color} /></>;
      break;
    case 'insight':
      artwork = <><Path d="M24 4 40 12v12c0 10-6 18-16 23C14 42 8 34 8 24V12Z" {...stroke} /><Path d="m24 15 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" {...stroke} /></>;
      break;
    case 'budget':
      artwork = <><Circle cx="24" cy="24" r="19" {...stroke} /><Path d="M24 7v17l12 12" {...stroke} /></>;
      break;
    default:
      artwork = <><Circle cx="24" cy="24" r="18" {...stroke} /><Path d="M15 32c2-8 16-8 18 0M24 11a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z" {...stroke} /></>;
  }

  return <Svg accessibilityLabel={kind + ' spending icon'} width={size} height={size} viewBox="0 0 48 48" fill="none">{artwork}</Svg>;
}

function SystemStatusPill({ label, color, compact }: { label: string; color: string; compact: boolean }) {
  return (
    <View accessibilityLabel={'All Systems ' + label} style={[styles.systemPill, compact && styles.systemPillCompact, { borderColor: color + '55' }]}>
      <SpendingArtwork kind="shield" color={color} size={compact ? 27 : 35} />
      <View><Text style={[styles.systemTop, compact && styles.systemTopCompact]}>All Systems</Text><Text style={[styles.systemBottom, compact && styles.systemBottomCompact, { color }]}>{label}</Text></View>
    </View>
  );
}

function SpendingHeader({ compact, label, color }: { compact: boolean; label: string; color: string }) {
  const navigation = useNavigation<any>();
  return (
    <View style={[styles.header, compact && styles.headerCompact]}>
      <View style={styles.headerBrand}>
        <Pressable testID="spending-back" accessibilityRole="button" accessibilityLabel="Back to Nomad Insights overview" onPress={() => navigation.navigate('NomadInsights')} style={({ pressed }) => [styles.backButton, compact && styles.backButtonCompact, pressed && styles.pressed]}><SpendingArtwork kind="back" color="#fff" size={compact ? 28 : 35} /></Pressable>
        <View style={[styles.headerIcon, compact && styles.headerIconCompact]}><SpendingArtwork kind="insights" color={C.green} size={compact ? 35 : 47} /></View>
        <View style={styles.headerCopy}><Text numberOfLines={1} style={[styles.headerTitle, compact && styles.headerTitleCompact]}>Nomad Insights</Text><Text numberOfLines={1} style={[styles.headerSubtitle, compact && styles.headerSubtitleCompact]}>Your spending. Your savings. Your freedom.</Text></View>
      </View>
      <View style={[styles.headerActions, compact && styles.headerActionsCompact]}>
        <SystemStatusPill label={label} color={color} compact={compact} />
        <Pressable testID="spending-help" accessibilityRole="button" accessibilityLabel="Open Nomad Insights help" onPress={() => navigation.navigate('Settings')} style={({ pressed }) => [styles.helpButton, compact && styles.helpButtonCompact, pressed && styles.pressed]}><SpendingArtwork kind="help" color="#c8d4e6" size={compact ? 25 : 33} /></Pressable>
      </View>
    </View>
  );
}

function PeriodDropdown({ selected, open, loading, compact, onToggle, onSelect }: { selected: NomadInsightsPeriod; open: boolean; loading: boolean; compact: boolean; onToggle(): void; onSelect(period: NomadInsightsPeriod): void }) {
  return (
    <View style={styles.periodWrap}>
      <Pressable testID="spending-period-dropdown" accessibilityRole="button" accessibilityLabel={'Change spending period. ' + periodLabels[selected]} disabled={loading} onPress={onToggle} style={({ pressed }) => [styles.periodButton, compact && styles.periodButtonCompact, loading && styles.disabled, pressed && styles.pressed]}>
        <SpendingArtwork kind="calendar" color="#c6d2e4" size={compact ? 17 : 22} /><Text style={[styles.periodLabel, compact && styles.periodLabelCompact]}>{loading ? 'Updating…' : periodLabels[selected]}</Text><Text style={styles.periodChevron}>{open ? '⌃' : '⌄'}</Text>
      </Pressable>
      {open ? <View style={[styles.periodMenu, compact && styles.periodMenuCompact]}>{periods.map((item) => <Pressable key={item} testID={'spending-period-' + item.toLowerCase()} accessibilityRole="button" accessibilityLabel={'Show ' + periodLabels[item]} onPress={() => onSelect(item)} style={[styles.periodOption, item === selected && styles.periodOptionActive]}><Text style={[styles.periodOptionText, item === selected && styles.periodOptionTextActive]}>{periodLabels[item]}</Text></Pressable>)}</View> : null}
    </View>
  );
}

function SpendingBars({ points, compact }: { points: NomadInsightsSeriesPoint[]; compact: boolean }) {
  if (!points.length) return <View style={[styles.emptyChart, compact && styles.emptyChartCompact]}><Text style={styles.emptyText}>No timestamped spending activity is available.</Text></View>;
  const width = 520;
  const height = 160;
  const plotHeight = 128;
  const maximum = Math.max(...points.map((point) => point.value), 1);
  const slot = width / points.length;
  const barWidth = Math.max(4, Math.min(17, slot * .62));
  const labelIndices = new Set([0, Math.floor((points.length - 1) * .25), Math.floor((points.length - 1) * .5), Math.floor((points.length - 1) * .75), points.length - 1]);
  return (
    <View style={[styles.barChart, compact && styles.barChartCompact]}>
      <Svg accessibilityLabel="Timestamped spending bar chart" width="100%" height="100%" viewBox={'0 0 ' + width + ' ' + height} preserveAspectRatio="none">
        <Defs><LinearGradient id="spendingBar" x1="0" y1="0" x2="0" y2="1"><Stop stopColor="#59ff91" /><Stop offset="1" stopColor="#00a647" /></LinearGradient></Defs>
        <G stroke="rgba(32,239,112,.15)" strokeDasharray="4 6">{[10, 46, 82, 118].map((y) => <Path key={y} d={'M0 ' + y + 'H' + width} />)}</G>
        {points.map((point, index) => {
          const valueHeight = point.value > 0 ? Math.max(4, point.value / maximum * 118) : 1.5;
          const x = index * slot + (slot - barWidth) / 2;
          const y = plotHeight - valueHeight;
          return <Rect key={point.label + '-' + index} x={x} y={y} width={barWidth} height={valueHeight} rx={Math.min(3, barWidth / 3)} fill="url(#spendingBar)" opacity={point.value > 0 ? 1 : .22} />;
        })}
        {points.map((point, index) => labelIndices.has(index) ? <SvgText key={'label-' + index} x={index * slot + slot / 2} y="153" fill="#aebbd0" fontSize="10" textAnchor="middle">{point.label}</SvgText> : null)}
      </Svg>
    </View>
  );
}

function DonutChart({ categories, total, compact }: { categories: NomadSpendingCategory[]; total: string; compact: boolean }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const hasSpending = categories.some((category) => parsePercent(category.percent) > 0);
  return (
    <View style={[styles.donutWrap, compact && styles.donutWrapCompact]}>
      <Svg accessibilityLabel={'Spending distribution totaling ' + total} width={compact ? 132 : 190} height={compact ? 132 : 190} viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r={radius} fill="none" stroke="#263344" strokeWidth="15" />
        {hasSpending ? categories.map((category) => {
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

function CategoryRow({ item, selected, compact, onPress }: { item: NomadSpendingCategory; selected: boolean; compact: boolean; onPress(): void }) {
  const kind = categoryArtwork[item.label] ?? 'other';
  return (
    <Pressable testID={'spending-category-' + item.label.toLowerCase().replace(/[^a-z]+/g, '-')} accessibilityRole="button" accessibilityLabel={'Filter recent spending by ' + item.label} onPress={onPress} style={({ pressed }) => [styles.categoryRow, compact && styles.categoryRowCompact, selected && styles.categorySelected, pressed && styles.pressed]}>
      <SpendingArtwork kind={kind} color={item.color} size={compact ? 21 : 28} /><Text numberOfLines={1} style={[styles.categoryName, compact && styles.categoryNameCompact]}>{item.label}</Text><Text style={[styles.categoryPercent, compact && styles.categoryPercentCompact]}>{item.percent}</Text><Text style={[styles.categoryAmount, compact && styles.categoryAmountCompact]}>{item.amount}</Text><Text style={[styles.rowChevron, { color: item.color }]}>›</Text>
    </Pressable>
  );
}

function HeadroomGauge({ budgets, compact }: { budgets: NomadBudgetItem[]; compact: boolean }) {
  const total = budgets.reduce((sum, budget) => sum + parseMoney(budget.total), 0);
  const spent = budgets.reduce((sum, budget) => sum + parseMoney(budget.spent), 0);
  const available = total > 0 ? Math.max(0, 100 - spent / total * 100) : 0;
  return (
    <View accessibilityLabel={'Budget headroom ' + available.toFixed(0) + ' percent'} style={[styles.headroomGauge, compact && styles.headroomGaugeCompact]}>
      <View style={styles.headroomTrack}><View style={[styles.headroomFill, { width: `${available}%` as `${number}%` }]} /></View><Text style={styles.headroomCaption}>CURRENT ESTIMATE · {available.toFixed(0)}% AVAILABLE</Text>
    </View>
  );
}

function MerchantAvatar({ row, compact }: { row: NomadSpendingTransaction; compact: boolean }) {
  const kind = categoryArtwork[row.category] ?? 'merchant';
  return <View style={[styles.merchantAvatar, compact && styles.merchantAvatarCompact, { borderColor: row.color, backgroundColor: row.color + '16' }]}><SpendingArtwork kind={kind} color={row.color} size={compact ? 25 : 34} /></View>;
}

function RecentTransactionRow({ row, index, last, selected, compact, source, onPress }: { row: NomadSpendingTransaction; index: number; last: boolean; selected: boolean; compact: boolean; source: string; onPress(): void }) {
  return (
    <Pressable testID={'spending-transaction-' + index} accessibilityRole="button" accessibilityLabel={'Inspect ' + row.name + ' spending record'} onPress={onPress} style={({ pressed }) => [styles.transactionRow, compact && styles.transactionRowCompact, !last && styles.rowBorder, selected && styles.transactionSelected, pressed && styles.pressed]}>
      <MerchantAvatar row={row} compact={compact} />
      <View style={styles.transactionCopy}><Text numberOfLines={1} style={[styles.transactionName, compact && styles.transactionNameCompact]}>{row.name}</Text><Text numberOfLines={1} style={[styles.transactionMeta, compact && styles.transactionMetaCompact]}>{row.meta}</Text>{selected ? <Text style={styles.transactionDetail}>Recorded category: {row.category}. Evidence source: {source}.</Text> : null}</View>
      <View style={[styles.transactionCategory, compact && styles.transactionCategoryCompact]}><SpendingArtwork kind={categoryArtwork[row.category] ?? 'other'} color={row.color} size={compact ? 16 : 20} /><Text numberOfLines={1} style={[styles.transactionCategoryText, compact && styles.transactionCategoryTextCompact, { color: row.color }]}>{row.category}</Text></View>
      <View style={[styles.transactionAmount, compact && styles.transactionAmountCompact]}><Text style={[styles.transactionValue, compact && styles.transactionValueCompact]}>{row.amount}</Text><Text style={[styles.transactionUsd, compact && styles.transactionUsdCompact]}>{row.usd}</Text></View>
    </Pressable>
  );
}

function BudgetRing({ budget, compact }: { budget: NomadBudgetItem; compact: boolean }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.min(100, parsePercent(budget.percent));
  const progress = circumference * percent / 100;
  return (
    <View style={[styles.budgetRing, compact && styles.budgetRingCompact]}>
      <Svg width={compact ? 62 : 82} height={compact ? 62 : 82} viewBox="0 0 100 100"><Circle cx="50" cy="50" r={radius} fill="none" stroke={budget.color + '28'} strokeWidth="7" /><Circle cx="50" cy="50" r={radius} fill="none" stroke={budget.color} strokeWidth="7" strokeLinecap="round" strokeDasharray={progress + ' ' + (circumference - progress)} transform="rotate(-90 50 50)" /></Svg>
      <Text style={[styles.budgetPercent, compact && styles.budgetPercentCompact, { color: budget.color }]}>{budget.percent}</Text>
    </View>
  );
}

function BudgetSummary({ budget, compact }: { budget: NomadBudgetItem; compact: boolean }) {
  return (
    <View style={[styles.budgetSummary, compact && styles.budgetSummaryCompact]}>
      <View style={styles.budgetLabelRow}><SpendingArtwork kind={categoryArtwork[budget.label] ?? 'other'} color={budget.color} size={compact ? 19 : 24} /><Text numberOfLines={1} style={[styles.budgetLabel, compact && styles.budgetLabelCompact]}>{budget.label}</Text></View>
      <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.budgetSpent, compact && styles.budgetSpentCompact]}>{formatBudgetValue(budget.spent)} / {formatBudgetValue(budget.total)}</Text><BudgetRing budget={budget} compact={compact} />
    </View>
  );
}

function BudgetEditor({ budget, value, compact, onChange, onSave }: { budget: NomadBudgetItem; value: string; compact: boolean; onChange(value: string): void; onSave(): void }) {
  return (
    <View style={[styles.budgetEditor, compact && styles.budgetEditorCompact]}>
      <View style={styles.editorLabel}><SpendingArtwork kind={categoryArtwork[budget.label] ?? 'budget'} color={budget.color} size={compact ? 20 : 25} /><Text style={[styles.editorName, compact && styles.editorNameCompact]}>{budget.label}</Text></View>
      <TextInput accessibilityLabel={budget.label + ' monthly budget'} value={value} onChangeText={onChange} keyboardType="decimal-pad" placeholder="Monthly budget" placeholderTextColor={C.muted} style={[styles.budgetInput, compact && styles.budgetInputCompact]} />
      <Pressable accessibilityRole="button" accessibilityLabel={'Save ' + budget.label + ' budget'} onPress={onSave} style={({ pressed }) => [styles.saveButton, compact && styles.saveButtonCompact, pressed && styles.pressed]}><Text style={styles.saveButtonText}>Save</Text></Pressable>
    </View>
  );
}

function SavingsView({ budgets, topSavings, compact }: { budgets: NomadBudgetItem[]; topSavings: string; compact: boolean }) {
  return (
    <Panel tone="green" style={[styles.auxPanel, compact && styles.auxPanelCompact]}><Text style={[styles.auxEyebrow, compact && styles.auxEyebrowCompact]}>SAVINGS & BUDGET HEADROOM</Text><Text style={[styles.auxHero, compact && styles.auxHeroCompact]}>{topSavings}</Text><Text style={styles.auxNote}>Remaining room across the owner-defined category budgets. This is a planning estimate, not income or guaranteed savings.</Text><View style={[styles.budgetGrid, compact && styles.budgetGridCompact]}>{budgets.map((budget) => <BudgetSummary key={budget.label} budget={budget} compact={compact} />)}</View></Panel>
  );
}

function PortfolioView({ total, stats, compact }: { total: string; stats: NomadInsightStat[]; compact: boolean }) {
  return (
    <Panel style={[styles.auxPanel, compact && styles.auxPanelCompact]}><Text style={[styles.auxEyebrow, compact && styles.auxEyebrowCompact]}>PORTFOLIO SNAPSHOT</Text><Text style={[styles.auxHero, compact && styles.auxHeroCompact]}>{total}</Text><Text style={styles.auxWarning}>Current wallet and Travel Pocket values only. Historical performance requires a dated balance ledger and market-price provider.</Text><View style={[styles.statGrid, compact && styles.statGridCompact]}>{stats.map((stat) => <View key={stat.label} style={[styles.statCard, compact && styles.statCardCompact]}><Text style={[styles.statLabel, compact && styles.statLabelCompact]}>{stat.label === 'Non-Stable Assets' ? 'Investments' : stat.label}</Text><Text style={[styles.statValue, compact && styles.statValueCompact]}>{stat.value}</Text><Text style={[styles.statNote, { color: stat.color }]}>{stat.note}</Text></View>)}</View></Panel>
  );
}

function TrendsView({ points, total, compact }: { points: NomadInsightsSeriesPoint[]; total: string; compact: boolean }) {
  return (
    <Panel style={[styles.auxPanel, compact && styles.auxPanelCompact]}><Text style={[styles.auxEyebrow, compact && styles.auxEyebrowCompact]}>SPENDING TRENDS</Text><Text style={[styles.auxHero, compact && styles.auxHeroCompact]}>{total}</Text><Text style={styles.auxNote}>Timestamped Travel Pocket activity grouped by the selected period.</Text><View style={styles.auxChart}><SpendingBars points={points} compact={compact} /></View></Panel>
  );
}

export default function NomadInsightsSpendingScreen() {
  const navigation = useNavigation<any>();
  const { compact } = useNomadLayout();
  const { insights, period, loading, error, refresh, setPeriod, updateBudget } = useNomadInsights();
  const { security, loading: securityLoading } = useNomadSecurity();
  const [activeTab, setActiveTab] = useState<InsightTab>('Spending');
  const [periodOpen, setPeriodOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  const [manageBudgets, setManageBudgets] = useState(false);
  const [budgetDrafts, setBudgetDrafts] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState('');

  const frozen = security.status === 'frozen';
  const securityReview = security.status === 'warning';
  const systemLabel = securityLoading ? 'CHECKING' : frozen ? 'FROZEN' : securityReview ? 'REVIEW' : 'SECURE';
  const systemColor = securityLoading ? C.blue : frozen ? C.red : securityReview ? C.yellow : C.green;
  const source = insights.transactionFeedStatus === 'wallet_ledger' ? 'wallet ledger' : 'Travel Pocket preview activity';
  const filteredTransactions = selectedCategory ? insights.recentSpending.filter((row) => row.category === selectedCategory) : insights.recentSpending;

  const chooseTab = (tab: InsightTab) => {
    if (tab === 'Overview') {
      navigation.navigate('NomadInsights');
      return;
    }
    setActiveTab(tab);
    setPeriodOpen(false);
    setFeedback('');
  };

  const choosePeriod = (next: NomadInsightsPeriod) => {
    setPeriodOpen(false);
    void setPeriod(next);
  };

  const toggleBudgetManagement = () => {
    if (!manageBudgets) {
      setBudgetDrafts(Object.fromEntries(insights.budgets.map((budget) => [budget.label, parseMoney(budget.total).toFixed(2)])));
    }
    setManageBudgets((current) => !current);
    setFeedback('');
  };

  const saveBudget = async (label: string) => {
    try {
      setFeedback('Saving ' + label + ' budget…');
      const value = Number((budgetDrafts[label] ?? '').replace(/,/g, ''));
      await updateBudget(label, value);
      setFeedback(label + ' budget saved.');
    } catch (nextError) {
      setFeedback(nextError instanceof Error ? nextError.message : 'Unable to save the budget.');
    }
  };

  return (
    <NomadPage maxWidth={980}>
      <SpendingHeader compact={compact} label={systemLabel} color={systemColor} />

      <View style={[styles.tabs, compact && styles.tabsCompact]}>{tabs.map((tab) => <Pressable key={tab} testID={'spending-tab-' + tab.toLowerCase()} accessibilityRole="button" accessibilityLabel={'Open Nomad Insights ' + tab} onPress={() => chooseTab(tab)} style={[styles.tab, activeTab === tab && styles.tabActive]}><Text style={[styles.tabText, compact && styles.tabTextCompact, activeTab === tab && styles.tabTextActive]}>{tab}</Text></Pressable>)}</View>

      {error ? <View style={styles.errorBanner}><Text style={styles.errorText}>{error}</Text><Pressable accessibilityRole="button" accessibilityLabel="Retry spending insights" onPress={() => void refresh()} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></Pressable></View> : null}

      {activeTab === 'Spending' ? <>
        <Panel style={[styles.summaryPanel, compact && styles.summaryPanelCompact]}>
          <View style={[styles.sectionHeading, compact && styles.sectionHeadingCompact]}><View style={styles.titleWithInfo}><Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>SPENDING SUMMARY</Text><SpendingArtwork kind="info" color="#b9c4d6" size={compact ? 18 : 21} /></View><PeriodDropdown selected={period} open={periodOpen} loading={loading} compact={compact} onToggle={() => setPeriodOpen((current) => !current)} onSelect={choosePeriod} /></View>
          <View style={[styles.summaryBody, compact && styles.summaryBodyCompact]}>
            <View style={[styles.totalCopy, compact && styles.totalCopyCompact]}><Text style={[styles.totalLabel, compact && styles.totalLabelCompact]}>Total Spent ({periodLabels[period]})</Text><Text numberOfLines={1} adjustsFontSizeToFit style={[styles.totalValue, compact && styles.totalValueCompact]}>{insights.spendingTotal}</Text><Text style={[styles.totalDelta, compact && styles.totalDeltaCompact, { color: insights.spendingDelta.startsWith('-') ? C.green : C.yellow }]}>{insights.spendingDelta}</Text><Text style={[styles.sourceLabel, compact && styles.sourceLabelCompact]}>{source.toUpperCase()}</Text></View>
            <View style={styles.chartWrap}><SpendingBars points={insights.spendingSeries} compact={compact} /></View>
          </View>

          <View style={[styles.categoryPanel, compact && styles.categoryPanelCompact]}>
            <View style={styles.categoryTitleRow}><View style={styles.titleWithInfo}><Text style={[styles.categoryTitle, compact && styles.categoryTitleCompact]}>SPENDING BY CATEGORY</Text><SpendingArtwork kind="info" color="#b9c4d6" size={compact ? 17 : 20} /></View>{selectedCategory ? <Pressable accessibilityRole="button" accessibilityLabel="Clear spending category filter" onPress={() => setSelectedCategory(null)}><Text style={[styles.clearLink, compact && styles.clearLinkCompact]}>Clear filter</Text></Pressable> : null}</View>
            <View style={[styles.categoryBody, compact && styles.categoryBodyCompact]}><DonutChart categories={insights.spendingCategories} total={insights.spendingTotal} compact={compact} /><View style={styles.categoryList}>{insights.spendingCategories.map((item) => <CategoryRow key={item.label} item={item} selected={selectedCategory === item.label} compact={compact} onPress={() => setSelectedCategory((current) => current === item.label ? null : item.label)} />)}</View></View>
            <Pressable testID="spending-view-categories" accessibilityRole="button" accessibilityLabel="View all spending categories" onPress={() => setSelectedCategory(null)} style={({ pressed }) => [styles.viewCategories, compact && styles.viewCategoriesCompact, pressed && styles.pressed]}><Text style={[styles.viewCategoriesText, compact && styles.viewCategoriesTextCompact]}>View All Categories  ›</Text></Pressable>
          </View>
        </Panel>

        <Panel tone="green" style={[styles.insightPanel, compact && styles.insightPanelCompact]}>
          <View style={[styles.insightBadge, compact && styles.insightBadgeCompact]}><SpendingArtwork kind="insight" color={C.green} size={compact ? 34 : 46} /></View><View style={styles.insightCopy}><Text style={[styles.insightLabel, compact && styles.insightLabelCompact]}>TOP INSIGHT</Text><Text numberOfLines={2} style={[styles.insightText, compact && styles.insightTextCompact]}>{insights.topInsight}</Text></View><View style={[styles.savingsCopy, compact && styles.savingsCopyCompact]}><Text style={styles.savingsLabel}>Budget headroom</Text><Text style={[styles.savingsValue, compact && styles.savingsValueCompact]}>{insights.topSavings}</Text><Text style={styles.savingsNote}>Planning estimate</Text><HeadroomGauge budgets={insights.budgets} compact={compact} /></View>
        </Panel>

        <Panel style={[styles.recentPanel, compact && styles.recentPanelCompact]}>
          <View style={styles.sectionHeading}><View style={styles.titleWithInfo}><Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>RECENT SPENDING</Text><SpendingArtwork kind="info" color="#b9c4d6" size={compact ? 18 : 21} /></View><Pressable testID="spending-view-all" accessibilityRole="button" accessibilityLabel="View all Travel Pocket spending" onPress={() => navigation.navigate('TravelMode')}><Text style={[styles.link, compact && styles.linkCompact]}>View All  ›</Text></Pressable></View>
          {selectedCategory ? <Text style={styles.filterLabel}>FILTERED BY {selectedCategory.toUpperCase()}</Text> : null}
          <View style={styles.transactionList}>{filteredTransactions.length ? filteredTransactions.map((row, index) => { const key = row.name + '-' + index; return <RecentTransactionRow key={key} row={row} index={index} last={index === filteredTransactions.length - 1} selected={selectedTransaction === key} compact={compact} source={source} onPress={() => setSelectedTransaction((current) => current === key ? null : key)} />; }) : <Text style={styles.emptyText}>No recorded transactions match this period and category.</Text>}</View>
        </Panel>

        <Panel style={[styles.budgetPanel, compact && styles.budgetPanelCompact]}>
          <View style={styles.sectionHeading}><View style={styles.titleWithInfo}><Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>MONTHLY BUDGET TRACKER</Text><SpendingArtwork kind="info" color="#b9c4d6" size={compact ? 18 : 21} /></View><Pressable testID="spending-manage-budgets" accessibilityRole="button" accessibilityLabel={manageBudgets ? 'Close budget management' : 'Manage monthly budgets'} onPress={toggleBudgetManagement}><Text style={[styles.link, compact && styles.linkCompact]}>{manageBudgets ? 'Done' : 'Manage Budgets'}  ›</Text></Pressable></View>
          <View style={[styles.budgetGrid, compact && styles.budgetGridCompact]}>{insights.budgets.map((budget) => <BudgetSummary key={budget.label} budget={budget} compact={compact} />)}</View>
          {manageBudgets ? <View style={[styles.budgetEditors, compact && styles.budgetEditorsCompact]}>{insights.budgets.map((budget) => <BudgetEditor key={budget.label} budget={budget} value={budgetDrafts[budget.label] ?? parseMoney(budget.total).toFixed(2)} compact={compact} onChange={(value) => setBudgetDrafts((current) => ({ ...current, [budget.label]: value }))} onSave={() => void saveBudget(budget.label)} />)}</View> : null}
          {feedback ? <Text accessibilityRole="alert" style={[styles.feedback, feedback.toLowerCase().includes('unable') && { color: C.red }]}>{feedback}</Text> : null}
        </Panel>
      </> : null}

      {activeTab === 'Savings' ? <SavingsView budgets={insights.budgets} topSavings={insights.topSavings} compact={compact} /> : null}
      {activeTab === 'Portfolio' ? <PortfolioView total={insights.totalPortfolioValue} stats={insights.statCards} compact={compact} /> : null}
      {activeTab === 'Trends' ? <TrendsView points={insights.spendingSeries} total={insights.spendingTotal} compact={compact} /> : null}

      <BottomNav active="Insights" items={[
        ['⌂', 'Home', 'Portfolio'],
        ['▣', 'Wallets', 'Wallets'],
        ['✈', 'Travel', 'TravelMode'],
        ['◇', 'Security', 'SecurityCenter'],
        ['⌁', 'Insights', 'NomadInsightsSpending'],
      ]} />
    </NomadPage>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: .72 },
  disabled: { opacity: .5 },
  header: { minHeight: 82, marginBottom: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  headerCompact: { minHeight: 58, marginBottom: 7, gap: 7 },
  headerBrand: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
  backButton: { width: 36, height: 46, alignItems: 'center', justifyContent: 'center' },
  backButtonCompact: { width: 27, height: 35 },
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
  tabs: { minHeight: 55, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.borderSoft, flexDirection: 'row', marginBottom: 14 },
  tabsCompact: { minHeight: 38, marginBottom: 9 },
  tab: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent', paddingHorizontal: 2 },
  tabActive: { borderBottomColor: C.green },
  tabText: { color: '#e2e8f2', fontSize: 11 },
  tabTextCompact: { fontSize: 7.5 },
  tabTextActive: { color: C.green, fontWeight: '900' },
  errorBanner: { marginBottom: 10, borderWidth: 1, borderColor: C.red, borderRadius: 10, backgroundColor: 'rgba(255,77,102,.08)', padding: 10, flexDirection: 'row', alignItems: 'center' },
  errorText: { flex: 1, color: C.red, fontSize: 9 },
  retryButton: { borderWidth: 1, borderColor: C.red, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  retryText: { color: C.red, fontSize: 8, fontWeight: '900' },
  summaryPanel: { padding: 19, overflow: 'visible' },
  summaryPanelCompact: { padding: 11 },
  sectionHeading: { position: 'relative', zIndex: 30, minHeight: 31, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  sectionHeadingCompact: { minHeight: 23 },
  titleWithInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { color: '#fff', fontSize: 14, fontWeight: '900' },
  sectionTitleCompact: { fontSize: 9.5 },
  periodWrap: { position: 'relative', zIndex: 40 },
  periodButton: { minWidth: 150, minHeight: 42, borderWidth: 1, borderColor: '#41506a', borderRadius: 9, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  periodButtonCompact: { minWidth: 110, minHeight: 31, borderRadius: 7, paddingHorizontal: 8, gap: 5 },
  periodLabel: { flex: 1, color: '#fff', fontSize: 10 },
  periodLabelCompact: { fontSize: 7 },
  periodChevron: { color: '#c8d4e5', fontSize: 14 },
  periodMenu: { position: 'absolute', top: 46, right: 0, width: 165, borderWidth: 1, borderColor: C.border, borderRadius: 9, backgroundColor: '#04111f', padding: 4, zIndex: 50 },
  periodMenuCompact: { top: 34, width: 125 },
  periodOption: { minHeight: 34, borderRadius: 6, justifyContent: 'center', paddingHorizontal: 10 },
  periodOptionActive: { backgroundColor: 'rgba(32,239,112,.12)' },
  periodOptionText: { color: C.muted, fontSize: 9 },
  periodOptionTextActive: { color: C.green, fontWeight: '900' },
  summaryBody: { minHeight: 174, flexDirection: 'row', alignItems: 'center', gap: 17, marginTop: 9 },
  summaryBodyCompact: { minHeight: 119, gap: 8, marginTop: 5 },
  totalCopy: { width: 245, borderRightWidth: 1, borderRightColor: C.borderSoft, paddingRight: 14 },
  totalCopyCompact: { width: 120, paddingRight: 7 },
  totalLabel: { color: '#d4dce8', fontSize: 11 },
  totalLabelCompact: { fontSize: 7.5 },
  totalValue: { color: '#fff', fontSize: 38, fontWeight: '900', marginTop: 9 },
  totalValueCompact: { fontSize: 23, marginTop: 5 },
  totalDelta: { fontSize: 11, fontWeight: '900', marginTop: 7 },
  totalDeltaCompact: { fontSize: 7, marginTop: 4 },
  sourceLabel: { color: C.muted, fontSize: 7, fontWeight: '900', marginTop: 9 },
  sourceLabelCompact: { fontSize: 5, marginTop: 5 },
  chartWrap: { flex: 1, minWidth: 0 },
  barChart: { height: 160, width: '100%' },
  barChartCompact: { height: 112 },
  emptyChart: { height: 154, alignItems: 'center', justifyContent: 'center' },
  emptyChartCompact: { height: 105 },
  categoryPanel: { marginTop: 10, borderWidth: 1, borderColor: C.border, borderRadius: 11, backgroundColor: 'rgba(2,13,25,.78)', padding: 13 },
  categoryPanelCompact: { marginTop: 6, borderRadius: 8, padding: 8 },
  categoryTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  categoryTitle: { color: '#fff', fontSize: 12, fontWeight: '900' },
  categoryTitleCompact: { fontSize: 8.5 },
  clearLink: { color: C.green, fontSize: 8, fontWeight: '900' },
  clearLinkCompact: { fontSize: 6 },
  categoryBody: { minHeight: 215, flexDirection: 'row', alignItems: 'center', gap: 26, marginTop: 6 },
  categoryBodyCompact: { minHeight: 147, gap: 10, marginTop: 3 },
  donutWrap: { width: 205, height: 205, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  donutWrapCompact: { width: 138, height: 138 },
  donutCenter: { position: 'absolute', alignItems: 'center' },
  donutTotal: { maxWidth: 120, color: '#fff', fontSize: 16, fontWeight: '900' },
  donutTotalCompact: { maxWidth: 82, fontSize: 10.5 },
  donutLabel: { color: '#fff', fontSize: 9, marginTop: 4 },
  donutLabelCompact: { fontSize: 6.5, marginTop: 2 },
  categoryList: { flex: 1, minWidth: 0 },
  categoryRow: { minHeight: 40, borderBottomWidth: 1, borderBottomColor: C.borderSoft, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 5 },
  categoryRowCompact: { minHeight: 28, gap: 4, paddingHorizontal: 2 },
  categorySelected: { backgroundColor: 'rgba(32,239,112,.08)' },
  categoryName: { flex: 1, color: '#fff', fontSize: 10 },
  categoryNameCompact: { fontSize: 6.7 },
  categoryPercent: { color: '#fff', fontSize: 10, fontWeight: '900', width: 38, textAlign: 'right' },
  categoryPercentCompact: { fontSize: 7, width: 25 },
  categoryAmount: { color: '#d0d8e3', fontSize: 9, width: 70, textAlign: 'right' },
  categoryAmountCompact: { fontSize: 6.2, width: 43 },
  rowChevron: { fontSize: 21, marginLeft: 2 },
  viewCategories: { minHeight: 37, borderTopWidth: 1, borderTopColor: C.borderSoft, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  viewCategoriesCompact: { minHeight: 25 },
  viewCategoriesText: { color: C.green, fontSize: 10, fontWeight: '900' },
  viewCategoriesTextCompact: { fontSize: 7 },
  insightPanel: { minHeight: 104, marginTop: 14, padding: 14, flexDirection: 'row', alignItems: 'center' },
  insightPanelCompact: { minHeight: 72, marginTop: 9, padding: 8 },
  insightBadge: { width: 65, height: 65, borderRadius: 33, borderWidth: 1, borderColor: C.green, backgroundColor: 'rgba(32,239,112,.1)', alignItems: 'center', justifyContent: 'center' },
  insightBadgeCompact: { width: 45, height: 45, borderRadius: 23 },
  insightCopy: { flex: 1, minWidth: 0, marginLeft: 13 },
  insightLabel: { color: C.green, fontSize: 10, fontWeight: '900' },
  insightLabelCompact: { fontSize: 7 },
  insightText: { color: '#fff', fontSize: 12, lineHeight: 18, marginTop: 4 },
  insightTextCompact: { fontSize: 8, lineHeight: 11, marginTop: 2 },
  savingsCopy: { width: 250, borderLeftWidth: 1, borderLeftColor: C.borderSoft, paddingLeft: 17, marginLeft: 14 },
  savingsCopyCompact: { width: 143, paddingLeft: 9, marginLeft: 8 },
  savingsLabel: { color: '#c6d0dd', fontSize: 8 },
  savingsValue: { color: C.green, fontSize: 19, fontWeight: '900', marginTop: 3 },
  savingsValueCompact: { fontSize: 12.5 },
  savingsNote: { color: '#fff', fontSize: 7.5, marginTop: 2 },
  headroomGauge: { marginTop: 6 },
  headroomGaugeCompact: { marginTop: 3 },
  headroomTrack: { height: 5, borderRadius: 3, backgroundColor: 'rgba(32,239,112,.16)', overflow: 'hidden' },
  headroomFill: { height: '100%', borderRadius: 3, backgroundColor: C.green },
  headroomCaption: { color: C.muted, fontSize: 5.5, marginTop: 3 },
  recentPanel: { marginTop: 14, paddingHorizontal: 17, paddingTop: 15 },
  recentPanelCompact: { marginTop: 9, paddingHorizontal: 9, paddingTop: 8 },
  link: { color: C.green, fontSize: 10, fontWeight: '900' },
  linkCompact: { fontSize: 7 },
  filterLabel: { color: C.green, fontSize: 6.5, fontWeight: '900', marginTop: 4 },
  transactionList: { marginTop: 5 },
  transactionRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  transactionRowCompact: { minHeight: 48, paddingVertical: 5 },
  transactionSelected: { backgroundColor: 'rgba(22,132,255,.07)' },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  merchantAvatar: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  merchantAvatarCompact: { width: 32, height: 32, borderRadius: 16 },
  transactionCopy: { flex: 1, minWidth: 0, marginLeft: 10 },
  transactionName: { color: '#fff', fontSize: 11, fontWeight: '800' },
  transactionNameCompact: { fontSize: 7.7 },
  transactionMeta: { color: C.muted, fontSize: 8, marginTop: 3 },
  transactionMetaCompact: { fontSize: 5.5, marginTop: 2 },
  transactionDetail: { color: '#c9d7e8', fontSize: 7, lineHeight: 10, marginTop: 4 },
  transactionCategory: { width: 132, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 5 },
  transactionCategoryCompact: { width: 82, gap: 3 },
  transactionCategoryText: { fontSize: 8.5 },
  transactionCategoryTextCompact: { fontSize: 5.8 },
  transactionAmount: { width: 110, alignItems: 'flex-end', marginLeft: 9 },
  transactionAmountCompact: { width: 70, marginLeft: 5 },
  transactionValue: { color: '#fff', fontSize: 13, fontWeight: '800' },
  transactionValueCompact: { fontSize: 8.8 },
  transactionUsd: { color: C.muted, fontSize: 8, marginTop: 3 },
  transactionUsdCompact: { fontSize: 5.5, marginTop: 1 },
  emptyText: { color: C.muted, fontSize: 9, textAlign: 'center', paddingVertical: 24 },
  budgetPanel: { marginTop: 14, padding: 17 },
  budgetPanelCompact: { marginTop: 9, padding: 9 },
  budgetGrid: { flexDirection: 'row', gap: 8, marginTop: 12 },
  budgetGridCompact: { gap: 4, marginTop: 7 },
  budgetSummary: { flex: 1, minWidth: 0, alignItems: 'center' },
  budgetSummaryCompact: { minWidth: 0 },
  budgetLabelRow: { minHeight: 26, flexDirection: 'row', alignItems: 'center', gap: 5 },
  budgetLabel: { color: '#fff', fontSize: 9, fontWeight: '800' },
  budgetLabelCompact: { fontSize: 6.2 },
  budgetSpent: { color: '#d0d8e3', fontSize: 8, marginTop: 5 },
  budgetSpentCompact: { fontSize: 5.3, marginTop: 3 },
  budgetRing: { width: 82, height: 82, alignItems: 'center', justifyContent: 'center', position: 'relative', marginTop: 6 },
  budgetRingCompact: { width: 62, height: 62, marginTop: 3 },
  budgetPercent: { position: 'absolute', fontSize: 15, fontWeight: '900' },
  budgetPercentCompact: { fontSize: 10 },
  budgetEditors: { marginTop: 14, borderTopWidth: 1, borderTopColor: C.borderSoft, paddingTop: 9 },
  budgetEditorsCompact: { marginTop: 8, paddingTop: 5 },
  budgetEditor: { minHeight: 47, borderBottomWidth: 1, borderBottomColor: C.borderSoft, flexDirection: 'row', alignItems: 'center', gap: 9 },
  budgetEditorCompact: { minHeight: 34, gap: 5 },
  editorLabel: { flex: 1, minWidth: 130, flexDirection: 'row', alignItems: 'center', gap: 7 },
  editorName: { color: '#fff', fontSize: 9 },
  editorNameCompact: { fontSize: 6.5 },
  budgetInput: { width: 180, minHeight: 34, borderWidth: 1, borderColor: C.border, borderRadius: 7, color: '#fff', paddingHorizontal: 9, fontSize: 9 },
  budgetInputCompact: { width: 105, minHeight: 27, fontSize: 7, paddingHorizontal: 6 },
  saveButton: { width: 64, minHeight: 34, borderRadius: 7, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  saveButtonCompact: { width: 44, minHeight: 27 },
  saveButtonText: { color: '#00140b', fontSize: 8, fontWeight: '900' },
  feedback: { color: C.green, fontSize: 8, marginTop: 9 },
  auxPanel: { padding: 20 },
  auxPanelCompact: { padding: 11 },
  auxEyebrow: { color: C.green, fontSize: 13, fontWeight: '900' },
  auxEyebrowCompact: { fontSize: 9 },
  auxHero: { color: '#fff', fontSize: 39, fontWeight: '900', marginTop: 14 },
  auxHeroCompact: { fontSize: 25, marginTop: 8 },
  auxNote: { color: C.muted, fontSize: 9, lineHeight: 15, marginTop: 6 },
  auxWarning: { color: C.yellow, fontSize: 9, lineHeight: 15, marginTop: 6 },
  auxChart: { marginTop: 17 },
  statGrid: { flexDirection: 'row', gap: 9, marginTop: 17 },
  statGridCompact: { gap: 5, marginTop: 9 },
  statCard: { flex: 1, minWidth: 0, minHeight: 103, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 11 },
  statCardCompact: { minHeight: 70, padding: 6 },
  statLabel: { color: C.muted, fontSize: 8 },
  statLabelCompact: { fontSize: 5.7 },
  statValue: { color: '#fff', fontSize: 17, fontWeight: '900', marginTop: 10 },
  statValueCompact: { fontSize: 11.5, marginTop: 6 },
  statNote: { fontSize: 8, fontWeight: '900', marginTop: 6 },
});
