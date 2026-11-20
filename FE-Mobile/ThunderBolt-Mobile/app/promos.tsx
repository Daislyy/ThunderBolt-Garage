// app/promos.tsx
// Halaman daftar promo dan voucher bengkel ThunderBolt Garage. Desain clean, lapang, modern, dan tidak menumpuk.
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Search,
  Tag,
  Calendar,
  AlertCircle,
  Copy,
  ChevronRight,
  X,
} from 'lucide-react-native';
import { colors } from '../constants/colors';

// Struktur representasi satu data promo bengkel
export interface PromoItem {
  id: string;
  code: string;
  title: string;
  category: string;
  tag: string;
  discountBadge: string;
  shortDesc: string;
  validUntil: string;
  imageUrl: string;
  minTransaction?: number;
  termsAndConditions: string[];
}

export const PROMO_CATALOG: PromoItem[] = [
  {
    id: 'promo-1',
    code: 'SPAREPART30',
    title: 'Diskon 30% Suku Cadang Original',
    category: 'Suku Cadang',
    tag: 'Diskon 30%',
    discountBadge: 'HEMAT 30%',
    shortDesc: 'Potongan harga hingga 30% untuk sparepart original kampas rem, filter oli, busi iridium, dan v-belt.',
    validUntil: '31 Des 2026',
    imageUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=600&auto=format&fit=crop',
    minTransaction: 150000,
    termsAndConditions: [
      'Berlaku untuk semua pelanggan terdaftar di aplikasi ThunderBolt Garage.',
      'Diskon 30% berlaku khusus pembelian suku cadang saat servis di bengkel.',
      'Minimal total transaksi jasa & sparepart sebesar Rp 150.000.',
      'Maksimal potongan diskon suku cadang hingga Rp 75.000 per transaksi.',
      'Promo tidak dapat digabungkan dengan voucher promo lainnya.',
      'Garansi resmi sparepart original tetap berlaku 30 hari.',
    ],
  },
  {
    id: 'promo-2',
    code: 'REMKALIPER20',
    title: 'Paket Servis Rem & Pembersihan Kaliper',
    category: 'Sistem Rem',
    tag: 'Penawaran Spesial',
    discountBadge: 'DISKON 20%',
    shortDesc: 'Jaga performa pengereman kendaraan tetap pakem dengan paket pembersihan kaliper dan bleeding minyak rem.',
    validUntil: '15 Jan 2027',
    imageUrl: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=600&auto=format&fit=crop',
    minTransaction: 100000,
    termsAndConditions: [
      'Berlaku untuk seluruh jenis kendaraan (motor & mobil pribadi).',
      'Termasuk pembersihan kaliper dan bleeding kuras minyak rem standar.',
      'Wajib booking jadwal servis terlebih dahulu melalui aplikasi.',
      'Berlaku pada jam operasional bengkel ThunderBolt (08:30 - 16:00 WIB).',
    ],
  },
  {
    id: 'promo-3',
    code: 'CEKGRATIS20',
    title: 'Gratis Pemeriksaan 20 Titik & Scan OBD',
    category: 'Inspeksi & Diagnosa',
    tag: 'Gratis Cek 20 Titik',
    discountBadge: 'GRATIS 100%',
    shortDesc: 'Pemeriksaan 20 titik keamanan kendaraan dan scan error sistem ECU/OBD tanpa biaya tambahan.',
    validUntil: '28 Feb 2027',
    imageUrl: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?q=80&w=600&auto=format&fit=crop',
    minTransaction: 0,
    termsAndConditions: [
      'Gratis biaya pengecekan untuk setiap booking servis apa pun di aplikasi.',
      'Meliputi aki, rem, tekanan ban, suspensi, lampu, cairan coolant, dan emisi.',
      'Hasil diagnosis ECU akan dilaporkan secara transparan oleh teknisi.',
      'Berlaku 1 kali per bulan untuk tiap kendaraan terdaftar.',
    ],
  },
  {
    id: 'promo-4',
    code: 'TUNEUPHEMAT',
    title: 'Tune Up Injeksi & Pembersihan Throttle Body',
    category: 'Performa Mesin',
    tag: 'Hemat Rp 35.000',
    discountBadge: 'POTONGAN Rp 35.000',
    shortDesc: 'Kembalikan tarikan responsif dan efisiensi bahan bakar dengan servis Tune Up sistem injeksi modern.',
    validUntil: '10 Mar 2027',
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=600&auto=format&fit=crop',
    minTransaction: 150000,
    termsAndConditions: [
      'Berlaku untuk paket servis Tune Up & Sistem Injeksi.',
      'Potongan langsung Rp 35.000 dari biaya jasa teknisi.',
      'Termasuk kalibrasi sensor TPS, reset ECU, dan cairan cleaner khusus.',
    ],
  },
  {
    id: 'promo-5',
    code: 'CVTOVERHAUL',
    title: 'Servis CVT Bebas Getar & Gredeg',
    category: 'Transmisi CVT',
    tag: 'Diskon 25%',
    discountBadge: 'HEMAT 25%',
    shortDesc: 'Pembersihan pulley depan belakang, mangkok ganda, dan pelumasan grease high-temp CVT.',
    validUntil: '30 Apr 2027',
    imageUrl: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=600&auto=format&fit=crop',
    minTransaction: 95000,
    termsAndConditions: [
      'Berlaku khusus untuk motor bertransmisi otomatis / Matic (CVT).',
      'Sudah mencakup grease CVT khusus tahan panas tinggi.',
      'Klaim voucher dapat dilakukan saat konfirmasi pengerjaan di aplikasi.',
    ],
  },
];

