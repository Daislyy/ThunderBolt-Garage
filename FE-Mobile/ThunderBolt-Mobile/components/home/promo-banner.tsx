import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { styles, BANNER_WIDTH } from '../../styles/home.styles';

export interface BannerItem {
  id: string;
  tag: string;
  title: string;
  imageUrl: string;
  buttonText: string;
}

export const PROMO_BANNERS: BannerItem[] = [
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

export function PromoBanner() {
  const router = useRouter();
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const bannerListRef = useRef<FlatList<BannerItem>>(null);

  const handleBannerScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / BANNER_WIDTH);
    setActiveBannerIndex(index);
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
