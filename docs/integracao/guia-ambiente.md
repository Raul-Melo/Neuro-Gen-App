# Neuro-Gen — Guia de Configuração do Ambiente

---

## Sumário

1. [Pré-requisitos](#1-pré-requisitos)
2. [Variáveis de ambiente — Frontend](#2-variáveis-de-ambiente--frontend)
3. [Variáveis de ambiente — Backend](#3-variáveis-de-ambiente--backend)
4. [Variáveis de ambiente — Docker Compose](#4-variáveis-de-ambiente--docker-compose)
5. [Banco de dados local](#5-banco-de-dados-local)
6. [Verificação do ambiente](#6-verificação-do-ambiente)

---

## 1. Pré-requisitos

### Ferramentas obrigatórias

| Ferramenta | Versão mínima | Verificação | Download |
|---|---|---|---|
| Node.js | 20.x LTS | `node -v` | https://nodejs.org |
| npm | 10.x | `npm -v` | (vem com Node) |
| Java JDK | 21 | `java -version` | https://adoptium.net |
| Docker Desktop | 4.x | `docker version` | https://docker.com |

> **Windows:** o Docker Desktop deve estar **rodando** (ícone na bandeja do sistema) antes de qualquer `docker compose`.

### Verificação rápida

```powershell
node -v        # deve mostrar v20.x.x ou superior
java -version  # deve mostrar openjdk 21 ou similar
docker version # deve mostrar Server Engine rodando
```

---

## 2. Variáveis de ambiente — Frontend

O frontend usa variáveis com prefixo `VITE_`. Crie `web/.env.local` a partir do exemplo:

```powershell
cd web
cp .env.example .env.local
```

### Referência completa

| Variável | Padrão | Descrição |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8080` | URL base do backend. Usada pelo proxy do Vite em dev; ignorada em produção (Nginx faz proxy). |
| `VITE_APP_ENV` | `development` | Ambiente. Aceita `development` ou `production`. |
| `VITE_MOCK` | `false` | `true` ativa o MSW (Mock Service Worker) — intercepta todas as chamadas HTTP sem backend real. |

### Configuração por modo

**Desenvolvimento com backend real (`VITE_MOCK=false`):**
```dotenv
VITE_API_URL=http://localhost:8080
VITE_APP_ENV=development
VITE_MOCK=false
```

**Desenvolvimento sem backend (`VITE_MOCK=true`):**
```dotenv
VITE_API_URL=http://localhost:8080
VITE_APP_ENV=development
VITE_MOCK=true
```

> **Atenção:** `VITE_` é o prefixo necessário para que o Vite exponha a variável no bundle. Variáveis sem esse prefixo não ficam visíveis no código React.

---

## 3. Variáveis de ambiente — Backend

O backend é configurado via `application.yml` em dev e por variáveis de ambiente em produção.

### Arquivo de referência: `src/main/resources/application.yml`

Em desenvolvimento (perfil padrão), os valores já estão preenchidos e funcionam com o banco Docker local.

### Para sobrescrever em dev (opcional)

Crie um `application-local.yml` em `src/main/resources/` ou exporte as variáveis no terminal antes de `./mvnw spring-boot:run`:

```powershell
$env:DB_HOST="localhost"
$env:DB_PASSWORD="secret"
./mvnw spring-boot:run
```

### Referência de variáveis

| Variável | Padrão (dev) | Obrigatória em prod | Descrição |
|---|---|---|---|
| `SPRING_PROFILES_ACTIVE` | `default` | sim (`prod`) | Perfil Spring Boot |
| `DB_HOST` | `localhost` | sim | Host do PostgreSQL |
| `DB_PORT` | `5432` | não | Porta do PostgreSQL |
| `DB_NAME` | `neurogen` | sim | Nome do banco Core |
| `DB_USERNAME` | `neurogen` | sim | Usuário do banco Core |
| `DB_PASSWORD` | `secret` | sim | Senha do banco Core |
| `DB_POOL_SIZE` | `10` | não | Pool de conexões Hikari |
| `VAULT_DB_URL` | _(mesmo banco)_ | não | JDBC URL do banco do Vault (isolamento físico em prod) |
| `VAULT_DB_USERNAME` | _(mesmo usuário)_ | não | Usuário do banco Vault |
| `VAULT_DB_PASSWORD` | _(mesma senha)_ | não | Senha do banco Vault |
| `VAULT_DB_POOL_SIZE` | `5` | não | Pool Vault |
| `SENSITIVE_DATA_KEY` | _(gerado em dev)_ | **sim** | Chave AES-256-GCM hex (64 chars). **Nunca troque após ter dados!** |
| `PORT` | `8080` | não | Porta HTTP (plataformas de nuvem injetam automaticamente) |

### Gerar `SENSITIVE_DATA_KEY`

```powershell
# Windows PowerShell
-join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Max 256) })

# Linux / macOS
openssl rand -hex 32
```

O resultado deve ter **exatamente 64 caracteres hexadecimais**. Exemplo:
```
a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2
```

> **Segurança:** a chave cifra colunas de dados sensíveis (humor, diário, TOTP). Se for trocada após existirem registros, os dados anteriores ficam ilegíveis. Em produção, armazene em um gestor de segredos (AWS Secrets Manager, Vault, Render Environment).

---

## 4. Variáveis de ambiente — Docker Compose

O `docker-compose.full.yml` lê as variáveis do arquivo `.env` na raiz do projeto.

```powershell
# 1. Copie o template
cp .env.example .env

# 2. Abra e preencha
notepad .env
```

### Conteúdo do `.env`

```dotenv
# Obrigatório: 64 chars hexadecimais
SENSITIVE_DATA_KEY=cole_aqui_o_valor_gerado

# Opcional
PGADMIN_PASSWORD=admin
DB_POOL_SIZE=10
```

---

## 5. Banco de dados local

### Iniciar o banco (modo dev)

```powershell
# Na raiz do projeto
docker compose up -d

# Verificar status (aguarde "healthy")
docker compose ps
```

### Conectar ao banco

**Via psql (linha de comando):**
```powershell
docker exec -it neurogen-postgres psql -U neurogen -d neurogen
```

**Via pgAdmin (interface web):**
1. Abra http://localhost:5050
2. Login: `admin@admin.com` / `admin`
3. Clique em **Add New Server**
4. **General → Name:** `Neuro-Gen Dev`
5. **Connection:**
   - Host: `postgres` (dentro do Docker) ou `localhost` (da máquina host)
   - Port: `5432`
   - Database: `neurogen`
   - Username: `neurogen`
   - Password: `secret`

### Schemas criados pelo Flyway

| Schema | Propósito |
|---|---|
| `ng_identity` | Usuários, sessões JWT, tokens de verificação, TOTP |
| `ng_core` | Vínculos, agenda (eventos/tarefas), foco, notificações |
| `ng_sensitive` | Dados de saúde cifrados (AES-256-GCM) — LGPD |
| `ng_audit` | Auditoria imutável (triggers de banco + logs de sistema) |
| `ng_vault` | Cofre zero-knowledge (datasource isolado) |

### Verificar migrations

```sql
SELECT version, description, installed_on, success
FROM ng_core.flyway_schema_history
ORDER BY installed_rank;
```

### Recriar o banco do zero

```powershell
docker compose down -v        # para tudo e apaga o volume
docker compose up -d          # recria (Flyway aplica as migrations)
```

---

## 6. Verificação do ambiente

Execute esta sequência para confirmar que tudo está funcionando:

```powershell
# 1. Backend respondendo
Invoke-WebRequest http://localhost:8080/actuator/health | Select-Object -ExpandProperty Content

# Esperado: {"status":"UP", ...}

# 2. Banco conectado (via backend)
Invoke-WebRequest http://localhost:8080/actuator/health/db | Select-Object -ExpandProperty Content

# Esperado: {"status":"UP","details":{"database":"PostgreSQL","validationQuery":"isValid()"}}

# 3. Frontend carregando
Invoke-WebRequest http://localhost:3000 | Select-Object -ExpandProperty StatusCode

# Esperado: 200

# 4. Proxy do frontend para o backend
Invoke-WebRequest http://localhost:3000/actuator/health | Select-Object -ExpandProperty Content

# Esperado: mesmo retorno do item 1 (via nginx proxy)
```

> No modo dev (Vite), o proxy está em `vite.config.ts` e direciona `/api` → `http://localhost:8080`.  
> No Docker Completo, o Nginx faz o proxy de `/api/` → `app:8080`.
