// components/profile/garage-modal.tsx
// Komponen modal lembar bawah (bottom sheet) untuk mengelola garasi kendaraan pengguna, melihat status servis tiap armada, mendaftarkan kendaraan baru, dan menghapus kendaraan.
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Car,
  Bike,
  Plus,
  X,
  Wrench,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  Trash2,
} from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { Vehicle } from '../../services/vehicleService';
import { Booking } from '../../services/bookingService';

// Properti input untuk komponen modal garasi
interface GarageModalProps {
  visible: boolean;
  vehicles: Vehicle[];
  bookings: Booking[];
  isLoading: boolean;
  onClose: () => void;
  onBookServiceForVehicle: (vehicle: Vehicle) => void;
  onAddVehicle: (data: {
    brand: string;
    model: string;
    year: number;
    license_plate: string;
    transmission: string;
  }) => Promise<void>;
  onDeleteVehicle?: (vehicle: Vehicle) => Promise<void>;
}

export function GarageModal({
  visible,
  vehicles,
  bookings,
  isLoading,
  onClose,
  onBookServiceForVehicle,
  onAddVehicle,
  onDeleteVehicle,
}: GarageModalProps) {
  // State untuk mengontrol tampilan form tambah kendaraan vs daftar kendaraan
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State nilai input form kendaraan baru
  const [brand, setBrand] = useState('Honda');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [plate, setPlate] = useState('');
  const [transmission, setTransmission] = useState<'Matic (CVT)' | 'Manual'>('Matic (CVT)');

  // Handler validasi dan penyimpanan kendaraan baru ke server
  const handleSave = async () => {
    if (!brand.trim() || !model.trim() || !plate.trim()) {
      Alert.alert('Peringatan', 'Merk, tipe model, dan plat nomor kendaraan wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddVehicle({
        brand: brand.trim(),
        model: model.trim(),
        year: Number(year) || new Date().getFullYear(),
        license_plate: plate.trim().toUpperCase(),
        transmission,
      });

      // Reset form setelah sukses
      setModel('');
      setPlate('');
      setIsAdding(false);
      Alert.alert('Sukses!', 'Kendaraan baru berhasil didaftarkan ke garasi.');
    } catch (err: any) {
      Alert.alert('Gagal', err.message || 'Gagal menambahkan kendaraan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header Modal Garasi */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Garasi &amp; Kendaraan Saya</Text>
              <Text style={styles.subtitle}>Kelola armada kendaraan &amp; status servis</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {isAdding ? (
            /* Formulir Pendaftaran Kendaraan Baru */
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <Text style={styles.formTitle}>Tambah Kendaraan Baru</Text>

              <Text style={styles.label}>Merk Kendaraan</Text>
              <TextInput
                style={styles.input}
                placeholder="Contoh: Honda, Yamaha, Toyota"
                placeholderTextColor="#94A3B8"
                value={brand}
                onChangeText={setBrand}
              />

              <Text style={styles.label}>Model / Tipe</Text>
              <TextInput
                style={styles.input}
                placeholder="Contoh: Vario 160, Brio, Civic RS"
                placeholderTextColor="#94A3B8"
                value={model}
                onChangeText={setModel}
              />

              <Text style={styles.label}>Tahun Pembuatan</Text>
              <TextInput
                style={styles.input}
                placeholder="Contoh: 2023"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={year}
                onChangeText={setYear}
              />

              <Text style={styles.label}>Nomor Plat Polisi</Text>
              <TextInput
                style={styles.input}
                placeholder="Contoh: B 1234 XYZ"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
                value={plate}
                onChangeText={setPlate}
              />

              <Text style={styles.label}>Transmisi</Text>
              <View style={styles.transRow}>
                <TouchableOpacity
                  style={[styles.transBtn, transmission === 'Matic (CVT)' && styles.transBtnActive]}
                  onPress={() => setTransmission('Matic (CVT)')}
                >
                  <Text style={[styles.transBtnText, transmission === 'Matic (CVT)' && styles.transBtnTextActive]}>
                    Matic (CVT)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.transBtn, transmission === 'Manual' && styles.transBtnActive]}
                  onPress={() => setTransmission('Manual')}
                >
                  <Text style={[styles.transBtnText, transmission === 'Manual' && styles.transBtnTextActive]}>
                    Manual
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={styles.cancelFormBtn}
                  onPress={() => setIsAdding(false)}
                  disabled={isSubmitting}
                >
                  <Text style={styles.cancelFormBtnText}>Batal</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.submitFormBtn}
                  onPress={handleSave}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitFormBtnText}>Simpan Kendaraan</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            /* Daftar Seluruh Kendaraan di Garasi */
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              {isLoading ? (
                <View style={styles.centerLoading}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Memuat kendaraan...</Text>
                </View>
              ) : vehicles.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Car size={40} color="#CBD5E1" />
                  <Text style={styles.emptyTitle}>Belum Ada Kendaraan</Text>
                  <Text style={styles.emptySub}>
                    Daftarkan kendaraan pertama Anda untuk memudahkan proses booking servis.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  {vehicles.map((v, idx) => {
                    // Deteksi apakah kendaraan adalah sepeda motor atau mobil untuk ikon
                    const isMotor = ['honda', 'yamaha', 'kawasaki', 'suzuki', 'beat', 'vario', 'nmax', 'scoopy', 'aerox', 'pcx'].some(
                      (m) => v.brand.toLowerCase().includes(m) || v.model.toLowerCase().includes(m)
                    );
                    const IconComponent = isMotor ? Bike : Car;

                    // Periksa apakah kendaraan sedang menjalani proses servis aktif
                    const activeBooking = bookings.find(
                      (b) =>
                        (b.vehicle_id === v.id ||
                          b.license_plate?.trim().toUpperCase() === v.license_plate?.trim().toUpperCase()) &&
                        b.status !== 'Selesai' &&
                        b.status !== 'Dibatalkan'
                    );

                    return (
                      <View key={`garage-v-${v.id ?? v.license_plate ?? idx}`} style={styles.vehicleItemCard}>
                        {/* Header Kartu: Ikon, Info Utama, dan Status Badge */}
                        <View style={styles.vehicleHeaderRow}>
                          <View style={styles.vehicleIconCircle}>
                            <IconComponent size={20} color={colors.primary} />
                          </View>
                          <View style={styles.vehicleMainInfo}>
                            <Text style={styles.vehicleItemTitle} numberOfLines={1}>
                              {v.brand} {v.model}
                            </Text>
                            <Text style={styles.vehicleItemYear}>{v.year}</Text>
                          </View>

                          {activeBooking ? (
                            <View style={styles.inServiceBadge}>
                              <AlertCircle size={11} color="#C2410C" />
                              <Text style={styles.inServiceText} numberOfLines={1}>
                                {activeBooking.status}
                              </Text>
                            </View>
                          ) : (
                            <View style={styles.readyBadge}>
                              <CheckCircle2 size={11} color="#15803D" />
                              <Text style={styles.readyText}>Siap Jalan</Text>
                            </View>
                          )}
                        </View>

                        {/* Detail Spesifikasi: Plat Nomor & Transmisi */}
                        <View style={styles.specsRow}>
                          <View style={styles.specChip}>
                            <Text style={styles.specChipLabel}>Plat:</Text>
                            <Text style={styles.specChipValue}>{v.license_plate}</Text>
                          </View>
                          {v.transmission ? (
                            <View style={styles.specChip}>
                              <Text style={styles.specChipLabel}>Transmisi:</Text>
                              <Text style={styles.specChipValue}>{v.transmission}</Text>
                            </View>
                          ) : null}
                        </View>

                        {/* Baris Tombol Aksi */}
                        <View style={styles.cardActionsRow}>
                          <TouchableOpacity
                            style={[
                              styles.serviceThisVehicleBtn,
                              Boolean(activeBooking) && styles.serviceThisVehicleBtnDisabled,
                            ]}
                            activeOpacity={0.85}
                            disabled={Boolean(activeBooking)}
                            onPress={() => onBookServiceForVehicle(v)}
                          >
                            <Wrench size={13} color={activeBooking ? '#94A3B8' : '#FFFFFF'} />
                            <Text
                              style={[
                                styles.serviceThisVehicleBtnText,
                                Boolean(activeBooking) && { color: '#94A3B8' },
                              ]}
                            >
                              {activeBooking ? 'Sedang Diservis' : 'Servis Kendaraan Ini'}
                            </Text>
                          </TouchableOpacity>

                          {onDeleteVehicle && (
                            <TouchableOpacity
                              style={styles.deleteVehicleBtn}
                              activeOpacity={0.8}
                              onPress={() => {
                                if (activeBooking) {
                                  Alert.alert(
                                    'Tidak Dapat Dihapus',
                                    'Kendaraan ini tidak dapat dihapus karena sedang dalam proses servis aktif.'
                                  );
                                  return;
                                }
                                Alert.alert(
                                  'Hapus Kendaraan',
                                  `Apakah Anda yakin ingin menghapus ${v.brand} ${v.model} (${v.license_plate}) dari garasi?`,
                                  [
                                    { text: 'Batal', style: 'cancel' },
                                    {
                                      text: 'Hapus',
                                      style: 'destructive',
                                      onPress: () => onDeleteVehicle(v),
                                    },
                                  ]
                                );
                              }}
                            >
                              <Trash2 size={15} color="#EF4444" />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Add Vehicle Button */}
              <TouchableOpacity
                style={styles.openAddBtn}
                activeOpacity={0.88}
                onPress={() => setIsAdding(true)}
              >
                <Plus size={18} color={colors.primary} />
                <Text style={styles.openAddBtnText}>Daftarkan Kendaraan Baru</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '88%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.headingDark,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  centerLoading: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.headingDark,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },

  vehicleItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  vehicleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  vehicleIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleMainInfo: {
    flex: 1,
  },
  vehicleItemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.headingDark,
  },
  vehicleItemYear: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 1,
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  readyText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#16A34A',
  },
  inServiceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  inServiceText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#C2410C',
  },
  specsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  specChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  specChipLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  specChipValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  serviceThisVehicleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 9,
    borderRadius: 10,
  },
  serviceThisVehicleBtnDisabled: {
    backgroundColor: '#F1F5F9',
  },
  serviceThisVehicleBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  openAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: '#FDBA74',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 14,
  },
  openAddBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.primary,
  },

  // Form styles
  formTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.headingDark,
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.headingDark,
    marginBottom: 6,
  },
  input: {
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
    marginBottom: 18,
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
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },
  transBtnTextActive: {
    color: colors.primaryDark,
    fontWeight: '800',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelFormBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelFormBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  submitFormBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  submitFormBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  deleteVehicleBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

