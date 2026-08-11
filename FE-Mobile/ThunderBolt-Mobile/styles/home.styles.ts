import { StyleSheet, Dimensions } from 'react-native';
import { colors } from '../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export const BANNER_WIDTH = SCREEN_WIDTH - 40;
export const REVIEW_CARD_WIDTH = SCREEN_WIDTH * 0.75;

// Reusable style helper objects
const flexCenter = {
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const shadowPrimary = {
  shadowColor: colors.primary,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.35,
  shadowRadius: 8,
  elevation: 4,
};

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 28,
  },

  /* Header Section */
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
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    ...flexCenter,
    ...shadowPrimary,
  },

  /* Greeting Section */
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

  /* Search Section */
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

  /* Banner Section */
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
    ...flexCenter,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  categoryCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 6,
    ...flexCenter,
    minHeight: 88,
  },
  categoryCardActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryCardInactive: {
    backgroundColor: colors.categoryBg,
    borderWidth: 1,
    borderColor: '#FFE4DC',
  },
  categoryIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    ...flexCenter,
    marginBottom: 6,
  },
  categoryIconCircleActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  categoryIconCircleInactive: {
    backgroundColor: '#FFFFFF',
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 14,
  },
  categoryNameActive: {
    color: colors.textOnPrimary,
  },
  categoryNameInactive: {
    color: colors.primary,
  },

  /* Customer Reviews Section */
  reviewsSection: {
    paddingBottom: 16,
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
  reviewsListContainer: {
    paddingHorizontal: 20,
    gap: 14,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    justifyContent: 'space-between',
  },
  reviewUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#E2E8F0',
  },
  reviewUserInfo: {
    flex: 1,
  },
  reviewUserName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.headingDark,
  },
  reviewDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.headingDark,
  },
  reviewServiceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF5F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  reviewServiceText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  reviewComment: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
    fontStyle: 'italic',
  },
});
