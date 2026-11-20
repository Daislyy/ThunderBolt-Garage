// app/booking/create.tsx
// Halaman formulir pendaftaran booking servis: pemilihan paket layanan servis, kendaraan (atau tambah kendaraan langsung), tanggal kedatangan, slot jam, serta catatan keluhan.
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Wrench,
  Car,
  Bike,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  Building2,
  Sparkles,
  ChevronRight,
  X,
  AlertCircle,
  Tag,
} from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { serviceService, Service } from '../../services/serviceService';
import { vehicleService, Vehicle } from '../../services/vehicleService';
import { bookingService, Booking } from '../../services/bookingService';

// Pilihan slot jam kedatangan yang disinkronkan dengan jam operasional Web Frontend
const TIME_SLOTS = [
  '08:30 WIB',
  '09:00 WIB',
  '09:30 WIB',
  '10:00 WIB',
  '10:30 WIB',
  '11:00 WIB',
  '13:00 WIB',
  '13:30 WIB',
  '14:00 WIB',
  '14:30 WIB',
  '15:00 WIB',
  '15:30 WIB',
  '16:00 WIB',
];

// Helper to generate next 7 days for quick date picking
function getNext7Days() {
  const days = [];
  const daysName = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthsName = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');

    days.push({
      isoDate: `${year}-${month}-${date}`,
      dayName: i === 0 ? 'Hari ini' : daysName[d.getDay()],
      dateDisplay: `${d.getDate()} ${monthsName[d.getMonth()]}`,
    });
  }
  return days;
}

