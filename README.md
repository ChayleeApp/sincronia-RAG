### GraphRAG API v3.1

API assíncrona para processamento de documentos com extração de grafo de conhecimento usando LLMs.

## 🎯 Funcionalidades

- ✅ **Autenticação JWT** - Todos os endpoints protegidos
- ✅ **Múltiplos Formatos** - PDF, Word, Excel, PowerPoint, TXT, CSV
- ✅ **Processamento Assíncrono** - Celery + Redis
- ✅ **Múltiplos LLMs** - Claude, OpenAI, Kimi, DeepSeek
- ✅ **Busca Híbrida** - Semântica + Grafo de Conhecimento
- ✅ **Neo4j Vector Store** - Armazenamento de embeddings

## 🚀 Deploy Rápido

### Com Docker Compose

```bash
# 1. Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais

# 2. Inicie os serviços
docker-compose up -d

# 3. Acesse
# API: http://localhost:8000
# Docs: http://localhost:8000/docs
```

### No EasyPanel

1. Conecte seu repositório GitHub
2. Configure as variáveis de ambiente
3. Deploy com `Dockerfile`
4. Crie outro App para o Worker com `Dockerfile.worker`

## 🔐 Autenticação

**Usuários padrão:**
```
admin / admin123
user / user123
```

**Obter token:**
```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"
```

**Usar token:**
```bash
curl -X GET "http://localhost:8000/documents" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📁 Formatos Suportados

- PDF (.pdf)
- Word (.docx, .doc)
- Excel (.xlsx, .xls)
- PowerPoint (.pptx, .ppt)
- Texto (.txt)
- CSV (.csv)

## 📚 Endpoints Principais

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/auth/login` | POST | Obter token JWT |
| `/upload` | POST | Upload de documento |
| `/process` | POST | Iniciar processamento |
| `/status/{id}` | GET | Status do processamento |
| `/query` | POST | Consultar documentos |
| `/documents` | GET | Listar documentos |
| `/health` | GET | Status da API |

## 🔧 Configuração

### Variáveis de Ambiente

```env
# Neo4j
NEO4J_URI=neo4j://seu-host:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
NEO4J_DATABASE=neo4j

# APIs
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-api03-...

# Redis
REDIS_URL=redis://redis:6379/0

# JWT (ALTERE EM PRODUÇÃO!)
JWT_SECRET_KEY=sua-chave-secreta-forte
JWT_EXPIRE_MINUTES=1440

# Configurações
DEFAULT_MODEL=claude
TOKEN_CHUNK_SIZE=130
CHUNK_OVERLAP=15
MAX_TOKEN_CHUNK_SIZE=10000
```

## 💻 Desenvolvimento Local

### Instalação Backend

```bash
# Criar ambiente virtual
python -m venv venv

# Ativar
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Instalar dependências
pip install -r requirements.txt
```

### Instalação Frontend

```bash
# Entrar na pasta frontend
cd frontend

# Instalar dependências (com pnpm)
pnpm install

# Ou com npm
npm install

# Ou com yarn
yarn install
```

### Iniciar Serviços

**Terminal 1 - Redis:**
```bash
redis-server
```

**Terminal 2 - Celery Worker:**
```bash
python -m celery -A celery_worker worker --loglevel=info --pool=solo
```

**Terminal 3 - API:**
```bash
python graph_api_v3.py
```

**Terminal 4 - Frontend (Next.js):**
```bash
cd frontend
pnpm dev
# Acesse: http://localhost:3000
```

## 📖 Documentação

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## 🔒 Segurança em Produção

⚠️ **IMPORTANTE:**

1. Altere `JWT_SECRET_KEY` para uma chave forte
2. Altere senhas padrão em `auth.py`
3. Use HTTPS (EasyPanel configura automaticamente)
4. Configure CORS para seus domínios
5. Implemente rate limiting
6. Use banco de dados real para usuários

## 📦 Estrutura do Projeto

```
graphrag-api/
├── graph_api_v3.py          # API principal
├── auth.py                  # Autenticação JWT
├── file_processor.py        # Processador de arquivos
├── celery_worker.py         # Worker Celery
├── llm_providers.py         # Provedores LLM
├── neo4j_store.py          # Vector Store Neo4j
├── extraction_prompts.py    # Prompts por domínio
├── Dockerfile              # Build da API
├── Dockerfile.worker       # Build do Worker
├── docker-compose.yml      # Orquestração
├── requirements.txt        # Dependências Python
├── .env.example           # Template de env
├── uploads/               # Arquivos (volume)
└── frontend/              # Dashboard (Next.js)
    ├── app/               # Páginas
    ├── components/        # Componentes React
    ├── package.json       # Dependências Node
    └── next.config.mjs    # Config Next.js
```

## 🌐 Frontend (Dashboard)

O projeto inclui um dashboard Next.js para gerenciar documentos e consultas.

**Funcionalidades:**
- Upload de documentos
- Monitoramento de processamento
- Consultas aos documentos
- Visualização de resultados

**Iniciar em desenvolvimento:**
```bash
cd frontend
pnpm dev
```

**Build para produção:**
```bash
cd frontend
pnpm build
pnpm start
```

**Configurar variáveis de ambiente:**
```bash
cd frontend
cp .env.example .env.local
```

**Editar `frontend/.env.local`:**
```env
# URL da API (desenvolvimento)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Para produção:
# NEXT_PUBLIC_API_URL=https://api.seudominio.com
```

## 🚀 Atualizar em Produção

1. Faça alterações localmente
2. Commit e push para GitHub:
   ```bash
   git add .
   git commit -m "Sua mensagem"
   git push origin main
   ```
3. No EasyPanel, clique em **Reimplantar** (API e Worker)
4. Para o frontend, crie um App separado com `frontend/` como raiz

## 🐛 Troubleshooting

**Worker não processa:**
- Verifique se Redis está rodando
- Confirme que volumes estão compartilhados
- Veja logs do worker

**Neo4j não conecta:**
- Verifique URI e credenciais
- Confirme que porta 7687 está acessível

**Upload falha:**
- Verifique permissões do volume `/app/uploads`
- Confirme espaço em disco

## 📞 Suporte

- Health check: `GET /health`
- Documentação: `GET /docs`
- Logs: Verifique no EasyPanel ou terminal

---

**Versão:** 3.1.0  
**Última atualização:** 13/12/2024  
**Status:** ✅ Pronto para Produção
