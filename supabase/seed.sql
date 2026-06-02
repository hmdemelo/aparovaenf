-- seed.sql
-- Seed reference data, demo authors, and sample questions for local development.
-- Runs after migrations against the local Supabase database.
-- Idempotent: safe to run multiple times. Uses plain statements only (no
-- dollar-quoted function bodies) so the Supabase seed runner batches it safely.

-- =========================================================================
-- Careers (launch: Enfermeiro(a), Tecnico em enfermagem)
-- =========================================================================

insert into careers (id, name, slug, is_launch_career) values
  ('00000000-0000-0000-0000-0000000000c1', 'Enfermeiro(a)', 'enfermeiro-a', true),
  ('00000000-0000-0000-0000-0000000000c2', 'Tecnico em enfermagem', 'tecnico-em-enfermagem', true)
on conflict (slug) do nothing;

-- =========================================================================
-- Priority boards (bancas)
-- =========================================================================

insert into boards (name, slug, is_priority) values
  ('IDIB', 'idib', true),
  ('IDECAN', 'idecan', true),
  ('FGV', 'fgv', true),
  ('Instituto AOCP', 'instituto-aocp', true),
  ('IBFC', 'ibfc', true),
  ('Consulplan', 'consulplan', true)
on conflict (slug) do nothing;

-- =========================================================================
-- Subjects per career
-- =========================================================================

insert into subjects (career_id, name, slug)
select c.id, s.name, s.slug
from careers c
cross join (values
  ('Fundamentos de Enfermagem', 'fundamentos-de-enfermagem'),
  ('Saude Publica e SUS', 'saude-publica-e-sus'),
  ('Saude da Mulher', 'saude-da-mulher'),
  ('Saude da Crianca', 'saude-da-crianca'),
  ('Urgencia e Emergencia', 'urgencia-e-emergencia'),
  ('Saude Mental', 'saude-mental'),
  ('Etica e Legislacao', 'etica-e-legislacao'),
  ('Biosseguranca', 'biosseguranca')
) as s(name, slug)
where c.is_launch_career
on conflict (career_id, slug) do nothing;

