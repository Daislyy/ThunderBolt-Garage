import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock3, Loader2, CheckCircle2, Wrench } from 'lucide-react-native';
import { colors } from '../../constants/colors';

type BookingStatus = 'pending' | 'process' | 'finish';

interface Booking {
  id: string;
  ticketCode: string;
  service: string;
  vehicle: string;
  date: string;
  status: BookingStatus;
}

// ---------------------------------------------------------------------------
// Mock data — nanti ganti fetch dari Supabase, filter by user_id yang login
// ---------------------------------------------------------------------------

const MOCK_BOOKINGS: Booking[] = [
  { id: '1', ticketCode: 'TBG-0231', service: 'Ganti kampas rem', vehicle: 'Honda Beat', date: '24 Jul 2026', status: 'process' },
  { id: '2', ticketCode: 'TBG-0228', service: 'Servis rutin', vehicle: 'Toyota Avanza', date: '22 Jul 2026', status: 'pending' },
  { id: '3', ticketCode: 'TBG-0219', service: 'Ganti oli + filter', vehicle: 'Honda Beat', date: '15 Jul 2026', status: 'finish' },
];

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: 'Pending',
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

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ServisScreen() {
  const router = useRouter();

  const activeBookings = MOCK_BOOKINGS.filter((b) => b.status !== 'finish');
  const finishedBookings = MOCK_BOOKINGS.filter((b) => b.status === 'finish');

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ---------- Header ---------- */}
        <View style={styles.header}>
          <View style={styles.headerIconCircle}>
            <Wrench size={20} color={colors.textOnPrimary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Servis kamu</Text>
            <Text style={styles.headerSubtitle}>Semua booking &amp; riwayat servis</Text>
          </View>
        </View>

        {/* ---------- Booking aktif ---------- */}
        {activeBookings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Sedang berjalan</Text>
            {activeBookings.map((booking) => {
              const StatusIcon = STATUS_ICON[booking.status];
              return (
                <TouchableOpacity
                  key={booking.id}
                  style={styles.ticketCard}
                  onPress={() => router.push({ pathname: '/booking/[id]', params: { id: booking.id } })}
                  activeOpacity={0.85}
                >
                  <View style={styles.ticketAccentBar} />
                  <View style={styles.ticketLeft}>
                    <Text style={styles.ticketCode}>{booking.ticketCode}</Text>
                    <Text style={styles.ticketService}>{booking.service}</Text>
                    <Text style={styles.ticketMeta}>{booking.vehicle} · {booking.date}</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: `${STATUS_COLOR[booking.status]}22` }]}>
                    <StatusIcon size={12} color={STATUS_COLOR[booking.status]} />
                    <Text style={[styles.statusText, { color: STATUS_COLOR[booking.status] }]}>
                      {STATUS_LABEL[booking.status]}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ---------- Riwayat selesai ---------- */}
        {finishedBookings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Riwayat</Text>
            {finishedBookings.map((booking) => {
              const StatusIcon = STATUS_ICON[booking.status];
              return (
                <TouchableOpacity
                  key={booking.id}
                  style={styles.ticketCard}
                  onPress={() => router.push({ pathname: '/booking/[id]', params: { id: booking.id } })}
                  activeOpacity={0.85}
                >
                  <View style={styles.ticketAccentBar} />
                  <View style={styles.ticketLeft}>
                    <Text style={styles.ticketCode}>{booking.ticketCode}</Text>
                    <Text style={styles.ticketService}>{booking.service}</Text>
                    <Text style={styles.ticketMeta}>{booking.vehicle} · {booking.date}</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: `${STATUS_COLOR[booking.status]}22` }]}>
                    <StatusIcon size={12} color={STATUS_COLOR[booking.status]} />
                    <Text style={[styles.statusText, { color: STATUS_COLOR[booking.status] }]}>
                      {STATUS_LABEL[booking.status]}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {MOCK_BOOKINGS.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Belum ada booking servis</Text>
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
    gap: 12,
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

  emptyState: {
    marginTop: 60,
    alignItems: 'center',
  },
  emptyStateText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});