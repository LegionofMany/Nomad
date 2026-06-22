import React, { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

import { useAppState } from "../state/appState";
import type { Balance } from "../types";

type AssetChip = {
  symbol: string;
  label: string;
  amount: string;
  fiat: string;
  badge: string;
};

const FALLBACK_ASSETS: AssetChip[] = [
  { symbol: "₿", label: "BTC", amount: "0.3567", fiat: "$22,123.10", badge: "bitcoin" },
  { symbol: "H", label: "HBAR", amount: "3,250.00", fiat: "$1,250.25", badge: "hedera" },
  { symbol: "X", label: "XRP", amount: "1,250.00", fiat: "$750.00", badge: "xrp" },
  { symbol: "S", label: "XLM", amount: "5,200.00", fiat: "$310.40", badge: "stellar" },
];

const QUICK_ACTIONS = [
  { label: "Send", icon: "↑" },
  { label: "Receive", icon: "↓" },
  { label: "Swap", icon: "⇄" },
  { label: "Travel", icon: "▣" },
];

const SECURITY_ITEMS = [
  { label: "Secure Storage", status: "Secure", icon: "▣" },
  { label: "Owner Authority", status: "Active", icon: "✓" },
  { label: "Device Integrity", status: "Verified", icon: "▤" },
  { label: "Recovery Status", status: "Ready", icon: "↻" },
];

const ECOSYSTEM_ITEMS = [
  { label: "Nomad", icon: "ϟ", tone: "blue" },
  { label: "AutoDeFi", icon: "∞", tone: "blue" },
  { label: "BlockPages411", icon: "411", tone: "purple" },
  { label: "Sovereign\nPayroll", icon: "$", tone: "green" },
  { label: "Guardian\nTrader", icon: "♜", tone: "green" },
  { label: "Quantum\nLottery", icon: "◉", tone: "purple" },
  { label: "Decentralized\nRetirement", icon: "⚙", tone: "gold" },
];

const NAV_ITEMS = [
  { label: "Home", icon: "⌂", active: true },
  { label: "Wallets", icon: "▣", active: false },
  { label: "Travel", icon: "✈", active: false },
  { label: "Security", icon: "♢", active: false },
  { label: "Settings", icon: "⚙", active: false },
];

function usd(value: number): string {
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatAsset(item: Balance): AssetChip {
  const labels: Record<string, string> = {
    BTC: "₿",
    HBAR: "H",
    XRP: "X",
    XLM: "S",
  };

  return {
    symbol: labels[item.symbol] ?? item.symbol.slice(0, 1),
    label: item.symbol,
    amount: String(item.amount),
    fiat: usd(item.fiatApproxUSD),
    badge: item.symbol.toLowerCase(),
  };
}

export const PortfolioScreen = () => {
  const navigation = useNavigation<any>();
  const {
    walletStatus,
    portfolio,
    travelModeEnabled,
    preferredStablecoin,
    nfcEnabled,
    toggleNfc,
    lockWallet,
  } = useAppState();

  const assets = useMemo(() => {
    const balances = portfolio?.balances ?? [];
    if (!balances.length) return FALLBACK_ASSETS;

    return [...balances]
      .sort((a, b) => b.fiatApproxUSD - a.fiatApproxUSD)
      .slice(0, 4)
      .map(formatAsset);
  }, [portfolio?.balances]);

  const totalValue = useMemo(() => {
    const balances = portfolio?.balances ?? [];
    if (!balances.length) return "$24,832.45";
    return usd(balances.reduce((sum, item) => sum + item.fiatApproxUSD, 0));
  }, [portfolio?.balances]);

  return (
    <View style={styles.shell}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.statusRow}>
          <Text style={styles.clock}>9:41</Text>
          <Text style={styles.phoneStatus}>◢ ◥ ▮ 100%</Text>
        </View>

        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logoShield}>
              <Text style={styles.logoPulse}>⌁</Text>
            </View>
            <View>
              <Text style={styles.brand}>NOMAD</Text>
              <Text style={styles.subBrand}>Built on <Text style={styles.blueText}>Voltaire Protocols</Text></Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <Pressable style={styles.systemPill} onPress={toggleNfc} accessibilityRole="button" accessibilityLabel="Toggle NFC safety state">
              <Text style={styles.systemIcon}>♢</Text>
              <View>
                <Text style={styles.systemLabel}>All Systems</Text>
                <Text style={styles.systemSecure}>{nfcEnabled ? "NFC READY" : "SECURE"}</Text>
              </View>
            </Pressable>
            <View style={styles.bell}>
              <Text style={styles.bellText}>♧</Text>
              <View style={styles.dot} />
            </View>
          </View>
        </View>

        <View style={styles.portfolioCard}>
          <View style={styles.portfolioTop}>
            <View>
              <Text style={styles.cardEyebrow}>Total Portfolio Value  ◉</Text>
              <View style={styles.valueRow}>
                <Text style={styles.portfolioValue}>{totalValue}</Text>
                <Text style={styles.usdLabel}>USD</Text>
              </View>
              <Text style={styles.positive}>▲ 1.82% (24h)</Text>
            </View>
            <Text style={styles.sparkline}>▁▁▂▂▃▄▃▄▅▆▅▆▇█</Text>
          </View>

          <View style={styles.assetRow}>
            {assets.map((asset) => (
              <View key={asset.label} style={styles.assetItem}>
                <View style={[styles.assetBadge, styles[`asset_${asset.badge}` as keyof typeof styles] as object]}>
                  <Text style={styles.assetIcon}>{asset.symbol}</Text>
                </View>
                <Text style={styles.assetLabel}>{asset.label}</Text>
                <Text style={styles.assetAmount}>{asset.amount}</Text>
                <Text style={styles.assetFiat}>{asset.fiat}</Text>
              </View>
            ))}
            <View style={styles.assetItem}>
              <View style={styles.moreBadge}><Text style={styles.assetIcon}>•••</Text></View>
              <Text style={styles.assetLabel}>More</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.label}
              style={styles.quickCard}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              onPress={() => {
                if (action.label === "Travel") navigation.navigate("TravelMode");
              }}
            >
              <Text style={styles.quickIcon}>{action.icon}</Text>
              <Text style={styles.quickText}>{action.label}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.travelPocket} onPress={() => navigation.navigate("TravelMode")} accessibilityRole="button" accessibilityLabel="Manage Travel Pocket">
          <View style={styles.cardHeaderRow}>
            <View style={styles.titleWithIcon}>
              <Text style={styles.travelIcon}>✈</Text>
              <Text style={styles.travelTitle}>Travel Pocket</Text>
            </View>
            <View style={styles.activePill}><Text style={styles.activePillText}>{travelModeEnabled ? "ACTIVE" : "READY"}</Text></View>
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metricBlock}>
              <Text style={styles.metricLabel}>Balance</Text>
              <Text style={styles.metricValue}>0.021 <Text style={styles.metricUnit}>BTC</Text></Text>
              <Text style={styles.metricSub}>$1,312.21 USD</Text>
            </View>
            <View style={styles.metricBlock}>
              <Text style={styles.metricLabel}>Daily Limit</Text>
              <Text style={styles.metricValue}>0.050 <Text style={styles.metricUnit}>BTC</Text></Text>
              <View style={styles.progressRow}><View style={styles.progressTrack}><View style={[styles.progressFill, { width: "42%" }]} /></View><Text style={styles.percent}>42%</Text></View>
            </View>
            <View style={styles.metricBlock}>
              <Text style={styles.metricLabel}>Trip Limit</Text>
              <Text style={styles.metricValue}>0.500 <Text style={styles.metricUnit}>BTC</Text></Text>
              <View style={styles.progressRow}><View style={styles.progressTrack}><View style={[styles.progressFill, { width: "30%" }]} /></View><Text style={styles.percent}>30%</Text></View>
            </View>
            <View style={styles.metricBlockNoBorder}>
              <Text style={styles.metricLabel}>Expires</Text>
              <Text style={styles.expiry}>May 20, 2025</Text>
              <Text style={styles.metricSub}>{preferredStablecoin ?? "Stablecoin rail pending"}</Text>
            </View>
          </View>
          <View style={styles.manageRow}>
            <Text style={styles.manageText}>Manage Travel Pocket</Text>
            <Text style={styles.manageArrow}>›</Text>
          </View>
        </Pressable>

        <View style={styles.securityCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.titleWithIcon}>
              <Text style={styles.securityShield}>♢</Text>
              <Text style={styles.securityTitle}>Security Center</Text>
            </View>
            <View style={styles.securePill}><Text style={styles.securePillText}>SECURE</Text></View>
          </View>
          <View style={styles.securityGrid}>
            {SECURITY_ITEMS.map((item) => (
              <View key={item.label} style={styles.securityItem}>
                <Text style={styles.securityIcon}>{item.icon}</Text>
                <Text style={styles.securityLabel}>{item.label}</Text>
                <Text style={styles.securityStatus}>{item.status}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.ecosystemCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.titleWithIcon}>
              <Text style={styles.voltaireIcon}>♛</Text>
              <Text style={styles.ecosystemTitle}>Voltaire Ecosystem</Text>
            </View>
            <Text style={styles.explore}>Explore All  ›</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ecoRow}>
            {ECOSYSTEM_ITEMS.map((item) => (
              <View key={item.label} style={styles.ecoItem}>
                <View style={[styles.ecoBadge, styles[`eco_${item.tone}` as keyof typeof styles] as object]}>
                  <Text style={styles.ecoIcon}>{item.icon}</Text>
                </View>
                <Text style={styles.ecoLabel}>{item.label}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        {NAV_ITEMS.map((item) => (
          <Pressable
            key={item.label}
            style={[styles.navItem, item.active && styles.navActive]}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            onPress={() => {
              if (item.label === "Travel") navigation.navigate("TravelMode");
              if (item.label === "Security") lockWallet();
            }}
          >
            <Text style={[styles.navIcon, item.active && styles.navIconActive]}>{item.icon}</Text>
            <Text style={[styles.navLabel, item.active && styles.navLabelActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: "#020710",
  },
  content: {
    padding: 22,
    paddingBottom: 128,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 26,
  },
  clock: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
  },
  phoneStatus: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoShield: {
    width: 58,
    height: 66,
    borderWidth: 5,
    borderColor: "#168cff",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    shadowColor: "#168cff",
    shadowOpacity: 0.55,
    shadowRadius: 16,
  },
  logoPulse: {
    color: "#168cff",
    fontSize: 30,
    fontWeight: "900",
  },
  brand: {
    color: "#ffffff",
    fontSize: 31,
    fontWeight: "900",
    letterSpacing: 1,
  },
  subBrand: {
    color: "#ffffff",
    fontSize: 16,
    marginTop: 4,
  },
  blueText: {
    color: "#168cff",
    fontWeight: "700",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  systemPill: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "rgba(22, 140, 255, 0.35)",
    borderWidth: 1,
    backgroundColor: "rgba(9, 31, 51, 0.75)",
    borderRadius: 28,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
  },
  systemIcon: {
    color: "#25ff7a",
    fontSize: 26,
    marginRight: 10,
    fontWeight: "900",
  },
  systemLabel: {
    color: "#c9d3df",
    fontSize: 13,
  },
  systemSecure: {
    color: "#25ff7a",
    fontSize: 14,
    fontWeight: "900",
  },
  bell: {
    width: 42,
    height: 42,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(22, 140, 255, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  bellText: {
    color: "#cbd7e7",
    fontSize: 23,
  },
  dot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#168cff",
    top: 6,
    right: 6,
  },
  portfolioCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(22, 140, 255, 0.45)",
    backgroundColor: "rgba(3, 20, 36, 0.95)",
    padding: 24,
    marginBottom: 24,
    shadowColor: "#168cff",
    shadowOpacity: 0.22,
    shadowRadius: 24,
  },
  portfolioTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardEyebrow: {
    color: "#ffffff",
    fontSize: 18,
    marginBottom: 14,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  portfolioValue: {
    color: "#ffffff",
    fontSize: 47,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  usdLabel: {
    color: "#ffffff",
    fontSize: 19,
    marginLeft: 10,
    marginBottom: 10,
  },
  positive: {
    color: "#25ff7a",
    fontSize: 18,
    marginTop: 12,
    fontWeight: "700",
  },
  sparkline: {
    color: "#168cff",
    fontSize: 31,
    letterSpacing: -3,
    maxWidth: 240,
    textAlign: "right",
    textShadowColor: "#168cff",
    textShadowRadius: 16,
  },
  assetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
  },
  assetItem: {
    alignItems: "center",
    minWidth: 70,
  },
  assetBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  asset_btc: { backgroundColor: "#ff9700" },
  asset_bitcoin: { backgroundColor: "#ff9700" },
  asset_hbar: { backgroundColor: "#5c39ff" },
  asset_hedera: { backgroundColor: "#5c39ff" },
  asset_xrp: { backgroundColor: "#252525", borderWidth: 1, borderColor: "#707985" },
  asset_xlm: { backgroundColor: "#168cff" },
  asset_stellar: { backgroundColor: "#168cff" },
  moreBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(123, 174, 230, 0.55)",
    backgroundColor: "rgba(13, 31, 52, 0.9)",
  },
  assetIcon: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
  },
  assetLabel: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  assetAmount: {
    color: "#ffffff",
    fontSize: 15,
    marginTop: 7,
  },
  assetFiat: {
    color: "#b7c1cf",
    fontSize: 13,
    marginTop: 5,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 16,
  },
  quickGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  quickCard: {
    width: "23%",
    minHeight: 110,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(22, 140, 255, 0.45)",
    backgroundColor: "rgba(3, 20, 36, 0.86)",
    alignItems: "center",
    justifyContent: "center",
  },
  quickIcon: {
    color: "#168cff",
    fontSize: 48,
    fontWeight: "900",
    marginBottom: 6,
    textShadowColor: "#168cff",
    textShadowRadius: 14,
  },
  quickText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
  },
  travelPocket: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(37, 255, 122, 0.75)",
    backgroundColor: "rgba(0, 50, 34, 0.8)",
    padding: 22,
    marginBottom: 22,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  titleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
  },
  travelIcon: {
    color: "#25ff7a",
    fontSize: 29,
    marginRight: 12,
  },
  travelTitle: {
    color: "#25ff7a",
    fontSize: 21,
    fontWeight: "900",
  },
  activePill: {
    borderWidth: 1,
    borderColor: "rgba(37, 255, 122, 0.55)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: "rgba(37, 255, 122, 0.12)",
  },
  activePillText: {
    color: "#25ff7a",
    fontWeight: "900",
    fontSize: 14,
  },
  metricsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(37, 255, 122, 0.18)",
    paddingTop: 20,
  },
  metricBlock: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: "rgba(107, 208, 164, 0.28)",
    paddingRight: 14,
    marginRight: 14,
  },
  metricBlockNoBorder: {
    flex: 1,
  },
  metricLabel: {
    color: "#c8d4de",
    fontSize: 14,
    marginBottom: 8,
  },
  metricValue: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "900",
  },
  metricUnit: {
    fontSize: 16,
    fontWeight: "700",
  },
  metricSub: {
    color: "#c8d4de",
    fontSize: 14,
    marginTop: 8,
  },
  expiry: {
    color: "#ffffff",
    fontSize: 18,
    lineHeight: 25,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 13,
  },
  progressTrack: {
    flex: 1,
    height: 10,
    borderRadius: 7,
    backgroundColor: "rgba(186, 255, 220, 0.18)",
    marginRight: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 7,
    backgroundColor: "#25ff7a",
  },
  percent: {
    color: "#ffffff",
    fontSize: 13,
  },
  manageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 22,
  },
  manageText: {
    color: "#25ff7a",
    fontSize: 17,
    fontWeight: "800",
  },
  manageArrow: {
    color: "#25ff7a",
    fontSize: 34,
    fontWeight: "300",
  },
  securityCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(22, 140, 255, 0.4)",
    backgroundColor: "rgba(3, 20, 36, 0.9)",
    padding: 22,
    marginBottom: 22,
  },
  securityShield: {
    color: "#168cff",
    fontSize: 28,
    marginRight: 12,
  },
  securityTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
  },
  securePill: {
    borderWidth: 1,
    borderColor: "rgba(22, 140, 255, 0.55)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  securePillText: {
    color: "#168cff",
    fontSize: 14,
    fontWeight: "900",
  },
  securityGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 14,
  },
  securityItem: {
    flex: 1,
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "rgba(123, 174, 230, 0.24)",
  },
  securityIcon: {
    color: "#25ff7a",
    fontSize: 30,
    marginBottom: 10,
  },
  securityLabel: {
    color: "#ffffff",
    fontSize: 13,
    textAlign: "center",
  },
  securityStatus: {
    color: "#25ff7a",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 8,
  },
  ecosystemCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(22, 140, 255, 0.4)",
    backgroundColor: "rgba(3, 20, 36, 0.9)",
    padding: 22,
  },
  voltaireIcon: {
    color: "#8a55ff",
    fontSize: 29,
    marginRight: 12,
  },
  ecosystemTitle: {
    color: "#8a55ff",
    fontSize: 21,
    fontWeight: "900",
  },
  explore: {
    color: "#168cff",
    fontSize: 16,
    fontWeight: "800",
  },
  ecoRow: {
    paddingVertical: 4,
  },
  ecoItem: {
    alignItems: "center",
    width: 95,
    marginRight: 10,
  },
  ecoBadge: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    borderWidth: 1,
  },
  eco_blue: {
    borderColor: "#168cff",
    backgroundColor: "rgba(22, 140, 255, 0.22)",
  },
  eco_green: {
    borderColor: "#25ff7a",
    backgroundColor: "rgba(37, 255, 122, 0.22)",
  },
  eco_purple: {
    borderColor: "#8a55ff",
    backgroundColor: "rgba(138, 85, 255, 0.25)",
  },
  eco_gold: {
    borderColor: "#ffa313",
    backgroundColor: "rgba(255, 163, 19, 0.2)",
  },
  ecoIcon: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  ecoLabel: {
    color: "#ffffff",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 17,
  },
  bottomNav: {
    position: "absolute",
    left: 22,
    right: 22,
    bottom: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(22, 140, 255, 0.28)",
    backgroundColor: "rgba(3, 13, 25, 0.98)",
    flexDirection: "row",
    padding: 8,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    borderRadius: 14,
  },
  navActive: {
    backgroundColor: "rgba(22, 140, 255, 0.12)",
  },
  navIcon: {
    color: "#b8c2cf",
    fontSize: 27,
    marginBottom: 5,
  },
  navIconActive: {
    color: "#168cff",
  },
  navLabel: {
    color: "#b8c2cf",
    fontSize: 13,
  },
  navLabelActive: {
    color: "#168cff",
    fontWeight: "800",
  },
});

export default PortfolioScreen;
