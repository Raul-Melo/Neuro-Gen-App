<p align="center">
  <img src="web/public/logo.webp" alt="Neuro-Gen Logo" width="180" />
</p>

<h1 align="center">Neuro-Gen</h1>

<p align="center">
  Agenda adaptativa para pessoas neurodivergentes — TDAH, TEA, Superdotação.<br/>
  Planejamento, foco, regulação emocional e acesso compartilhado com sua rede de apoio.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Java-21-orange?logo=openjdk&logoColor=white" />
  <img src="https://img.shields.io/badge/Spring%20Boot-3.3-6DB33F?logo=springboot&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-3-06B6D4?logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/PWA-ready-5A0FC8?logo=pwa&logoColor=white" />
</p>

---

## Sobre o Projeto

Aplicativos de agenda genéricos assumem função executiva típica — o usuário lembra de checar, prioriza sozinho e não sofre sobrecarga sensorial. Para pessoas neurodivergentes, isso falha em três frentes:

- **Função executiva** — dificuldade em iniciar tarefas, estimar tempo e manter atenção sem estímulo externo.
- **Regulação emocional** — sobrecarga, ansiedade e burnout não são capturados nem mitigados.
- **Suporte externo** — cuidadores e terapeutas não têm visibilidade sem invadir a autonomia do usuário.

**Neuro-Gen** resolve isso com uma agenda-planner adaptativa que combina organização inteligente, lembretes ativos, sessões de foco Pomodoro e check-ins emocionais — com um modelo único de acesso compartilhado controlado entre o **Titular** (usuário neurodivergente) e sua **rede de Apoio** (pais, terapeutas, parceiros).

### Personas

| Persona | Descrição |
|---------|-----------|
| **Titular** | Usuário neurodivergente (TDAH, TEA, 2E). Dona dos dados. Define o que é visível para cada Apoio vinculado. |
| **Apoio** | Pai/mãe, terapeuta, parceiro. Acessa via convite aceito pelo Titular. Sem acesso ao Cofre em hipótese alguma. |

### Módulos funcionais

| Módulo | Funcionalidade |
|--------|---------------|
| 🗓️ **Agenda** | Tarefas, subtarefas, lembretes adaptivos, visões dia/semana/kanban |
| ⏱️ **Focus** | Timer Pomodoro adaptado, modo foco, rastreamento de sessões |
| 💚 **Emotional** | Check-ins de humor/energia, diário pessoal, insights de tendências |
| 🔐 **Vault** | Cofre zero-knowledge de senhas e segredos — isolado fisicamente |
| 🔗 **Links** | Vínculo Titular ↔ Apoio com permissões granulares |
| 👤 **Identity** | Registro, login, 2FA TOTP, sessões JWT |
| 🚀 **Onboarding** | Setup inicial de 5 etapas com perfil neurodivergente |

---

## Stack e Tecnologias

### Backend

<table>
  <tr>
    <td align="center" width="100"><img src="https://img.shields.io/badge/-Java%2021-ED8B00?logo=openjdk&logoColor=white&style=flat-square" /><br/>Java 21</td>
    <td align="center" width="120"><img src="https://img.shields.io/badge/-Spring%20Boot-6DB33F?logo=springboot&logoColor=white&style=flat-square" /><br/>Spring Boot 3.3</td>
    <td align="center" width="120"><img src="https://img.shields.io/badge/-PostgreSQL-4169E1?logo=postgresql&logoColor=white&style=flat-square" /><br/>PostgreSQL 16</td>
    <td align="center" width="100"><img src="https://img.shields.io/badge/-Redis-DC382D?logo=redis&logoColor=white&style=flat-square" /><br/>Redis</td>
    <td align="center" width="120"><img src="https://img.shields.io/badge/-RabbitMQ-FF6600?logo=rabbitmq&logoColor=white&style=flat-square" /><br/>RabbitMQ</td>
    <td align="center" width="100"><img src="https://img.shields.io/badge/-Flyway-CC0200?logo=flyway&logoColor=white&style=flat-square" /><br/>Flyway</td>
  </tr>
</table>

- **Virtual threads** (Java 21) para concorrência sem bloqueio
- **Spring Authorization Server** — JWT RS256, access 15 min + refresh 30 dias
- **Dois datasources** — Core DB e Vault DB completamente separados
- **Argon2id** para senhas; **AES-256-GCM** para dados sensíveis em nível de coluna
- **mTLS** na comunicação Core ↔ Vault Service

### Frontend Web

