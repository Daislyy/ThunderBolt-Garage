import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  Wrench,
  Disc,
  ShieldCheck,
  Droplet,
  Search,
} from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { Service } from '../../services/serviceService';
import { styles } from '../../styles/home.styles';

export interface CategoryItem {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
}

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'repairs', name: 'Repairs', icon: Wrench },
  { id: 'parts', name: 'Spare Parts', icon: Disc },
  { id: 'services', name: 'Services', icon: ShieldCheck },
  { id: 'oil', name: 'Oil & Fluids', icon: Droplet },
];

function getShortCategoryName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('oli') || lower.includes('fluids')) return 'Ganti Oli';
  if (lower.includes('mesin') || lower.includes('engine') || lower.includes('overhaul')) return 'Mesin';
  if (lower.includes('tune') || lower.includes('diagnostic')) return 'Tune Up';
  if (lower.includes('kaki') || lower.includes('spooring') || lower.includes('rem')) return 'Spooring';
  if (lower.includes('spare') || lower.includes('parts')) return 'Spare Parts';

  const cleaned = name.split('(')[0].trim();
  const words = cleaned.split(' ');
  if (words.length > 2) {
    return words.slice(0, 2).join(' ');
  }
  return cleaned;
}

interface CategorySectionProps {
  apiServices: Service[];
  servicesLoading: boolean;
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

export function CategorySection({
  apiServices,
  servicesLoading,
  selectedCategory,
  onSelectCategory,
}: CategorySectionProps) {
  return (
    <View style={styles.categoriesSection}>
      {servicesLoading ? (
        <ActivityIndicator color={colors.primary} style={{ paddingVertical: 20 }} />
      ) : apiServices.length > 0 ? (
        <View style={styles.categoriesScrollContainer}>
          {apiServices.slice(0, 3).map((service) => {
            const isActive = selectedCategory === String(service.id);
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
                onPress={() => onSelectCategory(String(service.id))}
              >
                <View
                  style={[
                    styles.categoryIconCircle,
                    isActive ? styles.categoryIconCircleActive : styles.categoryIconCircleInactive,
                  ]}
                >
                  <IconComponent
                    size={20}
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
                  {getShortCategoryName(service.name)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        /* Fallback categories if API fails */
        <View style={styles.categoriesScrollContainer}>
          {DEFAULT_CATEGORIES.slice(0, 3).map((category) => {
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
                onPress={() => onSelectCategory(category.id)}
              >
                <View
                  style={[
                    styles.categoryIconCircle,
                    isActive ? styles.categoryIconCircleActive : styles.categoryIconCircleInactive,
                  ]}
                >
                  <IconComponent
                    size={20}
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
        </View>
      )}
    </View>
  );
}
