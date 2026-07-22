import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser, unauthorized, errorResult, jsonResult } from "../supabase";

export default defineTool({
  name: "list_pets",
  title: "Listar meus pets",
  description: "Retorna os pets cadastrados do usuário autenticado.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return unauthorized();
    const { data, error } = await supabaseForUser(ctx)
      .from("pets")
      .select("id, nome, especie, raca, porte, observacoes")
      .order("created_at");
    if (error) return errorResult(error.message);
    return jsonResult({ pets: data ?? [] });
  },
});