
-- =========================================
-- SERVICE PRICES
-- =========================================
CREATE TABLE public.service_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave text NOT NULL UNIQUE,
  nome text NOT NULL,
  categoria text NOT NULL DEFAULT 'servico',
  descricao text,
  valor_cents integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.service_prices TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_prices TO authenticated;
GRANT ALL ON public.service_prices TO service_role;
ALTER TABLE public.service_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos veem preços" ON public.service_prices FOR SELECT USING (true);
CREATE POLICY "Equipe gerencia preços" ON public.service_prices FOR ALL
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_service_prices_updated BEFORE UPDATE ON public.service_prices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.service_prices (chave, nome, categoria, descricao, valor_cents, ordem) VALUES
  ('banho_pequeno', 'Banho — Porte pequeno', 'banho', 'Até 10kg', 5000, 1),
  ('banho_medio', 'Banho — Porte médio', 'banho', '10 a 20kg', 7000, 2),
  ('banho_grande', 'Banho — Porte grande', 'banho', 'Acima de 20kg', 9000, 3),
  ('tosa_higienica', 'Tosa higiênica', 'tosa', 'Áreas íntimas, patas e face', 4000, 4),
  ('tosa_completa', 'Tosa completa', 'tosa', 'Corte na tesoura ou máquina', 8000, 5),
  ('banho_tosa_combo', 'Banho + Tosa completa', 'pacote', 'Combo com desconto', 12000, 6),
  ('spa_relax', 'Spa relaxante', 'pacote', 'Aromaterapia e massagem', 15000, 7),
  ('taxi_dog_bairro', 'Taxi Dog — mesmo bairro', 'taxi', 'Coleta ou entrega', 2500, 10),
  ('taxi_dog_ida_volta', 'Taxi Dog — ida e volta', 'taxi', 'Coleta + entrega', 4500, 11),
  ('pacote_mensal_4_banhos', 'Pacote mensal — 4 banhos', 'assinatura', 'Um banho por semana', 18000, 20);

-- =========================================
-- APP SETTINGS
-- =========================================
CREATE TABLE public.app_settings (
  chave text PRIMARY KEY,
  valor jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos leem settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Equipe altera settings" ON public.app_settings FOR ALL
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_app_settings_updated BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.app_settings (chave, valor) VALUES
  ('limite_banhos_dia', '15'::jsonb),
  ('endereco_loja', '{"rua":"","bairro":"","cidade":"","cep":"","lat":-23.5505,"lng":-46.6333}'::jsonb);

-- =========================================
-- PET PHOTOS (after bath)
-- =========================================
CREATE TABLE public.pet_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  agendamento_id uuid REFERENCES public.agendamentos(id) ON DELETE SET NULL,
  storage_path text NOT NULL,
  legenda text,
  enviado_por uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pet_photos_pet ON public.pet_photos(pet_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pet_photos TO authenticated;
GRANT ALL ON public.pet_photos TO service_role;
ALTER TABLE public.pet_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tutor vê fotos do seu pet" ON public.pet_photos FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.pets p WHERE p.id = pet_photos.pet_id AND p.tutor_id = auth.uid())
    OR public.is_staff(auth.uid()));
CREATE POLICY "Equipe gerencia fotos" ON public.pet_photos FOR ALL
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- =========================================
-- GALLERY POSTS (home feed)
-- =========================================
CREATE TABLE public.gallery_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path text NOT NULL,
  legenda text,
  ordem integer NOT NULL DEFAULT 0,
  publicado boolean NOT NULL DEFAULT true,
  enviado_por uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.gallery_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gallery_posts TO authenticated;
GRANT ALL ON public.gallery_posts TO service_role;
ALTER TABLE public.gallery_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Galeria pública" ON public.gallery_posts FOR SELECT USING (publicado = true);
CREATE POLICY "Equipe vê tudo" ON public.gallery_posts FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Equipe gerencia galeria" ON public.gallery_posts FOR ALL
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- =========================================
-- SUBSCRIPTIONS (Stripe)
-- =========================================
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_subscription_id text NOT NULL UNIQUE,
  stripe_customer_id text NOT NULL,
  product_id text NOT NULL,
  price_id text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User sees own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff sees all subs" ON public.subscriptions FOR SELECT USING (public.is_staff(auth.uid()));

-- =========================================
-- PAGAMENTOS (one-time payments log)
-- =========================================
CREATE TABLE public.pagamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  agendamento_id uuid REFERENCES public.agendamentos(id) ON DELETE SET NULL,
  descricao text NOT NULL,
  valor_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  stripe_session_id text,
  metodo text,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pag_cliente ON public.pagamentos(cliente_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pagamentos TO authenticated;
GRANT ALL ON public.pagamentos TO service_role;
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cliente vê próprios pagamentos" ON public.pagamentos FOR SELECT
  USING (cliente_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Cliente cria pagamento" ON public.pagamentos FOR INSERT
  WITH CHECK (cliente_id = auth.uid());
CREATE POLICY "Equipe gerencia pagamentos" ON public.pagamentos FOR ALL
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_pag_updated BEFORE UPDATE ON public.pagamentos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- DAILY BOOKING LIMIT TRIGGER
-- =========================================
CREATE OR REPLACE FUNCTION public.check_agendamento_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  limite integer;
  atual integer;
BEGIN
  SELECT COALESCE((valor)::text::integer, 15) INTO limite
    FROM public.app_settings WHERE chave = 'limite_banhos_dia';
  SELECT COUNT(*) INTO atual
    FROM public.agendamentos
    WHERE data = NEW.data AND status <> 'cancelado';
  IF atual >= limite AND public.is_staff(auth.uid()) = false THEN
    RAISE EXCEPTION 'Dia lotado: limite diário de % banhos atingido para %', limite, NEW.data
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_agendamento_limit
  BEFORE INSERT ON public.agendamentos
  FOR EACH ROW EXECUTE FUNCTION public.check_agendamento_limit();

-- =========================================
-- HELPER: count agendamentos by day (para calendário do cliente)
-- =========================================
CREATE OR REPLACE FUNCTION public.count_agendamentos_por_dia(inicio date, fim date)
RETURNS TABLE(data date, total bigint, limite integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    d::date AS data,
    (SELECT COUNT(*) FROM public.agendamentos a WHERE a.data = d::date AND a.status <> 'cancelado') AS total,
    COALESCE((SELECT (valor)::text::integer FROM public.app_settings WHERE chave = 'limite_banhos_dia'), 15) AS limite
  FROM generate_series(inicio, fim, interval '1 day') d;
$$;
GRANT EXECUTE ON FUNCTION public.count_agendamentos_por_dia(date, date) TO anon, authenticated;
