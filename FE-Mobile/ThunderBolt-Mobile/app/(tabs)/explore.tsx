import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock3, Loader2, CheckCircle2, Wrench, RefreshCw, Plus } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { bookingService, Booking } from '../../services/bookingService';

type BookingStatus = 'pending' | 'process' | 'finish';

// Map backend status to UI status
function mapStatus(backendStatus: string): BookingStatus {
  const s = backendStatus.toLowerCase();
  if (s === 'selesai' || s === 'finish' || s === 'completed' || s === 'done') return 'finish';
  if (s === 'diproses' || s === 'process' || s === 'in_progress' || s === 'dikerjakan') return 'process';
  return 'pending'; // 'Menunggu' or anything else
}

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: 'Menunggu',
  process: 'Diproses',
  finish: 'Selesai',
};

const STATUS_COLOR: Record<BookingStatus, string> = {
  pending: colors.statusPending,
  process: colors.statusProcess,
  finish: colors.statusFinish,
};

const STATUS_ICON: Record<BookingStatus, React.ComponentType<any>> = {
  pending: Clock3,
  process: Loader2,
  finish: CheckCircle2,
};

// Format date from ISO string to readable
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

export default function ServisScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async (showRefresh = false) => {
    if (!user) return;
    
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    
    setError(null);

    try {
      const data = await bookingService.getBookingsByUser(user.id);
      setBookings(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat booking');
      console.log('Fetch bookings error:', err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [fetchBookings])
  );

  const activeBookings = bookings.filter((b) => mapStatus(b.status) !== 'finish');
  const finishedBookings = bookings.filter((b) => mapStatus(b.status) === 'finish');

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ---------- Header ---------- */}
        <View style={styles.header}>
          <View style={styles.headerIconCircle}>
            <Wrench size={20} color={colors.textOnPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Servis kamu</Text>
            <Text style={styles.headerSubtitle}>Semua booking &amp; riwayat servis</Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/booking/create' as any)}
            style={styles.addBookingHeaderBtn}
            activeOpacity={0.85}
          >
            <Plus size={16} color={colors.textOnPrimary} />
            <Text style={styles.addBookingHeaderBtnText}>Booking</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => fetchBookings(true)}
            style={styles.refreshButton}
            activeOpacity={0.7}
          >
            <RefreshCw
              size={18}
              color={colors.primary}
              style={isRefreshing ? { opacity: 0.5 } : undefined}
            />
          </TouchableOpacity>
        </View>

        {/*loading */}
        {isLoading && (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Memuat booking...</Text>
          </View>
        )}

        {/* ---------- Error ---------- */}
        {error && !isLoading && (
          <View style={styles.errorState}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              onPress={() => fetchBookings()}
              style={styles.retryButton}
              activeOpacity={0.85}
            >
              <Text style={styles.retryButtonText}>Coba Lagi</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ---------- Booking aktif ---------- */}
        {!isLoading && activeBookings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Sedang berjalan</Text>
            {activeBookings.map((booking) => {
              const uiStatus = mapStatus(booking.status);
              const StatusIcon = STATUS_ICON[uiStatus];
              const vehicleLabel = booking.vehicle_brand && booking.vehicle_model
                ? `${booking.vehicle_brand} ${booking.vehicle_model}`
                : 'Kendaraan';
              const serviceName = booking.service_name || 'Servis';

              return (
                <TouchableOpacity
                  key={booking.id}
                  style={styles.ticketCard}
                  onPress={() => router.push({ pathname: '/booking/[id]', params: { id: String(booking.id) } })}
                  activeOpacity={0.85}
                >
                  <View style={styles.ticketAccentBar} />
                  <View style={styles.ticketLeft}>
                    <Text style={styles.ticketCode}>{booking.booking_code}</Text>
                    <Text style={styles.ticketService}>{serviceName}</Text>
                    <Text style={styles.ticketMeta}>{vehicleLabel} · {formatDate(booking.booking_date)}</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: `${STATUS_COLOR[uiStatus]}22` }]}>
                    <StatusIcon size={12} color={STATUS_COLOR[uiStatus]} />
                    <Text style={[styles.statusText, { color: STATUS_COLOR[uiStatus] }]}>
                      {STATUS_LABEL[uiStatus]}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* riwayat selesai  */}
        {!isLoading && finishedBookings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Riwayat</Text>
            {finishedBookings.map((booking) => {
              const uiStatus = mapStatus(booking.status);
              const StatusIcon = STATUS_ICON[uiStatus];
              const vehicleLabel = booking.vehicle_brand && booking.vehicle_model
                ? `${booking.vehicle_brand} ${booking.vehicle_model}`
                : 'Kendaraan';
              const serviceName = booking.service_name || 'Servis';

              return (
                <TouchableOpacity
                  key={booking.id}
                  style={styles.ticketCard}
                  onPress={() => router.push({ pathname: '/booking/[id]', params: { id: String(booking.id) } })}
                  activeOpacity={0.85}
                >
                  <View style={styles.ticketAccentBar} />
                  <View style={styles.ticketLeft}>
                    <Text style={styles.ticketCode}>{booking.booking_code}</Text>
                    <Text style={styles.ticketService}>{serviceName}</Text>
                    <Text style={styles.ticketMeta}>{vehicleLabel} · {formatDate(booking.booking_date)}</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: `${STATUS_COLOR[uiStatus]}22` }]}>
                    <StatusIcon size={12} color={STATUS_COLOR[uiStatus]} />
                    <Text style={[styles.statusText, { color: STATUS_COLOR[uiStatus] }]}>
                      {STATUS_LABEL[uiStatus]}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {!isLoading && !error && bookings.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}></Text>
            <Text style={styles.emptyStateTitle}>Belum ada booking servis</Text>
            <Text style={styles.emptyStateText}>Buat booking servis pertamamu sekarang!</Text>
            <TouchableOpacity
              style={styles.emptyStateBtn}
              activeOpacity={0.88}
              onPress={() => router.push('/booking/create' as any)}
            >
              <Plus size={16} color={colors.textOnPrimary} />
              <Text style={styles.emptyStateBtnText}>Buat Booking Sekarang</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    marginBottom: 8,
  },
  headerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: 12.5,
    marginTop: 2,
  },
  addBookingHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  addBookingHeaderBtnText: {
    color: colors.textOnPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },

  section: {
    marginTop: 24,
  },
  sectionHeading: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },

  ticketCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    paddingLeft: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: colors.primaryDarker,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  ticketAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.primary,
  },
  ticketLeft: {
    flex: 1,
    paddingRight: 8,
  },
  ticketCode: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  ticketService: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  ticketMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },

  /* Loading, error, empty */
  loadingState: {
    marginTop: 60,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  errorState: {
    marginTop: 40,
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
  },
  retryButtonText: {
    color: colors.textOnPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  emptyState: {
    marginTop: 60,
    alignItems: 'center',
    gap: 6,
  },
  emptyStateEmoji: {
    fontSize: 40,
    marginBottom: 4,
  },
  emptyStateTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyStateText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 12,
  },
  emptyStateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
  },
  emptyStateBtnText: {
    color: colors.textOnPrimary,
    fontSize: 13.5,
    fontWeight: '700',
  },
});