import { createFileRoute } from '@tanstack/react-router';
import { DEFAULT_TEMPLATES, renderTemplate, type TemplateVars } from '@/lib/whatsapp';

interface AgendamentoRow {
  id: string;
  data: string;
  horario: string;
  servico: string;
  status: string;
  pet_id: string;
  cliente_id: string;
}
interface PacoteRow {
  id: string;
  cliente_id: string;
  total_banhos: number;
  banhos_usados: number;
  ativo: boolean;
  periodicidade: string;
  periodo_fim: string;
  status_pagamento: string;
}
interface ProfileRow {
  id: string;
  nome: string | null;
  telefone: string | null;
}
interface PetRow {
  id: string;
  nome: string;
}

function amanha(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}
function today(): string {
  return new Date().toISOString().slice(0, 10);
}
function diasAteFimCiclo(periodoFim: string): number {
  const fim = new Date(periodoFim + 'T00:00:00');
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.round((fim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}
function cleanPhone(numero: string): string {
  const clean = numero.replace(/\D/g, '');
  return clean.startsWith('55') ? clean : '55' + clean;
}

interface Recipient {
  telefone: string | null;
  nome: string;
  mensagem: string;
  categoria: 'lembrete_agendamento' | 'ultimo_banho' | 'sobra_fim_ciclo' | 'cobranca_pacote';
}

async function handleDaily() {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

  const [{ data: tplRows }, { data: agsAmanha }, { data: pacotes }] = await Promise.all([
    supabaseAdmin.from('mensagem_templates').select('chave,template'),
    supabaseAdmin
      .from('agendamentos')
      .select('id,data,horario,servico,status,pet_id,cliente_id')
      .eq('data', amanha())
      .in('status', ['confirmado', 'solicitado']),
    supabaseAdmin
      .from('pacotes_cliente')
      .select('id,cliente_id,total_banhos,banhos_usados,ativo,periodicidade,periodo_fim,status_pagamento')
      .eq('ativo', true)
      .gte('periodo_fim', today()),
  ]);

  const templates: Record<string, string> = { ...DEFAULT_TEMPLATES };
  (tplRows as { chave: string; template: string }[] | null)?.forEach((r) => (templates[r.chave] = r.template));
  function buildMsg(key: string, vars: TemplateVars): string {
    return renderTemplate(templates[key] ?? DEFAULT_TEMPLATES[key] ?? '', vars);
  }

  const agsRows = (agsAmanha as AgendamentoRow[]) ?? [];
  const pacotesRows = (pacotes as PacoteRow[]) ?? [];

  const clienteIds = [...new Set([...agsRows.map((a) => a.cliente_id), ...pacotesRows.map((p) => p.cliente_id)])];
  const petIds = [...new Set(agsRows.map((a) => a.pet_id))];

  const [{ data: profs }, { data: pets }] = await Promise.all([
    clienteIds.length
      ? supabaseAdmin.from('profiles').select('id,nome,telefone').in('id', clienteIds)
      : Promise.resolve({ data: [] as ProfileRow[] }),
    petIds.length
      ? supabaseAdmin.from('pets').select('id,nome').in('id', petIds)
      : Promise.resolve({ data: [] as PetRow[] }),
  ]);

  const profMap: Record<string, ProfileRow> = {};
  (profs as ProfileRow[] | null)?.forEach((p) => (profMap[p.id] = p));
  const petMap: Record<string, PetRow> = {};
  (pets as PetRow[] | null)?.forEach((p) => (petMap[p.id] = p));

  const recipients: Recipient[] = [];

  for (const a of agsRows) {
    const prof = profMap[a.cliente_id];
    const petNome = petMap[a.pet_id]?.nome ?? 'seu pet';
    recipients.push({
      telefone: prof?.telefone ?? null,
      nome: prof?.nome ?? 'cliente',
      categoria: 'lembrete_agendamento',
      mensagem: buildMsg('agendamento:lembrete', {
        pet: petNome,
        servico: a.servico.replace(/_/g, ' '),
        data: new Date(a.data + 'T00:00:00').toLocaleDateString('pt-BR'),
        horario: a.horario.slice(0, 5),
      }),
    });
  }

  for (const pc of pacotesRows) {
    const restantes = pc.total_banhos - pc.banhos_usados;
    const prof = profMap[pc.cliente_id];
    const label = pc.periodicidade === 'quinzenal' ? 'quinzenal' : 'mensal';
    if (restantes === 1) {
      recipients.push({
        telefone: prof?.telefone ?? null,
        nome: prof?.nome ?? 'cliente',
        categoria: 'ultimo_banho',
        mensagem: buildMsg('pacote:aviso_saldo', { pacote: `Pacote ${label}`, pet: prof?.nome ?? 'cliente', saldo: 1 }),
      });
    } else if (restantes > 0 && diasAteFimCiclo(pc.periodo_fim) <= 3) {
      recipients.push({
        telefone: prof?.telefone ?? null,
        nome: prof?.nome ?? 'cliente',
        categoria: 'sobra_fim_ciclo',
        mensagem: buildMsg('pacote:sobra_fim_mes', { saldo: restantes }),
      });
    }
    if (pc.status_pagamento !== 'pago') {
      recipients.push({
        telefone: prof?.telefone ?? null,
        nome: prof?.nome ?? 'cliente',
        categoria: 'cobranca_pacote',
        mensagem: buildMsg('pacote:cobranca', { periodicidade: label }),
      });
    }
  }

  // WhatsApp Business Platform (Meta Cloud API) — envio oficial direto pela Meta.
  // Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
  const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
  const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
  // Nome do template aprovado na Meta (WhatsApp Manager > Modelos de mensagem).
  // O template precisa ter exatamente 1 variável no corpo, ex: "{{1}}",
  // pra receber a mensagem já pronta que montamos aqui.
  const WHATSAPP_TEMPLATE_NAME = process.env.WHATSAPP_TEMPLATE_NAME || 'notificacao_generica';
  const WHATSAPP_TEMPLATE_LANG = process.env.WHATSAPP_TEMPLATE_LANG || 'pt_BR';
  const configured = Boolean(WHATSAPP_ACCESS_TOKEN && WHATSAPP_PHONE_NUMBER_ID);

  const results: { nome: string; categoria: string; status: string }[] = [];

  for (const r of recipients) {
    if (!r.telefone) {
      results.push({ nome: r.nome, categoria: r.categoria, status: 'sem_telefone' });
      continue;
    }
    if (!configured) {
      results.push({ nome: r.nome, categoria: r.categoria, status: 'dry_run_nao_enviado' });
      continue;
    }
    try {
      const resp = await fetch(`https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanPhone(r.telefone),
          type: 'template',
          template: {
            name: WHATSAPP_TEMPLATE_NAME,
            language: { code: WHATSAPP_TEMPLATE_LANG },
            components: [{ type: 'body', parameters: [{ type: 'text', text: r.mensagem }] }],
          },
        }),
      });
      results.push({ nome: r.nome, categoria: r.categoria, status: resp.ok ? 'enviado' : `erro_meta_${resp.status}` });
    } catch (e) {
      results.push({ nome: r.nome, categoria: r.categoria, status: 'erro_envio' });
    }
  }

  return {
    modo: configured ? 'envio_real' : 'dry_run (configure WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID e um template aprovado para ativar o envio real)',
    total_calculado: recipients.length,
    resultados: results,
  };
}

export const Route = createFileRoute('/api/public/alerts/daily')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secretEsperado = process.env.ALERTS_CRON_SECRET;
        const secretRecebido = request.headers.get('x-alerts-secret');
        if (!secretEsperado || secretRecebido !== secretEsperado) {
          return Response.json({ error: 'unauthorized' }, { status: 401 });
        }
        try {
          const resumo = await handleDaily();
          return Response.json(resumo);
        } catch (e) {
          console.error('[alerts/daily] error', e);
          return Response.json({ error: 'internal_error' }, { status: 500 });
        }
      },
    },
  },
});
