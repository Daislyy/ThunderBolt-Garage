// app/booking/[id].tsx
// Halaman detail pesanan booking servis: pelacakan status pengerjaan (5 tahap), rincian suku cadang, pembayaran tunai/Midtrans Snap, cetak/lihat resi digital, pembatalan, dan pemberian rating ulasan.
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
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
  Package,
  CreditCard,
  Banknote,
  CheckCircle2,
  Star,
  RefreshCw,
  Receipt,
  X,
  ShieldCheck,
} from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { bookingService, Booking } from '../../services/bookingService';
import { sparepartService, BookingSparepart } from '../../services/sparepartService';
import { paymentService } from '../../services/paymentService';
import { ratingService, Rating } from '../../services/ratingService';

// ---------------------------------------------------------------------------
// Tipe & Pemetaan 5 Tahap Progres Servis (Check-in -> Diagnosa -> Pengerjaan -> Pembayaran -> Selesai)
// ---------------------------------------------------------------------------

type Stage = 'checkin' | 'diagnosa' | 'pengerjaan' | 'pembayaran' | 'selesai';

const STAGES: { key: Stage; label: string; icon: React.ComponentType<any> }[] = [
  { key: 'checkin', label: 'Checked-in', icon: ClipboardCheck },
  { key: 'diagnosa', label: 'Diagnosa', icon: Search },
  { key: 'pengerjaan', label: 'Pengerjaan', icon: Wrench },
  { key: 'pembayaran', label: 'Pembayaran', icon: Banknote },
  { key: 'selesai', label: 'Selesai', icon: PartyPopper },
];

function getStageIndex(status: string): number {
  const s = (status || '').toLowerCase();
  if (s === 'selesai' || s === 'finish' || s === 'completed' || s === 'done') return 4;
  if (s === 'menunggu pembayaran' || s === 'payment' || s === 'menunggu konfirmasi') return 3;
  if (s === 'diproses' || s === 'process' || s === 'in_progress' || s === 'dikerjakan') return 2;
  if (s === 'diagnosa') return 1;
  return 0; // 'Menunggu' / checked-in
}

function getVehicleType(brand: string): 'motor' | 'mobil' {
  const motorBrands = ['honda beat', 'vario', 'scoopy', 'nmax', 'aerox', 'pcx', 'mio', 'jupiter', 'satria', 'cbr', 'ninja', 'r15', 'vespa'];
  const lowerBrand = (brand || '').toLowerCase();
  if (motorBrands.some((m) => lowerBrand.includes(m))) return 'motor';
  const motoManufacturers = ['yamaha', 'kawasaki', 'suzuki', 'tvs', 'piaggio'];
  if (motoManufacturers.some((m) => lowerBrand.includes(m))) return 'motor';
  if (lowerBrand.includes('honda') && !lowerBrand.includes('civic') && !lowerBrand.includes('jazz') && !lowerBrand.includes('crv') && !lowerBrand.includes('hrv') && !lowerBrand.includes('brv') && !lowerBrand.includes('brio')) {
    return 'motor';
  }
  return 'mobil';
}

const VEHICLE_ICON = { motor: Bike, mobil: Car };

