# Plano de intervenção — Interface do aluno

**Criado em:** 2026-07-04
**Baseado em:** Análise completa da superfície `app/(student)/`, `features/student-feed/`, `features/trial/`, `features/billing/`

---

## Fase 0 — Decisão de produto (bloqueia a Fase 1)

**P0. Confirmar a regra do trial anônimo.**

O código redireciona visitantes não logados para `/signup` antes de qualquer questão, mas o `CLAUDE.md` e a API ainda preveem 2 questões anônimas gratuitas.

**Arquivos em conflito:**
- `app/(student)/feed/page.tsx:22` — redirect imediato para `/signup`
- `app/api/feed/next/route.ts` e `app/api/answers/route.ts` — ainda suportam `anonymousSessionId`

**Decisão necessária:**
- **(a)** Trial anônimo voltou a valer → corrigir o redirect em `feed/page.tsx`
- **(b)** Feed é só para logados → atualizar `CLAUDE.md`/spec e remover o código anônimo morto das rotas de API

> ⚠️ Sem essa decisão, qualquer mexida no funil de trial pode ir na direção errada.

---

## Fase 1 — Corrigir o que está quebrado ou frágil

Ordenado por risco/visibilidade. Cada item tem critério de verificação (padrão TDD do projeto).

| # | Intervenção | Arquivos | Verificação |
|---|---|---|---|
| 1.1 | **Remover ou tornar real a barra de progresso fake** (42% fixo) no header mobile | `components/student-layout.tsx:119` | Teste em `student-layout.test.tsx`: barra reflete valor real ou não existe |
| 1.2 | **Renderizar markdown nos comentários** do autor (geral e da alternativa) usando `RichText` | `features/student-feed/answer-feedback.tsx:38-51` | Teste: comentário com `**negrito**` renderiza `<strong>` |
| 1.3 | **Trocar `window.location.href` por `router.push('/assinar')`** e remover o `setGate('paywall')` morto | `features/student-feed/feed-shell.tsx:74,113` | Navegação SPA sem full reload; e2e `student-trial.spec.ts` continua verde |
| 1.4 | **AbortController no `loadNext`** + rollback do estado de favorito se DELETE falhar | `features/student-feed/feed-shell.tsx:52-85,134-162` | Teste: troca rápida de filtro não sobrescreve com resposta antiga |
| 1.5 | **Paginação (LIMIT) em favoritos, erros e histórico** — limite fixo de 50 + "carregar mais" depois | `favorites-service.ts`, `error-history-service.ts`, `answer-history-service.ts` | Testes de integração: query respeita limite |
| 1.6 | **`width`/`height` na imagem da questão** para evitar CLS | `features/student-feed/question-card.tsx:147-151` | Sem layout shift visível; check nas regras de performance |

**Gate da fase:** `build → typecheck → lint → test` verdes.

---

## Fase 2 — Alto impacto no produto

Ordenado por relação custo/retorno.

### 2.1 Contador de trial visível *(menor esforço, maior impacto na conversão)*

O `trial_status` já vem em toda resposta de `/api/feed/next` e `/api/answers` — o cliente descarta.

- Exibir "X questões grátis restantes" no feed (pill no header ou acima do card) para não assinantes
- Verificação: teste de componente + e2e no fluxo de trial

### 2.2 Modo revisão de questão *(transforma favoritos/erros/histórico em ferramenta real)*

Favoritos, Meus erros e Histórico hoje são becos sem saída — o usuário vê a lista mas não consegue rever ou refazer a questão. O histórico até tem link, mas aponta para `/feed?career=...` genérico (não para a questão).

- Nova rota `/questao/[id]` (ou modal) que reabre a questão em modo leitura: enunciado, alternativas com correta destacada, comentários
- Linkar itens de Favoritos, Meus erros e Histórico para lá
- Respeitar gating: não assinante não revê questões (server-side)
- Verificação: e2e em `subscriber-retention.spec.ts`

### 2.3 Refazer questões erradas *(depende de 2.2)*

- Botão "Refazer" em Meus erros que injeta a questão no feed (respondível novamente sem consumir trial para assinante)

