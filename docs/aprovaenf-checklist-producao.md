# aprovaenf - Checklist ate producao

Este checklist organiza o caminho do aprovaenf desde o prototipo atual ate a primeira versao em producao.

Referencias iniciais:

- `docs/aprovaenf-produto-mvp.md`
- `docs/aprovaenf-prototipo_1.html`
- `docs/bulk-question-import.md`

## 0. Objetivo da primeira producao

Colocar no ar uma versao web responsiva do aprovaenf em que:

- Visitantes escolhem uma carreira e podem responder 2 questoes sem cadastro.
- Depois de 2 questoes, precisam criar conta.
- Usuarios cadastrados podem responder mais 3 questoes gratis.
- Depois de 5 questoes gratuitas no total, precisam assinar plano mensal ou anual.
- Alunos assinantes podem continuar resolvendo questoes, favoritar e revisar erros.
- Autores podem cadastrar, editar, publicar e acompanhar estatisticas das suas questoes.
- Administradores podem gerenciar alunos, autores, questoes, trials e assinaturas.

## 1. Alinhamento de produto

- [x] Definir preco mensal recomendado para lancamento: R$ 29,90.
- [x] Definir preco anual recomendado para lancamento: R$ 287,04.
- [x] Definir desconto anual recomendado: 20% em relacao ao plano mensal.
- [x] Definir que os valores do prototipo eram placeholders e serao substituidos pelos valores consolidados.
- [x] Definir comunicacao comercial do anual: equivalente a R$ 23,92 por mes, cobrado anualmente.
- [x] Definir regra comercial da assinatura anual: oferecer pagamento integral e parcelado se o Abacate Pay permitir.
- [ ] Validar no Abacate Pay se o plano anual pode ser parcelado sem atrasar o lancamento.
- [ ] Confirmar se o valor anual sera mantido como R$ 287,04 ou arredondado para valor comercial.
- [x] Definir carreiras do lancamento:
  - [x] Enfermagem
  - [x] Tecnico em enfermagem
  - [x] Medico fica para segunda fase.
- [x] Definir carreiras futuras a preparar:
  - [x] Fisioterapia
  - [x] Farmacia / Farmaceutico
  - [x] Nutricao
- [x] Definir bancas iniciais prioritarias:
  - [x] IDIB
  - [x] IDECAN
  - [x] FGV
  - [x] Instituto AOCP
  - [x] IBFC
  - [x] Consulplan
- [x] Definir assuntos iniciais prioritarios para Enfermagem:
  - [x] SUS
  - [x] Saude publica
  - [x] Lei 8.080/1990
  - [x] Constituicao Federal, artigos 196 a 204
  - [x] Lei do exercicio profissional da enfermagem
  - [x] Codigo de etica de enfermagem
  - [x] Calculo de medicacao
  - [x] Diluicao de medicacao
  - [x] Vias de administracao de medicamentos
  - [x] Vacinas
  - [x] Urgencia e emergencia
- [x] Definir assuntos iniciais prioritarios para Tecnico em enfermagem:
  - [x] Calculo de medicacao
  - [x] Diluicao de medicacao
  - [x] Vias de administracao de medicamentos
  - [x] SUS basico
  - [x] Saude publica
  - [x] Vacinas
  - [x] Fundamentos de enfermagem
  - [x] Urgencia e emergencia
  - [x] Etica e exercicio profissional
- [x] Definir composicao recomendada das 5 questoes gratuitas:
  - [x] 2 questoes de SUS / saude publica
  - [x] 2 questoes de medicacao / calculo / vias de administracao
  - [x] 1 questao de vacinas
- [x] Definir dificuldades permitidas:
  - [x] Facil
  - [x] Media
  - [x] Dificil
