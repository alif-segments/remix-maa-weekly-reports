export const onRequestGet = async ({ env }: { env?: { VITE_GAS_URL?: string } }) => {
  const url = (env && env.VITE_GAS_URL) || 'https://script.google.com/macros/s/AKfycbyVNGRjATsDF4o67DMzidjm1QymBKj7Z5tJPD_hMWVqwkwiIT7RHf4jtTj4n9bpCNUq/exec';
  try {
    const res = await fetch(url);
    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: {
        'content-type': 'application/json',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }
};
