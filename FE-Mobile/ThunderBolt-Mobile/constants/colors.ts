// constants/colors.ts
// Skema palet warna terpusat tema oranye khas ThunderBolt Garage untuk konsistensi seluruh UI mobile.

export const colors = {
  // Palet Oranye Utama — Identitas brand ThunderBolt Garage
  primary: '#FF6A00',        // Oranye utama — Tombol aksi (CTA), ikon aktif, dan aksen penting
  primaryDark: '#C9500A',    // Oranye tua — Header atas, state ketika elemen ditekan (pressed)
  primaryDarker: '#7A3204',  // Oranye sangat gelap / kecokelatan — Teks kontras tinggi dan aksen solid
  primaryLight: '#FF9640',   // Oranye muda — Aksen sekunder dan indikator dot aktif
  primarySoft: '#FFDCB8',    // Oranye pastel — Latar belakang badge / pill / kartu kecil
  primaryTint: '#FFF1E4',    // Oranye sangat lembut — Latar belakang halaman

  surface: '#FFFFFF',        // Warna permukaan kartu putih bersih
  card: '#FFEDDC',           // Warna kartu bernuansa hangat

  textPrimary: '#241207',    // Warna teks utama (hitam pekat bernuansa hangat)
  textSecondary: '#8A6A50',  // Warna teks sekunder / deskripsi singkat
  textMuted: '#B79376',      // Warna teks pudar / placeholder
  textOnPrimary: '#FFFFFF',  // Warna teks putih di atas tombol oranye

  background: '#FFF8F2',     // Latar belakang umum aplikasi

  success: '#7A3204',        // Warna indikator sukses
  error: '#C9500A',          // Warna indikator error / gagal

  // Palet Warna Status Alur Booking
  statusPending: '#B79376',      // Status Menunggu konfirmasi
  statusProcess: '#FF6A00',      // Status Sedang Dikerjakan / Diproses
  statusPayment: '#EA580C',      // Status Menunggu Pembayaran
  statusFinish: '#7A3204',       // Status Selesai
  statusCancelled: '#DC2626',    // Status Dibatalkan

  overlay: 'rgba(36, 18, 7, 0.45)', // Latar belakang redup (backdrop) saat modal terbuka

  // Palet Khusus Komponen Beranda & Tampilan
  categoryBg: '#FFF1EC',
  bannerBg: '#F8F9FA',
  headingDark: '#1E293B',
  subtextGray: '#64748B',
  ratingStar: '#FF9500',         // Warna bintang ulasan / review
  borderOrange: 'rgba(255, 106, 0, 0.35)',
} as const;

export type AppColors = typeof colors;
