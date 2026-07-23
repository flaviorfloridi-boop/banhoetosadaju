-- =========================================
-- PACOTES DE CLIENTE (pacote mensal de banhos)
-- =========================================
CREATE TABLE public.pacotes_cliente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mes_referencia date NOT NULL, -- sempre o dia 1 do mês, ex: 2026-07-01
  total_banhos integer NOT NULL DEFAULT 4,
  banhos_usados integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cliente_id, mes_referencia)
);

CREATE INDEX idx_pacotes_cliente_cliente ON public.pacotes_cliente(cliente_id);
CREATE INDEX idx_pacotes_cliente_mes ON public.pacotes_cliente(mes_referencia);

GRANT SELECT ON public.pacotes_cliente TO authenticated;
GRANT ALL ON public.pacotes_cliente TO service_role;

ALTER TABLE public.pacotes_cliente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cliente vê próprio pacote" ON public.pacotes_cliente
  FOR SELECT TO authenticated USING (auth.uid() = cliente_id);
CREATE POLICY "Staff vê todos os pacotes" ON public.pacotes_cliente
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff gerencia pacotes" ON public.pacotes_cliente
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER pacotes_cliente_updated_at BEFORE UPDATE ON public.pacotes_cliente
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- Vincula agendamento a um pacote (opcional: banho avulso quando nulo)
-- =========================================
ALTER TABLE public.agendamentos
  ADD COLUMN pacote_id uuid REFERENCES public.pacotes_cliente(id) ON DELETE SET NULL;

CREATE INDEX idx_agendamentos_pacote ON public.agendamentos(pacote_id);

-- Cliente e staff podem setar pacote_id nos updates/inserts que já fazem
-- (as policies de UPDATE/INSERT existentes em agendamentos já cobrem a coluna nova)

-- =========================================
-- Ao concluir um agendamento vinculado a um pacote, consome 1 banho do saldo
-- =========================================
CREATE OR REPLACE FUNCTION public.consumir_banho_pacote()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'concluido' AND (OLD.status IS DISTINCT FROM 'concluido') AND NEW.pacote_id IS NOT NULL THEN
    UPDATE public.pacotes_cliente
      SET banhos_usados = LEAST(banhos_usados + 1, total_banhos)
      WHERE id = NEW.pacote_id;
  END IF;

  -- Se um agendamento concluído for reaberto/cancelado, devolve o banho ao saldo
  IF OLD.status = 'concluido' AND NEW.status <> 'concluido' AND NEW.pacote_id IS NOT NULL THEN
    UPDATE public.pacotes_cliente
      SET banhos_usados = GREATEST(banhos_usados - 1, 0)
      WHERE id = NEW.pacote_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_consumir_banho_pacote
  AFTER UPDATE ON public.agendamentos
  FOR EACH ROW EXECUTE FUNCTION public.consumir_banho_pacote();

REVOKE ALL ON FUNCTION public.consumir_banho_pacote() FROM PUBLIC, anon, authenticated;

-- =========================================
-- Helper: retorna o pacote ativo do mês atual para um cliente (cria se não existir é feito pelo app)
-- =========================================
CREATE OR REPLACE FUNCTION public.saldo_pacote_atual(_cliente_id uuid)
RETURNS TABLE(id uuid, total_banhos integer, banhos_usados integer, mes_referencia date)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, total_banhos, banhos_usados, mes_referencia
  FROM public.pacotes_cliente
  WHERE cliente_id = _cliente_id
    AND ativo = true
    AND mes_referencia = date_trunc('month', now())::date
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.saldo_pacote_atual(uuid) TO authenticated;
