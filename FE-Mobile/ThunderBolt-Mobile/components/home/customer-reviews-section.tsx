import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Star } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { styles, REVIEW_CARD_WIDTH } from '../../styles/home.styles';

export interface CustomerReviewItem {
  id: string;
  userName: string;
  userAvatar: string;
  rating: number;
  date: string;
  serviceName: string;
  comment: string;
}

export const CUSTOMER_REVIEWS: CustomerReviewItem[] = [
  {
    id: '1',
    userName: 'Budi Santoso',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
    rating: 5.0,
    date: '2 hari lalu',
    serviceName: 'Ganti Oli & Filter Oil',
    comment: 'Pelayanan sangat cepat dan profesional! Pengerjaan rapi, ruang tunggu ber-AC dan nyaman.',
  },
  {
    id: '2',
    userName: 'Rizky Pratama',
    userAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=200&auto=format&fit=crop',
    rating: 4.9,
    date: '5 hari lalu',
    serviceName: 'Servis Berkala Full System',
    comment: 'Sangat puas servis di ThunderBolt Garage. Mesin mobil jadi jauh lebih responsif dan halus!',
  },
  {
    id: '3',
    userName: 'Siti Rahmawati',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
    rating: 5.0,
    date: '1 minggu lalu',
    serviceName: 'Spooring & Balancing 3D',
    comment: 'Teknisi menjelaskan kondisi mobil dengan detail & transparan. Tidak ada biaya tersembunyi.',
  },
  {
    id: '4',
    userName: 'Ahmad Hidayat',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
    rating: 4.8,
    date: '2 minggu lalu',
    serviceName: 'Diagnosis Komputer ECU',
    comment: 'Masalah indikator engine check langsung ketemu solusinya. Sangat recommended!',
  },
];

export function CustomerReviewsSection() {
  const router = useRouter();

  return (
    <View style={styles.reviewsSection}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Ulasan Pelanggan</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/explore' as any)}
        >
          <Text style={styles.viewAllText}>Lihat semua</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={CUSTOMER_REVIEWS}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.reviewsListContainer}
        renderItem={({ item }) => (
          <View style={[styles.reviewCard, { width: REVIEW_CARD_WIDTH }]}>
            <View style={styles.reviewUserRow}>
              <Image
                source={{ uri: item.userAvatar }}
                style={styles.reviewAvatar}
                resizeMode="cover"
              />
              <View style={styles.reviewUserInfo}>
                <Text style={styles.reviewUserName} numberOfLines={1}>
                  {item.userName}
                </Text>
                <Text style={styles.reviewDate}>{item.date}</Text>
              </View>

              <View style={styles.ratingBadge}>
                <Star size={12} color={colors.ratingStar} fill={colors.ratingStar} />
                <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
              </View>
            </View>

            <View style={styles.reviewServiceBadge}>
              <Text style={styles.reviewServiceText} numberOfLines={1}>
                {item.serviceName}
              </Text>
            </View>

            <Text style={styles.reviewComment} numberOfLines={3}>
              "{item.comment}"
            </Text>
          </View>
        )}
      />
    </View>
  );
}
