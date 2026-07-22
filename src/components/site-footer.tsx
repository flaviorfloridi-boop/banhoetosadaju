import logo from "@/assets/logo.png";

export function SiteFooter() {
  return (
    <footer className="bg-ink text-surface/60 py-12 px-6 md:px-8 mt-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2 text-surface">
          <img src={logo} alt="Pata & Arte" width={28} height={28} className="size-7 rounded-md bg-surface p-0.5" />
          <span className="font-serif text-xl font-bold">Pata &amp; Arte</span>
        </div>
        <div className="flex gap-6 text-xs font-medium">
          <a href="#" className="hover:text-surface transition">Privacidade</a>
          <a href="#" className="hover:text-surface transition">Termos</a>
          <a href="#" className="hover:text-surface transition">Contato</a>
        </div>
        <p className="text-[11px]">© {new Date().getFullYear()} Pata &amp; Arte Pet Shop</p>
      </div>
    </footer>
  );
}