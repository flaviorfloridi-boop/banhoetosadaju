-- =========================================
-- DESPESAS DIÁRIAS (pra compor o fechamento do dia)
-- =========================================
CREATE TABLE public.despesas_diarias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL,
  categoria text NOT NULL DEFAULT 'outros',
  descricao text NOT NULL,
  valor_cents integer NOT NULL CHECK (valor_cents >= 0),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_despesas_diarias_data ON public.despesas_diarias(data);

ALTER TABLE public.despesas_diarias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff gerencia despesas" ON public.despesas_diarias
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

GRANT ALL ON public.despesas_diarias TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.despesas_diarias TO authenticated;