- [x] Definir criterio de questao facil: direta, curta, baseada em conceito, definicao ou memoria.
- [x] Definir criterio de questao media: exige interpretacao e aplicacao de conhecimento em contexto simples ou moderado.
- [x] Definir criterio de questao dificil: exige interpretacao complexa, caso clinico, conduta ou integracao de assuntos.
- [x] Definir regra de filtro por assunto no MVP: nao exibir na landing inicial.
- [x] Definir que todas as questoes devem ser classificadas por assunto desde o inicio.
- [x] Definir que filtro por assunto pode entrar dentro da plataforma se nao atrasar, ou ficar para versao 1.1.
- [x] Definir regra de favoritos: favoritos nao ficam salvos sem assinatura.
- [x] Definir regra do trial: aluno sem assinatura nao revisa as 5 questoes gratuitas depois que o trial acabar.
- [x] Definir regra do trial: comentarios aparecem durante as 5 questoes gratuitas.
- [x] Definir regra de autoria: autor decide se comentara todas as alternativas, algumas ou nenhuma individualmente.
- [ ] Definir se os comentarios por alternativa aparecerao apenas da alternativa escolhida ou de todas apos a resposta.
- [ ] Definir regra juridica e editorial para questoes de provas anteriores.
- [x] Definir headline recomendada da landing: "Sua aprovacao em concursos da saude na palma da mao."
- [x] Definir subheadline recomendada da landing: "Resolva questoes comentadas por especialistas, treine por carreira e banca, e evolua no ritmo do seu celular."
- [x] Definir beneficios principais da landing:
  - [x] Questoes comentadas por aprovados e especialistas
  - [x] Estudo rapido pelo celular
  - [x] Comentarios objetivos
  - [x] Foco em concursos da saude
  - [x] Questoes de provas anteriores
  - [x] Questoes autorais
  - [x] Trial antes de pagar
  - [x] Melhor custo-beneficio
- [x] Definir o que nao prometer no MVP:
  - [x] Simulados
  - [x] Ranking
  - [x] Mapas mentais
  - [x] Plano de estudo personalizado
  - [x] IA
- [x] Consolidar nomes e mini bios recomendadas dos autores iniciais.
- [ ] Confirmar foto final de Raimunda Almeida antes de publicar.
- [ ] Confirmar foto final de Professor Martinho Neto antes de publicar.
- [ ] Confirmar grafia do Instagram de Raimunda.
- [ ] Confirmar titulo academico de Martinho antes de publicar "doutorado".
- [ ] Definir politica de termos de uso e privacidade.
- [x] Definir aviso curto de responsabilidade: plataforma de estudo complementar, com finalidade educacional, sem promessa de aprovacao garantida.

## 2. Decisoes tecnicas iniciais

- [ ] Escolher stack principal da aplicacao.
- [ ] Escolher framework web.
- [ ] Escolher banco de dados.
- [ ] Escolher ORM ou camada de acesso a dados.
- [ ] Escolher provedor de autenticacao.
- [ ] Escolher provedor de hospedagem.
- [ ] Escolher estrategia de envio de email transacional.
- [ ] Escolher ferramenta de logs e monitoramento.
- [ ] Escolher ferramenta de analytics de produto.
- [ ] Definir padrao de ambientes:
  - [ ] Desenvolvimento local
  - [ ] Staging
  - [ ] Producao
- [ ] Definir estrategia de variaveis de ambiente.
- [ ] Definir estrategia de backup do banco.
- [ ] Definir estrategia de migrations.

## 3. Setup do repositorio

- [ ] Inicializar projeto da aplicacao.
- [ ] Configurar lint.
- [ ] Configurar formatacao.
- [ ] Configurar TypeScript, se aplicavel.
- [ ] Configurar scripts principais:
  - [ ] `dev`
  - [ ] `build`
  - [ ] `test`
  - [ ] `lint`
  - [ ] `typecheck`
- [ ] Criar estrutura de pastas do projeto.
- [ ] Criar arquivo de exemplo de variaveis de ambiente.
- [ ] Configurar README inicial.
- [ ] Configurar gitignore.
- [ ] Configurar pipeline de CI.
- [ ] Garantir que build, lint e testes rodem no CI.

## 4. Design system e UI base

- [ ] Transformar o prototipo HTML em base visual reaproveitavel.
- [ ] Definir tokens visuais:
  - [ ] Cores
  - [ ] Tipografia
  - [ ] Espacamentos
  - [ ] Raios de borda
  - [ ] Estados de erro/sucesso/alerta
- [ ] Criar componentes base:
  - [ ] Botao
  - [ ] Campo de texto
  - [ ] Select
  - [ ] Modal
  - [ ] Card
  - [ ] Tabs ou navegacao
  - [ ] Badge/chip
  - [ ] Toast/alerta
