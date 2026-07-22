import logoAsset from "@/assets/logo-banho-tosa-ju.png.asset.json";

export function SiteFooter() {
  return (
    <footer className="bg-ink text-surface/60 py-12 px-6 md:px-8 mt-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-3 text-surface">
          <img
            src={logoAsset.url}
            alt="Banho & Tosa da JU"
            width={40}
            height={40}
            className="size-10 rounded-full bg-white object-contain p-0.5"
          />
          <span className="font-serif text-xl font-bold">Banho &amp; Tosa da JU</span>
        </div>
        <div className="flex gap-6 text-xs font-medium">
          <a href="#" className="hover:text-surface transition">Privacidade</a>
          <a href="#" className="hover:text-surface transition">Termos</a>
          <a href="#" className="hover:text-surface transition">Contato</a>
        </div>
        <p className="text-[11px]">© {new Date().getFullYear()} Banho &amp; Tosa da JU</p>
      </div>
    </footer>
  );
}