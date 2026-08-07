// services/notificationService.ts
import { apiRequest } from './api';

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
  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    const res = await apiRequest<Notification[]>(`/notifications/user/${userId}`);
    return res.data || [];
  },

  async markAsRead(id: number): Promise<boolean> {
    const res = await apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
    return res.success;
  },

  async deleteNotification(id: number): Promise<boolean> {
    const res = await apiRequest(`/notifications/${id}`, { method: 'DELETE' });
    return res.success;
  },
};
