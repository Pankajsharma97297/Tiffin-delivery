import React from 'react';
import { Image, Text, View, StyleSheet } from 'react-native';
import { Icons } from '../../theme/images';
import { StatusPill } from './StatusPill';
import { colors } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';

export function OrderCard({ amount, children, meta, status, subtitle, tag, title }) {
  const { darkMode, themeColors } = useTheme();

  const cardBg = darkMode ? '#1e1c1b' : colors.white;
  const cardBorder = darkMode ? '#2e2724' : colors.line;
  const tagBg = darkMode ? '#2a1a10' : '#f5eee8';

  return (
    <View style={[styles.orderCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <View style={styles.rowBetween}>
        <Image source={Icons.Customer} style={styles.orderLeadingIcon} />
        <View style={styles.flexOne}>
          <Text style={[styles.cardTitle, { color: themeColors.ink }]}>{title}</Text>
          <Text style={[styles.cardMeta, { color: themeColors.muted }]}>{meta}</Text>
        </View>
        <StatusPill status={status} />
      </View>
      <Text style={[styles.cardCopy, { color: themeColors.muted }]}>{subtitle}</Text>
      <View style={styles.orderFooter}>
        <View style={styles.tagRow}>
          {tag ? <Text style={[styles.typeTag, { backgroundColor: tagBg, color: themeColors.muted }]}>{tag}</Text> : null}
          <Text style={[styles.amountTag, { color: themeColors.ink }]}>{amount}</Text>
        </View>
      </View>
      {children ? <View style={styles.orderActionRow}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  amountTag: {
    fontSize: 12,
    fontWeight: '900',
  },
  cardCopy: {
    fontSize: 11,
    fontWeight: '700',
    marginVertical: 8,
  },
  cardMeta: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  flexOne: {
    flex: 1,
  },
  orderActionRow: {
    marginTop: 12,
  },
  orderCard: {
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
    padding: 10,
    elevation: 2,
  },
  orderFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderLeadingIcon: {
    height: 20,
    marginRight: 8,
    tintColor: colors.orange,
    width: 20,
  },
  rowBetween: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  tagRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    flexWrap: 'wrap',
    gap: 8,
  },
  typeTag: {
    borderRadius: 6,
    fontSize: 10,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
});
