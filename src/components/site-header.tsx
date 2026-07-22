import { Link } from "@tanstack/react-router";
import logoAsset from "@/assets/logo-banho-tosa-ju.png.asset.json";
import { useAuth, routeForRole } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export function SiteHeader() {
  const { user, profile } = useAuth();
  const portalHref = routeForRole(profile?.role);

  return (
    <header className="border-b border-brand/10 bg-surface/95 backdrop-blur sticky top-0 z-30">
      <div className="relative grid grid-cols-3 items-center px-6 md:px-8 py-3">
        {/* Left nav */}
        <nav className="hidden md:flex gap-6 text-sm font-medium">
          <Link to="/" className="hover:text-accent transition">Início</Link>
          <a href="/#servicos" className="hover:text-accent transition">Serviços</a>
          <a href="/#taxi" className="hover:text-accent transition">Taxi Dog</a>
        </nav>
        <div className="md:hidden" />

        {/* Centered logo */}
        <Link to="/" className="flex items-center justify-center col-start-2 justify-self-center">
          <img
            src={logoAsset.url}
            alt="Banho & Tosa da JU"
            width={140}
            height={140}
            className="h-14 md:h-16 w-auto object-contain"
          />
          <span className="sr-only">Banho &amp; Tosa da JU</span>
        </Link>

        {/* Right actions */}
        <div className="flex items-center justify-end gap-3">
          {user ? (
            <>
              <Link to={portalHref} className="hidden md:inline text-sm font-medium hover:text-accent transition">
                Meu portal
              </Link>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = "/";
                }}
                className="bg-brand text-primary-foreground px-4 md:px-5 py-2 rounded-full text-sm font-semibold shadow-sm hover:opacity-90 transition"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link to="/auth" className="hidden md:inline text-sm font-medium hover:text-accent transition">
                Entrar
              </Link>
              <Link
                to="/auth"
                className="bg-brand text-primary-foreground px-4 md:px-5 py-2 rounded-full text-sm font-semibold shadow-sm hover:opacity-90 transition"
              >
                Agendar
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}