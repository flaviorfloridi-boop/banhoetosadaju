import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser, unauthorized, errorResult, jsonResult } from "../supabase";

export default defineTool({
  name: "list_pagamentos",
  title: "Listar pagamentos",
  description: "Retorna o histórico de pagamentos do usuário (valores em reais).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return unauthorized();
    const { data, error } = await supabaseForUser(ctx)
      .from("pagamentos")
      .select("id, descricao, valor_cents, status, metodo, agendamento_id, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return errorResult(error.message);
    const items = (data ?? []).map((p) => ({ ...p, valor_reais: p.valor_cents / 100 }));
    return jsonResult({ pagamentos: items });
  },
});