// constants/colors.ts
// ThunderBolt Garage — warna resmi aplikasi

export const colors = {
  primary: '#FF6B1A',      // Safety orange
  secondary: '#2B6CB0',    // Mechanic blue
  background: '#F5F3EE',   // Workshop white
  surface: '#FFFFFF',      // White
  card: '#EAE6DC',         // Steel light
  textPrimary: '#22221E',  // Dark
  textSecondary: '#7A776D',// Gray
  success: '#2F9E44',      // Engine green
  error: '#E03131',        // Brake red

  // Turunan warna status booking, dipakai bareng success/secondary/error
  statusPending: '#7A776D',
  statusProcess: '#2B6CB0',
  statusFinish: '#2F9E44',

  overlay: 'rgba(34, 34, 30, 0.4)',
} as const;

export type AppColors = typeof colors;