import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Bike,
  Car,
  Clock3,
  ClipboardCheck,
  Search,
  Wrench,
  PartyPopper,
  MessageSquareText,
  AlertCircle,
} from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { bookingService, Booking } from '../../services/bookingService';

// ---------------------------------------------------------------------------
// Types & progress stage mapping
// ---------------------------------------------------------------------------

type Stage = 'checkin' | 'diagnosa' | 'pengerjaan' | 'selesai';

const STAGES: { key: Stage; label: string; icon: React.ComponentType<any> }[] = [
  { key: 'checkin', label: 'Checked-in', icon: ClipboardCheck },
  { key: 'diagnosa', label: 'Diagnosa', icon: Search },
  { key: 'pengerjaan', label: 'Pengerjaan', icon: Wrench },
  { key: 'selesai', label: 'Selesai', icon: PartyPopper },
];

// Map backend status string to progress stage index
function getStageIndex(status: string): number {
  const s = status.toLowerCase();
  if (s === 'selesai' || s === 'finish' || s === 'completed' || s === 'done') return 3;
  if (s === 'diproses' || s === 'process' || s === 'in_progress' || s === 'dikerjakan') return 2;
  if (s === 'diagnosa') return 1;
  return 0; // 'Menunggu' / checked-in
}

// Detect vehicle type from brand name
function getVehicleType(brand: string): 'motor' | 'mobil' {
  const motorBrands = ['honda beat', 'vario', 'scoopy', 'nmax', 'aerox', 'pcx', 'mio', 'jupiter', 'satria', 'cbr', 'ninja', 'r15', 'vespa'];
  const lowerBrand = brand.toLowerCase();
  if (motorBrands.some((m) => lowerBrand.includes(m))) return 'motor';
  // If brand is a typical motorcycle brand
  const motoManufacturers = ['yamaha', 'kawasaki', 'suzuki', 'tvs', 'piaggio'];
  if (motoManufacturers.some((m) => lowerBrand.includes(m))) return 'motor';
  // Honda could be either - check if model contains motorcycle terms
  if (lowerBrand.includes('honda') && !lowerBrand.includes('civic') && !lowerBrand.includes('jazz') && !lowerBrand.includes('crv') && !lowerBrand.includes('hrv') && !lowerBrand.includes('brv') && !lowerBrand.includes('brio')) {
    return 'motor';
  }
  return 'mobil';
}

