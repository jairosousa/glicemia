# Glicemia

App web para acompanhamento de glicemia, insulina e histórico — uso pessoal e familiar, sem custo de assinatura.

Documento de definição do produto (o porquê de cada decisão): [PROJECT.md](./PROJECT.md).

## Stack

- [Next.js](https://nextjs.org) + React + TypeScript
- [Tailwind CSS](https://tailwindcss.com)
- [Recharts](https://recharts.org)
- [Supabase](https://supabase.com) (banco de dados, autenticação, regras de permissão)

## Rodando localmente

```bash
npm install
npm run dev
```

Precisa de um arquivo `.env.local` com as chaves do Supabase — veja `.env.local.example`.

## Banco de dados

O schema (tabelas e regras de permissão) fica em `supabase/migrations/`, em ordem. Aplicar cada arquivo no SQL Editor do painel do Supabase, na ordem numérica.