-- =========================================================================
-- Demo users (local only)
-- Inserting into auth.users fires handle_new_user(), which creates the
-- matching user_profiles row. We then elevate roles and add author profiles.
-- =========================================================================

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-0000000000a1',
    'authenticated', 'authenticated', 'admin@aprovaenf.local',
    crypt('aprovaenf123', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Admin Demo"}'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-0000000000a2',
    'authenticated', 'authenticated', 'autor1@aprovaenf.local',
    crypt('aprovaenf123', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Malaquias Junior"}'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-0000000000a3',
    'authenticated', 'authenticated', 'autor2@aprovaenf.local',
    crypt('aprovaenf123', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Raimunda Almeida"}'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-0000000000a4',
    'authenticated', 'authenticated', 'aluno@aprovaenf.local',
    crypt('aprovaenf123', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Aluno Sem Assinatura"}'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-0000000000a5',
    'authenticated', 'authenticated', 'assinante@aprovaenf.local',
    crypt('aprovaenf123', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Aluno Assinante"}'
  )
on conflict (id) do nothing;

-- GoTrue scans these token columns as Go strings; NULL breaks sign-in
-- ("converting NULL to string is unsupported"). Seed them as empty strings.
update auth.users set
  confirmation_token = '',
  recovery_token = '',
  email_change_token_new = '',
  email_change = '',
  email_change_token_current = '',
  phone_change = '',
  phone_change_token = '',
  reauthentication_token = ''
where id in (
  '00000000-0000-0000-0000-0000000000a1',
  '00000000-0000-0000-0000-0000000000a2',
  '00000000-0000-0000-0000-0000000000a3',
  '00000000-0000-0000-0000-0000000000a4',
  '00000000-0000-0000-0000-0000000000a5'
);

-- Elevate roles (handle_new_user defaults everyone to 'student').
update user_profiles set role = 'admin'
  where id = '00000000-0000-0000-0000-0000000000a1';
update user_profiles set role = 'author'
  where id in (
    '00000000-0000-0000-0000-0000000000a2',
    '00000000-0000-0000-0000-0000000000a3'
  );

-- Author profiles for the demo nurses (fixed ids so sample questions can
-- reference them below).
insert into author_profiles (id, user_id, display_name, short_bio, is_public) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a2',
   'Malaquias Junior', 'Enfermeiro aprovado em concursos da area da saude.', true),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000a3',
   'Raimunda Almeida', 'Enfermeira especialista em preparacao para concursos.', true)
on conflict (user_id) do nothing;

-- Active subscription for the demo subscriber (stands in for US3 billing in
-- local dev so favorites / error history can be exercised).
insert into subscriptions (
  user_id, plan, status, provider, current_period_start, current_period_end
) values (
  '00000000-0000-0000-0000-0000000000a5', 'annual', 'active', 'abacate_pay',
  now(), now() + interval '365 days'
)
on conflict do nothing;

-- =========================================================================
-- Sample published questions (local demo content for the student feed)
-- Career/subject ids are resolved by slug via joins.
-- =========================================================================

insert into questions (
  id, author_id, career_id, subject_id, difficulty, source_type,
  statement, general_comment, status, published_at
)
select
  v.id::uuid, v.author::uuid, c.id, s.id, v.difficulty::question_difficulty,
  'autoral', v.statement, v.general_comment, 'published', now()
from (values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000b1',
   'enfermeiro-a', 'fundamentos-de-enfermagem', 'facil',
   'A lavagem das maos e considerada a principal medida para prevencao de infeccoes relacionadas a assistencia a saude. Sobre essa pratica, assinale a alternativa correta.',
   'A higienizacao das maos e a medida isolada mais eficaz na prevencao de infeccoes. A tecnica e os cinco momentos preconizados pela OMS sao fundamentais.'),
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000b1',
   'enfermeiro-a', 'saude-publica-e-sus', 'media',
   'Sobre os principios doutrinarios do Sistema Unico de Saude (SUS), assinale a alternativa que apresenta corretamente esses principios.',
   'Os principios doutrinarios do SUS sao universalidade, equidade e integralidade. Os organizativos incluem descentralizacao, regionalizacao e participacao social.'),
  ('00000000-0000-0000-0000-0000000000f3', '00000000-0000-0000-0000-0000000000b2',
   'enfermeiro-a', 'urgencia-e-emergencia', 'media',
   'Na avaliacao inicial de uma vitima em parada cardiorrespiratoria no ambiente extra-hospitalar, qual a sequencia correta de atendimento segundo as diretrizes atuais?',
   'As diretrizes atuais preconizam a sequencia C-A-B (compressoes, vias aereas, ventilacao) para adultos em PCR, priorizando as compressoes toracicas.'),
  ('00000000-0000-0000-0000-0000000000f4', '00000000-0000-0000-0000-0000000000b2',
   'enfermeiro-a', 'saude-da-mulher', 'facil',
   'O exame preventivo do cancer do colo do utero (Papanicolau) deve ser oferecido as mulheres dentro de qual faixa etaria prioritaria, segundo o Ministerio da Saude?',
   'O rastreamento prioritario do cancer do colo do utero e recomendado para mulheres de 25 a 64 anos que ja tiveram atividade sexual.'),
  ('00000000-0000-0000-0000-0000000000f5', '00000000-0000-0000-0000-0000000000b1',
   'enfermeiro-a', 'biosseguranca', 'media',
   'Apos a administracao de medicamento por via intramuscular, qual a conduta correta em relacao ao descarte do material perfurocortante?',
   'Agulhas nao devem ser reencapadas. O descarte deve ser imediato em recipiente rigido, resistente a puncao (caixa de perfurocortantes).'),
  ('00000000-0000-0000-0000-0000000000f6', '00000000-0000-0000-0000-0000000000b2',
   'enfermeiro-a', 'saude-da-crianca', 'facil',
   'Segundo o calendario nacional de vacinacao, a vacina BCG e administrada preferencialmente em qual momento e por qual via?',
   'A BCG e administrada ao nascer (dose unica), por via intradermica, geralmente na insercao inferior do musculo deltoide direito.'),
  ('00000000-0000-0000-0000-0000000000f7', '00000000-0000-0000-0000-0000000000b1',
   'tecnico-em-enfermagem', 'fundamentos-de-enfermagem', 'facil',
   'Ao verificar os sinais vitais de um paciente adulto em repouso, qual faixa e considerada de frequencia cardiaca normal?',
   'A frequencia cardiaca normal em um adulto em repouso situa-se entre 60 e 100 batimentos por minuto.'),
  ('00000000-0000-0000-0000-0000000000f8', '00000000-0000-0000-0000-0000000000b2',
   'tecnico-em-enfermagem', 'etica-e-legislacao', 'media',
   'De acordo com a Lei do Exercicio Profissional de Enfermagem, o tecnico de enfermagem exerce suas atividades sob qual condicao?',
   'O tecnico de enfermagem exerce atividades de nivel medio, sob a supervisao e orientacao do enfermeiro, conforme a Lei 7.498/1986.')
) as v(id, author, career_slug, subject_slug, difficulty, statement, general_comment)
join careers c on c.slug = v.career_slug
join subjects s on s.slug = v.subject_slug and s.career_id = c.id
on conflict (id) do nothing;

