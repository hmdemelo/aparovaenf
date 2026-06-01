# Envio de Questões em Lote — Documentação Técnica

> Funcionalidade disponível para roles `ADMIN` e `MENTOR`.  
> Rota principal da UI: `/admin/questions`

---

## Visão Geral

A funcionalidade permite que administradores e mentores importem grandes volumes de questões de múltipla escolha via arquivo **CSV** ou **JSON**. Todas as questões importadas entram com status `PENDING` e passam por um fluxo de revisão individual antes de ficarem disponíveis no banco de questões dos alunos.

---

## Arquitetura e Arquivos Envolvidos

```
lib/questions/bulkParser.ts                        ← parser + validação
app/api/admin/questions/bulk-upload/route.ts       ← endpoint POST de upload
app/api/admin/questions/template/route.ts          ← endpoint GET de download do template
app/api/admin/questions/route.ts                   ← listagem paginada com filtros
app/api/admin/questions/[id]/approve/route.ts      ← aprovação individual
app/api/admin/questions/[id]/reject/route.ts       ← rejeição individual
app/api/admin/questions/[id]/suggest/route.ts      ← sugestão de gabarito via IA
app/admin/questions/page.tsx                       ← página principal (client component)
components/admin/questions/BulkUploadDialog.tsx    ← modal de upload em lote
components/admin/questions/QuestionReviewCard.tsx  ← card de revisão individual
lib/auth/questionPermissions.ts                    ← regras de quem pode revisar
lib/ai/questionAnalyzer.ts                         ← integração com IA (Anthropic/OpenAI/Google)
```

---

## Modelo de Dados

```prisma
model Question {
  id            String         @id @default(cuid())
  externalCode  Int            @unique @default(autoincrement())  // código legível (#1, #2…)
  status        QuestionStatus @default(PENDING)                  // PENDING | APPROVED | REJECTED

  subjectId     String?        // FK → Subject (disciplina)
  contentId     String?        // FK → Content (conteúdo/tópico)

  stem          String         @db.Text     // enunciado (suporta markdown)
  alternatives  Json                        // { A: string, B: string, C: string, D?: string, E?: string }
  correctAnswer String?                     // "A" | "B" | "C" | "D" | "E" — obrigatório para aprovar
  commentary    String?        @db.Text     // explicação (suporta markdown)

  source        String?        // ex: "CESPE 2023"
  year          Int?

  uploadedById  String?        // FK → User (onDelete: SetNull)
  approvedById  String?        // FK → User (onDelete: SetNull)
  approvedAt    DateTime?
  createdAt     DateTime       @default(now())

  answers       QuestionAnswer[]  // rastreia quais alunos já responderam

  @@index([status])
  @@index([subjectId])
  @@index([contentId])
}
```

**`QuestionStatus`** é um enum Prisma com os valores `PENDING`, `APPROVED`, `REJECTED`.

---

## Formato dos Arquivos de Entrada

### CSV

- Separador: **ponto e vírgula** (`;`)
- Cabeçalho obrigatório na primeira linha
- Encoding esperado: UTF-8
- Limite: **500 linhas** por arquivo, **5 MB** máximo

| Coluna | Aliases aceitos | Obrigatório |
|--------|-----------------|-------------|
| `stem` | `enunciado` | Sim |
| `alt_a` | `alta`, `alternativaa`, `a` | Sim |
| `alt_b` | `altb`, `alternativab`, `b` | Sim |
| `alt_c` | `altc`, `alternativac`, `c` | Sim |
| `alt_d` | `altd`, `alternativad`, `d` | Não |
| `alt_e` | `alte`, `alternativae`, `e` | Não |
| `correct` | `correta`, `respostacorreta`, `gabarito` | Não |
| `subject` | `materia`, `disciplina` | Não |
| `content` | `conteudo`, `topico` | Não |
| `source` | `fonte`, `origem` | Não |
| `year` | `ano` | Não |
| `commentary` | `comentario`, `comentário` | Não |

A normalização de cabeçalhos remove acentos, espaços e hífens antes de comparar — ou seja, `"Alt. A"`, `"alt_a"` e `"ALTERNATIVA A"` são equivalentes.

