# Guia de Deploy na Vercel via Git

## ✅ O que já foi configurado

### Supabase
- ✅ Projeto "google" encontrado: `hvrrixmsijkehdlaxdsi`
- ✅ Todas as tabelas criadas com sucesso:
  - `responsaveis`
  - `alunos`
  - `responsavel_aluno`
  - `password_resets_log`
  - `otp_codes`
  - `rate_limits`
- ✅ RLS (Row Level Security) habilitado
- ✅ Índices e triggers configurados

## 🚀 Deploy na Vercel via Git

### Passo 1: Preparar o Repositório Git

1. Inicialize o Git (se ainda não fez):
```bash
git init
```

2. Adicione todos os arquivos:
```bash
git add .
```

3. Faça o commit inicial:
```bash
git commit -m "Initial commit: Sistema de reset de senha"
```

4. Crie um repositório no GitHub/GitLab/Bitbucket e conecte:
```bash
git remote add origin <URL_DO_SEU_REPOSITORIO>
git push -u origin main
```

### Passo 2: Conectar à Vercel

1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Clique em **Add New Project**
3. Selecione seu repositório Git
4. Configure o projeto:
   - **Project Name**: `reset-senha-alunos` (ou o nome que preferir)
   - **Framework Preset**: Next.js (deve detectar automaticamente)
   - **Root Directory**: `./` (raiz do projeto)

### Passo 3: Configurar Variáveis de Ambiente

Na Vercel, adicione todas as variáveis de ambiente:

#### Supabase
```
NEXT_PUBLIC_SUPABASE_URL=https://hvrrixmsijkehdlaxdsi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
```

#### API Externa
```
API_EXTERNA_URL=https://loja.escolamorumbisul.com.br/api/importacao.php
API_EXTERNA_KEY=sua-api-key-aqui
```

#### API Key Interna
```
API_KEY_INTERNA=gerar-uma-chave-secreta-forte-aqui
```

#### Google Workspace Admin SDK
```
GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_ADMIN_EMAIL=admin@escola.com.br
GOOGLE_DOMAIN=escola.com.br
```

#### Ambiente
```
NODE_ENV=production
```

**Importante**: 
- Para `GOOGLE_PRIVATE_KEY`, mantenha as quebras de linha `\n`
- Use aspas duplas para valores com quebras de linha
- Marque todas como "Production", "Preview" e "Development" se necessário

### Passo 4: Deploy

1. Clique em **Deploy**
2. Aguarde o build completar
3. Acesse a URL fornecida pela Vercel

### Passo 5: Configurar Cron Job (Opcional)

O arquivo `vercel.json` já está configurado para sincronização automática a cada 6 horas. A Vercel detectará automaticamente.

Se quiser ajustar, edite `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/sincronizar",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

## 📋 Checklist Pós-Deploy

- [ ] Testar página inicial: `https://seu-projeto.vercel.app`
- [ ] Testar validação de vínculo
- [ ] Testar geração de OTP
- [ ] Testar reset de senha
- [ ] Verificar logs no Supabase
- [ ] Testar sincronização: `POST /api/sincronizar`
- [ ] Configurar domínio customizado (opcional)

## 🔍 Verificar Deploy

### URLs importantes:
- **Aplicação**: `https://seu-projeto.vercel.app`
- **API Validar Vínculo**: `https://seu-projeto.vercel.app/api/validar-vinculo`
- **API Sincronizar**: `https://seu-projeto.vercel.app/api/sincronizar`

### Testar API de Sincronização:
```bash
curl -X POST https://seu-projeto.vercel.app/api/sincronizar \
  -H "Authorization: Bearer SUA_API_KEY_INTERNA" \
  -H "Content-Type: application/json"
```

## 🐛 Troubleshooting

### Erro: "Module not found"
- Verifique se todas as dependências estão no `package.json`
- O build da Vercel instala automaticamente

### Erro: "Environment variable not found"
- Verifique se todas as variáveis foram adicionadas na Vercel
- Certifique-se de que estão marcadas para o ambiente correto

### Erro: "Supabase connection failed"
- Verifique `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`
- Confirme que o projeto Supabase está ativo

### Erro: "Google Admin SDK error"
- Verifique todas as variáveis do Google
- Confirme Domain-Wide Delegation configurado
- Verifique se o Service Account tem permissões

## 📝 Próximos Passos

1. **Primeira Sincronização**: Execute `/api/sincronizar` para popular o banco
2. **Testar Fluxo Completo**: Valide todo o processo de reset
3. **Monitorar Logs**: Acompanhe os logs na Vercel Dashboard
4. **Configurar Domínio**: Adicione domínio customizado se necessário

## 🔗 Links Úteis

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Supabase Dashboard](https://app.supabase.com)
- [Vercel Docs - Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Docs - Cron Jobs](https://vercel.com/docs/cron-jobs)
