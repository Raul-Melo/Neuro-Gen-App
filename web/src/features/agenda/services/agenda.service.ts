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
  startAt: string             // ISO 8601
  endAt: string
  type?: 'APPOINTMENT' | 'TASK' | 'PERSONAL' | 'REMINDER'
  rrule?: string
  categoryId?: string
  sharedWithSupport?: boolean
  reminders?: { minutesBefore: number; persistent?: boolean }[]
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

  /** Soft-delete via archived_at */
  async deleteTask(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`)
  },

  // ── Events ─────────────────────────────────────────────────────────────────

  async getEvents(params?: { from?: string; to?: string }): Promise<Event[]> {
    const res = await api.get('/events', { params })
    return Array.isArray(res.data) ? res.data : (res.data.content ?? [])
  },

  async createEvent(data: CreateEventPayload): Promise<Event> {
    const res = await api.post('/events', data)
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
}
