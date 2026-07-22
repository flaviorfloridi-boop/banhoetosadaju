import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { fetchProfileRole, routeForRole } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import logoAsset from "@/assets/logo-banho-tosa-ju.png.asset.json";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Pata & Arte" },
      { name: "description", content: "Acesse sua conta na Pata & Arte para agendar banho, tosa e Taxi Dog." },
      { property: "og:title", content: "Entrar — Pata & Arte" },
      { property: "og:description", content: "Acesse sua conta na Pata & Arte." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [busy, setBusy] = useState(false);

  // If already logged in, route by role
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        const role = await fetchProfileRole(data.session.user.id);
        navigate({ to: routeForRole(role), replace: true });
      }
    });
  }, [navigate]);

  async function afterAuth(userId: string) {
    const role = await fetchProfileRole(userId);
    navigate({ to: routeForRole(role), replace: true });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { nome, telefone },
          },
        });
        if (error) throw error;
        if (data.user && !data.session) {
          toast.success("Cadastro criado! Verifique seu e-mail para confirmar.");
          return;
        }
        if (data.user) await afterAuth(data.user.id);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) await afterAuth(data.user.id);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao autenticar");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/auth",
    });
    if (result.error) {
      toast.error("Erro no login com Google");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    const { data } = await supabase.auth.getUser();
    if (data.user) await afterAuth(data.user.id);
    setBusy(false);
  }

  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center px-4 py-10">
      <Toaster />
      <div className="w-full max-w-md bg-card rounded-3xl shadow-xl border border-border p-8">
        <div className="flex flex-col items-center mb-6">
          <img src={logoAsset.url} alt="Banho & Tosa da JU" width={80} height={80} className="size-20 rounded-full bg-white object-contain p-1 shadow-sm" />
          <h1 className="font-serif text-2xl mt-3">Banho &amp; Tosa da JU</h1>
          <p className="text-sm text-ink/60 mt-1">
            {mode === "login" ? "Entre para acessar seu portal" : "Crie sua conta de tutor"}
          </p>
        </div>

        <button
          onClick={handleGoogle}
          disabled={busy}
          type="button"
          className="w-full mb-4 flex items-center justify-center gap-2 border border-border rounded-xl py-3 font-medium hover:bg-brand-light transition disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.5 2.4 30.1 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.8 6C12.3 13.1 17.6 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.6c0-1.6-.1-3-.4-4.6H24v9h12.7c-.6 3-2.3 5.5-4.9 7.2l7.6 5.9c4.5-4.2 7.1-10.4 7.1-17.5z"/><path fill="#FBBC05" d="M10.4 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.3.8-4.7l-7.8-6C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.7l7.8-6z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.8 2.3-8.3 2.3-6.4 0-11.7-3.6-13.6-8.7l-7.8 6C6.5 42.6 14.6 48 24 48z"/></svg>
          Continuar com Google
        </button>

        <div className="relative my-4 text-center">
          <span className="bg-card px-3 text-xs text-ink/50 relative z-10">ou</span>
          <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <>
              <input
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome"
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
              <input
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="Telefone (opcional)"
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </>
          )}
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            className="w-full px-4 py-3 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
          <input
            required
            minLength={6}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            className="w-full px-4 py-3 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
          <button
            disabled={busy}
            type="submit"
            className="w-full bg-brand text-primary-foreground rounded-xl py-3 font-bold hover:opacity-90 transition disabled:opacity-50"
          >
            {busy ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <p className="text-center text-sm text-ink/60 mt-4">
          {mode === "login" ? "Ainda não tem conta?" : "Já tem conta?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-accent font-bold hover:underline"
          >
            {mode === "login" ? "Cadastre-se" : "Entrar"}
          </button>
        </p>
      </div>
    </div>
  );
}