import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  Bell,
  Camera,
  Car,
  ChevronRight,
  Edit3,
  Wrench,
  ShieldCheck,
  Settings,
  Headphones,
  Info,
  LogOut,
  Star,
  X,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { BASE_URL } from '../../services/api';

// Helper to get full image URL from backend path
const getProfileImageUrl = (profileImage: string | null | undefined): string | null => {
  if (!profileImage) return null;
  if (profileImage.startsWith('http')) return profileImage;
  // Convert /uploads/profiles/xxx.jpg → http://host:5000/uploads/profiles/xxx.jpg
  const baseHost = BASE_URL.replace('/api', '');
  return `${baseHost}${profileImage}`;
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();

  // Avatar state (defaults to user.profile_image if available)
  const [avatarUri, setAvatarUri] = useState<string | null>(getProfileImageUrl(user?.profile_image));

  // Edit Profile Modal State
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [isSaving, setIsSaving] = useState(false);

  // Pick Image from Gallery using expo-image-picker
  const handlePickImageFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Ditolak', 'Aplikasi membutuhkan izin akses galeri foto untuk mengunggah foto profil.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;

        if (user?.id) {
          const uploadedPath = await authService.uploadProfileImage(user.id, selectedUri);
          const fullUrl = getProfileImageUrl(uploadedPath);
          setAvatarUri(fullUrl);
          await refreshUser();
        }
        Alert.alert('Berhasil! 🎉', 'Foto profil berhasil diperbarui.');
      }
    } catch (error: any) {
      Alert.alert('Gagal', error.message || 'Terjadi kesalahan saat mengunggah foto.');
    }
  };

  // Take photo from Camera
  const handleTakePhotoFromCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Ditolak', 'Aplikasi membutuhkan izin kamera untuk mengambil foto profil.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;

        if (user?.id) {
          const uploadedPath = await authService.uploadProfileImage(user.id, selectedUri);
          const fullUrl = getProfileImageUrl(uploadedPath);
          setAvatarUri(fullUrl);
          await refreshUser();
        }
        Alert.alert('Berhasil! 🎉', 'Foto profil berhasil diambil dari Kamera.');
      }
    } catch (error: any) {
      Alert.alert('Gagal', error.message || 'Terjadi kesalahan saat mengambil foto.');
    }
  };

  // Avatar Options Dialog
  const handleAvatarPress = () => {
    Alert.alert(
      'Ubah Foto Profil',
      'Pilih metode untuk mengubah foto profil Anda:',
      [
        {
          text: '🖼️ Pilih dari Galeri',
          onPress: handlePickImageFromGallery,
        },
        {
          text: '📷 Ambil dari Kamera',
          onPress: handleTakePhotoFromCamera,
        },
        {
          text: 'Batal',
          style: 'cancel',
        },
      ]
    );
  };

  // Open Edit Profile
  const handleOpenEdit = () => {
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
    setIsEditModalVisible(true);
  };

  // Save Profile Changes
  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Peringatan', 'Nama lengkap tidak boleh kosong.');
      return;
    }
    setIsSaving(true);
    try {
      if (user?.id) {
        await authService.updateProfile(user.id, {
          name: editName,
          email: editEmail,
        });
      }
      await refreshUser();
      setIsEditModalVisible(false);
      Alert.alert('Berhasil', 'Profil Anda telah diperbarui!');
    } catch (err: any) {
      Alert.alert('Gagal', err.message || 'Gagal menyimpan perubahan profil.');
    } finally {
      setIsSaving(false);
    }
  };

  // Logout Handler with Confirmation
  const handleLogoutPress = () => {
    Alert.alert(
      'Konfirmasi Keluar',
      'Apakah Anda yakin ingin keluar dari akun ThunderBolt Garage?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ==================== RICH ORANGE HEADER SECTION ==================== */}
        <View style={styles.orangeHeader}>
          {/* Top Bar Navigation */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.headerIconButton}
              activeOpacity={0.7}
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(tabs)');
                }
              }}
            >
              <ArrowLeft size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Account</Text>

            <TouchableOpacity
              style={styles.headerIconButton}
              activeOpacity={0.7}
              onPress={() => Alert.alert('Notifikasi', 'Tidak ada notifikasi baru saat ini.')}
            >
              <Bell size={20} color="#FFFFFF" />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          </View>

          {/* Profile Avatar with Camera Badge */}
          <View style={styles.avatarSection}>
            <TouchableOpacity activeOpacity={0.85} onPress={handleAvatarPress} style={styles.avatarWrapper}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </Text>
                </View>
              )}
              {/* Camera Badge Overlay in Primary Orange */}
              <View style={styles.cameraBadge}>
                <Camera size={14} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            {/* Name & Email */}
            <Text style={styles.userName}>{user?.name || 'Pelanggan ThunderBolt'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'user@thunderbolt.com'}</Text>
          </View>
        </View>

        {/* ==================== WHITE SHEET BODY ==================== */}
        <View style={styles.whiteSheet}>
          {/* GROUP 1: Garasi & Kendaraan */}
          <View style={styles.menuGroup}>
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => router.push('/booking/create' as any)}
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.primaryTint }]}>
                <Car size={18} color={colors.primary} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Garasi &amp; Kendaraan Saya</Text>
                <Text style={styles.menuSubtitle}>Kelola daftar mobil &amp; motor</Text>
              </View>
              <ChevronRight size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* GROUP 2: Account & Activity */}
          <View style={styles.menuGroup}>
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={handleOpenEdit}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primaryTint }]}>
                <Edit3 size={18} color={colors.primaryDark} />
              </View>
              <Text style={styles.menuTitleOnly}>Edit Profil</Text>
              <ChevronRight size={18} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.itemDivider} />

            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={handlePickImageFromGallery}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primaryTint }]}>
                <ImageIcon size={18} color={colors.primaryDark} />
              </View>
              <Text style={styles.menuTitleOnly}>Ubah Foto dari Galeri</Text>
              <ChevronRight size={18} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.itemDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => router.push('/explore' as any)}
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.primaryTint }]}>
                <Wrench size={18} color={colors.primaryDark} />
              </View>
              <Text style={styles.menuTitleOnly}>Riwayat &amp; Status Servis</Text>
              <ChevronRight size={18} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.itemDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => Alert.alert('Keamanan', 'Fitur ubah kata sandi dapat diakses via verifikasi email.')}
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.primaryTint }]}>
                <ShieldCheck size={18} color={colors.primaryDark} />
              </View>
              <Text style={styles.menuTitleOnly}>Keamanan &amp; Kata Sandi</Text>
              <ChevronRight size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* GROUP 3: Settings & Support */}
          <View style={styles.menuGroup}>
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => Alert.alert('Pengaturan', 'Pengaturan aplikasi ThunderBolt Garage v1.0.')}
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.primaryTint }]}>
                <Settings size={18} color={colors.primaryDark} />
              </View>
              <Text style={styles.menuTitleOnly}>Pengaturan</Text>
              <ChevronRight size={18} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.itemDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() =>
                Alert.alert(
                  'Customer Service',
                  'Hubungi layanan pelanggan WhatsApp ThunderBolt Garage:\n+62 812-3456-7890\n(Jam Ops: 08.00 - 17.00 WIB)'
                )
              }
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.primaryTint }]}>
                <Headphones size={18} color={colors.primaryDark} />
              </View>
              <Text style={styles.menuTitleOnly}>Pusat Bantuan &amp; CS</Text>
              <ChevronRight size={18} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.itemDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => Alert.alert('Beri Ulasan', 'Terima kasih telah menggunakan aplikasi ThunderBolt Garage!')}
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.primaryTint }]}>
                <Star size={18} color={colors.primaryDark} />
              </View>
              <Text style={styles.menuTitleOnly}>Beri Ulasan Aplikasi</Text>
              <ChevronRight size={18} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.itemDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => Alert.alert('Tentang Aplikasi', 'ThunderBolt Garage Mobile App\nVersi 1.0.0 (Build 2026)')}
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.primaryTint }]}>
                <Info size={18} color={colors.primaryDark} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Tentang Aplikasi</Text>
                <Text style={styles.menuSubtitle}>Versi 1.0.0</Text>
              </View>
              <ChevronRight size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* GROUP 4: Red Logout Button */}
          <View style={[styles.menuGroup, styles.logoutGroup]}>
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.8} onPress={handleLogoutPress}>
              <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
                <LogOut size={18} color="#EF4444" />
              </View>
              <Text style={styles.logoutText}>Logout</Text>
              <ChevronRight size={18} color="#FCA5A5" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ==================== EDIT PROFILE MODAL ==================== */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIsEditModalVisible(false)}
          />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profil</Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Nama Lengkap</Text>
            <TextInput
              style={styles.textInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Masukkan nama lengkap"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.textInput, styles.disabledInput]}
              value={editEmail}
              editable={false}
              placeholder="Email"
              placeholderTextColor="#94A3B8"
            />
            <Text style={styles.inputHint}>Email terdaftar tidak dapat diubah secara langsung.</Text>

            <TouchableOpacity
              style={[styles.saveButton, isSaving && { opacity: 0.7 }]}
              activeOpacity={0.88}
              onPress={handleSaveProfile}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <CheckCircle2 size={18} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Simpan Perubahan</Text>
                </>
              )}
            </TouchableOpacity>
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
    backgroundColor: '#7A3204', // Dark warm orange matching app brand theme
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
  },

  /* Rich Orange Header Section */
  orangeHeader: {
    backgroundColor: '#7A3204', // Primary Darker Orange (#7A3204)
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 34,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: '#7A3204',
  },

  /* Avatar Section */
  avatarSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  avatarFallback: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary, // Vibrant Orange
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#7A3204',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  userEmail: {
    color: '#FFDCB8', // Soft Orange Pastel Text
    fontSize: 13.5,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },

  /* White Sheet Body */
  whiteSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -16,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },

  /* Menu Groups */
  menuGroup: {
    backgroundColor: '#FFF8F2', // Soft Orange Tint Background for Cards
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFE4DC',
  },
  logoutGroup: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FEE2E2',
    marginTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  menuSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  menuTitleOnly: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  logoutText: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '700',
    color: '#EF4444',
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#FFE4DC',
    marginLeft: 50,
  },

  /* Modal Edit Profile */
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    backgroundColor: '#FFF8F2',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FFDCB8',
    paddingHorizontal: 16,
    height: 48,
    fontSize: 14,
    color: colors.textPrimary,
  },
  disabledInput: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    color: '#94A3B8',
  },
  inputHint: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