<table>
  <tr>
    <td align="center" width="100"><img src="https://img.shields.io/badge/-React%2018-61DAFB?logo=react&logoColor=black&style=flat-square" /><br/>React 18</td>
    <td align="center" width="120"><img src="https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white&style=flat-square" /><br/>TypeScript 5</td>
    <td align="center" width="100"><img src="https://img.shields.io/badge/-Vite%205-646CFF?logo=vite&logoColor=white&style=flat-square" /><br/>Vite 5</td>
    <td align="center" width="120"><img src="https://img.shields.io/badge/-TailwindCSS-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square" /><br/>Tailwind 3</td>
    <td align="center" width="100"><img src="https://img.shields.io/badge/-Zustand-433E38?logo=react&logoColor=white&style=flat-square" /><br/>Zustand</td>
    <td align="center" width="130"><img src="https://img.shields.io/badge/-TanStack%20Query-FF4154?logo=reactquery&logoColor=white&style=flat-square" /><br/>TanStack Query</td>
  </tr>
</table>

### Mobile

<table>
  <tr>
    <td align="center" width="140"><img src="https://img.shields.io/badge/-Kotlin%20Multiplatform-7F52FF?logo=kotlin&logoColor=white&style=flat-square" /><br/>Kotlin Multiplatform</td>
    <td align="center" width="140"><img src="https://img.shields.io/badge/-Jetpack%20Compose-4285F4?logo=android&logoColor=white&style=flat-square" /><br/>Jetpack Compose</td>
    <td align="center" width="100"><img src="https://img.shields.io/badge/-SwiftUI-F05138?logo=swift&logoColor=white&style=flat-square" /><br/>SwiftUI (iOS)</td>
  </tr>
</table>

### Infraestrutura

<table>
  <tr>
    <td align="center" width="100"><img src="https://img.shields.io/badge/-Docker-2496ED?logo=docker&logoColor=white&style=flat-square" /><br/>Docker</td>
    <td align="center" width="100"><img src="https://img.shields.io/badge/-Render-46E3B7?logo=render&logoColor=black&style=flat-square" /><br/>Render</td>
    <td align="center" width="130"><img src="https://img.shields.io/badge/-GitHub%20Actions-2088FF?logo=githubactions&logoColor=white&style=flat-square" /><br/>GitHub Actions</td>
  </tr>
</table>

---

## Web Page Application

### Design System

A interface é construída sobre um sistema de tokens por módulo — cada área tem sua identidade visual própria, mantendo coesão global.

| Módulo | Cor de acento | Token Tailwind |
|--------|--------------|---------------|
| 🗓️ Agenda | Sky blue `#0ea5e9` | `agenda` |
| ⏱️ Focus | Violet `#7c3aed` | `focus` |
| 💚 Emotional | Emerald `#10b981` | `emotional` |
| 🔐 Vault | Amber `#f59e0b` | `vault` |
| 🔗 Links | Cyan `#06b6d4` | `link` |

**Tipografia:** `Outfit` (títulos/display) · `DM Sans` (corpo) · `JetBrains Mono` (código/números)

**Padrão visual:** Glass cards com `backdrop-blur` + animações respeitosas ao `prefers-reduced-motion`

### Arquitetura frontend (feature-based)

```
web/src/
  app/              # Router, Providers, App root
  features/
    auth/           # Login, registro, JWT
    agenda/         # Calendário, tarefas, kanban
    focus/          # Timer Pomodoro, sessões
    emotional/      # Check-ins, diário, tendências
    vault/          # Cofre zero-knowledge
    links/          # Gestão de vínculos
    onboarding/     # Setup inicial 5 etapas
    dashboard/      # Home pós-login
  shared/
    components/     # ui/ + layout/
    hooks/          # useLocalStorage, useMediaQuery, usePrefersReducedMotion
    lib/            # api.ts (Axios + JWT interceptor), queryClient.ts
    stores/         # auth.store.ts, ui.store.ts (Zustand persist)
    types/          # api.types.ts, auth.types.ts
  styles/           # globals.css (Tailwind + design tokens)
```

### Rodando o frontend

```bash
cd web
npm install
cp .env.example .env.local   # configure VITE_API_URL=http://localhost:8080
npm run dev                   # http://localhost:3000
npm run build                 # build de produção
npm run type-check            # TypeScript sem build
```

### Acessibilidade (WCAG 2.1 AA — obrigatório)

- Todos os elementos interativos têm anel `focus-visible`
- Botões icon-only sempre com `aria-label`
- Regiões dinâmicas com `aria-live="polite"` ou `role="alert"`
- `prefers-reduced-motion` respeitado via CSS + hook global
- Touch target mínimo de 44×44px
- Vault **nunca exibido** para role `APOIO` — guard de rota `RequireTitular`

