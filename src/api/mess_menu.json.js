export async function GET() {
const n8nUrl = process.env.N8N_URL;
  try {
    const response = await fetch(n8nUrl);
    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch menu from n8n' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error connecting to n8n' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
