async function loadHistory() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return [];
  }

  const response = await fetch(
    `${url}/rest/v1/comparisons?select=payload&order=created_at.desc&limit=25`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`
      }
    }
  );

  if (!response.ok) {
    return [];
  }

  const rows = await response.json();
  return rows.map((row) => row.payload).filter(Boolean);
}

async function clearHistory() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return;
  }

  await fetch(`${url}/rest/v1/comparisons?id=gt.0`, {
    method: "DELETE",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`
    }
  });
}

export default async function handler(request, response) {
  if (request.method === "GET") {
    const items = await loadHistory();
    response.status(200).json({ items });
    return;
  }

  if (request.method === "DELETE") {
    await clearHistory();
    response.status(200).json({ ok: true });
    return;
  }

  response.status(405).json({ error: "Method not allowed" });
}
