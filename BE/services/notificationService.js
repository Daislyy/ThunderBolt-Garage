import db from '../config/database.js';

export const notificationService = {
  async getNotificationsByUserId(userId) {
    const { data, error } = await db
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('id', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  async createNotification(notificationData) {
    const { user_id, title, message, type = 'system', reference_id } = notificationData;

    const { data, error } = await db
      .from('notifications')
      .insert({
        user_id, title, message, type,
        reference_id: reference_id || null,
        is_read: false
      })
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async markAsRead(id) {
    const { data, error } = await db
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select('id');

    if (error) throw new Error(error.message);
    return data && data.length > 0;
  },

  async deleteNotification(id) {
    const { data, error } = await db
      .from('notifications')
      .delete()
      .eq('id', id)
      .select('id');

    if (error) throw new Error(error.message);
    return data && data.length > 0;
  }
};
