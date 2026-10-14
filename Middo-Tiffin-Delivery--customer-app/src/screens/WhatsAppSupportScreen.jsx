import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowLeftIcon } from '../components/ArrowLeftIcon';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../theme/colors';
export function WhatsAppSupportScreen({ topInset, bottomInset, onBack }) {
  const { themeColors } = useTheme();
  return (
    <View style={[styles.screen, { backgroundColor: themeColors.surface }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(24, bottomInset + 16),
          },
        ]}
      >
        <View
          style={[
            styles.hero,
            {
              paddingTop: Math.max(48, topInset + 16),
            },
          ]}
        >
          <View style={styles.heroTop}>
            <Pressable onPress={onBack} hitSlop={12} style={styles.backButton}>
              <ArrowLeftIcon />
            </Pressable>
            <Text style={styles.heroTitle}>WhatsApp Support</Text>
            <View style={styles.heroSpacer} />
          </View>
          <Text style={styles.heroIcon}>💬</Text>
          <Text style={styles.heroCopy}>
            Chat directly with a MIDDO admin for meal, delivery, and
            subscription help.
          </Text>
        </View>

        <View style={[styles.adminCard, { backgroundColor: themeColors.card, borderColor: themeColors.line }, { backgroundColor: themeColors.card, borderColor: themeColors.line }, { backgroundColor: themeColors.card, borderColor: themeColors.line }]}>
          <Text style={styles.adminAvatar}>👩‍💼</Text>
          <View style={styles.adminCopy}>
            <Text style={[styles.adminName, { color: themeColors.text }]}>MIDDO Support Admin</Text>
            <Text style={styles.adminStatus}>
              Online now · Replies in 2 mins
            </Text>
          </View>
          <Text style={styles.liveBadge}>LIVE</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: themeColors.surfaceText }]}>Quick Messages</Text>
        {[
          'My meal is late',
          'I want to skip a meal',
          'Need help with payment',
          'Change my address',
        ].map(message => (
          <Pressable key={message} style={[styles.quickRow, { backgroundColor: themeColors.card, borderColor: themeColors.line }, { backgroundColor: themeColors.card, borderColor: themeColors.line }, { backgroundColor: themeColors.card, borderColor: themeColors.line }]}>
            <Text style={[styles.quickText, { color: themeColors.text }]}>{message}</Text>
            <Text style={styles.quickArrow}>›</Text>
          </Pressable>
        ))}

        <Pressable style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Open WhatsApp Chat</Text>
        </Pressable>
      </ScrollView>
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
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    flex: 1,
    color: '#fff',
    fontSize: 21,
    fontWeight: '900',
  },
  heroSpacer: {
    width: 34,
  },
  heroIcon: {
    marginTop: 28,
    fontSize: 52,
    textAlign: 'center',
  },
  heroCopy: {
    marginTop: 12,
    color: '#fff',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '800',
    textAlign: 'center',
  },
  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  adminAvatar: {
    fontSize: 36,
  },
  adminCopy: {
    flex: 1,
  },
  adminName: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  adminStatus: {
    marginTop: 4,
    color: '#159447',
    fontSize: 11,
    fontWeight: '800',
  },
  liveBadge: {
    color: '#fff',
    backgroundColor: '#20c56b',
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 10,
    fontWeight: '900',
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 10,
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  quickRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  quickText: {
    flex: 1,
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  quickArrow: {
    color: colors.orange,
    fontSize: 20,
  },
  primaryButton: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: colors.orange,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },
});
