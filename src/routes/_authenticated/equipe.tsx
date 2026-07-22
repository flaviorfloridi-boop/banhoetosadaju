import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/_authenticated/equipe")({
  head: () => ({
    meta: [
      { title: "Portal da equipe — Pata & Arte" },
      { name: "description", content: "Gerencie agenda diária, banho e tosa e Taxi Dog." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EquipePortal,
});

interface Ag { id: string; data: string; horario: string; servico: string; status: string; pet_id: string; cliente_id: string; observacoes: string | null; }
interface Td { id: string; data: string; horario: string; tipo: string; status: string; endereco_coleta: string; bairro: string; ponto_referencia: string | null; pet_id: string; cliente_id: string; observacoes: string | null; agendamento_id: string | null; }
interface Pet { id: string; nome: string; raca: string | null; porte: string | null; }
interface Prof { id: string; nome: string | null; telefone: string | null; }

function today() { return new Date().toISOString().slice(0, 10); }

function EquipePortal() {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"agenda" | "taxi">("agenda");
  const [date, setDate] = useState(today());
  const [ags, setAgs] = useState<Ag[]>([]);
  const [tds, setTds] = useState<Td[]>([]);
  const [pets, setPets] = useState<Record<string, Pet>>({});
  const [profs, setProfs] = useState<Record<string, Prof>>({});

  useEffect(() => {
    if (loading) return;
    if (profile && profile.role !== "funcionario" && profile.role !== "admin") {
      toast.error("Acesso restrito à equipe");
      navigate({ to: "/cliente", replace: true });
    }
  }, [profile, loading, navigate]);

  useEffect(() => { void load(); }, [date]);

  async function load() {
    const [a, t] = await Promise.all([
      supabase.from("agendamentos").select("*").eq("data", date).order("horario"),
      supabase.from("taxi_dog").select("*").eq("data", date).order("horario"),
    ]);
    const agsData = (a.data as Ag[]) ?? [];
    const tdsData = (t.data as Td[]) ?? [];
    setAgs(agsData);
    setTds(tdsData);

    const petIds = [...new Set([...agsData.map((x) => x.pet_id), ...tdsData.map((x) => x.pet_id)])];
    const cliIds = [...new Set([...agsData.map((x) => x.cliente_id), ...tdsData.map((x) => x.cliente_id)])];
    if (petIds.length) {
      const { data: p } = await supabase.from("pets").select("id,nome,raca,porte").in("id", petIds);
      const map: Record<string, Pet> = {};
      (p as Pet[] | null)?.forEach((x) => (map[x.id] = x));
      setPets(map);
    }
    if (cliIds.length) {
      const { data: pr } = await supabase.from("profiles").select("id,nome,telefone").in("id", cliIds);
      const map: Record<string, Prof> = {};
      (pr as Prof[] | null)?.forEach((x) => (map[x.id] = x));
      setProfs(map);
    }
  }

  async function updateAg(id: string, status: string) {
    const { error } = await supabase.from("agendamentos").update({ status: status as "solicitado" | "confirmado" | "em_andamento" | "concluido" | "cancelado" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Atualizado");
    void load();
  }
  async function updateTd(id: string, status: string) {
    const { error } = await supabase.from("taxi_dog").update({ status: status as "solicitado" | "confirmado" | "a_caminho" | "concluido" | "cancelado" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Atualizado");
    void load();
  }

  return (
    <div className="min-h-screen bg-surface">
      <Toaster />
      <SiteHeader />
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3 mb-6">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl">Portal da equipe</h1>
            <p className="text-ink/60 text-sm mt-1">Agenda operacional do dia</p>
          </div>
          <div className="flex items-center gap-3">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-4 py-2 rounded-lg border border-border bg-card" />
            <Link to="/cliente" className="text-sm text-accent font-bold hover:underline">Portal do cliente →</Link>
          </div>
        </div>

        <div className="flex gap-2 border-b border-border mb-6">
          <TabBtn active={tab === "agenda"} onClick={() => setTab("agenda")}>Banho & Tosa ({ags.length})</TabBtn>
          <TabBtn active={tab === "taxi"} onClick={() => setTab("taxi")}>Taxi Dog ({tds.length})</TabBtn>
        </div>

        {tab === "agenda" && (
          <div className="space-y-3">
            {ags.length === 0 && <EmptyState label="Nenhum agendamento para este dia." />}
            {ags.map((a) => {
              const pet = pets[a.pet_id];
              const cli = profs[a.cliente_id];
              return (
                <Card key={a.id}>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-lg font-bold text-brand">{a.horario.slice(0,5)}</span>
                      <span className="font-bold">{pet?.nome ?? "Pet"}</span>
                      <span className="text-xs text-ink/50">{pet?.raca}{pet?.porte ? ` • ${pet.porte}` : ""}</span>
                    </div>
                    <p className="text-sm text-ink/70 mt-1">
                      {a.servico.replace(/_/g, " ")} — {cli?.nome ?? "Cliente"} {cli?.telefone ? `• ${cli.telefone}` : ""}
                    </p>
                    {a.observacoes && <p className="text-xs text-ink/50 mt-1 italic">"{a.observacoes}"</p>}
                  </div>
                  <StatusSelect value={a.status} options={["solicitado", "confirmado", "em_andamento", "concluido", "cancelado"]} onChange={(s) => updateAg(a.id, s)} />
                </Card>
              );
            })}
          </div>
        )}

        {tab === "taxi" && (
          <div className="space-y-3">
            {tds.length === 0 && <EmptyState label="Nenhum Taxi Dog para este dia." />}
            {tds.map((t) => {
              const pet = pets[t.pet_id];
              const cli = profs[t.cliente_id];
              return (
                <Card key={t.id}>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-lg font-bold text-accent">{t.horario.slice(0,5)}</span>
                      <span className="font-bold">{pet?.nome ?? "Pet"}</span>
                      <span className="text-xs text-ink/50 uppercase">{t.tipo.replace(/_/g, " ")}</span>
                    </div>
                    <p className="text-sm text-ink/80 mt-1">📍 {t.endereco_coleta}, {t.bairro}{t.ponto_referencia ? ` (${t.ponto_referencia})` : ""}</p>
                    <p className="text-xs text-ink/60 mt-1">{cli?.nome ?? "Cliente"} {cli?.telefone ? `• ${cli.telefone}` : ""}</p>
                    {t.observacoes && <p className="text-xs text-ink/50 mt-1 italic">"{t.observacoes}"</p>}
                  </div>
                  <StatusSelect value={t.status} options={["solicitado", "confirmado", "a_caminho", "concluido", "cancelado"]} onChange={(s) => updateTd(t.id, s)} />
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-card border border-border rounded-2xl p-5 flex flex-wrap gap-4 items-start justify-between">{children}</div>;
}
function EmptyState({ label }: { label: string }) {
  return <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center text-ink/50">{label}</div>;
}
function TabBtn({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className={"px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition " + (active ? "border-brand text-brand" : "border-transparent text-ink/50 hover:text-ink")}>
      {children}
    </button>
  );
}
function StatusSelect({ value, options, onChange }: { value: string; options: string[]; onChange: (s: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="px-3 py-2 rounded-lg border border-border bg-surface text-sm font-bold capitalize">
      {options.map((o) => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
    </select>
  );
}