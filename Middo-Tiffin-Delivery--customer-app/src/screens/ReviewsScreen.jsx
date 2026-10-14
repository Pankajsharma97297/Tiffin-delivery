import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ArrowLeftIcon } from '../components/ArrowLeftIcon';
import { useTheme } from '../context/ThemeContext';
import {
  fetchCustomerOrders,
  fetchCustomerReviews,
  submitCustomerReview,
} from '../services/customerApi';
import { colors } from '../theme/colors';
export function ReviewsScreen({ topInset, bottomInset, onBack }) {
  const { themeColors } = useTheme();
  const [mealReviews, setMealReviews] = useState([]);
  const [publicReviews, setPublicReviews] = useState([]);
  const [ratings, setRatings] = useState({});
  const [notes, setNotes] = useState({});
  const [submitted, setSubmitted] = useState({});
  const [savingId, setSavingId] = useState('');
  useEffect(() => {
    let mounted = true;
    Promise.all([fetchCustomerOrders(), fetchCustomerReviews()])
      .then(([orderData, reviewData]) => {
        if (!mounted) {
          return;
        }
        const recentMeals = (orderData.orders || [])
          .filter(order => order.meal)
          .slice(0, 5)
          .map(order => ({
            id: order._id || order.orderId,
            image: '🍱',
            title: order.meal,
            chef: [
              order.chef,
              order.createdAt ? formatDate(order.createdAt) : '',
            ]
              .filter(Boolean)
              .join(' · '),
            raw: order,
          }));
        setMealReviews(recentMeals);
        setPublicReviews(reviewData.reviews || []);
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);
  const saveReview = async meal => {
    const rating = ratings[meal.id] ?? 0;
    const note = notes[meal.id] ?? '';
    if (!rating || !note.trim()) {
      return;
    }
    setSavingId(meal.id);
    try {
      const result = await submitCustomerReview({
        chef: meal.raw?.chef,
        meal: meal.raw?.meal,
        orderId: meal.raw?.orderId,
        rating,
        text: note.trim(),
      });
      setSubmitted(current => ({
        ...current,
        [meal.id]: true,
      }));
      setPublicReviews(current => [result.review, ...current].filter(Boolean));
    } catch {
      setSubmitted(current => ({
        ...current,
        [meal.id]: false,
      }));
    } finally {
      setSavingId('');
    }
  };
  return (
    <View style={[styles.screen, { backgroundColor: themeColors.surface }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(30, bottomInset + 20),
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
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>Ratings & Reviews</Text>
            <Text style={styles.heroSubtitle}>Share your meal experience</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: themeColors.surfaceText }]}>Rate Your Recent Meals</Text>
        <View style={styles.rateList}>
          {mealReviews.length ? mealReviews.map(meal => {
            const rating = ratings[meal.id] ?? 0;
            const note = notes[meal.id] ?? '';
            const isReady = rating > 0 && note.trim().length > 0;
            return (
              <View key={meal.id} style={[styles.rateCard, { backgroundColor: themeColors.card, borderColor: themeColors.line }, { backgroundColor: themeColors.card, borderColor: themeColors.line }, { backgroundColor: themeColors.card, borderColor: themeColors.line }]}>
                <View style={styles.mealTop}>
                  <Text style={styles.mealImage}>{meal.image}</Text>
                  <View style={styles.mealCopy}>
                    <Text style={[styles.mealTitle, { color: themeColors.text }]}>{meal.title}</Text>
                    <Text style={styles.mealChef}>{meal.chef}</Text>
                  </View>
                </View>

                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Pressable
                      key={star}
                      onPress={() =>
                        setRatings(current => ({
                          ...current,
                          [meal.id]: star,
                        }))
                      }
                      hitSlop={8}
                    >
                      <Text
                        style={[
                          styles.star,
                          star <= rating ? styles.starActive : undefined,
                        ]}
                      >
                        ★
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <TextInput
                  value={note}
                  onChangeText={text =>
                    setNotes(current => ({
                      ...current,
                      [meal.id]: text,
                    }))
                  }
                  placeholder="Tell us about your experience..."
                  placeholderTextColor="#8e7044"
                  multiline
                  style={[styles.reviewInput, { color: themeColors.text }]}
                />

                <Pressable
                  disabled={!isReady || savingId === meal.id}
                  onPress={() => saveReview(meal)}
                  style={[
                    styles.submitButton,
                    !isReady || savingId === meal.id
                      ? styles.submitButtonDisabled
                      : undefined,
                  ]}
                >
                  <Text
                    style={[
                      styles.submitText,
                    !isReady || savingId === meal.id
                      ? styles.submitTextDisabled
                      : undefined,
                  ]}
                >
                    {savingId === meal.id ? 'Saving...' : '✈ Submit Review'}
                  </Text>
                </Pressable>
                {submitted[meal.id] ? (
                  <Text style={styles.thanksText}>
                    Thanks! Your review has been saved.
                  </Text>
                ) : null}
              </View>
            );
          }) : (
            <Text style={styles.emptyText}>No meals available to review.</Text>
          )}
        </View>

        <View style={styles.othersHead}>
          <Text style={[styles.sectionTitleInline, { color: themeColors.surfaceText }]}>What Others Say</Text>
          {publicReviews.length ? (
            <Text style={styles.overallRating}>
              ★ {getAverageRating(publicReviews)}{' '}
              <Text style={styles.overallCount}>({publicReviews.length})</Text>
            </Text>
          ) : null}
        </View>

        <View style={styles.publicList}>
          {publicReviews.length ? publicReviews.map(review => (
            <View
              key={review._id || `${review.customer}${review.createdAt}`}
              style={[styles.publicCard, { backgroundColor: themeColors.card, borderColor: themeColors.line }, { backgroundColor: themeColors.card, borderColor: themeColors.line }, { backgroundColor: themeColors.card, borderColor: themeColors.line }]}
            >
              <View style={styles.publicTop}>
                <Text style={styles.publicAvatar}>👤</Text>
                <View style={styles.publicNameWrap}>
                  <Text style={[styles.publicName, { color: themeColors.text }]}>
                    {review.customer || 'Customer'}
                  </Text>
                  <Text style={styles.publicDate}>
                    {formatDate(review.createdAt)}
                  </Text>
                </View>
                <Text style={styles.publicStars}>
                  {'★'.repeat(Number(review.rating || 0))}
                  {'☆'.repeat(5 - Number(review.rating || 0))}
                </Text>
              </View>
              {review.text ? (
                <Text style={styles.publicBody}>{review.text}</Text>
              ) : null}
            </View>
          )) : (
            <Text style={styles.emptyText}>No reviews yet.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
function formatDate(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  });
}
function getAverageRating(reviews) {
  const ratings = reviews
    .map(review => Number(review.rating || 0))
    .filter(Boolean);
  if (!ratings.length) {
    return '0.0';
  }
  return (
    ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
  ).toFixed(1);
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
    minHeight: 128,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: -18,
    paddingHorizontal: 18,
    paddingBottom: 26,
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
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 10,
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  rateList: {
    gap: 14,
  },
  emptyText: {
    paddingVertical: 16,
    color: '#777',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  rateCard: {
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  mealTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mealImage: {
    width: 52,
    height: 52,
    borderRadius: 13,
    overflow: 'hidden',
    backgroundColor: '#f7edcf',
    lineHeight: 52,
    textAlign: 'center',
    fontSize: 28,
  },
  mealCopy: {
    flex: 1,
  },
  mealTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  mealChef: {
    marginTop: 4,
    color: '#777',
    fontSize: 11,
    fontWeight: '700',
  },
  starRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 16,
  },
  star: {
    color: '#d3d3d3',
    fontSize: 28,
    lineHeight: 32,
  },
  starActive: {
    color: colors.yellow,
  },
  reviewInput: {
    minHeight: 58,
    marginTop: 12,
    padding: 12,
    color: colors.ink,
    borderRadius: 10,
    backgroundColor: colors.yellow,
    fontSize: 13,
    fontWeight: '700',
    textAlignVertical: 'top',
  },
  submitButton: {
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    borderRadius: 10,
    backgroundColor: colors.orange,
  },
  submitButtonDisabled: {
    backgroundColor: '#f2ebe4',
  },
  submitText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
  },
  submitTextDisabled: {
    color: '#777',
  },
  thanksText: {
    marginTop: 8,
    color: '#11833a',
    fontSize: 12,
    fontWeight: '800',
  },
  othersHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 10,
  },
  sectionTitleInline: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  overallRating: {
    color: colors.yellow,
    fontSize: 13,
    fontWeight: '900',
  },
  overallCount: {
    color: '#666',
    fontWeight: '700',
  },
  publicList: {
    gap: 12,
  },
  publicCard: {
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: '#fff',
  },
  publicTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  publicAvatar: {
    fontSize: 30,
  },
  publicNameWrap: {
    flex: 1,
  },
  publicName: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  publicDate: {
    marginTop: 2,
    color: '#777',
    fontSize: 10,
  },
  publicStars: {
    color: colors.yellow,
    fontSize: 13,
    fontWeight: '900',
  },
  publicBody: {
    marginTop: 10,
    color: '#555',
    fontSize: 12,
    lineHeight: 18,
  },
  helpful: {
    marginTop: 9,
    color: '#777',
    fontSize: 11,
  },
});
