// app/active-bookings.tsx
// Halaman daftar semua booking aktif milik pengguna (status Menunggu, Diproses, Menunggu Pembayaran).
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
  Plus,
} from 'lucide-react-native';
import { colors } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import { bookingService, Booking } from '../services/bookingService';

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  Menunggu: { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
  Diproses: { bg: '#FFF7ED', text: '#EA580C', border: '#FDBA74' },
  'Menunggu Pembayaran': { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' },
  Selesai: { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' },
  Dibatalkan: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
};

export default function ActiveBookingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActiveBookings = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await bookingService.getBookingsByUser(user.id, user.email);
      // Filter hanya status aktif: bukan Selesai dan bukan Dibatalkan
      const active = data.filter((b) => b.status !== 'Selesai' && b.status !== 'Dibatalkan');
      setBookings(active);
    } catch (err) {
      console.log('Error fetching active bookings:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchActiveBookings();
    }, [fetchActiveBookings])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchActiveBookings();
  };

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
        <Text style={styles.headerTitle}>Booking Aktif</Text>
        <TouchableOpacity
          style={styles.addBtn}
          activeOpacity={0.7}
          onPress={() => router.push('/booking/create' as any)}
        >
          <Plus size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Memuat booking aktif...</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
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
          ListHeaderComponent={
            <View style={styles.metaRow}>
              <Text style={styles.metaTitle}>Daftar Servis Sedang Berjalan</Text>
              <Text style={styles.metaCount}>{bookings.length} aktif</Text>
            </View>
          }
          renderItem={({ item }) => {
            const statusStyle = STATUS_CONFIG[item.status] || STATUS_CONFIG.Menunggu;
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
                      { backgroundColor: statusStyle.bg, borderColor: statusStyle.border },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>
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

                <View style={styles.actionRow}>
                  <Text style={styles.detailLink}>Lihat Status Pengerjaan</Text>
                  <ChevronRight size={14} color={colors.primary} />
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <AlertCircle size={44} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Tidak Ada Booking Aktif</Text>
              <Text style={styles.emptySub}>
                Saat ini belum ada servis kendaraan yang sedang berlangsung atau menunggu.
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                activeOpacity={0.85}
                onPress={() => router.push('/booking/create' as any)}
              >
                <Plus size={16} color="#FFFFFF" />
                <Text style={styles.emptyBtnText}>Buat Booking Sekarang</Text>
              </TouchableOpacity>
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
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FED7AA',
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
    paddingTop: 14,
    paddingBottom: 30,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  metaTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  metaCount: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
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
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10.5,
    fontWeight: '700',
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
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 2,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
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
    marginBottom: 12,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  emptyBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
