/**
 * Seed data para testes de navegação sem backend.
 * Todos os dados são gerados em memória e resetados ao recarregar a página.
 * Não alterar estrutura sem sincronizar com os types de cada feature.
 */

import type { User, AuthTokens } from '@/shared/types/auth.types'

// ── Auth
export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    email: 'titular@demo.com',
    name: 'Ana Neurogen',
    role: 'TITULAR',
    status: 'ACTIVE',
    emailVerified: true,
    totpEnabled: false,
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'u2',
    email: 'apoio@demo.com',
    name: 'Dr. Bruno Apoio',
    role: 'APOIO',
    status: 'ACTIVE',
    emailVerified: true,
    totpEnabled: false,
    createdAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'u3',
    email: 'raul.fsm692@gmail.com',
    name: 'Raul Fernandes',
    role: 'TITULAR',
    status: 'ACTIVE',
    emailVerified: true,
    totpEnabled: false,
    createdAt: '2026-11-19T10:00:00Z',
  },
]

// Senhas dos usuários de teste (somente mock — nunca enviadas ao servidor real)
export const MOCK_CREDENTIALS: Record<string, string> = {
  'titular@demo.com': '',           // aceita qualquer senha
  'apoio@demo.com': '',             // aceita qualquer senha
  'raul.fsm692@gmail.com': 'Raul_Melo@2026',
}

export const MOCK_TOKENS: AuthTokens = {
  accessToken: 'mock-access-token-dev',
  refreshToken: 'mock-refresh-token-dev',
  expiresIn: 900,
}

// ── Tasks
export const MOCK_TASKS = [
  { id: 't1', title: 'Revisar documentação do módulo de foco', status: 'TODO',        priority: 'HIGH',   dueDate: new Date().toISOString().slice(0,10), dueTime: '10:00', tags: ['trabalho'], subtasks: [], reminders: [], createdAt: '2026-11-18T08:00:00Z', updatedAt: '2026-11-18T08:00:00Z' },
  { id: 't2', title: 'Consulta com terapeuta',                 status: 'TODO',        priority: 'HIGH',   dueDate: new Date().toISOString().slice(0,10), dueTime: '14:30', tags: ['saúde'],    subtasks: [], reminders: [], createdAt: '2026-11-17T09:00:00Z', updatedAt: '2026-11-17T09:00:00Z' },
  { id: 't3', title: 'Estudar TypeScript avançado',            status: 'IN_PROGRESS', priority: 'MEDIUM', dueDate: null,                                 dueTime: null,    tags: ['estudo'],   subtasks: [{ id: 'st1', title: 'Generics', done: true }, { id: 'st2', title: 'Utility types', done: false }], reminders: [], createdAt: '2026-11-16T10:00:00Z', updatedAt: '2026-11-19T08:00:00Z' },
  { id: 't4', title: 'Preparar apresentação de quinta',        status: 'TODO',        priority: 'HIGH',   dueDate: '2026-11-21',                         dueTime: '09:00', tags: ['trabalho'], subtasks: [], reminders: [], createdAt: '2026-11-15T07:00:00Z', updatedAt: '2026-11-15T07:00:00Z' },
  { id: 't5', title: 'Lembrar de beber água',                  status: 'DONE',        priority: 'LOW',    dueDate: new Date().toISOString().slice(0,10), dueTime: null,    tags: ['saúde'],    subtasks: [], reminders: [], createdAt: '2026-11-19T06:00:00Z', updatedAt: '2026-11-19T12:00:00Z' },
  { id: 't6', title: 'Organizar lista de compras',             status: 'TODO',        priority: 'LOW',    dueDate: null,                                 dueTime: null,    tags: ['pessoal'],  subtasks: [], reminders: [], createdAt: '2026-11-14T10:00:00Z', updatedAt: '2026-11-14T10:00:00Z' },
]

// ── Events
const today = new Date().toISOString().slice(0, 10)
export const MOCK_EVENTS = [
  { id: 'e1', title: 'Reunião de equipe',    startAt: `${today}T09:00:00Z`, endAt: `${today}T10:00:00Z`, allDay: false, color: '#6366f1', reminders: [], createdAt: '2026-11-18T08:00:00Z' },
  { id: 'e2', title: 'Almoço com família',   startAt: `${today}T12:00:00Z`, endAt: `${today}T13:30:00Z`, allDay: false, color: '#22d3ee', reminders: [], createdAt: '2026-11-18T08:00:00Z' },
  { id: 'e3', title: 'Sessão de terapia',    startAt: `${today}T16:00:00Z`, endAt: `${today}T17:00:00Z`, allDay: false, color: '#c084fc', reminders: [], createdAt: '2026-11-17T10:00:00Z' },
]