- [ ] Criar layout responsivo para aluno.
- [ ] Criar layout responsivo para paineis administrativos.
- [ ] Validar prototipo em mobile, tablet e desktop.
- [ ] Garantir contraste e legibilidade.
- [ ] Garantir que textos nao estourem containers.

## 5. Modelo de dados

- [ ] Modelar usuarios.
- [ ] Modelar perfis/papeis:
  - [ ] Aluno
  - [ ] Autor
  - [ ] Admin
- [ ] Modelar carreiras.
- [ ] Modelar bancas.
- [ ] Modelar assuntos.
- [ ] Modelar questoes.
- [ ] Modelar alternativas com quantidade variavel.
- [ ] Modelar comentario geral obrigatorio.
- [ ] Modelar comentario opcional por alternativa.
- [ ] Modelar status da questao:
  - [ ] Rascunho
  - [ ] Publicada
  - [ ] Arquivada
  - [ ] Reportada
- [ ] Modelar respostas dos alunos.
- [ ] Modelar favoritos.
- [ ] Modelar historico de erros.
- [ ] Modelar trials anonimos antes do cadastro.
- [ ] Modelar trial por conta apos cadastro.
- [ ] Modelar planos.
- [ ] Modelar assinaturas.
- [ ] Modelar pagamentos.
- [ ] Modelar eventos de webhook do Abacate Pay.
- [ ] Modelar metricas agregadas por questao.
- [ ] Reservar campos/estrutura para IA futura sem implementar a IA agora.
- [ ] Criar migrations iniciais.
- [ ] Criar seeds de desenvolvimento.

## 6. Autenticacao e permissoes

- [ ] Implementar cadastro por email e senha.
- [ ] Implementar login por email e senha.
- [ ] Implementar login com Google, se permanecer no MVP.
- [ ] Implementar recuperacao de senha.
- [ ] Implementar logout.
- [ ] Implementar sessao persistente.
- [ ] Implementar papeis de usuario.
- [ ] Proteger rotas de autor.
- [ ] Proteger rotas de admin.
- [ ] Garantir que aluno nao acesse painel de autor/admin.
- [ ] Garantir que autor veja apenas suas proprias questoes, exceto permissoes futuras.
- [ ] Garantir que admin veja tudo.
- [ ] Criar fluxo para convidar autores.
- [ ] Criar fluxo para suspender usuario, se entrar no MVP.

## 7. Landing page e funil publico

- [ ] Implementar landing page.
- [ ] Exibir escolha obrigatoria de carreira.
- [ ] Exibir escolha opcional de banca.
- [ ] Permitir iniciar feed sem cadastro.
- [ ] Registrar sessao anonima do visitante.
- [ ] Contar questoes respondidas antes do cadastro.
- [ ] Bloquear continuidade apos 2 respostas anonimas.
- [ ] Exibir tela de cadastro apos 2 respostas.
- [ ] Preservar progresso anonimo ao criar conta.
- [ ] Associar as 2 respostas anonimas ao usuario cadastrado, quando possivel.
- [ ] Medir funil:
  - [ ] Visitou landing
  - [ ] Escolheu carreira
  - [ ] Respondeu primeira questao
  - [ ] Respondeu segunda questao
  - [ ] Chegou ao cadastro
  - [ ] Criou conta
  - [ ] Esgotou trial
  - [ ] Iniciou checkout
  - [ ] Assinou

## 8. Feed de questoes do aluno

- [ ] Implementar tela de feed.
- [ ] Buscar questoes publicadas conforme configuracao do aluno.
- [ ] Respeitar filtro de carreira.
- [ ] Respeitar filtro opcional de banca.
- [ ] Implementar aleatoriedade sem repetir demais as mesmas questoes.
- [ ] Exibir enunciado primeiro.
- [ ] Calcular tempo estimado de leitura do enunciado.
- [ ] Exibir alternativas depois do tempo estimado.
- [ ] Permitir toque/clique para revelar alternativas antes do tempo, se essa regra for mantida.
- [ ] Exibir alternativas em quantidade variavel.
- [ ] Registrar resposta somente ao selecionar alternativa.
- [ ] Marcar resposta correta/incorreta.
- [ ] Exibir comentario geral obrigatorio.
- [ ] Exibir comentario da alternativa quando existir.
- [ ] Implementar botao "Proxima" no desktop.
- [ ] Implementar swipe vertical em smartphone.
- [ ] Implementar swipe vertical em tablet.
- [ ] Evitar resposta duplicada na mesma questao.
- [ ] Evitar consumo de trial ao apenas visualizar uma questao.
- [ ] Registrar tempo ate responder.
- [ ] Registrar contexto do feed no momento da resposta.
- [ ] Criar estados vazios quando nao houver questoes para o filtro escolhido.

