import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listPets from "./tools/list-pets";
import listAgendamentos from "./tools/list-agendamentos";
import listTaxiDog from "./tools/list-taxi-dog";
import listPagamentos from "./tools/list-pagamentos";
import createAgendamento from "./tools/create-agendamento";
import createTaxiDog from "./tools/create-taxi-dog";

// Supabase issuer must be the direct .supabase.co host (mcp-js rejects proxy URLs).
// VITE_SUPABASE_PROJECT_ID is inlined by Vite; fallback keeps the URL well-formed
// during the throwaway manifest-extract eval.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "banho-tosa-ju-mcp",
  title: "Banho & Tosa da JU",
  version: "0.1.0",
  instructions:
    "Ferramentas para tutores do Banho & Tosa da JU. Cada chamada age como o usuário que autorizou o cliente OAuth: liste seus pets, agendamentos, taxi-dog e pagamentos; crie novos agendamentos de banho/tosa ou solicitações de Taxi Dog. As permissões do banco (RLS) são aplicadas.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listPets, listAgendamentos, listTaxiDog, listPagamentos, createAgendamento, createTaxiDog],
});