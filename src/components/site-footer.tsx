import logoAsset from "@/assets/logo-banho-tosa-ju.png.asset.json";
import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="relative bg-ink text-surface/60 py-14 md:py-16 px-6 md:px-8 mt-20 overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 60% 70% at 10% 0%, color-mix(in oklab, var(--brand) 45%, transparent), transparent 70%), radial-gradient(ellipse 50% 60% at 95% 100%, color-mix(in oklab, var(--accent) 35%, transparent), transparent 70%)",
        }}
      />
      <div className="relative max-w-7xl mx-auto grid gap-10 md:grid-cols-3 items-start">
        <div className="flex items-center gap-3 text-surface">
          <img
            src={logoAsset.url}
            alt="Banho & Tosa da JU"
            width={64}
            height={64}
            className="h-14 w-auto object-contain bg-white rounded-2xl p-1"
          />
          <span className="font-serif text-xl font-bold">Banho &amp; Tosa da JU</span>
        </div>
        <div className="text-sm space-y-2.5">
          <p className="text-surface font-semibold tracking-wide uppercase text-xs">Contato</p>
          <a href="https://wa.me/5511944811381" target="_blank" rel="noreferrer" className="block w-fit hover:text-surface transition story-link">WhatsApp (11) 94481-1381</a>
          <a href="https://instagram.com/banhoetosadajuu" target="_blank" rel="noreferrer" className="block w-fit hover:text-surface transition story-link">@banhoetosadajuu</a>
        </div>
        <div className="text-xs md:text-right space-y-3">
          <div className="flex md:justify-end gap-5 font-medium">
            <Link to="/privacidade" className="hover:text-surface transition">Privacidade</Link>
          </div>
          <p className="text-surface/45">© {new Date().getFullYear()} Banho &amp; Tosa da JU</p>
        </div>
      </div>
      <div className="relative max-w-7xl mx-auto mt-10 pt-6 border-t border-surface/10 text-[11px] text-surface/40">
        Feito com carinho para os pets de São Paulo 🐾
      </div>
    </footer>
  );
}