import React from 'react';
import { Image, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { tabIcons, tabLabels } from '../../data/partnerData';
import { AppTopBar } from './AppTopBar';
import { colors } from '../../theme/colors';
import { Icons } from '../../theme/images';
import { useTheme } from '../../context/ThemeContext';

export function PartnerShell({ activeTab, bottomInset, children, deliveryMode, fixedHeader, onBack, onRightPress, onTab, tabs, topInset }) {
  const { darkMode, themeColors } = useTheme();
  const deliverySurface = deliveryMode && (activeTab === 'deliveries' || activeTab === 'earnings');

  return (
    <View style={[styles.shell, { backgroundColor: themeColors.surface }]}>
      {activeTab === 'home' || activeTab === 'earnings' || activeTab === 'alerts' ? null : (
        <AppTopBar
          Righticon={activeTab === 'profile' ? Icons.Edit : deliverySurface ? Icons.Filter : null}
          compact={activeTab === 'profile'}
          delivery={deliverySurface}
          onBack={onBack}
          onRightPress={onRightPress}
          title={activeTab === 'profile' ? 'My Profile' : activeTab === 'deliveries' ? 'Delivery Management' : tabLabels[activeTab]}
          topInset={topInset}
        />
      )}
      {fixedHeader ? <View style={styles.fixedHeader}>{fixedHeader}</View> : null}
      {activeTab === 'profile' ? (
        <View style={[styles.profileContent, { backgroundColor: themeColors.surface }]}>
          {children}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.appContent, { paddingBottom: Math.max(106, bottomInset + 88) }]}
          style={{ backgroundColor: themeColors.surface }}
          showsVerticalScrollIndicator>
          {children}
        </ScrollView>
      )}
      <View style={[
        styles.partnerBottomNav,
        { backgroundColor: themeColors.card, borderTopColor: darkMode ? '#2e2724' : '#eadfd7', paddingBottom: Math.max(7, bottomInset) },
      ]}>
        {tabs.map(tab => (
          <Pressable key={tab} onPress={() => onTab(tab)} style={styles.partnerNavItem}>
            <View style={[styles.partnerNavIconBox, activeTab === tab ? { backgroundColor: darkMode ? '#2a1a10' : colors.orangeSoft } : null]}>
              <Image source={tabIcons[tab]} style={[styles.partnerNavIcon, { tintColor: darkMode ? '#8a7a72' : '#8d7b72' }, activeTab === tab ? styles.partnerNavIconActive : null]} />
            </View>
            <Text style={[styles.partnerNavText, { color: darkMode ? '#8a7a72' : '#8d7b72' }, activeTab === tab ? styles.partnerNavTextActive : null]}>
              {tabLabels[tab]}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  appContent: {
    paddingHorizontal: 14,
  },
  fixedHeader: {
    zIndex: 2,
  },
  partnerBottomNav: {
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    left: 0,
    minHeight: 70,
    paddingHorizontal: 14,
    paddingTop: 7,
    position: 'absolute',
    right: 0,
  },
  partnerNavIcon: {
    height: 19,
    width: 19,
  },
  partnerNavIconActive: {
    tintColor: colors.orange,
  },
  partnerNavIconBox: {
    alignItems: 'center',
    borderRadius: 10,
    height: 34,
    justifyContent: 'center',
    marginBottom: 2,
    width: 38,
  },
  partnerNavItem: {
    alignItems: 'center',
    flex: 1,
    height: 55,
    justifyContent: 'center',
    maxWidth: 64,
    minWidth: 50,
    paddingHorizontal: 4,
  },
  partnerNavText: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 13,
  },
  partnerNavTextActive: {
    color: colors.orange,
    fontWeight: '900',
  },
  profileContent: {
    flex: 1,
    paddingHorizontal: 14,
  },
  shell: {
    flex: 1,
  },
});
