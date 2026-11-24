/**
 * MSW request handlers — interceptam as mesmas chamadas axios do app real.
 * Mantém a integração com o backend intacta: basta desligar VITE_MOCK=true
 * para usar o backend real sem mudar uma linha de código das features.
 *
 * Paths alinhados com o backend real (docs/integracao/api-*.md).
 */
import { http, HttpResponse, delay } from 'msw'
import {
  MOCK_USERS,
  MOCK_CREDENTIALS,
  MOCK_TOKENS,
  MOCK_TASKS,
  MOCK_EVENTS,
  MOCK_FOCUS_SESSIONS,
  MOCK_CHECKINS,
  MOCK_LINKS,
  MOCK_VAULT_ENTRIES,
  MOCK_NOTIFICATIONS,
} from './data/seed'

const BASE = '/api/v1'
const D = 300

// ── Tipos de estado em memória
type Task = { id: string; title: string; status: string; priority: string; dueDate: string | null; dueTime: string | null; tags: string[]; subtasks: { id: string; title: string; done: boolean }[]; reminders: unknown[]; createdAt: string; updatedAt: string }
type CheckIn = { id: string; moodLevel: number; energyLevel: number; note: string | null; checkedAt: string }
type VaultEntry = { id: string; type: string; title: string; encryptedPayload: string }
type Link = { id: string; apoioId: string; apoioName: string; apoioEmail: string; status: string; permissions: string[]; createdAt: string; lastAccessAt: string | null }

