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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Wrench,
  ChevronRight,
  Clock3,
  Loader2,
  CheckCircle2,
  Bike,
  Car,
  CalendarClock,
} from 'lucide-react-native';
import { colors } from '../../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const AD_WIDTH = SCREEN_WIDTH - 56;
const VEHICLE_WIDTH = SCREEN_WIDTH - 60;

type BookingStatus = 'pending' | 'process' | 'finish';
type VehicleType = 'motor' | 'mobil';

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

interface Vehicle {
  id: string;
  type: VehicleType;
  name: string;
  plate: string;
  lastService: string;
  lastServiceType: string;
  nextServiceEstimate: string;
  dueSoon: boolean;
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
  { id: '2', title: 'Servis AC mobil', subtitle: 'Gratis cek freon', color: colors.primaryDark },
  { id: '3', title: 'Member baru dapat 500 poin', subtitle: 'Daftar sekarang', color: colors.primaryLight },
];

const MOCK_VEHICLES: Vehicle[] = [
  {
    id: '1',
    type: 'motor',
    name: 'Yamaha Aerox',
    plate: 'B 1234 ATR',
    lastService: '15 Jul 2026',
    lastServiceType: 'Ganti oli',
    nextServiceEstimate: '~2 minggu lagi',
    dueSoon: true,
  },
  {
    id: '2',
    type: 'mobil',
    name: 'Toyota Avanza',
    plate: 'B 1187 XYZ',
    lastService: '22 Jul 2026',
    lastServiceType: 'Servis rutin',
    nextServiceEstimate: '~1.5 bulan lagi',
    dueSoon: false,
  },
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

const STATUS_ICON: Record<BookingStatus, React.ComponentType<any>> = {
  pending: Clock3,
  process: Loader2,
  finish: CheckCircle2,
};

const VEHICLE_ICON: Record<VehicleType, React.ComponentType<any>> = {
  motor: Bike,
  mobil: Car,
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeAdIndex, setActiveAdIndex] = useState(0);
  const [activeVehicleIndex, setActiveVehicleIndex] = useState(0);
  const adListRef = useRef<FlatList<Ad>>(null);
  const vehicleListRef = useRef<FlatList<Vehicle>>(null);

  const handleAdScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / (AD_WIDTH + CARD_GAP));
    setActiveAdIndex(index);
  };

  const handleVehicleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / (VEHICLE_WIDTH + CARD_GAP));
    setActiveVehicleIndex(index);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ---------- Hero: full-bleed oren, profil + poin dalam satu row ---------- */}
        <View style={[styles.hero, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity style={styles.heroTopRow} onPress={() => router.push('/profile' as any)} activeOpacity={0.8}>
            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{MOCK_USER.avatarInitials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.greeting}>Halo, {MOCK_USER.name.split(' ')[0]}</Text>
                <Text style={styles.memberTier}>{MOCK_USER.memberTier}</Text>
              </View>
            </View>

            <View style={styles.pointsBadge}>
              <Text style={styles.pointsValue}>{MOCK_USER.points.toLocaleString('id-ID')}</Text>
              <Text style={styles.pointsLabel}>poin</Text>
            </View>
          </TouchableOpacity>

          {/* aksen dekoratif biar hero ga flat */}
          <View style={styles.heroDecoCircleLarge} />
          <View style={styles.heroDecoCircleSmall} />
        </View>

        {/* ---------- Ads carousel — overlap ke hero ---------- */}
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
          style={styles.adList}
          renderItem={({ item }) => (
            <View style={[styles.adCard, { backgroundColor: item.color, width: AD_WIDTH }]}>
              <View style={styles.adDecoCircle} />
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

        {/* ---------- Quick stats: antrian ---------- */}
        <View style={[styles.sectionPadding, styles.statsRow]}>
          <View style={[styles.statCard, styles.statCardWide]}>
            <View style={styles.statIconCircle}>
              <Clock3 size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statLabel}>Antrian hari ini</Text>
              <Text style={styles.statSubtitle}>
                Posisi #{MOCK_QUEUE.position} dari {MOCK_QUEUE.totalWaiting}
              </Text>
            </View>
            <View style={styles.statHighlight}>
              <Text style={styles.statHighlightValue}>{MOCK_QUEUE.estimatedWaitMinutes}</Text>
              <Text style={styles.statHighlightLabel}>menit</Text>
            </View>
          </View>
        </View>

        {/* ---------- Kendaraan aktif + riwayat & reminder servis ---------- */}
        <View style={[styles.sectionPadding, { marginTop: 24, marginBottom: 0 }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeadingRow}>
              <View style={styles.sectionAccentBar} />
              <Text style={styles.sectionHeading}>Kendaraan kamu</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/vehicles' as any)}>
              <Text style={styles.sectionLink}>Kelola</Text>
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          ref={vehicleListRef}
          data={MOCK_VEHICLES}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={VEHICLE_WIDTH + CARD_GAP}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: 20, gap: CARD_GAP }}
          onScroll={handleVehicleScroll}
          scrollEventThrottle={16}
          style={{ marginTop: 12 }}
          renderItem={({ item }) => {
            const VehicleIcon = VEHICLE_ICON[item.type];
            return (
              <View style={[styles.vehicleCard, { width: VEHICLE_WIDTH }]}>
                <View style={styles.vehicleTopRow}>
                  <View style={styles.vehicleIconCircle}>
                    <VehicleIcon size={20} color={colors.primaryDark} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.vehicleName}>{item.name}</Text>
                    <Text style={styles.vehiclePlate}>{item.plate}</Text>
                  </View>
                  {item.dueSoon && (
                    <View style={styles.dueBadge}>
                      <Text style={styles.dueBadgeText}>Segera servis</Text>
                    </View>
                  )}
                </View>
                <View style={styles.vehicleDivider} />
                <View style={styles.vehicleInfoRow}>
                  <CheckCircle2 size={14} color={colors.textSecondary} />
                  <Text style={styles.vehicleInfoText}>
                    Terakhir servis: {item.lastServiceType} · {item.lastService}
                  </Text>
                </View>
                <View style={styles.vehicleInfoRow}>
                  <CalendarClock size={14} color={item.dueSoon ? colors.primary : colors.textSecondary} />
                  <Text
                    style={[
                      styles.vehicleInfoText,
                      item.dueSoon && { color: colors.primaryDark, fontWeight: '600' },
                    ]}
                  >
                    Servis berikutnya: {item.nextServiceEstimate}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.vehicleCta}
                  onPress={() => router.push('/booking/create' as any)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.vehicleCtaText}>Booking servis kendaraan ini</Text>
                  <ChevronRight size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            );
          }}
        />
        <View style={styles.dotsRow}>
          {MOCK_VEHICLES.map((_, i) => (
            <View key={i} style={[styles.dot, i === activeVehicleIndex && styles.dotActive]} />
          ))}
        </View>
        <View style={styles.sectionPadding}>
          <TouchableOpacity
            style={styles.bookingButton}
            onPress={() => router.push('/booking/create' as any)}
            activeOpacity={0.85}
          >
            <Wrench size={18} color={colors.textOnPrimary} />
            <Text style={styles.bookingButtonText}>Buat booking servis</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.sectionPadding}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeadingRow}>
              <View style={styles.sectionAccentBar} />
              <Text style={styles.sectionHeading}>Booking kamu</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/booking' as any)}>
              <Text style={styles.sectionLink}>Lihat semua</Text>
            </TouchableOpacity>
          </View>
          {MOCK_BOOKINGS.map((booking) => {
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 40,
  },
  sectionPadding: {
    paddingHorizontal: 20,
    marginTop: 24,
  },

  // Hero
  hero: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 20,
    paddingBottom: 44,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.textOnPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  greeting: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  memberTier: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    marginTop: 2,
  },
  pointsBadge: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 64,
  },
  pointsValue: {
    color: colors.textOnPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  pointsLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    marginTop: 1,
  },
  heroDecoCircleLarge: {
    position: 'absolute',
    top: -60,
    right: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  heroDecoCircleSmall: {
    position: 'absolute',
    bottom: -30,
    left: -20,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  // Ads
  adList: {
    marginTop: -26,
  },
  adCard: {
    borderRadius: 18,
    padding: 18,
    height: 112,
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: colors.primaryDarker,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  adDecoCircle: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  adTitle: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  adSubtitle: {
    color: colors.textOnPrimary,
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

  // Stats
  statsRow: {
    flexDirection: 'row',
  },
  statCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: colors.primaryDarker,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  statCardWide: {
    flex: 1,
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  statSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  statHighlight: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  statHighlightValue: {
    color: colors.primaryDark,
    fontSize: 18,
    fontWeight: '700',
  },
  statHighlightLabel: {
    color: colors.textSecondary,
    fontSize: 10,
  },

  // Vehicle card
  vehicleCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    shadowColor: colors.primaryDarker,
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.card,
  },
  vehicleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vehicleIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  vehiclePlate: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  dueBadge: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  dueBadgeText: {
    color: colors.textOnPrimary,
    fontSize: 10,
    fontWeight: '700',
  },
  vehicleDivider: {
    height: 1,
    backgroundColor: colors.card,
    marginVertical: 14,
  },
  vehicleInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  vehicleInfoText: {
    color: colors.textSecondary,
    fontSize: 12.5,
    flexShrink: 1,
  },
  vehicleCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 6,
  },
  vehicleCtaText: {
    color: colors.primaryDark,
    fontSize: 12.5,
    fontWeight: '700',
  },

  // Booking CTA
  bookingButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.primaryDarker,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  bookingButtonText: {
    color: colors.textOnPrimary,
    fontSize: 15,
    fontWeight: '700',
  },

  // Section heading
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionAccentBar: {
    width: 4,
    height: 16,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  sectionHeading: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  sectionLink: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '600',
  },

  // Ticket / booking card
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
});