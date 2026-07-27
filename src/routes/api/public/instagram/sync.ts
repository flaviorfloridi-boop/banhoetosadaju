import { createFileRoute } from '@tanstack/react-router';

interface IgMediaItem {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
}
interface IgMediaResponse {
  data: IgMediaItem[];
}

async function handleSync() {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

  const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
  const INSTAGRAM_BUSINESS_ACCOUNT_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_BUSINESS_ACCOUNT_ID) {
    return {
      modo: 'nao_configurado',
      mensagem: 'Configure INSTAGRAM_ACCESS_TOKEN e INSTAGRAM_BUSINESS_ACCOUNT_ID para ativar a sincronização real.',
      importados: 0,
    };
  }

  // Busca os posts mais recentes da conta Instagram Business conectada.
  // Docs: https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media
  const url =
    `https://graph.facebook.com/v21.0/${INSTAGRAM_BUSINESS_ACCOUNT_ID}/media` +
    `?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp` +
    `&limit=12&access_token=${INSTAGRAM_ACCESS_TOKEN}`;

  const resp = await fetch(url);
  if (!resp.ok) {
    const errText = await resp.text();
    return { modo: 'erro_instagram', status: resp.status, detalhe: errText, importados: 0 };
  }
  const body = (await resp.json()) as IgMediaResponse;
  const posts = body.data ?? [];

  // Verifica quais desses posts já foram importados antes (evita duplicar)
  const idsExternos = posts.map((p) => p.id);
  const { data: jaImportados } = idsExternos.length
    ? await supabaseAdmin.from('gallery_posts').select('instagram_media_id').in('instagram_media_id', idsExternos)
    : { data: [] as { instagram_media_id: string | null }[] };
  const jaImportadosSet = new Set((jaImportados ?? []).map((r) => r.instagram_media_id));

  let importados = 0;
  const detalhes: { id: string; status: string }[] = [];

  for (const post of posts) {
    if (jaImportadosSet.has(post.id)) {
      detalhes.push({ id: post.id, status: 'ja_existia' });
      continue;
    }
    // Vídeos e álbuns ficam de fora por simplicidade — só fotos únicas (IMAGE) são sincronizadas.
    if (post.media_type !== 'IMAGE' || !post.media_url) {
      detalhes.push({ id: post.id, status: 'ignorado_nao_e_foto' });
      continue;
    }

    try {
      // Baixa a imagem do CDN da Meta e faz upload pro nosso storage
      // (o link do media_url expira, então precisamos guardar uma cópia própria).
      const imgResp = await fetch(post.media_url);
      if (!imgResp.ok) {
        detalhes.push({ id: post.id, status: 'erro_download_imagem' });
        continue;
      }
      const arrayBuffer = await imgResp.arrayBuffer();
      const path = `instagram-${post.id}.jpg`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from('gallery-photos')
        .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: false });
      if (uploadError) {
        detalhes.push({ id: post.id, status: `erro_upload: ${uploadError.message}` });
        continue;
      }

      const { error: insertError } = await supabaseAdmin.from('gallery_posts').insert({
        storage_path: path,
        legenda: post.caption?.slice(0, 200) ?? null,
        publicado: true,
        instagram_media_id: post.id,
      });
      if (insertError) {
        detalhes.push({ id: post.id, status: `erro_insert: ${insertError.message}` });
        continue;
      }

      importados++;
      detalhes.push({ id: post.id, status: 'importado' });
    } catch (e) {
      detalhes.push({ id: post.id, status: 'erro_inesperado' });
    }
  }

  return { modo: 'envio_real', total_posts_encontrados: posts.length, importados, detalhes };
}

export const Route = createFileRoute('/api/public/instagram/sync')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secretEsperado = process.env.ALERTS_CRON_SECRET;
        const secretRecebido = request.headers.get('x-alerts-secret');
        if (!secretEsperado || secretRecebido !== secretEsperado) {
          return Response.json({ error: 'unauthorized' }, { status: 401 });
        }
        try {
          const resumo = await handleSync();
          return Response.json(resumo);
        } catch (e) {
          console.error('[instagram/sync] error', e);
          return Response.json({ error: 'internal_error' }, { status: 500 });
        }
      },
    },
  },
});
