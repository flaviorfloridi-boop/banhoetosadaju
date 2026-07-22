
CREATE TABLE public.mensagem_templates (
  chave text PRIMARY KEY,
  titulo text NOT NULL,
  template text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mensagem_templates TO authenticated;
GRANT ALL ON public.mensagem_templates TO service_role;

ALTER TABLE public.mensagem_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff read templates" ON public.mensagem_templates
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff write templates" ON public.mensagem_templates
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER trg_mensagem_templates_updated
  BEFORE UPDATE ON public.mensagem_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.mensagem_templates (chave, titulo, template) VALUES
  ('agendamento:confirmado', 'Agendamento confirmado',
   'Olá! 🐾 O agendamento do *{pet}* ({servico}) foi confirmado para *{data} às {horario}*. Te esperamos! — Banho & Tosa da JU'),
  ('agendamento:em_andamento', 'Banho/tosa em andamento',
   'Oi! 🛁 O *{pet}* já começou o {servico}. Avisaremos quando estiver pronto. — Banho & Tosa da JU'),
  ('agendamento:concluido', 'Banho/tosa concluído',
   'Prontinho! ✨ O *{pet}* já está lindão e cheiroso. Pode buscar! — Banho & Tosa da JU'),
  ('agendamento:cancelado', 'Agendamento cancelado',
   'Olá! Precisamos cancelar o agendamento do *{pet}* de {data}. Nos chame para remarcar. — Banho & Tosa da JU'),
  ('taxi:confirmado', 'Taxi Dog confirmado',
   'Taxi Dog confirmado! 🚐 Passaremos em *{endereco}* para buscar o *{pet}* às *{horario}*. — Banho & Tosa da JU'),
  ('taxi:a_caminho', 'Taxi Dog a caminho',
   'Já estamos a caminho! 🚐💨 Chegaremos em {endereco} em alguns minutos para o *{pet}*. — Banho & Tosa da JU'),
  ('taxi:concluido', 'Taxi Dog concluído',
   'Missão cumprida! ✅ O *{pet}* já foi entregue com segurança. — Banho & Tosa da JU'),
  ('taxi:cancelado', 'Taxi Dog cancelado',
   'Precisamos cancelar o Taxi Dog do *{pet}* de hoje. Nos chame para reagendar. — Banho & Tosa da JU'),
  ('pacote:aviso_saldo', 'Aviso de saldo de pacote',
   'Oi! 🐾 Lembrete: o pacote *{pacote}* do *{pet}* tem *{saldo} banho(s)* disponível(is). Quer agendar? — Banho & Tosa da JU');
