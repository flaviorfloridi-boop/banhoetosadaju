import logoAsset from "@/assets/logo-banho-tosa-ju.png.asset.json";

export function SiteFooter() {
  return (
    <footer className="bg-ink text-surface/60 py-12 px-6 md:px-8 mt-12">
      <div className="max-w-7xl mx-auto grid gap-8 md:grid-cols-3 items-start">
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
        <div className="text-sm space-y-2">
          <p className="text-surface font-semibold">Contato</p>
          <a href="https://wa.me/5511944811381" target="_blank" rel="noreferrer" className="block hover:text-surface transition">WhatsApp (11) 94481-1381</a>
          <a href="https://instagram.com/banhoetosadajuu" target="_blank" rel="noreferrer" className="block hover:text-surface transition">@banhoetosadajuu</a>
        </div>
        <div className="text-xs md:text-right space-y-2">
          <div className="flex md:justify-end gap-5 font-medium">
            <a href="#" className="hover:text-surface transition">Privacidade</a>
            <a href="#" className="hover:text-surface transition">Termos</a>
          </div>
          <p>© {new Date().getFullYear()} Banho &amp; Tosa da JU</p>
        </div>
      </div>
    </footer>
  );
}