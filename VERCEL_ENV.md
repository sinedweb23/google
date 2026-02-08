# Variáveis de Ambiente para Vercel

## ✅ Informações do Supabase (Já Configurado)

**Projeto**: google  
**Project ID**: hvrrixmsijkehdlaxdsi  
**URL**: https://hvrrixmsijkehdlaxdsi.supabase.co

## 📋 Variáveis para Adicionar na Vercel

Copie e cole estas variáveis no painel da Vercel (Settings > Environment Variables):

### Supabase (Obrigatório)

```
NEXT_PUBLIC_SUPABASE_URL=https://hvrrixmsijkehdlaxdsi.supabase.co
```

**SUPABASE_SERVICE_ROLE_KEY**: 
- Acesse: https://app.supabase.com/project/hvrrixmsijkehdlaxdsi/settings/api
- Copie a "service_role" key (secret)
- ⚠️ NUNCA exponha esta key no frontend

### API Externa (Obrigatório)

```
API_EXTERNA_URL=https://loja.escolamorumbisul.com.br/api/importacao.php
API_EXTERNA_KEY=sua-api-key-da-api-php-aqui
```

### API Key Interna (Obrigatório)

```
API_KEY_INTERNA=gerar-uma-chave-secreta-forte-aqui
```

**Dica**: Gere uma chave forte:
```bash
openssl rand -base64 32
```

### Google Workspace Admin SDK (Obrigatório)

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_ADMIN_EMAIL=admin@escola.com.br
GOOGLE_DOMAIN=escola.com.br
```

**Importante para GOOGLE_PRIVATE_KEY**:
- Mantenha as quebras de linha `\n`
- Use aspas duplas na Vercel
- Cole a chave completa do arquivo JSON do Service Account

### Ambiente (Opcional)

```
NODE_ENV=production
```

## 🔐 Como Adicionar na Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** > **Environment Variables**
4. Adicione cada variável:
   - **Key**: Nome da variável (ex: `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value**: Valor da variável
   - **Environment**: Selecione Production, Preview e Development
5. Clique em **Save**

## ✅ Checklist

- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurada
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurada (obter do Supabase Dashboard)
- [ ] `API_EXTERNA_URL` configurada
- [ ] `API_EXTERNA_KEY` configurada
- [ ] `API_KEY_INTERNA` gerada e configurada
- [ ] `GOOGLE_SERVICE_ACCOUNT_EMAIL` configurada
- [ ] `GOOGLE_PRIVATE_KEY` configurada (com `\n`)
- [ ] `GOOGLE_ADMIN_EMAIL` configurada
- [ ] `GOOGLE_DOMAIN` configurada

## 🔍 Onde Obter as Chaves

### Supabase Service Role Key
1. Acesse: https://app.supabase.com/project/hvrrixmsijkehdlaxdsi/settings/api
2. Role: **service_role**
3. Copie a chave (ela começa com `eyJ...`)

### Google Service Account
1. Acesse Google Cloud Console
2. Vá em **IAM & Admin** > **Service Accounts**
3. Selecione seu Service Account
4. **Keys** > **Add Key** > **Create new key** > **JSON**
5. Do JSON, extraia:
   - `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → `GOOGLE_PRIVATE_KEY`

## ⚠️ Segurança

- ✅ Nunca commite o arquivo `.env.local` no Git
- ✅ Use apenas variáveis de ambiente na Vercel
- ✅ Service Role Key deve ser mantida em segredo
- ✅ Google Private Key deve ser mantida em segredo
- ✅ API Keys devem ser mantidas em segredo

## 🧪 Testar Após Configurar

Após adicionar todas as variáveis e fazer o deploy:

1. Teste a página inicial
2. Teste a API de sincronização:
```bash
curl -X POST https://seu-projeto.vercel.app/api/sincronizar \
  -H "Authorization: Bearer SUA_API_KEY_INTERNA"
```

3. Verifique os logs na Vercel Dashboard se houver erros
