import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { getStripe, getStripeEnvironment } from '@/lib/stripe';
import { createServicoCheckout } from '@/lib/payments.functions';

interface Props {
  descricao: string;
  amountInCents: number;
  agendamentoId?: string;
  returnUrl?: string;
}

export function StripeEmbeddedCheckout_Servico({ descricao, amountInCents, agendamentoId, returnUrl }: Props) {
  const fetchClientSecret = async (): Promise<string> => {
    const result = await createServicoCheckout({
      data: {
        descricao,
        amountInCents,
        agendamentoId,
        returnUrl: returnUrl || `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
        environment: getStripeEnvironment(),
      },
    });
    if ('error' in result) throw new Error(result.error);
    if (!result.clientSecret) throw new Error('Stripe não retornou clientSecret');
    return result.clientSecret;
  };
  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}