import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  FlatList,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Menu,
  MapPin,
  Search,
  Wrench,
  Disc,
  ShieldCheck,
  Droplet,
  Star,
  LogOut,
} from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { StoreDetailModal, StoreBranch } from '../../components/store-detail-modal';
import { useAuth } from '../../contexts/AuthContext';
import { serviceService, Service } from '../../services/serviceService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - 40;
const STORE_CARD_WIDTH = SCREEN_WIDTH * 0.58;

interface BannerItem {
  id: string;
  tag: string;
  title: string;
  imageUrl: string;
  buttonText: string;
}

interface CategoryItem {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
}

const PROMO_BANNERS: BannerItem[] = [
  {
    id: '1',
    tag: '30% sale off',
    title: 'Replacement\ncar parts',
    imageUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=600&auto=format&fit=crop',
    buttonText: 'Shop Now',
  },
  {
    id: '2',
    tag: 'Special Offer',
    title: 'Complete Brake\nSystem Kit',
    imageUrl: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=600&auto=format&fit=crop',
    buttonText: 'Shop Now',
  },
  {
    id: '3',
    tag: 'Free Inspection',
    title: 'Full Engine\nDiagnostic Test',
    imageUrl: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?q=80&w=600&auto=format&fit=crop',
    buttonText: 'Claim Now',
  },
];

const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  'Repairs': Wrench,
  'Spare Parts': Disc,
  'Services': ShieldCheck,
  'Oil & Fluids': Droplet,
};

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'repairs', name: 'Repairs', icon: Wrench },
  { id: 'parts', name: 'Spare Parts', icon: Disc },
  { id: 'services', name: 'Services', icon: ShieldCheck },
  { id: 'oil', name: 'Oil & Fluids', icon: Droplet },
];

