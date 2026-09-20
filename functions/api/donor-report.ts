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
  const seenKeys = new Set<string>();
  let nextCursor: string | null = null;
  let pageCount = 0;
  const MAX_PAGES = 50;

  do {
    pageCount++;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const bodyPayload: Record<string, any> = {
        pagination: {
          limit: 100,
          ...(nextCursor ? { cursor: nextCursor } : {})
        }
      };

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
          if (!seenKeys.has(item.key)) {
            seenKeys.add(item.key);
            allDocs.push({
              key: item.key,
              data: item.data as Record<string, Txn>,
            });
          }
        }
      }

      const newCursor = json.data?.pagination?.next_cursor || null;
      if (!newCursor || newCursor === nextCursor) {
        break;
      }
      nextCursor = newCursor;
    } finally {
      clearTimeout(timeoutId);
    }
  } while (nextCursor && pageCount < MAX_PAGES);

  return allDocs;
}

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const p = new URL(request.url).searchParams.get('week_start');
    const nowSydney = sydneyDate(Date.now());
    // In Sydney, if today is Sunday, the week ending today started on mondayOf(nowSydney).
    // If today is Monday-Saturday, the completed week ended on last Sunday, so it started mondayOf(nowSydney) - 7.
    const sydneyDayOfWeek = new Date(nowSydney + 'T00:00:00Z').getUTCDay();
    const defaultCompletedWeek = sydneyDayOfWeek === 0
      ? mondayOf(nowSydney)
      : addDays(mondayOf(nowSydney), -7);

    const weekStart = p ? mondayOf(p) : defaultCompletedWeek;
    const report = buildReport(await listAllDocs(env), weekStart, 12);
    return new Response(JSON.stringify(report), {
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-cache, no-store, max-age=0, must-revalidate',
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'donor data unavailable' }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }
};
