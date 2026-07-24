INSERT INTO public.mensagem_templates (chave, titulo, template) VALUES
  ('pacote:sobra_fim_mes', 'Aviso de banhos sobrando no fim do mês',
   'Oi! 🐾 O mês está acabando e ainda restam *{saldo} banho(s)* no seu pacote mensal. Bora agendar antes que vença? — Banho & Tosa da JU'),
  ('agendamento:lembrete', 'Lembrete de agendamento',
   'Oi! 🔔 Passando pra lembrar: o *{pet}* tem banho/tosa marcado para *{data} às {horario}*. Te esperamos! — Banho & Tosa da JU')
ON CONFLICT (chave) DO NOTHING;
