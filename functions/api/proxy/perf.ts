export const onRequestGet = async () => {
  const url = 'https://connectors.windsor.ai/all?api_key=3f317e7be46a1f3d3e055cb5842471356862&date_preset=last_180d&fields=account_name,action_values_omni_purchase,actions_landing_page_view,actions_lead,actions_offsite_conversion_fb_pixel_purchase,campaign,clicks,ctr,datasource,date,mobile_feed_standard_preview_url,name,spend,conversion_value,conversions,cost&select_accounts=facebook__10158483724430125,google_ads__328-834-3137,google_ads__977-586-1799';
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
    return new Response(JSON.stringify({ error: 'Failed to fetch performance data' }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }
};
