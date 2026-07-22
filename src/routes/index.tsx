import { createFileRoute, Link } from "@tanstack/react-router";
import heroImg from "@/assets/hero-dog-bath.jpg";
import groomingImg from "@/assets/service-grooming.jpg";
import taxiImg from "@/assets/service-taxidog.jpg";
import spaImg from "@/assets/service-spa.jpg";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen bg-surface text-ink">
      <SiteHeader />

      {/* Hero */}
      <section className="px-6 md:px-8 py-12 md:py-20 max-w-7xl mx-auto grid md:grid-cols-2 gap-10 md:gap-16 items-center">
        <div>
          <span className="bg-brand/10 text-brand px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
            Especialistas em bem-estar
          </span>
          <h1 className="font-serif text-4xl md:text-6xl mt-6 leading-[1.1]">
            Carinho que seu <span className="italic text-accent">pet sente</span>, confiança que você merece.
          </h1>
          <p className="mt-6 text-lg text-ink/70 leading-relaxed max-w-md">
            Banho, tosa e cuidados especiais com Taxi Dog integrado. O spa
            completo para o seu melhor amigo.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/auth"
              className="bg-brand text-primary-foreground px-6 md:px-8 py-3 md:py-4 rounded-2xl font-bold hover:opacity-90 transition"
            >
              Agendar banho
            </Link>
            <a
              href="#servicos"
              className="border border-brand/20 px-6 md:px-8 py-3 md:py-4 rounded-2xl font-bold hover:bg-brand/5 transition"
            >
              Nossos serviços
            </a>
          </div>
        </div>
        <div className="relative">
          <img
            src={heroImg}
            alt="Golden retriever feliz durante banho"
            width={1024}
            height={1280}
            className="w-full aspect-[4/5] object-cover rounded-[40px] shadow-xl"
          />
          <div className="absolute -bottom-6 -left-4 md:-left-6 bg-card p-5 rounded-3xl shadow-xl max-w-[220px] border border-border">
            <div className="text-accent mb-1">★★★★★</div>
            <p className="text-sm font-medium italic">
              "O Bob volta sempre cheiroso e feliz. O Taxi Dog é vida!"
            </p>
            <p className="text-[10px] mt-2 text-ink/40">— Mariana &amp; Bob</p>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="servicos" className="bg-brand-light py-20 md:py-24 px-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-12 md:mb-16">
            <h2 className="font-serif text-3xl md:text-4xl">Serviços premium</h2>
            <p className="text-ink/60 max-w-xs text-sm">
              Equipamentos modernos e produtos hipoalergênicos para todas as raças.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            <ServiceCard n="01" title="Banho e Tosa" desc="Corte na tesoura ou máquina, hidratação profunda e limpeza de ouvidos." img={groomingImg} />
            <ServiceCard n="02" title="Taxi Dog" desc="Buscamos e entregamos seu pet com segurança em veículos climatizados." img={taxiImg} highlight />
            <ServiceCard n="03" title="Spa Relaxante" desc="Aromaterapia, massagem relaxante e banhos terapêuticos para pets ansiosos." img={spaImg} />
          </div>
        </div>
      </section>

      {/* Portals CTA */}
      <section className="py-20 md:py-24 px-6 md:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="bg-card rounded-3xl p-8 shadow-sm border border-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-xl">Área do Tutor</h3>
              <span className="text-xs bg-brand-light text-brand px-3 py-1 rounded-lg font-bold uppercase">Cliente</span>
            </div>
            <p className="text-ink/70 mb-6">Cadastre seus pets, agende banho e tosa e solicite o Taxi Dog em poucos cliques.</p>
            <Link to="/auth" className="inline-block bg-brand text-primary-foreground px-6 py-3 rounded-xl font-bold hover:opacity-90 transition">
              Entrar como tutor
            </Link>
          </div>
          <div className="bg-brand text-primary-foreground rounded-3xl p-8 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-xl">Portal da Equipe</h3>
              <span className="text-xs bg-white/20 px-3 py-1 rounded-lg font-bold uppercase">Funcionário</span>
            </div>
            <p className="text-primary-foreground/80 mb-6">Agenda do dia, gestão de banhos, tosas e roteiro do Taxi Dog em tempo real.</p>
            <Link to="/auth" className="inline-block bg-surface text-brand px-6 py-3 rounded-xl font-bold hover:opacity-90 transition">
              Acessar portal
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function ServiceCard({ n, title, desc, img, highlight }: { n: string; title: string; desc: string; img: string; highlight?: boolean }) {
  return (
    <div className={highlight ? "bg-brand text-primary-foreground p-8 rounded-[32px]" : "bg-surface p-8 rounded-[32px] border border-brand/5"}>
      <div className={"size-12 rounded-2xl mb-6 grid place-items-center font-bold " + (highlight ? "bg-white/10" : "bg-brand/10 text-brand")}>
        {n}
      </div>
      <h3 className="font-serif text-2xl mb-3">{title}</h3>
      <p className={"text-sm mb-6 " + (highlight ? "text-primary-foreground/80" : "text-ink/70")}>{desc}</p>
      <img src={img} alt={title} width={800} height={600} loading="lazy" className="w-full aspect-video object-cover rounded-2xl" />
    </div>
  );
}
