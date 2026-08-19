import React from 'react';
import { Image, Text, View, StyleSheet } from 'react-native';
import { Icons } from '../../theme/images';
import { StatusPill } from './StatusPill';
import { colors } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';

export function MiniOrder({ order }) {
  const { darkMode, themeColors } = useTheme();

  const shortName = order.customer
    .split(' ')
    .map((part, index) => (index === 0 ? part : `${part.charAt(0)}.`))
    .join(' ');

  const cardBg = darkMode ? '#1e1c1b' : colors.white;
  const cardBorder = darkMode ? '#2e2724' : '#eadfd7';
  const iconBg = darkMode ? '#2a1a10' : colors.orangeSoft;

  return (
    <View style={[styles.miniOrder, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <View style={[styles.orderIconBox, { backgroundColor: iconBg }]}>
        <Image source={Icons.PartnerBag} style={styles.orderLeadingIcon} />
      </View>
      <View style={styles.orderContent}>
        <Text style={[styles.cardTitle, { color: themeColors.ink }]}>#{order.id} · {shortName}</Text>
        <Text style={[styles.cardMeta, { color: themeColors.muted }]}>{order.meal}</Text>
        <Text style={[styles.cardMeta, { color: themeColors.muted }]}>{order.slot}</Text>
      </View>
      <StatusPill status={order.status} />
    </View>
  );
}

const styles = StyleSheet.create({
  cardMeta: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 4,
  },
  miniOrder: {
    alignItems: 'center',
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    minHeight: 88,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  orderContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  orderIconBox: {
    alignItems: 'center',
    borderRadius: 10,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  orderLeadingIcon: {
    height: 20,
    tintColor: colors.orange,
    width: 20,
  },
});
