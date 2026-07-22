import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/checkout/return')({
  head: () => ({ meta: [
    { title: 'Pagamento concluído — Banho & Tosa da JU' },
    { name: 'robots', content: 'noindex' },
  ]}),
  validateSearch: (s: Record<string, unknown>) => ({
    session_id: typeof s.session_id === 'string' ? s.session_id : undefined,
  }),
  component: Return,
});

function Return() {
  const { session_id } = Route.useSearch();
  return (
    <div className="min-h-screen grid place-items-center bg-surface p-6">
      <div className="max-w-md text-center bg-card border border-border rounded-3xl p-10 shadow-sm">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="font-serif text-3xl mb-3">Pagamento recebido!</h1>
        <p className="text-ink/70 mb-6">
          {session_id ? 'Já registramos seu pagamento. Em instantes ele aparece na sua área de pagamentos.' : 'Obrigado!'}
        </p>
        <Link to="/cliente" className="inline-block bg-brand text-primary-foreground px-6 py-3 rounded-xl font-bold hover:opacity-90 transition">
          Voltar ao meu portal
        </Link>
      </div>
    </div>
  );
}