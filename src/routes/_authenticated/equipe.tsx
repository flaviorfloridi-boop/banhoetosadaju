import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { TaxiMap, type TaxiStop } from "@/components/taxi-map";
import {
  waLink,
  buildMessage,
  agendamentoTemplateKey,
  taxiTemplateKey,
  agendamentoVars,
  taxiVars,
  DEFAULT_TEMPLATES,
  type TemplateMap,
} from "@/lib/whatsapp";
import { useTemplates } from "@/hooks/use-templates";

export const Route = createFileRoute("/_authenticated/equipe")({
  head: () => ({
    meta: [
      { title: "Portal da equipe — Banho & Tosa da JU" },
      { name: "description", content: "Agenda, Taxi Dog, preços, fotos." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EquipePortal,
});

interface Ag { id: string; data: string; horario: string; servico: string; status: string; pet_id: string; cliente_id: string; observacoes: string | null; pacote_id: string | null; }
interface Td { id: string; data: string; horario: string; tipo: string; status: string; endereco_coleta: string; bairro: string; ponto_referencia: string | null; pet_id: string; cliente_id: string; observacoes: string | null; agendamento_id: string | null; }
interface Pet { id: string; nome: string; raca: string | null; porte: string | null; }
interface Prof { id: string; nome: string | null; telefone: string | null; }
interface Preco { chave: string; nome: string; categoria: string; descricao: string | null; valor_cents: number; ativo: boolean; ordem: number; }
interface PetPhotoRow { id: string; pet_id: string; storage_path: string; legenda: string | null; created_at: string; }
interface GalleryRow { id: string; storage_path: string; legenda: string | null; publicado: boolean; ordem: number; }
interface PacoteRow { id: string; cliente_id: string; mes_referencia: string; total_banhos: number; banhos_usados: number; ativo: boolean; }
interface Pagamento { id: string; agendamento_id: string | null; valor_cents: number; status: string; descricao: string; }

function today() { return new Date().toISOString().slice(0, 10); }
function mesReferenciaAtual(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

type Tab = "agenda" | "taxi" | "precos" | "config" | "fotos" | "galeria" | "mensagens" | "pacotes" | "fechamento";

function EquipePortal() {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("agenda");
  const [date, setDate] = useState(today());
  const [ags, setAgs] = useState<Ag[]>([]);
  const [tds, setTds] = useState<Td[]>([]);
  const [pets, setPets] = useState<Record<string, Pet>>({});
  const [profs, setProfs] = useState<Record<string, Prof>>({});
  const [limiteDia, setLimiteDia] = useState<number>(15);
  const [pacotes, setPacotes] = useState<PacoteRow[]>([]);
  const [clientes, setClientes] = useState<Prof[]>([]);
  const templates = useTemplates();

  useEffect(() => {
    if (loading) return;
    if (profile && profile.role !== "funcionario" && profile.role !== "admin") {
      toast.error("Acesso restrito à equipe");
      navigate({ to: "/cliente", replace: true });
    }
  }, [profile, loading, navigate]);

  useEffect(() => { void load(); }, [date]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("app_settings").select("valor").eq("chave", "limite_banhos_dia").maybeSingle();
      const v = data?.valor as number | undefined;
      if (typeof v === "number") setLimiteDia(v);
    })();
    void loadPacotes();
    (async () => {
      const { data } = await supabase.from("profiles").select("id,nome,telefone").eq("role", "cliente").order("nome");
      setClientes((data as Prof[]) ?? []);
    })();
  }, []);

  async function loadPacotes() {
    const { data } = await supabase.from("pacotes_cliente").select("*").eq("mes_referencia", mesReferenciaAtual()).order("created_at", { ascending: false });
    setPacotes((data as PacoteRow[]) ?? []);
  }

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
    } else setPets({});
    if (cliIds.length) {
      const { data: pr } = await supabase.from("profiles").select("id,nome,telefone").in("id", cliIds);
      const map: Record<string, Prof> = {};
      (pr as Prof[] | null)?.forEach((x) => (map[x.id] = x));
      setProfs(map);
    } else setProfs({});
  }

  async function updateAg(id: string, status: string) {
    const { error } = await supabase.from("agendamentos").update({ status: status as "solicitado" | "confirmado" | "em_andamento" | "concluido" | "cancelado" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Atualizado");
    void load();
    void loadPacotes();
  }
  async function assignPacote(id: string, pacoteId: string | null) {
    const { error } = await supabase.from("agendamentos").update({ pacote_id: pacoteId }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(pacoteId ? "Vinculado ao pacote" : "Marcado como avulso");
    void load();
  }
  async function criarPacote(clienteId: string) {
    const { error } = await supabase.from("pacotes_cliente").insert({
      cliente_id: clienteId,
      mes_referencia: mesReferenciaAtual(),
      total_banhos: 4,
      banhos_usados: 0,
    });
    if (error) return toast.error(error.message);
    toast.success("Pacote criado para este mês");
    void loadPacotes();
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
            <p className="text-ink/60 text-sm mt-1">Agenda, Taxi Dog no mapa, preços e fotos</p>
          </div>
          <div className="flex items-center gap-3">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-4 py-2 rounded-lg border border-border bg-card" />
            <Link to="/cliente" className="text-sm text-accent font-bold hover:underline">Portal do cliente →</Link>
          </div>
        </div>

        <div className="flex gap-2 border-b border-border mb-6 overflow-x-auto">
          <TabBtn active={tab === "agenda"} onClick={() => setTab("agenda")}>Banho & Tosa ({ags.length}/{limiteDia})</TabBtn>
          <TabBtn active={tab === "taxi"} onClick={() => setTab("taxi")}>Taxi Dog ({tds.length})</TabBtn>
          <TabBtn active={tab === "fechamento"} onClick={() => setTab("fechamento")}>Fechamento do dia</TabBtn>
          <TabBtn active={tab === "pacotes"} onClick={() => setTab("pacotes")}>Pacotes</TabBtn>
          <TabBtn active={tab === "precos"} onClick={() => setTab("precos")}>Preços</TabBtn>
          <TabBtn active={tab === "config"} onClick={() => setTab("config")}>Configurações</TabBtn>
          <TabBtn active={tab === "fotos"} onClick={() => setTab("fotos")}>Fotos dos pets</TabBtn>
          <TabBtn active={tab === "galeria"} onClick={() => setTab("galeria")}>Galeria site</TabBtn>
          <TabBtn active={tab === "mensagens"} onClick={() => setTab("mensagens")}>Mensagens</TabBtn>
        </div>

        {tab === "agenda" && (
          <div className="space-y-3">
            <div className={"rounded-xl p-3 text-sm " + (ags.length >= limiteDia ? "bg-destructive/10 text-destructive font-bold" : "bg-brand/5 text-brand")}>
              {ags.length}/{limiteDia} banhos agendados neste dia. {ags.length >= limiteDia && "Novos agendamentos serão bloqueados."}
            </div>
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
                  <div className="flex flex-col gap-2 items-end">
                    <StatusSelect value={a.status} options={["solicitado", "confirmado", "em_andamento", "concluido", "cancelado"]} onChange={(s) => updateAg(a.id, s)} />
                    <PacoteSelect
                      value={a.pacote_id}
                      pacotes={pacotes.filter((pc) => pc.cliente_id === a.cliente_id && pc.ativo)}
                      onChange={(pid) => assignPacote(a.id, pid)}
                    />
                    {cli?.telefone && (
                      <a href={waLink(cli.telefone, buildMessage(templates, agendamentoTemplateKey(a.status), agendamentoVars(pet?.nome ?? "seu pet", a.servico, a.data, a.horario)))}
                         target="_blank" rel="noreferrer"
                         className="text-xs bg-[#25D366] text-white px-3 py-1 rounded-full font-bold hover:opacity-90">
                        📱 WhatsApp
                      </a>
                    )}
                    {cli?.telefone && (
                      <a href={waLink(cli.telefone, buildMessage(templates, "agendamento:lembrete", agendamentoVars(pet?.nome ?? "seu pet", a.servico, a.data, a.horario)))}
                         target="_blank" rel="noreferrer"
                         className="text-xs bg-accent/90 text-accent-foreground px-3 py-1 rounded-full font-bold hover:opacity-90">
                        🔔 Lembrete
                      </a>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {tab === "taxi" && (
          <div className="space-y-6">
            {tds.length > 0 && (
              <div>
                <h3 className="font-serif text-lg mb-2">Rota do dia no mapa</h3>
                <TaxiMap stops={tds.map<TaxiStop>((t) => ({
                  id: t.id,
                  label: pets[t.pet_id]?.nome ?? "Pet",
                  address: `${t.endereco_coleta}, ${t.bairro}`,
                  horario: t.horario,
                }))} />
              </div>
            )}
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
                    <div className="flex flex-col gap-2 items-end">
                      <StatusSelect value={t.status} options={["solicitado", "confirmado", "a_caminho", "concluido", "cancelado"]} onChange={(s) => updateTd(t.id, s)} />
                      {cli?.telefone && (
                        <a href={waLink(cli.telefone, buildMessage(templates, taxiTemplateKey(t.status), taxiVars(pet?.nome ?? "seu pet", `${t.endereco_coleta}, ${t.bairro}`, t.horario)))}
                           target="_blank" rel="noreferrer"
                           className="text-xs bg-[#25D366] text-white px-3 py-1 rounded-full font-bold hover:opacity-90">
                          📱 WhatsApp
                        </a>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {tab === "fechamento" && <FechamentoTab ags={ags} pets={pets} profs={profs} date={date} />}
        {tab === "pacotes" && (
          <PacotesTab pacotes={pacotes} clientes={clientes} profs={profs} onCriar={criarPacote} onReload={loadPacotes} templates={templates} />
        )}
        {tab === "precos" && <PrecosTab />}
        {tab === "config" && <ConfigTab limiteDia={limiteDia} onSaved={setLimiteDia} />}
        {tab === "fotos" && <PetPhotosTab ags={ags} pets={pets} />}
        {tab === "galeria" && <GaleriaTab />}
        {tab === "mensagens" && <MensagensTab />}
      </div>
    </div>
  );
}

interface TplRow { chave: string; titulo: string; template: string; updated_at: string; }

function MensagensTab() {
  const [rows, setRows] = useState<TplRow[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => { void load(); }, []);
  async function load() {
    const { data, error } = await supabase.from("mensagem_templates").select("*").order("chave");
    if (error) return toast.error(error.message);
    setRows((data as TplRow[]) ?? []);
  }
  async function save(chave: string) {
    const val = draft[chave];
    if (val === undefined) return;
    setSavingKey(chave);
    const { error } = await supabase.from("mensagem_templates").update({ template: val }).eq("chave", chave);
    setSavingKey(null);
    if (error) return toast.error(error.message);
    toast.success("Mensagem atualizada");
    setDraft((d) => { const n = { ...d }; delete n[chave]; return n; });
    void load();
  }
  async function resetDefault(chave: string) {
    const def = DEFAULT_TEMPLATES[chave];
    if (!def) return toast.error("Sem padrão para esta chave");
    setDraft((d) => ({ ...d, [chave]: def }));
  }

  const grupos: Array<{ label: string; prefix: string }> = [
    { label: "Taxi Dog", prefix: "taxi:" },
    { label: "Banho & Tosa", prefix: "agendamento:" },
    { label: "Pacotes", prefix: "pacote:" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-brand/5 border border-brand/20 rounded-2xl p-4 text-sm">
        <p className="font-bold mb-2">📝 Placeholders disponíveis</p>
        <p className="text-ink/70">
          Use entre chaves: <code className="bg-card px-1 rounded">{"{pet}"}</code>{" "}
          <code className="bg-card px-1 rounded">{"{servico}"}</code>{" "}
          <code className="bg-card px-1 rounded">{"{data}"}</code>{" "}
          <code className="bg-card px-1 rounded">{"{horario}"}</code>{" "}
          <code className="bg-card px-1 rounded">{"{endereco}"}</code>{" "}
          <code className="bg-card px-1 rounded">{"{pacote}"}</code>{" "}
          <code className="bg-card px-1 rounded">{"{saldo}"}</code>
          . Eles são substituídos automaticamente quando o botão de WhatsApp for clicado.
        </p>
      </div>

      {grupos.map((g) => {
        const items = rows.filter((r) => r.chave.startsWith(g.prefix));
        if (!items.length) return null;
        return (
          <div key={g.prefix} className="space-y-3">
            <h3 className="font-serif text-xl">{g.label}</h3>
            {items.map((r) => {
              const val = draft[r.chave] ?? r.template;
              const changed = draft[r.chave] !== undefined && draft[r.chave] !== r.template;
              return (
                <div key={r.chave} className="bg-card border border-border rounded-2xl p-5 space-y-2">
                  <div className="flex items-baseline justify-between gap-3 flex-wrap">
                    <div>
                      <p className="font-bold">{r.titulo}</p>
                      <p className="text-xs text-ink/40 font-mono">{r.chave}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => resetDefault(r.chave)} className="text-xs border border-border px-3 py-1 rounded-full">
                        Restaurar padrão
                      </button>
                      <button disabled={!changed || savingKey === r.chave} onClick={() => save(r.chave)}
                        className="text-xs bg-brand text-primary-foreground px-3 py-1 rounded-full font-bold disabled:opacity-40">
                        {savingKey === r.chave ? "Salvando..." : "Salvar"}
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={val}
                    onChange={(e) => setDraft((d) => ({ ...d, [r.chave]: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm font-mono resize-y" />
                </div>
              );
            })}
          </div>
        );
      })}
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

function PacoteSelect({ value, pacotes, onChange }: { value: string | null; pacotes: PacoteRow[]; onChange: (id: string | null) => void }) {
  if (pacotes.length === 0) {
    return <span className="text-[11px] text-ink/40 px-1">Avulso (sem pacote ativo)</span>;
  }
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      className="px-3 py-1.5 rounded-lg border border-border bg-surface text-xs"
    >
      <option value="">Avulso</option>
      {pacotes.map((pc) => (
        <option key={pc.id} value={pc.id}>
          Pacote ({pc.banhos_usados}/{pc.total_banhos} usados)
        </option>
      ))}
    </select>
  );
}

function FechamentoTab({ ags, pets, profs, date }: { ags: Ag[]; pets: Record<string, Pet>; profs: Record<string, Prof>; date: string }) {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);

  const concluidos = ags.filter((a) => a.status === "concluido");
  const doPacote = concluidos.filter((a) => a.pacote_id);
  const avulsos = concluidos.filter((a) => !a.pacote_id);

  useEffect(() => {
    (async () => {
      const ids = concluidos.map((a) => a.id);
      if (ids.length === 0) { setPagamentos([]); return; }
      const { data } = await supabase.from("pagamentos").select("id,agendamento_id,valor_cents,status,descricao").in("agendamento_id", ids).eq("status", "pago");
      setPagamentos((data as Pagamento[]) ?? []);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ags, date]);

  const totalRecebidoCents = pagamentos.reduce((sum, p) => sum + p.valor_cents, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-ink/50">Total de banhos concluídos</p>
          <p className="text-2xl font-bold text-brand">{concluidos.length}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-ink/50">Banhos de pacote</p>
          <p className="text-2xl font-bold">{doPacote.length}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-ink/50">Banhos avulsos</p>
          <p className="text-2xl font-bold">{avulsos.length}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-ink/50">Recebido em avulsos (pago)</p>
          <p className="text-2xl font-bold text-accent">R$ {(totalRecebidoCents / 100).toFixed(2)}</p>
        </div>
      </div>
      <p className="text-[11px] text-ink/40">
        O valor recebido considera apenas pagamentos com status "pago" vinculados aos agendamentos concluídos neste dia.
        Banhos de pacote não geram receita nova (já foram pagos na assinatura mensal).
      </p>

      <div>
        <h3 className="font-serif text-lg mb-2">Banhos de pacote ({doPacote.length})</h3>
        {doPacote.length === 0 && <EmptyState label="Nenhum banho de pacote concluído neste dia." />}
        <div className="space-y-2">
          {doPacote.map((a) => (
            <Card key={a.id}>
              <div>
                <p className="font-bold">{pets[a.pet_id]?.nome ?? "Pet"} — {a.servico.replace(/_/g, " ")}</p>
                <p className="text-xs text-ink/50">{a.horario.slice(0, 5)} • {profs[a.cliente_id]?.nome ?? "Cliente"}</p>
              </div>
              <span className="text-xs font-bold bg-brand/10 text-brand px-3 py-1 rounded-full">Pacote</span>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-serif text-lg mb-2">Banhos avulsos ({avulsos.length})</h3>
        {avulsos.length === 0 && <EmptyState label="Nenhum banho avulso concluído neste dia." />}
        <div className="space-y-2">
          {avulsos.map((a) => {
            const pag = pagamentos.find((p) => p.agendamento_id === a.id);
            return (
              <Card key={a.id}>
                <div>
                  <p className="font-bold">{pets[a.pet_id]?.nome ?? "Pet"} — {a.servico.replace(/_/g, " ")}</p>
                  <p className="text-xs text-ink/50">{a.horario.slice(0, 5)} • {profs[a.cliente_id]?.nome ?? "Cliente"}</p>
                </div>
                <span className="text-xs font-bold bg-accent/10 text-accent px-3 py-1 rounded-full">
                  {pag ? `R$ ${(pag.valor_cents / 100).toFixed(2)} pago` : "Sem pagamento registrado"}
                </span>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PacotesTab({
  pacotes, clientes, profs, onCriar, onReload, templates,
}: {
  pacotes: PacoteRow[];
  clientes: Prof[];
  profs: Record<string, Prof>;
  onCriar: (clienteId: string) => void;
  onReload: () => void;
  templates: TemplateMap;
}) {
  const [clienteId, setClienteId] = useState("");
  const clientesComPacote = new Set(pacotes.map((p) => p.cliente_id));
  const disponiveis = clientes.filter((c) => !clientesComPacote.has(c.id));

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-serif text-lg mb-3">Criar pacote mensal (4 banhos)</h3>
        <div className="flex flex-wrap gap-3 items-center">
          <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="px-4 py-2 rounded-lg border border-border bg-surface flex-1 min-w-[220px]">
            <option value="">Escolha o cliente</option>
            {disponiveis.map((c) => <option key={c.id} value={c.id}>{c.nome || c.telefone || c.id}</option>)}
          </select>
          <button
            disabled={!clienteId}
            onClick={() => { onCriar(clienteId); setClienteId(""); }}
            className="px-5 py-2 rounded-xl bg-brand text-primary-foreground font-bold disabled:opacity-50"
          >
            Criar pacote este mês
          </button>
        </div>
        <p className="text-[11px] text-ink/40 mt-2">Clientes que já têm pacote ativo neste mês não aparecem na lista.</p>
      </div>

      <div>
        <h3 className="font-serif text-lg mb-3">Pacotes ativos este mês ({pacotes.length})</h3>
        {pacotes.length === 0 && <EmptyState label="Nenhum pacote criado este mês ainda." />}
        <div className="space-y-2">
          {pacotes.map((pc) => {
            const cli = profs[pc.cliente_id] ?? clientes.find((c) => c.id === pc.cliente_id);
            const restantes = Math.max(pc.total_banhos - pc.banhos_usados, 0);
            const msgSaldo = buildMessage(templates, "pacote:aviso_saldo", { pacote: "Pacote mensal — 4 banhos", pet: cli?.nome ?? "cliente", saldo: restantes });
            const msgSobra = buildMessage(templates, "pacote:sobra_fim_mes", { saldo: restantes });
            return (
              <Card key={pc.id}>
                <div className="flex-1">
                  <p className="font-bold">{cli?.nome ?? "Cliente"}</p>
                  <p className="text-xs text-ink/50">{pc.banhos_usados}/{pc.total_banhos} banhos usados — {restantes} restante(s)</p>
                  <div className="w-full h-2 rounded-full bg-surface border border-border overflow-hidden mt-2 max-w-xs">
                    <div className="h-full bg-brand rounded-full" style={{ width: `${Math.min((pc.banhos_usados / pc.total_banhos) * 100, 100)}%` }} />
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  {cli?.telefone && (
                    <a href={waLink(cli.telefone, msgSaldo)} target="_blank" rel="noreferrer"
                       className="text-xs bg-[#25D366] text-white px-3 py-1 rounded-full font-bold hover:opacity-90 whitespace-nowrap">
                      📱 Avisar saldo
                    </a>
                  )}
                  {cli?.telefone && restantes > 0 && (
                    <a href={waLink(cli.telefone, msgSobra)} target="_blank" rel="noreferrer"
                       className="text-xs bg-accent/90 text-accent-foreground px-3 py-1 rounded-full font-bold hover:opacity-90 whitespace-nowrap">
                      ⏰ Avisar sobra (fim do mês)
                    </a>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PrecosTab() {
  const [precos, setPrecos] = useState<Preco[]>([]);
  const [draft, setDraft] = useState<Record<string, number>>({});

  useEffect(() => { void load(); }, []);
  async function load() {
    const { data } = await supabase.from("service_prices").select("*").order("ordem");
    setPrecos((data as Preco[]) ?? []);
  }
  async function save(chave: string) {
    const v = draft[chave];
    if (v === undefined || isNaN(v)) return;
    const { error } = await supabase.from("service_prices").update({ valor_cents: Math.round(v * 100) }).eq("chave", chave);
    if (error) return toast.error(error.message);
    toast.success("Preço atualizado");
    setDraft((d) => { const n = { ...d }; delete n[chave]; return n; });
    void load();
  }
  async function toggle(chave: string, ativo: boolean) {
    await supabase.from("service_prices").update({ ativo: !ativo }).eq("chave", chave);
    void load();
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-x-auto">
      <table className="w-full text-sm min-w-[600px]">
        <thead className="bg-surface border-b border-border">
          <tr><th className="text-left p-3">Serviço</th><th className="text-left p-3">Categoria</th><th className="text-right p-3">Valor (R$)</th><th className="p-3"></th></tr>
        </thead>
        <tbody>
          {precos.map((p) => (
            <tr key={p.chave} className={"border-t border-border " + (p.ativo ? "" : "opacity-40")}>
              <td className="p-3"><div className="font-bold">{p.nome}</div>{p.descricao && <div className="text-xs text-ink/50">{p.descricao}</div>}</td>
              <td className="p-3 text-xs uppercase text-ink/50">{p.categoria}</td>
              <td className="p-3 text-right">
                <input type="number" step="0.01" min="0"
                  defaultValue={(p.valor_cents / 100).toFixed(2)}
                  onChange={(e) => setDraft((d) => ({ ...d, [p.chave]: parseFloat(e.target.value) }))}
                  className="w-24 px-2 py-1 rounded border border-border bg-surface text-right font-mono" />
              </td>
              <td className="p-3 flex gap-2 justify-end">
                {draft[p.chave] !== undefined && (
                  <button onClick={() => save(p.chave)} className="text-xs bg-brand text-primary-foreground px-3 py-1 rounded-full font-bold">Salvar</button>
                )}
                <button onClick={() => toggle(p.chave, p.ativo)} className="text-xs border border-border px-3 py-1 rounded-full font-bold">
                  {p.ativo ? "Desativar" : "Ativar"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ConfigTab({ limiteDia, onSaved }: { limiteDia: number; onSaved: (n: number) => void }) {
  const [v, setV] = useState<number>(limiteDia);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setV(limiteDia); }, [limiteDia]);

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("app_settings").upsert({ chave: "limite_banhos_dia", valor: v });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Limite atualizado");
    onSaved(v);
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 max-w-md space-y-4">
      <div>
        <h3 className="font-serif text-xl">Limite de banhos por dia</h3>
        <p className="text-sm text-ink/60 mt-1">Quando o limite for atingido, novos agendamentos naquela data são bloqueados automaticamente.</p>
      </div>
      <div className="flex items-center gap-3">
        <input type="number" min="1" max="100" value={v} onChange={(e) => setV(parseInt(e.target.value, 10) || 1)}
          className="w-24 px-3 py-2 rounded-lg border border-border bg-surface text-center font-bold text-lg" />
        <button disabled={saving} onClick={save} className="bg-brand text-primary-foreground px-5 py-2 rounded-lg font-bold disabled:opacity-50">
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
}

function PetPhotosTab({ ags, pets }: { ags: Ag[]; pets: Record<string, Pet> }) {
  const [photos, setPhotos] = useState<PetPhotoRow[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [petId, setPetId] = useState("");
  const [agId, setAgId] = useState("");
  const [legenda, setLegenda] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const petOptions = Object.values(pets);

  useEffect(() => { void load(); }, [Object.keys(pets).length]);

  async function load() {
    const petIds = Object.keys(pets);
    if (!petIds.length) { setPhotos([]); return; }
    const { data } = await supabase.from("pet_photos").select("*").in("pet_id", petIds).order("created_at", { ascending: false }).limit(30);
    const rows = (data as PetPhotoRow[]) ?? [];
    setPhotos(rows);
    if (rows.length) {
      const { data: signed } = await supabase.storage.from("pet-photos").createSignedUrls(rows.map((r) => r.storage_path), 3600);
      const map: Record<string, string> = {};
      signed?.forEach((r, i) => { if (r.signedUrl) map[rows[i].storage_path] = r.signedUrl; });
      setUrls(map);
    }
  }

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !petId) { toast.error("Escolha o pet e o arquivo"); return; }
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${petId}/${Date.now()}.${ext}`;
    const up = await supabase.storage.from("pet-photos").upload(path, file, { contentType: file.type });
    if (up.error) { setUploading(false); return toast.error(up.error.message); }
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("pet_photos").insert({
      pet_id: petId, agendamento_id: agId || null, storage_path: path, legenda: legenda || null,
      enviado_por: u.user?.id ?? null,
    });
    setUploading(false);
    if (error) return toast.error(error.message);
    toast.success("Foto enviada!");
    setFile(null); setLegenda(""); setAgId("");
    void load();
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <form onSubmit={upload} className="bg-card border border-border rounded-2xl p-6 space-y-3">
        <h3 className="font-serif text-xl">Enviar foto pós-banho</h3>
        <select required value={petId} onChange={(e) => setPetId(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-border bg-surface">
          <option value="">Escolha o pet</option>
          {petOptions.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
        {petId && ags.filter((a) => a.pet_id === petId).length > 0 && (
          <select value={agId} onChange={(e) => setAgId(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-border bg-surface">
            <option value="">Vincular a agendamento do dia (opcional)</option>
            {ags.filter((a) => a.pet_id === petId).map((a) => (
              <option key={a.id} value={a.id}>{a.horario.slice(0,5)} — {a.servico.replace(/_/g, " ")}</option>
            ))}
          </select>
        )}
        <input value={legenda} onChange={(e) => setLegenda(e.target.value)} placeholder="Legenda (opcional)"
          className="w-full px-4 py-2 rounded-lg border border-border bg-surface" />
        <input required type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="w-full text-sm" />
        <button disabled={uploading} type="submit" className="w-full py-3 rounded-xl bg-brand text-primary-foreground font-bold disabled:opacity-50">
          {uploading ? "Enviando..." : "Enviar foto"}
        </button>
      </form>
      <div className="space-y-3">
        <h3 className="font-serif text-xl">Últimas fotos</h3>
        {photos.length === 0 && <p className="text-ink/50 text-sm">Nenhuma foto ainda.</p>}
        <div className="grid grid-cols-2 gap-3">
          {photos.map((ph) => {
            const pet = pets[ph.pet_id];
            const url = urls[ph.storage_path];
            return (
              <div key={ph.id} className="bg-card border border-border rounded-xl overflow-hidden">
                {url && <img src={url} alt={pet?.nome ?? ""} loading="lazy" className="w-full aspect-square object-cover" />}
                <div className="p-2 text-xs"><b>{pet?.nome}</b> — {new Date(ph.created_at).toLocaleDateString("pt-BR")}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function GaleriaTab() {
  const [rows, setRows] = useState<GalleryRow[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const [legenda, setLegenda] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => { void load(); }, []);
  async function load() {
    const { data } = await supabase.from("gallery_posts").select("*").order("ordem").order("created_at", { ascending: false });
    const items = (data as GalleryRow[]) ?? [];
    setRows(items);
    if (items.length) {
      const { data: signed } = await supabase.storage.from("gallery-photos").createSignedUrls(items.map((r) => r.storage_path), 3600);
      const map: Record<string, string> = {};
      signed?.forEach((r, i) => { if (r.signedUrl) map[items[i].storage_path] = r.signedUrl; });
      setUrls(map);
    }
  }

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${Date.now()}.${ext}`;
    const up = await supabase.storage.from("gallery-photos").upload(path, file, { contentType: file.type });
    if (up.error) { setUploading(false); return toast.error(up.error.message); }
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("gallery_posts").insert({
      storage_path: path, legenda: legenda || null, publicado: true, enviado_por: u.user?.id ?? null,
    });
    setUploading(false);
    if (error) return toast.error(error.message);
    toast.success("Publicado na home!");
    setFile(null); setLegenda("");
    void load();
  }

  async function togglePub(id: string, publicado: boolean) {
    await supabase.from("gallery_posts").update({ publicado: !publicado }).eq("id", id);
    void load();
  }
  async function remove(id: string, path: string) {
    if (!confirm("Remover esta foto?")) return;
    await supabase.from("gallery_posts").delete().eq("id", id);
    await supabase.storage.from("gallery-photos").remove([path]);
    void load();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={upload} className="bg-card border border-border rounded-2xl p-6 space-y-3 max-w-lg">
        <h3 className="font-serif text-xl">Postar na galeria da home</h3>
        <p className="text-sm text-ink/60">Essas fotos aparecem na página inicial do site (seção "Nossos pets").</p>
        <input value={legenda} onChange={(e) => setLegenda(e.target.value)} placeholder="Legenda (opcional)"
          className="w-full px-4 py-2 rounded-lg border border-border bg-surface" />
        <input required type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="w-full text-sm" />
        <button disabled={uploading} type="submit" className="w-full py-3 rounded-xl bg-brand text-primary-foreground font-bold disabled:opacity-50">
          {uploading ? "Enviando..." : "Publicar"}
        </button>
      </form>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {rows.map((r) => (
          <div key={r.id} className={"bg-card border border-border rounded-xl overflow-hidden " + (r.publicado ? "" : "opacity-40")}>
            {urls[r.storage_path] && <img src={urls[r.storage_path]} alt="" className="w-full aspect-square object-cover" />}
            <div className="p-2 flex gap-1">
              <button onClick={() => togglePub(r.id, r.publicado)} className="flex-1 text-xs border border-border rounded py-1">
                {r.publicado ? "Ocultar" : "Publicar"}
              </button>
              <button onClick={() => remove(r.id, r.storage_path)} className="text-xs text-destructive px-2">✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}