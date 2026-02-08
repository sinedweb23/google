# Guia de Configuração Rápida

## Passos para Configurar o Projeto

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie `.env.local` baseado em `.env.example`:

```bash
cp .env.example .env.local
```

Preencha todas as variáveis necessárias.

### 3. Configurar Supabase

1. Acesse [Supabase Dashboard](https://app.supabase.com)
2. Crie um novo projeto ou use existente
3. Vá em **SQL Editor**
4. Cole o conteúdo de `supabase/schema.sql`
5. Execute o script

### 4. Configurar Google Workspace

#### Passo 1: Criar Service Account

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie/selecione projeto
3. **APIs & Services** > **Enable APIs** > Ative "Admin SDK API"
4. **Credentials** > **Create Credentials** > **Service Account**
5. Preencha nome e crie
6. **Keys** > **Add Key** > **Create new key** > **JSON**
7. Baixe o arquivo JSON

#### Passo 2: Domain-Wide Delegation

1. No Service Account, anote o **Client ID**
2. No [Google Workspace Admin](https://admin.google.com):
   - **Security** > **API Controls** > **Domain-wide Delegation**
   - **Add new**
   - Cole o Client ID
   - Escopo: `https://www.googleapis.com/auth/admin.directory.user`
   - **Authorize**

#### Passo 3: Extrair Credenciais

Do JSON baixado:
- `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `private_key` → `GOOGLE_PRIVATE_KEY` (mantenha `\n`)

### 5. Primeira Sincronização

Execute a sincronização inicial com a API PHP:

```bash
curl -X POST http://localhost:3000/api/sincronizar \
  -H "Authorization: Bearer SUA_API_KEY_INTERNA" \
  -H "Content-Type: application/json"
```

Ou use o Postman/Insomnia.

### 6. Testar o Sistema

1. Inicie o servidor: `npm run dev`
2. Acesse `http://localhost:3000`
3. Teste o fluxo completo:
   - Digite CPF e prontuário
   - Valide vínculo
   - Gere OTP (código aparecerá no console em dev)
   - Valide OTP
   - Reset de senha

## Checklist de Segurança

Antes de colocar em produção:

- [ ] Remover logs de OTP em produção
- [ ] Implementar envio real de email (SendGrid, AWS SES, etc.)
- [ ] Implementar envio real de SMS (Twilio, etc.)
- [ ] Usar Redis para tokens temporários (não Map em memória)
- [ ] Adicionar CAPTCHA na página inicial
- [ ] Configurar monitoramento (Sentry, LogRocket, etc.)
- [ ] Revisar logs regularmente
- [ ] Configurar backup do banco de dados
- [ ] Testar rate limiting
- [ ] Validar todas as validações de entrada

## Estrutura de Arquivos Importantes

```
app/
  api/                    # Endpoints da API
    validar-vinculo/      # Valida CPF + prontuário
    gerar-otp/            # Gera código OTP
    validar-otp/          # Valida código OTP
    resetar-senha/        # Reseta senha no Google
    sincronizar/          # Sincroniza com API PHP
  page.tsx                # Página inicial
  otp/                    # Página de OTP
  reset/                  # Página de reset

lib/
  google/admin.ts         # Integração Google Admin SDK
  api/externa.ts          # Integração API PHP
  supabase/server.ts      # Cliente Supabase
  utils/
    security.ts           # Utilitários de segurança (server)
    security-client.ts    # Utilitários de segurança (client)
    rate-limit.ts         # Rate limiting

supabase/
  schema.sql              # Esquema do banco de dados
```

## Troubleshooting

### Erro: "Service Account não autorizado"
- Verifique Domain-Wide Delegation
- Confirme o escopo correto
- Verifique se o admin email está correto

### Erro: "Usuário não encontrado no Google Workspace"
- Verifique se o email do aluno está correto
- Confirme que o aluno existe no Google Workspace
- Verifique permissões do Service Account

### Erro: "Vínculo não encontrado"
- Execute a sincronização com a API PHP
- Verifique se os dados estão corretos no Supabase
- Confirme CPF e prontuário

### OTP não aparece
- Em desenvolvimento, verifique o console do servidor
- Em produção, implemente envio real de email/SMS

## Próximos Passos

1. Implementar envio real de email/SMS
2. Adicionar testes automatizados
3. Configurar CI/CD
4. Adicionar monitoramento
5. Documentar API para outros sistemas
