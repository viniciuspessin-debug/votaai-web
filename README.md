# VotaAí Web

Enquetes rápidas e viciantes — Feed infinito, resultados em tempo real, resultado por cidade.

## Stack
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Firebase (Firestore + Auth)
- **Hospedagem**: Vercel

## Setup local

```bash
npm install
npm run dev
```

Acessa http://localhost:3000

## Deploy na Vercel

### Opção 1 — Via GitHub (recomendado)
1. Cria repositório no GitHub e faz push deste projeto
2. Acessa vercel.com → "Add New Project"
3. Importa o repositório
4. Clica em **Deploy** — zero configuração necessária

### Opção 2 — Via CLI
```bash
npm i -g vercel
vercel
```

## Firebase
O projeto já está configurado com o Firebase `votaai-9b91d`.

Certifique-se que no console Firebase:
- ✅ Authentication → Anonymous habilitado
- ✅ Authentication → Google habilitado  
- ✅ Firestore Database criado (southamerica-east1)
- ✅ Regras do Firestore permitem leitura/escrita

## Funcionalidades
- 🗳️ Feed infinito de enquetes
- ⚡ Votação em tempo real com Firebase
- 📊 Resultados por cidade (via IP)
- 🔥 Sistema de streak
- 📈 Trending de enquetes
- ➕ Criar novas enquetes
- 👤 Login anônimo + Google
- 📤 Compartilhamento nativo
