import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icons } from '../../theme/images';
import { colors } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';

const metricTonesLight = {
  earned: {
    cardBg: '#effaf1',
    icon: '#2fbe5b',
    iconBg: '#d7f7df',
  },
  pending: {
    cardBg: '#fffbe9',
    icon: '#ff9f1a',
    iconBg: '#fff2c8',
  },
  settled: {
    cardBg: '#eef9ff',
    icon: '#279fda',
    iconBg: '#d7efff',
  },
};

const metricTonesDark = {
  earned: {
    cardBg: '#0e2316',
    icon: '#2fbe5b',
    iconBg: '#133520',
  },
  pending: {
    cardBg: '#261b05',
    icon: '#ff9f1a',
    iconBg: '#3a2908',
  },
  settled: {
    cardBg: '#0b202e',
    icon: '#279fda',
    iconBg: '#103045',
  },
};

function MetricCard({ icon, tone, title, value }) {
  const { darkMode, themeColors } = useTheme();
  const tones = darkMode ? metricTonesDark : metricTonesLight;
  const toneStyle = tones[tone];

  return (
    <View style={[styles.metricCard, { backgroundColor: toneStyle.cardBg, borderColor: darkMode ? '#2e2724' : 'transparent', borderWidth: darkMode ? 1 : 0 }]}>
      <View style={[styles.metricIconBox, { backgroundColor: toneStyle.iconBg }]}>
        <Image source={icon} style={[styles.metricIcon, { tintColor: toneStyle.icon }]} />
      </View>
      <Text style={[styles.metricValue, { color: themeColors.ink }]}>{value}</Text>
      <Text style={[styles.metricTitle, { color: themeColors.muted }]}>{title}</Text>
    </View>
  );
}

export function EarningsPanel({ onBack, role, topInset = 0, total = 0 }) {
  const { darkMode, themeColors } = useTheme();
  const earned = Number(total) || 0;
  const earnedText = `₹${earned}`;

  const heroBg = darkMode ? '#102416' : '#31b955';
  const cardBg = darkMode ? '#1e1c1b' : colors.white;
  const cardBorder = darkMode ? '#2e2724' : '#eadfd7';
  const pendingCardBg = darkMode ? '#221908' : '#fff9e8';
  const pendingCardBorder = darkMode ? '#3a2b10' : '#ffe3a3';

  return (
    <>
      <View style={[styles.hero, { backgroundColor: heroBg, paddingTop: Math.max(42, topInset + 10) }]}>
        <View style={styles.heroTop}>
          <Pressable onPress={onBack} style={styles.circleButton}>
            <Image source={Icons.Back} style={styles.headerIcon} />
          </Pressable>
          <Text style={styles.headerTitle}>Earnings</Text>
          <View style={styles.circleButton}>
            <Image source={Icons.Rupee} style={styles.headerIcon} />
          </View>
        </View>

        <Text style={styles.periodLabel}>Live Earnings</Text>
        <Text style={styles.heroAmount}>{earnedText}</Text>
        <Text style={styles.heroMeta}>{role ? `${role} earnings from synced orders` : 'Earnings from synced orders'}</Text>
      </View>

      <View style={styles.metricsRow}>
        <MetricCard icon={Icons.Clock} tone="pending" title="Pending Payout" value="₹0" />
        <MetricCard icon={Icons.Growth} tone="earned" title="Total Earned" value={earnedText} />
        <MetricCard icon={Icons.Success} tone="settled" title="Settled" value="₹0" />
      </View>

      <View style={[styles.pendingCard, { backgroundColor: pendingCardBg, borderColor: pendingCardBorder }]}>
        <View style={[styles.pendingIconBox, darkMode ? { backgroundColor: '#382808' } : null]}>
          <Image source={Icons.Rupee} style={styles.pendingIcon} />
        </View>
        <View style={styles.pendingCopy}>
          <Text style={[styles.pendingTitle, { color: themeColors.ink }]}>Pending Payout</Text>
          <Text style={[styles.pendingMeta, { color: themeColors.muted }]}>Payout data will appear after backend settlement is generated.</Text>
        </View>
        <Text style={styles.pendingAmount}>₹0</Text>
      </View>

      <View style={styles.sectionRow}>
        <Text style={[styles.sectionTitle, { color: themeColors.ink }]}>Payment History</Text>
      </View>

      <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <Text style={[styles.emptyTitle, { color: themeColors.ink }]}>No live payout history yet.</Text>
        <Text style={[styles.emptyCopy, { color: themeColors.muted }]}>Admin-generated payouts and payment records will show here once available.</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  circleButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  emptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 18,
    padding: 18,
  },
  emptyCopy: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: 5,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  headerIcon: {
    height: 19,
    tintColor: colors.white,
    width: 19,
  },
  headerTitle: {
    color: colors.white,
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    marginLeft: 12,
  },
  hero: {
    marginHorizontal: -14,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  heroAmount: {
    color: colors.white,
    fontSize: 39,
    fontWeight: '900',
    lineHeight: 45,
    marginTop: 3,
    textAlign: 'center',
  },
  heroMeta: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
    opacity: 0.9,
    textAlign: 'center',
  },
  heroTop: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  metricCard: {
    borderRadius: 14,
    flex: 1,
    minHeight: 122,
    padding: 12,
  },
  metricIcon: {
    height: 19,
    width: 19,
  },
  metricIconBox: {
    alignItems: 'center',
    borderRadius: 14,
    height: 41,
    justifyContent: 'center',
    marginBottom: 11,
    width: 41,
  },
  metricTitle: {
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
    marginTop: 2,
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '900',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    marginTop: 22,
  },
  pendingAmount: {
    color: '#ff9f1a',
    fontSize: 16,
    fontWeight: '900',
    marginLeft: 10,
  },
  pendingCard: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 20,
    padding: 15,
  },
  pendingCopy: {
    flex: 1,
    marginLeft: 12,
  },
  pendingIcon: {
    height: 19,
    tintColor: '#ff9f1a',
    width: 19,
  },
  pendingIconBox: {
    alignItems: 'center',
    backgroundColor: '#fff1c6',
    borderRadius: 19,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  pendingMeta: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    marginTop: 3,
  },
  pendingTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  periodLabel: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 24,
    opacity: 0.9,
    textAlign: 'center',
  },
  sectionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
});
