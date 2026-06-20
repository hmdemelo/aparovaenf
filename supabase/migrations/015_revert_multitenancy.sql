-- Reverter Multitenancy e Restaurar Tabelas de Assinatura
-- 015_revert_multitenancy.sql

-- =========================================================================
-- 1. Dropar Tabelas Exclusivas do Multi-tenant (CASCADE)
-- =========================================================================
DROP TABLE IF EXISTS public.push_subscriptions CASCADE;
DROP TABLE IF EXISTS public.alert_contacts CASCADE;
DROP TABLE IF EXISTS public.user_sessions CASCADE;
DROP TABLE IF EXISTS public.simulado_resultados CASCADE;
DROP TABLE IF EXISTS public.simulados CASCADE;
DROP TABLE IF EXISTS public.caderno_erros CASCADE;
DROP TABLE IF EXISTS public.ciclo_topicos CASCADE;
DROP TABLE IF EXISTS public.ciclos CASCADE;
DROP TABLE IF EXISTS public.tenant_active_topic CASCADE;
DROP TABLE IF EXISTS public.matriculas CASCADE;
DROP TABLE IF EXISTS public.turmas CASCADE;
DROP TABLE IF EXISTS public.tenant_memberships CASCADE;
DROP TABLE IF EXISTS public.tenant_branding CASCADE;
DROP TABLE IF EXISTS public.tenants CASCADE;

-- =========================================================================
-- 2. Dropar Colunas Extras das Tabelas Originais
-- =========================================================================
ALTER TABLE public.questions DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE public.questions DROP COLUMN IF EXISTS question_type CASCADE;

ALTER TABLE public.answer_attempts DROP COLUMN IF EXISTS tenant_id CASCADE;

ALTER TABLE public.favorites DROP COLUMN IF EXISTS tenant_id CASCADE;

ALTER TABLE public.product_events DROP COLUMN IF EXISTS tenant_id CASCADE;

-- =========================================================================
-- 3. Dropar Tipos e Funções Multi-tenant
-- =========================================================================
DROP TYPE IF EXISTS public.question_type CASCADE;

DROP FUNCTION IF EXISTS public.is_tenant_member CASCADE;
DROP FUNCTION IF EXISTS public.user_has_tenant_role CASCADE;
DROP FUNCTION IF EXISTS public.is_active_student_in_tenant CASCADE;
DROP FUNCTION IF EXISTS public.sync_user_tenants_metadata CASCADE;
DROP FUNCTION IF EXISTS public.get_public_tenant_branding CASCADE;

-- =========================================================================
-- 4. Dropar e Reconfigurar next_feed_question para Single-tenant
-- =========================================================================
DROP FUNCTION IF EXISTS public.next_feed_question CASCADE;

CREATE OR REPLACE FUNCTION public.next_feed_question(
  p_career_id uuid,
  p_board_id uuid DEFAULT NULL::uuid,
  p_exclude uuid[] DEFAULT '{}'::uuid[]
) RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select q.id
  from public.questions q
  where q.status = 'published'
    and q.career_id = p_career_id
    and (p_board_id is null or q.board_id = p_board_id)
    and not (q.id = any (p_exclude))
  order by random()
  limit 1;
$$;

-- =========================================================================
-- 5. Dropar Políticas Multi-tenant de Tabelas Originais
-- =========================================================================
DROP POLICY IF EXISTS select_questions_tenant_isolation ON public.questions;
DROP POLICY IF EXISTS insert_questions_tenant_isolation ON public.questions;
DROP POLICY IF EXISTS update_questions_tenant_isolation ON public.questions;

DROP POLICY IF EXISTS select_answer_attempts_tenant_isolation ON public.answer_attempts;
DROP POLICY IF EXISTS insert_answer_attempts_tenant_isolation ON public.answer_attempts;

DROP POLICY IF EXISTS insert_favorites_active_student ON public.favorites;
DROP POLICY IF EXISTS select_favorites_own ON public.favorites;
DROP POLICY IF EXISTS delete_favorites_own ON public.favorites;

-- =========================================================================
-- 6. Recriar Políticas RLS Single-tenant Originais (Questions, Answer Attempts, Favorites)
-- =========================================================================
-- Questions
DROP POLICY IF EXISTS "published questions are public; authors and admins see own/all" ON public.questions;
DROP POLICY IF EXISTS "authors create their own questions" ON public.questions;
DROP POLICY IF EXISTS "authors edit own questions; admins edit any" ON public.questions;

-- Answer Attempts
DROP POLICY IF EXISTS "users read own answer attempts; admins read all" ON public.answer_attempts;
DROP POLICY IF EXISTS "users insert own answer attempts" ON public.answer_attempts;

-- Favorites
DROP POLICY IF EXISTS "users read own favorites" ON public.favorites;
DROP POLICY IF EXISTS "subscribers insert own favorites" ON public.favorites;
DROP POLICY IF EXISTS "users delete own favorites" ON public.favorites;

-- Questions
CREATE POLICY "published questions are public; authors and admins see own/all"
  ON public.questions FOR SELECT
  USING (
    status = 'published'::public.question_status
    OR author_id = public.current_author_id()
    OR public.is_admin()
  );

CREATE POLICY "authors create their own questions"
  ON public.questions FOR INSERT
  WITH CHECK (author_id = public.current_author_id());

CREATE POLICY "authors edit own questions; admins edit any"
  ON public.questions FOR UPDATE
  USING (author_id = public.current_author_id() OR public.is_admin())
  WITH CHECK (author_id = public.current_author_id() OR public.is_admin());

-- Answer Attempts
CREATE POLICY "users read own answer attempts; admins read all"
  ON public.answer_attempts FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "users insert own answer attempts"
  ON public.answer_attempts FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Favorites
CREATE POLICY "users read own favorites"
  ON public.favorites FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "subscribers insert own favorites"
  ON public.favorites FOR INSERT
  WITH CHECK (user_id = auth.uid() AND public.is_subscriber());

CREATE POLICY "users delete own favorites"
  ON public.favorites FOR DELETE
  USING (user_id = auth.uid());

-- =========================================================================
-- 7. Recriar Tabelas de Assinatura (Stripe Billing Integration)
-- =========================================================================
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.payment_events CASCADE;

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.user_profiles (id) ON DELETE CASCADE,
  plan public.subscription_plan NOT NULL,
  status public.subscription_status NOT NULL DEFAULT 'pending'::public.subscription_status,
  provider text NOT NULL DEFAULT 'stripe'::text,
  provider_customer_id text,
  provider_subscription_id text,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_user ON public.subscriptions USING btree (user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions USING btree (status);
CREATE UNIQUE INDEX idx_subscriptions_one_active
  ON public.subscriptions USING btree (user_id)
  WHERE (status = 'active'::public.subscription_status);
CREATE INDEX idx_subscriptions_provider_subscription
  ON public.subscriptions USING btree (provider, provider_subscription_id)
  WHERE (provider_subscription_id IS NOT NULL);

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'stripe'::text,
  provider_event_id text NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processing_status text NOT NULL DEFAULT 'received'::text,
  error_message text,
  processed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_event_id)
);

CREATE INDEX idx_payment_events_status ON public.payment_events USING btree (processing_status);

-- =========================================================================
-- 8. RLS nas Tabelas Recriadas (Subscriptions, Payment Events)
-- =========================================================================
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own subscriptions; admins read all"
  ON public.subscriptions FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());
