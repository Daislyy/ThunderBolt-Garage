// services/notificationService.ts
// Modul layanan untuk menangani notifikasi pengguna terkait pembaruan status servis dan pesan sistem.
import { apiRequest } from './api';

// Struktur representasi entitas data notifikasi pengguna
export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  reference_id: number | null;
  is_read: boolean;
  created_at?: string;
  updated_at?: string;
}

export const notificationService = {
  /**
   * Mengambil seluruh daftar notifikasi yang ditujukan untuk pengguna tertentu.
   */
  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    const res = await apiRequest<Notification[]>(`/notifications/user/${userId}`);
    return res.data || [];
  },

  /**
   * Menandai suatu notifikasi telah dibaca (is_read: true).
   */
  async markAsRead(id: number): Promise<boolean> {
    const res = await apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
    return res.success;
  },

  /**
   * Menghapus pesan notifikasi tertentu.
   */
  async deleteNotification(id: number): Promise<boolean> {
    const res = await apiRequest(`/notifications/${id}`, { method: 'DELETE' });
    return res.success;
  },
};
