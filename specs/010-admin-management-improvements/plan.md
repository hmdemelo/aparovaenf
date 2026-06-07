# Technical Implementation Plan: Admin Management Improvements

**Branch**: `010-admin-management-improvements` | **Date**: 2026-06-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-admin-management-improvements/spec.md`

## Summary

Esta feature adiciona melhorias de gestão para administradores no portal `/admin`:
1. Opção para alterar senha de usuários, definindo uma flag `force_password_change` no perfil. Quando o usuário fizer login, ele será obrigado a alterar sua senha na primeira oportunidade.
2. Interface administrativa e serviços para editar/excluir disciplinas (`subjects`), assuntos (`tags`) e bancas (`boards`), garantindo integridade de dados (não permitir exclusão de classificações em uso).
3. Habilidade de ordenação interativa de colunas na moderação de questões.
4. Limitação e otimização inicial da moderação de questões para exibir os 30 registros mais recentes por padrão.
5. Otimização de filtros na moderação, disparando consultas apenas quando o botão "Buscar" for clicado.

---

## Technical Context

**Language/Version**: TypeScript / Node.js 20 / React 19 / Next.js 16  
**Primary Dependencies**: `@supabase/ssr`, `@supabase/supabase-js`, `lucide-react`  
**Storage**: PostgreSQL (Supabase)  
**Testing**: Vitest (unit/integration), Playwright (E2E)  
**Target Platform**: Vercel  
**Project Type**: Web Application  
**Performance Goals**: Listagem de moderação carrega apenas 30 itens por padrão; buscas e filtros não geram requisições automáticas ao digitar.  
**Constraints**: Validação rígida no servidor de cargos (`is_admin()`), proteção RLS de tabelas no Supabase.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Mobile-First Learning Value — PASS**: O fluxo de estudos do aluno não é alterado, com exceção da interceptação obrigatória de troca de senha no login (quando solicitado pelo admin).
- **Secure Data Boundaries — PASS**: A troca de senhas pelo admin utiliza o Supabase Auth Admin API (Client com `SERVICE_ROLE_KEY`) executado exclusivamente no servidor (Server Action / Rota de API). A flag `force_password_change` é protegida e alterada via RLS permitindo escrita apenas por administradores ou via serviço.
- **Test-First Delivery — PASS**: Implementaremos testes unitários para o fluxo de alteração de senha e exclusão de classificações, e testes E2E com Playwright cobrindo o bloqueio do login e a exclusão/edição no painel.
- **Simple Modular Architecture — PASS**: Reutilizamos os padrões de páginas e serviços do Next.js 16 e do Supabase já existentes.

---

## Project Structure

### Documentation (this feature)

```text
specs/010-admin-management-improvements/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (tasks checklist)
```

### Source Code (repository root)

```text
app/
├── (admin)/
│   └── admin/
│       ├── users/
│       │   └── page.tsx         # User management page updates (add change password dialog)
│       └── questions/
│           └── page.tsx         # Moderation list updates (add sort, filter click, 30 limit)
├── (student)/
│   └── layout.tsx               # Intercept force_password_change for student layout
├── (author)/
│   └── layout.tsx               # Intercept force_password_change for author layout
├── (public)/
│   └── force-password/          # New page for mandatory password change
│       └── page.tsx
features/
├── admin/
│   ├── admin-service.ts         # User management backend, add edit/delete classification APIs
│   ├── subject-service.ts       # Service methods for editing/deleting subjects, tags, boards
│   └── create-subject-form.tsx  # Update form or add admin edit/delete components
└── auth/
    └── force-password-guard.ts  # Guard helper to check profiles.force_password_change
```

**Structure Decision**: Monolito Next.js integrado com a estrutura App Router em `app/` e módulos de negócio em `features/`.

---

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Não há violações identificadas.
