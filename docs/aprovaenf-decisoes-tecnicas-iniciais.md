# aprovaenf - Decisoes tecnicas iniciais

Fonte: decisoes de produto ja consolidadas, previsao de 100 usuarios iniciais e 500 usuarios no mes seguinte, e revisao tecnica em padrao ECC.

Fontes tecnicas consultadas:

- Next.js App Router e Route Handlers: https://github.com/vercel/next.js/blob/canary/docs/01-app/01-getting-started/15-route-handlers.mdx
- Supabase Postgres, Auth, RLS e tipos TypeScript: https://github.com/supabase/supabase
- Vercel environments e variaveis de ambiente: https://vercel.com/docs/deployments/custom-environments
- Vercel Observability e Speed Insights: https://vercel.com/docs/concepts/observability
- GitHub Spec Kit: https://github.github.com/spec-kit/

## 1. Capacidade esperada

### Cenario inicial

- Lancamento com aproximadamente 100 usuarios.
- Crescimento esperado para aproximadamente 500 usuarios no mes seguinte.
- Produto com conteudo somente texto no MVP.
- Fluxo principal: leitura de questao, resposta, comentario e proxima questao.
- Interface de autores com cadastro e publicacao de questoes.
- Pagamento mensal e anual via Abacate Pay.

### Implicacao tecnica

Esse volume nao justifica microsservicos, filas complexas, cache distribuido ou infraestrutura propria.

A decisao tecnica deve favorecer:

- Monolito modular.
- Banco relacional bem modelado.
- Autenticacao e autorizacao fortes desde o inicio.
- Deploy simples.
- Observabilidade suficiente para descobrir erros reais.
- Baixo custo operacional.
- Facilidade para evoluir depois de validar o produto.

## 2. Decisao de arquitetura

### Escolha

Construir o MVP como uma aplicacao web full-stack em monolito modular.

### Stack base

- Framework: Next.js com App Router.
- Linguagem: TypeScript.
- UI: React, Tailwind CSS e componentes proprios extraidos do prototipo.
- Icones: lucide-react.
- Hospedagem: Vercel.
- Banco de dados: Supabase Postgres.
- Autenticacao: Supabase Auth.
- Pagamentos: Abacate Pay.

### Racional

Essa stack cobre o MVP sem criar camadas desnecessarias:

- Next.js permite landing, app do aluno, painel do autor, painel admin e endpoints no mesmo projeto.
- Vercel reduz trabalho de deploy, preview, rollback e variaveis por ambiente.
- Supabase entrega Postgres, Auth, RLS e ferramentas suficientes para os primeiros 100 a 500 usuarios.
- TypeScript diminui erro em regras sensiveis como trial, assinatura e permissao de autor.

## 3. Organizacao do projeto

### Estrutura recomendada

```text
app/
  (public)/
  (student)/
  (author)/
  (admin)/
  api/
components/
features/
  questions/
  trial/
  billing/
  authors/
  analytics/
lib/
  auth/
  db/
  env/
  security/
supabase/
  migrations/
tests/
```

### Regras

- Separar por dominio de negocio, nao apenas por tipo de arquivo.
- Manter regras de negocio em `features/`.
- Manter acesso a dados atras de repositorios ou servicos pequenos.
- Evitar chamadas diretas ao banco espalhadas pela UI.
- Manter arquivos pequenos e coesos.

## 4. Banco de dados e acesso a dados

### Escolha

Usar Supabase Postgres com migrations SQL versionadas via Supabase CLI.

### Camada de acesso

Usar Supabase JavaScript client com tipos TypeScript gerados a partir do schema.

Nao usar Prisma ou Drizzle no MVP, salvo se a complexidade do schema crescer antes da implementacao.

### Racional

- O Supabase ja entrega cliente, Auth, RLS, migrations e tipos.
- Menos dependencias reduzem superficie de erro.
- SQL explicito facilita revisar permissoes e indices.
- Para 100 a 500 usuarios, a simplicidade vale mais do que uma camada extra de ORM.

### Regras obrigatorias

- Toda alteracao de schema deve estar em migration.
- Nenhuma mudanca manual em producao sem migration equivalente no repositorio.
- Gerar tipos TypeScript apos mudancas de schema.
- Usar indices para filtros principais:
  - carreira
  - banca
  - assunto
  - dificuldade
  - status de publicacao
  - autor
- Evitar `select *` em telas de feed e listagens administrativas.

## 5. Autenticacao e autorizacao

### Escolha

Usar Supabase Auth.

### Perfis iniciais

- `student`: aluno.
- `author`: enfermeiro/autor.
- `admin`: administrador.

### Regras