## 9. Trial, paywall e assinatura

- [ ] Implementar contador de 5 questoes gratuitas totais.
- [ ] Permitir 2 respostas sem cadastro.
- [ ] Permitir mais 3 respostas apos cadastro.
- [ ] Bloquear feed ao terminar trial.
- [ ] Exibir paywall.
- [ ] Exibir plano mensal.
- [ ] Exibir plano anual.
- [ ] Integrar checkout do Abacate Pay.
- [ ] Criar assinatura no sistema apos confirmacao de pagamento.
- [ ] Implementar webhook de pagamento aprovado.
- [ ] Implementar webhook de pagamento recusado.
- [ ] Implementar webhook de assinatura cancelada.
- [ ] Implementar webhook de assinatura vencida/inadimplente, se disponivel.
- [ ] Tornar webhooks idempotentes.
- [ ] Salvar IDs externos do Abacate Pay.
- [ ] Atualizar status de assinatura sem depender apenas do retorno do checkout.
- [ ] Liberar feed ilimitado para assinantes ativos.
- [ ] Bloquear recursos pagos para usuarios sem assinatura ativa.
- [ ] Bloquear revisao das 5 questoes gratuitas para usuarios sem assinatura.
- [ ] Criar tela de sucesso apos pagamento.
- [ ] Criar tela de erro/cancelamento de pagamento.
- [ ] Testar fluxo mensal.
- [ ] Testar fluxo anual.
- [ ] Testar cancelamento.
- [ ] Testar pagamento recusado.

## 10. Favoritos e historico de erros

- [ ] Implementar favoritar questao.
- [ ] Implementar remover favorito.
- [ ] Criar tela de favoritas.
- [ ] Persistir favoritos apenas para assinantes.
- [ ] Garantir que favoritos nao fiquem salvos sem assinatura.
- [ ] Exibir bloqueio ou chamada para assinatura quando usuario sem assinatura tentar salvar favorito.
- [ ] Registrar erros automaticamente ao responder errado.
- [ ] Criar tela de revisao de erros.
- [ ] Bloquear revisao de erros para nao assinantes.
- [ ] Liberar revisao de erros para assinantes.
- [ ] Permitir refazer questoes erradas.
- [ ] Registrar quando uma questao errada foi refeita.
- [ ] Definir se uma questao sai da lista de erros apos acerto posterior.

## 11. Configuracao do aluno

- [ ] Criar tela/area de perfil.
- [ ] Permitir alterar carreira a qualquer momento.
- [ ] Permitir alterar banca a qualquer momento.
- [ ] Atualizar feed apos mudanca de configuracao.
- [ ] Salvar preferencias do aluno cadastrado.
- [ ] Definir preferencia padrao para novos usuarios.
- [ ] Exibir metricas basicas:
  - [ ] Respondidas
  - [ ] Favoritas
  - [ ] Erros
  - [ ] Status da assinatura/trial

## 12. Painel do autor

- [ ] Implementar login/acesso de autor.
- [ ] Criar lista de questoes do autor.
- [ ] Criar formulario de nova questao.
- [ ] Permitir editar questao.
- [ ] Permitir salvar rascunho.
- [ ] Permitir publicar diretamente.
- [ ] Permitir arquivar/despublicar questao propria, se aprovado.
- [ ] Validar carreira obrigatoria.
- [ ] Validar enunciado obrigatorio.
- [ ] Validar minimo de alternativas.
- [ ] Validar exatamente uma alternativa correta.
- [ ] Validar comentario geral obrigatorio.
- [ ] Permitir comentario opcional por alternativa.
- [ ] Permitir que o autor comente todas as alternativas, apenas algumas ou nenhuma individualmente.
- [ ] Permitir origem autoral.
- [ ] Permitir origem prova anterior.
- [ ] Exibir campos de banca/ano/concurso quando origem for prova anterior.
- [ ] Criar estatisticas por questao:
  - [ ] Respostas
  - [ ] Acertos
  - [ ] Erros
  - [ ] Percentual de acerto
