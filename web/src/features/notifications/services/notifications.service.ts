import api from '@/shared/lib/api'

export interface Notification {
  id: string
  title: string
  body: string
  type: 'REMINDER' | 'LINK_ACCESS' | 'CHECKIN' | 'SYSTEM'
  read: boolean
  createdAt: string
}

export const notificationsService = {
  async getAll(): Promise<{ content: Notification[]; unreadCount: number }> {
    const res = await api.get('/notifications')
    return res.data
  },

  async markRead(id: string): Promise<void> {
    await api.post(`/notifications/${id}/read`)
  },

  async markAllRead(): Promise<void> {
    await api.post('/notifications/read-all')
  },
}
