-- Permite que a equipe (staff) cadastre agendamentos manualmente em nome de
-- qualquer cliente (ex: depois de receber o pedido pelo WhatsApp), já que a
-- política existente de INSERT só permitia ao próprio cliente autenticado.
CREATE POLICY "Staff cria agendamento" ON public.agendamentos
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
