import React from 'react';
import { Image, Pressable, Text, View, StyleSheet } from 'react-native';
import { Icons } from '../../theme/images';
import { colors } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';

const deliveryBlue = '#279fda';
const deliveryBlueDark = '#1479b8';

function DeliveryStat({ bg, darkBg, icon, iconBg, iconColor, label, value }) {
  const { darkMode, themeColors } = useTheme();

  return (
    <View style={[
      styles.statCard,
      {
        backgroundColor: darkMode ? darkBg : bg,
        borderColor: darkMode ? '#2e2724' : '#d8edf9',
      },
    ]}>
      <View style={[styles.statIconBox, { backgroundColor: iconBg }]}>
        <Image source={icon} style={[styles.statIcon, { tintColor: iconColor }]} />
      </View>
      <Text style={[styles.statValue, { color: themeColors.ink }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: themeColors.muted }]}>{label}</Text>
    </View>
  );
}

function DeliveryButton({ active, icon, label, onPress }) {
  const { darkMode, themeColors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.deliveryButton,
        {
          backgroundColor: active ? deliveryBlue : (darkMode ? '#1e1c1b' : colors.white),
          borderColor: active ? deliveryBlue : (darkMode ? '#2e2724' : '#d8edf9'),
        },
      ]}
    >
      <Image
        source={icon}
        style={[
          styles.deliveryButtonIcon,
          { tintColor: active ? colors.white : themeColors.ink },
        ]}
      />
      <Text style={[
        styles.deliveryButtonText,
        { color: active ? colors.white : themeColors.ink },
      ]}>
        {label}
      </Text>
    </Pressable>
  );
}