- [ ] Criar visao de questoes com acerto muito alto ou muito baixo.

## 13. Importacao de questoes em lote

O arquivo `docs/bulk-question-import.md` descreve uma importacao com roles `ADMIN` e `MENTOR`, status `PENDING` e fluxo de revisao. Para o aprovaenf, a decisao inicial e autores publicarem diretamente. Antes de implementar, adaptar essa proposta ao modelo real do produto.

- [ ] Decidir se importacao em lote entra no MVP ou fica para fase posterior.
- [ ] Adaptar roles de `MENTOR` para `AUTOR`, se necessario.
- [ ] Decidir se questoes importadas entram como rascunho, pendentes ou publicadas.
- [ ] Definir se autor pode importar apenas para sua propria conta.
- [ ] Definir se admin pode importar para qualquer autor.
- [ ] Criar template CSV do aprovaenf.
- [ ] Criar template JSON do aprovaenf.
- [ ] Suportar alternativas variaveis no importador.
- [ ] Exigir comentario geral no importador.
- [ ] Suportar comentario por alternativa no importador.
- [ ] Validar carreira, assunto, banca e origem.
- [ ] Detectar possiveis duplicatas.
- [ ] Exibir erros de importacao por linha.
- [ ] Criar tela de importacao em lote.
- [ ] Criar teste de importacao CSV.
- [ ] Criar teste de importacao JSON.

## 14. Painel administrativo

- [ ] Implementar dashboard geral.
- [ ] Listar alunos.
- [ ] Buscar alunos.
- [ ] Ver status de trial/assinatura do aluno.
- [ ] Suspender aluno, se entrar no MVP.
- [ ] Listar autores.
- [ ] Convidar autor.
- [ ] Desativar autor.
- [ ] Listar todas as questoes.
- [ ] Filtrar questoes por carreira.
- [ ] Filtrar questoes por banca.
- [ ] Filtrar questoes por autor.
- [ ] Filtrar questoes por status.
- [ ] Despublicar questao problematica.
- [ ] Listar assinaturas.
- [ ] Ver status do pagamento.
- [ ] Ver ID externo do Abacate Pay.
- [ ] Acompanhar funil do trial.
- [ ] Acompanhar metricas gerais:
  - [ ] Alunos totais
  - [ ] Assinantes ativos
  - [ ] Trials ativos
  - [ ] Questoes publicadas
  - [ ] Conversao trial para pago
  - [ ] MRR ou receita estimada

## 15. Analytics, logs e eventos

- [ ] Definir eventos principais de produto.
- [ ] Instrumentar eventos da landing.
- [ ] Instrumentar eventos do feed.
- [ ] Instrumentar eventos do cadastro.
- [ ] Instrumentar eventos do paywall.
- [ ] Instrumentar eventos do checkout.
- [ ] Instrumentar eventos de favoritos.
- [ ] Instrumentar eventos de erros/refazer erros.
- [ ] Instrumentar eventos de criacao/publicacao de questoes.
- [ ] Criar logs de erros de backend.
- [ ] Criar logs de webhook.
- [ ] Criar alerta para falha em webhook de pagamento.
- [ ] Criar alerta para erro 500 recorrente.
- [ ] Criar painel minimo de metricas de producao.

## 16. Conteudo para lancamento

- [ ] Definir quantidade minima de questoes para lancar.
- [ ] Definir quantidade minima por carreira.
- [ ] Definir quantidade minima por banca inicial.
- [ ] Definir quantidade minima por assunto principal.
- [ ] Preparar questoes autorais iniciais.
- [ ] Preparar questoes de provas anteriores conforme regra juridica definida.
- [ ] Revisar comentarios obrigatorios.
- [ ] Revisar gabaritos.
- [ ] Revisar classificacao por carreira, banca, assunto e dificuldade.
- [ ] Cadastrar os quatro autores.
- [ ] Validar estatisticas com dados simulados ou reais iniciais.
- [ ] Garantir que sempre haja questoes suficientes para o trial em cada carreira lancada.

