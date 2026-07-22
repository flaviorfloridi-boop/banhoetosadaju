import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, unauthorized, errorResult, jsonResult } from "../supabase";

export default defineTool({
  name: "create_agendamento",
  title: "Solicitar agendamento",
  description: "Cria um novo agendamento de banho/tosa. O horário fica com status 'solicitado' até a equipe confirmar.",
  inputSchema: {
    pet_id: z.string().describe("UUID do pet (use list_pets)"),
    servico: z.enum(["banho", "tosa", "banho_e_tosa", "tosa_higienica", "hidratacao"]),
    data: z.string().describe("Data no formato YYYY-MM-DD"),
    horario: z.string().describe("Horário HH:MM"),
    observacoes: z.string().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ pet_id, servico, data, horario, observacoes }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthorized();
    const { data: row, error } = await supabaseForUser(ctx)
      .from("agendamentos")
      .insert({ cliente_id: ctx.getUserId(), pet_id, servico, data, horario, observacoes: observacoes ?? null })
      .select()
      .single();
    if (error) return errorResult(error.message);
    return jsonResult({ agendamento: row });
  },
});