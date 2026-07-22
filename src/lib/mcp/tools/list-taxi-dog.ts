import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, unauthorized, errorResult, jsonResult } from "../supabase";

export default defineTool({
  name: "list_taxi_dog",
  title: "Listar solicitações de Taxi Dog",
  description: "Retorna as solicitações de Taxi Dog do usuário.",
  inputSchema: {
    limit: z.number().int().optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthorized();
    const { data, error } = await supabaseForUser(ctx)
      .from("taxi_dog")
      .select("id, pet_id, endereco_coleta, bairro, ponto_referencia, data, horario, tipo, status, taxa, observacoes")
      .order("data", { ascending: false })
      .limit(Math.min(Math.max(limit ?? 20, 1), 100));
    if (error) return errorResult(error.message);
    return jsonResult({ taxi_dog: data ?? [] });
  },
});