**Exemplo de linha CSV:**
```csv
stem;alt_a;alt_b;alt_c;alt_d;alt_e;correct;subject;content;source;year;commentary
"Nos termos da **CF/88**, são Poderes da União:";"Legislativo, Executivo e Judiciário";"Legislativo, Executivo e Ministerial";"Judiciário, Executivo e Eleitoral";"Legislativo, Ministerial e Judiciário";"";A;"Direito Constitucional";"Organização do Estado";"CESPE 2023";2023;"Os Poderes estão no **art. 2º** da CF/88."
```

### JSON

Array de objetos. As alternativas podem ser enviadas em dois formatos:

**Formato flat** (chaves diretas no objeto):
```json
[
  {
    "stem": "Enunciado da questão...",
    "alt_a": "Alternativa A",
    "alt_b": "Alternativa B",
    "alt_c": "Alternativa C",
    "correct": "A",
    "subject": "Direito Constitucional",
    "year": 2023
  }
]
```

**Formato nested** (objeto `alternatives`):
```json
[
  {
    "stem": "Enunciado da questão...",
    "alternatives": {
      "A": "Alternativa A",
      "B": "Alternativa B",
      "C": "Alternativa C"
    },
    "correctAnswer": "A"
  }
]
```

O parser JSON flatteia o objeto `alternatives` internamente antes de rodar as mesmas validações do CSV.

### Formatação Markdown

Os campos `stem`, alternativas e `commentary` suportam um subconjunto de Markdown renderizado via `react-markdown` + `@tailwindcss/typography`:

| Sintaxe | Resultado |
|---------|-----------|
| `**texto**` | **negrito** |
| `*texto*` | *itálico* |
| `~~texto~~` | ~~rasurado~~ |
| `<u>texto</u>` | sublinhado |

---

## Pipeline de Processamento

### 1. Recepção (`POST /api/admin/questions/bulk-upload`)

```
Auth check → tamanho ≤ 5 MB → extensão .csv ou .json
→ parseCsv() ou parseJson()
→ matchSubjectsAndContents()
→ prisma.question.createMany()
→ resposta com contadores e erros
```

**Limites e guardas:**
- Apenas roles `ADMIN` e `MENTOR` podem chamar o endpoint (`getServerSession` + verificação de role).
- `maxDuration = 60` segundos (timeout do serverless function na Vercel).
- Arquivo maior que 5 MB retorna `400` imediatamente, antes de ler o conteúdo.
- O limite de 500 questões é verificado **dentro** do parser, antes de qualquer acesso ao banco.

### 2. Parsing e Validação (`lib/questions/bulkParser.ts`)