// ── Estado em memória (mutável durante a sessão)
let tasks: Task[]             = [...MOCK_TASKS] as Task[]
let events                    = [...MOCK_EVENTS]
let checkIns: CheckIn[]       = [...MOCK_CHECKINS] as CheckIn[]
let links: Link[]             = [...MOCK_LINKS] as Link[]
let vaultEntries: VaultEntry[] = [...MOCK_VAULT_ENTRIES] as VaultEntry[]
let notifications             = [...MOCK_NOTIFICATIONS]
let vaultUnlocked = false
let activeFocusSession: null | Record<string, unknown> = null

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────
const authHandlers = [
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    await delay(D)
    const body = await request.json() as { email: string; password: string }
    const user = MOCK_USERS.find((u) => u.email === body.email)
    if (!user) {
      return HttpResponse.json({ code: 'INVALID_CREDENTIALS', message: 'E-mail ou senha incorretos' }, { status: 401 })
    }
    const requiredPassword = MOCK_CREDENTIALS[body.email]
    if (requiredPassword && body.password !== requiredPassword) {
      return HttpResponse.json({ code: 'INVALID_CREDENTIALS', message: 'E-mail ou senha incorretos' }, { status: 401 })
    }
    // Backend retorna só tokens (não o usuário)
    return HttpResponse.json(MOCK_TOKENS)
  }),

  http.post(`${BASE}/auth/register`, async () => {
    await delay(D)
    return HttpResponse.json({ message: 'Conta criada. Verifique seu e-mail.' }, { status: 201 })
  }),

  http.post(`${BASE}/auth/refresh`, async () => {
    await delay(100)
    return HttpResponse.json(MOCK_TOKENS)
  }),

  http.post(`${BASE}/auth/logout`, async () => {
    await delay(100)
    return new HttpResponse(null, { status: 204 })
  }),

  http.post(`${BASE}/auth/verify-email`, async () => {
    await delay(D)
    return HttpResponse.json({ message: 'E-mail verificado.' })
  }),

  // Password reset — alinhado com backend
  http.post(`${BASE}/auth/password-reset/request`, async () => {
    await delay(D)
    return HttpResponse.json({ message: 'Se o e-mail existir, enviaremos instruções de redefinição.' }, { status: 202 })
  }),

  http.post(`${BASE}/auth/password-reset/confirm`, async () => {
    await delay(D)
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(`${BASE}/users/me`, async () => {
    await delay(100)
    return HttpResponse.json(MOCK_USERS[0])
  }),

  // TOTP
  http.post(`${BASE}/users/me/totp/setup`, async () => {
    await delay(D)
    return HttpResponse.json({ otpauthUri: 'otpauth://totp/Neuro-Gen:mock@demo.com?secret=MOCKSECRET&issuer=Neuro-Gen', secret: 'MOCKSECRET' })
  }),
  http.post(`${BASE}/users/me/totp/confirm`, async () => {
    await delay(D)
    return new HttpResponse(null, { status: 204 })
  }),
  http.delete(`${BASE}/users/me/totp`, async () => {
    await delay(D)
    return new HttpResponse(null, { status: 204 })
  }),
]

// ─────────────────────────────────────────────
// TASKS
// ─────────────────────────────────────────────
const taskHandlers = [
  http.get(`${BASE}/tasks`, async ({ request }) => {
    await delay(D)
    const url = new URL(request.url)
    const status = url.searchParams.get('status')?.toUpperCase()
    const filtered = status ? tasks.filter((t) => t.status === status) : tasks
    return HttpResponse.json(filtered)
  }),

  http.get(`${BASE}/tasks/:id`, async ({ params }) => {
    await delay(D)
    const task = tasks.find((t) => t.id === params.id)
    if (!task) return HttpResponse.json({ code: 'NOT_FOUND', message: 'Tarefa não encontrada' }, { status: 404 })
    return HttpResponse.json(task)
  }),

  http.post(`${BASE}/tasks`, async ({ request }) => {
    await delay(D)
    const body = await request.json() as Record<string, unknown>
    const newTask = {
      id: `t${Date.now()}`,
      status: 'PENDING',
      priority: 'MEDIUM',
      tags: [],
      subtasks: [],
      reminders: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: null,
      dueTime: null,
      ...body,
    }
    tasks = [newTask as unknown as Task, ...tasks]
    return HttpResponse.json(newTask, { status: 201 })
  }),

  // PATCH /tasks/:id/status (backend real)
  http.patch(`${BASE}/tasks/:id/status`, async ({ params, request }) => {
    await delay(D)
    const body = await request.json() as { status: string }
    const task = tasks.find((t) => t.id === params.id)
    if (!task) return HttpResponse.json({ code: 'NOT_FOUND', message: 'Tarefa não encontrada' }, { status: 404 })
    if (task.status === 'DONE' || task.status === 'ARCHIVED') {
      return HttpResponse.json({ code: 'INVALID_TASK_TRANSITION', message: 'Transição de status inválida' }, { status: 409 })
    }
    tasks = tasks.map((t) =>
      t.id === params.id ? { ...t, status: body.status, updatedAt: new Date().toISOString() } : t,
    )
    return HttpResponse.json(tasks.find((t) => t.id === params.id))
  }),

  // POST /tasks/:id/subtasks
  http.post(`${BASE}/tasks/:id/subtasks`, async ({ params, request }) => {
    await delay(D)
    const body = await request.json() as { title: string; position: number }
    const newSub = { id: `st${Date.now()}`, title: body.title, done: false }
    tasks = tasks.map((t) =>
      t.id === params.id ? { ...t, subtasks: [...(t.subtasks || []), newSub] } : t,
    )
    return HttpResponse.json(tasks.find((t) => t.id === params.id), { status: 201 })
  }),

  // PATCH /tasks/:taskId/subtasks/:subtaskId/done
  http.patch(`${BASE}/tasks/:taskId/subtasks/:subtaskId/done`, async ({ params }) => {
    await delay(D)
    tasks = tasks.map((t) =>
      t.id === params.taskId
        ? { ...t, subtasks: (t.subtasks || []).map((s) => s.id === params.subtaskId ? { ...s, done: true } : s) }
        : t,
    )
    return new HttpResponse(null, { status: 204 })
  }),

  http.delete(`${BASE}/tasks/:id`, async ({ params }) => {
    await delay(D)
    tasks = tasks.filter((t) => t.id !== params.id)
    return new HttpResponse(null, { status: 204 })
  }),
]

// ─────────────────────────────────────────────
// EVENTS
// ─────────────────────────────────────────────
const eventHandlers = [
  http.get(`${BASE}/events`, async () => {
    await delay(D)
    return HttpResponse.json(events)
  }),

  http.post(`${BASE}/events`, async ({ request }) => {
    await delay(D)
    const body = await request.json() as Record<string, unknown>
    const ev = { id: `e${Date.now()}`, reminders: [], createdAt: new Date().toISOString(), ...body }
    events = [ev as typeof events[0], ...events]
    return HttpResponse.json(ev, { status: 201 })
  }),

  // PUT /events/:id/reschedule (backend real)
  http.put(`${BASE}/events/:id/reschedule`, async ({ params, request }) => {
    await delay(D)
    const body = await request.json() as Record<string, unknown>
    events = events.map((e) => e.id === params.id ? { ...e, ...body } : e)
    return HttpResponse.json(events.find((e) => e.id === params.id))
  }),

  // POST /events/:id/cancel
  http.post(`${BASE}/events/:id/cancel`, async ({ params }) => {
    await delay(D)
    events = events.map((e) => e.id === params.id ? { ...e, status: 'CANCELLED' } : e)
    return new HttpResponse(null, { status: 204 })
  }),

  http.delete(`${BASE}/events/:id`, async ({ params }) => {
    await delay(D)
    events = events.filter((e) => e.id !== params.id)
    return new HttpResponse(null, { status: 204 })
  }),
]

// ─────────────────────────────────────────────
// FOCUS — /focus/sessions (alinhado com backend)
// ─────────────────────────────────────────────
const focusHandlers = [
  http.get(`${BASE}/focus/sessions`, async () => {
    await delay(D)
    return HttpResponse.json(MOCK_FOCUS_SESSIONS)
  }),

  http.get(`${BASE}/focus/sessions/current`, async () => {
    await delay(100)
    if (!activeFocusSession) return new HttpResponse(null, { status: 204 })
    return HttpResponse.json(activeFocusSession)
  }),

  http.post(`${BASE}/focus/sessions`, async ({ request }) => {
    await delay(D)
    const body = await request.json() as Record<string, unknown>
    if (activeFocusSession) {
      return HttpResponse.json({ code: 'SESSION_ALREADY_ACTIVE', message: 'Já existe uma sessão ativa' }, { status: 409 })
    }
    activeFocusSession = {
      id: `f${Date.now()}`,
      userId: 'u1',
      status: 'RUNNING',
      effectiveSeconds: 0,
      startedAt: new Date().toISOString(),
      plannedMinutes: 25,
      breakMinutes: 5,
      ...body,
    }
    return HttpResponse.json(activeFocusSession, { status: 201 })
  }),

  http.post(`${BASE}/focus/sessions/:id/pause`, async ({ params }) => {
    await delay(100)
    if (activeFocusSession && activeFocusSession['id'] === params.id) {
      activeFocusSession = { ...activeFocusSession, status: 'PAUSED', pausedAt: new Date().toISOString() }
      return HttpResponse.json(activeFocusSession)
    }
    return HttpResponse.json({ code: 'NOT_FOUND' }, { status: 404 })
  }),

  http.post(`${BASE}/focus/sessions/:id/resume`, async ({ params }) => {
    await delay(100)
    if (activeFocusSession && activeFocusSession['id'] === params.id) {
      activeFocusSession = { ...activeFocusSession, status: 'RUNNING', pausedAt: null }
      return HttpResponse.json(activeFocusSession)
    }
    return HttpResponse.json({ code: 'NOT_FOUND' }, { status: 404 })
  }),

  http.post(`${BASE}/focus/sessions/:id/complete`, async ({ params }) => {
    await delay(100)
    if (activeFocusSession && activeFocusSession['id'] === params.id) {
      const completed = { ...activeFocusSession, status: 'COMPLETED', endedAt: new Date().toISOString() }
      activeFocusSession = null
      return HttpResponse.json(completed)
    }
    return HttpResponse.json({ code: 'NOT_FOUND' }, { status: 404 })
  }),

  http.post(`${BASE}/focus/sessions/:id/cancel`, async ({ params }) => {
    await delay(100)
    if (activeFocusSession && activeFocusSession['id'] === params.id) {
      const cancelled = { ...activeFocusSession, status: 'CANCELLED', endedAt: new Date().toISOString() }
      activeFocusSession = null
      return HttpResponse.json(cancelled)
    }
    return HttpResponse.json({ code: 'NOT_FOUND' }, { status: 404 })
  }),
]

// ─────────────────────────────────────────────
// EMOTIONAL — /emotional/checkins (alinhado com backend)
// ─────────────────────────────────────────────
const emotionalHandlers = [
  http.post(`${BASE}/emotional/checkins`, async ({ request }) => {
    await delay(D)
    const body = await request.json() as Record<string, unknown>
    const ci = {
      id: `c${Date.now()}`,
      moodLevel: body['moodLevel'] as number,
      energyLevel: body['energyLevel'] as number,
      note: (body['note'] as string) ?? null,
      checkedAt: new Date().toISOString(),
    }
    checkIns = [ci as typeof checkIns[0], ...checkIns]
    return HttpResponse.json(ci, { status: 201 })
  }),

  http.post(`${BASE}/emotional/journal`, async () => {
    await delay(D)
    return HttpResponse.json({ message: `Entrada registrada: j${Date.now()}` }, { status: 201 })
  }),

  http.get(`${BASE}/emotional/trend`, async () => {
    await delay(D)
    // Simula resposta de tendência
    return HttpResponse.json({
      ownerId: 'u1',
      periodDays: 30,
      totalCheckIns: checkIns.length,
      avgMoodScore: checkIns.reduce((s, c) => s + (c.moodLevel ?? 5), 0) / (checkIns.length || 1),
      avgEnergyLevel: checkIns.reduce((s, c) => s + (c.energyLevel ?? 3), 0) / (checkIns.length || 1),
      moodTrend: 'STABLE',
      energyTrend: 'IMPROVING',
      disclaimer: 'Este dado é informativo e NÃO constitui diagnóstico clínico.',
    })
  }),
]

// ─────────────────────────────────────────────
// VAULT — alinhado com backend
// ─────────────────────────────────────────────
const vaultHandlers = [
  http.post(`${BASE}/vault/setup`, async () => {
    await delay(D)
    vaultUnlocked = true
    return HttpResponse.json({
      recoveryKey: 'MOCK-MOCK-MOCK-MOCK-MOCK',
      configuredAt: new Date().toISOString(),
    }, { status: 201 })
  }),

  http.post(`${BASE}/vault/open`, async () => {
    await delay(500)
    vaultUnlocked = true
    return HttpResponse.json({
      vaultSessionToken: 'mock-vault-session-token',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    })
  }),

  http.post(`${BASE}/vault/lock`, async () => {
    await delay(100)
    vaultUnlocked = false
    return new HttpResponse(null, { status: 204 })
  }),

  http.post(`${BASE}/vault/recover`, async () => {
    await delay(D)
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(`${BASE}/vault/entries`, async () => {
    await delay(D)
    if (!vaultUnlocked) return HttpResponse.json({ code: 'VAULT_LOCKED', message: 'Cofre bloqueado' }, { status: 403 })
    return HttpResponse.json(vaultEntries)
  }),

  http.post(`${BASE}/vault/entries`, async ({ request }) => {
    await delay(D)
    if (!vaultUnlocked) return HttpResponse.json({ code: 'VAULT_LOCKED', message: 'Cofre bloqueado' }, { status: 403 })
    const body = await request.json() as Record<string, unknown>
    const entry = {
      id: `v${Date.now()}`,
      type: (body['type'] as string) ?? 'login',
      title: (body['title'] as string) ?? '',
      encryptedPayload: body['encryptedPayload'] as string,
    }
    vaultEntries = [entry as typeof vaultEntries[0], ...vaultEntries]
    return HttpResponse.json(entry, { status: 201 })
  }),

  http.put(`${BASE}/vault/entries/:id`, async ({ params, request }) => {
    await delay(D)
    if (!vaultUnlocked) return HttpResponse.json({ code: 'VAULT_LOCKED', message: 'Cofre bloqueado' }, { status: 403 })
    const body = await request.json() as Record<string, unknown>
    vaultEntries = vaultEntries.map((v) => v.id === params.id ? { ...v, ...body } : v)
    return HttpResponse.json(vaultEntries.find((v) => v.id === params.id))
  }),

  http.delete(`${BASE}/vault/entries/:id`, async ({ params }) => {
    await delay(D)
    vaultEntries = vaultEntries.filter((v) => v.id !== params.id)
    return new HttpResponse(null, { status: 204 })
  }),
]

// ─────────────────────────────────────────────
// LINKS — alinhado com backend
// ─────────────────────────────────────────────
const linkHandlers = [
  http.get(`${BASE}/links`, async () => {
    await delay(D)
    return HttpResponse.json(links)
  }),

  // POST /links — Titular cria convite (sem body)
  http.post(`${BASE}/links`, async () => {
    await delay(D)
    return HttpResponse.json({
      inviteToken: `inv-${Date.now()}`,
      expiresAt: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
    }, { status: 201 })
  }),

  // POST /links/accept — Apoio aceita convite
  http.post(`${BASE}/links/accept`, async ({ request }) => {
    await delay(D)
    const body = await request.json() as { inviteToken: string }
    const newLink = {
      id: `l${Date.now()}`,
      apoioId: 'u_new',
      apoioName: 'Novo Apoio',
      apoioEmail: 'novo@apoio.com',
      status: 'ACTIVE' as const,
      permissions: [] as string[],
      createdAt: new Date().toISOString(),
      lastAccessAt: null,
    }
    console.info('[MSW] Vínculo aceito com token:', body.inviteToken)
    links = [...links, newLink as typeof links[0]]
    return HttpResponse.json(newLink)
  }),

  // PATCH /links/:id/permissions — atualização granular (grant/revoke)
  http.patch(`${BASE}/links/:id/permissions`, async ({ params, request }) => {
    await delay(D)
    const body = await request.json() as { grant: string[]; revoke: string[] }
    links = links.map((l) => {
      if (l.id !== params.id) return l
      const current = new Set(l.permissions)
      body.grant?.forEach((p) => current.add(p))
      body.revoke?.forEach((p) => current.delete(p))
      return { ...l, permissions: Array.from(current) }
    })
    return HttpResponse.json(links.find((l) => l.id === params.id))
  }),

  http.delete(`${BASE}/links/:id`, async ({ params }) => {
    await delay(D)
    links = links.map((l) => l.id === params.id ? { ...l, status: 'REVOKED' as const } : l)
    return new HttpResponse(null, { status: 204 })
  }),
]

// ─────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────
const notificationHandlers = [
  http.get(`${BASE}/notifications`, async () => {
    await delay(D)
    return HttpResponse.json({ content: notifications, unreadCount: notifications.filter((n) => !n.read).length })
  }),

  http.post(`${BASE}/notifications/:id/read`, async ({ params }) => {
    await delay(100)
    notifications = notifications.map((n) => n.id === params.id ? { ...n, read: true } : n)
    return new HttpResponse(null, { status: 204 })
  }),

  http.post(`${BASE}/notifications/read-all`, async () => {
    await delay(100)
    notifications = notifications.map((n) => ({ ...n, read: true }))
    return new HttpResponse(null, { status: 204 })
  }),
]

// ─────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────
export const handlers = [
  ...authHandlers,
  ...taskHandlers,
  ...eventHandlers,
  ...focusHandlers,
  ...emotionalHandlers,
  ...vaultHandlers,
  ...linkHandlers,
  ...notificationHandlers,
]
