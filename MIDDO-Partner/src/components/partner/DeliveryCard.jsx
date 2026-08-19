import React from 'react';
import { Image, Pressable, Text, View, StyleSheet } from 'react-native';
import { Icons } from '../../theme/images';
import { colors } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';

const deliveryBlue = '#22a6e8';
const deliveryOrange = '#ff6b1a';

function statusTone(status, darkMode) {
  if (status === 'Delivered') {
    return { bg: darkMode ? '#0e2a18' : '#dcfce7', color: '#22c55e' };
  }
  if (status === 'Assigned') {
    return { bg: darkMode ? '#0e243a' : '#dcebff', color: '#38bdf8' };
  }
  if (status === 'Picked Up') {
    return { bg: darkMode ? '#2a1a10' : '#fff0e8', color: '#ff6418' };
  }
  return { bg: darkMode ? '#2a2008' : '#fff3cc', color: '#f59e0b' };
}

export function DeliveryCard({ delivery, nextStatus, onAdvanceStatus, onCall, onMaps }) {
  const { darkMode, themeColors } = useTheme();
  const tone = statusTone(delivery.status, darkMode);
  const showActions = delivery.status !== 'Delivered';
  const initial = (delivery.customer || 'C').trim().charAt(0).toUpperCase();

  const cardBg = darkMode ? '#1e1c1b' : colors.white;
  const cardBorder = darkMode ? '#2e2724' : '#eadfd7';
  const buttonBg = darkMode ? '#282524' : colors.white;
  const buttonBorder = darkMode ? '#3a3532' : '#eadfd7';

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <View style={[styles.batchPill, darkMode ? { backgroundColor: '#0e243a' } : null]}>
        <Text style={[styles.batchText, darkMode ? { color: '#38bdf8' } : null]}>Batch {delivery.batch}</Text>
      </View>

      <View style={styles.headerRow}>
        <View style={[styles.avatar, darkMode ? { backgroundColor: '#0e243a' } : null]}>
          <Text style={[styles.avatarInitial, darkMode ? { color: '#38bdf8' } : null]}>{initial}</Text>
        </View>
        <View style={styles.customerCopy}>
          <Text style={[styles.customerName, { color: themeColors.ink }]}>{delivery.customer}</Text>
          <Text style={[styles.metaText, { color: themeColors.muted }]}>#{delivery.id} · {delivery.slot}</Text>
          <Text style={[styles.metaText, { color: themeColors.muted }]}>{delivery.meal}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: tone.bg }]}>
          <Text style={[styles.statusText, { color: tone.color }]}>{delivery.status}</Text>
        </View>
      </View>

      <View style={styles.detailRow}>
        <View style={styles.detailItem}>
          <Image source={Icons.Location} style={styles.detailIconBlue} />
          <Text style={[styles.detailText, { color: themeColors.muted }]}>{delivery.distance}</Text>
        </View>
        <View style={styles.detailItem}>
          <Image source={Icons.ChefCap} style={styles.detailIconOrange} />
          <Text style={[styles.detailText, { color: themeColors.muted }]}>{delivery.pickup}</Text>
        </View>
        <Text style={styles.amount}>₹{delivery.amount}</Text>
      </View>

      {showActions ? (
        <View style={styles.actionRow}>
          <Pressable onPress={() => onCall(delivery)} style={[styles.callButton, { backgroundColor: buttonBg, borderColor: buttonBorder }]}>
            <Image source={Icons.Phone} style={[styles.callIcon, { tintColor: themeColors.ink }]} />
            <Text style={[styles.callText, { color: themeColors.ink }]}>Call</Text>
          </Pressable>
          <Pressable onPress={() => onMaps(delivery)} style={styles.navigateButton}>
            <Image source={Icons.Location} style={styles.navigateIcon} />
            <Text style={styles.navigateText}>Navigate</Text>
          </Pressable>
          {nextStatus ? (
            <Pressable onPress={() => onAdvanceStatus(delivery.id)} style={styles.nextButton}>
              <Text style={styles.nextText}>→ {nextStatus.replace('Out for Delivery', 'Out').replace('Picked Up', 'Picked')}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  amount: {
    color: '#22c55e',
    fontSize: 13,
    fontWeight: '900',
    marginLeft: 'auto',
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#eef9ff',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: 12,
    width: 40,
  },
  avatarInitial: {
    color: '#1167ff',
    fontSize: 15,
    fontWeight: '900',
  },
  batchPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#dcebff',
    borderRadius: 999,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  batchText: {
    color: '#1167ff',
    fontSize: 12,
    fontWeight: '900',
  },
  callButton: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    height: 36,
    justifyContent: 'center',
  },
  callIcon: {
    height: 14,
    marginRight: 7,
    width: 14,
  },
  callText: {
    fontSize: 13,
    fontWeight: '900',
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
    padding: 16,
  },
  customerCopy: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '900',
  },
  detailIconBlue: {
    height: 13,
    marginRight: 5,
    tintColor: '#1167ff',
    width: 13,
  },
  detailIconOrange: {
    height: 13,
    marginRight: 5,
    tintColor: deliveryOrange,
    width: 13,
  },
  detailItem: {
    alignItems: 'center',
    flexDirection: 'row',
    marginRight: 16,
  },
  detailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 12,
  },
  detailText: {
    fontSize: 12,
    fontWeight: '800',
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  metaText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  navigateButton: {
    alignItems: 'center',
    backgroundColor: deliveryBlue,
    borderRadius: 10,
    flex: 1.18,
    flexDirection: 'row',
    height: 36,
    justifyContent: 'center',
  },
  navigateIcon: {
    height: 14,
    marginRight: 7,
    tintColor: colors.white,
    width: 14,
  },
  navigateText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '900',
  },
  nextButton: {
    alignItems: 'center',
    backgroundColor: deliveryOrange,
    borderRadius: 10,
    flex: 1.05,
    height: 36,
    justifyContent: 'center',
  },
  nextText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '900',
  },
  statusPill: {
    borderRadius: 999,
    marginLeft: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '900',
  },
});
