import api from '@/shared/lib/api'
import type { Task, Event } from '../types'

// ── Payloads alinhados com o backend ────────────────────────────────────────

export interface CreateTaskPayload {
  title: string
  description?: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate?: string            // 'YYYY-MM-DD'
  categoryId?: string
  sharedWithSupport?: boolean
  subtasks?: { title: string; position: number }[]
  reminders?: { minutesBefore: number; persistent?: boolean }[]
}

export interface CreateEventPayload {
  title: string
  description?: string
  startAt: string             // ISO 8601 com Z, ex: 2026-12-01T14:00:00Z
  endAt: string
  type?: 'APPOINTMENT' | 'PERSONAL' | 'ROUTINE'
  rrule?: string
  categoryId?: string
  sharedWithSupport?: boolean
  reminders?: { minutesBefore: number; persistent?: boolean }[]
}

/** PUT /events/{id} só aceita campos de detalhe — sem startAt/endAt */
export interface UpdateEventPayload {
  title?: string
  description?: string
  type?: 'APPOINTMENT' | 'PERSONAL' | 'ROUTINE'
  categoryId?: string
  sharedWithSupport?: boolean
}

export interface RescheduleEventPayload {
  startAt: string
  endAt: string
  scope?: 'THIS_OCCURRENCE' | 'THIS_AND_FOLLOWING' | 'ALL'
}

// ── Service ──────────────────────────────────────────────────────────────────

export const agendaService = {
  // ── Tasks ──────────────────────────────────────────────────────────────────

  async getTasks(params?: { status?: string; dueBefore?: string }): Promise<Task[]> {
    const res = await api.get('/tasks', { params })
    // Backend retorna array direto; fallback para formato paginado (mock)
    const data = res.data
    return Array.isArray(data) ? data : (data.content ?? [])
  },

  async getTask(id: string): Promise<Task> {
    const res = await api.get(`/tasks/${id}`)
    return res.data
  },

  async createTask(data: CreateTaskPayload): Promise<Task> {
    const res = await api.post('/tasks', data)
    return res.data
  },

  /** Atualiza status da tarefa: PENDING | IN_PROGRESS | DONE | CANCELLED */
  async updateTaskStatus(id: string, status: string): Promise<Task> {
    const res = await api.patch(`/tasks/${id}/status`, { status })
    return res.data
  },

  /** Adiciona subtarefa a uma tarefa */
  async addSubtask(taskId: string, title: string, position: number): Promise<Task> {
    const res = await api.post(`/tasks/${taskId}/subtasks`, { title, position })
    return res.data
  },

  /** Marca subtarefa como concluída */
  async completeSubtask(taskId: string, subtaskId: string): Promise<void> {
    await api.patch(`/tasks/${taskId}/subtasks/${subtaskId}/done`)
  },

  async updateTask(id: string, data: Partial<CreateTaskPayload>): Promise<Task> {
    const res = await api.put(`/tasks/${id}`, data)
    return res.data
  },

  /** Soft-delete via archived_at */
  async deleteTask(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`)
  },

  async addReminder(taskId: string, minutesBefore: number, persistent?: boolean): Promise<Task> {
    const res = await api.post(`/tasks/${taskId}/reminders`, { minutesBefore, persistent })
    return res.data
  },

  async deleteReminder(taskId: string, reminderId: string): Promise<Task> {
    const res = await api.delete(`/tasks/${taskId}/reminders/${reminderId}`)
    return res.data
  },

  // ── Events ─────────────────────────────────────────────────────────────────

  async getEvents(params?: { from?: string; to?: string }): Promise<Event[]> {
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59)
    const defaults = {
      from: monthStart.toISOString(), // ex: 2026-11-01T00:00:00.000Z
      to:   monthEnd.toISOString(),   // ex: 2026-11-30T23:59:59.000Z
    }
    const res = await api.get('/events', { params: { ...defaults, ...params } })
    return Array.isArray(res.data) ? res.data : (res.data.content ?? [])
  },

  async createEvent(data: CreateEventPayload): Promise<Event> {
    const res = await api.post('/events', data)
    return res.data
  },

  /** Atualiza título/tipo/descrição — NÃO inclui startAt/endAt (use rescheduleEvent) */
  async updateEvent(id: string, data: UpdateEventPayload): Promise<Event> {
    const res = await api.put(`/events/${id}`, data)
    return res.data
  },

  /** Reagenda evento (backend: PUT /events/:id/reschedule) */
  async rescheduleEvent(id: string, data: RescheduleEventPayload): Promise<Event> {
    const res = await api.put(`/events/${id}/reschedule`, data)
    return res.data
  },

  /** Cancela evento — muda status para CANCELLED */
  async cancelEvent(id: string, scope?: string): Promise<void> {
    await api.post(`/events/${id}/cancel`, null, { params: scope ? { scope } : undefined })
  },

  async deleteEvent(id: string): Promise<void> {
    await api.delete(`/events/${id}`)
  },

  async addEventReminder(eventId: string, minutesBefore: number, persistent?: boolean): Promise<Event> {
    const res = await api.post(`/events/${eventId}/reminders`, { minutesBefore, persistent })
    return res.data
  },

  async deleteEventReminder(eventId: string, reminderId: string): Promise<Event> {
    const res = await api.delete(`/events/${eventId}/reminders/${reminderId}`)
    return res.data
  },
}