**`parseCsv(text)`** usa [PapaParse](https://www.papaparse.com/) com `header: true`, `delimiter: ";"` e `skipEmptyLines: true`. Os cabeçalhos são normalizados via `normalizeKey` (lowercase + remoção de espaços/hífens/underscores).

**`parseJson(text)`** faz `JSON.parse`, verifica que é um array, e flatteia o sub-objeto `alternatives` se presente.

Ambas as funções chamam `validateRow()` por linha. As regras são:

- `stem` não pode ser vazio.
- Alternativas A, B e C são obrigatórias; D e E são opcionais.
- `correctAnswer` (se informado) deve ser `A`–`E` e a alternativa correspondente não pode estar vazia.
- `year` (se informado) deve ser inteiro entre 1900 e 2100.

Linhas inválidas são coletadas em `errors[]` com número de linha e mensagem descritiva em português. Linhas válidas vão para `valid[]`. O processamento continua mesmo com erros parciais — o arquivo não é rejeitado em bloco.

**Resultado retornado:**
```ts
type ParseResult = {
  valid: ParsedQuestionRow[]
  errors: { line: number; message: string }[]
}
```

### 3. Vinculação de Disciplinas e Conteúdos (`matchSubjectsAndContents`)

Após o parsing, o servidor busca todos os `Subject` ativos e todos os `Content` no banco. A função `matchSubjectsAndContents` tenta casar os nomes informados no arquivo com os registros existentes usando normalização insensível a acento e case:

```ts
function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")  // remove diacríticos
    .toLowerCase()
    .trim()
}
```

O casamento de `contentName` é feito dentro do escopo da disciplina resolvida — um conteúdo com mesmo nome em disciplinas diferentes não causa ambiguidade.

Se `subject` ou `content` do arquivo não casarem com nenhum registro, os campos `subjectId`/`contentId` da questão criada ficam `null`. O endpoint reporta esses casos como **warnings** (não impedem a importação):

```json
{
  "imported": 42,
  "failed": 3,
  "errors": [...],
  "warnings": {
    "unmatchedSubjects": 5,
    "unmatchedContents": 2
  }
}
```

O mentor pode corrigir o vínculo manualmente durante a revisão.

### 4. Persistência

O endpoint usa `prisma.question.createMany()` — uma única query de inserção em lote. Todas as questões chegam com:

```ts
{
  status: "PENDING",
  uploadedById: session.user.id,  // quem fez o upload
  // … demais campos do arquivo
}
```

**Não há validação de duplicatas** — o mesmo arquivo enviado duas vezes cria o dobro de registros.

---

## Download de Template

`GET /api/admin/questions/template` retorna o arquivo `template-questoes.csv` (hardcoded no código) com duas linhas de exemplo preenchidas. Disponível diretamente na UI como link `<a href="/api/admin/questions/template" download>`.

Requer autenticação com role `ADMIN` ou `MENTOR`.

---

## UI de Upload (`BulkUploadDialog`)

Modal (`shadcn/ui Dialog`) acionado pelo botão "Importar em Lote" na página `/admin/questions`.

**Fluxo do usuário:**
1. Abre o modal; vê instruções resumidas do formato e link para download do template.
2. Clica na área dashed ou no botão para selecionar o arquivo (`.csv` ou `.json`, máx. 5 MB).
3. Clica em **Importar** — o componente faz `POST /api/admin/questions/bulk-upload` com `FormData`.
4. Após resposta:
   - Se `imported > 0`: banner verde com contagem; warnings de vínculos ausentes em subtexto.
   - Se houver erros: lista de mensagens de erro (até 50 exibidas); linha e descrição.
   - Toast de sucesso ou erro via `sonner`.
5. O botão "Importar" desaparece após sucesso (evita reenvio acidental). O modal pode ser fechado com "Fechar".
6. Ao fechar, `onSuccess()` é chamado para recarregar a lista de questões pendentes.

---

## Fluxo de Revisão Pós-Importação

Todas as questões importadas entram como `PENDING` e aparecem na aba "Pendentes" de `/admin/questions`.

### Listagem (`GET /api/admin/questions`)

Paginada (20 por página, configurável via `limit`). Filtros disponíveis: `status`, `subjectId`, `contentId`, `year`, `source`, `q` (busca no enunciado, case-insensitive via `mode: "insensitive"` do Prisma).

A resposta inclui os filtros disponíveis (lista de disciplinas, conteúdos, anos e fontes distintos) para popular os selects da UI.

### `QuestionReviewCard` — Ações por Questão

Para cada questão pendente, o revisor pode:

**1. Editar antes de aprovar**
- Enunciado (`stem`) editável inline com toolbar de markdown (negrito, itálico, sublinhado, rasurado).
- Vincular/corrigir disciplina e conteúdo via dropdowns.
- Selecionar a alternativa correta clicando nas opções.
- Escrever ou editar o comentário explicativo.

**2. Solicitar auxílio de IA**

Botão "Auxílio de IA" → `POST /api/admin/questions/[id]/suggest`

O endpoint chama `enrichQuestion()` em `lib/ai/questionAnalyzer.ts`, que:
- Lê `ai_provider`, `ai_model` e `ai_api_key` da tabela `SystemSettings`.
- Monta um prompt pedindo ao modelo que identifique a resposta correta e escreva um comentário explicativo (2–4 frases).
- Suporta três provedores: **Anthropic**, **OpenAI**, **Google Gemini**.
- Retorna `{ correctAnswer, commentary }` — **não persiste automaticamente**.

Na UI, campos preenchidos pela IA ficam destacados em âmbar com ícone ✦ ("sugestão da IA") para que o revisor identifique e valide antes de aprovar.

**3. Aprovar**

`POST /api/admin/questions/[id]/approve` com body:
```json
{
  "stem": "...",
  "subjectId": "...",
  "contentId": "...",
  "correctAnswer": "A",
  "commentary": "..."
}
```

Validações no servidor:
- `correctAnswer` obrigatório e deve ser `A`–`E`.
- A alternativa marcada como correta não pode estar vazia no banco.
- Persiste `status: "APPROVED"`, `approvedAt`, `approvedById`.

**4. Rejeitar**

`POST /api/admin/questions/[id]/reject` — apenas muda `status` para `"REJECTED"`. Sem body necessário.

---

## Controle de Permissão para Revisão

Definido em `lib/auth/questionPermissions.ts` (`canReviewQuestion`):

| Quem enviou a questão | Quem pode revisar |
|-----------------------|-------------------|
| `ADMIN` ou `MENTOR` | Qualquer `ADMIN`/`MENTOR` |
| `STUDENT` com mentor vinculado | Apenas o mentor responsável (`MentorshipLink.mentorId`) |
| `STUDENT` sem mentor (órfão) | Qualquer `ADMIN`/`MENTOR` |
| Uploader removido (LGPD — `uploadedById` nulo) | Qualquer `ADMIN`/`MENTOR` |
| Super-admin (`isMasterAdmin`) | Sempre permitido |

Na UI, quando `canApprove === false`, os botões de ação são substituídos por um aviso: *"Apenas o mentor responsável pelo aluno pode revisar esta questão."*

---

## Resposta da API de Upload

### Sucesso parcial (HTTP 200)
```json
{
  "imported": 48,
  "failed": 2,
  "errors": [
    { "line": 5, "message": "Linha 5: enunciado (stem) ausente" },
    { "line": 12, "message": "Linha 12: ano inválido (abcd)" }
  ],
  "warnings": {
    "unmatchedSubjects": 3,
    "unmatchedContents": 1
  },
  "limits": { "maxRows": 500 }
}
```

### Nenhuma linha válida (HTTP 400)
```json
{
  "imported": 0,
  "failed": 10,
  "errors": [...]
}
```

### Erros de entrada (HTTP 400)
```json
{ "error": "Arquivo maior que 5MB" }
{ "error": "Apenas arquivos .csv ou .json são aceitos" }
{ "error": "Arquivo ausente" }
```

---

## Casos de Borda e Comportamentos Importantes

- **Importação parcial:** linhas inválidas são descartadas, mas as válidas do mesmo arquivo são salvas. Não há rollback.
- **Sem deduplicação:** o mesmo arquivo enviado duas vezes resulta em questões duplicadas no banco.
- **`correctAnswer` opcional no upload:** a questão pode ser importada sem gabarito e o mentor informa durante a revisão. Questões sem `correctAnswer` não podem ser aprovadas.
- **Alternativas D e E vazias:** são armazenadas como `""` no campo `alternatives` (JSON). A UI as omite na renderização.
- **Markdown:** os campos `stem`, alternativas e `commentary` aceitam markdown na importação e são renderizados com `react-markdown` na revisão e no banco de questões dos alunos.
- **`uploadedById` nulo após LGPD:** se o usuário que fez upload for deletado, o campo fica `null` (Prisma `onDelete: SetNull`). A questão vira "institucional" e qualquer admin/mentor pode revisá-la.
- **Timeout:** o endpoint tem `maxDuration = 60s`. Para arquivos próximos de 500 questões, o gargalo está na criação em lote no Postgres, não no parsing.

---

## Endpoints de Referência

| Método | Path | Autenticação | Descrição |
|--------|------|--------------|-----------|
| `GET` | `/api/admin/questions` | ADMIN / MENTOR | Lista paginada com filtros |
| `POST` | `/api/admin/questions/bulk-upload` | ADMIN / MENTOR | Upload de arquivo CSV/JSON |
| `GET` | `/api/admin/questions/template` | ADMIN / MENTOR | Download do template CSV |
| `POST` | `/api/admin/questions/[id]/approve` | ADMIN / MENTOR (com permissão) | Aprova questão individual |
| `POST` | `/api/admin/questions/[id]/reject` | ADMIN / MENTOR (com permissão) | Rejeita questão individual |
| `POST` | `/api/admin/questions/[id]/suggest` | ADMIN / MENTOR (com permissão) | Solicita sugestão de gabarito via IA |