// ── Focus sessions
export const MOCK_FOCUS_SESSIONS = [
  { id: 'f1', taskTitle: 'Estudar TypeScript',        workMinutes: 25, breakMinutes: 5, status: 'DONE', elapsedSeconds: 1500, completedCycles: 2, startedAt: '2026-11-19T08:00:00Z', endedAt: '2026-11-19T09:10:00Z' },
  { id: 'f2', taskTitle: 'Revisão de documentação',   workMinutes: 25, breakMinutes: 5, status: 'DONE', elapsedSeconds: 1500, completedCycles: 1, startedAt: '2026-11-19T10:00:00Z', endedAt: '2026-11-19T10:30:00Z' },
  { id: 'f3', taskTitle: null,                         workMinutes: 25, breakMinutes: 5, status: 'ABANDONED', elapsedSeconds: 740, completedCycles: 0, startedAt: '2026-11-18T14:00:00Z', endedAt: '2026-11-18T14:12:00Z' },
]

// ── Emotional check-ins (últimos 7 dias)
export const MOCK_CHECKINS = [
  { id: 'c1', moodLevel: 3, energyLevel: 2, note: 'Dia agitado, muitas reuniões.',       checkedAt: '2026-11-13T20:00:00Z' },
  { id: 'c2', moodLevel: 4, energyLevel: 3, note: null,                                  checkedAt: '2026-11-14T21:00:00Z' },
  { id: 'c3', moodLevel: 2, energyLevel: 2, note: 'Estresse com prazo do projeto.',      checkedAt: '2026-11-15T19:30:00Z' },
  { id: 'c4', moodLevel: 4, energyLevel: 4, note: 'Consegui terminar a tarefa principal.',checkedAt: '2026-11-16T22:00:00Z' },
  { id: 'c5', moodLevel: 5, energyLevel: 4, note: 'Ótimo dia! Foco muito bom.',          checkedAt: '2026-11-17T20:00:00Z' },
  { id: 'c6', moodLevel: 4, energyLevel: 5, note: null,                                  checkedAt: '2026-11-18T21:00:00Z' },
]

// ── Links (vínculos)
export const MOCK_LINKS = [
  { id: 'l1', apoioId: 'u2', apoioName: 'Dr. Bruno Apoio',  apoioEmail: 'apoio@demo.com',      status: 'ACTIVE',  permissions: ['AGENDA', 'EMOTIONAL'], createdAt: '2026-09-01T10:00:00Z', lastAccessAt: '2026-11-18T14:00:00Z' },
  { id: 'l2', apoioId: 'u3', apoioName: 'Maria Silva',       apoioEmail: 'maria@familia.com',   status: 'ACTIVE',  permissions: ['AGENDA'],              createdAt: '2026-10-15T10:00:00Z', lastAccessAt: '2026-11-10T09:00:00Z' },
  { id: 'l3', apoioId: 'u4', apoioName: 'Carlos Ferreira',   apoioEmail: 'carlos@email.com',    status: 'PENDING', permissions: [],                      createdAt: '2026-11-18T16:00:00Z', lastAccessAt: null },
]

// ── Vault entries (payloads já seriam cifrados em prod — aqui em texto claro para mock)
export const MOCK_VAULT_ENTRIES = [
  { id: 'v1', type: 'login',       title: 'Google',       encryptedPayload: JSON.stringify({ username: 'ana@gmail.com', password: '••••••••', url: 'https://accounts.google.com' }) },
  { id: 'v2', type: 'login',       title: 'GitHub',       encryptedPayload: JSON.stringify({ username: 'ana-dev',        password: '••••••••', url: 'https://github.com' }) },
  { id: 'v3', type: 'secure-note', title: 'Chave 2FA backup', encryptedPayload: JSON.stringify({ note: 'ABCD-EFGH-IJKL-MNOP' }) },
]

// ── Notifications
export const MOCK_NOTIFICATIONS = [
  { id: 'n1', title: 'Lembrete: Consulta com terapeuta',     body: 'Hoje às 14:30',         read: false, createdAt: '2026-11-19T14:00:00Z', type: 'REMINDER' },
  { id: 'n2', title: 'Dr. Bruno Apoio acessou sua agenda',   body: 'Há 2 horas',            read: false, createdAt: '2026-11-19T12:00:00Z', type: 'LINK_ACCESS' },
  { id: 'n3', title: 'Check-in emocional pendente',          body: 'Você não registrou hoje', read: true, createdAt: '2026-11-18T20:00:00Z', type: 'CHECKIN' },
]
