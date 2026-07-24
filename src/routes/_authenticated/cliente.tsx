import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { waLink } from "@/lib/whatsapp";

function openExternal(url: string) {
  if (typeof window === "undefined") return;
  // Navega na mesma aba para evitar bloqueio de COOP (NS_ERROR_DOM_COOP_FAILED no Firefox)
  // ao abrir wa.me em um novo contexto de navegação.
  window.location.assign(url);
}

export const Route = createFileRoute("/_authenticated/cliente")({
  head: () => ({
    meta: [
      { title: "Meu portal — Pata & Arte" },
      { name: "description", content: "Gerencie seus pets, agendamentos e Taxi Dog." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ClientePortal,
});

interface Pet { id: string; nome: string; especie: string; raca: string | null; porte: string | null; }
interface Agendamento { id: string; data: string; horario: string; servico: string; status: string; pet_id: string; pacote_id: string | null; }
interface TaxiDog { id: string; data: string; horario: string; tipo: string; status: string; endereco_coleta: string; bairro: string; pet_id: string; }
interface Preco { chave: string; nome: string; categoria: string; valor_cents: number; descricao: string | null; }
interface PetPhoto { id: string; pet_id: string; storage_path: string; legenda: string | null; created_at: string; }
interface Pacote { id: string; total_banhos: number; banhos_usados: number; mes_referencia: string; ativo: boolean; periodicidade: string; periodo_inicio: string; periodo_fim: string; status_pagamento: string; }

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ClientePortal() {
  const { profile, user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [ags, setAgs] = useState<Agendamento[]>([]);
  const [taxis, setTaxis] = useState<TaxiDog[]>([]);
  const [precos, setPrecos] = useState<Preco[]>([]);
  const [photos, setPhotos] = useState<PetPhoto[]>([]);
  const [pacote, setPacote] = useState<Pacote | null>(null);
  const [limiteDia, setLimiteDia] = useState<number>(15);
  const [tab, setTab] = useState<"pets" | "agendar" | "taxi" | "precos" | "fotos">("pets");

  useEffect(() => {
    if (!user) return;
    void loadAll();
  }, [user]);

  async function loadAll() {
    const [p, a, t, pr, ph, cfg, pac] = await Promise.all([
      supabase.from("pets").select("*").order("created_at"),
      supabase.from("agendamentos").select("*").order("data", { ascending: false }).limit(20),
      supabase.from("taxi_dog").select("*").order("data", { ascending: false }).limit(20),
      supabase.from("service_prices").select("chave,nome,categoria,valor_cents,descricao").eq("ativo", true).order("ordem"),
      supabase.from("pet_photos").select("id,pet_id,storage_path,legenda,created_at").order("created_at", { ascending: false }),
      supabase.from("app_settings").select("valor").eq("chave", "limite_banhos_dia").maybeSingle(),
      supabase.from("pacotes_cliente").select("id,total_banhos,banhos_usados,mes_referencia,ativo,periodicidade,periodo_inicio,periodo_fim,status_pagamento")
        .eq("ativo", true).gte("periodo_fim", today()).order("periodo_fim", { ascending: false }).limit(1).maybeSingle(),
    ]);
    setPets((p.data as Pet[]) ?? []);
    setAgs((a.data as Agendamento[]) ?? []);
    setTaxis((t.data as TaxiDog[]) ?? []);
    setPrecos((pr.data as Preco[]) ?? []);
    setPhotos((ph.data as PetPhoto[]) ?? []);
    setPacote((pac.data as Pacote | null) ?? null);
    const v = cfg.data?.valor as number | undefined;
    if (typeof v === "number") setLimiteDia(v);
  }

  return (
    <div className="min-h-screen bg-surface">
      <Toaster />
      <SiteHeader />
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl">Olá, {profile?.nome || "tutor"} 👋</h1>
            <p className="text-ink/60 text-sm mt-1">Pets, agendamentos, Taxi Dog, preços e fotos</p>
          </div>
          {(profile?.role === "funcionario" || profile?.role === "admin") && (
            <Link to="/equipe" className="text-sm text-accent font-bold hover:underline">Ir para portal da equipe →</Link>
          )}
        </div>

        {pacote && <PacoteCard pacote={pacote} ags={ags} />}

        <div className="flex gap-2 border-b border-border mb-6 overflow-x-auto">
          <TabBtn active={tab === "pets"} onClick={() => setTab("pets")}>Meus pets</TabBtn>
          <TabBtn active={tab === "agendar"} onClick={() => setTab("agendar")}>Agendar</TabBtn>
          <TabBtn active={tab === "taxi"} onClick={() => setTab("taxi")}>Taxi Dog</TabBtn>
          <TabBtn active={tab === "precos"} onClick={() => setTab("precos")}>Preços</TabBtn>
          <TabBtn active={tab === "fotos"} onClick={() => setTab("fotos")}>Fotos do meu pet</TabBtn>
        </div>

        {tab === "pets" && <PetsTab pets={pets} onChange={loadAll} />}
        {tab === "agendar" && <AgendarTab pets={pets} ags={ags} precos={precos} limiteDia={limiteDia} pacote={pacote} />}
        {tab === "taxi" && <TaxiTab pets={pets} taxis={taxis} ags={ags} onChange={loadAll} userId={user?.id} />}
        {tab === "precos" && <PrecosTab precos={precos} />}
        {tab === "fotos" && <FotosTab photos={photos} pets={pets} />}
      </div>
    </div>
  );
}

function PacoteCard({ pacote, ags }: { pacote: Pacote; ags: Agendamento[] }) {
  const restantes = Math.max(pacote.total_banhos - pacote.banhos_usados, 0);
  const esgotado = restantes === 0;
  const ultimoBanho = restantes === 1;
  const pct = Math.min((pacote.banhos_usados / pacote.total_banhos) * 100, 100);
  const label = pacote.periodicidade === "quinzenal" ? "Pacote quinzenal" : "Pacote mensal";
  const periodoFmt =
    new Date(pacote.periodo_inicio + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) +
    " – " +
    new Date(pacote.periodo_fim + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  const datasDoPacote = ags
    .filter((a) => a.pacote_id === pacote.id)
    .sort((a, b) => a.data.localeCompare(b.data));

  return (
    <div className="bg-card border border-border rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <h3 className="font-serif text-lg">{label}</h3>
        <span className="text-sm font-bold text-brand">
          {pacote.banhos_usados} de {pacote.total_banhos} banhos usados
        </span>
      </div>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <p className="text-xs text-ink/50">Ciclo: {periodoFmt}</p>
        {pacote.status_pagamento === "pago" ? (
          <span className="text-[11px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Pagamento em dia</span>
        ) : pacote.status_pagamento === "atrasado" ? (
          <span className="text-[11px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">Pagamento atrasado</span>
        ) : (
          <span className="text-[11px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full">Pagamento pendente</span>
        )}
      </div>
      <div className="w-full h-3 rounded-full bg-surface border border-border overflow-hidden">
        <div
          className={"h-full rounded-full transition-all " + (esgotado ? "bg-destructive" : "bg-brand")}
          style={{ width: `${pct}%` }}
        />
      </div>
      {ultimoBanho && (
        <p className="mt-3 text-sm font-bold text-accent bg-accent/10 rounded-lg px-3 py-2">
          ⚠️ Este é o seu último banho disponível neste ciclo! Os próximos serão avulsos, a menos que renove.
        </p>
      )}
      {esgotado && (
        <p className="mt-3 text-sm font-bold text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          🔔 Seu pacote já foi todo utilizado. Os próximos banhos serão cobrados avulsos — fale com a gente para renovar.
        </p>
      )}
      {!ultimoBanho && !esgotado && (
        <p className="mt-2 text-xs text-ink/50">Restam {restantes} banho(s) disponível(is) neste ciclo.</p>
      )}
      {datasDoPacote.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border">
          <p className="text-xs font-bold text-ink/60 mb-2">Datas deste pacote</p>
          <ul className="space-y-1.5">
            {datasDoPacote.map((a) => (
              <li key={a.id} className="flex items-center justify-between text-xs">
                <span>{new Date(a.data + "T00:00:00").toLocaleDateString("pt-BR")} às {a.horario.slice(0, 5)} — {a.servico.replace(/_/g, " ")}</span>
                <StatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function TabBtn({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={"px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition " + (active ? "border-brand text-brand" : "border-transparent text-ink/50 hover:text-ink")}
    >
      {children}
    </button>
  );
}

function PetsTab({ pets, onChange }: { pets: Pet[]; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [especie, setEspecie] = useState("cachorro");
  const [raca, setRaca] = useState("");
  const [porte, setPorte] = useState("");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("pets").insert({
      tutor_id: u.user.id, nome, especie, raca: raca || null, porte: porte || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Pet cadastrado!");
    setNome(""); setRaca(""); setPorte(""); setOpen(false); onChange();
  }

  async function remove(id: string) {
    if (!confirm("Remover este pet?")) return;
    const { error } = await supabase.from("pets").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Removido"); onChange();
  }

  return (
    <div className="space-y-4">
      {pets.length === 0 && !open && (
        <div className="bg-card border border-border rounded-2xl p-8 text-center text-ink/60">
          Você ainda não cadastrou pets.
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        {pets.map((p) => (
          <div key={p.id} className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
            <div className="size-12 rounded-full bg-accent/20 grid place-items-center text-accent font-bold">
              {p.nome[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-bold">{p.nome}</p>
              <p className="text-xs text-ink/50">{p.especie}{p.raca ? ` • ${p.raca}` : ""}{p.porte ? ` • porte ${p.porte}` : ""}</p>
            </div>
            <button onClick={() => remove(p.id)} className="text-xs text-destructive hover:underline">Remover</button>
          </div>
        ))}
      </div>
      {!open ? (
        <button onClick={() => setOpen(true)} className="w-full py-4 border-2 border-dashed border-brand/30 rounded-2xl text-sm font-bold text-brand hover:bg-brand/5 transition">
          + Cadastrar novo pet
        </button>
      ) : (
        <form onSubmit={add} className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <input required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do pet" className="w-full px-4 py-2 rounded-lg border border-border bg-surface" />
          <div className="grid grid-cols-2 gap-3">
            <select value={especie} onChange={(e) => setEspecie(e.target.value)} className="px-4 py-2 rounded-lg border border-border bg-surface">
              <option value="cachorro">Cachorro</option>
              <option value="gato">Gato</option>
            </select>
            <select value={porte} onChange={(e) => setPorte(e.target.value)} className="px-4 py-2 rounded-lg border border-border bg-surface">
              <option value="">Porte</option>
              <option value="pequeno">Pequeno</option>
              <option value="medio">Médio</option>
              <option value="grande">Grande</option>
            </select>
          </div>
          <input value={raca} onChange={(e) => setRaca(e.target.value)} placeholder="Raça (opcional)" className="w-full px-4 py-2 rounded-lg border border-border bg-surface" />
          <div className="flex gap-2">
            <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2 rounded-lg border border-border font-bold">Cancelar</button>
            <button type="submit" className="flex-1 py-2 rounded-lg bg-brand text-primary-foreground font-bold">Salvar</button>
          </div>
        </form>
      )}
    </div>
  );
}

const HORARIOS_DISPONIVEIS = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

function AgendarTab({ pets, ags, precos, limiteDia, pacote }: { pets: Pet[]; ags: Agendamento[]; precos: Preco[]; limiteDia: number; pacote: Pacote | null }) {
  const [petId, setPetId] = useState("");
  const [servico, setServico] = useState("banho");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [obs, setObs] = useState("");
  const [ocupacao, setOcupacao] = useState<number | null>(null);
  const [horariosOcupados, setHorariosOcupados] = useState<Set<string>>(new Set());
  const restantesPacote = pacote ? Math.max(pacote.total_banhos - pacote.banhos_usados, 0) : 0;
  const [usarPacote, setUsarPacote] = useState(restantesPacote > 0);

  useEffect(() => {
    setOcupacao(null);
    setHorario("");
    setHorariosOcupados(new Set());
    if (!data) return;
    (async () => {
      const [countRes, horariosRes] = await Promise.all([
        supabase.from("agendamentos").select("id", { count: "exact", head: true }).eq("data", data).neq("status", "cancelado"),
        supabase.from("agendamentos").select("horario").eq("data", data).neq("status", "cancelado"),
      ]);
      setOcupacao(countRes.count ?? 0);
      const ocupados = new Set((horariosRes.data ?? []).map((r) => (r as { horario: string }).horario.slice(0, 5)));
      setHorariosOcupados(ocupados);
    })();
  }, [data]);

  const cheio = ocupacao !== null && ocupacao >= limiteDia;
  const servicos = precos.filter((p) => p.categoria === "servico" || p.categoria === "banho" || p.categoria === "tosa");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!petId) return;
    if (!horario) { toast.error("Escolha um horário disponível."); return; }
    if (cheio) { toast.error(`Dia lotado (${ocupacao}/${limiteDia}). Escolha outra data.`); return; }
    const pet = pets.find((p) => p.id === petId);
    const dataFmt = new Date(data + "T00:00:00").toLocaleDateString("pt-BR");
    const usaPacoteNesse = usarPacote && restantesPacote > 0;
    const msg =
      `Olá! Gostaria de agendar um horário 🐾\n\n` +
      `• Pet: ${pet?.nome ?? ""}\n` +
      `• Serviço: ${servico.replace(/_/g, " ")}\n` +
      `• Data: ${dataFmt}\n` +
      `• Horário: ${horario}\n` +
      (usaPacoteNesse ? `• Quero usar 1 banho do meu pacote ${pacote?.periodicidade === "quinzenal" ? "quinzenal" : "mensal"} (tenho ${restantesPacote} disponível)\n` : "") +
      (obs ? `• Observações: ${obs}\n` : "") +
      `\nPode confirmar pra mim? Obrigado!`;
    openExternal(waLink(null, msg));
    toast.success("Abrindo WhatsApp para confirmar seu horário…");
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-6 space-y-3">
        <h3 className="font-serif text-xl mb-2">Novo agendamento</h3>
        {pacote && restantesPacote > 0 && (
          <label className="flex items-start gap-2 bg-brand/5 border border-brand/20 rounded-lg px-3 py-2 text-sm cursor-pointer">
            <input type="checkbox" checked={usarPacote} onChange={(e) => setUsarPacote(e.target.checked)} className="mt-0.5" />
            <span>Usar 1 banho do meu pacote {pacote.periodicidade === "quinzenal" ? "quinzenal" : "mensal"} <span className="font-bold">({restantesPacote} disponível{restantesPacote > 1 ? "eis" : ""})</span></span>
          </label>
        )}
        {pacote && restantesPacote === 0 && (
          <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
            Seu pacote já foi todo usado neste ciclo — este agendamento será avulso.
          </p>
        )}
        <select required value={petId} onChange={(e) => setPetId(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-border bg-surface">
          <option value="">Escolha o pet</option>
          {pets.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
        <select value={servico} onChange={(e) => setServico(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-border bg-surface">
          <option value="banho">Banho</option>
          <option value="tosa">Tosa</option>
          <option value="banho_e_tosa">Banho + Tosa</option>
          <option value="tosa_higienica">Tosa higiênica</option>
          <option value="hidratacao">Hidratação</option>
        </select>
        <div className="grid grid-cols-2 gap-3">
          <input required type="date" value={data} onChange={(e) => setData(e.target.value)} min={new Date().toISOString().slice(0, 10)} className="px-4 py-2 rounded-lg border border-border bg-surface" />
        </div>
        {data && (
          <div>
            <p className="text-xs text-ink/50 mb-1.5">Horários disponíveis</p>
            <div className="grid grid-cols-4 gap-2">
              {HORARIOS_DISPONIVEIS.map((h) => {
                const ocupado = horariosOcupados.has(h);
                const selecionado = horario === h;
                return (
                  <button
                    key={h}
                    type="button"
                    disabled={ocupado}
                    onClick={() => setHorario(h)}
                    className={
                      "text-xs py-2 rounded-lg border font-bold transition " +
                      (ocupado
                        ? "border-border bg-surface text-ink/30 line-through cursor-not-allowed"
                        : selecionado
                          ? "border-brand bg-brand text-primary-foreground"
                          : "border-border bg-surface hover:border-brand/50")
                    }
                  >
                    {h}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {data && ocupacao !== null && (
          <p className={"text-xs " + (cheio ? "text-destructive font-bold" : "text-ink/60")}>
            {cheio ? `⚠️ Dia lotado (${ocupacao}/${limiteDia}). Escolha outra data.` : `${ocupacao}/${limiteDia} vagas ocupadas neste dia.`}
          </p>
        )}
        <textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2} placeholder="Observações (opcional)" className="w-full px-4 py-2 rounded-lg border border-border bg-surface" />
        <button disabled={!pets.length || cheio || !horario} type="submit" className="w-full py-3 rounded-xl bg-brand text-primary-foreground font-bold disabled:opacity-50">
          {!pets.length ? "Cadastre um pet primeiro" : cheio ? "Dia lotado" : !horario ? "Escolha um horário" : "Enviar pedido pelo WhatsApp"}
        </button>
        <p className="text-[11px] text-ink/50 text-center">O pagamento é combinado direto pelo WhatsApp. A equipe confirma o horário manualmente.</p>
        {servicos.length > 0 && (
          <details className="text-xs text-ink/60 mt-2">
            <summary className="cursor-pointer font-bold">Ver tabela de preços</summary>
            <ul className="mt-2 space-y-1">
              {servicos.map((s) => (
                <li key={s.chave} className="flex justify-between border-b border-border/50 py-1">
                  <span>{s.nome}</span>
                  <span className="font-mono">R$ {(s.valor_cents / 100).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </form>
      <div className="space-y-3">
        <h3 className="font-serif text-xl">Meus agendamentos</h3>
        {ags.length === 0 && <p className="text-ink/50 text-sm">Nenhum agendamento ainda.</p>}
        {ags.map((a) => {
          const pet = pets.find((p) => p.id === a.pet_id);
          return (
            <div key={a.id} className="bg-card border border-border rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="font-bold">{pet?.nome ?? "Pet"} — {a.servico.replace(/_/g, " ")}</p>
                <p className="text-xs text-ink/50">{new Date(a.data).toLocaleDateString("pt-BR")} às {a.horario.slice(0,5)}</p>
              </div>
              <StatusBadge status={a.status} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TaxiTab({ pets, taxis, ags, onChange, userId }: { pets: Pet[]; taxis: TaxiDog[]; ags: Agendamento[]; onChange: () => void; userId?: string }) {
  const [petId, setPetId] = useState("");
  const [endereco, setEndereco] = useState("");
  const [bairro, setBairro] = useState("");
  const [ref, setRef] = useState("");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [tipo, setTipo] = useState("coleta_e_entrega");
  const [agId, setAgId] = useState("");
  const [obs, setObs] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !petId) return;
    const { error } = await supabase.from("taxi_dog").insert({
      cliente_id: userId, pet_id: petId, endereco_coleta: endereco, bairro,
      ponto_referencia: ref || null, data, horario,
      tipo: tipo as "coleta" | "entrega" | "coleta_e_entrega",
      agendamento_id: agId || null, observacoes: obs || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Taxi Dog solicitado! Nossa equipe vai confirmar em breve.");
    setPetId(""); setEndereco(""); setBairro(""); setRef(""); setData(""); setHorario(""); setObs(""); setAgId("");
    onChange();
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-6 space-y-3">
        <h3 className="font-serif text-xl mb-2">Solicitar Taxi Dog</h3>
        <select required value={petId} onChange={(e) => setPetId(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-border bg-surface">
          <option value="">Escolha o pet</option>
          {pets.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
        <input required value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Endereço de coleta" className="w-full px-4 py-2 rounded-lg border border-border bg-surface" />
        <input required value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Bairro" className="w-full px-4 py-2 rounded-lg border border-border bg-surface" />
        <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Ponto de referência (opcional)" className="w-full px-4 py-2 rounded-lg border border-border bg-surface" />
        <div className="grid grid-cols-2 gap-3">
          <input required type="date" value={data} onChange={(e) => setData(e.target.value)} className="px-4 py-2 rounded-lg border border-border bg-surface" />
          <input required type="time" value={horario} onChange={(e) => setHorario(e.target.value)} className="px-4 py-2 rounded-lg border border-border bg-surface" />
        </div>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-border bg-surface">
          <option value="coleta">Apenas buscar</option>
          <option value="entrega">Apenas entregar</option>
          <option value="coleta_e_entrega">Buscar e entregar</option>
        </select>
        {ags.length > 0 && (
          <select value={agId} onChange={(e) => setAgId(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-border bg-surface">
            <option value="">Vincular a agendamento? (opcional)</option>
            {ags.map((a) => (
              <option key={a.id} value={a.id}>{new Date(a.data).toLocaleDateString("pt-BR")} {a.horario.slice(0,5)} — {a.servico}</option>
            ))}
          </select>
        )}
        <textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2} placeholder="Observações" className="w-full px-4 py-2 rounded-lg border border-border bg-surface" />
        <button disabled={!pets.length} type="submit" className="w-full py-3 rounded-xl bg-accent text-accent-foreground font-bold disabled:opacity-50">
          {pets.length ? "Solicitar Taxi Dog" : "Cadastre um pet primeiro"}
        </button>
      </form>
      <div className="space-y-3">
        <h3 className="font-serif text-xl">Minhas solicitações</h3>
        {taxis.length === 0 && <p className="text-ink/50 text-sm">Nenhuma solicitação ainda.</p>}
        {taxis.map((t) => {
          const pet = pets.find((p) => p.id === t.pet_id);
          return (
            <div key={t.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold">{pet?.nome ?? "Pet"} — {t.tipo.replace(/_/g, " ")}</p>
                  <p className="text-xs text-ink/50">{new Date(t.data).toLocaleDateString("pt-BR")} às {t.horario.slice(0,5)}</p>
                  <p className="text-xs text-ink/70 mt-1">{t.endereco_coleta}, {t.bairro}</p>
                </div>
                <StatusBadge status={t.status} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    solicitado: "bg-muted text-muted-foreground",
    confirmado: "bg-brand/20 text-brand",
    a_caminho: "bg-accent/20 text-accent",
    em_andamento: "bg-accent/20 text-accent",
    concluido: "bg-green-100 text-green-700",
    cancelado: "bg-destructive/10 text-destructive",
  };
  return (
    <span className={"text-[10px] px-2 py-1 rounded-full uppercase font-bold whitespace-nowrap " + (map[status] || "bg-muted")}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

const GRUPO_LABELS: Record<string, string> = {
  servico: "Serviços",
  banho: "Banho",
  tosa: "Tosa",
  pacote: "Combos",
  taxi: "Taxi Dog",
  assinatura: "Pacotes de assinatura",
};

function PrecosTab({ precos }: { precos: Preco[] }) {
  if (!precos.length) {
    return (
      <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center text-ink/60">
        A tabela de preços será publicada em breve.
      </div>
    );
  }
  const grupos = Array.from(new Set(precos.map((p) => p.categoria)));
  return (
    <div className="space-y-6">
      <p className="text-sm text-ink/60">
        Os pagamentos são combinados direto pelo WhatsApp com a equipe. Confira abaixo os valores dos nossos serviços e pacotes.
      </p>
      {grupos.map((g) => {
        const isAssinatura = g === "assinatura";
        return (
          <div key={g} className={"rounded-2xl p-5 " + (isAssinatura ? "bg-brand text-primary-foreground border border-brand" : "bg-card border border-border")}>
            <h3 className="font-serif text-xl mb-1">{GRUPO_LABELS[g] ?? g.replace(/_/g, " ")}</h3>
            {isAssinatura && (
              <p className={"text-xs mb-3 " + "text-primary-foreground/80"}>
                🎁 Assine e economize: banhos garantidos no seu ritmo (mensal ou quinzenal), sem precisar agendar avulso toda vez.
              </p>
            )}
            <ul className={"divide-y " + (isAssinatura ? "divide-primary-foreground/20" : "divide-border")}>
              {precos.filter((p) => p.categoria === g).map((p) => (
                <li key={p.chave} className="py-3 flex justify-between items-start gap-4">
                  <div>
                    <p className="font-medium">{p.nome}</p>
                    {p.descricao && <p className={"text-xs mt-0.5 " + (isAssinatura ? "text-primary-foreground/70" : "text-ink/50")}>{p.descricao}</p>}
                  </div>
                  <span className={"font-mono font-bold whitespace-nowrap " + (isAssinatura ? "text-primary-foreground" : "text-brand")}>R$ {(p.valor_cents / 100).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            {isAssinatura && (
              <a
                href={waLink(null, "Olá! Quero assinar um pacote de banhos 🐾 (mensal ou quinzenal). Pode me ajudar?")}
               
                className="mt-3 inline-block text-xs bg-primary-foreground text-brand px-4 py-2 rounded-full font-bold hover:opacity-90"
              >
                Quero assinar pelo WhatsApp
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}

function FotosTab({ photos, pets }: { photos: PetPhoto[]; pets: Pet[] }) {
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!photos.length) return;
    (async () => {
      const paths = photos.map((p) => p.storage_path);
      const { data } = await supabase.storage.from("pet-photos").createSignedUrls(paths, 3600);
      const map: Record<string, string> = {};
      data?.forEach((r, i) => { if (r.signedUrl) map[paths[i]] = r.signedUrl; });
      setUrls(map);
    })();
  }, [photos]);

  if (photos.length === 0) {
    return (
      <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center text-ink/60">
        Ainda não há fotos. Depois do próximo banho, a equipe posta aqui ✨
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {photos.map((ph) => {
        const pet = pets.find((p) => p.id === ph.pet_id);
        const url = urls[ph.storage_path];
        return (
          <div key={ph.id} className="bg-card border border-border rounded-2xl overflow-hidden">
            {url ? (
              <img src={url} alt={ph.legenda ?? pet?.nome ?? "Pet"} className="w-full aspect-square object-cover" loading="lazy" />
            ) : (
              <div className="w-full aspect-square bg-muted animate-pulse" />
            )}
            <div className="p-3">
              <p className="text-sm font-bold">{pet?.nome ?? "Pet"}</p>
              <p className="text-xs text-ink/50">{new Date(ph.created_at).toLocaleDateString("pt-BR")}</p>
              {ph.legenda && <p className="text-xs text-ink/70 mt-1 italic">"{ph.legenda}"</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}