const NEARBY_STORES: StoreBranch[] = [
  {
    id: '1',
    name: 'ThunderBolt Garage Jakarta',
    branchTitle: 'Cabang Senayan · Spesialis Rem & Kaki-Kaki',
    category: 'Service & Repairs',
    rating: 3.5,
    reviewCount: 86,
    address: 'Jl. Medan, Jakarta, 14391',
    distance: '1.4 km',
    openHours: '08:00 - 17:00 WIB',
    isOpen: true,
    phone: '+62 812-3456-7890',
    imageUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=600&auto=format&fit=crop',
    services: [
      { id: 's1', name: 'Ganti Kampas Rem', category: 'Rem', duration: '30 Menit', price: 'Rp 120.000', popular: true },
      { id: 's2', name: 'Servis Kaki-Kaki & Shock', category: 'Suspensi', duration: '60 Menit', price: 'Rp 250.000' },
      { id: 's3', name: 'Ganti Oli & Filter Oil', category: 'Oli', duration: '25 Menit', price: 'Rp 95.000' },
    ],
  },
  {
    id: '2',
    name: 'ThunderBolt Garage Depok',
    branchTitle: 'Cabang Kelapa Gading · Bengkel Resmi Partner',
    category: 'Service & Repairs',
    rating: 5.0,
    reviewCount: 194,
    address: 'Jl. Margonda, Depok, 16424',
    distance: '2.8 km',
    openHours: '08:30 - 18:00 WIB',
    isOpen: true,
    phone: '+62 813-9876-5432',
    imageUrl: 'https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?q=80&w=600&auto=format&fit=crop',
    services: [
      { id: 's4', name: 'Servis Berkala Full System', category: 'General', duration: '90 Menit', price: 'Rp 350.000', popular: true },
      { id: 's5', name: 'Cleaning Injektor & Throttle', category: 'Engine', duration: '45 Menit', price: 'Rp 180.000' },
      { id: 's6', name: 'Spooring & Balancing 3D', category: 'Roda', duration: '40 Menit', price: 'Rp 160.000' },
    ],
  },
  {
    id: '3',
    name: 'ThunderBolt Garage Jakarta',
    branchTitle: 'Cabang Kebayoran Baru · Flagship Service Center',
    category: 'Spare Parts & Service',
    rating: 4.9,
    reviewCount: 312,
    address: 'Jl. Radio Dalam No. 45, Kebayoran Baru, Jakarta Selatan',
    distance: '1.2 km',
    openHours: '08:00 - 20:00 WIB',
    isOpen: true,
    phone: '+62 811-7788-9900',
    imageUrl: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=600&auto=format&fit=crop',
    services: [
      { id: 's7', name: 'Servis Rutin ThunderBolt Gold', category: 'Premium', duration: '60 Menit', price: 'Rp 299.000', popular: true },
      { id: 's8', name: 'Ganti Oli Synthetic Engine', category: 'Oli', duration: '30 Menit', price: 'Rp 175.000', popular: true },
      { id: 's9', name: 'Diagnosis Komputer ECU Scanner', category: 'Elektrikal', duration: '35 Menit', price: 'Rp 150.000' },
      { id: 's10', name: 'Overhaul & Tune Up Mesin', category: 'Engine', duration: '120 Menit', price: 'Rp 500.000' },
    ],
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // API data
  const [apiServices, setApiServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  // Store branch detail modal state
  const [selectedStore, setSelectedStore] = useState<StoreBranch | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const bannerListRef = useRef<FlatList<BannerItem>>(null);

  // Fetch services from API
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const services = await serviceService.getAllServices();
        setApiServices(services);
      } catch (error) {
        console.log('Failed to fetch services, using defaults');
      } finally {
        setServicesLoading(false);
      }
    };
    fetchServices();
  }, []);

  const handleBannerScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / BANNER_WIDTH);
    setActiveBannerIndex(index);
  };

  const handleOpenStoreModal = (store: StoreBranch) => {
    setSelectedStore(store);
    setIsModalVisible(true);
  };

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

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Row */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
            <Menu size={24} color={colors.headingDark} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.locationBadgeButton}
            activeOpacity={0.85}
            onPress={handleLogout}
          >
            <LogOut size={20} color={colors.textOnPrimary} />
          </TouchableOpacity>
        </View>

        {/* Greeting with user name */}
        <View style={styles.greetingRow}>
          <Text style={styles.greetingText}>
            Halo, <Text style={styles.greetingName}>{user?.name || 'User'}</Text> 👋
          </Text>
        </View>

        {/* Address Location Display */}
        <View style={styles.locationRow}>
          <MapPin size={18} color={colors.primary} style={styles.locationIcon} />
          <Text style={styles.locationText} numberOfLines={2}>
            4517 Washington Ave. Manchester, Kentucky 39495
          </Text>
        </View>

        {/* Search Bar Input */}
        <View style={styles.searchContainer}>
          <Search size={20} color={colors.primary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search store, Parts, etc.."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Promo Slider Banner */}
        <View style={styles.bannerSection}>
          <FlatList
            ref={bannerListRef}
            data={PROMO_BANNERS}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleBannerScroll}
            scrollEventThrottle={16}
            renderItem={({ item }) => (
              <View style={[styles.bannerCard, { width: BANNER_WIDTH }]}>
                <View style={styles.bannerLeftContent}>
                  <Text style={styles.bannerTag}>{item.tag}</Text>
                  <Text style={styles.bannerTitle}>{item.title}</Text>
                  <TouchableOpacity
                    style={styles.shopNowButton}
                    activeOpacity={0.85}
                    onPress={() => router.push('/explore' as any)}
                  >
                    <Text style={styles.shopNowButtonText}>{item.buttonText}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.bannerImageContainer}>
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.bannerImage}
                    resizeMode="cover"
                  />
                </View>
              </View>
            )}
          />

          {/* Banner Pagination Dots */}
          <View style={styles.dotsRow}>
            {PROMO_BANNERS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === activeBannerIndex && styles.dotActive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Services Section — from API */}
        <View style={styles.categoriesSection}>
          {servicesLoading ? (
            <ActivityIndicator color={colors.primary} style={{ paddingVertical: 20 }} />
          ) : apiServices.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScrollContainer}
            >
              {apiServices.map((service) => {
                const isActive = selectedCategory === String(service.id);
                // Pick an icon based on service name keywords
                let IconComponent = ShieldCheck;
                const lowerName = service.name.toLowerCase();
                if (lowerName.includes('oli') || lowerName.includes('fluids')) {
                  IconComponent = Droplet;
                } else if (lowerName.includes('mesin') || lowerName.includes('engine') || lowerName.includes('overhaul')) {
                  IconComponent = Wrench;
                } else if (lowerName.includes('kaki') || lowerName.includes('spooring') || lowerName.includes('rem')) {
                  IconComponent = Disc;
                } else if (lowerName.includes('tune') || lowerName.includes('diagnostic')) {
                  IconComponent = Search;
                }

                return (
                  <TouchableOpacity
                    key={service.id}
                    style={[
                      styles.categoryCard,
                      isActive ? styles.categoryCardActive : styles.categoryCardInactive,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => setSelectedCategory(
                      selectedCategory === String(service.id) ? '' : String(service.id)
                    )}
                  >
                    <View
                      style={[
                        styles.categoryIconCircle,
                        isActive ? styles.categoryIconCircleActive : styles.categoryIconCircleInactive,
                      ]}
                    >
                      <IconComponent
                        size={24}
                        color={isActive ? colors.textOnPrimary : colors.primary}
                      />
                    </View>
                    <Text
                      style={[
                        styles.categoryName,
                        isActive ? styles.categoryNameActive : styles.categoryNameInactive,
                      ]}
                      numberOfLines={2}
                    >
                      {service.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            /* Fallback to default categories if API fails */
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScrollContainer}
            >
              {DEFAULT_CATEGORIES.map((category) => {
                const IconComponent = category.icon;
                const isActive = selectedCategory === category.id;

                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryCard,
                      isActive ? styles.categoryCardActive : styles.categoryCardInactive,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => setSelectedCategory(category.id)}
                  >
                    <View
                      style={[
                        styles.categoryIconCircle,
                        isActive ? styles.categoryIconCircleActive : styles.categoryIconCircleInactive,
                      ]}
                    >
                      <IconComponent
                        size={24}
                        color={isActive ? colors.textOnPrimary : colors.primary}
                      />
                    </View>
                    <Text
                      style={[
                        styles.categoryName,
                        isActive ? styles.categoryNameActive : styles.categoryNameInactive,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Near By Stores Section */}
        <View style={styles.storesSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Near by stores</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/explore' as any)}
            >
              <Text style={styles.viewAllText}>View all</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={NEARBY_STORES}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storesListContainer}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.storeCard, { width: STORE_CARD_WIDTH }]}
                activeOpacity={0.9}
                onPress={() => handleOpenStoreModal(item)}
              >
                <View style={styles.storeImageWrapper}>
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.storeImage}
                    resizeMode="cover"
                  />
                  {/* Rating Badge */}
                  <View style={styles.ratingBadge}>
                    <Star size={13} color={colors.ratingStar} fill={colors.ratingStar} />
                    <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                  </View>
                </View>

                <View style={styles.storeCardDetails}>
                  <Text style={styles.storeCategory}>{item.category}</Text>
                  <Text style={styles.storeName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={styles.storeAddressRow}>
                    <MapPin size={14} color={colors.primary} style={{ marginTop: 1 }} />
                    <Text style={styles.storeAddress} numberOfLines={2}>
                      {item.address}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </ScrollView>

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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 28,
  },

  /* Top Header Row */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  locationBadgeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },

  /* Greeting */
  greetingRow: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  greetingText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  greetingName: {
    color: colors.headingDark,
    fontWeight: '800',
    fontSize: 17,
  },

  /* Address Bar */
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  locationIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.headingDark,
    lineHeight: 20,
  },

  /* Search Bar Input */
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.headingDark,
    paddingVertical: 0,
  },

  /* Promo Slider Banner */
  bannerSection: {
    marginBottom: 20,
  },
  bannerCard: {
    marginHorizontal: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 160,
    overflow: 'hidden',
  },
  bannerLeftContent: {
    flex: 1,
    paddingRight: 12,
  },
  bannerTag: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 6,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.headingDark,
    lineHeight: 26,
    marginBottom: 14,
  },
  shopNowButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  shopNowButtonText: {
    color: colors.textOnPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  bannerImageContainer: {
    width: 110,
    height: 110,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#CBD5E1',
  },
  dotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },

  /* Categories Section */
  categoriesSection: {
    marginBottom: 24,
  },
  categoriesScrollContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryCard: {
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 105,
    maxWidth: 120,
  },
  categoryCardActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  categoryCardInactive: {
    backgroundColor: colors.categoryBg,
  },
  categoryIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  categoryIconCircleActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  categoryIconCircleInactive: {
    backgroundColor: 'transparent',
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  categoryNameActive: {
    color: colors.textOnPrimary,
  },
  categoryNameInactive: {
    color: colors.primary,
  },

  /* Nearby Stores Section */
  storesSection: {
    paddingBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.headingDark,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  storesListContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  storeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  storeImageWrapper: {
    height: 125,
    width: '100%',
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  storeImage: {
    width: '100%',
    height: '100%',
  },
  ratingBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.headingDark,
  },
  storeCardDetails: {
    padding: 12,
  },
  storeCategory: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  storeName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.headingDark,
    marginBottom: 6,
  },
  storeAddressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  storeAddress: {
    flex: 1,
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
});