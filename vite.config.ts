import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv, Plugin} from 'vite';

function donorReportPlugin(env: Record<string, string>): Plugin {
  const cache: Record<string, { data: string; timestamp: number }> = {};
  const CACHE_TTL_MS = 5 * 60 * 1000;

  return {
    name: 'donor-report-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/proxy/')) {
          const proxyType = req.url.split('?')[0].replace('/api/proxy/', '');
          let targetUrl = '';
          if (proxyType === 'perf') {
            targetUrl = 'https://connectors.windsor.ai/all?api_key=3f317e7be46a1f3d3e055cb5842471356862&date_preset=last_180d&fields=account_name,action_values_omni_purchase,actions_landing_page_view,actions_lead,actions_offsite_conversion_fb_pixel_purchase,campaign,clicks,ctr,datasource,date,mobile_feed_standard_preview_url,name,spend,conversion_value,conversions,cost&select_accounts=facebook__10158483724430125,google_ads__328-834-3137,google_ads__977-586-1799';
          } else if (proxyType === 'ga4') {
            targetUrl = 'https://connectors.windsor.ai/googleanalytics4?api_key=3f317e7be46a1f3d3e055cb5842471356862&date_preset=last_180d&fields=account_name,campaign,conversions,datasource,date,sessions,transactions,ecommerce_purchases,purchase_revenue,totalrevenue,week,totalusers,session_default_channel_group&select_accounts=387513347';
          } else if (proxyType === 'gas') {
            targetUrl = env.VITE_GAS_URL || 'https://script.google.com/macros/s/AKfycbyVNGRjATsDF4o67DMzidjm1QymBKj7Z5tJPD_hMWVqwkwiIT7RHf4jtTj4n9bpCNUq/exec';
          }

          if (targetUrl) {
            try {
              const now = Date.now();
              if (cache[proxyType] && (now - cache[proxyType].timestamp < CACHE_TTL_MS)) {
                res.statusCode = 200;
                res.setHeader('content-type', 'application/json');
                res.setHeader('access-control-allow-origin', '*');
                res.end(cache[proxyType].data);
                return;
              }

              const proxyRes = await fetch(targetUrl);
              const text = await proxyRes.text();
              cache[proxyType] = { data: text, timestamp: now };
              res.statusCode = proxyRes.status;
              res.setHeader('content-type', 'application/json');
              res.setHeader('access-control-allow-origin', '*');
              res.end(text);
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
            const { onRequestGet } = await import('./functions/api/donor-report');
            const protocol = req.headers['x-forwarded-proto'] || 'http';
            const host = req.headers.host || 'localhost:3000';
            const fullUrl = new URL(req.url, `${protocol}://${host}`);
            const webReq = new Request(fullUrl.href, {
              method: req.method,
              headers: req.headers as any,
            });
            const cfEnv = {
              STAPE_BASE_URL: env.STAPE_BASE_URL || process.env.STAPE_BASE_URL,
              STAPE_API_KEY: env.STAPE_API_KEY || process.env.STAPE_API_KEY,
              STAPE_COLLECTION: env.STAPE_COLLECTION || process.env.STAPE_COLLECTION,
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