export default function PromosPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPromoForSnk, setSelectedPromoForSnk] = useState<PromoItem | null>(null);

  // Kategori unik untuk tab filter
  const categories = useMemo(() => {
    const set = new Set(PROMO_CATALOG.map((p) => p.category));
    return ['all', ...Array.from(set)];
  }, []);

  // Filter promo berdasarkan query search dan kategori
  const filteredPromos = useMemo(() => {
    return PROMO_CATALOG.filter((p) => {
      const matchSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [searchQuery, selectedCategory]);

  const handleCopyCode = (code: string) => {
    Alert.alert('Kode Promo Disalin!', `Kode "${code}" siap digunakan untuk booking servis Anda.`);
  };

  const handleUsePromo = (promo: PromoItem) => {
    setSelectedPromoForSnk(null);
    router.push({
      pathname: '/booking/create' as any,
    });
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      {/* Top Bar Header Clean */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <ArrowLeft size={18} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Promo & Kupon</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={filteredPromos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            {/* Search Bar Input Promo */}
            <View style={styles.searchBarContainer}>
              <Search size={16} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Cari promo atau kode voucher..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={15} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Kategori Chips Horizontal */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                const label = cat === 'all' ? 'Semua Promo' : cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catChip, isSelected && styles.catChipActive]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text style={[styles.catChipText, isSelected && styles.catChipTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Sub-header jumlah kupon */}
            <View style={styles.metaRow}>
              <Text style={styles.metaTitle}>Daftar Voucher Aktif</Text>
              <Text style={styles.metaCount}>{filteredPromos.length} kupon</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.ticketCard}>
            {/* Bagian Utama Voucher */}
            <View style={styles.cardMain}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.badgeRow}>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountBadgeText}>{item.discountBadge}</Text>
                  </View>
                  <Text style={styles.categoryTag}>{item.category}</Text>
                </View>

                {/* Tombol Syarat & Ketentuan */}
                <TouchableOpacity
                  style={styles.snkLinkBtn}
                  onPress={() => setSelectedPromoForSnk(item)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text style={styles.snkLinkText}>S&K</Text>
                  <ChevronRight size={12} color="#EA580C" />
                </TouchableOpacity>
              </View>

              <Text style={styles.promoTitle}>{item.title}</Text>
              <Text style={styles.promoDesc} numberOfLines={2}>
                {item.shortDesc}
              </Text>

              {/* Baris Bawah: Kode Voucher + Tombol Gunakan */}
              <View style={styles.cardFooterRow}>
                <TouchableOpacity
                  style={styles.codePill}
                  activeOpacity={0.7}
                  onPress={() => handleCopyCode(item.code)}
                >
                  <Tag size={12} color="#C2410C" />
                  <Text style={styles.codeText}>{item.code}</Text>
                  <Copy size={11} color="#EA580C" />
                </TouchableOpacity>

                <View style={styles.footerRight}>
                  <View style={styles.validRow}>
                    <Calendar size={11} color="#94A3B8" />
                    <Text style={styles.validText}>s/d {item.validUntil}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.useBtn}
                    activeOpacity={0.85}
                    onPress={() => handleUsePromo(item)}
                  >
                    <Text style={styles.useBtnText}>Pakai</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <AlertCircle size={40} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Promo Tidak Ditemukan</Text>
            <Text style={styles.emptySub}>
              {searchQuery ? `Tidak ada promo yang cocok dengan pencarian "${searchQuery}".` : 'Belum ada promo untuk kategori ini.'}
            </Text>
          </View>
        }
      />

      {/* ================= MODAL PENJELASAN SYARAT & KETENTUAN (SnK) ================= */}
      <Modal
        visible={Boolean(selectedPromoForSnk)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedPromoForSnk(null)}
      >
        <View style={styles.snkOverlay}>
          <View style={styles.snkSheet}>
            {/* Header Modal */}
            <View style={styles.snkHeader}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.snkTitle}>Syarat &amp; Ketentuan</Text>
                <Text style={styles.snkSubtitle} numberOfLines={1}>
                  {selectedPromoForSnk?.title}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedPromoForSnk(null)} style={styles.closeSnkBtn}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.snkScrollContent}>
              {/* Voucher Box Info */}
              <View style={styles.voucherBox}>
                <View>
                  <Text style={styles.voucherBoxLabel}>KODE VOUCHER</Text>
                  <Text style={styles.voucherBoxCode}>{selectedPromoForSnk?.code}</Text>
                </View>
                <TouchableOpacity
                  style={styles.copyVoucherBtn}
                  onPress={() => selectedPromoForSnk && handleCopyCode(selectedPromoForSnk.code)}
                >
                  <Copy size={13} color="#EA580C" />
                  <Text style={styles.copyVoucherBtnText}>Salin Kode</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.infoMetaRow}>
                <View style={styles.infoMetaItem}>
                  <Text style={styles.infoMetaLabel}>Periode Berlaku</Text>
                  <Text style={styles.infoMetaVal}>s/d {selectedPromoForSnk?.validUntil}</Text>
                </View>
                <View style={styles.infoMetaItem}>
                  <Text style={styles.infoMetaLabel}>Minimal Transaksi</Text>
                  <Text style={styles.infoMetaVal}>
                    {selectedPromoForSnk?.minTransaction
                      ? `Rp ${selectedPromoForSnk.minTransaction.toLocaleString('id-ID')}`
                      : 'Tanpa Minimal'}
                  </Text>
                </View>
              </View>

              <Text style={styles.snkSectionTitle}>Ketentuan Penggunaan</Text>
              <View style={styles.snkList}>
                {selectedPromoForSnk?.termsAndConditions.map((term, idx) => (
                  <View key={idx} style={styles.snkItemRow}>
                    <View style={styles.snkBullet} />
                    <Text style={styles.snkItemText}>{term}</Text>
                  </View>
                ))}
              </View>

              {/* Action Button */}
              <TouchableOpacity
                style={styles.snkActionCta}
                activeOpacity={0.88}
                onPress={() => selectedPromoForSnk && handleUsePromo(selectedPromoForSnk)}
              >
                <Text style={styles.snkActionCtaText}>Gunakan Voucher Ini Sekarang</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.headingDark,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 36,
    paddingTop: 12,
  },
  headerSection: {
    marginBottom: 6,
  },

  // Search Bar
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    padding: 0,
  },

  // Category Scroll
  categoryScroll: {
    gap: 8,
    paddingBottom: 10,
  },
  catChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  catChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  catChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Meta count row
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  metaTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  metaCount: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },

  // Card Voucher / Ticket Modern & Lapang
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardMain: {
    padding: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  discountBadge: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FDBA74',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  discountBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EA580C',
    letterSpacing: 0.2,
  },
  categoryTag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  snkLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  snkLinkText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#EA580C',
  },
  promoTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 20,
    marginBottom: 4,
  },
  promoDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 12,
  },

  // Footer Row
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  codePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderStyle: 'dashed',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 8,
  },
  codeText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#C2410C',
    letterSpacing: 0.3,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  validRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  validText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  useBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  useBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 6,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 18,
  },

  // SnK Bottom Sheet Modal
  snkOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  snkSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 24,
  },
  snkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  snkTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  snkSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeSnkBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  snkScrollContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16,
  },
  voucherBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  voucherBoxLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#9A3412',
    letterSpacing: 0.5,
  },
  voucherBoxCode: {
    fontSize: 15,
    fontWeight: '900',
    color: '#EA580C',
    marginTop: 2,
    letterSpacing: 0.6,
  },
  copyVoucherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  copyVoucherBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#EA580C',
  },
  infoMetaRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  infoMetaItem: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  infoMetaLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  infoMetaVal: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  snkSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  snkList: {
    gap: 8,
    marginBottom: 18,
  },
  snkItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  snkBullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#EA580C',
    marginTop: 6,
  },
  snkItemText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  snkActionCta: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  snkActionCtaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});

