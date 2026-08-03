// constants/colors.ts
// ThunderBolt Garage — single color theme (oren)

export const colors = {
  // Oren — inti warna aplikasi
  primary: '#FF6A00',        // Oren utama — CTA, ikon aktif, aksen
  primaryDark: '#C9500A',    // Oren tua — hero header, pressed state
  primaryDarker: '#7A3204',  // Oren nyaris coklat — teks kontras tinggi, status "selesai"
  primaryLight: '#FF9640',   // Oren muda — aksen sekunder, dot aktif
  primarySoft: '#FFDCB8',    // Oren pastel — background pill/card kecil
  primaryTint: '#FFF1E4',    // Oren sangat muda — background halaman

  surface: '#FFFFFF',
  card: '#FFEDDC',

  textPrimary: '#241207',
  textSecondary: '#8A6A50',
  textMuted: '#B79376',
  textOnPrimary: '#FFFFFF',

  background: '#FFF8F2',

  success: '#7A3204',
  error: '#C9500A',

  // Status booking dibedakan lewat saturasi/kegelapan oren, bukan hue lain
  statusPending: '#B79376',   // oren muted = menunggu
  statusProcess: '#FF6A00',   // oren penuh = sedang diproses
  statusFinish: '#7A3204',    // oren gelap = selesai

  overlay: 'rgba(36, 18, 7, 0.45)',
} as const;

export type AppColors = typeof colors;