## 17. Segurança, privacidade e LGPD

- [ ] Criar politica de privacidade.
- [ ] Criar termos de uso.
- [ ] Definir base legal para tratamento de dados.
- [ ] Implementar aceite de termos no cadastro.
- [ ] Proteger dados sensiveis em logs.
- [ ] Validar permissoes em todas as rotas protegidas.
- [ ] Validar inputs no servidor.
- [ ] Prevenir acesso indevido a questoes nao publicadas.
- [ ] Prevenir acesso indevido a historico de outros usuarios.
- [ ] Proteger endpoints de webhook com assinatura/segredo.
- [ ] Configurar rate limiting em rotas sensiveis, se possivel.
- [ ] Garantir HTTPS em producao.
- [ ] Definir processo de exclusao de conta.
- [ ] Definir processo de exportacao de dados, se necessario.

## 18. Testes de qualidade

- [ ] Testar cadastro.
- [ ] Testar login.
- [ ] Testar logout.
- [ ] Testar recuperacao de senha.
- [ ] Testar 2 questoes anonimas.
- [ ] Testar bloqueio para cadastro apos 2 questoes.
- [ ] Testar mais 3 questoes apos cadastro.
- [ ] Testar paywall apos 5 questoes.
- [ ] Testar assinatura mensal.
- [ ] Testar assinatura anual.
- [ ] Testar webhook do Abacate Pay.
- [ ] Testar usuario assinante acessando feed.
- [ ] Testar usuario sem assinatura bloqueado.
- [ ] Testar favoritar e desfavoritar como assinante.
- [ ] Testar que usuario sem assinatura nao salva favoritos.
- [ ] Testar historico de erros como assinante.
- [ ] Testar bloqueio de historico de erros sem assinatura.
- [ ] Testar criacao de questao pelo autor.
- [ ] Testar edicao de questao pelo autor.
- [ ] Testar publicacao de questao.
- [ ] Testar despublicacao pelo admin.
- [ ] Testar estatisticas de questao.
- [ ] Testar responsividade mobile.
- [ ] Testar responsividade tablet.
- [ ] Testar responsividade desktop.
- [ ] Testar swipe em smartphone/tablet.
- [ ] Testar botao "Proxima" no desktop.
- [ ] Testar estados vazios.
- [ ] Testar erros de rede.
- [ ] Testar pagina 404.
- [ ] Testar pagina de erro geral.

## 19. Acessibilidade e experiencia

- [ ] Garantir navegacao por teclado nas telas principais.
- [ ] Garantir labels em campos de formulario.
- [ ] Garantir foco visivel.
- [ ] Garantir contraste suficiente.
- [ ] Garantir feedback claro de acerto/erro.
- [ ] Garantir que o feedback nao dependa apenas de cor.
- [ ] Garantir area de toque adequada no mobile.
- [ ] Garantir que swipe nao atrapalhe rolagem de comentarios longos.
- [ ] Garantir que enunciados longos continuem legiveis.
- [ ] Garantir que alternativas longas nao quebrem o layout.

## 20. SEO e paginas publicas

- [ ] Definir titulo e descricao da landing.
- [ ] Configurar Open Graph.
- [ ] Configurar favicon.
- [ ] Configurar robots.txt.
- [ ] Configurar sitemap, se houver mais paginas publicas.
- [ ] Criar pagina de termos.
- [ ] Criar pagina de privacidade.
- [ ] Criar pagina de contato/suporte.
- [ ] Configurar dominio.
- [ ] Configurar redirecionamento www/non-www, se necessario.

## 21. Infraestrutura e deploy

- [ ] Criar projeto no provedor de hospedagem.
- [ ] Criar banco de staging.
- [ ] Criar banco de producao.
- [ ] Configurar variaveis de staging.
- [ ] Configurar variaveis de producao.
- [ ] Configurar dominio de staging, se necessario.
- [ ] Configurar dominio de producao.
- [ ] Configurar HTTPS.
- [ ] Rodar migrations em staging.
- [ ] Rodar seeds em staging.
- [ ] Validar app em staging.
- [ ] Rodar migrations em producao.
- [ ] Cadastrar planos reais no Abacate Pay.
- [ ] Configurar webhooks reais do Abacate Pay.
- [ ] Testar checkout em ambiente real/sandbox conforme disponibilidade.
- [ ] Configurar backup do banco.
- [ ] Configurar monitoramento de disponibilidade.

