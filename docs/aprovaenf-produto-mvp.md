# aprovaenf - Documento inicial do produto

## 1. Visao geral

O **aprovaenf** sera uma plataforma web responsiva de resolucao de questoes comentadas para concursos da area da saude, com foco inicial em:

- Enfermagem
- Tecnico em enfermagem
- Medico

A experiencia principal sera mobile-first, inspirada no consumo rapido de feeds verticais: uma questao por vez, leitura focada, resposta por toque, comentario imediato e avancar para a proxima questao.

A ideia central do produto e:

> Um feed de questoes comentadas para concursos da area da saude, com ritmo simples, rapido e adaptado ao celular.

## 2. Publicos principais

### 2.1 Alunos

Pessoas estudando para concursos da area da saude, principalmente enfermagem, tecnico em enfermagem e medicina.

O aluno podera usar a plataforma em:

- Smartphone
- Tablet
- Computador

Apesar disso, a experiencia principal deve ser pensada primeiro para celular.

### 2.2 Autores

Inicialmente, o produto atendera a necessidade de quatro enfermeiros bem-sucedidos em concursos.

Eles serao responsaveis por cadastrar questoes, alternativas e comentarios.

### 2.3 Administrador

Usuario responsavel por acompanhar a plataforma, gerenciar usuarios, autores, questoes, assinaturas e conteudos publicados.

## 3. Proposta de valor

O aprovaenf resolve o problema de estudantes que precisam praticar muitas questoes, mas encontram plataformas tradicionais densas, pouco adaptadas ao celular e com experiencia pouco envolvente.

O diferencial sera unir:

- Resolucao rapida de questoes
- Comentarios feitos por especialistas
- Experiencia fluida no celular
- Configuracao simples por carreira e banca
- Funil de experimentacao antes da assinatura

## 4. Experiencia inicial do aluno

O aluno nao sera obrigado a criar conta antes de testar o produto.

Fluxo inicial:

1. Aluno acessa a landing page.
2. Escolhe a carreira desejada:
   - Enfermagem
   - Tecnico em enfermagem
   - Medico
3. Opcionalmente escolhe uma banca em uma opcao discreta.
4. Comeca a responder questoes imediatamente.
5. Responde 2 questoes sem cadastro.
6. Apos a segunda questao, e solicitado o cadastro.
7. Depois do cadastro, o aluno pode responder mais 3 questoes gratis.
8. Ao finalizar as questoes gratuitas, e direcionado para assinatura mensal ou anual.

Regra do teste gratuito:

- 2 questoes antes do cadastro
- 3 questoes apos o cadastro
- 5 questoes gratuitas no total

## 5. Configuracao do feed

O aluno vera questoes aleatorias conforme configuracao escolhida.

Na landing page, a configuracao inicial sera:

- Carreira obrigatoria
- Banca opcional

Dentro da plataforma, depois do cadastro, o aluno podera alterar a qualquer momento:

- Carreira
- Banca

Possiveis filtros futuros:

- Assunto
- Dificuldade
- Origem da questao
- Questoes favoritas
- Questoes erradas

O feed deve ser aleatorio dentro das preferencias do aluno, e nao apenas aleatorio puro.

Exemplo:

> Aluno escolhe "Tecnico em enfermagem" e banca "FGV". O sistema entrega questoes aleatorias que respeitam esse recorte.

## 6. Experiencia de resolucao

Cada questao sera exibida em uma tela focada.

Fluxo de resolucao:

1. Exibe o enunciado da questao.
2. O sistema calcula um tempo estimado de leitura do enunciado.
3. Depois desse tempo, exibe as alternativas.
4. O aluno seleciona uma alternativa.
5. O sistema registra a resposta.
6. O sistema mostra se o aluno acertou ou errou.
7. O sistema exibe o comentario obrigatorio da questao.
8. Se houver, exibe tambem o comentario especifico da alternativa escolhida.
9. Se for assinante, o aluno pode salvar a questao como favorita.
10. O aluno avanca para a proxima questao.

### 6.1 Navegacao por dispositivo

- Smartphone: swipe vertical
- Tablet: swipe vertical
- Computador: botao "Proxima"

No futuro, o computador tambem podera ter atalhos de teclado, mas isso nao faz parte do MVP inicial.

## 7. Conteudo das questoes

As questoes poderao ser:

- Autorais
- De provas anteriores

Cada enfermeiro/autor cadastrara suas proprias questoes, alternativas e comentarios.

### 7.1 Estrutura de uma questao

Uma questao deve conter:

- Carreira
- Enunciado
- Alternativas
- Alternativa correta
- Comentario geral obrigatorio
- Comentario por alternativa opcional
- Assunto
- Dificuldade
- Origem: autoral ou prova anterior
- Banca opcional
- Concurso opcional
- Ano opcional
- Autor responsavel
- Status de publicacao

### 7.2 Alternativas

A quantidade de alternativas sera variavel.

O sistema deve aceitar questoes com diferentes quantidades de opcoes, sem presumir um numero fixo como 4 ou 5.