const VEHICLE_ICON = { motor: Bike, mobil: Car };

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function BookingDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!id) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await bookingService.getBookingById(Number(id));
        setBooking(data);
      } catch (err: any) {
        setError(err.message || 'Gagal memuat detail booking');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
            <ArrowLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Detail servis</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.centerStateText}>Memuat detail...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !booking) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
            <ArrowLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Detail servis</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.centerState}>
          <AlertCircle size={40} color={colors.error} />
          <Text style={styles.centerStateText}>{error || 'Booking tidak ditemukan'}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.retryButton} activeOpacity={0.85}>
            <Text style={styles.retryButtonText}>Kembali</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Build display data from API response
  const vehicleName = booking.vehicle_brand && booking.vehicle_model
    ? `${booking.vehicle_brand} ${booking.vehicle_model}`
    : 'Kendaraan';
  const vehiclePlate = booking.license_plate || '-';
  const vehicleType = getVehicleType(vehicleName);
  const VehicleIcon = VEHICLE_ICON[vehicleType];
  const currentStageIndex = getStageIndex(booking.status);
  const isFinished = currentStageIndex >= STAGES.length - 1;
  const serviceName = booking.service_name || 'Servis';

  // Format booking time for display
  const formatBookingTime = () => {
    try {
      const date = new Date(booking.booking_date);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} · ${booking.booking_time}`;
    } catch {
      return `${booking.booking_date} · ${booking.booking_time}`;
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ---------- Top bar ---------- */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
            <ArrowLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Detail servis</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* ---------- Info kendaraan ---------- */}
        <View style={styles.vehicleHeader}>
          <View style={styles.vehicleIconCircle}>
            <VehicleIcon size={22} color={colors.primaryDark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.vehicleName}>{vehicleName}</Text>
            <Text style={styles.vehiclePlate}>{vehiclePlate} · {booking.booking_code}</Text>
          </View>
        </View>

        {/* ---------- Progress bar 4 tahap ---------- */}
        <View style={styles.progressCard}>
          <View style={styles.progressRow}>
            {STAGES.map((stage, index) => {
              const StageIcon = stage.icon;
              const isDone = index < currentStageIndex;
              const isActive = index === currentStageIndex;
              const isUpcoming = index > currentStageIndex;

              return (
                <React.Fragment key={stage.key}>
                  <View style={styles.stageColumn}>
                    <View
                      style={[
                        styles.stageCircle,
                        isDone && styles.stageCircleDone,
                        isActive && styles.stageCircleActive,
                        isUpcoming && styles.stageCircleUpcoming,
                      ]}
                    >
                      <StageIcon
                        size={16}
                        color={isUpcoming ? colors.textMuted : colors.textOnPrimary}
                      />
                    </View>
                    <Text
                      style={[
                        styles.stageLabel,
                        isActive && styles.stageLabelActive,
                        isUpcoming && styles.stageLabelUpcoming,
                      ]}
                    >
                      {stage.label}
                    </Text>
                  </View>

                  {index < STAGES.length - 1 && (
                    <View
                      style={[
                        styles.stageConnector,
                        index < currentStageIndex && styles.stageConnectorDone,
                      ]}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </View>
        </View>

        {/* ---------- Jadwal booking ---------- */}
        <View style={styles.estimateCard}>
          <View style={styles.estimateIconCircle}>
            <Clock3 size={18} color={colors.textOnPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.estimateLabel}>
              {isFinished ? 'Kendaraan sudah selesai' : 'Jadwal booking'}
            </Text>
            <Text style={styles.estimateValue}>{formatBookingTime()}</Text>
          </View>
        </View>

        {/* ---------- Jenis servis ---------- */}
        <View style={styles.infoBlock}>
          <Text style={styles.infoBlockLabel}>Jenis servis</Text>
          <Text style={styles.infoBlockValue}>{serviceName}</Text>
        </View>

        {/* ---------- Status ---------- */}
        <View style={styles.infoBlock}>
          <Text style={styles.infoBlockLabel}>Status</Text>
          <Text style={[styles.infoBlockValue, { color: colors.primary }]}>{booking.status}</Text>
        </View>

        {/* ---------- Catatan — hanya muncul kalau ada ---------- */}
        {booking.notes ? (
          <View style={styles.noteCard}>
            <MessageSquareText size={16} color={colors.primaryDark} />
            <Text style={styles.noteText}>{booking.notes}</Text>
          </View>
        ) : null}
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

  // Center state (loading/error)
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 80,
  },
  centerStateText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 14,
    marginTop: 4,
  },
  retryButtonText: {
    color: colors.textOnPrimary,
    fontWeight: '700',
    fontSize: 14,
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 20,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.card,
  },
  topBarTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },

  // Vehicle header
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  vehicleIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleName: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  vehiclePlate: {
    color: colors.textSecondary,
    fontSize: 12.5,
    marginTop: 2,
  },

  // Progress card
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 12,
    shadowColor: colors.primaryDarker,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stageColumn: {
    alignItems: 'center',
    width: 60,
  },
  stageCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageCircleDone: {
    backgroundColor: colors.primaryDark,
  },
  stageCircleActive: {
    backgroundColor: colors.primary,
  },
  stageCircleUpcoming: {
    backgroundColor: colors.card,
  },
  stageLabel: {
    color: colors.textPrimary,
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  stageLabelActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  stageLabelUpcoming: {
    color: colors.textMuted,
    fontWeight: '500',
  },
  stageConnector: {
    flex: 1,
    height: 2,
    backgroundColor: colors.card,
    marginTop: 17,
    marginHorizontal: -8,
  },
  stageConnectorDone: {
    backgroundColor: colors.primaryDark,
  },

  // Estimate card
  estimateCard: {
    backgroundColor: colors.primaryDark,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  estimateIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  estimateLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  estimateValue: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },

  // Info block
  infoBlock: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 0.5,
    borderColor: colors.card,
  },
  infoBlockLabel: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  infoBlockValue: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },

  // Note card
  noteCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.primarySoft,
    borderRadius: 16,
    padding: 14,
    marginTop: 16,
  },
  noteText: {
    flex: 1,
    color: colors.primaryDarker,
    fontSize: 12.5,
    lineHeight: 18,
  },
});