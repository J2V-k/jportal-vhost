export default async function handler(req, res) {
  try {
    const baseUrl = process.env.N8N_URL;
    if (!baseUrl) {
      res.status(500).json({ status: "error", message: "N8N_URL not configured" });
      return;
    }

    const endpoint = req.query?.endpoint || "/webhook/messmenu";
    const targetUrl = new URL(endpoint, baseUrl).toString();

    const headers = {
      ...(process.env.N8N_AUTH_TOKEN ? { Authorization: `Bearer ${process.env.N8N_AUTH_TOKEN}` } : {}),
    };

    const resp = await fetch(targetUrl, {
      method: "GET",
      headers,
    });
    const data = await resp.json();

    res.status(resp.status);
    res.json(data);
  } catch (err) {
    res.status(500).json({ status: "error", message: "Failed to fetch mess menu" });
  }
}