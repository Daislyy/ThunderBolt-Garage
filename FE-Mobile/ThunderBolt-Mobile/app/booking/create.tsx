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
} from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { serviceService, Service } from '../../services/serviceService';
import { vehicleService, Vehicle } from '../../services/vehicleService';
import { bookingService, Booking } from '../../services/bookingService';

const TIME_SLOTS = [
  '08:00 WIB',
  '09:00 WIB',
  '10:00 WIB',
  '11:00 WIB',
  '13:00 WIB',
  '14:00 WIB',
  '15:00 WIB',
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
  const params = useLocalSearchParams<{ storeId?: string; storeName?: string; address?: string }>();

  // Data state
  const [services, setServices] = useState<Service[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form selections
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getNext7Days()[0].isoDate);
  const [selectedTime, setSelectedTime] = useState<string>(TIME_SLOTS[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success Modal State
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  // Add vehicle modal state
  const [isAddVehicleModalVisible, setIsAddVehicleModalVisible] = useState(false);
  const [newBrand, setNewBrand] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newYear, setNewYear] = useState('');
  const [newPlate, setNewPlate] = useState('');
  const [newTransmission, setNewTransmission] = useState<'Manual' | 'Otomatis'>('Otomatis');
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);

  const availableDates = getNext7Days();

  useEffect(() => {
    fetchInitialData();
  }, [user]);

  const fetchInitialData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [servicesData, vehiclesData] = await Promise.all([
        serviceService.getAllServices(),
        vehicleService.getVehiclesByUser(user.id),
      ]);

      setServices(servicesData);
      if (servicesData.length > 0) {
        setSelectedServiceId(servicesData[0].id);
      }

      setVehicles(vehiclesData);
      if (vehiclesData.length > 0) {
        setSelectedVehicleId(vehiclesData[0].id);
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
      setNewBrand('');
      setNewModel('');
      setNewYear('');
      setNewPlate('');
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

    setIsSubmitting(true);
    try {
      const newBooking = await bookingService.createBooking({
        user_id: user.id,
        vehicle_id: selectedVehicleId,
        service_id: selectedServiceId,
        booking_date: selectedDate,
        booking_time: selectedTime,
        notes: notes.trim() || undefined,
      });

      // Show proper success modal instead of raw Alert.alert
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
      {/* KeyboardAvoidingView prevents inputs from being hidden when typing */}
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
          {/* Store Banner Info if navigated from store modal */}
          {params.storeName && (
            <View style={styles.storeBannerCard}>
              <Building2 size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.storeBannerTitle}>{params.storeName}</Text>
                {params.address && (
                  <Text style={styles.storeBannerAddress} numberOfLines={1}>
                    {params.address}
                  </Text>
                )}
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
                {vehicles.map((v) => {
                  const isSelected = selectedVehicleId === v.id;
                  const isMotor = ['honda', 'yamaha', 'kawasaki', 'suzuki', 'beat', 'vario', 'nmax', 'scoopy', 'aerox', 'pcx'].some(
                    (m) => v.brand.toLowerCase().includes(m) || v.model.toLowerCase().includes(m)
                  );
                  const IconComp = isMotor ? Bike : Car;

                  return (
                    <TouchableOpacity
                      key={v.id}
                      style={[styles.vehicleCard, isSelected && styles.vehicleCardSelected]}
                      activeOpacity={0.85}
                      onPress={() => setSelectedVehicleId(v.id)}
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
              placeholder="Jelaskan keluhan pada kendaraanmu (misal: rem bunyi decit, tarikan berat...)"
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
              <ActivityIndicator color={colors.textOnPrimary} size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Konfirmasi &amp; Buat Booking</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal Add Vehicle with KeyboardAvoidingView */}
      <Modal
        visible={isAddVehicleModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsAddVehicleModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalBackdropTouch}
              activeOpacity={1}
              onPress={() => setIsAddVehicleModalVisible(false)}
            />

            <View style={styles.modalSheet}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Tambah Kendaraan Baru</Text>
                <TouchableOpacity
                  onPress={() => setIsAddVehicleModalVisible(false)}
                  style={styles.modalCloseBtn}
                >
                  <X size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.modalInput}
                placeholder="Merk (misal: Honda / Toyota / Yamaha)"
                placeholderTextColor="#94A3B8"
                value={newBrand}
                onChangeText={setNewBrand}
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Model (misal: Beat / Avanza / NMAX)"
                placeholderTextColor="#94A3B8"
                value={newModel}
                onChangeText={setNewModel}
              />

              <View style={styles.modalRow}>
                <TextInput
                  style={[styles.modalInput, { flex: 1 }]}
                  placeholder="Tahun (misal: 2022)"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                  value={newYear}
                  onChangeText={setNewYear}
                />
                <TextInput
                  style={[styles.modalInput, { flex: 1.5 }]}
                  placeholder="Plat Nomor (B 1234 XYZ)"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                  value={newPlate}
                  onChangeText={setNewPlate}
                />
              </View>

              {/* Transmission Selector */}
              <View style={styles.transmissionRow}>
                <Text style={styles.transmissionLabel}>Transmisi:</Text>
                <TouchableOpacity
                  style={[
                    styles.transmissionOption,
                    newTransmission === 'Otomatis' && styles.transmissionOptionSelected,
                  ]}
                  onPress={() => setNewTransmission('Otomatis')}
                >
                  <Text
                    style={[
                      styles.transmissionText,
                      newTransmission === 'Otomatis' && styles.transmissionTextSelected,
                    ]}
                  >
                    Otomatis
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.transmissionOption,
                    newTransmission === 'Manual' && styles.transmissionOptionSelected,
                  ]}
                  onPress={() => setNewTransmission('Manual')}
                >
                  <Text
                    style={[
                      styles.transmissionText,
                      newTransmission === 'Manual' && styles.transmissionTextSelected,
                    ]}
                  >
                    Manual
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setIsAddVehicleModalVisible(false)}
                >
                  <Text style={styles.modalCancelText}>Batal</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalSaveButton, isAddingVehicle && { opacity: 0.7 }]}
                  onPress={handleCreateVehicle}
                  disabled={isAddingVehicle}
                >
                  {isAddingVehicle ? (
                    <ActivityIndicator color={colors.textOnPrimary} size="small" />
                  ) : (
                    <Text style={styles.modalSaveText}>Simpan Kendaraan</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* PROPER ELEGANT SUCCESS MODAL */}
      <Modal
        visible={isSuccessModalVisible}
        animationType="fade"
        transparent
        onRequestClose={handleGoHome}
      >
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            {/* Glowing Icon Badge */}
            <View style={styles.successIconBadge}>
              <Sparkles size={36} color={colors.textOnPrimary} />
            </View>

            <Text style={styles.successTitle}>Booking Servis Berhasil!</Text>
            <Text style={styles.successSubtitle}>
              Pendaftaran servis kamu telah diterima. Tim mekanik ThunderBolt siap melayani!
            </Text>

            {/* Ticket Code Pill */}
            {createdBooking && (
              <View style={styles.ticketPillBox}>
                <Text style={styles.ticketPillLabel}>KODE TIKET SERVIS</Text>
                <Text style={styles.ticketPillCode}>{createdBooking.booking_code}</Text>
              </View>
            )}

            {/* Detail Summary Box */}
            <View style={styles.successSummaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Layanan</Text>
                <Text style={styles.summaryValue} numberOfLines={1}>
                  {selectedServiceObj?.name || 'Servis Kendaraan'}
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Kendaraan</Text>
                <Text style={styles.summaryValue} numberOfLines={1}>
                  {selectedVehicleObj ? `${selectedVehicleObj.brand} ${selectedVehicleObj.model}` : 'Kendaraan'}
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Jadwal</Text>
                <Text style={styles.summaryValue}>
                  {selectedDate} · {selectedTime}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.successActions}>
              <TouchableOpacity
                style={styles.primarySuccessBtn}
                activeOpacity={0.88}
                onPress={handleGoToDetail}
              >
                <Text style={styles.primarySuccessBtnText}>Lihat Status &amp; Detail Servis</Text>
                <ChevronRight size={18} color={colors.textOnPrimary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondarySuccessBtn}
                activeOpacity={0.8}
                onPress={handleGoHome}
              >
                <Text style={styles.secondarySuccessBtnText}>Kembali ke Beranda</Text>
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
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 14,
  },

  /* Top Bar */
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
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    color: '#1E293B',
    fontSize: 17,
    fontWeight: '800',
  },

  /* Store Banner */
  storeBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.categoryBg,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.borderOrange,
  },
  storeBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.headingDark,
  },
  storeBannerAddress: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  /* Form Sections */
  formSection: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },

  /* Service Options */
  servicesGrid: {
    gap: 10,
  },
  serviceOptionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  serviceOptionCardSelected: {
    backgroundColor: '#FFF8F2',
    borderColor: colors.primary,
  },
  serviceOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceOptionName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  serviceOptionNameSelected: {
    color: colors.primary,
  },
  serviceOptionDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 17,
  },

  /* Vehicle Selection */
  vehiclesList: {
    gap: 10,
    marginBottom: 10,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  vehicleCardSelected: {
    backgroundColor: '#FFF8F2',
    borderColor: colors.primary,
  },
  vehicleIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleIconCircleDefault: {
    backgroundColor: colors.categoryBg,
  },
  vehicleIconCircleSelected: {
    backgroundColor: colors.primary,
  },
  vehicleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  vehicleTitleSelected: {
    color: colors.primary,
  },
  vehicleSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  noVehicleBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  noVehicleText: {
    color: '#64748B',
    fontSize: 13,
  },
  addVehicleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.categoryBg,
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.borderOrange,
  },
  addVehicleButtonText: {
    color: colors.primary,
    fontSize: 13.5,
    fontWeight: '700',
  },

  /* Dates & Time */
  datesRow: {
    gap: 10,
    marginBottom: 16,
  },
  dateChip: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    minWidth: 85,
  },
  dateChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dateChipDay: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  dateChipDate: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 2,
  },
  dateChipTextSelected: {
    color: colors.textOnPrimary,
  },

  timeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  timeHeaderTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  timeChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeChipText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  timeChipTextSelected: {
    color: colors.textOnPrimary,
  },

  /* Notes Input */
  notesInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 14,
    fontSize: 14,
    color: '#1E293B',
    minHeight: 85,
  },

  /* Submit CTA */
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '700',
  },

  /* Modal Add Vehicle */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalBackdropTouch: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    color: '#1E293B',
  },
  modalRow: {
    flexDirection: 'row',
    gap: 10,
  },
  transmissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  transmissionLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },
  transmissionOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  transmissionOptionSelected: {
    backgroundColor: colors.categoryBg,
    borderColor: colors.primary,
  },
  transmissionText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  transmissionTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  modalCancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 14,
  },
  modalSaveButton: {
    flex: 1.5,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    color: colors.textOnPrimary,
    fontWeight: '700',
    fontSize: 14,
  },

  /* PROPER ELEGANT SUCCESS MODAL STYLES */
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  successCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  successIconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 6,
  },
  successSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  ticketPillBox: {
    backgroundColor: '#FFF8F2',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.borderOrange,
    width: '100%',
    marginBottom: 16,
  },
  ticketPillLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: 2,
  },
  ticketPillCode: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.headingDark,
    letterSpacing: 0.5,
  },
  successSummaryBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    maxWidth: '65%',
    textAlign: 'right',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 6,
  },
  successActions: {
    width: '100%',
    gap: 10,
  },
  primarySuccessBtn: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primarySuccessBtnText: {
    color: colors.textOnPrimary,
    fontSize: 14.5,
    fontWeight: '700',
  },
  secondarySuccessBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondarySuccessBtnText: {
    color: '#64748B',
    fontSize: 13.5,
    fontWeight: '700',
  },
});
