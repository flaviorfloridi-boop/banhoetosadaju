import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Typed wrapper for the beta supabase.auth.oauth namespace.
type OAuthDetails = {
  client?: { name?: string; redirect_uris?: string[] } | null;
  scope?: string;
  redirect_url?: string;
  redirect_to?: string;
};
interface OAuthNamespace {
  getAuthorizationDetails: (id: string) => Promise<{ data: OAuthDetails | null; error: Error | null }>;
  approveAuthorization: (id: string) => Promise<{ data: { redirect_url?: string; redirect_to?: string } | null; error: Error | null }>;
  denyAuthorization: (id: string) => Promise<{ data: { redirect_url?: string; redirect_to?: string } | null; error: Error | null }>;
}
function oauthApi(): OAuthNamespace {
  return (supabase.auth as unknown as { oauth: OAuthNamespace }).oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("authorization_id ausente");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/auth", search: { next } as never });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauthApi().getAuthorizationDetails(authorizationId);
    if (error) throw error;
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="min-h-screen grid place-items-center bg-surface p-6">
      <div className="max-w-md bg-card border border-border rounded-3xl p-8 text-center">
        <h1 className="font-serif text-2xl mb-2">Não foi possível carregar a autorização</h1>
        <p className="text-sm text-ink/60">{String((error as Error)?.message ?? error)}</p>
      </div>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(approve: boolean) {
    setBusy(true);
    const api = oauthApi();
    const { data, error } = approve
      ? await api.approveAuthorization(authorization_id)
      : await api.denyAuthorization(authorization_id);
    if (error) { setBusy(false); setError(error.message); return; }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) { setBusy(false); setError("Servidor OAuth não retornou redirect."); return; }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? "um aplicativo";

  return (
    <main className="min-h-screen grid place-items-center bg-surface p-6">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl p-8 shadow-sm">
        <h1 className="font-serif text-2xl mb-2">Conectar {clientName} à sua conta</h1>
        <p className="text-sm text-ink/70 mb-4">
          Isso permite que <strong>{clientName}</strong> use o Banho & Tosa da JU como você — ler seus
          pets, agendamentos, pagamentos e criar novas solicitações em seu nome.
        </p>
        <p className="text-xs text-ink/50 mb-6">
          As permissões do sistema (RLS) continuam valendo — o cliente só acessa dados da sua própria conta.
        </p>
        {error && <p className="text-sm text-destructive mb-3" role="alert">{error}</p>}
        <div className="flex gap-3">
          <button disabled={busy} onClick={() => decide(false)}
            className="flex-1 py-3 rounded-xl border border-border font-bold disabled:opacity-50">
            Negar
          </button>
          <button disabled={busy} onClick={() => decide(true)}
            className="flex-1 py-3 rounded-xl bg-brand text-primary-foreground font-bold disabled:opacity-50">
            {busy ? "Aguarde..." : "Aprovar"}
          </button>
        </div>
      </div>
    </main>
  );
}