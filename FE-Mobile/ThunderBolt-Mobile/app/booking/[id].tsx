import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
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
} from 'lucide-react-native';
import { colors } from '../../constants/colors';

// ---------------------------------------------------------------------------
// Types & mock data — ganti dengan fetch dari backend pakai params.id
// ---------------------------------------------------------------------------

type Stage = 'checkin' | 'diagnosa' | 'pengerjaan' | 'selesai';

const STAGES: { key: Stage; label: string; icon: React.ComponentType<any> }[] = [
  { key: 'checkin', label: 'Checked-in', icon: ClipboardCheck },
  { key: 'diagnosa', label: 'Diagnosa', icon: Search },
  { key: 'pengerjaan', label: 'Pengerjaan', icon: Wrench },
  { key: 'selesai', label: 'Selesai', icon: PartyPopper },
];

const MOCK_BOOKING_DETAIL = {
  ticketCode: 'TBG-0231',
  vehicleName: 'Honda Beat',
  vehiclePlate: 'B 3421 ATR',
  vehicleType: 'motor' as 'motor' | 'mobil',
  serviceType: 'Ganti kampas rem',
  currentStageIndex: 2, // 0=checkin, 1=diagnosa, 2=pengerjaan, 3=selesai
  estimatedFinish: '15.30 WIB',
  mechanicNote: 'Ditemukan kebocoran kecil di seal rem belakang, disarankan sekalian diganti.',
};

const VEHICLE_ICON = { motor: Bike, mobil: Car };

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function BookingDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // TODO: fetch booking by id dari Supabase, fallback ke mock buat sekarang
  const booking = MOCK_BOOKING_DETAIL;
  const VehicleIcon = VEHICLE_ICON[booking.vehicleType];
  const isFinished = booking.currentStageIndex >= STAGES.length - 1;

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
            <Text style={styles.vehicleName}>{booking.vehicleName}</Text>
            <Text style={styles.vehiclePlate}>{booking.vehiclePlate} · {booking.ticketCode}</Text>
          </View>
        </View>

        {/* ---------- Progress bar 4 tahap ---------- */}
        <View style={styles.progressCard}>
          <View style={styles.progressRow}>
            {STAGES.map((stage, index) => {
              const StageIcon = stage.icon;
              const isDone = index < booking.currentStageIndex;
              const isActive = index === booking.currentStageIndex;
              const isUpcoming = index > booking.currentStageIndex;

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
                        index < booking.currentStageIndex && styles.stageConnectorDone,
                      ]}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </View>
        </View>

        {/* ---------- Estimasi selesai ---------- */}
        <View style={styles.estimateCard}>
          <View style={styles.estimateIconCircle}>
            <Clock3 size={18} color={colors.textOnPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.estimateLabel}>
              {isFinished ? 'Kendaraan sudah selesai' : 'Estimasi selesai'}
            </Text>
            <Text style={styles.estimateValue}>{booking.estimatedFinish}</Text>
          </View>
        </View>

        {/* ---------- Jenis servis ---------- */}
        <View style={styles.infoBlock}>
          <Text style={styles.infoBlockLabel}>Jenis servis</Text>
          <Text style={styles.infoBlockValue}>{booking.serviceType}</Text>
        </View>

        {/* ---------- Catatan mekanik — cuma muncul kalau ada ---------- */}
        {booking.mechanicNote ? (
          <View style={styles.noteCard}>
            <MessageSquareText size={16} color={colors.primaryDark} />
            <Text style={styles.noteText}>{booking.mechanicNote}</Text>
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