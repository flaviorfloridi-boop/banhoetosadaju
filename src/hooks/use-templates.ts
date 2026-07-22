import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_TEMPLATES, type TemplateMap } from "@/lib/whatsapp";

/** Carrega os templates de mensagem (apenas equipe consegue ler via RLS). */
export function useTemplates() {
  const [templates, setTemplates] = useState<TemplateMap>(DEFAULT_TEMPLATES);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.from("mensagem_templates").select("chave, template");
      if (!alive || !data) return;
      const map: TemplateMap = { ...DEFAULT_TEMPLATES };
      for (const r of data) map[r.chave] = r.template;
      setTemplates(map);
    })();
    return () => { alive = false; };
  }, []);

  return templates;
}