### 2.4 Estatísticas de desempenho

- Tela/seção com % de acerto por assunto e por banca
- Dados já existem em `answer_attempts`; falta o service e a UI
- Service novo em `features/student-feed/` ou `features/account/` + página assinante-only

### 2.5 Barra de progresso real *(fecha o item 1.1 com valor real)*

- Ex.: questões respondidas na sessão atual ou meta diária configurável
- Requer decisão sobre qual métrica faz sentido para o produto

---

## Fase 3 — Melhorias menores

Podem ser intercaladas quando sobrar espaço entre as fases maiores:

1. **Filtro por dificuldade** — dado já existe no card e no índice do banco; adicionar ao painel de filtros e ao `feedQuerySchema`
2. **Filtros na URL** (`?subject=&board=&tags=`) — sobrevivem a reload, compartilháveis, alinhado à regra "URL as state" do projeto
3. **Skeleton de loading** no lugar do texto "Carregando questão"
4. **Alternativas como radio group semântico** (`role="radiogroup"` + `role="radio"`) para acessibilidade; validar com `accessibility.spec.ts`
5. **Streak / meta diária** (gamificação leve para retenção) — só depois das Fases 1–2; requer decisão de produto sobre mecânica

---

## Sequência sugerida

```
Fase 0 (decisão do trial anônimo)
  │
  ▼
Fase 1 completa — eliminar dívidas (PRs pequenos, 1 por item)
  │
  ├─► 2.1 Contador de trial    (quick win, entrega isolada, impacto imediato no funil)
  │
  ├─► 2.2 + 2.3 Revisão + Refazer   (mesmo trilho, maior esforço, maior retenção)
  │
  ├─► 2.4 Estatísticas          (paralelo com 2.5)
  └─► 2.5 Progresso real        (paralelo com 2.4)

Fase 3 — conforme folga
```

**Racional:** a Fase 1 elimina dívidas que qualquer feature nova tocaria de novo (`feed-shell`, listas de retenção). O item 2.1 é a menor intervenção com efeito direto no funil de assinatura. Os itens 2.2/2.3 atacam o motivo pelo qual as telas de assinante existem.

---

## Status do plano

| Fase | Status |
|---|---|
| Fase 0 — Decisão trial anônimo | ✅ Decidido em 2026-07-04: feed só para logados; código anônimo removido, CLAUDE.md atualizado |
| Fase 1.1 — Barra de progresso fake | ✅ Removida (substituída pelo progresso de sessão da Fase 2.5) |
| Fase 1.2 — Markdown nos comentários | ✅ RichText em `answer-feedback.tsx` + teste |
| Fase 1.3 — Router.push no paywall | ✅ `router.push('/assinar')`; estado `paywall` morto removido |
| Fase 1.4 — AbortController + rollback favorito | ✅ Abort no `loadNext` + rollback do DELETE; teste de corrida em `feed-shell.test.tsx` |
| Fase 1.5 — Paginação nas listas | ✅ LIMIT 50 nas três listas + `retention-list-limits.test.ts` |
| Fase 1.6 — width/height nas imagens | ✅ Dimensões explícitas + altura fixa (sem CLS) |
| Fase 2.1 — Contador de trial | ✅ Pill "X questões grátis restantes" no feed (novo campo `remaining_free` na API) |
| Fase 2.2 — Modo revisão de questão | ✅ Rota `/questao/[id]` (assinante-only, server-side) + links em Favoritos/Erros/Histórico |
| Fase 2.3 — Refazer questão | ✅ Link "Refazer" em Meus erros → `/feed?career=…&question=<id>` |
| Fase 2.4 — Estatísticas de desempenho | ✅ `/estatisticas` (% por assunto e banca) + link na sidebar + testes |
| Fase 2.5 — Barra de progresso real | ✅ Progresso da sessão no feed (meta de 10 questões/sessão) |
| Fase 3 — Melhorias menores | ✅ Itens 1–4 (filtro dificuldade, filtros na URL, skeleton, radiogroup). Item 5 (streak) pendente: requer decisão de produto |
