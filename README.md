# 🎨 NFT Mini App — Farcaster + In•Process

Mini app para coletar um NFT específico do In•Process, diretamente dentro do Farcaster.

---

## 📋 O que você precisa (pré-requisitos)

Antes de começar, instale estas ferramentas no seu computador:

1. **Node.js** → https://nodejs.org (baixe a versão "LTS")
2. **Git** → https://git-scm.com/downloads
3. **Uma conta no GitHub** → https://github.com (grátis)
4. **Uma conta na Vercel** → https://vercel.com (grátis, faça login com o GitHub)

---

## 🚀 Passo a Passo: Deploy na Vercel

### Passo 1 — Colocar o projeto no GitHub

1. Crie uma conta no GitHub (se ainda não tiver)
2. Clique em "+" no canto superior direito → "New repository"
3. Dê um nome (ex: `nft-miniapp`) → clique "Create repository"
4. Abra o Terminal (no Mac) ou Prompt de Comando (no Windows)
5. Navegue até a pasta do projeto e execute:

```bash
cd nft-miniapp
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/nft-miniapp.git
git push -u origin main
```

### Passo 2 — Deploy na Vercel

1. Acesse https://vercel.com e entre com sua conta GitHub
2. Clique em "Add New Project"
3. Selecione o repositório `nft-miniapp`
4. Na seção "Environment Variables", adicione:
   - **Name:** `NEXT_PUBLIC_APP_URL`
   - **Value:** (deixe em branco por agora, vai preencher depois)
5. Clique em "Deploy"
6. Aguarde o deploy terminar (~2 minutos)
7. Copie a URL gerada (ex: `https://nft-miniapp-abc123.vercel.app`)

### Passo 3 — Atualizar a URL do app

1. Volte na Vercel → seu projeto → Settings → Environment Variables
2. Edite `NEXT_PUBLIC_APP_URL` e cole a URL real do seu app
3. Vá em "Deployments" → "Redeploy" no deploy mais recente

---

## 🔗 Registrar o Mini App no Farcaster

### Passo 1 — Ativar modo desenvolvedor

1. Acesse https://farcaster.xyz/~/settings/developer-tools
2. Ligue o toggle "Developer Mode"

### Passo 2 — Testar o Mini App

1. No Farcaster (warpcast.com ou app), vá em **Settings → Developer Tools**
2. Clique em "Mini App Playground" ou acesse: https://warpcast.com/~/developers/mini-apps
3. Cole a URL do seu app (ex: `https://nft-miniapp-abc123.vercel.app`)
4. Clique em "Preview" — você verá o app funcionando!

### Passo 3 — Gerar o manifest (para publicar oficialmente)

1. No Farcaster Developer Tools, clique em "Manage Manifests"
2. Clique em "Create manifest for domain"
3. Digite o domínio do seu app (sem https://)
4. Assine com sua carteira Farcaster
5. Copie o resultado e cole no arquivo `app/.well-known/farcaster.json/route.ts`
6. Faça commit e redeploy

---

## 🎯 Como testar o fluxo completo (carteira + coleta)

**Dentro do Farcaster (Warpcast):**

1. Abra o Mini App Playground com a URL do seu app
2. O app vai carregar com a imagem do NFT
3. Clique em "Connect & Collect" — sua carteira Farcaster vai conectar automaticamente
4. Após conectar, clique "Collect" — vai abrir o In•Process para finalizar a coleta
5. Aprove a transação na sua carteira

**Fora do Farcaster (no navegador normal):**
- A conexão de carteira não vai funcionar (isso é normal!)
- O app só funciona 100% dentro do Warpcast

---

## 🛠 Personalizar o app

Para trocar o NFT, edite estas linhas nos arquivos:

**`app/page.tsx`** (linhas 9-11):
```typescript
const NFT_COLLECTION = "0xSEU_ENDERECO_AQUI";
const NFT_TOKEN_ID = "SEU_TOKEN_ID";
const CHAIN_ID = 8453; // Base network
```

**`app/layout.tsx`** (mesmas variáveis):
```typescript
const NFT_COLLECTION = "0xSEU_ENDERECO_AQUI";
const NFT_TOKEN_ID = "SEU_TOKEN_ID";
const APP_NAME = "Nome do Seu App";
```

---

## ❓ Problemas comuns

**"npm install" deu erro**
→ Verifique que o Node.js está instalado: `node --version` (precisa ser 22+)

**App não abre no Farcaster**
→ Verifique se `NEXT_PUBLIC_APP_URL` está correto nas variáveis de ambiente da Vercel

**Botão "Collect" não faz nada**
→ Normal fora do Warpcast. Dentro do Warpcast vai funcionar.

**Imagem não aparece**
→ O In•Process pode demorar alguns segundos para gerar a imagem do NFT

---

## 📁 Estrutura do projeto

```
nft-miniapp/
├── app/
│   ├── layout.tsx          ← Metadados do Farcaster embed
│   ├── page.tsx            ← Tela principal do app
│   ├── page.module.css     ← Estilos visuais
│   ├── globals.css         ← Estilos globais
│   └── .well-known/
│       └── farcaster.json/ ← Manifest do Farcaster
├── components/
│   ├── providers.tsx       ← Wagmi + React Query
│   └── wagmi-config.ts     ← Configuração da carteira
├── package.json
└── next.config.js
```
