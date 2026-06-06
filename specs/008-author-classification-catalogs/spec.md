# Feature Specification: Catálogos de Classificação para Autores

**Feature Branch**: `008-author-classification-catalogs`  
**Created**: 2026-06-05  
**Status**: Planned  
**Input**: User description: "Disponibilizar aos mentores um modal para cadastrar e consultar disciplinas, assuntos e bancas durante a classificação e publicação de questões, exibindo os registros criados por todos os autores, com pesquisa e paginação."

## Clarifications

### Session 2026-06-05

- Q: Os cadastros pertencem a cada autor ou formam um catálogo compartilhado? → A: Formam catálogos globais compartilhados; a autoria do cadastro é mantida para identificação e auditoria.
- Q: O que representa "assunto" no modelo atual? → A: É o nome canônico das atuais tags/subassuntos e pode ser associado a uma disciplina.
- Q: Quais operações entram na primeira entrega? → A: Cadastro, consulta, pesquisa, paginação e seleção; edição, exclusão e fusão de duplicados ficam fora do escopo.

## User Scenarios & Testing

### User Story 1 - Encontrar e selecionar uma classificação existente (Priority: P1)

Como autor, quero abrir um gerenciador de classificações enquanto preparo uma
questão, pesquisar disciplinas, assuntos e bancas já cadastrados e selecionar o
registro adequado, para conseguir completar a classificação exigida antes da
publicação.

**Why this priority**: A ausência de uma disciplina selecionável bloqueia a
publicação de rascunhos importados e de novas questões.

**Independent Test**: Um autor abre o gerenciador a partir do editor de questão,
pesquisa uma disciplina existente, seleciona o resultado e retorna ao editor com
a disciplina aplicada à questão.

**Acceptance Scenarios**:

1. **Given** um autor autenticado está editando uma questão, **When** abre o gerenciador de classificações, **Then** encontra áreas separadas para disciplinas, assuntos e bancas.
2. **Given** existem registros criados por diferentes autores, **When** o gerenciador é aberto, **Then** todos os registros globais compatíveis com a área selecionada podem ser consultados.
3. **Given** o autor pesquisa parte de um nome sem respeitar maiúsculas ou acentos, **When** a pesquisa é executada, **Then** a lista mostra somente registros correspondentes.
4. **Given** o autor escolhe uma disciplina ou banca, **When** confirma a seleção, **Then** o editor recebe o registro escolhido sem perder os demais dados da questão.
5. **Given** o autor escolhe um assunto, **When** confirma a seleção, **Then** o assunto é incluído entre os assuntos associados à questão sem remover seleções anteriores.

---

### User Story 2 - Cadastrar uma classificação ausente (Priority: P1)

Como autor, quero cadastrar uma disciplina, assunto ou banca que ainda não
existe, para classificar corretamente a questão sem depender de uma intervenção
administrativa.

**Why this priority**: Consultar o catálogo não resolve o bloqueio quando a
classificação necessária ainda não foi criada.

**Independent Test**: Um autor pesquisa uma banca inexistente, inicia o cadastro,
informa os dados obrigatórios e vê o novo registro disponível na lista global e
selecionável no editor.

**Acceptance Scenarios**:

1. **Given** não existe uma classificação com o nome pesquisado, **When** o autor inicia um cadastro, **Then** o formulário apropriado à área selecionada é exibido.
2. **Given** o autor cadastra uma disciplina, **When** envia dados válidos, **Then** deve informar também a carreira à qual a disciplina pertence.
3. **Given** o autor cadastra um assunto, **When** envia dados válidos, **Then** deve informar a disciplina à qual o assunto pertence.
4. **Given** o cadastro é concluído, **When** a lista é atualizada, **Then** o novo registro aparece identificado como criado pelo autor atual.
5. **Given** já existe um registro equivalente, **When** o autor tenta cadastrá-lo novamente, **Then** o sistema impede a duplicação e apresenta o registro existente para seleção.
6. **Given** ocorre uma falha durante o cadastro, **When** o sistema responde, **Then** o gerenciador mantém os dados digitados e apresenta uma mensagem segura e acionável.

---

### User Story 3 - Navegar por um catálogo extenso (Priority: P2)

Como autor, quero consultar listas paginadas com identificação de origem, para
localizar classificações em catálogos extensos sem sobrecarregar a tela.

