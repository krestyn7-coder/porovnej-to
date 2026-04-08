export async function compareRoute(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { first, second } = request.body || {};
  if (!first || !second) {
    response.status(400).json({ error: "Missing comparison items" });
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
      summary: { type: "string" },
      differences: {
        type: "array",
        items: { type: "string" }
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
      sources: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string" },
            url: { type: "string" }
          },
          required: ["title", "url"]
        }
      }
    },
    required: ["title", "badge", "summary", "differences", "pros", "cons", "verdict", "sources"]
  };

  const openAIResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      reasoning: { effort: "medium" },
      tools: [
        {
          type: "web_search"
        }
      ],
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "Jsi cesky AI porovnavac produktu. Udelej aktualni webovy research, oddel fakta od odhadu, vrat vysledek strucne, prehledne a prakticky pro bezneho kupujiciho."
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                `Porovnej mi ${first} a ${second}. Vrat shrnuti, hlavni rozdily, plusy, minusy a verdikt v cestine. Pridej jen relevantni zdroje, ktere opravdu podporuji srovnani.`
            }
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "comparison_result",
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
  const outputText = payload.output_text;
  const parsed = JSON.parse(outputText);

  response.status(200).json({
    result: {
      id: crypto.randomUUID(),
      ...parsed,
      createdAt: new Date().toISOString()
    }
  });
}
