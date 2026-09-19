import { buildReport, mondayOf, addDays, sydneyDate } from '../_lib/aggregate';
import type { Doc, Txn } from '../_lib/aggregate';

export interface Env {
  STAPE_BASE_URL?: string;
  STAPE_API_KEY?: string;
  STAPE_COLLECTION?: string;
}

export async function listAllDocs(env: Env): Promise<Doc[]> {
  const baseUrl = (env.STAPE_BASE_URL || (typeof process !== 'undefined' ? process.env?.STAPE_BASE_URL : '') || 'https://psaeygxm.au.stape.io/stape-api').trim().replace(/\/+$/, '');
  const apiKey = (env.STAPE_API_KEY || (typeof process !== 'undefined' ? process.env?.STAPE_API_KEY : '') || '9ea3d21604ba39a094e0cdca5f93229ec16e471apsaeygxm').trim();
  const collection = (env.STAPE_COLLECTION || (typeof process !== 'undefined' ? process.env?.STAPE_COLLECTION : '') || 'donations').trim();

  if (!baseUrl || !apiKey) {
    throw new Error('Missing Stape configuration');
  }

  const basePathWithKey = baseUrl.endsWith(apiKey) ? baseUrl : `${baseUrl}/${apiKey}`;
  const endpoint = `${basePathWithKey}/v2/store/collections/${collection}/documents`;

  const allDocs: Doc[] = [];
  let nextCursor: string | null = null;
  let pageCount = 0;
  const MAX_PAGES = 100;

  do {
    pageCount++;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const bodyPayload: Record<string, any> = {};
      if (nextCursor) {
        bodyPayload.cursor = nextCursor;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Stape Store error: ${res.status}`);
      }

      const json: any = await res.json();
      if (!json.success && json.error) {
        throw new Error(`Stape Store error: ${json.error?.message || 'unknown'}`);
      }

      const items = json.data?.items || [];
      for (const item of items) {
        if (item && item.key && item.data) {
          allDocs.push({
            key: item.key,
            data: item.data as Record<string, Txn>,
          });
        }
      }

      nextCursor = json.data?.pagination?.next_cursor || null;
    } finally {
      clearTimeout(timeoutId);
    }
  } while (nextCursor && pageCount < MAX_PAGES);

  return allDocs;
}

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const p = new URL(request.url).searchParams.get('week_start');
    // default = last COMPLETED week, same as the report
    const weekStart = p ? mondayOf(p) : addDays(mondayOf(sydneyDate(Date.now())), -7);
    const report = buildReport(await listAllDocs(env), weekStart, 12);
    return new Response(JSON.stringify(report), {
      headers: {
        'content-type': 'application/json',
        'cache-control': 'public, max-age=300',
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'donor data unavailable' }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }
};
