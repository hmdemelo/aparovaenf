# Technical Implementation Plan: Layout Responsivo do Aluno

**Branch**: `009-responsive-student-layout` | **Date**: 2026-06-06 | **Spec**: [spec.md](./spec.md)

## Summary

O objetivo é padronizar a responsividade das telas de alunos para preencher o espaço do navegador em PCs e tablets, oferecendo um menu lateral retrátil semelhante ao de administradores e autores, enquanto mantém o menu de navegação no topo em dispositivos móveis.

Para isso, centralizaremos a estrutura em um layout de rotas em `app/(student)/layout.tsx` que agrupa e gerencia a navegação de forma responsiva. Os cabeçalhos e menus inferiores redundantes nos componentes individuais das páginas serão removidos.

---

## Technical Context

- **Framework**: Next.js 16 (App Router), React 19.
- **Styling**: Tailwind CSS 4, CSS custom properties.
- **Components**: Lucide Icons, Client-side storage synchronizer (`useSyncExternalStore`).

---

## Constitution Check

- **Mobile-First Learning Value — PASS**: O fluxo de estudos do aluno continua focado e responsivo. Em celulares, o menu superior mantém a marca e fornece acesso rápido aos favoritos, erros e conta sem poluição na parte inferior da tela.
- **Secure Data Boundaries — PASS**: A validação de cargo (role === student), pendência de cadastro, trial e assinaturas continuam sendo feitas no nível do servidor (Server Components) nas páginas e rotas de API.
- **Test-First Delivery — PASS**: A refatoração do layout não deve afetar a lógica de negócio do trial, submissão de respostas ou favoritos. Rodaremos todos os testes automatizados da aplicação para garantir que nenhuma regressão foi introduzida.
- **Simple Modular Architecture — PASS**: Reutilizamos os padrões de layout existentes (`aprova-sidebar`, `useSyncExternalStore` para persistência local) aplicados de forma consistente com o padrão do Next.js.

---

## Proposed Changes

### Componentes de Layout e Navegação

#### [NEW] [student-sidebar.tsx](file:///Users/hugo/projetos/aprovaenf/components/student-sidebar.tsx)
- Sidebar vertical na esquerda para telas >= 768px (`md`).
- Controlada por um botão de expandir/recolher que altera a largura de `200px` para `72px`.
- Persiste o estado recolhido em `localStorage` sob a chave `aprovaenf:student-sidebar-collapsed`.
- Links de navegação:
  - **Estudo** (`BookOpen`): Redireciona para `/feed?career={slug}`.
  - **Favoritos** (`Heart`): Redireciona para `/favorites`.
  - **Erros** (`History`): Redireciona para `/errors`.
  - **Histórico** (`History` / `CheckSquare`): Redireciona para `/history`.
- No rodapé:
  - Botão de Perfil (`AccountDialog` com dados do aluno).
  - Botão de Sair (`LogoutButton`).

#### [NEW] [student-layout.tsx](file:///Users/hugo/projetos/aprovaenf/components/student-layout.tsx)
- Componente do lado do cliente (`'use client'`) que recebe o `account` e o `activeCareerSlug` e monta a estrutura responsiva.
- **Telas >= 768px (Desktop/Tablet)**:
  - Layout flexível de tela cheia: `w-screen h-screen flex overflow-hidden bg-background`.
  - Sidebar esquerda fixa.
  - Painel de conteúdo na direita (`flex-1 h-full overflow-y-auto px-6 py-8 md:px-10`).
- **Telas < 768px (Mobile/Celular)**:
  - O cabeçalho superior (Header) fixo/sticky contendo:
    - Logo do aprovaenf.
    - Links horizontais de navegação: Estudo, Favoritos, Erros, Conta.
    - Badge PRO/Trial.
  - Área de conteúdo abaixo do cabeçalho com rolagem natural do navegador.
  - Remove o menu de navegação inferior (bottom nav).

#### [NEW] [layout.tsx](file:///Users/hugo/projetos/aprovaenf/app/(student)/layout.tsx)
- Server-side layout para a rota agrupada `(student)`.
- Valida o estado do usuário com `getCurrentUser()`. Redireciona se não autenticado.
- Carrega as informações necessárias:
  - Perfil do aluno através de `loadAccountProfile(db, user.id)`.
  - Assinatura ativa via `isSubscriber()`.
  - Cookie de carreira ativa (`selected_career` ou default `getLaunchCareerSlug()`).
- Renderiza o `StudentLayout` passando as propriedades.

---

### Refatorações de Páginas

#### [MODIFY] [feed-shell.tsx](file:///Users/hugo/projetos/aprovaenf/features/student-feed/feed-shell.tsx)
- Remover a tag `<header>` superior e a tag `<nav>` inferior (bottom nav) de dentro do componente, já que o layout global lidará com a navegação.
- Remover a limitação de largura de tela (`max-w-[430px]`) do contêiner principal nas visualizações desktop. Em vez disso, usar classes responsivas como `max-w-xl mx-auto` para manter a legibilidade focada do feed (não esticar o texto em telas gigantes) sem forçar margens de janela externa.
- Se o usuário estiver na visualização móvel no feed, exibir a barra de progresso visual abaixo do cabeçalho da página ou incorporada no próprio feed-shell.

#### [MODIFY] [favorites/page.tsx](file:///Users/hugo/projetos/aprovaenf/app/(student)/favorites/page.tsx)
- Remover o cabeçalho redundante com a logo `AprovaenfLogo` e o link de voltar ao início.
- Adaptar o layout de contêiner de `max-w-xl` para renderizar diretamente dentro do painel de conteúdo do layout do aluno.

#### [MODIFY] [errors/page.tsx](file:///Users/hugo/projetos/aprovaenf/app/(student)/errors/page.tsx)
- Remover cabeçalho redundante com a logo `AprovaenfLogo` e o link de voltar ao início.
- Integrar perfeitamente no novo layout de painel.

#### [MODIFY] [history/page.tsx](file:///Users/hugo/projetos/aprovaenf/app/(student)/history/page.tsx)
- Remover cabeçalho redundante com a logo `AprovaenfLogo` e o link de voltar ao início.
- Integrar no novo layout de painel.

#### [MODIFY] [assinar/page.tsx](file:///Users/hugo/projetos/aprovaenf/app/(student)/assinar/page.tsx)
- Remover cabeçalho redundante com a logo `AprovaenfLogo`.
- Integrar no novo layout de painel.

---

## Verification Plan

### Automated Tests
- Rodar o test suite existente para garantir que as rotas e regras de negócio não quebraram:
  - `npm run test:unit`
  - `npm run test:integration`
  - `npx playwright test` (se existirem testes E2E correspondentes)
- Executar `npm run build` para garantir validação estática e compilação do Next.js sem erros de tipos ou lint.

### Manual Verification
- Testar no navegador com redimensionamento de janela:
  - **Celular (< 768px)**: Verificar que o menu de navegação está no topo, que a marca do aprovaenf é exibida e que a barra de abas inferior sumiu.
  - **Tablet/PC (>= 768px)**: Verificar que o layout preenche a tela inteira (tela cheia), que a barra lateral esquerda aparece fixa e permite expandir/recolher. O conteúdo deve rolar no painel da direita sem mover a barra lateral.
  - Verificar que o estado recolhido do menu lateral é persistido após recarregar a página (F5).
