import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Menu, Search, User } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { StoreDetailModal, StoreBranch } from '../../components/store-detail-modal';
import { useAuth } from '../../contexts/AuthContext';
import { serviceService, Service } from '../../services/serviceService';
import { styles } from '../../styles/home.styles';
import { PromoBanner } from '../../components/home/promo-banner';
import { CategorySection } from '../../components/home/category-section';
import { CustomerReviewsSection } from '../../components/home/customer-reviews-section';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [apiServices, setApiServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<StoreBranch | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

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

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Navigation */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
            <Menu size={24} color={colors.headingDark} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileButton}
            activeOpacity={0.85}
            onPress={handleGoProfile}
          >
            <User size={20} color={colors.textOnPrimary} />
          </TouchableOpacity>
        </View>

        {/* User Greeting */}
        <View style={styles.greetingRow}>
          <Text style={styles.greetingText}>
            Halo, <Text style={styles.greetingName}>{user?.name || 'User'}</Text>
          </Text>
        </View>

        {/* Search Bar */}
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
        <PromoBanner />

        {/* Category Service Cards */}
        <CategorySection
          apiServices={apiServices}
          servicesLoading={servicesLoading}
          selectedCategory={selectedCategory}
          onSelectCategory={(id) => setSelectedCategory(selectedCategory === id ? '' : id)}
        />

        {/* Customer Reviews Section */}
        <CustomerReviewsSection />
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