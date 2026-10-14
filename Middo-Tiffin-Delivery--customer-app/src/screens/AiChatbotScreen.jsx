import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowLeftIcon } from '../components/ArrowLeftIcon';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../theme/colors';
const messages = [
  ['bot', 'Hi Rahul, I am MIDDO AI. How can I help with your tiffin today?'],
  ['user', 'Can I skip tomorrow dinner?'],
  [
    'bot',
    'Yes. Your dinner can be skipped before 10 PM today. I can also show your upcoming meals.',
  ],
];
export function AiChatbotScreen({ topInset, bottomInset, onBack }) {
  const { themeColors } = useTheme();
  return (
    <View style={[styles.screen, { backgroundColor: themeColors.surface }]}>
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
        <View style={styles.botAvatar}>
          <Text style={styles.botAvatarText}>🤖</Text>
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>AI Chatbot Support</Text>
          <Text style={styles.heroSubtitle}>Instant answers 24/7</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(104, bottomInset + 82),
          },
        ]}
      >
        {messages.map(([sender, text]) => (
          <View
            key={text}
            style={[
              styles.messageBubble,
              sender === 'user' ? styles.userBubble : styles.botBubble,
            ]}
          >
            <Text style={sender === 'user' ? styles.userText : styles.botText}>
              {text}
            </Text>
          </View>
        ))}

        <Text style={[styles.sectionTitle, { color: themeColors.surfaceText }]}>Suggested Questions</Text>
        {[
          'Skip my next meal',
          'Track today delivery',
          'Explain my wallet balance',
          'Talk to human support',
        ].map(question => (
          <Pressable key={question} style={[styles.suggestion, { backgroundColor: themeColors.card, borderColor: themeColors.line }, { backgroundColor: themeColors.card, borderColor: themeColors.line }, { backgroundColor: themeColors.card, borderColor: themeColors.line }]}>
            <Text style={[styles.suggestionText, { color: themeColors.text }]}>{question}</Text>
            <Text style={styles.suggestionArrow}>›</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View
        style={[
          styles.composer,
          {
            bottom: Math.max(0, bottomInset),
          },
        ]}
      >
        <Text style={styles.composerText}>Ask MIDDO AI...</Text>
        <Pressable style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Send</Text>
        </Pressable>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  hero: {
    minHeight: 138,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingBottom: 24,
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
  botAvatar: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.24)',
  },
  botAvatarText: {
    fontSize: 28,
  },
  heroCopy: {
    flex: 1,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
  },
  heroSubtitle: {
    marginTop: 4,
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 20,
  },
  messageBubble: {
    maxWidth: '86%',
    padding: 13,
    borderRadius: 16,
    marginBottom: 12,
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.orange,
  },
  botText: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  userText: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '800',
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 10,
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  suggestion: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  suggestionText: {
    flex: 1,
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  suggestionArrow: {
    color: colors.orange,
    fontSize: 20,
  },
  composer: {
    position: 'absolute',
    left: 18,
    right: 18,
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 9,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    backgroundColor: '#fff',
  },
  composerText: {
    flex: 1,
    color: '#777',
    fontSize: 13,
    paddingLeft: 8,
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 13,
    backgroundColor: colors.orange,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
});
