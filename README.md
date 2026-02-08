# Sistema de Reset de Senha - Google Workspace

Sistema web para permitir que responsáveis legais resetem senhas de alunos do Google Workspace for Education, sem acesso ao painel administrativo.

## 🎯 Objetivo

Permitir que responsáveis legais validem seu vínculo com alunos e solicitem reset de senha do email do aluno no Google Workspace, com segurança e auditoria completa.

## 🛠️ Stack Tecnológica

- **Frontend/Backend**: Next.js 14 (App Router)
- **Banco de Dados**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Google Workspace**: Admin SDK (Directory API)
- **Deploy**: Vercel

## 📋 Pré-requisitos

1. **Google Workspace Admin**
   - Acesso ao painel administrativo
   - Service Account criado
   - Domain-Wide Delegation configurado
   - Escopo: `https://www.googleapis.com/auth/admin.directory.user`

2. **Supabase**
   - Projeto criado
   - Banco de dados configurado
   - Service Role Key

3. **API Externa**
   - Endpoint PHP funcionando
   - API Key para autenticação

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone <repo-url>
cd reset-senha-alunos
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha com suas credenciais:

```bash
cp .env.example .env.local
```

### 4. Configure o Supabase

Execute o script SQL em `supabase/schema.sql` no seu projeto Supabase:

1. Acesse o Supabase Dashboard
2. Vá em SQL Editor
3. Cole o conteúdo de `supabase/schema.sql`
4. Execute o script

### 5. Configure o Google Workspace

#### Criar Service Account

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione existente
3. Vá em **APIs & Services** > **Credentials**
4. Clique em **Create Credentials** > **Service Account**
5. Preencha os dados e crie
6. Vá em **Keys** > **Add Key** > **Create new key** > **JSON**
7. Baixe o arquivo JSON

#### Configurar Domain-Wide Delegation

1. No Service Account, clique em **Show Domain-Wide Delegation**
2. Marque **Enable Google Workspace Domain-wide Delegation**
3. Anote o **Client ID**
4. No Google Workspace Admin:
   - Vá em **Security** > **API Controls** > **Domain-wide Delegation**
   - Clique em **Add new**
   - Cole o Client ID
   - Escopo: `https://www.googleapis.com/auth/admin.directory.user`
   - Autorize

#### Extrair credenciais

Do arquivo JSON baixado, extraia:
- `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `private_key` → `GOOGLE_PRIVATE_KEY` (mantenha as quebras de linha `\n`)

### 6. Execute o projeto

```bash
npm run dev
```

Acesse `http://localhost:3000`

## 📁 Estrutura do Projeto

```
.
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── validar-vinculo/
│   │   ├── gerar-otp/
│   │   ├── validar-otp/
│   │   ├── resetar-senha/
│   │   └── sincronizar/
│   ├── otp/               # Página de validação OTP
│   ├── reset/              # Página de reset
│   ├── layout.tsx
│   ├── page.tsx           # Página inicial
│   └── globals.css
├── lib/
│   ├── api/               # Integrações externas
│   │   └── externa.ts     # API PHP
│   ├── google/            # Google Admin SDK
│   │   └── admin.ts
│   ├── supabase/          # Cliente Supabase
│   │   └── server.ts
│   └── utils/              # Utilitários
│       ├── security.ts
│       └── rate-limit.ts
├── supabase/
│   └── schema.sql         # Esquema do banco
├── .env.example
├── package.json
└── README.md
```

## 🔄 Fluxo de Funcionamento

1. **Validação de Vínculo**
   - Responsável informa CPF e prontuário/email do aluno
   - Sistema valida vínculo no Supabase
   - Rate limiting por CPF/IP

2. **Geração de OTP**
   - Sistema gera código de 6 dígitos
   - Envia por email ou SMS (mock inicialmente)
   - Código expira em 10 minutos

3. **Validação de OTP**
   - Responsável digita o código
   - Sistema valida e gera token temporário (5 minutos)

4. **Reset de Senha**
   - Sistema gera senha temporária forte
   - Chama Google Admin SDK para resetar
   - Força troca de senha no próximo login
   - Registra log de auditoria

## 🔐 Segurança

### Implementado

- ✅ Hash SHA-256 de CPF (LGPD)
- ✅ Rate limiting por CPF e IP
- ✅ Validação de vínculo responsável ↔ aluno
- ✅ OTP com expiração
- ✅ Tokens temporários para reset
- ✅ Logs de auditoria completos
- ✅ Service Account (nunca expõe credenciais)
- ✅ RLS (Row Level Security) no Supabase

### Recomendações

- [ ] Implementar envio real de email (SendGrid, AWS SES, etc.)
- [ ] Implementar envio real de SMS (Twilio, etc.)
- [ ] Usar Redis para tokens temporários (em produção)
- [ ] Adicionar CAPTCHA na página inicial
- [ ] Implementar monitoramento e alertas
- [ ] Revisar logs regularmente

## 📊 Sincronização de Dados

A sincronização com a API PHP externa pode ser feita de duas formas:

### 1. Manual (via API)

```bash
curl -X POST https://seu-dominio.com/api/sincronizar \
  -H "Authorization: Bearer SUA_API_KEY_INTERNA"
```

### 2. Automática (Cron)

Configure um cron job na Vercel ou use Vercel Cron:

```json
// vercel.json
{
  "crons": [{
    "path": "/api/sincronizar",
    "schedule": "0 */6 * * *"
  }]
}
```

## 🧪 Desenvolvimento

### Modo de Desenvolvimento

Em desenvolvimento, o código OTP é exibido no console e no alert. **Remova isso em produção!**

### Testes

1. Valide o fluxo completo:
   - Validação de vínculo
   - Geração de OTP
   - Validação de OTP
   - Reset de senha

2. Teste rate limiting:
   - Faça 5+ tentativas com CPF inválido
   - Verifique bloqueio

3. Teste logs:
   - Verifique tabela `password_resets_log` no Supabase

## 🚢 Deploy na Vercel

1. Conecte seu repositório à Vercel
2. Configure as variáveis de ambiente
3. Deploy automático

### Variáveis de Ambiente na Vercel

Adicione todas as variáveis do `.env.example` no painel da Vercel:
- Settings > Environment Variables

## 📝 Logs e Auditoria

Todos os resets são registrados em `password_resets_log` com:
- ID do aluno e responsável
- IP e User-Agent
- Status (pendente, sucesso, falha)
- Timestamp

## ⚠️ Importante

1. **Nunca exponha**:
   - Service Account Key
   - Supabase Service Role Key
   - API Keys

2. **Em produção**:
   - Remova logs de OTP
   - Implemente envio real de email/SMS
   - Use Redis para tokens
   - Configure monitoramento

## 📞 Suporte

Para dúvidas ou problemas, consulte:
- [Google Admin SDK Docs](https://developers.google.com/admin-sdk/directory)
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)

## 📄 Licença

Este projeto é de uso interno da escola.