---

## App PWA Mobile

Neuro-Gen é uma **Progressive Web App** instalável diretamente pelo browser, sem passar por lojas de aplicativos. Funciona em Android e iOS com experiência próxima a um app nativo.

### Recursos PWA

| Recurso | Detalhe |
|---------|---------|
| 📲 Instalável | Prompt de instalação nativo no Android Chrome e Safari iOS |
| 🔌 Offline | Service Worker com cache de assets e shell do app |
| 🔔 Notificações push | Web Push API — lembretes de tarefas e check-ins |
| ⚡ App Shell | Carregamento instantâneo após primeira visita |
| 🏠 Ícone na home | `logo-192.webp` para Android, `apple-touch-icon.png` para iOS |

### Navegação mobile

Bottom Navigation circular com acesso rápido aos 5 módulos principais — Agenda, Focus, Dashboard, Emotional e Links. Design adaptado para uso com uma mão e alvos de toque ≥ 44px.

### Instalar no dispositivo

**Android (Chrome):**
1. Acesse o app no Chrome
2. Toque no banner "Adicionar à tela inicial" ou no menu ⋮ → "Instalar app"

**iOS (Safari):**
1. Acesse o app no Safari
2. Toque em Compartilhar → "Adicionar à Tela de Início"

### Ícones do app

| Arquivo | Uso |
|---------|-----|
| `web/public/logo-192.webp` | Ícone PWA Android / manifest |
| `web/public/logo-64.webp` | Favicon / ícone pequeno |
| `web/public/apple-touch-icon.png` | Ícone iOS home screen |
| `web/public/favicon.svg` | Favicon vetorial |
| `web/public/logo.webp` | Logo full-res |

---

## Rodando localmente (stack completa)

### Pré-requisitos

- Java 21+
- Docker + Docker Compose
- Node.js 20+

### Backend + banco de dados

```bash
# PostgreSQL sobe automaticamente via Docker Compose
./mvnw spring-boot:run
```

| Endpoint | URL |
|----------|-----|
| Swagger UI | `http://localhost:8080/swagger-ui.html` |
| Health check | `http://localhost:8080/actuator/health` |

> Tokens de verificação de e-mail aparecem nos logs como `[DEV] Verificação de e-mail`.

### Stack completa com Docker

```bash
docker compose -f docker-compose.full.yml up -d
# Backend: http://localhost:8080
# Frontend: http://localhost:3000
```

---

## Testes

```bash
./mvnw test      # unitários + API slice (sem Docker)
./mvnw verify    # pirâmide completa com Testcontainers (requer Docker)
```

**Pirâmide de testes (ADR-008):**

| Nível | Ferramenta | Cobertura |
|-------|-----------|-----------|
| Domain | JUnit 5 + AssertJ | Invariantes de agregado, máquinas de estado |
| Application | Mockito | Use cases + caminhos de erro |
| API | MockMvc standalone | Contratos HTTP, GlobalExceptionHandler |
| Integration | Testcontainers + PostgreSQL 16 real | Ambos datasources + Flyway + **teste de segurança Vault** |

> O teste de integração que verifica `APOIO → 403` em qualquer rota `/api/v1/vault/*` é obrigatório no CI e nunca pode ser pulado.

---

## Implementação em Nuvem

O frontend do Neuro-Gen pode ser publicado em nuvem de duas formas, dependendo do perfil do deploy.

### Vercel

Plataforma recomendada para o frontend em produção. Integra diretamente com o repositório GitHub e faz deploy automático a cada push em `main`.

**Deploy em 3 passos:**

