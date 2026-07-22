import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, unauthorized, errorResult, jsonResult } from "../supabase";

export default defineTool({
  name: "create_taxi_dog",
  title: "Solicitar Taxi Dog",
  description: "Cria uma solicitação de busca/entrega do pet.",
  inputSchema: {
    pet_id: z.string(),
    endereco_coleta: z.string(),
    bairro: z.string(),
    ponto_referencia: z.string().optional(),
    data: z.string().describe("YYYY-MM-DD"),
    horario: z.string().describe("HH:MM"),
    tipo: z.enum(["coleta", "entrega", "coleta_e_entrega"]),
    agendamento_id: z.string().optional().describe("Vincular a agendamento existente"),
    observacoes: z.string().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return unauthorized();
    const { data: row, error } = await supabaseForUser(ctx)
      .from("taxi_dog")
      .insert({
        cliente_id: ctx.getUserId(),
        pet_id: input.pet_id,
        endereco_coleta: input.endereco_coleta,
        bairro: input.bairro,
        ponto_referencia: input.ponto_referencia ?? null,
        data: input.data,
        horario: input.horario,
        tipo: input.tipo,
        agendamento_id: input.agendamento_id ?? null,
        observacoes: input.observacoes ?? null,
      })
      .select()
      .single();
    if (error) return errorResult(error.message);
    return jsonResult({ taxi_dog: row });
  },
});