### 7.3 Comentarios

O comentario geral da questao sera obrigatorio.

O comentario por alternativa sera opcional e podera ser preenchido a criterio do enfermeiro/autor.
O autor podera decidir se comentara todas as alternativas, apenas algumas ou nenhuma alternativa individualmente.

Isso permite dois niveis de explicacao:

- Comentario geral: explica o raciocinio da questao.
- Comentario por alternativa: explica por que uma alternativa esta correta ou incorreta.

## 8. Interface dos autores

Os autores terao uma interface propria para cadastrar e gerenciar conteudos.

Funcionalidades iniciais:

- Login de autor
- Criar questao
- Editar questao
- Cadastrar enunciado
- Cadastrar alternativas variaveis
- Marcar alternativa correta
- Escrever comentario geral obrigatorio
- Escrever comentario opcional por alternativa
- Decidir se comentara todas as alternativas, algumas ou nenhuma alternativa individualmente
- Classificar por carreira
- Classificar por assunto
- Definir dificuldade
- Informar origem da questao
- Informar banca, concurso e ano quando aplicavel
- Publicar diretamente
- Arquivar ou despublicar questoes proprias, se permitido
- Listar questoes cadastradas
- Visualizar estatisticas das proprias questoes

### 8.1 Publicacao

Inicialmente, os autores terao liberdade para publicar diretamente.

Mesmo assim, o sistema deve prever status para permitir evolucao futura:

- Rascunho
- Publicada
- Arquivada
- Em revisao futura

## 9. Estatisticas para autores

Cada autor podera ver estatisticas das suas proprias questoes.

Metricas iniciais:

- Quantidade de respostas
- Quantidade de acertos
- Quantidade de erros
- Percentual de acerto
- Percentual de erro

Essas metricas ajudam a identificar:

- Questoes faceis demais
- Questoes dificeis demais
- Questoes mal formuladas
- Temas com maior dificuldade para os alunos

## 10. Funcionalidades do aluno

Funcionalidades previstas para o MVP:

- Acessar landing page
- Escolher carreira inicial
- Escolher banca opcional
- Responder 2 questoes sem cadastro
- Criar conta
- Responder mais 3 questoes gratis
- Alterar carreira dentro da plataforma
- Alterar banca dentro da plataforma
- Resolver questoes no feed
- Ver alternativas apos tempo estimado de leitura
- Responder questoes
- Ver feedback de acerto ou erro
- Ver comentario obrigatorio
- Ver comentario por alternativa quando existir
- Salvar favoritos apenas com assinatura ativa
- Assinar plano mensal
- Assinar plano anual

Funcionalidades para assinantes:

- Continuar resolvendo questoes sem limite do trial
- Salvar questoes favoritas
- Acessar historico de erros
- Revisar questoes erradas

## 11. Trial e assinatura

### 11.1 Trial

O trial sera vinculado apenas a conta do usuario.

Regras:

- O visitante pode responder 2 questoes sem cadastro.
- Depois da segunda questao, precisa criar uma conta.
- Depois do cadastro, pode responder mais 3 questoes gratis.
- Cada questao conta como usada quando o aluno responde.
- Apenas visualizar uma questao nao deve consumir trial.
- Ao finalizar o limite gratuito, o sistema bloqueia a continuidade do feed.
- O aluno deve ser direcionado para uma tela de assinatura.
- Sem assinatura, o aluno nao podera revisar as 5 questoes gratuitas apos o fim do trial.

### 11.2 Assinaturas

O produto tera dois tipos de plano:

- Mensal
- Anual

O pagamento sera integrado via **Abacate Pay**.

## 12. Landing page

O aprovaenf tera uma landing page.

A landing page deve ter papel direto na conversao e levar o aluno rapidamente para a experiencia real do produto.

Estrutura sugerida:

- Chamada principal do aprovaenf
- Escolha de carreira no primeiro bloco
- Opcao discreta para escolher banca
- Botao para comecar a responder
- Explicacao curta do formato
- Apresentacao dos autores/especialistas
- Beneficios da plataforma
- Planos mensal e anual
- Chamada para iniciar o teste

Principio importante:

> O aluno deve experimentar valor antes de ser obrigado a criar uma conta.

## 13. Interface administrativa

O administrador devera conseguir:

- Gerenciar alunos
- Gerenciar autores
- Ver todas as questoes
- Despublicar questoes problematicas
- Acompanhar assinaturas
- Acompanhar uso do trial
- Acompanhar metricas gerais da plataforma

## 14. Historico e favoritos

### 14.1 Favoritos

O aluno assinante podera salvar questoes como favoritas.

Regra definida:

- Favoritos nao ficam salvos sem assinatura.
- Apenas assinantes terao favoritos persistentes.
- Para usuarios sem assinatura, o recurso pode aparecer bloqueado ou como chamada para assinatura.

### 14.2 Historico de erros

O historico de erros sera recurso para pagantes.

Durante o trial, o sistema pode registrar erros internamente, mas a tela de revisao de erros deve ser desbloqueada apenas para assinantes.