**Why this priority**: O catálogo é compartilhado e crescerá conforme diferentes
autores adicionarem classificações.

**Independent Test**: Com mais registros do que o limite de uma página, o autor
navega pelas páginas numeradas e verifica que a pesquisa reinicia na primeira
página e mantém o total correto.

**Acceptance Scenarios**:

1. **Given** a área selecionada possui mais de 20 registros, **When** o gerenciador é aberto, **Then** exibe no máximo 20 registros e controles de paginação.
2. **Given** existem várias páginas, **When** o autor escolhe um número de página, **Then** a lista exibe o conjunto correspondente sem fechar o gerenciador.
3. **Given** o autor está em uma página posterior, **When** altera a pesquisa ou a área do catálogo, **Then** a navegação retorna para a primeira página.
4. **Given** um registro foi criado por outro autor, **When** aparece na lista, **Then** a origem é exibida sem revelar dados privados além do nome público do autor.
5. **Given** um registro é anterior ao controle de autoria, **When** aparece na lista, **Then** sua origem é apresentada como "Sistema".

### Edge Cases

- O autor tenta abrir o gerenciador sem uma sessão válida ou sem perfil de autor.
- A pesquisa não retorna resultados.
- O nome informado contém apenas espaços, pontuação ou caracteres inválidos.
- Duas pessoas tentam cadastrar simultaneamente a mesma classificação.
- Uma disciplina é cadastrada com o mesmo nome em carreiras diferentes.
- Um assunto tem o mesmo nome em disciplinas diferentes.
- O registro selecionado é removido ou alterado por uma ação administrativa entre a abertura e a confirmação.
- O catálogo muda enquanto o autor navega entre páginas.
- O nome público do criador não está disponível.
- A tela é usada em um dispositivo móvel com teclado virtual aberto.

## Requirements

### Functional Requirements

- **FR-001**: O sistema MUST disponibilizar o gerenciador de classificações a todos os usuários autenticados com perfil de autor ou administrador.
- **FR-002**: O gerenciador MUST ser acessível a partir dos fluxos de criação, edição e preparação para publicação de uma questão.
- **FR-003**: O gerenciador MUST separar disciplinas, assuntos e bancas em áreas claramente identificadas.
- **FR-004**: Os catálogos MUST ser globais e compartilhados entre todos os autores e administradores.
- **FR-005**: Cada novo registro MUST armazenar o tipo de origem do cadastro e, quando criado por um autor, a referência ao perfil público correspondente.
- **FR-006**: Registros anteriores à introdução do controle de autoria MUST continuar disponíveis e ser identificados como criados pelo sistema.
- **FR-007**: A lista de cada área MUST exibir nome, contexto hierárquico aplicável e origem do cadastro.
- **FR-008**: O sistema MUST oferecer uma barra de pesquisa no topo do gerenciador.
- **FR-009**: A pesquisa MUST operar sobre a área selecionada e ignorar diferenças de maiúsculas, minúsculas e acentuação.
- **FR-010**: Cada página MUST exibir no máximo 20 registros.
- **FR-011**: A paginação MUST apresentar o total de resultados, a página atual, números de página aplicáveis e ações de página anterior e seguinte.
- **FR-012**: Alterar a pesquisa ou a área selecionada MUST retornar a listagem para a primeira página.
- **FR-013**: Um autor MUST poder cadastrar uma disciplina informando nome e carreira.
- **FR-014**: Um autor MUST poder cadastrar um assunto informando nome e disciplina.
- **FR-015**: Um autor MUST poder cadastrar uma banca informando seu nome.
- **FR-016**: O sistema MUST normalizar nomes para detectar equivalência sem depender de capitalização ou acentuação.
- **FR-017**: O sistema MUST impedir disciplinas duplicadas dentro da mesma carreira, assuntos duplicados dentro da mesma disciplina e bancas duplicadas globalmente.
- **FR-018**: Em caso de tentativa de duplicação, o sistema MUST retornar o registro já existente e permitir que o autor o selecione.
- **FR-019**: Um registro criado com sucesso MUST aparecer imediatamente na lista correspondente sem recarregar toda a página.
- **FR-020**: O autor MUST poder selecionar uma disciplina ou banca no gerenciador e aplicá-la ao editor da questão.
- **FR-021**: O autor MUST poder selecionar um ou mais assuntos no gerenciador e associá-los à questão.
- **FR-022**: A seleção de uma nova disciplina MUST remover da questão assuntos que não pertençam à nova disciplina, após confirmação explícita do autor.
- **FR-023**: A publicação da questão MUST continuar exigindo carreira, disciplina e dificuldade; banca e assuntos permanecem opcionais.
- **FR-024**: O sistema MUST validar autorização e dados de entrada no servidor para todas as operações de consulta e cadastro.
- **FR-025**: Mensagens exibidas ao usuário MUST ser seguras, em português e não revelar detalhes internos do banco de dados.
- **FR-026**: Cadastros e falhas de cadastro MUST produzir registros operacionais suficientes para identificar usuário, tipo de catálogo e resultado.
- **FR-027**: A interface MUST possuir estados de carregamento, vazio, erro, conflito e sucesso para pesquisa, paginação e cadastro.
- **FR-028**: O gerenciador MUST ser utilizável em telas móveis sem sobreposição de campos, lista, paginação ou teclado virtual.
- **FR-029**: Edição, exclusão, desativação e fusão de registros duplicados MUST permanecer fora do escopo desta entrega.
- **FR-030**: A terminologia da interface de autor MUST usar "Disciplina", "Assunto" e "Banca"; referências visíveis a "tag" ou "subassunto" MUST ser substituídas por "Assunto".

