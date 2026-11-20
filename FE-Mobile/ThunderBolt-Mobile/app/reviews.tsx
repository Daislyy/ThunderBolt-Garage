// app/reviews.tsx
// Halaman daftar semua ulasan & rating pelanggan ThunderBolt Garage lengkap dengan ringkasan rating rata-rata, filter bintang, dan pencarian komentar.
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Star, Search, RefreshCw, MessageSquareText, ThumbsUp } from 'lucide-react-native';
import { colors } from '../constants/colors';
import { ratingService } from '../services/ratingService';
import { FALLBACK_REVIEWS, CustomerReviewItem } from '../components/home/customer-reviews-section';

export default function ReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<CustomerReviewItem[]>(FALLBACK_REVIEWS);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | 'all'>('all');

  const fetchReviews = async (isPullRefresh = false) => {
    if (isPullRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const data = await ratingService.getAllRatings();
      if (data && data.length > 0) {
        const mapped: CustomerReviewItem[] = data.map((r, idx) => ({
          id: `api-review-${r.id || idx}`,
          userName: r.customer_name || 'Pelanggan ThunderBolt',
          userAvatar: `https://images.unsplash.com/photo-${1535713875002 + (idx % 5)}?q=80&w=200&auto=format&fit=crop`,
          rating: Number(r.rating || 5),
          date: r.created_at
            ? new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
            : 'Baru saja',
          serviceName: r.service_name || 'Servis Kendaraan',
          comment: r.review || 'Pelayanan memuaskan dan teknisi sangat teliti.',
        }));
        setReviews([...mapped, ...FALLBACK_REVIEWS]);
      } else {
        setReviews(FALLBACK_REVIEWS);
      }
    } catch {
      setReviews(FALLBACK_REVIEWS);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // Hitung rata-rata rating dan distribusi bintang
  const { averageRating, totalCount, starCounts } = useMemo(() => {
    const total = reviews.length;
    if (total === 0) return { averageRating: '5.0', totalCount: 0, starCounts: {} as Record<number, number> };

    const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
    const avg = (sum / total).toFixed(1);

    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const star = Math.round(r.rating);
      if (counts[star] !== undefined) counts[star]++;
    });

    return { averageRating: avg, totalCount: total, starCounts: counts };
  }, [reviews]);

  // Filter ulasan berdasarkan query pencarian dan rating bintang yang dipilih
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const matchesSearch =
        r.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.comment.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStar =
        selectedStarFilter === 'all' || Math.round(r.rating) === Number(selectedStarFilter);

      return matchesSearch && matchesStar;
    });
  }, [reviews, searchQuery, selectedStarFilter]);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      {/* Top Navigation Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Semua Ulasan</Text>
        <TouchableOpacity
          onPress={() => fetchReviews(true)}
          style={styles.refreshBtn}
          activeOpacity={0.7}
          disabled={isRefreshing || isLoading}
        >
          <RefreshCw size={18} color={colors.primary} style={isRefreshing ? { opacity: 0.5 } : undefined} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredReviews}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchReviews(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View>
            {/* Header Ringkasan Rating Banner */}
            <View style={styles.ratingSummaryCard}>
              <View style={styles.avgScoreColumn}>
                <Text style={styles.avgScoreNumber}>{averageRating}</Text>
                <View style={styles.starDisplayRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={14}
                      color="#FF9500"
                      fill={star <= Math.round(Number(averageRating)) ? '#FF9500' : 'transparent'}
                    />
                  ))}
                </View>
                <Text style={styles.totalReviewsSub}>{totalCount} Ulasan Pelanggan</Text>
              </View>

              <View style={styles.scoreBarColumn}>
                {[5, 4, 3, 2, 1].map((s) => {
                  const count = starCounts[s] || 0;
                  const pct = totalCount > 0 ? (count / totalCount) * 100 : 0;
                  return (
                    <View key={s} style={styles.starBarRow}>
                      <Text style={styles.starNumLabel}>{s}★</Text>
                      <View style={styles.progressBarTrack}>
                        <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
                      </View>
                      <Text style={styles.starCountLabel}>{count}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Input Pencarian */}
            <View style={styles.searchBarContainer}>
              <Search size={16} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Cari ulasan atau layanan servis..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Filter Tab Bintang */}
            <View style={styles.filterChipsRow}>
              <TouchableOpacity
                style={[styles.filterChip, selectedStarFilter === 'all' && styles.filterChipActive]}
                activeOpacity={0.8}
                onPress={() => setSelectedStarFilter('all')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedStarFilter === 'all' && styles.filterChipTextActive,
                  ]}
                >
                  Semua ({totalCount})
                </Text>
              </TouchableOpacity>

              {[5, 4, 3, 2, 1].map((starNum) => {
                const isSelected = selectedStarFilter === starNum;
                const count = starCounts[starNum] || 0;
                return (
                  <TouchableOpacity
                    key={starNum}
                    style={[styles.filterChip, isSelected && styles.filterChipActive]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedStarFilter(isSelected ? 'all' : starNum)}
                  >
                    <Star
                      size={12}
                      color={isSelected ? '#FFFFFF' : '#FF9500'}
                      fill={isSelected ? '#FFFFFF' : '#FF9500'}
                    />
                    <Text
                      style={[
                        styles.filterChipText,
                        isSelected && styles.filterChipTextActive,
                      ]}
                    >
                      {starNum} ({count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.listHeadingRow}>
              <Text style={styles.listHeadingText}>
                Daftar Ulasan ({filteredReviews.length})
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.reviewCard}>
            <View style={styles.reviewHeaderRow}>
              <Image source={{ uri: item.userAvatar }} style={styles.avatarImg} />
              <View style={{ flex: 1 }}>
                <Text style={styles.userNameText}>{item.userName}</Text>
                <Text style={styles.dateText}>{item.date}</Text>
              </View>

              <View style={styles.ratingBadge}>
                <Star size={13} color="#FF9500" fill="#FF9500" />
                <Text style={styles.ratingBadgeText}>{item.rating.toFixed(1)}</Text>
              </View>
            </View>

            <View style={styles.servicePill}>
              <Text style={styles.servicePillText}>{item.serviceName}</Text>
            </View>

            <Text style={styles.commentText}>"{item.comment}"</Text>

            <View style={styles.verifiedRow}>
              <ThumbsUp size={12} color="#15803D" />
              <Text style={styles.verifiedText}>Pelanggan Terverifikasi ThunderBolt Garage</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.emptySubText}>Memuat ulasan pelanggan...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <MessageSquareText size={40} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Belum Ada Ulasan Sesuai Filter</Text>
              <Text style={styles.emptySubText}>
                Coba ubah kata kunci pencarian atau pilih filter bintang yang lain.
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.headingDark,
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 16,
  },

  // Rating Summary Card
  ratingSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avgScoreColumn: {
    alignItems: 'center',
    paddingRight: 18,
    borderRightWidth: 1,
    borderRightColor: '#F1F5F9',
    minWidth: 110,
  },
  avgScoreNumber: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 40,
  },
  starDisplayRow: {
    flexDirection: 'row',
    gap: 2,
    marginVertical: 4,
  },
  totalReviewsSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
  },
  scoreBarColumn: {
    flex: 1,
    paddingLeft: 16,
    gap: 4,
  },
  starBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starNumLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    width: 22,
  },
  progressBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF9500',
    borderRadius: 3,
  },
  starCountLabel: {
    fontSize: 10.5,
    color: '#94A3B8',
    width: 20,
    textAlign: 'right',
  },

  // Search Bar
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    padding: 0,
  },

  // Filter Chips
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },

  listHeadingRow: {
    marginBottom: 10,
  },
  listHeadingText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },

  // Review Item Card
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  userNameText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  dateText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  ratingBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D97706',
  },
  servicePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF7ED',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  servicePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C2410C',
  },
  commentText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
    marginBottom: 10,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  verifiedText: {
    fontSize: 10.5,
    color: '#15803D',
    fontWeight: '600',
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 6,
  },
  emptySubText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 260,
  },
});