1. Acesse [vercel.com](https://vercel.com) e importe o repositório `Neuro-Gen-App`
2. Configure o diretório raiz como `web/` e o framework como **Vite**
3. Adicione a variável de ambiente:

```env
VITE_API_URL=https://sua-api.onrender.com
```

**Configuração recomendada (`vercel.json` na raiz de `web/`):**

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}
```

| Recurso | Detalhe |
|---------|---------|
| ⚡ Deploy automático | A cada push em `main` ou `develop` |
| 🌍 CDN global | Edge network em +100 regiões |
| 🔒 HTTPS automático | Certificado SSL provisionado automaticamente |
| 👁️ Preview URLs | PR abre URL de preview isolada |
| 📊 Analytics | Web Vitals e performance integrados |

---

### Lovable

Alternativa no-code/low-code para prototipação rápida e iteração de UI sem necessidade de CLI ou pipeline CI/CD.

**Quando usar Lovable:**
- Validação rápida de telas e fluxos com stakeholders
- Prototipagem de novos módulos antes de implementar no código-base principal
- Demonstrações ao vivo sem configurar ambiente local

**Fluxo de trabalho:**

1. Acesse [lovable.dev](https://lovable.dev) e crie um novo projeto
2. Cole o código de um componente ou página do `web/src/features/`
3. Itere visualmente e exporte as alterações de volta para o repositório via **GitHub Sync**

| Recurso | Detalhe |
|---------|---------|
| 🎨 Editor visual | Edição de UI em tempo real com IA |
| 🔄 GitHub Sync | Sincroniza alterações bidirecionalmente com o repo |
| 📱 Preview mobile | Visualização responsiva instantânea |
| 🚀 Publish | URL pública gerada em 1 clique para demos |

---

### Comparativo

| Critério | Vercel | Lovable |
|----------|--------|---------|
| **Uso ideal** | Produção / CI-CD | Prototipagem / demos |
| **Integração CI** | Nativa (GitHub) | Via GitHub Sync |
| **Domínio customizado** | Sim | Sim (planos pagos) |
| **Controle de código** | Total | Parcial (exportação) |
| **Curva de aprendizado** | Baixa | Mínima |
| **Custo** | Free tier generoso | Free tier limitado |

> **Recomendação:** use **Vercel** para o ambiente de produção contínuo e **Lovable** para validar ideias de UI rapidamente antes de codificar.

---

## Variáveis de ambiente

Copie `.env.example` e preencha os valores:

| Variável | Descrição |
|----------|-----------|
| `DB_HOST / DB_NAME / DB_USERNAME / DB_PASSWORD` | Core PostgreSQL |
| `VAULT_DB_URL / VAULT_DB_USERNAME / VAULT_DB_PASSWORD` | Vault PostgreSQL (instância separada) |
| `SENSITIVE_DATA_KEY` | Chave AES-256-GCM para dados sensíveis (não rotacionar após dados existirem) |
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

Infra-as-code: `render.yaml` (Blueprint). Profile de produção: `application-prod.yml`.

> **Limitações do tier gratuito:** hibernação após 15 min de inatividade; PostgreSQL expira em 30 dias; chave RSA regenerada a cada restart (tokens invalidam).

---

## Segurança

- **Vault isolado estruturalmente** — role `APOIO` bloqueada no security filter chain (hard-coded), não é verificação em runtime.
- **Dois bancos separados** — credenciais do Vault DB nunca compartilhadas com o Core DB.
- **Zero-knowledge no Vault** — chave mestra derivada no browser via Argon2id; servidor nunca vê plaintext.
- **Dados sensíveis** (check-ins emocionais, perfil, TOTP) com AES-256-GCM em nível de coluna.
- **LGPD** — Privacy by Design, schema `ng_sensitive` isolado (ADR-006).

---

## Documentação

| Documento | Descrição |
|-----------|-----------|
| [`docs/defContexto/01-visao-produto.md`](docs/defContexto/01-visao-produto.md) | Visão de produto, personas e escopo |
| [`docs/defContexto/02-requisitos-funcionais.md`](docs/defContexto/02-requisitos-funcionais.md) | Requisitos funcionais e épicos |
| [`docs/defContexto/03-requisitos-nao-funcionais.md`](docs/defContexto/03-requisitos-nao-funcionais.md) | NFRs: segurança, privacidade, performance |
| [`docs/defContexto/04-arquitetura-visao-geral.md`](docs/defContexto/04-arquitetura-visao-geral.md) | Diagramas C4 e camadas |
| [`docs/defContexto/05-adrs.md`](docs/defContexto/05-adrs.md) | ADRs 001–008 |
| [`docs/backend/README.md`](docs/backend/README.md) | Guia de implementação backend |
| [`docs/deploy/README.md`](docs/deploy/README.md) | Guia de deploy e demo ao vivo |

---

## Convenções de desenvolvimento

- **Commits:** Conventional Commits em português
- **TDD:** `[TDD-RED]` → `[TDD-GREEN]` → `[TDD-REFACTOR]`
- **Branch flow:** `feature/*` → PR para `develop` → PR para `main`
- **Merge para `main`** apenas com CI verde (auto-deploy para Render)

---

<p align="center">
  <img src="web/public/Neuro-Gen_v2.png" alt="Neuro-Gen App" width="600" />
</p>

<p align="center">
  Feito com 💜 para mentes que funcionam diferente.
</p>
