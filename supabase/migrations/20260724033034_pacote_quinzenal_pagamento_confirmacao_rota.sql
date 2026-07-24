-- =========================================
-- PACOTES: suporte a mensal E quinzenal + controle de pagamento
-- =========================================
ALTER TABLE public.pacotes_cliente
  ADD COLUMN periodicidade text NOT NULL DEFAULT 'mensal' CHECK (periodicidade IN ('mensal', 'quinzenal')),
  ADD COLUMN periodo_inicio date,
  ADD COLUMN periodo_fim date,
  ADD COLUMN status_pagamento text NOT NULL DEFAULT 'pendente' CHECK (status_pagamento IN ('pendente', 'pago', 'atrasado'));

-- Backfill dos pacotes existentes (todos eram mensais, baseados em mes_referencia)
UPDATE public.pacotes_cliente
SET periodo_inicio = mes_referencia,
    periodo_fim = (mes_referencia + INTERVAL '1 month' - INTERVAL '1 day')::date,
    status_pagamento = 'pago'
WHERE periodo_inicio IS NULL;

ALTER TABLE public.pacotes_cliente
  ALTER COLUMN periodo_inicio SET NOT NULL,
  ALTER COLUMN periodo_fim SET NOT NULL;

-- A unicidade agora é por ciclo (início do período), não mais só por mês —
-- assim um cliente pode ter pacotes quinzenais consecutivos no mesmo mês
ALTER TABLE public.pacotes_cliente DROP CONSTRAINT IF EXISTS pacotes_cliente_cliente_id_mes_referencia_key;
ALTER TABLE public.pacotes_cliente ADD CONSTRAINT pacotes_cliente_cliente_periodo_key UNIQUE (cliente_id, periodo_inicio);

CREATE INDEX idx_pacotes_cliente_periodo_fim ON public.pacotes_cliente(periodo_fim);
CREATE INDEX idx_pacotes_cliente_status_pagamento ON public.pacotes_cliente(status_pagamento);

-- Atualiza a função de saldo atual para funcionar com qualquer periodicidade:
-- pega o pacote ativo cujo ciclo ainda não terminou
CREATE OR REPLACE FUNCTION public.saldo_pacote_atual(_cliente_id uuid)
RETURNS TABLE(
  id uuid, total_banhos integer, banhos_usados integer,
  periodicidade text, periodo_inicio date, periodo_fim date, status_pagamento text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, total_banhos, banhos_usados, periodicidade, periodo_inicio, periodo_fim, status_pagamento
  FROM public.pacotes_cliente
  WHERE cliente_id = _cliente_id
    AND ativo = true
    AND periodo_fim >= CURRENT_DATE
  ORDER BY periodo_fim DESC
  LIMIT 1;
$$;

-- =========================================
-- AGENDAMENTOS: confirmação feita no dia anterior
-- =========================================
ALTER TABLE public.agendamentos
  ADD COLUMN confirmado_dia_anterior boolean NOT NULL DEFAULT false;

-- =========================================
-- TAXI DOG: ordem de coleta/entrega no dia (logística de rota)
-- =========================================
ALTER TABLE public.taxi_dog
  ADD COLUMN ordem_rota integer NOT NULL DEFAULT 0;

CREATE INDEX idx_taxi_dog_ordem ON public.taxi_dog(data, ordem_rota);

-- =========================================
-- Novo template de cobrança de pacote
-- =========================================
INSERT INTO public.mensagem_templates (chave, titulo, template) VALUES
  ('pacote:cobranca', 'Cobrança de pacote pendente',
   'Oi! 🐾 Seu pacote de banhos ({periodicidade}) está com o pagamento pendente. Pode acertar com a gente pra continuar aproveitando? — Banho & Tosa da JU')
ON CONFLICT (chave) DO NOTHING;
