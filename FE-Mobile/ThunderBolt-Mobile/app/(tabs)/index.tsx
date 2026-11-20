// app/(tabs)/index.tsx
// Halaman utama (Beranda) aplikasi ThunderBolt Garage: greeting, aksi cepat, booking aktif, kendaraan, banner promo, kategori layanan, dan ulasan pelanggan.
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  CalendarPlus,
  Car,
  ClipboardList,
  Tag,
  Bell,
  Clock,
  ChevronRight,
  Wrench,
  AlertCircle,
  Star,
  MapPin,
} from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { StoreDetailModal, StoreBranch } from '../../components/store-detail-modal';
import { useAuth } from '../../contexts/AuthContext';
import { serviceService, Service } from '../../services/serviceService';
import { bookingService, Booking } from '../../services/bookingService';
import { vehicleService, Vehicle } from '../../services/vehicleService';
import { notificationService, Notification } from '../../services/notificationService';
import { GarageModal } from '../../components/profile/garage-modal';
import { styles as homeStyles } from '../../styles/home.styles';
import { PromoBanner } from '../../components/home/promo-banner';
import { CategorySection } from '../../components/home/category-section';
import { CustomerReviewsSection } from '../../components/home/customer-reviews-section';

// Konfigurasi warna badge status booking
const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  Menunggu: { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
  Diproses: { bg: '#FFF7ED', text: '#EA580C', border: '#FDBA74' },
  'Menunggu Pembayaran': { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' },
  Selesai: { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' },
  Dibatalkan: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
};

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState('');
  const [apiServices, setApiServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<StoreBranch | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Data real dari backend
  const [activeBookings, setActiveBookings] = useState<Booking[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [allUserBookings, setAllUserBookings] = useState<Booking[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [isGarageModalVisible, setIsGarageModalVisible] = useState(false);
  const [isGarageLoading, setIsGarageLoading] = useState(false);

  // Fungsi utama: ambil semua data beranda dari backend
  const fetchHomeData = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Jalankan semua request paralel
      const [bookingsRes, vehiclesRes, notifsRes, servicesRes] = await Promise.allSettled([
        bookingService.getBookingsByUser(user.id, user.email),
        vehicleService.getVehiclesByUser(user.id, user.email),
        notificationService.getNotificationsByUser(user.id),
        serviceService.getAllServices(),
      ]);

      // Booking aktif (selain Selesai & Dibatalkan), ambil 3 terbaru
      if (bookingsRes.status === 'fulfilled') {
        setAllUserBookings(bookingsRes.value);
        const active = bookingsRes.value
          .filter((b) => b.status !== 'Selesai' && b.status !== 'Dibatalkan')
          .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
          .slice(0, 3);
        setActiveBookings(active);
      }

      // Kendaraan pengguna
      if (vehiclesRes.status === 'fulfilled') {
        setVehicles(vehiclesRes.value);
      }

      // Notifikasi belum dibaca
      if (notifsRes.status === 'fulfilled') {
        const unread = notifsRes.value.filter((n) => !n.is_read).length;
        setUnreadCount(unread);
      }

      // Layanan dari API
      if (servicesRes.status === 'fulfilled' && servicesRes.value.length > 0) {
        setApiServices(servicesRes.value);
      }
    } catch {
      // Fallback: data default tetap tampil
    } finally {
      setServicesLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  // Refresh setiap kali halaman kembali difokuskan (misal: setelah booking baru)
  useFocusEffect(
    useCallback(() => {
      fetchHomeData();
    }, [fetchHomeData])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHomeData();
  };

  // Navigasi
  const handleCloseStoreModal = () => {
    setIsModalVisible(false);
    setSelectedStore(null);
  };

  const handleSelectBookingFromStore = (store: StoreBranch) => {
    setIsModalVisible(false);
    router.push({
      pathname: '/booking/create' as any,
      params: { storeId: store.id, storeName: store.name, address: store.address },
    });
  };

  const handleGoProfile = () => {
    router.push('/(tabs)/profile' as any);
  };

  // Garasi handlers
  const handleOpenGarage = () => {
    setIsGarageModalVisible(true);
  };

  const handleBookServiceForVehicle = (vehicle: Vehicle) => {
    setIsGarageModalVisible(false);
    router.push({
      pathname: '/booking/create' as any,
      params: { vehicleId: String(vehicle.id) },
    });
  };

  const handleDeleteVehicle = async (vehicle: Vehicle) => {
    try {
      await vehicleService.deleteVehicle(vehicle.id || vehicle.license_plate);
      setVehicles((prev) => prev.filter((v) => v.id !== vehicle.id && v.license_plate !== vehicle.license_plate));
    } catch (err: any) {
      console.log('Error deleting vehicle:', err);
    }
  };

  const handleAddVehicleFromGarage = async (data: {
    brand: string;
    model: string;
    year: number;
    license_plate: string;
    transmission: string;
  }) => {
    if (!user) return;
    const created = await vehicleService.createVehicle({
      user_id: user.id,
      brand: data.brand,
      model: data.model,
      year: data.year,
      license_plate: data.license_plate,
      transmission: data.transmission,
    });
    setVehicles((prev) => [created, ...prev]);
  };

  // Greeting berdasarkan waktu
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Selamat Pagi';
    if (h < 15) return 'Selamat Siang';
    if (h < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  return (
    <SafeAreaView style={homeStyles.screen} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={homeStyles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* ============ HEADER ============ */}
        <View style={homeStyles.headerRow}>
          <View>
            <Text style={s.greetingSmall}>{getGreeting()},</Text>
            <Text style={s.greetingLarge}>{user?.name || 'User'}</Text>
          </View>

          <View style={s.headerRight}>
            <TouchableOpacity
              style={s.notifBtn}
              activeOpacity={0.7}
              onPress={() =>
                Alert.alert(
                  'Segera Hadir!',
                  'Fitur notifikasi sedang disiapkan dan akan hadir pada pembaruan aplikasi berikutnya.',
                  [{ text: 'Mengerti', style: 'default' }]
                )
              }
            >
              <Bell size={20} color={colors.headingDark} />
              {unreadCount > 0 && (
                <View style={s.notifBadge}>
                  <Text style={s.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={homeStyles.profileButton}
              activeOpacity={0.85}
              onPress={handleGoProfile}
            >
              <User size={20} color={colors.textOnPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ============ MENU UTAMA (Card Besar Orange + 4 Shortcut Sejajar ke Kanan) ============ */}
        <View style={s.menuCard}>
          <Text style={s.menuCardTitle}>Layanan ThunderBolt</Text>
          <Text style={s.menuCardSub}>Pilih layanan yang kamu butuhkan</Text>

          <View style={s.menuRow}>
            <TouchableOpacity
              style={s.menuItem}
              activeOpacity={0.8}
              onPress={() => router.push('/booking/create' as any)}
            >
              <View style={s.menuIconWrap}>
                <CalendarPlus size={18} color={colors.primary} />
              </View>
              <Text style={s.menuLabel} numberOfLines={2}>
                Booking{'\n'}Servis
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.menuItem}
              activeOpacity={0.8}
              onPress={handleOpenGarage}
            >
              <View style={s.menuIconWrap}>
                <Car size={18} color={colors.primary} />
              </View>
              <Text style={s.menuLabel} numberOfLines={2}>
                Kendaraan{'\n'}Saya
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.menuItem}
              activeOpacity={0.8}
              onPress={() => router.push('/service-history' as any)}
            >
              <View style={s.menuIconWrap}>
                <ClipboardList size={18} color={colors.primary} />
              </View>
              <Text style={s.menuLabel} numberOfLines={2}>
                Riwayat{'\n'}Servis
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.menuItem}
              activeOpacity={0.8}
              onPress={() => router.push('/promos' as any)}
            >
              <View style={s.menuIconWrap}>
                <Tag size={18} color={colors.primary} />
              </View>
              <Text style={s.menuLabel} numberOfLines={2}>
                Promo{'\n'}& Kupon
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ============ PROMO BANNER CAROUSEL ============ */}
        <PromoBanner />

        {/* ============ BOOKING AKTIF (Real Data) ============ */}
        {activeBookings.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Booking Aktif</Text>
              <TouchableOpacity onPress={() => router.push('/active-bookings' as any)}>
                <Text style={s.seeAll}>Lihat Semua</Text>
              </TouchableOpacity>
            </View>

            {activeBookings.map((booking) => {
              const statusStyle = STATUS_CONFIG[booking.status] || STATUS_CONFIG.Menunggu;
              return (
                <TouchableOpacity
                  key={booking.id}
                  style={s.bookingCard}
                  activeOpacity={0.8}
                  onPress={() => router.push({ pathname: '/booking/[id]', params: { id: String(booking.id) } })}
                >
                  <View style={s.bookingTopRow}>
                    <View style={s.bookingCodeRow}>
                      <Wrench size={14} color={colors.primary} />
                      <Text style={s.bookingCode}>{booking.booking_code || `#${booking.id}`}</Text>
                    </View>
                    <View style={[s.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
                      <Text style={[s.statusText, { color: statusStyle.text }]}>{booking.status}</Text>
                    </View>
                  </View>

                  <Text style={s.bookingService} numberOfLines={1}>
                    {booking.service_name || 'Servis Kendaraan'}
                  </Text>

                  <View style={s.bookingMeta}>
                    <View style={s.bookingMetaItem}>
                      <Clock size={12} color="#94A3B8" />
                      <Text style={s.bookingMetaText}>
                        {booking.booking_date
                          ? new Date(booking.booking_date).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                            })
                          : '-'}{' '}
                        {booking.booking_time ? `- ${booking.booking_time}` : ''}
                      </Text>
                    </View>
                    {booking.vehicle_brand && (
                      <View style={s.bookingMetaItem}>
                        <Car size={12} color="#94A3B8" />
                        <Text style={s.bookingMetaText} numberOfLines={1}>
                          {booking.vehicle_brand} {booking.vehicle_model || ''}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={s.bookingArrow}>
                    <ChevronRight size={16} color="#CBD5E1" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ============ KENDARAAN SAYA (Real Data) ============ */}
        {vehicles.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Kendaraan Saya</Text>
              <TouchableOpacity onPress={handleOpenGarage}>
                <Text style={s.seeAll}>Buka Garasi</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.vehicleScroll}
            >
              {vehicles.slice(0, 5).map((v) => (
                <View key={v.id} style={s.vehicleCard}>
                  <View style={s.vehicleIconWrap}>
                    <Car size={22} color={colors.primary} />
                  </View>
                  <View style={s.vehicleInfo}>
                    <Text style={s.vehicleName} numberOfLines={1}>
                      {v.brand} {v.model}
                    </Text>
                    <Text style={s.vehiclePlate}>{v.license_plate}</Text>
                    <Text style={s.vehicleMeta}>
                      {v.year} - {v.transmission === 'automatic' ? 'Matic' : 'Manual'}
                    </Text>
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={s.vehicleAddCard}
                activeOpacity={0.8}
                onPress={handleOpenGarage}
              >
                <Text style={s.vehicleAddPlus}>+</Text>
                <Text style={s.vehicleAddText}>Tambah{'\n'}Kendaraan</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* ============ KATEGORI LAYANAN SERVIS ============ */}
        <CategorySection
          apiServices={apiServices}
          servicesLoading={servicesLoading}
          selectedCategory={selectedCategory}
          onSelectCategory={(id) => setSelectedCategory(selectedCategory === id ? '' : id)}
        />

        {/* ============ ULASAN PELANGGAN ============ */}
        <CustomerReviewsSection />
      </ScrollView>

      {/* Garage Modal (Persis Seperti di Profile) */}
      <GarageModal
        visible={isGarageModalVisible}
        vehicles={vehicles}
        bookings={allUserBookings}
        isLoading={isGarageLoading}
        onClose={() => setIsGarageModalVisible(false)}
        onBookServiceForVehicle={handleBookServiceForVehicle}
        onAddVehicle={handleAddVehicleFromGarage}
        onDeleteVehicle={handleDeleteVehicle}
      />

      {/* Store Branch Detail Modal */}
      <StoreDetailModal
        visible={isModalVisible}
        store={selectedStore}
        onClose={handleCloseStoreModal}
        onSelectBooking={handleSelectBookingFromStore}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  // Header
  greetingSmall: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  greetingLarge: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.headingDark,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  // Menu Card Besar Warna Oranye Sesuai Palet Tema
  menuCard: {
    marginHorizontal: 16,
    marginBottom: 18,
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  menuCardTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  menuCardSub: {
    fontSize: 11,
    color: '#FFE7D6',
    marginTop: 1,
    marginBottom: 12,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    gap: 6,
  },
  menuItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  menuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  menuLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.headingDark,
    textAlign: 'center',
    lineHeight: 12.5,
  },

  // Section shared
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.headingDark,
  },
  seeAll: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.primary,
  },

  // Booking Card
  bookingCard: {
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  bookingTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  bookingCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bookingCode: {
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
  bookingService: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  bookingMeta: {
    flexDirection: 'row',
    gap: 14,
  },
  bookingMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bookingMetaText: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontWeight: '500',
  },
  bookingArrow: {
    position: 'absolute',
    right: 14,
    top: '50%',
  },

  // Vehicle Cards
  vehicleScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  vehicleCard: {
    width: 155,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  vehicleIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  vehicleInfo: {},
  vehicleName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.headingDark,
  },
  vehiclePlate: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  vehicleMeta: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  vehicleAddCard: {
    width: 100,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleAddPlus: {
    fontSize: 22,
    fontWeight: '300',
    color: '#94A3B8',
  },
  vehicleAddText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 14,
  },
});