## 22. Checklist de pre-lancamento

- [ ] Build de producao passa.
- [ ] Lint passa.
- [ ] Typecheck passa, se aplicavel.
- [ ] Testes automatizados passam.
- [ ] Fluxo completo do aluno passa em staging.
- [ ] Fluxo completo do autor passa em staging.
- [ ] Fluxo completo do admin passa em staging.
- [ ] Fluxo completo de pagamento passa.
- [ ] Webhook de pagamento confirmado em logs.
- [ ] Politica de privacidade publicada.
- [ ] Termos de uso publicados.
- [ ] Conteudo minimo cadastrado.
- [ ] Autores iniciais cadastrados.
- [ ] Admin inicial criado.
- [ ] Dominio apontado.
- [ ] Analytics ativo.
- [ ] Monitoramento ativo.
- [ ] Backup ativo.
- [ ] Plano de rollback definido.
- [ ] Canal de suporte definido.

## 23. Lancamento

- [ ] Fazer deploy final em producao.
- [ ] Validar landing page em producao.
- [ ] Validar cadastro em producao.
- [ ] Validar feed em producao.
- [ ] Validar limite de trial em producao.
- [ ] Validar checkout em producao.
- [ ] Validar liberacao de assinatura em producao.
- [ ] Validar painel do autor em producao.
- [ ] Validar painel admin em producao.
- [ ] Convidar autores.
- [ ] Cadastrar ou importar lote inicial de questoes.
- [ ] Fazer teste real com pelo menos 1 usuario aluno.
- [ ] Fazer teste real com pelo menos 1 autor.
- [ ] Abrir acesso para primeiros usuarios.

## 24. Pos-lancamento imediato

- [ ] Monitorar erros nas primeiras 24 horas.
- [ ] Monitorar webhooks de pagamento.
- [ ] Monitorar conversao do funil.
- [ ] Monitorar filtros sem questoes suficientes.
- [ ] Coletar feedback dos primeiros alunos.
- [ ] Coletar feedback dos autores.
- [ ] Ajustar textos da landing conforme duvidas recorrentes.
- [ ] Ajustar paywall conforme comportamento real.
- [ ] Corrigir bugs criticos.
- [ ] Priorizar melhorias da semana 1.

## 25. Fora do MVP inicial

Itens planejados, mas nao necessarios para primeira producao:

- [ ] IA para revisar enunciado.
- [ ] IA para sugerir classificacao.
- [ ] IA para gerar comentario.
- [ ] Recomendacao inteligente por desempenho.
- [ ] Filtros avancados por assunto/dificuldade, caso nao entrem no MVP.
- [ ] Atalhos de teclado no desktop.
- [ ] App nativo.
- [ ] Comentarios em audio ou video.
- [ ] Ranking/gamificacao avancada.

## 26. Criterio de pronto para producao

A aplicacao pode ser considerada pronta para a primeira producao quando:

- [ ] Um visitante consegue responder 2 questoes sem cadastro.
- [ ] O cadastro e exigido apos 2 respostas.
- [ ] Um usuario cadastrado consegue responder mais 3 questoes gratuitas.
- [ ] O paywall aparece corretamente apos 5 respostas totais.
- [ ] O pagamento mensal e anual funcionam via Abacate Pay.
- [ ] Uma assinatura ativa libera o feed.
- [ ] Um assinante consegue favoritar questoes.
- [ ] Um usuario sem assinatura nao consegue salvar favoritos persistentes.
- [ ] Um assinante consegue revisar erros.
- [ ] Um autor consegue criar e publicar questoes.
- [ ] Um admin consegue despublicar questoes problematicas.
- [ ] As metricas basicas aparecem nos paineis.
- [ ] O app funciona bem em smartphone, tablet e desktop.
- [ ] Os principais fluxos foram testados em staging.
- [ ] Termos, privacidade, dominio, HTTPS, analytics, logs e backup estao ativos.
