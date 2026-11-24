# Neuro-Gen — Guia de Testes

> Como executar, entender e escrever testes no projeto.  
> Cobertura: testes do backend (JUnit, MockMvc, Testcontainers) e do frontend (TypeScript, MSW).

---

## Sumário

1. [Testes do Backend](#1-testes-do-backend)
   - [Pirâmide de testes](#pirâmide-de-testes)
   - [Executar os testes](#executar-os-testes)
   - [Testes por camada](#testes-por-camada)
   - [Teste de integração obrigatório (Vault/APOIO)](#teste-de-integração-obrigatório-vaultapoio)
2. [Testes do Frontend](#2-testes-do-frontend)
   - [Type checking](#type-checking)
   - [Lint](#lint)
   - [Testar manualmente com MSW](#testar-manualmente-com-msw)
3. [Testes de API com curl](#3-testes-de-api-com-curl)
4. [Testes end-to-end (manual)](#4-testes-end-to-end-manual)
5. [CI — GitHub Actions](#5-ci--github-actions)
6. [Convenção TDD](#6-convenção-tdd)

---

## 1. Testes do Backend

### Pirâmide de testes

```
           ┌───────────────────────────────┐
           │   Integração (Testcontainers) │  ← PostgreSQL real, contexto completo
           │   NeuroGenIntegrationTest     │
           ├───────────────────────────────┤
           │   API (MockMvc standalone)    │  ← HTTP, validação, GlobalExceptionHandler
           │   *ControllerTest             │
           ├───────────────────────────────┤
           │   Aplicação (Mockito)         │  ← Use cases, caminhos de erro
           │   *UseCaseTest                │
           ├───────────────────────────────┤
           │   Domínio (JUnit 5 puro)      │  ← Aggregates, invariantes, VOs
           │   *Test                       │
           └───────────────────────────────┘
```

| Camada | Framework | Precisa de Docker? | Velocidade |
|---|---|---|---|
| Domínio | JUnit 5 + AssertJ | ❌ | ⚡ Rápido |
| Aplicação | JUnit 5 + Mockito | ❌ | ⚡ Rápido |
| API | MockMvc standalone | ❌ | ⚡ Rápido |
| Integração | Testcontainers | ✅ | 🐢 Lento (sobe PostgreSQL 16) |

---

### Executar os testes

#### Todos os testes (unitários + API, sem Docker)

```powershell
./mvnw test
```

Saída esperada:
```
[INFO] Tests run: X, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

#### Pirâmide completa incluindo testes de integração (requer Docker)

```powershell
./mvnw verify
```

> O goal `verify` inclui o `test` e ativa os testes de integração via Testcontainers.  
> Se o Docker não estiver rodando, os testes de integração são **pulados** (não falham).  
> O CI falha se eles forem pulados — veja [CI — GitHub Actions](#5-ci--github-actions).

#### Rodar uma classe específica

```powershell
./mvnw test -Dtest=TaskTest
./mvnw test -Dtest=AuthControllerTest
./mvnw test -Dtest=NeuroGenIntegrationTest
```

#### Rodar um método específico

```powershell
./mvnw test -Dtest=AuthControllerTest#register_success
./mvnw test -Dtest=TaskTest#complete_archived_task_throws
```

#### Rodar testes de um módulo específico

```powershell
# Apenas testes do módulo agenda
./mvnw test -Dtest="**/agenda/**/*Test"

# Apenas testes de domínio (sem Spring)
./mvnw test -Dtest="**/domain/**/*Test"
```

#### Build sem executar testes (apenas para verificar compilação)

```powershell
./mvnw clean package -DskipTests
```

---

### Testes por camada

#### Domínio — sem Spring, sem banco

Localização: `src/test/java/**/domain/`

Testam invariantes de agregado, value objects e máquinas de estado. Não carregam contexto Spring.

```powershell
./mvnw test -Dtest=TaskTest,EventTest,AesGcmCipherTest
```

**Exemplo de invariante testada:**
- `TaskTest#complete_done_task_throws` — tarefa já concluída lança `InvalidTaskTransitionException` (409)
- `TaskTest#complete_archived_task_throws` — tarefa arquivada não pode ser concluída
- `EventTest#cancel_cancelled_event_throws` — evento cancelado não pode ser alterado

#### Aplicação — com Mockito

Localização: `src/test/java/**/application/`

Testam use cases com dependências mockadas. Cobrem caminhos de sucesso e de erro.

```powershell
./mvnw test -Dtest=TaskUseCaseTest,FocusUseCaseTest
```

**Exemplos:**
- `TaskUseCaseTest#filter_invalid_status_returns_400` — filtro `?status=xyz` retorna 400
- `TaskUseCaseTest#filter_lowercase_status_accepted` — `?status=done` é aceito (case-insensitive)

#### API — MockMvc standalone

Localização: `src/test/java/**/api/`

Testam contrato HTTP: status codes, body JSON, headers, Bean Validation, `GlobalExceptionHandler`.

```powershell
./mvnw test -Dtest=AuthControllerTest,TaskControllerTest
```

**O que é coberto:**
- Requests inválidos retornam 400 com `ErrorResponse` estruturado
- JSON malformado → 400 (não 500)
- Parâmetro ausente → 400
- Acesso sem token → 401
- Regras de negócio violadas → 409

#### Integração — Testcontainers + PostgreSQL 16

Localização: `src/test/java/**/NeuroGenIntegrationTest.java`

Sobe um contexto Spring Boot completo com dois datasources PostgreSQL reais (via Testcontainers). Aplica todas as migrations Flyway e valida fluxos completos.

```powershell
# Requer Docker Desktop rodando
./mvnw verify -Dtest=NeuroGenIntegrationTest
```

**O que é validado:**
- Flyway aplica todas as migrations sem erro nos dois datasources
- Fluxo completo de autenticação (register → verify → login → me)
- Acesso cross-tenant bloqueado (Apoio não acessa dados de outro Titular)
- **Teste de segurança obrigatório:** `APOIO` recebe 403 em qualquer rota `/api/v1/vault/**` e a tentativa é registrada em `ng_vault_auth_logs`

---

### Teste de integração obrigatório (Vault/APOIO)

Este teste é o único com **status de CI obrigatório** — o pipeline falha se for pulado:

```java
// NeuroGenIntegrationTest.java
@Test
void apoio_cannot_access_vault_and_attempt_is_audited() {
    // Autentica como APOIO
    // Chama qualquer endpoint /api/v1/vault/**
    // Assertiva: 403 Forbidden
    // Assertiva: registro de auditoria em ng_vault_auth_logs
}
```

Verificar manualmente:
```powershell
# 1. Registre e autentique uma conta APOIO
# 2. Tente acessar o cofre
curl -X GET http://localhost:8080/api/v1/vault/entries `
  -H "Authorization: Bearer $TOKEN_APOIO"

# Esperado: 403 com body:
# {"code":"ACCESS_DENIED","message":"Acesso ao Cofre negado para perfil Apoio"}

# 3. Consulte o log de auditoria
# No pgAdmin / psql:
# SELECT * FROM ng_vault.ng_vault_auth_logs ORDER BY attempted_at DESC LIMIT 5;
```

---

## 2. Testes do Frontend

### Type checking

Verifica erros TypeScript sem compilar o bundle (mais rápido que o build):

```powershell
cd web
npm run type-check
```

Saída de sucesso: nenhuma saída (zero erros).

### Lint

Verifica regras ESLint com tolerância zero a warnings:

```powershell
cd web
npm run lint
```

### Build de produção

Compila o bundle de produção. Falha se houver erro TypeScript ou de módulo:

```powershell
cd web
npm run build
```

Saída esperada (últimas linhas):
```
dist/sw.js
dist/workbox-XXXXXXXX.js
✓ built in X.XXs
```

### Testar manualmente com MSW

O MSW intercepta chamadas HTTP e simula o backend completo. Para ativar:

```dotenv
# web/.env.local
VITE_MOCK=true
```

```powershell
npm run dev
```

**Pontos a verificar no browser:**

| Funcionalidade | Como testar | Resultado esperado |
|---|---|---|
| Login com credenciais corretas | `titular@demo.com` + qualquer senha | Redireciona para `/dashboard` |
| Login com senha errada (Raul) | `raul.fsm692@gmail.com` + senha errada | Toast de erro |
| Bloqueio do Cofre para APOIO | Login como `apoio@demo.com` | Menu "Cofre" não aparece |
| Criar tarefa | Agenda → Nova Tarefa | Aparece na lista |
| Check-in emocional | Emocional → Registrar | Registra sem erro |
| Sessão de foco | Foco → Iniciar | Timer começa |
| Vínculo — criar convite | Vínculos → Novo Convite | Token exibido |

---

## 3. Testes de API com curl

Para testar cada endpoint individualmente com o backend rodando localmente.

### Autenticação completa

```powershell
# 1. Registrar conta
curl -s -X POST http://localhost:8080/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -d '{"email":"teste@exemplo.com","password":"Senha123!","role":"TITULAR"}'

# 2. Copiar token dos logs do backend:
# [DEV] Verificação de e-mail ... token=<TOKEN>

# 3. Verificar e-mail
curl -s -X POST http://localhost:8080/api/v1/auth/verify-email `
  -H "Content-Type: application/json" `
  -d '{"token":"<TOKEN_COPIADO>"}'

# 4. Login
$response = curl -s -X POST http://localhost:8080/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"teste@exemplo.com","password":"Senha123!"}' | ConvertFrom-Json

$TOKEN = $response.accessToken

# 5. Perfil
curl -s http://localhost:8080/api/v1/users/me `
  -H "Authorization: Bearer $TOKEN"
```

### Agenda

```powershell
# Criar tarefa
curl -s -X POST http://localhost:8080/api/v1/tasks `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"title":"Estudar integração","priority":"HIGH"}' | ConvertFrom-Json

# Guardar o ID
$TASK_ID = "<id-retornado>"

# Atualizar status para IN_PROGRESS
curl -s -X PATCH "http://localhost:8080/api/v1/tasks/$TASK_ID/status" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"status":"IN_PROGRESS"}'

# Concluir
curl -s -X PATCH "http://localhost:8080/api/v1/tasks/$TASK_ID/status" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"status":"DONE"}'

# Tentar concluir novamente — deve retornar 409
curl -s -X PATCH "http://localhost:8080/api/v1/tasks/$TASK_ID/status" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"status":"DONE"}'
# Esperado: {"code":"INVALID_TASK_TRANSITION","message":"..."}
```

### Foco

```powershell
# Iniciar sessão
$session = curl -s -X POST http://localhost:8080/api/v1/focus/sessions `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"durationMinutes":25,"breakMinutes":5}' | ConvertFrom-Json

$SESSION_ID = $session.id

# Pausar
curl -s -X POST "http://localhost:8080/api/v1/focus/sessions/$SESSION_ID/pause" `
  -H "Authorization: Bearer $TOKEN"

# Retomar
curl -s -X POST "http://localhost:8080/api/v1/focus/sessions/$SESSION_ID/resume" `
  -H "Authorization: Bearer $TOKEN"

# Concluir
curl -s -X POST "http://localhost:8080/api/v1/focus/sessions/$SESSION_ID/complete" `
  -H "Authorization: Bearer $TOKEN"
```

### Check-in emocional

```powershell
curl -s -X POST http://localhost:8080/api/v1/emotional/checkins `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"moodScore":7,"energyLevel":6,"notes":"Dia produtivo."}'

# Tendência dos últimos 30 dias
curl -s "http://localhost:8080/api/v1/emotional/trend?periodDays=30" `
  -H "Authorization: Bearer $TOKEN"
```

### Segurança do Cofre (APOIO → 403)

```powershell
# Registre e autentique uma conta APOIO
$apoioResponse = curl -s -X POST http://localhost:8080/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"apoio@exemplo.com","password":"Senha123!"}' | ConvertFrom-Json

$TOKEN_APOIO = $apoioResponse.accessToken

# Qualquer rota do Vault deve retornar 403
curl -s http://localhost:8080/api/v1/vault/entries `
  -H "Authorization: Bearer $TOKEN_APOIO"

# Esperado:
# {"code":"ACCESS_DENIED","message":"Acesso ao Cofre negado para perfil Apoio"}
# Status: 403 Forbidden
```

---

## 4. Testes End-to-End (Manual)

Fluxo completo que valida toda a stack de ponta a ponta.

### Pré-condição

Stack Docker completa rodando (`docker-compose.full.yml`) ou modo dev completo (Modo 2).

### Roteiro

| Passo | Ação | Esperado |
|---|---|---|
| 1 | Acesse http://localhost:3000/register | Formulário de cadastro carrega |
| 2 | Registre: `e2e@teste.com` / `Senha123!` / TITULAR | "Conta criada! Verifique seu e-mail" |
| 3 | Copie o token dos logs do backend | Token presente nos logs |
| 4 | Via Swagger: `POST /auth/verify-email` com o token | 200 OK, `status: ACTIVE` |
| 5 | Faça login em http://localhost:3000/login | Redireciona para `/dashboard` |
| 6 | Acesse Agenda → crie uma tarefa com prioridade HIGH | Tarefa aparece na lista |
| 7 | Mude o status para "Em Progresso" | Status atualiza |
| 8 | Acesse Foco → inicie uma sessão de 25 min | Timer roda |
| 9 | Pause e retome a sessão | Status alterna PAUSED/RUNNING |
| 10 | Conclua a sessão | Aparece no histórico |
| 11 | Acesse Emocional → registre um check-in (humor 7, energia 6) | Check-in registrado |
| 12 | Acesse Cofre → configure a senha mestra | Recovery key exibida |
| 13 | Abra o Cofre → adicione uma entrada | Entrada aparece na lista |
| 14 | Acesse Vínculos → crie um convite | Token de convite exibido |
| 15 | Faça logout | Redireciona para `/login`, token invalidado |

---

## 5. CI — GitHub Actions

O pipeline está em `.github/workflows/ci.yml` e é executado a cada push.

### Etapas do pipeline

```
1. Checkout do código
2. Setup do JDK 21
3. Cache das dependências Maven
4. ./mvnw verify   ← roda toda a pirâmide incluindo Testcontainers
5. Upload dos relatórios de teste
```

### Regras do CI

| Regra | Comportamento |
|---|---|
| `./mvnw verify` falha | Build bloqueado — deploy não ocorre |
| Teste de integração pulado (sem Docker) | Build **falha** (configuração explícita no pom.xml) |
| Teste Vault/APOIO falha | Build bloqueado — invariante de segurança |

### Ver resultados no GitHub

1. Acesse a aba **Actions** do repositório
2. Clique no run mais recente
3. Expanda os steps para ver os logs detalhados
4. Relatórios de teste ficam em **Artifacts**

### Rodar o mesmo ambiente do CI localmente

```powershell
# Simula exatamente o que o CI roda
./mvnw clean verify --no-transfer-progress
```

---

## 6. Convenção TDD

O projeto usa TDD com mensagens de commit padronizadas (ADR-008). Ao implementar uma nova feature:

### Ciclo RED → GREEN → REFACTOR

**Passo 1 — RED: escreva o teste que falha**

```powershell
./mvnw test -Dtest=MinhaNovaFeatureTest
# Esperado: FAILURE (o código não existe ainda)
```

Commit:
```
test(modulo): especifica comportamento esperado de MinhaFeature [TDD-RED]
```

**Passo 2 — GREEN: implemente o mínimo para passar**

```powershell
./mvnw test -Dtest=MinhaNovaFeatureTest
# Esperado: SUCCESS
```

Commit:
```
feat(modulo): implementa MinhaFeature [TDD-GREEN]
```

**Passo 3 — REFACTOR: limpe sem mudar comportamento**

```powershell
./mvnw test   # garante que nada quebrou
```

Commit:
```
refactor(modulo): extrai lógica compartilhada de MinhaFeature [TDD-REFACTOR]
```

### Tipos de commit reconhecidos pelo CI

| Tipo | Fase | Exemplo |
|---|---|---|
| `test(modulo)` + `[TDD-RED]` | Teste que especifica comportamento novo | `test(agenda): especifica que tarefa arquivada não pode ser concluída [TDD-RED]` |
| `feat(modulo)` + `[TDD-GREEN]` | Implementação mínima | `feat(agenda): rejeita conclusão de tarefa arquivada [TDD-GREEN]` |
| `fix(modulo)` + `[TDD-GREEN]` | Correção de bug | `fix(agenda): corrige filtro inválido retornando 500 [TDD-GREEN]` |
| `refactor(modulo)` + `[TDD-REFACTOR]` | Limpeza sem mudar comportamento | `refactor(agenda): extrai AgendaTitle como value object [TDD-REFACTOR]` |
