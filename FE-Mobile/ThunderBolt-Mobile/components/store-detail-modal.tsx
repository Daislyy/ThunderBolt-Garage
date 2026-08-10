import React from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {
  X,
  Star,
  MapPin,
  Clock,
  Phone,
  Wrench,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react-native';
import { colors } from '../constants/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface BranchService {
  id: string;
  name: string;
  category: string;
  duration: string;
  price: string;
  popular?: boolean;
}

export interface StoreBranch {
  id: string;
  name: string;
  branchTitle: string;
  category: string;
  rating: number;
  reviewCount: number;
  address: string;
  distance: string;
  openHours: string;
  isOpen: boolean;
  phone: string;
  imageUrl: string;
  services: BranchService[];
}

interface StoreDetailModalProps {
  visible: boolean;
  store: StoreBranch | null;
  onClose: () => void;
  onSelectBooking: (store: StoreBranch) => void;
}

export function StoreDetailModal({
  visible,
  store,
  onClose,
  onSelectBooking,
}: StoreDetailModalProps) {
  if (!store) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdropTouch}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.sheetContainer}>
          {/* Top Handle bar */}
          <View style={styles.handleRow}>
            <View style={styles.dragHandle} />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <X size={20} color={colors.headingDark} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Store Hero Image Banner */}
            <View style={styles.imageBannerWrapper}>
              <Image
                source={{ uri: store.imageUrl }}
                style={styles.heroImage}
                resizeMode="cover"
              />

              {/* Floating Rating & Distance Badges */}
              <View style={styles.badgeRowOverlay}>
                <View style={styles.floatingBadge}>
                  <Star size={14} color={colors.ratingStar} fill={colors.ratingStar} />
                  <Text style={styles.floatingBadgeText}>
                    {store.rating.toFixed(1)} ({store.reviewCount} Ulasan)
                  </Text>
                </View>

                <View style={styles.floatingBadge}>
                  <MapPin size={13} color={colors.primary} />
                  <Text style={styles.floatingBadgeText}>{store.distance}</Text>
                </View>
              </View>
            </View>

            {/* Branch Header Info */}
            <View style={styles.storeHeaderSection}>
              <Text style={styles.storeCategoryTag}>{store.category}</Text>
              <Text style={styles.storeTitle}>{store.name}</Text>
              <Text style={styles.storeBranchSubtitle}>{store.branchTitle}</Text>
            </View>

            {/* Operating Hours & Status Bar */}
            <View style={styles.infoCardRow}>
              <View style={styles.infoCard}>
                <View
                  style={[
                    styles.statusIndicatorDot,
                    { backgroundColor: store.isOpen ? '#10B981' : '#EF4444' },
                  ]}
                />
                <View>
                  <Text
                    style={[
                      styles.statusText,
                      { color: store.isOpen ? '#059669' : '#DC2626' },
                    ]}
                  >
                    {store.isOpen ? 'Buka Sekarang' : 'Tutup'}
                  </Text>
                  <View style={styles.hoursRow}>
                    <Clock size={12} color="#64748B" />
                    <Text style={styles.hoursText}>{store.openHours}</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.phoneButton} activeOpacity={0.8}>
                <Phone size={16} color={colors.primary} />
                <Text style={styles.phoneButtonText}>Hubungi</Text>
              </TouchableOpacity>
            </View>

            {/* Address Row */}
            <View style={styles.addressSection}>
              <MapPin size={18} color={colors.primary} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.addressLabel}>Alamat Cabang Bengkel</Text>
                <Text style={styles.addressText}>{store.address}</Text>
              </View>
            </View>

            {/* Services Offered Section */}
            <View style={styles.servicesSection}>
              <View style={styles.servicesHeaderRow}>
                <ShieldCheck size={18} color={colors.primary} />
                <Text style={styles.servicesSectionTitle}>
                  Layanan Servis di Cabang Ini
                </Text>
              </View>

              <View style={styles.servicesList}>
                {store.services.map((service) => (
                  <View key={service.id} style={styles.serviceItemCard}>
                    <View style={styles.serviceLeft}>
                      <View style={styles.serviceTitleRow}>
                        <CheckCircle2 size={16} color={colors.primary} />
                        <Text style={styles.serviceName}>{service.name}</Text>
                        {service.popular && (
                          <View style={styles.popularBadge}>
                            <Text style={styles.popularBadgeText}>Populer</Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.serviceMetaText}>
                        {service.category} · Est. {service.duration}
                      </Text>
                    </View>

                    <Text style={styles.servicePrice}>{service.price}</Text>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Sticky Bottom Action */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.bookingCtaButton}
              activeOpacity={0.88}
              onPress={() => onSelectBooking(store)}
            >
              <Wrench size={18} color={colors.textOnPrimary} />
              <Text style={styles.bookingCtaText}>Booking Servis di Cabang Ini</Text>
              <ChevronRight size={18} color={colors.textOnPrimary} />
            </TouchableOpacity>
          </View>
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
  backdropTouch: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: SCREEN_HEIGHT * 0.85,
    paddingTop: 12,
  },
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    position: 'relative',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  /* Hero Image Banner */
  imageBannerWrapper: {
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
    backgroundColor: '#E2E8F0',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  badgeRowOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  floatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  floatingBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.headingDark,
  },

  /* Header Section */
  storeHeaderSection: {
    marginBottom: 16,
  },
  storeCategoryTag: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  storeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.headingDark,
    marginBottom: 4,
  },
  storeBranchSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },

  /* Operating Hours Card */
  infoCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusIndicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  hoursText: {
    fontSize: 12,
    color: '#64748B',
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.categoryBg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  phoneButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },

  /* Address Section */
  addressSection: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FFF8F2',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.card,
    marginBottom: 20,
  },
  addressLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 2,
  },
  addressText: {
    fontSize: 12.5,
    color: colors.headingDark,
    lineHeight: 18,
  },

  /* Services Section */
  servicesSection: {
    marginBottom: 10,
  },
  servicesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  servicesSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.headingDark,
  },
  servicesList: {
    gap: 10,
  },
  serviceItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  serviceLeft: {
    flex: 1,
    paddingRight: 10,
  },
  serviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.headingDark,
  },
  popularBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  popularBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
  serviceMetaText: {
    fontSize: 11,
    color: '#64748B',
  },
  servicePrice: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },

  /* Bottom Bar */
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  bookingCtaButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bookingCtaText: {
    color: colors.textOnPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
});
