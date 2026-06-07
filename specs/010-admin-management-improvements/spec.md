# Feature Specification: Admin Management Improvements

**Feature Branch**: `010-admin-management-improvements`  
**Created**: 2026-06-07  
**Status**: Implemented  
**Input**: User description:
1. vamos disponibilizar a ele a opção de troca de senha do usuario, fazendo o usuario trocar a senha assim que logar com a senha nova.
2. oferecer ao admin a possibilidade de apagar/ editar bancas, assuntos e disciplinas.
3. Na moderação de questões, ele poder ordenar os itens clicando no nome da coluna ,
4. Na moderação de questões exibir somente as 30 primeiras, ordenadas por data/hora de inclusão.
5. Na moderação de questões exibir filtros no e campo de pesquisa, iniciando a busca somente quando clicar em buscar.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Force User Password Change (Priority: P1)
Como administrador do sistema, quero ter a capacidade de resetar a senha de um usuário e exigir que ele altere essa senha temporária no primeiro login, para garantir a segurança da conta.

**Why this priority**: Crucial security and administration workflow to recover compromised accounts or assist users who lost access.

**Independent Test**:
1. O administrador acessa a página de gerenciamento de usuários, seleciona um usuário e define uma nova senha temporária.
2. O usuário tenta fazer o login com a nova senha.
3. O sistema detecta que a senha foi alterada pelo administrador, bloqueia o acesso à plataforma e exibe uma tela obrigatória de troca de senha.
4. O usuário define uma nova senha e é redirecionado ao feed. Tentativas de navegar para outras rotas antes de alterar a senha são bloqueadas.

**Acceptance Scenarios**:
1. **Given** um administrador logado na rota `/admin/users`, **When** ele clica em "Alterar Senha" de um usuário, preenche a nova senha e confirma, **Then** a senha é atualizada e a flag `force_password_change` do usuário é definida como `true`.
2. **Given** um usuário com `force_password_change` igual a `true`, **When** ele realiza o login com sucesso, **Then** ele é imediatamente redirecionado para `/completar-cadastro` ou uma rota específica `/alterar-senha` para definir uma senha definitiva.
3. **Given** um usuário que precisa alterar a senha obrigatoriamente, **When** ele tenta navegar diretamente para `/feed` ou `/favorites` via URL, **Then** ele é redirecionado de volta para a tela de alteração de senha obrigatória.
4. **Given** o usuário preenche a nova senha de forma válida na tela obrigatória e clica em salvar, **Then** a senha é alterada no Supabase Auth, a flag `force_password_change` é definida como `false` e ele é liberado para acessar o feed de estudos.

---

### User Story 2 - Catalog Management (Edit/Delete Classifications) (Priority: P1)
Como administrador do sistema, quero editar ou excluir disciplinas, assuntos e bancas do catálogo de classificação, para poder corrigir erros de cadastro ou manter a base de dados organizada.

**Why this priority**: Essencial para a integridade dos dados e organização do catálogo de questões.

**Independent Test**:
Acessar o painel do administrador ou catálogo e editar/excluir registros de disciplinas, assuntos ou bancas, verificando que as alterações persistem no banco de dados e que a integridade referencial impede a exclusão de classificações em uso.

**Acceptance Scenarios**:
1. **Given** um administrador no painel de catálogos, **When** ele edita o nome ou detalhes de uma disciplina, assunto ou banca e salva, **Then** os dados são atualizados no banco de dados e refletidos imediatamente nas questões associadas.
2. **Given** uma disciplina, assunto ou banca que **não está associada** a nenhuma questão ativa, **When** o admin clica em excluir e confirma, **Then** o registro é apagado do banco de dados com sucesso.
3. **Given** uma disciplina, assunto ou banca que **está associada** a uma ou mais questões, **When** o admin tenta excluir, **Then** o sistema bloqueia a exclusão e exibe uma mensagem clara de erro alertando que o registro está em uso por questões.

---

### User Story 3 - Sort Questions in Moderation Table (Priority: P2)
Como administrador moderando questões, quero poder ordenar a lista de questões clicando nos cabeçalhos das colunas, para localizar questões específicas com facilidade.

**Why this priority**: Facilita a auditoria de questões e agiliza a moderação diária.

**Independent Test**:
Acessar `/admin/questions` e clicar nos cabeçalhos das colunas da tabela de moderação, verificando que as linhas são ordenadas de acordo com o critério escolhido.

**Acceptance Scenarios**:
1. **Given** a tabela de moderação de questões, **When** o administrador clica no cabeçalho de uma coluna (ex: "Data", "Status", "Banca", "Subject"), **Then** a lista de questões é reordenada de forma ascendente com base naquela coluna.
2. **Given** a tabela já ordenada de forma ascendente por uma coluna, **When** o admin clica novamente na mesma coluna, **Then** a ordenação é alternada para decrescente.

---

### User Story 4 - Limit Question Moderation List to 30 Items (Priority: P2)
Como administrador moderando questões, quero que a lista inicial carregue apenas as 30 primeiras questões ordenadas por data de inclusão, para otimizar o tempo de carregamento da página.