### Key Entities

- **Disciplina**: Classificação global vinculada a uma carreira. Possui nome, identidade normalizada, data de criação e origem do cadastro.
- **Assunto**: Classificação global vinculada a uma disciplina. Pode ser associada a múltiplas questões e possui nome, identidade normalizada, data de criação e origem do cadastro.
- **Banca**: Organização responsável por provas. É global, opcional na questão e possui nome, identidade normalizada, data de criação e origem do cadastro.
- **Origem do cadastro**: Tipo de criador (`autor`, `administração` ou `sistema`) e, quando aplicável, referência ao perfil público do autor. A identidade técnica do usuário permanece apenas no registro operacional protegido.
- **Seleção de classificação**: Relação temporária entre o gerenciador e o editor usada para aplicar disciplina, assuntos e banca à questão em edição.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Um autor consegue localizar e aplicar uma classificação existente à questão em até 30 segundos, partindo do editor.
- **SC-002**: Um autor consegue cadastrar e selecionar uma nova classificação em até 60 segundos, sem sair da questão em edição.
- **SC-003**: Pesquisas e mudanças de página exibem o resultado correspondente em até 1 segundo para catálogos com até 10.000 registros por tipo.
- **SC-004**: Nenhuma página do gerenciador exibe mais de 20 registros.
- **SC-005**: Tentativas simultâneas de cadastrar o mesmo item resultam em um único registro global e oferecem o registro existente aos participantes.
- **SC-006**: 100% das operações de cadastro rejeitadas apresentam mensagem em português sem detalhes internos de armazenamento.
- **SC-007**: Os fluxos principais de consulta, cadastro, conflito, seleção e publicação mantêm cobertura automatizada em testes unitários, de integração e ponta a ponta.
- **SC-008**: O gerenciador permanece utilizável sem rolagem horizontal em larguras de tela a partir de 320 pixels.

## Assumptions

- O termo de produto "mentor" corresponde ao perfil técnico e de interface atualmente denominado "autor".
- Carreiras continuam sendo administradas centralmente e não poderão ser criadas por autores nesta entrega.
- Disciplina corresponde ao catálogo atual de disciplinas vinculado à carreira.
- Assunto substitui a terminologia visível de tag/subassunto e será vinculado a uma disciplina.
- Uma questão pode ter uma disciplina e vários assuntos pertencentes a essa disciplina.
- Bancas continuam opcionais e compartilhadas globalmente.
- O nome público do autor é suficiente para identificar a origem de um cadastro; e-mail e outros dados privados não serão exibidos.
- Registros legados permanecem válidos mesmo sem identificação de criador.
- O gerenciador será um modal integrado ao editor, e não uma nova área autônoma de administração nesta primeira entrega.
- A implementação reutilizará autenticação, autorização e componentes visuais existentes.
