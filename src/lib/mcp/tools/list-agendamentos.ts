import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, unauthorized, errorResult, jsonResult } from "../supabase";

export default defineTool({
  name: "list_agendamentos",
  title: "Listar agendamentos",
  description: "Retorna os agendamentos de banho/tosa do usuário. Filtre opcionalmente por status.",
  inputSchema: {
    status: z.string().optional().describe("solicitado | confirmado | em_andamento | concluido | cancelado"),
    limit: z.number().int().optional().describe("Máximo de registros (padrão 20)"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthorized();
    let q = supabaseForUser(ctx)
      .from("agendamentos")
      .select("id, pet_id, servico, data, horario, status, observacoes")
      .order("data", { ascending: false })
      .limit(Math.min(Math.max(limit ?? 20, 1), 100));
    if (status) q = q.eq("status", status as never);
    const { data, error } = await q;
    if (error) return errorResult(error.message);
    return jsonResult({ agendamentos: data ?? [] });
  },
});