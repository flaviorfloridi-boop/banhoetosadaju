import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo.png";
import { useAuth, routeForRole } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export function SiteHeader() {
  const { user, profile } = useAuth();
  const portalHref = routeForRole(profile?.role);

  return (
    <nav className="flex items-center justify-between px-6 md:px-8 py-4 md:py-6 border-b border-brand/10 bg-surface/90 backdrop-blur sticky top-0 z-30">
      <Link to="/" className="flex items-center gap-2">
        <img src={logo} alt="Pata & Arte" width={40} height={40} className="size-10 rounded-xl" />
        <span className="font-serif text-xl md:text-2xl font-bold tracking-tight">Pata &amp; Arte</span>
      </Link>
      <div className="hidden md:flex gap-8 text-sm font-medium">
        <Link to="/" className="hover:text-accent transition">Início</Link>
        <a href="/#servicos" className="hover:text-accent transition">Serviços</a>
        {user ? (
          <Link to={portalHref} className="hover:text-accent transition">Meu portal</Link>
        ) : (
          <Link to="/auth" className="hover:text-accent transition">Entrar</Link>
        )}
      </div>
      {user ? (
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = "/";
          }}
          className="bg-accent text-accent-foreground px-4 md:px-6 py-2 md:py-2.5 rounded-full text-sm font-semibold shadow-sm hover:opacity-90 transition"
        >
          Sair
        </button>
      ) : (
        <Link
          to="/auth"
          className="bg-accent text-accent-foreground px-4 md:px-6 py-2 md:py-2.5 rounded-full text-sm font-semibold shadow-sm hover:opacity-90 transition"
        >
          Agendar
        </Link>
      )}
    </nav>
  );
}