**Why this priority**: Melhora o desempenho do carregamento do painel administrativo evitando carregar centenas de registros de uma vez.

**Independent Test**:
Acessar `/admin/questions` e verificar que, sem filtros aplicados, o número máximo de registros listados é de 30 e eles estão ordenados pela data de inclusão decrescente.

**Acceptance Scenarios**:
1. **Given** o painel de moderação sem filtros aplicados, **When** a página carrega, **Then** a consulta ao banco traz no máximo 30 registros ordenados por data de criação (`created_at DESC`).

---

### User Story 5 - Explicit Filter Submission in Question Moderation (Priority: P2)
Como administrador, quero preencher os filtros de pesquisa na moderação de questões e iniciar a busca somente ao clicar no botão "Buscar", para evitar requisições desnecessárias e lentidão no banco de dados enquanto digito.

**Why this priority**: Evita múltiplas chamadas à API enquanto o usuário digita nos campos de busca.

**Independent Test**:
Acessar `/admin/questions`, alterar o campo de pesquisa ou selecionar filtros nos seletores, verificar que a tabela de questões não se altera até que o botão "Buscar" seja clicado.

**Acceptance Scenarios**:
1. **Given** o painel de moderação, **When** o administrador seleciona uma disciplina no filtro ou digita um termo no campo de pesquisa, **Then** a lista de questões permanece inalterada e nenhuma chamada de busca é feita imediatamente.
2. **Given** os filtros modificados no painel, **When** o administrador clica no botão "Buscar", **Then** a tabela é atualizada exibindo os resultados que correspondem aos critérios selecionados.

---

## Edge Cases

- **Troca de Senha Obrigatória no Login via Redes Sociais (OAuth)**: A flag `force_password_change` continua obrigatória independentemente do método de login. Permitir que OAuth ignore a flag criaria um caminho de bypass do bloqueio definido pelo administrador.
- **Exclusão em Cascata**: Tentar excluir um assunto que possui tópicos filhos ou disciplinas que possuem assuntos associados. O sistema deve impedir a exclusão em cascata não planejada e notificar o usuário sobre os elementos dependentes.
- **Navegação Interrompida**: Se o usuário forçar a saída da tela obrigatória de troca de senha fechando a guia ou alterando a URL, ele deve continuar bloqueado no próximo acesso até concluir a troca de senha.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir que administradores alterem a senha de qualquer conta de usuário através da área administrativa de usuários.
- **FR-002**: O sistema MUST armazenar e persistir o estado de troca obrigatória de senha no perfil do usuário (`profiles.force_password_change`).
- **FR-003**: O sistema MUST bloquear o acesso de qualquer usuário com `force_password_change` ativo a qualquer rota de estudante/autor/admin (exceto a rota de login e de alteração de senha).
- **FR-004**: O sistema MUST fornecer uma interface de alteração de senha obrigatória que valida a nova senha antes de salvá-la no Supabase Auth.
- **FR-005**: O sistema MUST permitir a edição de nomes e metadados de disciplinas, assuntos e bancas na interface administrativa.
- **FR-006**: O sistema MUST permitir a exclusão de disciplinas, assuntos e bancas, validando no servidor se não há dependências ativas (questões, assuntos ou tópicos filhos associados).
- **FR-007**: O sistema MUST bloquear exclusões de classificações em uso e retornar mensagens de erro informativas para o administrador.
- **FR-008**: O sistema MUST disponibilizar ordenação interativa de colunas na tabela de moderação administrativa.
- **FR-009**: O sistema MUST limitar a listagem de moderação padrão a 30 itens ordenados por `created_at DESC`.
- **FR-010**: O sistema MUST reter as alterações de pesquisa e filtro localmente e disparar a consulta à API somente ao acionar o botão de submit do filtro ("Buscar").

### Key Entities

- **Profile**: Adicionar o atributo `force_password_change` (boolean, default false).
- **Discipline/Subject/Board**: Devem suportar operações de escrita (update, delete) controladas por políticas do Supabase que restringem acesso a administradores (`role = admin`).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos usuários com a flag `force_password_change` ativa são bloqueados de acessar o feed de estudos e redirecionados para a tela de alteração de senha.
- **SC-002**: A exclusão de uma disciplina em uso falha no servidor com 100% de consistência, impedindo órfãos no banco de dados.
- **SC-003**: O carregamento inicial da página de moderação de questões consome menos recursos no banco de dados limitando-se estritamente a 30 linhas por padrão.
- **SC-004**: Nenhuma requisição de pesquisa é feita no input de busca de questões até que o botão "Buscar" seja acionado.

---

## Assumptions

- O Supabase Auth e o gatilho de sincronização de perfis serão estendidos para gerenciar a flag `force_password_change` de forma segura.
- A exclusão de disciplinas e assuntos é uma ação irreversível, exigindo confirmação modal da parte do administrador.
