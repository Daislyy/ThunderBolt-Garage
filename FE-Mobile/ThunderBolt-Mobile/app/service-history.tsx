// app/service-history.tsx
// Halaman riwayat servis kendaraan pelanggan yang telah selesai atau dibatalkan.
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Car,
  Wrench,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Filter,
} from 'lucide-react-native';
import { colors } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import { bookingService, Booking } from '../services/bookingService';

export default function ServiceHistoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'Selesai' | 'Dibatalkan'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await bookingService.getBookingsByUser(user.id, user.email);
      // Filter hanya riwayat: Selesai atau Dibatalkan
      const history = data.filter((b) => b.status === 'Selesai' || b.status === 'Dibatalkan');
      setBookings(history);
    } catch (err) {
      console.log('Error fetching history:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [fetchHistory])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const filteredData = bookings.filter((b) => {
    if (filterType === 'all') return true;
    return b.status === filterType;
  });

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <ArrowLeft size={18} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Riwayat Servis</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]}
          onPress={() => setFilterType('all')}
          activeOpacity={0.8}
        >
          <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>
            Semua ({bookings.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filterType === 'Selesai' && styles.filterChipActive]}
          onPress={() => setFilterType('Selesai')}
          activeOpacity={0.8}
        >
          <Text style={[styles.filterText, filterType === 'Selesai' && styles.filterTextActive]}>
            Selesai ({bookings.filter((b) => b.status === 'Selesai').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filterType === 'Dibatalkan' && styles.filterChipActive]}
          onPress={() => setFilterType('Dibatalkan')}
          activeOpacity={0.8}
        >
          <Text style={[styles.filterText, filterType === 'Dibatalkan' && styles.filterTextActive]}>
            Dibatalkan ({bookings.filter((b) => b.status === 'Dibatalkan').length})
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Memuat riwayat servis...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          renderItem={({ item }) => {
            const isCompleted = item.status === 'Selesai';
            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: '/booking/[id]', params: { id: String(item.id) } })}
              >
                <View style={styles.cardTopRow}>
                  <View style={styles.codeRow}>
                    <Wrench size={14} color={colors.primary} />
                    <Text style={styles.codeText}>{item.booking_code || `#${item.id}`}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      isCompleted ? styles.badgeSuccess : styles.badgeDanger,
                    ]}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={11} color="#16A34A" />
                    ) : (
                      <XCircle size={11} color="#DC2626" />
                    )}
                    <Text
                      style={[
                        styles.statusText,
                        isCompleted ? styles.textSuccess : styles.textDanger,
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.serviceName} numberOfLines={2}>
                  {item.service_name || 'Servis Kendaraan'}
                </Text>

                <View style={styles.metaInfoRow}>
                  <View style={styles.metaItem}>
                    <Calendar size={12} color="#94A3B8" />
                    <Text style={styles.metaVal}>
                      {item.booking_date
                        ? new Date(item.booking_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '-'}
                    </Text>
                  </View>
                  {item.booking_time && (
                    <View style={styles.metaItem}>
                      <Clock size={12} color="#94A3B8" />
                      <Text style={styles.metaVal}>{item.booking_time}</Text>
                    </View>
                  )}
                </View>

                {item.vehicle_brand && (
                  <View style={styles.vehicleRow}>
                    <Car size={13} color={colors.primary} />
                    <Text style={styles.vehicleVal} numberOfLines={1}>
                      {item.vehicle_brand} {item.vehicle_model || ''} ({item.license_plate || '-'})
                    </Text>
                  </View>
                )}

                <View style={styles.footerRow}>
                  {item.total_price ? (
                    <Text style={styles.priceVal}>
                      Rp {Number(item.total_price).toLocaleString('id-ID')}
                    </Text>
                  ) : (
                    <View />
                  )}
                  <ChevronRight size={16} color="#94A3B8" />
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <AlertCircle size={44} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Belum Ada Riwayat Servis</Text>
              <Text style={styles.emptySub}>
                Riwayat servis yang telah selesai atau dibatalkan akan tercatat di sini.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.headingDark,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  codeText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.headingDark,
    letterSpacing: 0.3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeSuccess: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  badgeDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statusText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  textSuccess: {
    color: '#16A34A',
  },
  textDanger: {
    color: '#DC2626',
  },
  serviceName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 20,
    marginBottom: 8,
  },
  metaInfoRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaVal: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  vehicleVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  priceVal: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.headingDark,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  detailLink: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 6,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 18,
  },
});