insert into alternatives (question_id, label, text, is_correct, alternative_comment, position)
select v.qid::uuid, v.label, v.text, v.is_correct, v.comment, v.position
from (values
  -- f1
  ('00000000-0000-0000-0000-0000000000f1','A','Deve ser realizada apenas antes de procedimentos invasivos.',false,'A higienizacao tem cinco momentos, nao apenas antes de procedimentos invasivos.',0),
  ('00000000-0000-0000-0000-0000000000f1','B','E a medida isolada mais eficaz na prevencao de infeccoes.',true,'Correto: e a medida isolada mais eficaz e de menor custo.',1),
  ('00000000-0000-0000-0000-0000000000f1','C','Substitui o uso de equipamentos de protecao individual.',false,'Nao substitui os EPIs; sao medidas complementares.',2),
  ('00000000-0000-0000-0000-0000000000f1','D','So e necessaria quando ha sujidade visivel.',false,'Tambem e indicada na ausencia de sujidade visivel.',3),
  -- f2
  ('00000000-0000-0000-0000-0000000000f2','A','Universalidade, equidade e integralidade.',true,'Esses sao exatamente os principios doutrinarios do SUS.',0),
  ('00000000-0000-0000-0000-0000000000f2','B','Hierarquizacao, lucro e seletividade.',false,'Lucro e seletividade nao sao principios do SUS.',1),
  ('00000000-0000-0000-0000-0000000000f2','C','Centralizacao e exclusividade.',false,'O SUS preconiza descentralizacao, nao centralizacao.',2),
  ('00000000-0000-0000-0000-0000000000f2','D','Privatizacao e focalizacao.',false,'Contraria a universalidade do SUS.',3),
  -- f3
  ('00000000-0000-0000-0000-0000000000f3','A','Ventilacao, vias aereas e compressoes.',false,'Essa era a sequencia antiga (A-B-C).',0),
  ('00000000-0000-0000-0000-0000000000f3','B','Compressoes, vias aereas e ventilacao.',true,'Correto: a sequencia atual e C-A-B.',1),
  ('00000000-0000-0000-0000-0000000000f3','C','Desfibrilacao imediata antes das compressoes.',false,'As compressoes nao devem ser atrasadas.',2),
  ('00000000-0000-0000-0000-0000000000f3','D','Apenas ventilacao de resgate.',false,'As compressoes sao prioritarias.',3),
  -- f4
  ('00000000-0000-0000-0000-0000000000f4','A','Dos 25 aos 64 anos.',true,'Faixa etaria prioritaria preconizada pelo Ministerio da Saude.',0),
  ('00000000-0000-0000-0000-0000000000f4','B','Dos 10 aos 19 anos.',false,'Nao e a faixa prioritaria de rastreamento.',1),
  ('00000000-0000-0000-0000-0000000000f4','C','Apenas apos os 65 anos.',false,'Apos 64 anos pode-se interromper em casos especificos.',2),
  ('00000000-0000-0000-0000-0000000000f4','D','Somente durante a gestacao.',false,'O rastreamento nao se restringe a gestacao.',3),
  -- f5
  ('00000000-0000-0000-0000-0000000000f5','A','Reencapar a agulha antes do descarte.',false,'Reencapar aumenta o risco de acidente perfurocortante.',0),
  ('00000000-0000-0000-0000-0000000000f5','B','Descartar em saco plastico comum.',false,'Perfurocortantes exigem recipiente rigido.',1),
  ('00000000-0000-0000-0000-0000000000f5','C','Descartar imediatamente em recipiente rigido.',true,'Conduta correta de biosseguranca.',2),
  ('00000000-0000-0000-0000-0000000000f5','D','Entortar a agulha com as maos.',false,'Manipular a agulha aumenta o risco de acidente.',3),
  -- f6
  ('00000000-0000-0000-0000-0000000000f6','A','Ao nascer, por via intradermica.',true,'Correto: dose unica ao nascer, via intradermica.',0),
  ('00000000-0000-0000-0000-0000000000f6','B','Aos 12 meses, por via intramuscular.',false,'Nao corresponde ao calendario da BCG.',1),
  ('00000000-0000-0000-0000-0000000000f6','C','Aos 6 meses, por via subcutanea.',false,'Via e idade incorretas para a BCG.',2),
  ('00000000-0000-0000-0000-0000000000f6','D','Na adolescencia, por via oral.',false,'A BCG nao e administrada por via oral.',3),
  -- f7
  ('00000000-0000-0000-0000-0000000000f7','A','Entre 60 e 100 bpm.',true,'Faixa de normalidade para adultos em repouso.',0),
  ('00000000-0000-0000-0000-0000000000f7','B','Entre 100 e 140 bpm.',false,'Caracteriza taquicardia.',1),
  ('00000000-0000-0000-0000-0000000000f7','C','Entre 20 e 40 bpm.',false,'Caracteriza bradicardia importante.',2),
  ('00000000-0000-0000-0000-0000000000f7','D','Entre 140 e 180 bpm.',false,'Frequencia muito elevada para repouso.',3),
  -- f8
  ('00000000-0000-0000-0000-0000000000f8','A','De forma autonoma, sem supervisao.',false,'O tecnico atua sob supervisao do enfermeiro.',0),
  ('00000000-0000-0000-0000-0000000000f8','B','Sob supervisao e orientacao do enfermeiro.',true,'Correto, conforme a Lei 7.498/1986.',1),
  ('00000000-0000-0000-0000-0000000000f8','C','Apenas sob supervisao de medico.',false,'A supervisao e do enfermeiro.',2),
  ('00000000-0000-0000-0000-0000000000f8','D','Somente em ambiente hospitalar.',false,'Pode atuar em diversos contextos de saude.',3)
) as v(qid, label, text, is_correct, comment, position)
on conflict (question_id, position) do nothing;
