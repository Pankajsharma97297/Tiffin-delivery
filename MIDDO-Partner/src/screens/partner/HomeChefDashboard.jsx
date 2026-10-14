import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Icons } from '../../theme/images';
import { useTheme } from '../../context/ThemeContext';
import {
  CapacityCard,
  MealSlots,
  MiniOrder,
  QuickActions,
  SectionTitle,
  StatsGrid,
} from '../../components/partner';

export function HomeChefDashboard({
  completedOrders,
  dailyCapacity,
  earnings,
  isOnline,
  mealSlots,
  onCapacityChange,
  onOpenMenu,
  onSaveCapacity,
  onToggleOnline,
  savingCapacity,
  orders,
  pendingOrders,
  setActiveTab,
  subscriptionOrders,
  todayOrders,
  trialOrders,
}) {
  const { themeColors } = useTheme();
  const usedCapacity = Math.max(
    0,
    Number(todayOrders || 0) - Number(completedOrders || 0),
  );

  return (
    <>
      <StatsGrid
        columns={3}
        useTone
        items={[
          ["Today's Orders", String(todayOrders), Icons.PartnerBag],
          ['Trial Meals', String(trialOrders), Icons.Star],
          ['Subscriptions', String(subscriptionOrders), Icons.GroupShare],
          ["Today's Earnings", 'Rs. ' + earnings, Icons.Rupee],
          ['Pending', String(pendingOrders), Icons.Clock],
          ['Completed', String(completedOrders), Icons.Success],
        ]}
      />
      <CapacityCard
        dailyCapacity={dailyCapacity}
        isSaving={savingCapacity}
        onCapacityChange={onCapacityChange}
        onSaveCapacity={onSaveCapacity}
        usedCapacity={usedCapacity}
      />
      <QuickActions
        items={[
          ['Add Menu', Icons.AddMenu, onOpenMenu],
          ['View Orders', Icons.Package, () => setActiveTab('orders')],
          ['Earnings', Icons.Growth, () => setActiveTab('earnings')],
          [isOnline ? 'Kitchen OFF' : 'Kitchen ON', Icons.Power, onToggleOnline, !isOnline],
        ]}
      />
      <MealSlots slots={mealSlots} />
      <SectionTitle action="View All" onAction={() => setActiveTab('orders')} title="Recent Orders" />
      {!orders.length ? <Text style={[styles.emptyText, { color: themeColors.muted }]}>No live orders assigned yet.</Text> : null}
      {orders.slice(0, 4).map(order => <MiniOrder key={order.id} order={order} />)}
    </>
  );
}

const styles = StyleSheet.create({
  emptyText: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 14,
    textAlign: 'center',
  },
});
