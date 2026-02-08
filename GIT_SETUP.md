# Configuração do Git e Deploy

## 📦 Repositório
**URL**: https://github.com/sinedweb23/google.git

## 🚀 Passos para Fazer Push

### 1. Inicializar Git (se ainda não fez)

```bash
git init
```

### 2. Adicionar Remote

```bash
git remote add origin https://github.com/sinedweb23/google.git
```

### 3. Adicionar Todos os Arquivos

```bash
git add .
```

### 4. Fazer Commit Inicial

```bash
git commit -m "Initial commit: Sistema de reset de senha para Google Workspace"
```

### 5. Fazer Push para o Repositório

```bash
git branch -M main
git push -u origin main
```

**Nota**: Se pedir autenticação, você pode:
- Usar Personal Access Token do GitHub
- Ou configurar SSH keys

## 🔗 Conectar à Vercel

Após o push:

1. Acesse: https://vercel.com/dashboard
2. Clique em **Add New Project**
3. Selecione o repositório: `sinedweb23/google`
4. Configure:
   - **Project Name**: `reset-senha-alunos` (ou deixe `google`)
   - **Framework Preset**: Next.js (detecta automaticamente)
   - **Root Directory**: `./`
5. **Importante**: Adicione as variáveis de ambiente (veja `VERCEL_ENV.md`)
6. Clique em **Deploy**

## ✅ Checklist

- [ ] Git inicializado
- [ ] Remote adicionado
- [ ] Arquivos commitados
- [ ] Push feito para GitHub
- [ ] Projeto conectado na Vercel
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy realizado com sucesso

## 🔐 Variáveis de Ambiente

Não esqueça de adicionar todas as variáveis na Vercel antes do deploy!
Consulte o arquivo `VERCEL_ENV.md` para a lista completa.
