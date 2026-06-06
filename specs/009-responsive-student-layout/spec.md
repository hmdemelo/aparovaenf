# Feature Specification: Layout Responsivo do Aluno

**Feature Branch**: `009-responsive-student-layout`
**Created**: 2026-06-06
**Status**: Implemented
**Input**: Descrição do usuário: "Verifique a documentação de layout e design da aplicação. Nela deve prever a responsividade das janelas. No caso do aluno, se ele estiver no pc ou tablet, a tela deve preencher o espaço disponível do navegador e o menu deve aparecer na esquerda e ser retrátil assim como o menu das contas admin e autor. Caso ele esteja no celular, o menu ficará em cima."

---

## Clarifications

- **PC ou Tablet (Desktop/Tablet, viewport >= 768px)**:
  - O layout do estudante ocupará todo o espaço útil do navegador (`100vw` e `100vh` ou `100dvh`), sem moldura bege, margens externas ou bordas arredondadas que limitem o contêiner principal (diferente da classe `.aprova-admin-shell` que tem margem de 35px e largura máxima de 980px).
  - Um menu lateral fixo (Sidebar) na esquerda, que pode ser expandido (`200px`) ou recolhido/retrátil (`72px`).
  - O estado recolhido da Sidebar deve ser salvo no `localStorage` sob a chave `aprovaenf:student-sidebar-collapsed` para persistir entre recarregamentos.
  - A área de conteúdo à direita deve ocupar o espaço restante (`flex-1`), com rolagem vertical independente e fundo transparente/gradiente padrão do site.
- **Celular (Mobile, viewport < 768px)**:
  - O menu de navegação ficará no topo (Header). O Header conterá a logo, os links de navegação ("Estudo", "Favoritos", "Erros", "Conta" ou botão de logout/perfil) e o badge de status "Trial/PRO".
  - O menu de abas inferior (bottom nav bar) será removido ou desativado para concentrar a navegação na parte superior.
  - A rolagem vertical será a rolagem natural da janela do navegador.

---

## User Scenarios & Testing

### User Story 1 - Acesso via PC ou Tablet (P1)
Como estudante acessando a plataforma por um computador ou tablet, quero que a interface aproveite todo o tamanho do meu navegador e exiba um menu lateral retrátil na esquerda, para que eu tenha uma visão ampla e organizada do conteúdo.

**Independent Test**:
Acessar `/feed?career=enfermeiro-a` em um navegador com largura de tela de `1024px`. Verificar que o layout preenche a tela inteira (sem molduras ou margens de 35px), que o menu aparece na esquerda com os links de navegação e que é possível expandi-lo/recolhê-lo salvando o estado no navegador.

**Acceptance Scenarios**:
1. **Given** um estudante autenticado em tela >= 768px, **When** qualquer página de estudante é renderizada (`/feed`, `/favorites`, `/errors`, `/history`), **Then** o contêiner principal ocupa toda a largura (`100%`) e altura (`100vh`) do navegador.
2. **Given** a Sidebar na esquerda, **When** o estudante clica no botão de recolher barra, **Then** a largura é reduzida para `72px` e os textos dos itens de menu são ocultados.
3. **Given** a Sidebar na esquerda, **When** o estudante clica no botão de expandir barra, **Then** a largura é restaurada para `200px` e os textos dos itens de menu voltam a aparecer.
4. **Given** a barra está no estado recolhido ou expandido, **When** a página é atualizada, **Then** o estado correspondente é recuperado do `localStorage`.
5. **Given** o layout de desktop, **When** o estudante rola a página, **Then** apenas o painel de conteúdo da direita rola verticalmente, mantendo a Sidebar fixa.

---

### User Story 2 - Acesso via Celular (P1)
Como estudante acessando a plataforma por um smartphone, quero que o menu de navegação fique posicionado no topo da tela, para liberar o espaço de leitura das questões.

**Independent Test**:
Acessar `/feed?career=enfermeiro-a` em um navegador com largura de tela simulada de `375px`. Verificar que o menu lateral não é renderizado, que o menu de navegação com os links "Estudo", "Favoritos", "Erros" e "Conta" aparece no cabeçalho superior (Header) e que o menu de abas inferior foi desativado.

**Acceptance Scenarios**:
1. **Given** um estudante autenticado em tela < 768px, **When** a página do estudante é renderizada, **Then** o cabeçalho superior exibe a logo do aprovaenf e os links "Estudo", "Favoritos", "Erros", "Conta" alinhados no topo.
2. **Given** um dispositivo móvel, **When** a página é exibida, **Then** não deve aparecer nenhuma barra de navegação flutuante ou fixa no rodapé (bottom nav).

---

## Technical Scope

### Componentes de UI
1. **StudentSidebar (Novo)**: Componente do lado do cliente (`components/student-sidebar.tsx`) que renderiza a barra lateral retrátil para PC/tablet.
2. **StudentLayoutShell (Novo)**: Componente wrapper principal do estudante que decide de forma responsiva entre renderizar a Sidebar ou o Header móvel.
3. **AppRouter Layout (`app/(student)/layout.tsx`)**: Arquivo de layout que envolve todas as rotas do estudante e injeta o `StudentLayoutShell` para unificar a estrutura visual.

### Arquivos afetados
- `app/(student)/layout.tsx` (Criação do layout unificado do estudante)
- `components/student-sidebar.tsx` (Criação do componente de Sidebar do aluno)
- `features/student-feed/feed-shell.tsx` (Refatoração para remover cabeçalho próprio e bottom nav, adaptando-se para preencher o contêiner)
- `app/(student)/favorites/page.tsx` (Remoção de cabeçalhos/rodapés redundantes)
- `app/(student)/errors/page.tsx` (Remoção de cabeçalhos/rodapés redundantes)
- `app/(student)/history/page.tsx` (Remoção de cabeçalhos/rodapés redundantes)
- `app/(student)/assinar/page.tsx` (Remoção de cabeçalhos/rodapés redundantes)
