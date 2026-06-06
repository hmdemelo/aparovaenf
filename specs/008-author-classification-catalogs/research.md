# Research: Catálogos de Classificação para Autores

## Decision 1: Reutilizar os catálogos existentes

**Decision**: `subjects` permanece como Disciplina, `tags` passa a ser exibida
como Assunto e `boards` permanece como Banca.

**Rationale**: Questões, filtros, importação e editor já dependem dessas tabelas.
Criar novos catálogos exigiria sincronização, migração de associações e regras
duplicadas.

**Alternatives considered**:

- Criar tabelas novas para mentor: rejeitado porque fragmentaria a taxonomia.
- Manter assunto como texto livre: rejeitado porque não permite paginação,
  autoria confiável nem vínculo com disciplina.

## Decision 2: Catálogos globais com autoria, não catálogos privados

**Decision**: Todos os autores veem os mesmos registros. Cada novo item guarda
o tipo de origem e, para autores, `created_by_author_id`. O UUID privado do
usuário autenticado fica somente no evento operacional protegido.

**Rationale**: O pedido exige que um mentor veja o que foi cadastrado pelos
demais. Um catálogo único reduz duplicação e melhora a consistência dos filtros.

**Alternatives considered**:

- Catálogo privado por autor: rejeitado por impedir reutilização.
- Copiar registros entre autores: rejeitado por criar divergência e manutenção
  desnecessária.
- Guardar `auth.users.id` diretamente no catálogo: rejeitado porque as tabelas
  de referência possuem leitura pública e exporiam identificadores privados.

## Decision 3: Assunto vinculado à disciplina

**Decision**: Adicionar `subject_id` aos registros de assunto (`tags`). Novos
assuntos exigem disciplina; registros legados podem permanecer temporariamente
sem vínculo até serem revisados.

**Rationale**: O vínculo evita sugestões irrelevantes e permite limpar assuntos
incompatíveis quando a disciplina da questão muda.

**Alternatives considered**:

- Assunto global sem disciplina: rejeitado por não representar a hierarquia
  solicitada.
- Apenas um assunto por questão: rejeitado porque o modelo atual já suporta
  múltiplas tags e questões podem abranger mais de um tópico.

## Decision 4: Persistir assuntos por UUID

**Decision**: Substituir o payload de nomes livres por `topic_ids`.

**Rationale**: A criação implícita com `upsert` mistura seleção e cadastro,
dificulta atribuir autoria e pode atualizar registros de outros autores. UUIDs
permitem validação de existência e pertencimento à disciplina.

**Alternatives considered**:

- Continuar enviando nomes: rejeitado por manter ambiguidade e duplicações.
- Enviar nome e UUID: rejeitado por criar duas fontes de verdade.

## Decision 5: Paginação no servidor

**Decision**: GETs recebem `q`, `page`, `page_size` e filtros hierárquicos. O
servidor usa `range()` com contagem exata e ordenação determinística por nome e
identificador.

**Rationale**: O requisito limita a página e prevê crescimento do catálogo. A
paginação no cliente carregaria dados desnecessários e perderia consistência em
catálogos maiores.

**Alternatives considered**:

- Carregar tudo e paginar no navegador: rejeitado pelo crescimento esperado.
- Cursor pagination: rejeitado porque a interface exige números de página e o
  volume inicial é compatível com offset pagination.

## Decision 6: Pesquisa pelo slug normalizado

**Decision**: Normalizar a consulta com `slugify()` e pesquisar o campo `slug`,
com índice trigram para correspondência parcial.

**Rationale**: Slugs já removem acentos e diferenças de capitalização. A mesma
normalização no cadastro e na consulta oferece comportamento previsível.

**Alternatives considered**:

- `ILIKE` apenas no nome: rejeitado por não ignorar acentos.
- Serviço externo de busca: rejeitado pela escala e pela constituição.
- Campo normalizado adicional: possível, mas redundante enquanto `slug` já
  representa a identidade normalizada.

## Decision 7: Concorrência resolvida pelo banco

**Decision**: As restrições únicas permanecem a fonte de verdade. Em violação
`23505`, o serviço busca e retorna o registro existente com resposta de
conflito selecionável.

**Rationale**: Verificar existência antes do insert não impede duas requisições
simultâneas de criarem duplicados.

**Alternatives considered**:

- Somente verificação prévia: rejeitada por race condition.
- Lock explícito: rejeitado como complexidade desnecessária.

## Decision 8: Modal único com três abas

**Decision**: Um componente modal compartilhado possui abas Disciplina,
Assunto e Banca. O editor pode abri-lo já na aba relacionada ao campo acionado.

**Rationale**: Mantém o autor na questão, centraliza busca/paginação e evita três
modais quase idênticos.

**Alternatives considered**:

- Página independente: adiada porque interrompe o fluxo de publicação.
- Combobox com cadastro inline para cada campo: rejeitado porque não comporta
  autoria, paginação e visão global de forma clara.

## Decision 9: Sem edição ou exclusão na primeira entrega

**Decision**: Autores podem consultar e criar; correções, desativação, exclusão e
fusão permanecem administrativas e fora desta feature.

**Rationale**: Alterar um catálogo global pode afetar questões de outros autores
e requer regras de governança adicionais.

**Alternatives considered**:

- Autor editar qualquer registro: rejeitado por risco de impacto cruzado.
- Autor editar somente o próprio registro: adiado porque registros já associados
  continuam afetando conteúdo compartilhado.

## Decision 10: Migração em duas etapas

**Decision**: A primeira migration adiciona campos, políticas e índices, além
de classificar apenas tags vinculadas a uma única disciplina, preservando
temporariamente a unicidade global de `tags.slug`. Depois que o editor baseado
em IDs estiver implantado, uma segunda migration divide tags usadas em várias
disciplinas e troca a unicidade para `(subject_id, slug)`.

**Rationale**: O código atual usa `upsert(..., { onConflict: 'slug' })`. Remover
a restrição global antes do deploy do novo editor faria salvamentos existentes
falharem. A sequência aditiva mantém compatibilidade.

**Alternatives considered**:

- Remover a restrição no primeiro push: rejeitado por risco de indisponibilidade
  no editor atual.
- Manter unicidade global permanentemente: rejeitado porque o mesmo assunto pode
  existir em disciplinas diferentes.
- Alterar banco e aplicação em uma única etapa sem compatibilidade: rejeitado
  porque o projeto não possui um Supabase de staging isolado.