## 15. Espaco para IA futura

O produto tera espaco para inteligencia artificial no futuro, mas isso nao sera implementado agora.

Possiveis usos futuros:

- Ajudar autores a revisar clareza do enunciado
- Sugerir classificacao por assunto
- Sugerir dificuldade
- Detectar alternativa ambigua
- Sugerir melhoria no comentario
- Gerar rascunho inicial de comentario
- Recomendar questoes com base nos erros do aluno
- Criar resumos dos temas em que o aluno mais erra

Campos que podem ser previstos futuramente no modelo de dados:

- Status de revisao por IA
- Sugestoes da IA
- Comentario sugerido por IA
- Confianca da classificacao por IA
- Alertas de ambiguidade

## 16. Modelo de dados inicial

Entidades principais:

- Usuario
- Autor
- Carreira
- Banca
- Assunto
- Questao
- Alternativa
- Resposta do usuario
- Favorito
- Assinatura
- Plano
- Pagamento

### 16.1 Usuario

Campos iniciais:

- ID
- Nome
- Email
- Senha ou provedor de autenticacao
- Tipo de usuario
- Data de cadastro
- Status da conta
- Quantidade de questoes gratuitas respondidas

Tipos possiveis:

- Aluno
- Autor
- Administrador

### 16.2 Questao

Campos iniciais:

- ID
- Carreira
- Enunciado
- Comentario geral
- Assunto
- Dificuldade
- Origem
- Banca
- Concurso
- Ano
- Autor
- Status
- Data de criacao
- Data de publicacao

### 16.3 Alternativa

Campos iniciais:

- ID
- Questao
- Texto da alternativa
- Indica se e correta
- Comentario opcional
- Ordem de exibicao

### 16.4 Resposta do usuario

Campos iniciais:

- ID
- Usuario
- Questao
- Alternativa escolhida
- Indica se acertou
- Data da resposta
- Tempo ate responder
- Contexto do feed no momento da resposta

### 16.5 Favorito

Campos iniciais:

- ID
- Usuario
- Questao
- Data em que foi favoritada

### 16.6 Assinatura

Campos iniciais:

- ID
- Usuario
- Plano
- Status
- Periodicidade
- ID externo no Abacate Pay
- Data de inicio
- Data de fim ou renovacao

## 17. MVP consolidado

### 17.1 Aluno

- Landing page
- Escolha inicial de carreira
- Escolha opcional de banca
- Resolucao de 2 questoes sem cadastro
- Cadastro apos 2 questoes
- Resolucao de mais 3 questoes gratis
- Feed de questoes aleatorias por configuracao
- Alteracao de carreira e banca dentro da plataforma
- Experiencia responsiva
- Swipe em smartphone e tablet
- Botao "Proxima" no computador
- Comentario obrigatorio apos resposta
- Comentario opcional por alternativa
- Salvar favoritos para assinantes
- Bloqueio apos fim do trial
- Assinatura mensal ou anual via Abacate Pay
- Historico de erros para assinantes

### 17.2 Autor

- Login
- Cadastro de questoes
- Alternativas variaveis
- Gabarito
- Comentario geral obrigatorio
- Comentario por alternativa opcional
- Classificacao da questao
- Publicacao direta
- Edicao de questoes
- Estatisticas de acerto e erro

### 17.3 Administrador

- Gerenciamento de usuarios
- Gerenciamento de autores
- Visualizacao de todas as questoes
- Despublicacao de conteudo
- Acompanhamento de assinaturas
- Acompanhamento do trial
- Metricas gerais

## 18. Decisoes confirmadas

- Nome do produto: aprovaenf
- Plataforma: web responsiva
- Conteudo inicial: somente texto
- Navegacao mobile/tablet: swipe
- Navegacao desktop: botao "Proxima"
- Planos: mensal e anual
- Pagamento: Abacate Pay
- Trial: 2 questoes antes do cadastro + 3 depois do cadastro
- Trial vinculado apenas a conta
- Sem assinatura, o aluno nao revisa as 5 questoes gratuitas apos o fim do trial
- Questoes: autorais e de provas anteriores
- Alternativas: quantidade variavel
- Comentario geral: obrigatorio
- Comentario por alternativa: opcional
- Autor decide se comentara todas as alternativas, algumas ou nenhuma alternativa individualmente
- Autores podem publicar diretamente
- Favoritos nao ficam salvos sem assinatura
- Favoritos persistentes apenas para assinantes
- Historico de erros para pagantes
- IA prevista para o futuro, fora do MVP inicial

## 19. Decisoes pendentes

Pontos para definir nas proximas conversas:

- Quais planos e precos serao usados no lancamento
- Se o aluno podera filtrar por assunto ja no MVP
- Como lidar juridicamente com questoes de provas anteriores
- Se havera limite de autores no MVP
- Como sera a area publica de apresentacao dos quatro especialistas
- Se o comentario por alternativa aparecera apenas da alternativa escolhida ou de todas apos resposta
- Quais metricas o administrador vera no painel inicial
