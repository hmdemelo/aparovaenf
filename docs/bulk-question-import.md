# Importacao em Massa de Questoes

> Funcionalidade admin para importar questoes em lote como rascunhos de um
> autor especifico.  
> Entrada principal da UI: `/admin/authors`, botao `Importar` ao lado de
> `Editar` em cada autor.

## Visao Geral

A importacao em massa permite que um admin envie um CSV de questoes para um
autor. Cada linha valida cria uma questao com status `draft`, associada ao
`author_id` selecionado. As questoes importadas nao entram no feed dos alunos e
nao sao publicadas automaticamente.

Depois da importacao, o autor acessa o fluxo existente em `/author/questions`
para editar, completar e publicar. As mesmas regras de publicacao continuam
valendo: comentario geral obrigatorio, alternativas validas e exatamente uma
alternativa correta antes de publicar.

## O Que Mudou Em Relacao Ao Documento Antigo

Este documento substitui o desenho anterior de importacao global em
`/admin/questions`.

O fluxo atual:

- usa Supabase, nao Prisma;
- aceita CSV, nao JSON;
- e exclusivo para admin;
- importa para um autor selecionado em `/admin/authors`;
- cria questoes `draft`, nao `PENDING`;
- nao cria fila global `APPROVED`/`REJECTED`;
- reaproveita o editor/publicador do autor como aprovacao.

## Arquivos Envolvidos

```text
features/admin/bulk-question-import-parser.ts
features/admin/bulk-question-import-service.ts
features/admin/bulk-question-import-dialog.tsx
features/admin/admin-authors-manager.tsx
app/api/admin/authors/[id]/questions/bulk-import/route.ts
app/api/admin/questions/bulk-template/route.ts
docs/template-importacao-questoes.csv
```

## Formato CSV

- Separador: ponto e virgula (`;`)
- Cabecalho obrigatorio na primeira linha
- Encoding esperado: UTF-8
- Limite: 500 linhas de dados por arquivo
- Tamanho maximo: 5 MB

Colunas principais:

| Coluna | Obrigatorio | Observacao |
| --- | --- | --- |
| `career` | Nao | Nome ou slug da carreira existente; tambem aceita o cabecalho `especialidade` |
| `subject` | Nao | Disciplina existente dentro da carreira |
| `difficulty` | Nao | `facil`, `media`, `dificil` |
| `statement` | Sim | Enunciado |
| `alt_a` | Sim | Alternativa A |
| `alt_b` | Sim | Alternativa B |
| `alt_c` | Nao | Alternativa C |
| `alt_d` | Nao | Alternativa D |
| `alt_e` | Nao | Alternativa E |
| `correct` | Nao | `A` a `E`; obrigatorio apenas para publicar depois |
| `general_comment` | Nao | Comentario geral; obrigatorio apenas para publicar depois |
| `source_type` | Nao | `autoral` por padrao ou `prova_oficial` |
| `board` | Nao | Banca existente |
| `source_orgao` | Nao | Orgao da prova oficial |
| `source_cargo` | Nao | Cargo da prova oficial |
| `source_year` | Nao | Inteiro entre 1900 e 2100 |
| `source_reference` | Nao | URL, fonte ou referencia |
| `comment_a` a `comment_e` | Nao | Comentarios por alternativa |

## Aliases Aceitos

O parser normaliza acentos, espacos, pontos, hifens e underscores antes de
comparar cabecalhos.

Aliases compativeis:

- `statement`: `stem`, `enunciado`
- `alt_a`: `alta`, `alternativaa`, `a`
- `alt_b`: `altb`, `alternativab`, `b`
- `alt_c`: `altc`, `alternativac`, `c`
- `alt_d`: `altd`, `alternativad`, `d`
- `alt_e`: `alte`, `alternativae`, `e`
- `correct`: `correta`, `respostacorreta`, `gabarito`
- `subject`: `materia`, `disciplina`
- `source_reference`: `source`, `fonte`, `origem`
- `source_year`: `year`, `ano`
- `general_comment`: `commentary`, `comentario`, `comentariogeral`
- `career`: `carreira`, `especialidade`, `specialty`
- `difficulty`: `dificuldade`

## Exemplo

```csv
career;subject;difficulty;statement;alt_a;alt_b;alt_c;correct;general_comment;source_type
Enfermeiro(a);Saude Publica e SUS;facil;"Qual principio do SUS garante atendimento sem discriminacao?";Universalidade;Integralidade;Equidade;A;"Universalidade garante acesso a todos.";autoral
```

## Processamento

1. A rota valida que o usuario autenticado e admin.
2. A rota valida autor, tipo/tamanho do arquivo e limites globais.
3. O parser le o CSV, normaliza cabecalhos e valida cada linha.
4. Carreira, disciplina, dificuldade e banca podem ficar vazias. Quando um
   valor preenchido nao corresponde ao catalogo, a questao e importada com o
   campo vazio e um aviso informa que o autor devera classifica-la.
5. Cada linha valida cria uma questao `draft` e alternativas ordenadas.
6. Linhas invalidas sao retornadas com numero da linha e mensagem em portugues;
   classificacoes pendentes sao retornadas separadamente como avisos.
7. Um evento operacional registra admin, autor, arquivo e contadores do import.

## Resposta Da API

Sucesso parcial ou total:

```json
{
  "success": true,
  "data": {
    "author_id": "uuid-do-autor",
    "file_name": "questoes.csv",
    "total_rows": 10,
    "imported": 8,
    "failed": 2,
    "created_question_ids": ["uuid-da-questao"],
    "warnings": [
      {
        "line": 3,
        "field": "subject",
        "message": "Disciplina nao encontrada; o autor devera preenche-la na plataforma."
      }
    ],
    "errors": [
      {
        "line": 4,
        "field": "subject",
        "message": "Disciplina nao encontrada para a carreira informada."
      }
    ]
  }
}
```

Erros globais do arquivo, como tipo invalido, mais de 5 MB ou mais de 500
linhas, retornam erro de validacao e nao criam nenhuma questao.

Rascunhos podem permanecer sem carreira, disciplina, dificuldade ou banca. A
publicacao continua bloqueada ate o autor preencher carreira, disciplina e
dificuldade, alem dos demais requisitos editoriais.
