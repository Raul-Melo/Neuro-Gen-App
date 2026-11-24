# Neuro-Gen — Guia de Execução

> Passo a passo detalhado para iniciar cada modo de execução do projeto.  
> Para configurar variáveis de ambiente, veja [guia-ambiente.md](./guia-ambiente.md).

---

## Sumário

1. [Modo 1 — Frontend com Mock (sem backend)](#1-modo-1--frontend-com-mock)
2. [Modo 2 — Desenvolvimento local completo](#2-modo-2--desenvolvimento-local-completo)
3. [Modo 3 — Stack completa no Docker](#3-modo-3--stack-completa-no-docker)
4. [Verificar se está tudo no ar](#4-verificar-se-está-tudo-no-ar)
5. [Parar os serviços](#5-parar-os-serviços)
6. [Problemas comuns](#6-problemas-comuns)

---

## 1. Modo 1 — Frontend com Mock

**Quando usar:** desenvolvimento de UI, revisão de telas, demonstrações sem infraestrutura.

O MSW (Mock Service Worker) intercepta todas as chamadas HTTP e retorna dados simulados. Nenhum processo Java ou banco de dados é necessário.

### Passo a passo

**1. Instalar dependências (apenas na primeira vez ou após `npm install`)**

```powershell
cd web
npm install
```

**2. Configurar variáveis**

```powershell
cp .env.example .env.local
```

Verifique que `web/.env.local` tem:
```dotenv
VITE_MOCK=true
VITE_API_URL=http://localhost:8080
VITE_APP_ENV=development
```

**3. Iniciar o servidor de desenvolvimento**

```powershell
npm run dev
```

O Vite imprime a URL no terminal:
```
  VITE v5.x.x  ready in 400ms
  ➜  Local:   http://localhost:3000/
```

**4. Acessar o app**

Abra **http://localhost:3000** e faça login com um dos usuários de teste:

| E-mail | Senha | Papel | Acesso ao Cofre |
|---|---|---|---|
| `titular@demo.com` | (qualquer) | TITULAR | ✅ |
| `apoio@demo.com` | (qualquer) | APOIO | ❌ (bloqueado) |
| `raul.fsm692@gmail.com` | `Raul_Melo@2026` | TITULAR | ✅ |

> **Dica:** se o login não funcionar após uma atualização de código, o Service Worker pode estar com cache stale. Abra DevTools → Application → Service Workers → **Unregister all** → recarregue a página.

---

## 2. Modo 2 — Desenvolvimento Local Completo

**Quando usar:** integração real com o backend, desenvolvimento de features que envolvem persistência, testes de autenticação.

Você vai precisar de **três terminais** abertos simultaneamente.

### Passo a passo

**Terminal 1 — Banco de dados**

```powershell
# Na raiz do projeto
docker compose up -d

# Aguarde o banco ficar saudável
docker compose ps
```

A saída esperada do `ps`:
```
NAME                  STATUS
neurogen-postgres     Up X seconds (healthy)
neurogen-pgadmin      Up X seconds
```

> Se o status for `starting`, aguarde ~15s e repita o `ps`.

**Terminal 2 — Backend (Spring Boot)**

```powershell
# Na raiz do projeto
./mvnw spring-boot:run
```

Aguarde a linha de inicialização:
```
Started NeuroGenApplication in X.XXX seconds
```

Verifique em: http://localhost:8080/actuator/health → `{"status":"UP"}`

> Na primeira execução, o Maven baixa dependências (~300 MB). Execuções seguintes são muito mais rápidas.

**Terminal 3 — Frontend (Vite)**

```powershell
cd web

# Garanta que o mock está desativado
# web/.env.local deve ter VITE_MOCK=false
npm run dev
```

Acesse **http://localhost:3000**.

### Fluxo de primeiro acesso com backend real

O backend exige verificação de e-mail antes de liberar login. Em desenvolvimento, o token de verificação é **impresso nos logs** do backend (não é enviado por e-mail):

```
[DEV] Verificação de e-mail para titular@exemplo.com | token=abc123...
```

1. Registre uma conta em http://localhost:3000/register
2. Copie o token dos logs do backend (Terminal 2)
3. Use o token na chamada de verificação (ou via Swagger: `POST /api/v1/auth/verify-email`)
4. Faça login normalmente

Alternativamente, use o **Swagger UI** para o fluxo completo: http://localhost:8080/swagger-ui.html

---

## 3. Modo 3 — Stack Completa no Docker

**Quando usar:** validar o build de produção localmente, integração de QA, demonstrações completas.

Todos os serviços rodam em containers. O backend é compilado a partir do código local.

### Pré-requisito: gerar a chave AES-256

```powershell
# Windows PowerShell — copie o resultado
-join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Max 256) })
```

```bash
# Linux / macOS
openssl rand -hex 32
```

### Passo a passo

**1. Criar o arquivo `.env` na raiz do projeto**

```powershell
cp .env.example .env
notepad .env
```

Cole o valor gerado em `SENSITIVE_DATA_KEY`:
```dotenv
SENSITIVE_DATA_KEY=a1b2c3d4...  # 64 chars hex obrigatório
PGADMIN_PASSWORD=admin
DB_POOL_SIZE=10
```

**2. Construir e subir todos os containers**

```powershell
docker compose -f docker-compose.full.yml --env-file .env up --build -d
```

> Na primeira execução: o Maven baixa dependências e compila o JAR, e o Node compila o React. Pode levar **5–10 minutos**. Execuções seguintes reutilizam o cache de layers e levam ~1 min.

**3. Acompanhar a inicialização**

```powershell
# Logs do backend (aguarde "Started NeuroGenApplication")
docker compose -f docker-compose.full.yml logs -f app

# Logs do frontend (aguarde "nginx started")
docker compose -f docker-compose.full.yml logs -f frontend

# Status de todos os containers
docker compose -f docker-compose.full.yml ps
```

Aguarde todos os serviços ficarem `healthy`:

```
NAME                   STATUS
neurogen-postgres      Up X minutes (healthy)
neurogen-app           Up X minutes (healthy)
neurogen-frontend      Up X minutes (healthy)
neurogen-pgadmin       Up X minutes
```

**4. Acessar os serviços**

| Serviço | URL | Descrição |
|---|---|---|
| **Frontend** | http://localhost:3000 | App React servido pelo Nginx |
| **Swagger UI** | http://localhost:3000/swagger-ui.html | Via proxy Nginx → backend |
| **API direta** | http://localhost:3000/api/v1/... | Via proxy Nginx |
| **pgAdmin** | http://localhost:5050 | Gerenciador do banco |

> **Nota:** no modo Docker Completo, o Nginx faz proxy de `/api/` para o backend. Não há porta 8080 exposta no host — tudo passa pela porta 3000.

---

## 4. Verificar se está tudo no ar

### Verificação rápida (PowerShell)

```powershell
# Backend (modo dev ou via proxy no Docker)
Invoke-RestMethod http://localhost:8080/actuator/health    # modo dev
Invoke-RestMethod http://localhost:3000/actuator/health    # modo Docker

# Frontend
(Invoke-WebRequest http://localhost:3000).StatusCode       # deve retornar 200
```

### Checklist completo

```powershell
# 1. Backend saudável
curl http://localhost:8080/actuator/health
# Esperado: {"status":"UP","components":{"db":{"status":"UP"},...}}

# 2. Flyway aplicou as migrations
# Acesse http://localhost:5050 e execute:
# SELECT version, description, success FROM ng_core.flyway_schema_history ORDER BY installed_rank;

# 3. Frontend carrega
curl -I http://localhost:3000
# Esperado: HTTP/1.1 200 OK

# 4. Proxy funciona (apenas modo Docker)
curl http://localhost:3000/api/v1/actuator/health
# Esperado: mesmo retorno do item 1
```

### Smoke test via Swagger

1. Acesse http://localhost:8080/swagger-ui.html (dev) ou http://localhost:3000/swagger-ui.html (Docker)
2. **POST /api/v1/auth/register** → `{"email":"demo@test.com","password":"Teste123!","role":"TITULAR"}` → 201
3. Copie o token dos logs do backend: `[DEV] Verificação de e-mail ... token=<TOKEN>`
4. **POST /api/v1/auth/verify-email** → `{"token":"<TOKEN>"}` → 200
5. **POST /api/v1/auth/login** → `{"email":"demo@test.com","password":"Teste123!"}` → 200, copie `accessToken`
6. Clique em **Authorize** → cole `Bearer <accessToken>`
7. **GET /api/v1/users/me** → 200 com seu perfil
8. **POST /api/v1/tasks** → `{"title":"Minha primeira tarefa","priority":"HIGH"}` → 201
9. Copie o `id` da tarefa
10. **PATCH /api/v1/tasks/{id}/status** → `{"status":"DONE"}` → 200
11. Repita o passo 10 → **409 `INVALID_TASK_TRANSITION`** (prova da regra de negócio)

---

## 5. Parar os serviços

### Modo dev (Terminais)

```powershell
# Para o frontend/backend: Ctrl+C nos terminais

# Para o banco (mantém dados)
docker compose down

# Para o banco e apaga todos os dados
docker compose down -v
```

### Modo Docker Completo

```powershell
# Para todos os containers (mantém dados do PostgreSQL)
docker compose -f docker-compose.full.yml down

# Para e apaga volume (banco zerado)
docker compose -f docker-compose.full.yml down -v
```

---

## 6. Problemas Comuns

### Frontend não conecta ao backend

**Sintoma:** erro 502 Bad Gateway ou CORS no navegador.

**Causa provável:** o backend ainda não subiu ou está em porta diferente.

**Solução:**
```powershell
# Verifique se o backend está respondendo
curl http://localhost:8080/actuator/health

# Verifique se o proxy do Vite está configurado corretamente
# Em web/vite.config.ts deve ter:
# proxy: { '/api': { target: 'http://localhost:8080' } }
```

### Service Worker travando o app (modo mock)

**Sintoma:** tela em branco ou erros de rede mesmo com `VITE_MOCK=true`.

**Solução:**
1. DevTools → Application → Service Workers
2. Clique em **Unregister** em todos os workers listados
3. Hard refresh: `Ctrl+Shift+R`

### Backend não sobe — `SENSITIVE_DATA_KEY` ausente

**Sintoma:** `IllegalStateException: SENSITIVE_DATA_KEY not configured`.

**Solução:**
```powershell
# Gere a chave e defina antes de rodar
$env:SENSITIVE_DATA_KEY = (-join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Max 256) }))
./mvnw spring-boot:run
```

### Docker — container `app` travado em `starting`

**Sintoma:** `docker compose ps` mostra o container `app` em `health: starting` por mais de 2 min.

**Solução:**
```powershell
# Veja os logs de erro do backend
docker compose -f docker-compose.full.yml logs app --tail 50

# Causas comuns:
# 1. SENSITIVE_DATA_KEY inválida (< 64 chars ou não hexadecimal)
# 2. Banco não ficou healthy antes do app tentar conectar (raro)
# 3. Porta 8080 já ocupada por outro processo
```

### pgAdmin — não consegue conectar ao banco

**Sintoma:** erro "Connection refused" ao adicionar o servidor no pgAdmin.

**Solução:**
- No campo **Host**, use `postgres` (nome do serviço Docker), não `localhost`
- Certifique-se de que os containers estão na mesma rede (`neurogen-net`)

### Token JWT expirado após reinício do backend

**Sintoma:** 401 em todas as chamadas após reiniciar o backend.

**Causa:** o par de chaves RSA é gerado na inicialização. Tokens emitidos antes do reinício são inválidos.

**Solução:** faça login novamente. Em produção, persista as chaves RSA em variável de ambiente (ADR-007).
