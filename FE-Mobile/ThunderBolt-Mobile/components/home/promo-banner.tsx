// components/home/promo-banner.tsx
// Komponen carousel banner promo diskon dan penawaran spesial di bagian atas halaman beranda.
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { styles, BANNER_WIDTH } from '../../styles/home.styles';

// Struktur representasi satu slide banner promo
export interface BannerItem {
  id: string;
  tag: string;
  title: string;
  imageUrl: string;
  buttonText: string;
  actionType: 'promo' | 'booking' | 'claim';
}

// Data promo banner bengkel dengan actionType masing-masing
export const PROMO_BANNERS: BannerItem[] = [
  {
    id: '1',
    tag: 'Diskon 30%',
    title: 'Penggantian\nSuku Cadang',
    imageUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=600&auto=format&fit=crop',
    buttonText: 'Lihat Promo',
    actionType: 'promo',
  },
  {
    id: '2',
    tag: 'Penawaran Spesial',
    title: 'Paket Servis\nRem & Kaliper',
    imageUrl: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=600&auto=format&fit=crop',
    buttonText: 'Booking Servis',
    actionType: 'booking',
  },
  {
    id: '3',
    tag: 'Gratis Cek 20 Titik',
    title: 'Diagnostik Mesin\n& Scanner OBD',
    imageUrl: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?q=80&w=600&auto=format&fit=crop',
    buttonText: 'Klaim Sekarang',
    actionType: 'claim',
  },
];

export function PromoBanner() {
  const router = useRouter();
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const bannerListRef = useRef<FlatList<BannerItem>>(null);

  const handleBannerScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / BANNER_WIDTH);
    setActiveBannerIndex(index);
  };

  const handlePressBanner = (item: BannerItem) => {
    if (item.actionType === 'promo') {
      router.push('/promos' as any);
    } else if (item.actionType === 'booking') {
      router.push('/booking/create' as any);
    } else if (item.actionType === 'claim') {
      // Tombol dinonaktifkan sementara sesuai instruksi
      Alert.alert(
        'Segera Hadir!',
        'Fitur klaim langsung sedang disiapkan. Anda dapat menikmati gratis pengecekan ini saat melakukan Booking Servis.',
        [{ text: 'Mengerti', style: 'default' }]
      );
    }
  };

  return (
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
        renderItem={({ item }) => {
          const isClaimDisabled = item.actionType === 'claim';

          return (
            <View style={[styles.bannerCard, { width: BANNER_WIDTH }]}>
              <View style={styles.bannerLeftContent}>
                <Text style={styles.bannerTag}>{item.tag}</Text>
                <Text style={styles.bannerTitle}>{item.title}</Text>
                <TouchableOpacity
                  style={[
                    styles.shopNowButton,
                    isClaimDisabled && {
                      backgroundColor: '#94A3B8',
                      shadowOpacity: 0.1,
                      elevation: 1,
                    },
                  ]}
                  activeOpacity={isClaimDisabled ? 0.7 : 0.85}
                  onPress={() => handlePressBanner(item)}
                >
                  <Text style={styles.shopNowButtonText}>
                    {item.buttonText}
                  </Text>
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
          );
        }}
      />

      {/* Dots Pagination */}
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
  );
}
