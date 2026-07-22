import { createFileRoute } from '@tanstack/react-router';
import { type StripeEnv, verifyWebhook } from '@/lib/stripe.server';

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

  switch (event.type) {
    case 'checkout.session.completed':
    case 'transaction.completed': {
      const obj = event.data.object as any;
      const pagamentoId = obj?.metadata?.pagamentoId;
      const agendamentoId = obj?.metadata?.agendamentoId;
      if (pagamentoId) {
        await supabaseAdmin.from('pagamentos').update({
          status: 'pago',
          metodo: 'stripe',
          updated_at: new Date().toISOString(),
        }).eq('id', pagamentoId);
      }
      if (agendamentoId) {
        await supabaseAdmin.from('agendamentos').update({ status: 'confirmado' }).eq('id', agendamentoId);
      }
      break;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as any;
      const userId = sub.metadata?.userId;
      if (!userId) break;
      const item = sub.items?.data?.[0];
      const priceId = item?.price?.lookup_key || item?.price?.metadata?.lovable_external_id || item?.price?.id;
      const periodEnd = item?.current_period_end ?? sub.current_period_end;
      const periodStart = item?.current_period_start ?? sub.current_period_start;
      await supabaseAdmin.from('subscriptions').upsert({
        user_id: userId,
        stripe_subscription_id: sub.id,
        stripe_customer_id: sub.customer,
        product_id: item?.price?.product ?? '',
        price_id: priceId ?? '',
        status: sub.status,
        current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        cancel_at_period_end: sub.cancel_at_period_end || false,
        environment: env,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'stripe_subscription_id' });
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as any;
      await supabaseAdmin.from('subscriptions').update({
        status: 'canceled', updated_at: new Date().toISOString(),
      }).eq('stripe_subscription_id', sub.id).eq('environment', env);
      break;
    }
    default:
      console.log('[stripe webhook] unhandled', event.type);
  }
}

export const Route = createFileRoute('/api/public/payments/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get('env');
        if (rawEnv !== 'sandbox' && rawEnv !== 'live') {
          return Response.json({ received: true, ignored: 'invalid env' });
        }
        try {
          await handleWebhook(request, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error('[stripe webhook] error', e);
          return new Response('Webhook error', { status: 400 });
        }
      },
    },
  },
});