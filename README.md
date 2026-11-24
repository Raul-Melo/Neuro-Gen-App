# Neuro-Gen

Agenda adaptativa para usuários neurodivergentes (TDAH, TEA, Superdotação), combinando planejamento, ferramentas de foco, regulação emocional e um modelo de acesso compartilhado entre **Titulares** e sua rede de apoio (**Apoio**).

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | Java 21 (virtual threads) + Spring Boot 3.3.x |
| Banco de dados | PostgreSQL 16 (dois datasources: Core + Vault) |
| Cache | Redis |
| Mensageria | RabbitMQ |
| Frontend web | React 18 + TypeScript + Vite 5 + TailwindCSS |
| Mobile | Kotlin Multiplatform + Jetpack Compose (Android) + SwiftUI (iOS) |
| Migrações | Flyway |
| Auth | Spring Authorization Server — JWT RS256 |

---

## Módulos (Backend)

| Módulo | Responsabilidade |
|--------|-----------------|
| `identity` | Registro, login, 2FA, sessões |
| `link` | Vínculo Titular ↔ Apoio |
| `agenda` | Tarefas, lembretes, nudges |
| `focus` | Sessões Pomodoro |
| `emotional` | Check-ins emocionais e diário |
| `vault` | Cofre zero-knowledge (isolado fisicamente) |
| `shared` | Kernel compartilhado — eventos e portas |

---

## Rodando localmente

### Pré-requisitos

- Java 21+
- Docker + Docker Compose
- Node.js 20+

### Backend

```bash
# Sobe PostgreSQL automaticamente via Docker Compose
./mvnw spring-boot:run
```

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- Health: `http://localhost:8080/actuator/health`
- Tokens de verificação de e-mail aparecem nos logs (`[DEV]`)

### Frontend

```bash
cd web
npm install
cp .env.example .env.local   # configure VITE_API_URL=http://localhost:8080
npm run dev                  # http://localhost:3000
```

### Stack completa (Docker)

```bash
docker compose -f docker-compose.full.yml up -d
```

---

## Testes

```bash
./mvnw test        # unitários + API slice — sem Docker
./mvnw verify      # pirâmide completa com Testcontainers (requer Docker)
```

---

## Variáveis de ambiente

Copie `.env.example` e preencha os valores. As variáveis obrigatórias em produção são:

| Variável | Descrição |
|----------|-----------|
| `DB_HOST / DB_NAME / DB_USERNAME / DB_PASSWORD` | Core PostgreSQL |
| `VAULT_DB_URL / VAULT_DB_USERNAME / VAULT_DB_PASSWORD` | Vault PostgreSQL (instância separada) |
| `SENSITIVE_DATA_KEY` | Chave AES-256-GCM para dados sensíveis |
| `JWT_PRIVATE_KEY / JWT_PUBLIC_KEY` | Par RSA para tokens JWT |

---

## Deploy (Render)

```bash
docker build -t neuro-gen .
docker run --rm -p 8080:8080 \
  -e DB_HOST=host.docker.internal \
  -e DB_NAME=neurogen \
  -e DB_USERNAME=neurogen \
  -e DB_PASSWORD=secret \
  -e SENSITIVE_DATA_KEY="$(openssl rand -base64 32)" \
  neuro-gen
```

Infra-as-code: `render.yaml`. Profile de produção: `application-prod.yml`.

---

## Documentação

| Documento | Descrição |
|-----------|-----------|
| `docs/defContexto/01-visao-produto.md` | Visão de produto e personas |
| `docs/defContexto/02-requisitos-funcionais.md` | Requisitos funcionais |
| `docs/defContexto/03-requisitos-nao-funcionais.md` | NFRs: segurança, privacidade, performance |
| `docs/defContexto/04-arquitetura-visao-geral.md` | Diagramas C4 e camadas |
| `docs/defContexto/05-adrs.md` | ADRs 001–008 |
| `docs/backend/README.md` | Guia de implementação backend |
| `docs/deploy/README.md` | Guia de deploy e demo ao vivo |

---

## Convenções

- **Commits:** Conventional Commits em português
- **TDD:** `[TDD-RED]` → `[TDD-GREEN]` → `[TDD-REFACTOR]`
- **Branch flow:** `feature/*` → PR para `develop` → PR para `main`
- **Merge para `main`** apenas com CI verde (auto-deploy para Render)

---

## Segurança

- Role `APOIO` bloqueada estruturalmente de `/api/v1/vault/*` — não é verificação em runtime, está hard-coded no security filter chain.
- Dados sensíveis (check-ins emocionais, perfil de neurodivergência, segredos TOTP) com criptografia AES-256-GCM em nível de coluna.
- Senhas: Argon2id. Zero-knowledge no Vault: a chave mestra nunca sai do browser.
- LGPD: Privacy by Design — schema `ng_sensitive` isolado (ADR-006).