export default function BookingDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [parts, setParts] = useState<BookingSparepart[]>([]);
  const [partsTotal, setPartsTotal] = useState(0);
  const [existingRating, setExistingRating] = useState<Rating | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment states
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Receipt Modal state (matching Web Frontend)
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Rating Modal states
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [ratingScore, setRatingScore] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const fetchDetail = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [bookingData, sparepartsRes, userRatings] = await Promise.all([
        bookingService.getBookingById(Number(id)),
        sparepartService.getBookingSpareparts(Number(id)).catch(() => ({ spareparts: [], total_price: 0 })),
        user?.id ? ratingService.getRatingsByUser(user.id).catch(() => []) : Promise.resolve([]),
      ]);

      setBooking(bookingData);
      setParts(sparepartsRes.spareparts || []);
      setPartsTotal(sparepartsRes.total_price || 0);

      const foundRating = (userRatings || []).find(
        (r) =>
          Number(r.booking_id) === Number(id) ||
          (bookingData?.booking_code && r.booking_code === bookingData.booking_code)
      );
      if (foundRating) {
        setExistingRating(foundRating);
      } else if (bookingData?.booking_code) {
        // Fallback cek rating berdasarkan kode booking
        const matchByCode = await ratingService.getRatingByBooking(bookingData.booking_code, user?.id);
        if (matchByCode) setExistingRating(matchByCode);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat detail booking');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id, user?.id]);

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

  const vehicleName = booking.vehicle_brand && booking.vehicle_model
    ? `${booking.vehicle_brand} ${booking.vehicle_model}`
    : 'Kendaraan';
  const vehiclePlate = booking.license_plate || '-';
  const vehicleType = getVehicleType(vehicleName);
  const VehicleIcon = VEHICLE_ICON[vehicleType];
  const currentStageIndex = getStageIndex(booking.status);
  const isFinished = (booking.status || '').toLowerCase() === 'selesai';
  const isWaitingPayment = (booking.status || '').toLowerCase() === 'menunggu pembayaran';
  const isCancelled = (booking.status || '').toLowerCase() === 'dibatalkan';
  const serviceName = booking.service_name || 'Servis';
  const servicePrice = Number(booking.service_price || 100000);
  const grandTotal = Number(booking.total_price) || (servicePrice + partsTotal);

  const formatBookingTime = () => {
    try {
      const date = new Date(booking.booking_date);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} · ${booking.booking_time}`;
    } catch {
      return `${booking.booking_date} · ${booking.booking_time}`;
    }
  };

  const handlePayCash = async () => {
    Alert.alert(
      'Konfirmasi Bayar di Kasir',
      'Apakah Anda ingin melakukan pembayaran tunai di kasir bengkel? Status booking akan dialihkan ke "Menunggu Pembayaran".',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Bayar Cash',
          onPress: async () => {
            setIsProcessingPayment(true);
            try {
              await paymentService.recordCashPayment(booking.id, grandTotal, booking.booking_code);
              Alert.alert('Berhasil!', 'Permintaan pembayaran cash telah dikirim ke admin bengkel. Silakan bayar di kasir saat mengambil kendaraan.');
              await fetchDetail();
            } catch (err: any) {
              Alert.alert('Gagal', err.message || 'Gagal memproses pembayaran cash.');
            } finally {
              setIsProcessingPayment(false);
            }
          },
        },
      ]
    );
  };

  const handlePayOnline = async () => {
    setIsProcessingPayment(true);
    try {
      const res = await paymentService.createSnapToken({
        booking_id: booking.id,
        booking_code: booking.booking_code,
        gross_amount: grandTotal,
        customer_name: booking.customer_name || user?.name,
        customer_email: booking.customer_email || user?.email,
        service_name: booking.service_name,
        service_price: servicePrice,
        parts: parts.map((p) => ({
          sparepart_id: p.sparepart_id,
          name: p.name,
          price: p.price,
          quantity: p.quantity,
        })),
      });

      if (res.redirect_url) {
        // Catat pembayaran lokal agar user langsung terfasilitasi riwayat bayar
        await paymentService.markBookingPaidLocally(booking.id, 'midtrans');
        if (booking.booking_code) {
          await paymentService.markBookingPaidLocally(booking.booking_code, 'midtrans');
        }

        await WebBrowser.openBrowserAsync(res.redirect_url);
        await fetchDetail();
      } else {
        Alert.alert('Error', 'Gagal memuat link pembayaran.');
      }
    } catch (err: any) {
      Alert.alert('Pembayaran Gagal', err.message || 'Terjadi kesalahan sistem pembayaran.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCancelBooking = () => {
    Alert.alert(
      'Batalkan Booking',
      'Apakah Anda yakin ingin membatalkan jadwal servis ini?',
      [
        { text: 'Kembali', style: 'cancel' },
        {
          text: 'Ya, Batalkan',
          style: 'destructive',
          onPress: async () => {
            setIsCancelling(true);
            try {
              await bookingService.cancelBooking(booking.id);
              Alert.alert('Booking Dibatalkan', 'Jadwal servis berhasil dibatalkan.');
              await fetchDetail();
            } catch (err: any) {
              Alert.alert('Gagal Membatalkan', err.message || 'Terjadi kesalahan saat membatalkan booking.');
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ]
    );
  };

  const handleSubmitRating = async () => {
    if (!user?.id || !booking.service_id) return;
    setIsSubmittingRating(true);
    try {
      const created = await ratingService.createRating({
        booking_id: booking.id,
        booking_code: booking.booking_code,
        user_id: user.id,
        customer_email: user.email,
        service_id: booking.service_id,
        service_name: booking.service_name,
        rating: ratingScore,
        review: reviewComment.trim(),
      });
      setExistingRating(created);
      setIsRatingModalOpen(false);
      Alert.alert('Terima Kasih!', 'Penilaian dan ulasan Anda telah tersimpan dan sangat berarti bagi kami.');
    } catch (err: any) {
      Alert.alert('Gagal', err.message || 'Gagal mengirimkan ulasan.');
    } finally {
      setIsSubmittingRating(false);
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
          <TouchableOpacity onPress={fetchDetail} style={styles.backButton} activeOpacity={0.7}>
            <RefreshCw size={18} color={colors.primary} />
          </TouchableOpacity>
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
          <View
            style={[
              styles.statusBadge,
              isFinished
                ? { backgroundColor: '#ECFDF5', borderColor: '#D1FAE5' }
                : isWaitingPayment
                  ? { backgroundColor: '#FFF7ED', borderColor: '#FFEDD5' }
                  : isCancelled
                    ? { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }
                    : { backgroundColor: colors.primarySoft, borderColor: colors.card },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                isFinished
                  ? { color: '#059669' }
                  : isWaitingPayment
                    ? { color: '#EA580C' }
                    : isCancelled
                      ? { color: '#DC2626' }
                      : { color: colors.primaryDark },
              ]}
            >
              {booking.status}
            </Text>
          </View>
        </View>

        {/* ---------- Progress bar tahapan ---------- */}
        {!isCancelled && (
          <View style={styles.progressCard}>
            <View style={styles.progressRow}>
              {STAGES.map((stage, index) => {
                const StageIcon = stage.icon;
                const isDone = index < currentStageIndex || isFinished;
                const isActive = index === currentStageIndex && !isFinished;
                const isUpcoming = index > currentStageIndex && !isFinished;

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
                          size={15}
                          color={isUpcoming ? colors.textMuted : colors.textOnPrimary}
                        />
                      </View>
                      <Text
                        style={[
                          styles.stageLabel,
                          isActive && styles.stageLabelActive,
                          isUpcoming && styles.stageLabelUpcoming,
                        ]}
                        numberOfLines={1}
                      >
                        {stage.label}
                      </Text>
                    </View>

                    {index < STAGES.length - 1 && (
                      <View
                        style={[
                          styles.stageConnector,
                          (index < currentStageIndex || isFinished) && styles.stageConnectorDone,
                        ]}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </View>
          </View>
        )}

        {/* ---------- Jadwal booking ---------- */}
        <View style={styles.estimateCard}>
          <View style={styles.estimateIconCircle}>
            <Clock3 size={18} color={colors.textOnPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.estimateLabel}>
              {isFinished ? 'Servis telah selesai' : 'Jadwal booking'}
            </Text>
            <Text style={styles.estimateValue}>{formatBookingTime()}</Text>
          </View>
        </View>

        {/* ---------- Rincian Biaya & Spareparts ---------- */}
        <View style={styles.billCard}>
          <View style={styles.billHeader}>
            <Text style={styles.billTitle}>Rincian Biaya & Layanan</Text>
          </View>

          {/* Jasa Servis */}
          <View style={styles.billRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.billItemName}>{serviceName}</Text>
              <Text style={styles.billItemSub}>Biaya Jasa Teknisi</Text>
            </View>
            <Text style={styles.billItemPrice}>Rp {servicePrice.toLocaleString('id-ID')}</Text>
          </View>

          {/* Suku Cadang Terpakai */}
          {parts.length > 0 && (
            <View style={styles.partsSection}>
              <View style={styles.partsTitleRow}>
                <Package size={14} color={colors.primary} />
                <Text style={styles.partsTitleText}>Suku Cadang Tambahan ({parts.length})</Text>
              </View>

              {parts.map((p, idx) => (
                <View key={idx} style={styles.partItemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.partItemName}>{p.name}</Text>
                    <Text style={styles.partItemQty}>
                      {p.quantity} x Rp {p.price.toLocaleString('id-ID')}
                    </Text>
                  </View>
                  <Text style={styles.partItemSubtotal}>
                    Rp {(p.price * p.quantity).toLocaleString('id-ID')}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.billDivider} />

          {/* Total Tagihan */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL PEMBAYARAN</Text>
            <Text style={styles.totalValue}>Rp {grandTotal.toLocaleString('id-ID')}</Text>
          </View>
        </View>

        {/* ---------- Tombol Struk Pembayaran (Jika status Selesai) ---------- */}
        {isFinished && (
          <TouchableOpacity
            style={styles.receiptButton}
            activeOpacity={0.88}
            onPress={() => setIsReceiptModalOpen(true)}
          >
            <Receipt size={18} color="#15803D" />
            <Text style={styles.receiptButtonText}>Lihat Bukti Pembayaran / Struk Servis</Text>
          </TouchableOpacity>
        )}

        {/* ---------- Catatan Booking ---------- */}
        {booking.notes ? (
          <View style={styles.noteCard}>
            <MessageSquareText size={16} color={colors.primaryDark} />
            <Text style={styles.noteText}>{booking.notes}</Text>
          </View>
        ) : null}

        {/* ---------- Tombol Batalkan Booking (Jika status masih Menunggu) ---------- */}
        {booking.status === 'Menunggu' && (
          <TouchableOpacity
            style={styles.cancelBookingBtn}
            activeOpacity={0.85}
            onPress={handleCancelBooking}
            disabled={isCancelling}
          >
            {isCancelling ? (
              <ActivityIndicator size="small" color="#DC2626" />
            ) : (
              <>
                <AlertCircle size={16} color="#DC2626" />
                <Text style={styles.cancelBookingBtnText}>Batalkan Jadwal Booking</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* ---------- Aksi Pembayaran (Jika belum selesai & belum dibatalkan) ---------- */}
        {!isFinished && !isCancelled && (
          <View style={styles.paymentActionSection}>
            <Text style={styles.paymentActionTitle}>Opsi Pembayaran</Text>
            <Text style={styles.paymentActionSubtitle}>
              Pilih metode bayar langsung di kasir atau online melalui Midtrans (QRIS/VA/Kartu).
            </Text>

            <View style={styles.paymentBtnRow}>
              <TouchableOpacity
                style={[styles.payCashBtn, isProcessingPayment && { opacity: 0.6 }]}
                activeOpacity={0.85}
                onPress={handlePayCash}
                disabled={isProcessingPayment}
              >
                <Banknote size={18} color="#EA580C" />
                <Text style={styles.payCashBtnText}>Bayar Kasir</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.payOnlineBtn, isProcessingPayment && { opacity: 0.6 }]}
                activeOpacity={0.88}
                onPress={handlePayOnline}
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <CreditCard size={18} color="#FFFFFF" />
                    <Text style={styles.payOnlineBtnText}>Bayar Online</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ---------- Review & Rating (Jika status Selesai) ---------- */}
        {isFinished && (
          <View style={[styles.ratingCard, !existingRating && styles.ratingCardHighlight]}>
            <View style={styles.ratingHeaderRow}>
              <View style={[styles.ratingIconCircle, !existingRating && { backgroundColor: '#FEF3C7' }]}>
                <Star size={20} color="#FF9500" fill="#FF9500" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ratingCardTitle}>
                  {existingRating ? 'Ulasan & Rating Layanan' : 'Servis Selesai! Berikan Penilaian'}
                </Text>
                <Text style={styles.ratingCardSubtitle}>
                  {existingRating
                    ? 'Terima kasih atas penilaian Anda!'
                    : 'Pembayaran telah dikonfirmasi dan servis telah selesai. Yuk beri rating untuk teknisi kami!'}
                </Text>
              </View>
            </View>

            {existingRating ? (
              <View style={styles.submittedRatingBox}>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={18}
                      color="#FF9500"
                      fill={star <= existingRating.rating ? '#FF9500' : 'transparent'}
                    />
                  ))}
                  <Text style={styles.ratingScoreText}>{existingRating.rating}/5</Text>
                </View>
                {existingRating.review ? (
                  <Text style={styles.submittedReviewText}>"{existingRating.review}"</Text>
                ) : null}
              </View>
            ) : (
              <TouchableOpacity
                style={styles.openRatingBtn}
                activeOpacity={0.88}
                onPress={() => setIsRatingModalOpen(true)}
              >
                <Star size={16} color="#FFFFFF" fill="#FFFFFF" />
                <Text style={styles.openRatingBtnText}>Beri Ulasan Sekarang</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* ================= MODAL STRUK RESMI (SINKRON WEB FE) ================= */}
      <Modal
        visible={isReceiptModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsReceiptModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.receiptContainer}>
            <View style={styles.receiptHeaderRow}>
              <View>
                <Text style={styles.receiptGarageTitle}>THUNDERBOLT GARAGE</Text>
                <Text style={styles.receiptGarageSubtitle}>Bengkel Resmi Motor &amp; Mobil</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsReceiptModalOpen(false)}
                style={styles.receiptCloseBtn}
              >
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.paidBadge}>
              <CheckCircle2 size={14} color="#15803D" />
              <Text style={styles.paidBadgeText}>BUKTI PEMBAYARAN LUNAS</Text>
            </View>

            {/* Metadata Ringkas */}
            <View style={styles.receiptMetaCard}>
              <View style={styles.receiptMetaRow}>
                <Text style={styles.receiptMetaLabel}>No. Struk:</Text>
                <Text style={styles.receiptMetaValBold}>STRUK-{booking.booking_code}</Text>
              </View>
              <View style={styles.receiptMetaRow}>
                <Text style={styles.receiptMetaLabel}>No. Booking:</Text>
                <Text style={styles.receiptMetaValBold}>{booking.booking_code}</Text>
              </View>
              <View style={styles.receiptMetaRow}>
                <Text style={styles.receiptMetaLabel}>Tanggal:</Text>
                <Text style={styles.receiptMetaVal}>{formatBookingTime()}</Text>
              </View>
              <View style={styles.receiptMetaRow}>
                <Text style={styles.receiptMetaLabel}>Pelanggan:</Text>
                <Text style={styles.receiptMetaVal}>{booking.customer_name || user?.name || 'Pelanggan'}</Text>
              </View>
              <View style={styles.receiptMetaRow}>
                <Text style={styles.receiptMetaLabel}>Kendaraan:</Text>
                <Text style={styles.receiptMetaVal}>{vehicleName} ({vehiclePlate})</Text>
              </View>
              <View style={styles.receiptMetaRow}>
                <Text style={styles.receiptMetaLabel}>Status Bayar:</Text>
                <Text style={[styles.receiptMetaValBold, { color: '#15803D' }]}>Lunas Terkonfirmasi</Text>
              </View>
            </View>

            {/* Rincian Item */}
            <View style={styles.receiptItemsBox}>
              <View style={styles.receiptItemRow}>
                <Text style={styles.receiptItemTitle}>Jasa: {serviceName}</Text>
                <Text style={styles.receiptItemPrice}>Rp {servicePrice.toLocaleString('id-ID')}</Text>
              </View>
              {parts.map((p, idx) => (
                <View key={idx} style={styles.receiptItemSubRow}>
                  <Text style={styles.receiptItemSubText}>
                    {p.quantity}x {p.name}
                  </Text>
                  <Text style={styles.receiptItemSubPrice}>
                    Rp {(p.price * p.quantity).toLocaleString('id-ID')}
                  </Text>
                </View>
              ))}
            </View>

            {/* Grand Total */}
            <View style={styles.receiptTotalRow}>
              <Text style={styles.receiptTotalLabel}>TOTAL AKHIR:</Text>
              <Text style={styles.receiptTotalValue}>Rp {grandTotal.toLocaleString('id-ID')}</Text>
            </View>

            <View style={styles.guaranteeBox}>
              <ShieldCheck size={16} color="#059669" />
              <Text style={styles.guaranteeText}>
                Garansi servis resmi 14 hari kerja atau 1.000 KM di semua cabang ThunderBolt Garage.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeReceiptActionBtn}
              onPress={() => setIsReceiptModalOpen(false)}
            >
              <Text style={styles.closeReceiptActionText}>Tutup Struk</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ---------- Modal Rating ---------- */}
      <Modal
        visible={isRatingModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsRatingModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalHeading}>Beri Rating Servis</Text>
            <Text style={styles.modalSub}>{serviceName}</Text>

            <View style={styles.starPickerRow}>
              {[1, 2, 3, 4, 5].map((num) => (
                <TouchableOpacity
                  key={num}
                  activeOpacity={0.7}
                  onPress={() => setRatingScore(num)}
                  style={{ padding: 6 }}
                >
                  <Star
                    size={32}
                    color="#FF9500"
                    fill={num <= ratingScore ? '#FF9500' : 'transparent'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.reviewInput}
              placeholder="Ceritakan pengalaman servis kendaraan Anda (opsional)..."
              placeholderTextColor="#94A3B8"
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsRatingModalOpen(false)}
                disabled={isSubmittingRating}
              >
                <Text style={styles.modalCancelText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSubmitRating}
                disabled={isSubmittingRating}
              >
                {isSubmittingRating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitText}>Kirim Ulasan</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
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
    fontSize: 16,
    fontWeight: '700',
  },
  vehiclePlate: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },

  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 8,
    shadowColor: colors.primaryDarker,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    marginBottom: 16,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stageColumn: {
    alignItems: 'center',
    width: 58,
  },
  stageCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    fontSize: 9.5,
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
    marginTop: 15,
    marginHorizontal: -6,
  },
  stageConnectorDone: {
    backgroundColor: colors.primaryDark,
  },

  estimateCard: {
    backgroundColor: colors.primaryDark,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
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
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },

  billCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  billHeader: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  billTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.headingDark,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  billItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  billItemSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  billItemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  partsSection: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  partsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  partsTitleText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  partItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  partItemName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  partItemQty: {
    fontSize: 10.5,
    color: '#94A3B8',
  },
  partItemSubtotal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },

  billDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
    borderStyle: 'dashed',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.headingDark,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primary,
  },

  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DCFCE7',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  receiptButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
  },

  noteCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.primarySoft,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  noteText: {
    flex: 1,
    color: colors.primaryDarker,
    fontSize: 12.5,
    lineHeight: 18,
  },

  cancelBookingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  cancelBookingBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },

  paymentActionSection: {
    backgroundColor: '#FFF7ED',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFEDD5',
    marginBottom: 16,
  },
  paymentActionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#9A3412',
    marginBottom: 4,
  },
  paymentActionSubtitle: {
    fontSize: 11.5,
    color: '#C2410C',
    lineHeight: 16,
    marginBottom: 14,
  },
  paymentBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  payCashBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FDBA74',
    paddingVertical: 12,
    borderRadius: 14,
  },
  payCashBtnText: {
    color: '#EA580C',
    fontSize: 13,
    fontWeight: '700',
  },
  payOnlineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  payOnlineBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  ratingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  ratingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  ratingIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.headingDark,
  },
  ratingCardSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  submittedRatingBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  ratingScoreText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#D97706',
    marginLeft: 6,
  },
  submittedReviewText: {
    fontSize: 12.5,
    color: '#78350F',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  ratingCardHighlight: {
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
  },
  openRatingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    borderRadius: 14,
  },
  openRatingBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Modal Struk Styles (Synchronized with Web FE)
  receiptContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  receiptHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  receiptGarageTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.headingDark,
    letterSpacing: 0.5,
  },
  receiptGarageSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  receiptCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
    alignSelf: 'center',
    marginBottom: 14,
  },
  paidBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#15803D',
    letterSpacing: 0.4,
  },
  receiptMetaCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    gap: 6,
    marginBottom: 12,
  },
  receiptMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptMetaLabel: {
    fontSize: 11.5,
    color: '#64748B',
  },
  receiptMetaVal: {
    fontSize: 11.5,
    color: colors.headingDark,
    fontWeight: '600',
  },
  receiptMetaValBold: {
    fontSize: 11.5,
    color: colors.headingDark,
    fontWeight: '800',
  },
  receiptItemsBox: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    paddingVertical: 10,
    marginBottom: 12,
    gap: 6,
  },
  receiptItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptItemTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.headingDark,
  },
  receiptItemPrice: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.headingDark,
  },
  receiptItemSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptItemSubText: {
    fontSize: 11.5,
    color: '#64748B',
  },
  receiptItemSubPrice: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },
  receiptTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  receiptTotalLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.headingDark,
  },
  receiptTotalValue: {
    fontSize: 17,
    fontWeight: '900',
    color: '#EA580C',
  },
  guaranteeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  guaranteeText: {
    flex: 1,
    fontSize: 10.5,
    color: '#166534',
    lineHeight: 14,
  },
  closeReceiptActionBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeReceiptActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  modalHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.headingDark,
    textAlign: 'center',
  },
  modalSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 16,
  },
  starPickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  reviewInput: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    padding: 12,
    fontSize: 13,
    color: colors.headingDark,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 18,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
