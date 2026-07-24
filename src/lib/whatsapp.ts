// Gerador de links wa.me — mensagens montadas a partir de templates editáveis
const PHONE = "5511944811381";

export function waLink(number: string | null | undefined, message: string): string {
  const clean = (number ?? PHONE).replace(/\D/g, "");
  const phone = clean.startsWith("55") ? clean : "55" + clean;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export type TemplateVars = Record<string, string | number | undefined | null>;

/** Substitui {placeholders} pelas variáveis fornecidas. Chaves ausentes viram vazio. */
export function renderTemplate(template: string, vars: TemplateVars): string {
  return template.replace(/\{(\w+)\}/g, (_m, k: string) => {
    const v = vars[k];
    return v === undefined || v === null ? "" : String(v);
  });
}

export type TemplateMap = Record<string, string>;

/** Fallbacks caso a tabela mensagem_templates ainda não tenha uma chave. */
export const DEFAULT_TEMPLATES: TemplateMap = {
  "agendamento:confirmado": "Olá! 🐾 O agendamento do *{pet}* ({servico}) foi confirmado para *{data} às {horario}*. — Banho & Tosa da JU",
  "agendamento:lembrete": "Oi! 🔔 Passando pra lembrar: o *{pet}* tem banho/tosa marcado para *{data} às {horario}*. Te esperamos! — Banho & Tosa da JU",
  "agendamento:em_andamento": "Oi! 🛁 O *{pet}* já começou o {servico}. — Banho & Tosa da JU",
  "agendamento:concluido": "Prontinho! ✨ O *{pet}* já está pronto para buscar. — Banho & Tosa da JU",
  "agendamento:cancelado": "Olá! Precisamos cancelar o agendamento do *{pet}* de {data}. — Banho & Tosa da JU",
  "taxi:confirmado": "Taxi Dog confirmado! 🚐 Buscamos o *{pet}* em {endereco} às *{horario}*. — Banho & Tosa da JU",
  "taxi:a_caminho": "Estamos a caminho! 🚐💨 Chegando em {endereco} para o *{pet}*. — Banho & Tosa da JU",
  "taxi:concluido": "Entregue com segurança! ✅ *{pet}* já está em casa. — Banho & Tosa da JU",
  "taxi:cancelado": "Precisamos cancelar o Taxi Dog do *{pet}*. Nos chame para reagendar. — Banho & Tosa da JU",
  "pacote:aviso_saldo": "Oi! 🐾 Pacote *{pacote}* do *{pet}*: *{saldo}* banho(s) disponível(is). — Banho & Tosa da JU",
  "pacote:sobra_fim_mes": "Oi! 🐾 O mês está acabando e ainda restam *{saldo} banho(s)* no seu pacote mensal. Bora agendar antes que vença? — Banho & Tosa da JU",
};

export function agendamentoTemplateKey(status: string): string { return `agendamento:${status}`; }
export function taxiTemplateKey(status: string): string { return `taxi:${status}`; }

/** Monta variáveis padronizadas para um agendamento. */
export function agendamentoVars(petNome: string, servico: string, data: string, horario: string): TemplateVars {
  return {
    pet: petNome,
    servico: servico.replace(/_/g, " "),
    data: new Date(data + "T00:00:00").toLocaleDateString("pt-BR"),
    horario: horario.slice(0, 5),
  };
}

export function taxiVars(petNome: string, endereco: string, horario: string): TemplateVars {
  return { pet: petNome, endereco, horario: horario.slice(0, 5) };
}

export function buildMessage(templates: TemplateMap, key: string, vars: TemplateVars): string {
  const tpl = templates[key] ?? DEFAULT_TEMPLATES[key] ?? "";
  return renderTemplate(tpl, vars);
}