export default function CreateBookingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    storeId?: string;
    storeName?: string;
    address?: string;
    vehicleId?: string;
  }>();

  // Data state
  const [services, setServices] = useState<Service[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form selections
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getNext7Days()[0].isoDate);
  const [selectedTime, setSelectedTime] = useState<string>(TIME_SLOTS[1]); // 09:00 WIB
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success Modal State
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  // Add vehicle modal state
  const [isAddVehicleModalVisible, setIsAddVehicleModalVisible] = useState(false);
  const [newBrand, setNewBrand] = useState('Honda');
  const [newModel, setNewModel] = useState('');
  const [newYear, setNewYear] = useState(new Date().getFullYear().toString());
  const [newPlate, setNewPlate] = useState('');
  const [newTransmission, setNewTransmission] = useState<'Matic (CVT)' | 'Manual'>('Matic (CVT)');
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);

  const availableDates = getNext7Days();

  useEffect(() => {
    fetchInitialData();
  }, [user]);

  const fetchInitialData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [servicesData, vehiclesData, bookingsData] = await Promise.all([
        serviceService.getAllServices(),
        vehicleService.getVehiclesByUser(user.id, user.email),
        bookingService.getBookingsByUser(user.id).catch(() => []),
      ]);

      setServices(servicesData);
      if (servicesData.length > 0) {
        setSelectedServiceId(servicesData[0].id);
      }

      setVehicles(vehiclesData);
      setUserBookings(bookingsData);

      // Pre-select vehicle if passed via route param
      if (params.vehicleId) {
        const found = vehiclesData.find((v) => String(v.id) === String(params.vehicleId));
        if (found) {
          setSelectedVehicleId(found.id);
        } else if (vehiclesData.length > 0) {
          setSelectedVehicleId(vehiclesData[0].id);
        }
      } else if (vehiclesData.length > 0) {
        // Find first vehicle that is NOT currently undergoing active service
        const available = vehiclesData.find((v) => {
          const ongoing = bookingsData.some(
            (b) =>
              (b.vehicle_id === v.id || b.license_plate?.trim().toUpperCase() === v.license_plate?.trim().toUpperCase()) &&
              b.status !== 'Selesai' &&
              b.status !== 'Dibatalkan'
          );
          return !ongoing;
        });
        setSelectedVehicleId(available ? available.id : vehiclesData[0].id);
      }
    } catch (error) {
      console.log('Error fetching booking form data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add new vehicle on the fly
  const handleCreateVehicle = async () => {
    if (!newBrand.trim() || !newModel.trim() || !newPlate.trim()) {
      Alert.alert('Form Belum Lengkap', 'Merk, model, dan plat nomor kendaraan wajib diisi.');
      return;
    }
    if (!user) return;

    setIsAddingVehicle(true);
    try {
      const created = await vehicleService.createVehicle({
        user_id: user.id,
        brand: newBrand.trim(),
        model: newModel.trim(),
        year: Number(newYear) || new Date().getFullYear(),
        license_plate: newPlate.trim().toUpperCase(),
        transmission: newTransmission,
      });

      setVehicles((prev) => [created, ...prev]);
      setSelectedVehicleId(created.id);
      setIsAddVehicleModalVisible(false);

      // Reset modal fields
      setNewBrand('Honda');
      setNewModel('');
      setNewYear(new Date().getFullYear().toString());
      setNewPlate('');
      Alert.alert('Sukses!', 'Kendaraan berhasil didaftarkan.');
    } catch (error: any) {
      Alert.alert('Gagal Tambah Kendaraan', error.message || 'Terjadi kesalahan.');
    } finally {
      setIsAddingVehicle(false);
    }
  };

  // Submit Booking
  const handleSubmitBooking = async () => {
    if (!user) {
      Alert.alert('Error', 'Silakan login terlebih dahulu');
      return;
    }
    if (!selectedServiceId) {
      Alert.alert('Layanan Belum Dipilih', 'Silakan pilih jenis servis yang diinginkan.');
      return;
    }
    if (!selectedVehicleId) {
      Alert.alert('Kendaraan Belum Dipilih', 'Silakan pilih atau tambahkan kendaraan terlebih dahulu.');
      return;
    }

    const chosenVehicle = vehicles.find((v) => v.id === selectedVehicleId);
    if (!chosenVehicle) {
      Alert.alert('Error', 'Kendaraan tidak ditemukan');
      return;
    }

    // Validation matching Web Frontend: Cannot book the same vehicle if already in service
    const ongoing = userBookings.find(
      (b) =>
        (b.vehicle_id === chosenVehicle.id ||
          b.license_plate?.trim().toUpperCase() === chosenVehicle.license_plate?.trim().toUpperCase()) &&
        b.status !== 'Selesai' &&
        b.status !== 'Dibatalkan'
    );

    if (ongoing) {
      Alert.alert(
        'Kendaraan Sedang Dalam Pengerjaan',
        `Kendaraan ${chosenVehicle.brand} ${chosenVehicle.model} (${chosenVehicle.license_plate}) sedang dalam proses servis (Status: ${ongoing.status}). Anda tidak dapat mendaftarkan servis baru untuk kendaraan yang sama sebelum servis sebelumnya selesai.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedService = services.find((s) => s.id === selectedServiceId);
      const cleanTime = selectedTime.replace(/wib/gi, '').trim();
      const newBooking = await bookingService.createBooking({
        user_id: user.id,
        customer_email: user.email,
        vehicle_id: selectedVehicleId,
        license_plate: chosenVehicle.license_plate,
        vehicle_brand: chosenVehicle.brand,
        vehicle_model: chosenVehicle.model,
        vehicle_year: chosenVehicle.year,
        transmission: chosenVehicle.transmission || undefined,
        service_id: selectedServiceId,
        service_name: selectedService?.name,
        booking_date: selectedDate,
        booking_time: cleanTime,
        notes: notes.trim() || undefined,
      });

      setCreatedBooking(newBooking);
      setIsSuccessModalVisible(true);
    } catch (error: any) {
      Alert.alert('Gagal Membuat Booking', error.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToDetail = () => {
    if (!createdBooking) return;
    setIsSuccessModalVisible(false);
    router.replace({
      pathname: '/booking/[id]',
      params: { id: String(createdBooking.id) },
    });
  };

  const handleGoHome = () => {
    setIsSuccessModalVisible(false);
    router.replace('/(tabs)');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
            <ArrowLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Booking Servis</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Menyiapkan form booking...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const selectedServiceObj = services.find((s) => s.id === selectedServiceId);
  const selectedVehicleObj = vehicles.find((v) => v.id === selectedVehicleId);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Top Header */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
            <ArrowLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Form Booking Servis</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Banner Cabang Bengkel */}
          {params.storeName && (
            <View style={styles.storeBanner}>
              <View style={styles.storeBannerIcon}>
                <Building2 size={20} color={colors.primaryDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.storeBannerTitle}>{params.storeName}</Text>
                <Text style={styles.storeBannerAddress}>{params.address || 'Bengkel Resmi ThunderBolt Garage'}</Text>
              </View>
            </View>
          )}

          {/* 1. Pilih Layanan Servis */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeaderRow}>
              <Wrench size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>1. Pilih Layanan Servis</Text>
            </View>

            <View style={styles.servicesGrid}>
              {services.map((service) => {
                const isSelected = selectedServiceId === service.id;
                return (
                  <TouchableOpacity
                    key={service.id}
                    style={[styles.serviceOptionCard, isSelected && styles.serviceOptionCardSelected]}
                    activeOpacity={0.85}
                    onPress={() => setSelectedServiceId(service.id)}
                  >
                    <View style={styles.serviceOptionHeader}>
                      <Text style={[styles.serviceOptionName, isSelected && styles.serviceOptionNameSelected]}>
                        {service.name}
                      </Text>
                      {isSelected && <CheckCircle2 size={18} color={colors.primary} />}
                    </View>

                    {/* Price and Duration Badge synchronized with Web Frontend */}
                    <View style={styles.serviceMetaRow}>
                      <View style={styles.servicePriceBadge}>
                        <Text style={styles.servicePriceText}>
                          Rp {(service.price || 100000).toLocaleString('id-ID')}
                        </Text>
                      </View>
                      {service.duration ? (
                        <View style={styles.serviceDurationBadge}>
                          <Clock size={11} color="#64748B" />
                          <Text style={styles.serviceDurationText}>{service.duration}</Text>
                        </View>
                      ) : null}
                    </View>

                    {service.description ? (
                      <Text style={styles.serviceOptionDesc} numberOfLines={2}>
                        {service.description}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 2. Pilih / Tambah Kendaraan */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeaderRow}>
              <Car size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>2. Pilih Kendaraan</Text>
            </View>

            {vehicles.length > 0 ? (
              <View style={styles.vehiclesList}>
                {vehicles.map((v, idx) => {
                  const isSelected = selectedVehicleId === v.id;
                  const isMotor = ['honda', 'yamaha', 'kawasaki', 'suzuki', 'beat', 'vario', 'nmax', 'scoopy', 'aerox', 'pcx'].some(
                    (m) => v.brand.toLowerCase().includes(m) || v.model.toLowerCase().includes(m)
                  );
                  const IconComp = isMotor ? Bike : Car;

                  const isUnderService = userBookings.some(
                    (b) =>
                      (b.vehicle_id === v.id ||
                        b.license_plate?.trim().toUpperCase() === v.license_plate?.trim().toUpperCase()) &&
                      b.status !== 'Selesai' &&
                      b.status !== 'Dibatalkan'
                  );

                  return (
                    <TouchableOpacity
                      key={`create-booking-v-${v.id ?? v.license_plate ?? idx}`}
                      style={[
                        styles.vehicleCard,
                        isSelected && styles.vehicleCardSelected,
                        isUnderService && styles.vehicleCardDisabled,
                      ]}
                      activeOpacity={0.85}
                      onPress={() => {
                        if (isUnderService) {
                          Alert.alert(
                            'Kendaraan Sedang Diservis',
                            `Kendaraan ${v.brand} ${v.model} (${v.license_plate}) sedang dalam proses servis aktif.`
                          );
                          return;
                        }
                        setSelectedVehicleId(v.id);
                      }}
                    >
                      <View
                        style={[
                          styles.vehicleIconCircle,
                          isSelected ? styles.vehicleIconCircleSelected : styles.vehicleIconCircleDefault,
                        ]}
                      >
                        <IconComp size={20} color={isSelected ? colors.textOnPrimary : colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.vehicleTitle, isSelected && styles.vehicleTitleSelected]}>
                          {v.brand} {v.model} ({v.year})
                        </Text>
                        <Text style={styles.vehicleSubtitle}>
                          Plat: {v.license_plate} {v.transmission ? `· ${v.transmission}` : ''}
                        </Text>
                        {isUnderService && (
                          <View style={styles.underServiceBadge}>
                            <AlertCircle size={11} color="#C2410C" />
                            <Text style={styles.underServiceText}>Sedang Dalam Pengerjaan</Text>
                          </View>
                        )}
                      </View>
                      {isSelected && <CheckCircle2 size={20} color={colors.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.noVehicleBox}>
                <Text style={styles.noVehicleText}>Kamu belum memiliki kendaraan terdaftar.</Text>
              </View>
            )}

            {/* Button to add new vehicle */}
            <TouchableOpacity
              style={styles.addVehicleButton}
              activeOpacity={0.8}
              onPress={() => setIsAddVehicleModalVisible(true)}
            >
              <Plus size={18} color={colors.primary} />
              <Text style={styles.addVehicleButtonText}>Tambah Kendaraan Baru</Text>
            </TouchableOpacity>
          </View>

          {/* 3. Tanggal & Jam Servis */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeaderRow}>
              <Calendar size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>3. Tanggal &amp; Jam Kedatangan</Text>
            </View>

            {/* Date Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datesRow}>
              {availableDates.map((item) => {
                const isSelected = selectedDate === item.isoDate;
                return (
                  <TouchableOpacity
                    key={item.isoDate}
                    style={[styles.dateChip, isSelected && styles.dateChipSelected]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedDate(item.isoDate)}
                  >
                    <Text style={[styles.dateChipDay, isSelected && styles.dateChipTextSelected]}>
                      {item.dayName}
                    </Text>
                    <Text style={[styles.dateChipDate, isSelected && styles.dateChipTextSelected]}>
                      {item.dateDisplay}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Time Slots */}
            <View style={styles.timeHeaderRow}>
              <Clock size={16} color="#64748B" />
              <Text style={styles.timeHeaderTitle}>Pilih Jam Kedatangan:</Text>
            </View>

            <View style={styles.timeGrid}>
              {TIME_SLOTS.map((time) => {
                const isSelected = selectedTime === time;
                return (
                  <TouchableOpacity
                    key={time}
                    style={[styles.timeChip, isSelected && styles.timeChipSelected]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedTime(time)}
                  >
                    <Text style={[styles.timeChipText, isSelected && styles.timeChipTextSelected]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 4. Catatan Keluhan (Opsional) */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeaderRow}>
              <FileText size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>4. Catatan Keluhan (Opsional)</Text>
            </View>

            <TextInput
              style={styles.notesInput}
              placeholder="Jelaskan keluhan pada kendaraanmu (misal: rem decit, getaran saat akselerasi, tarikan berat...)"
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          {/* Submit CTA Button */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            activeOpacity={0.88}
            onPress={handleSubmitBooking}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.textOnPrimary} />
            ) : (
              <View style={styles.submitBtnContent}>
                <Sparkles size={18} color={colors.textOnPrimary} />
                <Text style={styles.submitButtonText}>Konfirmasi Jadwal Servis</Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ================= MODAL TAMBAH KENDARAAN ================= */}
      <Modal
        visible={isAddVehicleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAddVehicleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addVehicleModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tambah Kendaraan</Text>
              <TouchableOpacity
                onPress={() => setIsAddVehicleModalVisible(false)}
                style={styles.closeModalBtn}
              >
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Merk Kendaraan</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Contoh: Honda, Yamaha, Toyota"
                placeholderTextColor="#94A3B8"
                value={newBrand}
                onChangeText={setNewBrand}
              />

              <Text style={styles.inputLabel}>Model / Tipe</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Contoh: Vario 160, Civic RS, Brio"
                placeholderTextColor="#94A3B8"
                value={newModel}
                onChangeText={setNewModel}
              />

              <Text style={styles.inputLabel}>Tahun Pembuatan</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Contoh: 2023"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={newYear}
                onChangeText={setNewYear}
              />

              <Text style={styles.inputLabel}>Nomor Plat</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Contoh: B 1234 XYZ"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
                value={newPlate}
                onChangeText={setNewPlate}
              />

              <Text style={styles.inputLabel}>Transmisi</Text>
              <View style={styles.transRow}>
                <TouchableOpacity
                  style={[
                    styles.transBtn,
                    newTransmission === 'Matic (CVT)' && styles.transBtnActive,
                  ]}
                  onPress={() => setNewTransmission('Matic (CVT)')}
                >
                  <Text
                    style={[
                      styles.transBtnText,
                      newTransmission === 'Matic (CVT)' && styles.transBtnTextActive,
                    ]}
                  >
                    Matic (CVT)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.transBtn,
                    newTransmission === 'Manual' && styles.transBtnActive,
                  ]}
                  onPress={() => setNewTransmission('Manual')}
                >
                  <Text
                    style={[
                      styles.transBtnText,
                      newTransmission === 'Manual' && styles.transBtnTextActive,
                    ]}
                  >
                    Manual
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.saveVehicleBtn}
                activeOpacity={0.88}
                onPress={handleCreateVehicle}
                disabled={isAddingVehicle}
              >
                {isAddingVehicle ? (
                  <ActivityIndicator color={colors.textOnPrimary} />
                ) : (
                  <Text style={styles.saveVehicleBtnText}>Simpan Kendaraan</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL SUKSES BOOKING ================= */}
      <Modal
        visible={isSuccessModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleGoHome}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModalCard}>
            <View style={styles.successIconCircle}>
              <CheckCircle2 size={44} color="#16A34A" />
            </View>

            <Text style={styles.successTitle}>Booking Berhasil Dibuat!</Text>
            <Text style={styles.successSub}>
              Jadwal servis kendaraan Anda telah tersimpan dan siap diproses teknisi bengkel.
            </Text>

            {createdBooking && (
              <View style={styles.bookingCodeBadge}>
                <Text style={styles.bookingCodeLabel}>KODE BOOKING:</Text>
                <Text style={styles.bookingCodeValue}>{createdBooking.booking_code}</Text>
              </View>
            )}

            <View style={styles.successActions}>
              <TouchableOpacity
                style={styles.goToDetailBtn}
                activeOpacity={0.88}
                onPress={handleGoToDetail}
              >
                <Text style={styles.goToDetailBtnText}>Lihat Detail Servis</Text>
                <ChevronRight size={18} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.goHomeBtn}
                activeOpacity={0.8}
                onPress={handleGoHome}
              >
                <Text style={styles.goHomeBtnText}>Kembali ke Beranda</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
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
    fontWeight: '800',
  },

  storeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1EC',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 106, 0, 0.2)',
  },
  storeBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.headingDark,
  },
  storeBannerAddress: {
    fontSize: 12,
    color: colors.subtextGray,
    marginTop: 2,
  },

  formSection: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.headingDark,
  },

  servicesGrid: {
    gap: 10,
  },
  serviceOptionCard: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  serviceOptionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FFF7ED',
  },
  serviceOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  serviceOptionName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.headingDark,
    flex: 1,
  },
  serviceOptionNameSelected: {
    color: colors.primaryDark,
  },
  serviceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  servicePriceBadge: {
    backgroundColor: '#FFF1EC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  servicePriceText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  serviceDurationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  serviceDurationText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  serviceOptionDesc: {
    fontSize: 12,
    color: colors.subtextGray,
    lineHeight: 16,
  },

  vehiclesList: {
    gap: 10,
    marginBottom: 10,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  vehicleCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FFF7ED',
  },
  vehicleCardDisabled: {
    opacity: 0.65,
    backgroundColor: '#F1F5F9',
  },
  vehicleIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleIconCircleDefault: {
    backgroundColor: '#E2E8F0',
  },
  vehicleIconCircleSelected: {
    backgroundColor: colors.primary,
  },
  vehicleTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.headingDark,
  },
  vehicleTitleSelected: {
    color: colors.primaryDark,
  },
  vehicleSubtitle: {
    fontSize: 11.5,
    color: colors.subtextGray,
    marginTop: 2,
  },
  underServiceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  underServiceText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#C2410C',
  },
  noVehicleBox: {
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  noVehicleText: {
    fontSize: 13,
    color: colors.subtextGray,
  },
  addVehicleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.borderOrange,
    borderStyle: 'dashed',
    gap: 6,
  },
  addVehicleButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },

  datesRow: {
    gap: 8,
    paddingBottom: 10,
  },
  dateChip: {
    width: 80,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  dateChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dateChipDay: {
    fontSize: 11,
    color: colors.subtextGray,
    fontWeight: '600',
  },
  dateChipDate: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.headingDark,
    marginTop: 2,
  },
  dateChipTextSelected: {
    color: colors.textOnPrimary,
  },

  timeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    marginBottom: 8,
  },
  timeHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timeChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.headingDark,
  },
  timeChipTextSelected: {
    color: colors.textOnPrimary,
  },

  notesInput: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: colors.headingDark,
    minHeight: 70,
    backgroundColor: '#F8FAFC',
  },

  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '800',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  addVehicleModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.headingDark,
  },
  closeModalBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.headingDark,
    marginBottom: 6,
  },
  textInput: {
    height: 44,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 13,
    color: colors.headingDark,
    backgroundColor: '#F8FAFC',
    marginBottom: 12,
  },
  transRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  transBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  transBtnActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFF7ED',
  },
  transBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.subtextGray,
  },
  transBtnTextActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  saveVehicleBtn: {
    height: 46,
    backgroundColor: colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  saveVehicleBtnText: {
    color: colors.textOnPrimary,
    fontSize: 13.5,
    fontWeight: '700',
  },

  successModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.headingDark,
    textAlign: 'center',
  },
  successSub: {
    fontSize: 12.5,
    color: colors.subtextGray,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 16,
  },
  bookingCodeBadge: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  bookingCodeLabel: {
    fontSize: 11,
    color: '#EA580C',
    fontWeight: '700',
  },
  bookingCodeValue: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.headingDark,
    marginTop: 2,
  },
  successActions: {
    width: '100%',
    gap: 10,
  },
  goToDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
  },
  goToDetailBtnText: {
    color: colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  goHomeBtn: {
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  goHomeBtnText: {
    color: colors.headingDark,
    fontSize: 13,
    fontWeight: '700',
  },
});
