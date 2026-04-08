export default async function handler(request, response) {
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
      prices: {
        type: "object",
        additionalProperties: false,
        properties: {
          first: { type: "string" },
          second: { type: "string" }
        },
        required: ["first", "second"]
      },
      myPick: { type: "string" },
      opinion: { type: "string" },
      specs: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string" },
            first: { type: "string" },
            second: { type: "string" }
          },
          required: ["name", "first", "second"]
        }
      },
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
    required: ["title", "badge", "prices", "myPick", "opinion", "specs", "summary", "differences", "pros", "cons", "verdict", "sources"]
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
                "Jsi cesky AI porovnavac elektroniky a spotrebni techniky. Udelej aktualni webovy research, oddel fakta od odhadu, vrat vysledek strucne, prehledne a prakticky pro bezneho kupujiciho. U cen pouzij odhadovanou aktualni trzni hladinu a kdyz si nejsi jista, jasne to zaramuj jako odhad."
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                `Porovnej mi ${first} a ${second}. Vrat vysledek v cestine. Chci shrnuti, hlavni rozdily, plusy, minusy, porovnani parametru, odhadovanou cenu obou veci a taky tvuj vlastni nazor co bys doporucila beznemu uzivateli a proc. Pridej jen relevantni zdroje, ktere opravdu podporuji srovnani.`
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
  const parsed = JSON.parse(payload.output_text);

  response.status(200).json({
    result: {
      id: crypto.randomUUID(),
      ...parsed,
      createdAt: new Date().toISOString()
    }
  });
}