- Sessao segura integrada ao Next.js no servidor.
- Nao armazenar token de autenticacao em `localStorage`.
- Ativar Row Level Security em todas as tabelas com dados de usuario, conteudo ou pagamento.
- Aluno acessa apenas seus dados de trial, respostas, erros e favoritos.
- Autor acessa apenas suas questoes e estatisticas autorizadas.
- Admin acessa operacao global.
- Service role do Supabase somente em ambiente servidor e nunca exposto ao navegador.

## 6. Pagamentos

### Escolha

Integrar Abacate Pay em endpoints server-side do Next.js.

### Regras obrigatorias

- Checkout mensal: R$ 29,90.
- Checkout anual: R$ 287,00.
- Plano anual com parcelamento permitido.
- Webhook deve ser idempotente.
- Webhook deve validar assinatura/segredo quando o provedor disponibilizar.
- Nunca confiar apenas no retorno do navegador para liberar assinatura.
- Liberar acesso pago somente apos confirmacao server-side.
- Salvar IDs externos do Abacate Pay em tabela propria.

## 7. Email transacional

### Escolha para o MVP

Usar os emails do Supabase Auth para cadastro, recuperacao de senha e verificacao de conta.

### Decisao complementar

Adiar ferramenta dedicada como Resend para uma fase posterior, quando houver necessidade de:

- onboarding personalizado;
- campanhas transacionais;
- avisos de assinatura;
- emails editoriais para alunos.

## 8. Logs, monitoramento e analytics

### Logs e monitoramento

Escolha inicial:

- Vercel Observability e Runtime Logs.
- Supabase Dashboard para banco, Auth e uso do Postgres.
- Vercel Speed Insights para performance percebida.

Adicionar Sentry apenas se os erros de producao ficarem dificeis de diagnosticar com Vercel e Supabase.

### Analytics de produto

Escolha inicial:

- Vercel Web Analytics para trafego da landing e paginas.
- Tabela interna de eventos de produto no Postgres para funil do MVP.

Eventos minimos:

- `landing_viewed`
- `career_selected`
- `question_viewed`
- `question_answered`
- `signup_required_shown`
- `signup_completed`
- `trial_finished`
- `checkout_started`
- `subscription_activated`
- `favorite_attempted`
- `favorite_saved`

### Racional

No inicio, o funil do aprovaenf e mais importante do que analise comportamental complexa. Uma tabela propria evita depender cedo demais de ferramenta externa e facilita cruzar eventos com assinatura, trial e carreira.

## 9. Ambientes

### Ambientes obrigatorios

- Desenvolvimento local.
- Vercel Preview.
- Producao.

### Regras

- Vercel Preview para toda branch ou pull request.
- Producao vinculada ao branch principal.
- Supabase local para desenvolvimento.
- Nao havera projeto Supabase separado para staging desde o primeiro deploy.
- O primeiro deploy usara um unico projeto Supabase Pro para producao.
- Vercel Preview sera usado para validar build, interface, rotas e fluxos controlados.
- Fluxos que escrevem dados reais, alteram assinatura ou simulam pagamento nao devem ser testados contra usuarios reais de producao.
- Enquanto nao houver staging isolado, testes de banco devem ocorrer localmente com Supabase local ou com dados controlados.

## 10. Variaveis de ambiente e segredos

### Regras

- Usar `.env.local` apenas localmente.
- Manter `.env.example` sem segredos reais.
- Configurar variaveis reais no Vercel por ambiente.
- Validar variaveis obrigatorias no startup com schema.
- Prefixar apenas variaveis publicas com `NEXT_PUBLIC_`.
- Nunca commitar service role, segredos do Abacate Pay ou chaves privadas.

## 11. Backup e migrations

### Backups

- Usar Supabase Pro como plano inicial.
- Usar backups automaticos do Supabase Pro.
- Antes de migrations destrutivas, gerar backup manual.
- Antes de importacoes grandes de questoes, gerar backup manual.

### Migrations

- Supabase CLI como fonte de verdade.
- Migration revisada antes de producao.
- Rodar migration primeiro em ambiente local.
- Quando houver staging isolado no futuro, rodar migrations em staging antes de producao.
- Deploy de codigo e migration devem ter ordem definida no checklist de release.

## 12. Testes e qualidade

### Ferramentas

- Vitest para unitarios.
- Playwright para E2E.
- Testes de integracao com Supabase local quando houver acesso a banco.

### Fluxos E2E criticos

- Visitante responde 2 questoes e recebe pedido de cadastro.
- Usuario cadastrado responde mais 3 questoes e chega ao bloqueio do trial.
- Assinante acessa feed sem limite.
- Usuario sem assinatura nao salva favorito persistente.
- Autor cria questao com comentario geral obrigatorio.
- Autor pode deixar comentario por alternativa vazio.
- Admin cadastra autor via modal.
- Admin edita perfil de autor via modal.
- Admin consegue despublicar uma questao.
- Webhook do Abacate Pay ativa assinatura.

