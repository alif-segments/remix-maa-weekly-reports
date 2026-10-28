import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv, Plugin} from 'vite';

function donorReportPlugin(env: Record<string, string>): Plugin {
  const cache: Record<string, { data: string; timestamp: number }> = {};
  const inFlight: Record<string, Promise<string>> = {};
  // 60-minute cache TTL for lightning-fast sub-5ms responses
  const CACHE_TTL_MS = 60 * 60 * 1000;

  const getTargetUrl = (proxyType: string) => {
    if (proxyType === 'perf') {
      return 'https://connectors.windsor.ai/all?api_key=3f317e7be46a1f3d3e055cb5842471356862&date_preset=last_180d&fields=account_name,action_values_omni_purchase,actions_landing_page_view,actions_lead,actions_offsite_conversion_fb_pixel_purchase,campaign,clicks,ctr,datasource,date,mobile_feed_standard_preview_url,name,spend,conversion_value,conversions,cost&select_accounts=facebook__10158483724430125,google_ads__328-834-3137,google_ads__977-586-1799';
    } else if (proxyType === 'ga4') {
      return 'https://connectors.windsor.ai/googleanalytics4?api_key=3f317e7be46a1f3d3e055cb5842471356862&date_preset=last_180d&fields=account_name,campaign,conversions,datasource,date,sessions,transactions,ecommerce_purchases,purchase_revenue,totalrevenue,week,totalusers,session_default_channel_group&select_accounts=387513347';
    } else if (proxyType === 'tiktok') {
      return 'https://connectors.windsor.ai/tiktok?api_key=3f317e7be46a1f3d3e055cb5842471356862&date_preset=last_180d&fields=date,datasource,account_name,campaign,clicks,spend,currency,total_complete_payment_rate,complete_payment&select_accounts=7083339921917870081';
    } else if (proxyType === 'gas') {
      return env.VITE_GAS_URL || 'https://script.google.com/macros/s/AKfycbyVNGRjATsDF4o67DMzidjm1QymBKj7Z5tJPD_hMWVqwkwiIT7RHf4jtTj4n9bpCNUq/exec';
    }
    return '';
  };

  const fetchWithCache = async (proxyType: string, targetUrl: string): Promise<string> => {
    const now = Date.now();
    const cached = cache[proxyType];

    // If cache is fresh, return immediately (<1ms)
    if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
      return cached.data;
    }

    // Stale-While-Revalidate: Return stale cached data instantly while refreshing in background
    if (cached) {
      if (!inFlight[proxyType]) {
        inFlight[proxyType] = fetch(targetUrl)
          .then(res => res.text())
          .then(text => {
            cache[proxyType] = { data: text, timestamp: Date.now() };
            delete inFlight[proxyType];
            return text;
          })
          .catch(err => {
            console.warn(`[Proxy Cache] Background revalidation failed for ${proxyType}:`, err);
            delete inFlight[proxyType];
            return cached.data;
          });
      }
      return cached.data;
    }

    // In-flight deduplication: reuse active request if already fetching
    if (inFlight[proxyType]) {
      return inFlight[proxyType];
    }

    // Cold fetch
    inFlight[proxyType] = fetch(targetUrl)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Upstream returned HTTP ${res.status}`);
        }
        const text = await res.text();
        cache[proxyType] = { data: text, timestamp: Date.now() };
        return text;
      })
      .finally(() => {
        delete inFlight[proxyType];
      });

    return inFlight[proxyType];
  };

  return {
    name: 'donor-report-middleware',
    configureServer(server) {
      // Background pre-warm on server launch so user requests hit hot cache instantly
      setTimeout(() => {
        ['perf', 'ga4', 'tiktok'].forEach(type => {
          const url = getTargetUrl(type);
          if (url) {
            fetchWithCache(type, url).catch(() => {});
          }
        });
      }, 250);

      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/proxy/')) {
          const proxyType = req.url.split('?')[0].replace('/api/proxy/', '');
          const targetUrl = getTargetUrl(proxyType);

          if (targetUrl) {
            try {
              const body = await fetchWithCache(proxyType, targetUrl);
              res.statusCode = 200;
              res.setHeader('content-type', 'application/json');
              res.setHeader('access-control-allow-origin', '*');
              res.end(body);
              return;
            } catch (proxyErr) {
              console.error('Proxy error fetching', targetUrl, proxyErr);
              res.statusCode = 502;
              res.setHeader('content-type', 'application/json');
              res.end(JSON.stringify({ error: 'Proxy fetch failed' }));
              return;
            }
          }
        }

        if (req.url && req.url.startsWith('/api/donor-report')) {
          try {
            console.log('[Dev Proxy] Processing /api/donor-report request...');
            const { onRequestGet } = await import('./functions/api/donor-report');
            const protocol = req.headers['x-forwarded-proto'] || 'http';
            const host = req.headers.host || 'localhost:3000';
            const fullUrl = new URL(req.url, `${protocol}://${host}`);
            const webReq = new Request(fullUrl.href, {
              method: req.method,
              headers: req.headers as any,
            });
            const cfEnv = {
              MAA_BASE_URL: env.MAA_BASE_URL || process.env.MAA_BASE_URL,
              MAA_EMAIL: env.MAA_EMAIL || process.env.MAA_EMAIL,
              MAA_PASSWORD: env.MAA_PASSWORD || process.env.MAA_PASSWORD,
            };
            const response = await onRequestGet({ request: webReq, env: cfEnv });
            res.statusCode = response.status;
            response.headers.forEach((val, key) => {
              res.setHeader(key, val);
            });
            const body = await response.text();
            res.end(body);
            return;
          } catch (err) {
            console.error('API /api/donor-report error:', err);
            res.statusCode = 502;
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify({ error: 'donor data unavailable' }));
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), donorReportPlugin(env)],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
