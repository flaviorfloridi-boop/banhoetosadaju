import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

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
interface Agendamento { id: string; data: string; horario: string; servico: string; status: string; pet_id: string; }
interface TaxiDog { id: string; data: string; horario: string; tipo: string; status: string; endereco_coleta: string; bairro: string; pet_id: string; }

export default function ClientePortal() {
  const { profile, user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [ags, setAgs] = useState<Agendamento[]>([]);
  const [taxis, setTaxis] = useState<TaxiDog[]>([]);
  const [tab, setTab] = useState<"pets" | "agendar" | "taxi">("pets");

  useEffect(() => {
    if (!user) return;
    void loadAll();
  }, [user]);

  async function loadAll() {
    const [p, a, t] = await Promise.all([
      supabase.from("pets").select("*").order("created_at"),
      supabase.from("agendamentos").select("*").order("data", { ascending: false }).limit(20),
      supabase.from("taxi_dog").select("*").order("data", { ascending: false }).limit(20),
    ]);
    setPets((p.data as Pet[]) ?? []);
    setAgs((a.data as Agendamento[]) ?? []);
    setTaxis((t.data as TaxiDog[]) ?? []);
  }

  return (
    <div className="min-h-screen bg-surface">
      <Toaster />
      <SiteHeader />
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl">Olá, {profile?.nome || "tutor"} 👋</h1>
            <p className="text-ink/60 text-sm mt-1">Gerencie seus pets, agendamentos e Taxi Dog</p>
          </div>
          {(profile?.role === "funcionario" || profile?.role === "admin") && (
            <Link to="/equipe" className="text-sm text-accent font-bold hover:underline">Ir para portal da equipe →</Link>
          )}
        </div>

        <div className="flex gap-2 border-b border-border mb-6 overflow-x-auto">
          <TabBtn active={tab === "pets"} onClick={() => setTab("pets")}>Meus pets</TabBtn>
          <TabBtn active={tab === "agendar"} onClick={() => setTab("agendar")}>Agendar banho/tosa</TabBtn>
          <TabBtn active={tab === "taxi"} onClick={() => setTab("taxi")}>Taxi Dog</TabBtn>
        </div>

        {tab === "pets" && <PetsTab pets={pets} onChange={loadAll} />}
        {tab === "agendar" && <AgendarTab pets={pets} ags={ags} onChange={loadAll} userId={user?.id} />}
        {tab === "taxi" && <TaxiTab pets={pets} taxis={taxis} ags={ags} onChange={loadAll} userId={user?.id} />}
      </div>
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

function AgendarTab({ pets, ags, onChange, userId }: { pets: Pet[]; ags: Agendamento[]; onChange: () => void; userId?: string }) {
  const [petId, setPetId] = useState("");
  const [servico, setServico] = useState("banho");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [obs, setObs] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !petId) return;
    const { error } = await supabase.from("agendamentos").insert({
      cliente_id: userId, pet_id: petId,
      servico: servico as "banho" | "tosa" | "banho_e_tosa" | "tosa_higienica" | "hidratacao",
      data, horario, observacoes: obs || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Agendamento solicitado!");
    setPetId(""); setData(""); setHorario(""); setObs(""); onChange();
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-6 space-y-3">
        <h3 className="font-serif text-xl mb-2">Novo agendamento</h3>
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
          <input required type="date" value={data} onChange={(e) => setData(e.target.value)} className="px-4 py-2 rounded-lg border border-border bg-surface" />
          <input required type="time" value={horario} onChange={(e) => setHorario(e.target.value)} className="px-4 py-2 rounded-lg border border-border bg-surface" />
        </div>
        <textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2} placeholder="Observações (opcional)" className="w-full px-4 py-2 rounded-lg border border-border bg-surface" />
        <button disabled={!pets.length} type="submit" className="w-full py-3 rounded-xl bg-brand text-primary-foreground font-bold disabled:opacity-50">
          {pets.length ? "Solicitar agendamento" : "Cadastre um pet primeiro"}
        </button>
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