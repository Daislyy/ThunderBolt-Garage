import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors'

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const AD_WIDTH = SCREEN_WIDTH - 40;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BookingStatus = 'pending' | 'process' | 'finish';

interface Booking {
  id: string;
  ticketCode: string;
  service: string;
  vehicle: string;
  date: string;
  status: BookingStatus;
}

interface Ad {
  id: string;
  title: string;
  subtitle: string;
  color: string;
}

// ---------------------------------------------------------------------------
// Mock data — ganti dengan fetch dari backend
// ---------------------------------------------------------------------------

const MOCK_USER = {
  name: 'Attar Ramadhan',
  avatarInitials: 'AR',
  points: 1250,
  memberTier: 'Gold Member',
};

const MOCK_QUEUE = {
  position: 3,
  totalWaiting: 7,
  estimatedWaitMinutes: 40,
};

const MOCK_ADS: Ad[] = [
  { id: '1', title: 'Diskon ganti oli 20%', subtitle: 'Berlaku sampai akhir bulan', color: colors.primary },
  { id: '2', title: 'Servis AC mobil', subtitle: 'Gratis cek freon', color: colors.secondary },
  { id: '3', title: 'Member baru dapat 500 poin', subtitle: 'Daftar sekarang', color: colors.success },
];

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

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function HomeScreen() {
  const router = useRouter();
  const [activeAdIndex, setActiveAdIndex] = useState(0);
  const adListRef = useRef<FlatList<Ad>>(null);

  const handleAdScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / (AD_WIDTH + CARD_GAP));
    setActiveAdIndex(index);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ---------- Header: profile + points ---------- */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.profileRow} onPress={() => router.push('/profile')}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{MOCK_USER.avatarInitials}</Text>
            </View>
            <View>
              <Text style={styles.greeting}>Halo, {MOCK_USER.name.split(' ')[0]}</Text>
              <Text style={styles.memberTier}>{MOCK_USER.memberTier}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.pointsBadge}>
            <Text style={styles.pointsValue}>{MOCK_USER.points.toLocaleString('id-ID')}</Text>
            <Text style={styles.pointsLabel}>poin</Text>
          </View>
        </View>

        {/* ---------- Ad slider ---------- */}
        <FlatList
          ref={adListRef}
          data={MOCK_ADS}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={AD_WIDTH + CARD_GAP}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: 20, gap: CARD_GAP }}
          onScroll={handleAdScroll}
          scrollEventThrottle={16}
          style={{ marginTop: 20 }}
          renderItem={({ item }) => (
            <View style={[styles.adCard, { backgroundColor: item.color, width: AD_WIDTH }]}>
              <Text style={styles.adTitle}>{item.title}</Text>
              <Text style={styles.adSubtitle}>{item.subtitle}</Text>
            </View>
          )}
        />
        <View style={styles.dotsRow}>
          {MOCK_ADS.map((_, i) => (
            <View key={i} style={[styles.dot, i === activeAdIndex && styles.dotActive]} />
          ))}
        </View>

        {/* ---------- Antrian bengkel ---------- */}
        <View style={styles.sectionPadding}>
          <View style={styles.queueCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.queueTitle}>Antrian bengkel hari ini</Text>
              <Text style={styles.queueSubtitle}>
                Posisi kamu #{MOCK_QUEUE.position} dari {MOCK_QUEUE.totalWaiting} kendaraan
              </Text>
            </View>
            <View style={styles.queueEta}>
              <Text style={styles.queueEtaValue}>{MOCK_QUEUE.estimatedWaitMinutes}</Text>
              <Text style={styles.queueEtaLabel}>menit</Text>
            </View>
          </View>
        </View>

        {/* ---------- CTA booking ---------- */}
        <View style={styles.sectionPadding}>
          <TouchableOpacity style={styles.bookingButton} onPress={() => router.push('/booking/create')}>
            <Text style={styles.bookingButtonText}>Buat booking servis</Text>
          </TouchableOpacity>
        </View>

        {/* ---------- Booking list / tiket ---------- */}
        <View style={styles.sectionPadding}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Booking kamu</Text>
            <TouchableOpacity onPress={() => router.push('/booking')}>
              <Text style={styles.sectionLink}>Lihat semua</Text>
            </TouchableOpacity>
          </View>

          {MOCK_BOOKINGS.map((booking) => (
            <TouchableOpacity
              key={booking.id}
              style={styles.ticketCard}
              onPress={() => router.push(`/booking/${booking.id}`)}
            >
              <View style={styles.ticketLeft}>
                <Text style={styles.ticketCode}>{booking.ticketCode}</Text>
                <Text style={styles.ticketService}>{booking.service}</Text>
                <Text style={styles.ticketMeta}>{booking.vehicle} · {booking.date}</Text>
              </View>

              <View style={[styles.statusPill, { backgroundColor: `${STATUS_COLOR[booking.status]}1A` }]}>
                <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[booking.status] }]} />
                <Text style={[styles.statusText, { color: STATUS_COLOR[booking.status] }]}>
                  {STATUS_LABEL[booking.status]}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
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
    paddingTop: 16,
    paddingBottom: 40,
  },
  sectionPadding: {
    paddingHorizontal: 20,
    marginTop: 24,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.surface,
    fontWeight: '600',
    fontSize: 15,
  },
  greeting: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  memberTier: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  pointsBadge: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 64,
  },
  pointsValue: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  pointsLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 1,
  },

  // Ads
  adCard: {
    borderRadius: 16,
    padding: 18,
    height: 110,
    justifyContent: 'center',
  },
  adTitle: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700',
  },
  adSubtitle: {
    color: colors.surface,
    fontSize: 12,
    marginTop: 4,
    opacity: 0.9,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.card,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 16,
  },

  // Queue
  queueCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: colors.card,
  },
  queueTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  queueSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  queueEta: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  queueEtaValue: {
    color: colors.secondary,
    fontSize: 18,
    fontWeight: '700',
  },
  queueEtaLabel: {
    color: colors.textSecondary,
    fontSize: 10,
  },

  // Booking CTA
  bookingButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  bookingButtonText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '600',
  },

  // Section heading
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeading: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  sectionLink: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: '500',
  },

  // Ticket / booking card
  ticketCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: colors.card,
  },
  ticketLeft: {
    flex: 1,
    paddingRight: 8,
  },
  ticketCode: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  ticketService: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
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
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});