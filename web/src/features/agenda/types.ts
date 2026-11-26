import type { TaskStatus, TaskPriority } from '@/shared/types/api.types'

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string
  dueTime?: string
  categoryId?: string
  completionPercentage?: number
  sharedWithSupport?: boolean
  tags?: string[]
  subtasks: Subtask[]
  reminders: Reminder[]
  createdAt?: string
  updatedAt?: string
}

export interface Subtask {
  id: string
  title: string
  done: boolean
}

export interface Reminder {
  id: string
  minutesBefore: number
  persistent: boolean
}

export interface Event {
  id: string
  title: string
  description?: string
  type?: 'APPOINTMENT' | 'PERSONAL' | 'ROUTINE'
  startAt: string
  endAt: string
  allDay?: boolean
  recurrenceRule?: string
  color?: string
  categoryId?: string
  sharedWithSupport?: boolean
  reminders: Reminder[]
  createdAt?: string
}

export interface Category {
  id: string
  name: string
  color: string
  icon?: string
}

export type AgendaView = 'day' | 'week' | 'month' | 'list' | 'kanban'
