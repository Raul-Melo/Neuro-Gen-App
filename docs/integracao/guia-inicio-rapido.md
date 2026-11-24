# Neuro-Gen — Guia de Início Rápido

> **Para quem quer rodar o projeto agora**, sem ler tudo.  
> Se precisar de mais detalhes, veja os guias específicos desta pasta.

---

## Escolha seu modo

| Objetivo | Comando | Tempo |
|---|---|---|
| Desenvolver só o frontend (sem backend) | [Modo Mock](#modo-1--frontend-com-mock) | < 1 min |
| Backend + frontend locais (desenvolvimento completo) | [Modo Dev](#modo-2--desenvolvimento-completo-local) | ~2 min |
| Validar tudo em containers (produção local) | [Modo Docker Completo](#modo-3--stack-completa-no-docker) | ~5 min (1ª vez) |

---

## Pré-requisitos por modo

| Ferramenta | Mock | Dev | Docker Completo |
|---|---|---|---|
| Node.js ≥ 20 | ✅ | ✅ | — |
| Java JDK 21 | — | ✅ | — |
| Docker Desktop ≥ 4.x | — | ✅ | ✅ |

---

## Modo 1 — Frontend com Mock

Roda o React sem nenhum backend. O MSW intercepta todas as chamadas HTTP.

```bash
cd web
cp .env.example .env.local   # já tem VITE_MOCK=true no exemplo
npm install
npm run dev
```

Abra **http://localhost:3000** e faça login com:

| E-mail | Senha | Papel |
|---|---|---|
| `titular@demo.com` | (qualquer) | TITULAR |
| `apoio@demo.com` | (qualquer) | APOIO |
| `raul.fsm692@gmail.com` | `Raul_Melo@2026` | TITULAR |

---

## Modo 2 — Desenvolvimento Completo Local

Backend e frontend rodando na sua máquina. Hot-reload em ambos.

```bash
# Terminal 1 — Banco de dados
docker compose up -d
docker compose ps    # aguarde postgres ficar "healthy"

# Terminal 2 — Backend (na raiz do projeto)
./mvnw spring-boot:run

# Terminal 3 — Frontend
cd web
# garanta que VITE_MOCK=false em web/.env.local
npm run dev
```

| Serviço | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend / Swagger | http://localhost:8080/swagger-ui.html |
| pgAdmin | http://localhost:5050 |

---

## Modo 3 — Stack Completa no Docker

```bash
# 1. Gere a chave AES-256 (Windows PowerShell)
-join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Max 256) })

# 2. Crie o .env
cp .env.example .env
# Edite .env e cole o valor gerado em SENSITIVE_DATA_KEY

# 3. Suba tudo
docker compose -f docker-compose.full.yml --env-file .env up --build -d

# 4. Acompanhe os logs (aguarde ~90s no primeiro build)
docker compose -f docker-compose.full.yml logs -f app
```

| Serviço | URL |
|---|---|
| **Frontend** | **http://localhost:3000** |
| pgAdmin | http://localhost:5050 |
| Swagger (via proxy) | http://localhost:3000/swagger-ui.html |

---

## Próximos passos

- [Guia de Testes](./guia-testes.md) — como rodar testes unitários, de API e de integração
- [Guia de Configuração do Ambiente](./guia-ambiente.md) — variáveis de ambiente, banco, certificados
- [Fluxo de Autenticação](./api-identity.md) — login, tokens, verificação de e-mail
