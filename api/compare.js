async function saveComparison(result) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return;
  }

  await fetch(`${url}/rest/v1/comparisons`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: "return=minimal"
    },
    body: JSON.stringify({
      title: result.title,
      comparison_key: result.products.map((product) => product.name).sort().join("::").toLowerCase(),
      payload: result
    })
  });
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const items = Array.isArray(request.body?.items)
    ? request.body.items.map((item) => String(item || "").trim()).filter(Boolean)
    : [];

  if (items.length < 2 || items.length > 3) {
    response.status(400).json({ error: "Send 2 or 3 items" });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-5.4-mini";

  if (!apiKey) {
    response.status(500).json({ error: "Missing OPENAI_API_KEY" });
    return;
  }

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string" },
      badge: { type: "string" },
      products: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string" },
            subtitle: { type: "string" },
            price: { type: "string" },
            imageUrl: { type: "string" },
            imageHint: { type: "string" }
          },
          required: ["name", "subtitle", "price", "imageUrl", "imageHint"]
        }
      },
      myPick: { type: "string" },
      winnerReason: { type: "string" },
      betterFor: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            product: { type: "string" },
            text: { type: "string" }
          },
          required: ["product", "text"]
        }
      },
      summary: { type: "string" },
      differences: {
        type: "array",
        items: { type: "string" }
      },
      specSections: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string" },
            rows: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  name: { type: "string" },
                  values: {
                    type: "array",
                    items: { type: "string" }
                  }
                },
                required: ["name", "values"]
              }
            }
          },
          required: ["title", "rows"]
        }
      },
      pros: {
        type: "array",
        items: { type: "string" }
      },
      cons: {
        type: "array",
        items: { type: "string" }
      },
      verdict: { type: "string" },
      opinion: { type: "string" },
      sources: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string" },
            url: { type: "string" },
            note: { type: "string" }
          },
          required: ["title", "url", "note"]
        }
      }
    },
    required: [
      "title",
      "badge",
      "products",
      "myPick",
      "winnerReason",
      "betterFor",
      "summary",
      "differences",
      "specSections",
      "pros",
      "cons",
      "verdict",
      "opinion",
      "sources"
    ]
  };

  const prompt = `Porovnej mi tyto produkty: ${items.join(", ")}.

Vrat vysledek v cestine, profesionalnim stylem jako kvalitni porovnavac elektroniky.

Pravidla:
- Porovnavej 2 az 3 produkty.
- Udelej aktualni webovy research.
- U cen pouzij odhadovanou aktualni trzni hladinu a kdyz si nejsi jista, uved to opatrne jako odhad.
- U produktu vrat kratky subtitle a kdyz najdes vhodny oficialni nebo obchodni obrazek, vrat imageUrl. Kdyz ne, vrat prazdny retezec.
- Vrat jasneho viteze do myPick a jednou vetou vysvetli proc v winnerReason.
- V betterFor popis pro koho je kazdy produkt lepsi.
- Ve specSections udelej vice strukturovanych sekci podle kategorii jako Displej, Vykon, Fotoaparat, Baterie, Konektivita, Rozmery nebo jine relevantni sekce.
- Ve sources vrat jen relevantni zdroje a do note napis jednou vetou proc je zdroj dulezity.
- Verdict a opinion rozepis profesionalneji a uzitecne pro realneho kupujiciho.`;

  const openAIResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      reasoning: { effort: "medium" },
      tools: [{ type: "web_search" }],
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "Jsi cesky AI porovnavac elektroniky a spotrebni techniky. Pises profesionalne, prehledne a konkretne. Oddeluj jistoty od odhadu, ale porad bud uzitecna a rozhodna."
            }
          ]
        },
        {
          role: "user",
          content: [{ type: "input_text", text: prompt }]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "comparison_result_v3",
          schema,
          strict: true
        }
      }
    })
  });

  if (!openAIResponse.ok) {
    const errorText = await openAIResponse.text();
    response.status(502).json({ error: "OpenAI request failed", details: errorText });
    return;
  }

  const payload = await openAIResponse.json();
  const parsed = JSON.parse(payload.output_text);
  const result = {
    id: crypto.randomUUID(),
    ...parsed,
    cacheMode: "live",
    createdAt: new Date().toISOString()
  };

  try {
    await saveComparison(result);
  } catch {
    // Ulozeni do databaze je bonus.
  }

  response.status(200).json({ result });
}