function PendingDeliveryCard({ delivery, onCall, onMaps }) {
  const { darkMode, themeColors } = useTheme();
  const shortSlot = delivery.slot.split(' ')[0];
  const initial = (delivery.customer || 'C').trim().charAt(0).toUpperCase();

  const cardBg = darkMode ? '#1e1c1b' : colors.white;
  const cardBorder = darkMode ? '#2e2724' : '#d8edf9';
  const buttonBg = darkMode ? '#282524' : colors.white;
  const buttonBorder = darkMode ? '#3a3532' : '#d8edf9';

  return (
    <View style={[styles.pendingCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <View style={styles.pendingTopRow}>
        <View style={[styles.customerAvatar, darkMode ? { backgroundColor: '#102838' } : null]}>
          <Text style={styles.customerAvatarText}>{initial}</Text>
        </View>
        <View style={styles.pendingCopy}>
          <Text style={[styles.customerName, { color: themeColors.ink }]}>{delivery.customer}</Text>
          <Text style={[styles.deliveryMeta, { color: themeColors.muted }]}>#{delivery.id} · {shortSlot}</Text>
          <Text style={[styles.deliveryMeal, { color: themeColors.muted }]}>{delivery.meal.replace(' + Roti', '')}</Text>
        </View>
        <View style={[styles.pendingPill, darkMode ? { backgroundColor: '#2a1f05' } : null]}>
          <Text style={styles.pendingPillText}>{delivery.status}</Text>
        </View>
      </View>

      <View style={styles.detailRow}>
        <View style={styles.detailItem}>
          <Image source={Icons.Location} style={styles.detailIconBlue} />
          <Text style={[styles.detailText, { color: themeColors.muted }]}>{delivery.distance}</Text>
        </View>
        <View style={styles.detailItem}>
          <Image source={Icons.Package} style={styles.detailIconBlue} />
          <Text style={[styles.detailText, { color: themeColors.muted }]}>{delivery.pickup}</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <Pressable onPress={() => onCall(delivery)} style={[styles.callButton, { backgroundColor: buttonBg, borderColor: buttonBorder }]}>
          <Image source={Icons.Phone} style={[styles.callIcon, { tintColor: themeColors.ink }]} />
          <Text style={[styles.callText, { color: themeColors.ink }]}>Call</Text>
        </Pressable>
        <Pressable onPress={() => onMaps(delivery)} style={styles.navigateButton}>
          <Image source={Icons.Location} style={styles.navigateIcon} />
          <Text style={styles.navigateText}>Navigate</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function RiderDashboard({
  completedDeliveries,
  deliveries,
  earnings,
  onCall,
  onMaps,
  pendingDeliveries,
  setActiveTab,
}) {
  const { darkMode, themeColors } = useTheme();

  return (
    <>
      <View style={styles.statsGrid}>
        <DeliveryStat
          bg="#eef9ff"
          darkBg="#0b202e"
          icon={Icons.DeliveryTruck}
          iconBg={darkMode ? '#103045' : '#dcf3ff'}
          iconColor={deliveryBlue}
          label="Today's Deliveries"
          value={String(deliveries.length)}
        />
        <DeliveryStat
          bg="#fffbea"
          darkBg="#261b05"
          icon={Icons.Clock}
          iconBg={darkMode ? '#3a2908' : '#fff2d6'}
          iconColor="#f59e0b"
          label="Pending"
          value={String(pendingDeliveries)}
        />
        <DeliveryStat
          bg="#eefdF5"
          darkBg="#0e2316"
          icon={Icons.Success}
          iconBg={darkMode ? '#133520' : '#dff8ea'}
          iconColor="#22c55e"
          label="Completed"
          value={String(completedDeliveries)}
        />
        <DeliveryStat
          bg="#f4f2ff"
          darkBg="#1c162e"
          icon={Icons.Rupee}
          iconBg={darkMode ? '#2a1f45' : '#e7e1ff'}
          iconColor="#a78bfa"
          label="Today's Earnings"
          value={'₹' + earnings}
        />
      </View>

      <View style={styles.buttonRow}>
        <DeliveryButton active icon={Icons.DeliveryTruck} label="View Deliveries" onPress={() => setActiveTab('deliveries')} />
        <DeliveryButton icon={Icons.Growth} label="My Earnings" onPress={() => setActiveTab('earnings')} />
      </View>

      <View style={styles.sectionRow}>
        <Text style={[styles.sectionTitle, { color: themeColors.ink }]}>Pending Deliveries</Text>
        {deliveries.length > 0 ? (
          <Pressable onPress={() => setActiveTab('deliveries')}>
            <Text style={styles.viewAll}>View All</Text>
          </Pressable>
        ) : null}
      </View>

      {deliveries.length > 0 ? deliveries.slice(0, 3).map(delivery => (
        <PendingDeliveryCard key={delivery.id} delivery={delivery} onCall={onCall} onMaps={onMaps} />
      )) : (
        <View style={[styles.emptyCard, { backgroundColor: darkMode ? '#1e1c1b' : colors.white, borderColor: darkMode ? '#2e2724' : '#d8edf9' }]}>
          <Text style={[styles.emptyTitle, { color: themeColors.ink }]}>No live deliveries assigned yet.</Text>
          <Text style={[styles.emptyCopy, { color: themeColors.muted }]}>Assigned deliveries will appear here after admin assigns them.</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 23,
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
    height: 15,
    marginRight: 7,
    width: 15,
  },
  callText: {
    fontSize: 13,
    fontWeight: '900',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 13,
  },
  customerAvatar: {
    alignItems: 'center',
    backgroundColor: '#eef9ff',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: 12,
    width: 40,
  },
  customerAvatarText: {
    color: deliveryBlueDark,
    fontSize: 15,
    fontWeight: '900',
  },
  customerName: {
    fontSize: 14,
    fontWeight: '900',
  },
  deliveryButton: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    height: 49,
    justifyContent: 'center',
  },
  deliveryButtonIcon: {
    height: 16,
    marginRight: 8,
    width: 16,
  },
  deliveryButtonText: {
    fontSize: 14,
    fontWeight: '900',
  },
  deliveryMeal: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  deliveryMeta: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  detailIconBlue: {
    height: 13,
    marginRight: 5,
    tintColor: deliveryBlue,
    width: 13,
  },
  detailItem: {
    alignItems: 'center',
    flexDirection: 'row',
    marginRight: 14,
  },
  detailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: 52,
    marginTop: 11,
    rowGap: 6,
  },
  detailText: {
    fontSize: 12,
    fontWeight: '800',
  },
  emptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
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
  navigateButton: {
    alignItems: 'center',
    backgroundColor: deliveryBlue,
    borderRadius: 10,
    flex: 1,
    flexDirection: 'row',
    height: 36,
    justifyContent: 'center',
  },
  navigateIcon: {
    height: 15,
    marginRight: 7,
    tintColor: colors.white,
    width: 15,
  },
  navigateText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '900',
  },
  pendingCard: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    padding: 14,
  },
  pendingCopy: {
    flex: 1,
  },
  pendingPill: {
    backgroundColor: '#fff2d6',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  pendingPillText: {
    color: '#a65f00',
    fontSize: 10,
    fontWeight: '900',
  },
  pendingTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
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
  statCard: {
    borderRadius: 14,
    borderWidth: 1,
    flexBasis: '48%',
    minHeight: 118,
    padding: 12,
  },
  statIcon: {
    height: 19,
    width: 19,
  },
  statIconBox: {
    alignItems: 'center',
    borderRadius: 10,
    height: 35,
    justifyContent: 'center',
    marginBottom: 8,
    width: 35,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
    marginTop: 3,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 17,
  },
  viewAll: {
    color: deliveryBlue,
    fontSize: 13,
    fontWeight: '900',
  },
});