## 13. Layout responsivo e UI operacional

### Estudante

- A experiencia do aluno continua mobile-first.
- Smartphone e tablet usam navegacao por swipe apos resposta/comentario.
- Desktop usa botao de proxima questao.
- O feed deve manter leitura focada, card central e conteudo textual sem prometer recursos fora do MVP.

### Paineis admin/autor

Para desktop e tablet, os paineis operacionais usam um layout de moldura:

- `main` com classe `aprova-frame-main`.
- Shell central com fundo bege `--paper` / `#efebe3`.
- Margem visual de 35px em relacao ao navegador por `width: calc(100vw - 70px)` e `height: calc(100dvh - 70px)`.
- Sidebar esquerda com largura de 200px, altura total da moldura e sem rolagem interna.
- Botao de logout no rodape da sidebar.
- Conteudo direito branco com `overflow-y: auto`.
- A rolagem longa acontece apenas no painel branco, preservando sidebar e moldura.

### Admin de autores

- `/admin/authors` nao usa formulario fixo no topo.
- Criacao de autor ocorre em modal com `CreateAuthorForm`.
- Edicao de perfil ocorre em modal por `AdminAuthorsManager`.
- Rota de atualizacao: `PATCH /api/admin/authors/[id]`.
- Campos editaveis pelo admin: `display_name`, `short_bio`, `instagram`, `is_public`.
- E-mail e senha nao sao alterados nesse fluxo.

## 14. Performance inicial

### Decisoes

- Landing pode usar renderizacao estatica ou cache agressivo.
- Feed deve buscar apenas a proxima questao necessaria, nao carregar grandes listas no cliente.
- Comentarios e alternativas sao texto e podem vir junto com a questao.
- Criar indices antes de aumentar volume de questoes.
- Nao adicionar Redis no MVP.
- Nao adicionar fila no MVP, exceto se webhooks ou importacoes exigirem depois.

### Atencao

Evitar selecao aleatoria pesada no banco quando a base crescer. Para o MVP, pode ser simples, mas a evolucao deve considerar fila de questoes candidatas, cursor ou randomizacao por seed.

## 15. Nao objetivos tecnicos do MVP

- Aplicativo nativo iOS ou Android.
- Microsservicos.
- Redis.
- Fila dedicada.
- Motor de recomendacao com IA.
- Busca semantica.
- Realtime.
- Multi-tenant complexo.
- CMS externo.

## 16. Pontos ainda abertos

- Confirmar ferramenta final para emails de produto se os emails do Supabase Auth forem insuficientes.
- Confirmar formato visual da fonte das questoes de provas anteriores.

## 17. Spec Kit

### Decisao

Sim, o projeto ja pode usar GitHub Spec Kit nesta etapa.

### Motivo

O aprovaenf ja tem:

- Logica de negocio central validada.
- Decisoes comerciais principais.
- Fluxos do aluno, autor e admin mapeados em alto nivel.
- Stack tecnica inicial definida.
- Checklist ate producao.

Esse e o momento certo para transformar as decisoes em especificacoes versionadas antes de criar a aplicacao real.

### Uso recomendado

Usar Spec Kit como camada de especificacao e planejamento, nao como dependencia da aplicacao em producao.

Fluxo recomendado:

1. Criar a constituicao do projeto.
2. Criar a especificacao funcional do MVP.
3. Criar o plano tecnico baseado na stack ja decidida.
4. Gerar as tarefas implementaveis.
5. So entao iniciar o setup do projeto Next.js.

### Comando sugerido quando formos inicializar

```bash
specify init --here --integration codex --integration-options="--skills"
```

Se o CLI ainda nao estiver instalado, usar a instalacao oficial a partir do repositorio `github/spec-kit`.

### Primeira especificacao recomendada

```text
MVP do aprovaenf: plataforma web responsiva de questoes comentadas para concursos da saude, com landing, trial de 5 questoes, assinatura via Abacate Pay, feed mobile-first, painel de autores e painel administrativo.
```

## 18. Handoff ECC

Status: pronto para transformar em especificacao funcional e depois em implementacao TDD.

Proximo lane recomendado:

- GitHub Spec Kit: constituicao, especificacao, plano e tarefas.
- `tdd-workflow`: implementacao da base do projeto.
- `security-review`: revisao antes de autenticar usuarios reais e integrar pagamento.
- `e2e-testing`: validacao dos fluxos de trial, assinatura e autor.
