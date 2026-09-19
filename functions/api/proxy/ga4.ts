export const onRequestGet = async () => {
  const url = 'https://connectors.windsor.ai/googleanalytics4?api_key=3f317e7be46a1f3d3e055cb5842471356862&date_preset=last_180d&fields=account_name,campaign,conversions,datasource,date,sessions,transactions,ecommerce_purchases,purchase_revenue,totalrevenue,week,totalusers,session_default_channel_group&select_accounts=387513347';
  try {
    const res = await fetch(url);
    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'public, max-age=300',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to fetch GA4 data' }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }
};
