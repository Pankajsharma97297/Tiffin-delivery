import React, { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ArrowLeftIcon } from '../components/ArrowLeftIcon';
import { useTheme } from '../context/ThemeContext';
import { fetchCustomerAppContent } from '../services/appContentApi';
import { colors } from '../theme/colors';
import { Icons, NavIcon } from '../theme/images';

const contactIconByLabel = {
  chat: Icons.Chat,
  call: Icons.Phone,
  phone: Icons.Phone,
  email: Icons.Message,
  message: Icons.Message,
};

function getContactLabel(label) {
  if (label === 'Call') {
    return 'Phone';
  }
  if (label === 'Email') {
    return 'Message';
  }
  return label;
}

function getContactIcon(label) {
  return contactIconByLabel[String(label || '').toLowerCase()] || Icons.Message;
}

export function HelpCenterScreen({ topInset, bottomInset, onBack }) {
  const { themeColors } = useTheme();
  const [support, setSupport] = useState({
    channels: [],
    topics: [],
    faqs: [],
  });
  const [openFaq, setOpenFaq] = useState('');
  useEffect(() => {
    fetchCustomerAppContent(['support'])
      .then(content => {
        const nextSupport = content.support || {};
        setSupport({
          channels: nextSupport.channels || [],
          topics: nextSupport.topics || [],
          faqs: nextSupport.faqs || [],
        });
        setOpenFaq(nextSupport.faqs?.[0]?.question || '');
      })
      .catch(() => undefined);
  }, []);
  return (
    <View style={[styles.screen, { backgroundColor: themeColors.surface }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(132, bottomInset + 118),
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
          <Text style={styles.heroTitle}>Help Center</Text>
          <Text style={styles.heroSubtitle}>How can we help you today?</Text>
          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.line,
              },
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.line,
              },
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.line,
              },
            ]}
          >
            <Image
              source={NavIcon.Explore}
              style={[styles.searchIcon, { tintColor: themeColors.muted }]}
            />
            <Text style={styles.searchText}>Search for help...</Text>
          </View>
        </View>

        <View style={styles.contactGrid}>
          {support.channels.map(({ label, tone }) => (
            <Pressable
              key={label}
              style={[
                styles.contactCard,
                {
                  backgroundColor: themeColors.card,
                  borderColor: themeColors.line,
                },
                {
                  backgroundColor: themeColors.card,
                  borderColor: themeColors.line,
                },
                {
                  backgroundColor: themeColors.card,
                  borderColor: themeColors.line,
                },
              ]}
            >
              <View
                style={[
                  styles.contactIconWrap,
                  tone === 'green' ? styles.greenIcon : undefined,
                  tone === 'blue' ? styles.blueIcon : undefined,
                  tone === 'orange' ? styles.orangeIcon : undefined,
                ]}
              >
                <Image
                  source={getContactIcon(label)}
                  style={[styles.contactIcon, { tintColor: themeColors.text }]}
                />
              </View>
              <Text style={[styles.contactLabel, { color: themeColors.text }]}>
                {getContactLabel(label)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: themeColors.surfaceText }]}>
          Browse by Topic
        </Text>
        <View style={styles.topicGrid}>
          {support.topics.map(({ icon, label }) => (
            <Pressable key={label} style={styles.topicCard}>
              <Text style={styles.topicIcon}>{icon}</Text>
              <Text style={styles.topicLabel}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: themeColors.surfaceText }]}>
          Frequently Asked Questions
        </Text>
        <View style={styles.faqList}>
          {support.faqs.map(faq => {
            const expanded = openFaq === faq.question;
            return (
              <Pressable
                key={faq.question}
                onPress={() => setOpenFaq(expanded ? null : faq.question)}
                accessibilityRole="button"
                accessibilityState={{
                  expanded,
                }}
                style={[
                  styles.faqCard,
                  {
                    backgroundColor: themeColors.card,
                    borderColor: themeColors.line,
                  },
                  {
                    backgroundColor: themeColors.card,
                    borderColor: themeColors.line,
                  },
                  {
                    backgroundColor: themeColors.card,
                    borderColor: themeColors.line,
                  },
                ]}
              >
                <View style={styles.faqQuestionRow}>
                  <Text style={[styles.faqText, { color: themeColors.text }]}>
                    {faq.question}
                  </Text>
                  <Image
                    source={Icons.DownArrow}
                    style={[
                      styles.faqChevron,
                      { tintColor: themeColors.muted },
                      expanded ? styles.faqChevronOpen : null,
                    ]}
                  />
                </View>
                {expanded ? (
                  <Text
                    style={[styles.faqAnswer, { color: themeColors.muted }]}
                  >
                    {faq.answer}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <View
          style={[
            styles.needHelpCard,
            {
              backgroundColor: themeColors.cardHighlight,
              borderColor: themeColors.line,
            },
          ]}
        >
          <View style={styles.needHelpIconWrap}>
            <Image
              source={Icons.QuestionMark}
              style={[styles.needHelpIcon, { tintColor: colors.orange }]}
            />
          </View>
          <View style={styles.needHelpCopy}>
            <Text style={[styles.needHelpTitle, { color: themeColors.text }]}>
              Still need help?
            </Text>
            <Text style={styles.needHelpText}>
              Our support team replies within 10 minutes.
            </Text>
          </View>
          <Pressable style={styles.contactButton}>
            <Text style={styles.contactButtonText}>Contact</Text>
          </Pressable>
        </View>
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
    paddingBottom: 22,
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
    marginTop: 24,
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
  },
  heroSubtitle: {
    marginTop: 4,
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  searchBox: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#fff',
  },
  searchIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },
  searchText: {
    color: '#777',
    fontSize: 12,
  },
  contactGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  contactCard: {
    flex: 1,
    minHeight: 86,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: '#fff',
  },
  contactIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactIcon: {
    width: 21,
    height: 21,
    resizeMode: 'contain',
  },
  greenIcon: {
    backgroundColor: '#e9fbef',
  },
  blueIcon: {
    backgroundColor: '#edf4ff',
  },
  orangeIcon: {
    backgroundColor: '#fff0e8',
  },
  contactLabel: {
    marginTop: 9,
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 10,
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  topicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicCard: {
    width: '31.8%',
    minHeight: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: colors.yellow,
  },
  topicIcon: {
    fontSize: 22,
  },
  topicLabel: {
    marginTop: 6,
    color: '#252525',
    fontSize: 11,
    fontWeight: '900',
  },
  faqList: {
    gap: 8,
  },
  faqCard: {
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: '#fff',
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  faqText: {
    flex: 1,
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  faqChevron: {
    width: 15,
    height: 15,
    resizeMode: 'contain',
  },
  faqChevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  faqAnswer: {
    marginTop: 12,
    color: '#666',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
  needHelpCard: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ffc5ae',
    borderRadius: 14,
    backgroundColor: '#fff0e8',
  },
  needHelpIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffe1d6',
  },
  needHelpIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  needHelpCopy: {
    flex: 1,
  },
  needHelpTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  needHelpText: {
    marginTop: 4,
    color: '#666',
    fontSize: 11,
  },
  contactButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.orange,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
});
