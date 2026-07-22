// Gerador de links wa.me — mensagens prontas p/ o cliente
const PHONE = "5511944811381";

export function waLink(number: string | null | undefined, message: string): string {
  const clean = (number ?? PHONE).replace(/\D/g, "");
  const phone = clean.startsWith("55") ? clean : "55" + clean;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function msgAgendamentoStatus(petNome: string, servico: string, data: string, horario: string, status: string): string {
  const dt = new Date(data + "T00:00:00").toLocaleDateString("pt-BR");
  const hr = horario.slice(0, 5);
  const svc = servico.replace(/_/g, " ");
  switch (status) {
    case "confirmado":
      return `Olá! 🐾 Seu agendamento do *${petNome}* (${svc}) foi confirmado para *${dt} às ${hr}*. Te esperamos! — Banho & Tosa da JU`;
    case "em_andamento":
      return `Oi! 🛁 O *${petNome}* já começou o ${svc}. Avisaremos quando estiver pronto. — Banho & Tosa da JU`;
    case "concluido":
      return `Prontinho! ✨ O *${petNome}* já está lindão e cheiroso. Pode buscar! — Banho & Tosa da JU`;
    case "cancelado":
      return `Olá! Precisamos cancelar o agendamento do *${petNome}* de ${dt}. Nos chame para remarcar. — Banho & Tosa da JU`;
    default:
      return `Atualização do agendamento do *${petNome}* (${svc}) — ${dt} às ${hr}. — Banho & Tosa da JU`;
  }
}

export function msgTaxiStatus(petNome: string, endereco: string, horario: string, status: string): string {
  const hr = horario.slice(0, 5);
  switch (status) {
    case "confirmado":
      return `Taxi Dog confirmado! 🚐 Passaremos em *${endereco}* para buscar o *${petNome}* às *${hr}*. — Banho & Tosa da JU`;
    case "a_caminho":
      return `Já estamos a caminho! 🚐💨 O motorista chega em ${endereco} em alguns minutinhos para o *${petNome}*. — Banho & Tosa da JU`;
    case "concluido":
      return `Missão cumprida! ✅ O *${petNome}* já foi entregue com segurança. — Banho & Tosa da JU`;
    case "cancelado":
      return `Precisamos cancelar o Taxi Dog do *${petNome}* de hoje. Nos chame para reagendar. — Banho & Tosa da JU`;
    default:
      return `Atualização do Taxi Dog do *${petNome}*. — Banho & Tosa da JU`;
  }
}

export function msgPacoteAviso(petNome: string, pacote: string, saldoRestante: number): string {
  return `Oi! 🐾 Só um lembrete: o pacote *${pacote}* do *${petNome}* tem *${saldoRestante} banho(s)* disponível(is). Quer agendar? — Banho & Tosa da JU`;
}