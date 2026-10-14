import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowLeftIcon } from '../components/ArrowLeftIcon';
import { useTheme } from '../context/ThemeContext';
import { fetchSubscriptionCalendar } from '../services/customerApi';
import { colors } from '../theme/colors';
const dayMs = 24 * 60 * 60 * 1000;
export function SubscriptionCalendarScreen({
  topInset,
  bottomInset,
  onBack,
  onSkipMeal,
}) {
  const { themeColors } = useTheme();
  const [calendarData, setCalendarData] = useState({
    subscription: null,
    calendar: [],
  });
  const subscription = calendarData.subscription;
  const calendarRows = calendarData.calendar || [];
  const today = new Date();
  const monthDate = calendarRows[0]?.date
    ? new Date(calendarRows[0].date)
    : today;
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const days = Array.from(
    {
      length: daysInMonth,
    },
    (_, index) => index + 1,
  );
  const skipped = calendarRows.filter(item => item.status === 'Skipped').length;
  const startDate = subscription?.startDate
    ? new Date(subscription.startDate)
    : null;
  const endDate = subscription?.endDate ? new Date(subscription.endDate) : null;
  const delivered = calendarRows.length
    ? calendarRows.filter(item => item.status === 'Delivered').length
    : startDate
    ? Math.max(
        0,
        Math.floor(
          ((endDate && endDate < today ? endDate : today).getTime() -
            startDate.getTime()) /
            dayMs,
        ),
      )
    : 0;
  const totalMeals = calendarRows.length || subscription?.totalMeals || 0;
  const remaining = Math.max(0, Number(totalMeals) - delivered - skipped);
  useEffect(() => {
    fetchSubscriptionCalendar()
      .then(data =>
        setCalendarData({
          subscription: data.subscription || null,
          calendar: data.calendar || [],
        }),
      )
      .catch(() => undefined);
  }, []);
  const getDayState = day => {
    const date = new Date(year, month, day);
    const isoDate = date.toISOString().slice(0, 10);
    const calendarItem = calendarRows.find(item => item.date === isoDate);
    const isToday = date.toDateString() === today.toDateString();
    if (calendarItem?.status === 'Skipped') {
      return 'skipped';
    }
    if (calendarItem?.status === 'Delivered') {
      return 'delivered';
    }
    const inPlan =
      subscription &&
      calendarItem &&
      (!startDate ||
        date >=
          new Date(
            startDate.getFullYear(),
            startDate.getMonth(),
            startDate.getDate(),
          )) &&
      (!endDate || date <= endDate);
    if (isToday) {
      return 'today';
    }
    if (!inPlan) {
      return 'idle';
    }
    return 'upcoming';
  };
  return (
    <View style={[styles.screen, { backgroundColor: themeColors.surface }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(34, bottomInset + 24),
          },
        ]}
        showsVerticalScrollIndicator
      >
        <View
          style={[
            styles.hero,
            {
              paddingTop: Math.max(48, topInset + 16),
            },
          ]}
        >
          <Pressable onPress={onBack} hitSlop={12} style={styles.backButton}>
            <ArrowLeftIcon />
          </Pressable>
          <Text style={styles.heroTitle}>Subscription Calendar</Text>
          <Text style={styles.heroSubtitle}>
            {subscription
              ? [subscription.plan || subscription.planType, subscription.homeChefName]
                  .filter(Boolean)
                  .join(' · ')
              : 'No active subscription'}
          </Text>
        </View>

        <View style={styles.monthRow}>
          <Pressable style={styles.monthButton}>
            <Text style={[styles.monthButtonText, { color: themeColors.surfaceText }]}>
              ‹
            </Text>
          </Pressable>
          <Text style={[styles.monthTitle, { color: themeColors.surfaceText }]}>
            {monthDate.toLocaleDateString('en-IN', {
              month: 'short',
              year: 'numeric',
            })}
          </Text>
          <Pressable style={styles.monthButton}>
            <Text style={[styles.monthButtonText, { color: themeColors.surfaceText }]}>
              ›
            </Text>
          </Pressable>
        </View>

        <View style={styles.weekRow}>
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <Text key={day} style={styles.weekDay}>
              {day}
            </Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {Array.from(
            {
              length: firstWeekday,
            },
            (_, index) => (
              <View
                key={`blank-${index}`}
                style={[styles.dayCell, styles.blankCell]}
              />
            ),
          )}
          {days.map(day => (
            <View
              key={day}
              style={[
                styles.dayCell,
                getDayState(day) === 'today' ? styles.todayCell : undefined,
                getDayState(day) === 'upcoming'
                  ? styles.upcomingCell
                  : undefined,
                getDayState(day) === 'delivered'
                  ? styles.deliveredCell
                  : undefined,
                getDayState(day) === 'skipped'
                  ? styles.skippedCell
                  : undefined,
                getDayState(day) === 'idle' ? styles.idleCell : undefined,
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  getDayState(day) === 'today' ? styles.todayText : undefined,
                ]}
              >
                {day}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.legendRow}>
          <Legend dot="#c9f5d8" label="Delivered" />
          <Legend dot="#ffe5c3" label="Skipped" />
          <Legend dot={colors.orange} label="Today" />
          <Legend dot={colors.yellow} label="Upcoming" />
        </View>

        <View style={styles.statsRow}>
          <Stat value={String(delivered)} label="Delivered" tone="green" />
          <Stat value={String(skipped)} label="Skipped" tone="orange" />
          <Stat value={String(remaining)} label="Remaining" tone="yellow" />
        </View>

        <Pressable
          disabled={!subscription || !calendarRows.length}
          onPress={onSkipMeal}
          style={[
            styles.skipButton,
            !subscription || !calendarRows.length
              ? styles.skipButtonDisabled
              : undefined,
          ]}
        >
          <Text style={styles.skipButtonText}>⏭ Skip Upcoming Meal</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
function Legend({ dot, label }) {
  return (
    <View style={styles.legendItem}>
      <View
        style={[
          styles.legendDot,
          {
            backgroundColor: dot,
          },
        ]}
      />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}
function Stat({ value, label, tone }) {
  const { themeColors } = useTheme();
  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: themeColors.card, borderColor: themeColors.line },
      ]}
    >
      <Text
        style={[
          styles.statValue,
          tone === 'green' ? styles.statGreen : undefined,
          tone === 'orange' ? styles.statOrange : undefined,
          tone === 'yellow' ? styles.statYellow : undefined,
        ]}
      >
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    paddingHorizontal: 18,
  },
  hero: {
    marginHorizontal: -18,
    paddingHorizontal: 18,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: colors.orange,
  },
  backButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  heroTitle: {
    marginTop: 26,
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
  },
  heroSubtitle: {
    marginTop: 5,
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  monthButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.yellow,
  },
  monthButtonText: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
  },
  monthTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  weekRow: {
    flexDirection: 'row',
    marginTop: 18,
  },
  weekDay: {
    flex: 1,
    color: '#666',
    fontSize: 10,
    fontWeight: '900',
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 12,
  },
  dayCell: {
    width: '13.2%',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: colors.yellow,
  },
  blankCell: {
    backgroundColor: 'transparent',
  },
  deliveredCell: {
    backgroundColor: '#c9f5d8',
  },
  skippedCell: {
    backgroundColor: '#ffe5c3',
  },
  idleCell: {
    backgroundColor: '#f1ebe4',
  },
  todayCell: {
    backgroundColor: colors.orange,
  },
  upcomingCell: {
    backgroundColor: '#ffc126',
  },
  dayText: {
    color: '#252525',
    fontSize: 12,
    fontWeight: '900',
  },
  todayText: {
    color: '#fff',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },
  legendText: {
    color: '#666',
    fontSize: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: '#fff',
  },
  statValue: {
    fontSize: 23,
    fontWeight: '900',
  },
  statGreen: {
    color: '#05a84e',
  },
  statOrange: {
    color: colors.orange,
  },
  statYellow: {
    color: '#ff9f0a',
  },
  statLabel: {
    marginTop: 7,
    color: '#666',
    fontSize: 11,
  },
  skipButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.orange,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  skipButtonDisabled: {
    opacity: 0.5,
  },
  skipButtonText: {
    color: colors.orange,
    fontSize: 13,
    fontWeight: '900',
  },
});
