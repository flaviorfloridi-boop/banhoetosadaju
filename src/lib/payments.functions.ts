import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from '@/lib/stripe.server';

type CheckoutResult = { clientSecret: string } | { error: string };

async function resolveCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId: string },
): Promise<string> {
  if (!/^[a-zA-Z0-9_-]+$/.test(options.userId)) throw new Error('Invalid userId');
  const found = await stripe.customers.search({
    query: `metadata['userId']:'${options.userId}'`,
    limit: 1,
  });
  if (found.data.length) return found.data[0].id;
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) {
      const c = existing.data[0];
      if (c.metadata?.userId !== options.userId) {
        await stripe.customers.update(c.id, { metadata: { ...c.metadata, userId: options.userId } });
      }
      return c.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    metadata: { userId: options.userId },
  });
  return created.id;
}

// Cria uma sessão embedded para pagamento avulso (pagamento de um agendamento/pacote/serviço)
export const createServicoCheckout = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    descricao: string;
    amountInCents: number;
    agendamentoId?: string;
    returnUrl: string;
    environment: StripeEnv;
  }) => {
    if (!data.amountInCents || data.amountInCents < 100) throw new Error('Valor mínimo R$ 1,00');
    if (!data.descricao || data.descricao.length > 200) throw new Error('Descrição inválida');
    return data;
  })
  .handler(async ({ data, context }): Promise<CheckoutResult> => {
    try {
      const stripe = createStripeClient(data.environment);
      const { data: userData } = await context.supabase.auth.getUser();
      const email = userData.user?.email;
      const customerId = await resolveCustomer(stripe, { email, userId: context.userId });

      // Registra pagamento pendente
      const { data: pag } = await context.supabase.from('pagamentos').insert({
        cliente_id: context.userId,
        agendamento_id: data.agendamentoId ?? null,
        descricao: data.descricao,
        valor_cents: data.amountInCents,
        status: 'pendente',
        environment: data.environment,
      }).select('id').single();

      const session = await stripe.checkout.sessions.create({
        line_items: [{
          price_data: {
            currency: 'brl',
            product_data: { name: data.descricao },
            unit_amount: data.amountInCents,
          },
          quantity: 1,
        }],
        mode: 'payment',
        ui_mode: 'embedded_page',
        return_url: data.returnUrl,
        customer: customerId,
        payment_intent_data: { description: data.descricao },
        metadata: {
          userId: context.userId,
          pagamentoId: pag?.id ?? '',
          agendamentoId: data.agendamentoId ?? '',
        },
      });

      // Guarda session_id
      if (pag?.id) {
        await context.supabase.from('pagamentos').update({ stripe_session_id: session.id }).eq('id', pag.id);
      }

      return { clientSecret: session.client_secret ?? '' };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });