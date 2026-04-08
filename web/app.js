const STORAGE_KEY = "porovnej-to-history-v3";

const quickComparisons = [
  ["iPhone 16 Pro", "Samsung Galaxy S25 Ultra", "Pixel 10 Pro"],
  ["PS5 Pro", "Xbox Series X", ""],
  ["AirPods Pro 2", "Sony WF-1000XM5", "Bose QuietComfort Ultra Earbuds"],
  ["MacBook Air M3", "Asus Zenbook 14 OLED", "Dell XPS 13"],
  ["Netflix", "Max", "Disney+"]
];

const state = {
  history: [],
  lastResult: null
};

const elements = {
  form: document.querySelector("#compareForm"),
  firstItem: document.querySelector("#firstItem"),
  secondItem: document.querySelector("#secondItem"),
  thirdItem: document.querySelector("#thirdItem"),
  submitButton: document.querySelector(".primary-button"),
  modeNote: document.querySelector("#modeNote"),
  quickList: document.querySelector("#quickList"),
  resultEmpty: document.querySelector("#resultEmpty"),
  resultContent: document.querySelector("#resultContent"),
  resultTitle: document.querySelector("#resultTitle"),
  resultBadge: document.querySelector("#resultBadge"),
  productGrid: document.querySelector("#productGrid"),
  myPick: document.querySelector("#myPick"),
  winnerReason: document.querySelector("#winnerReason"),
  modeSummary: document.querySelector("#modeSummary"),
  sourceCount: document.querySelector("#sourceCount"),
  summaryText: document.querySelector("#summaryText"),
  betterForGrid: document.querySelector("#betterForGrid"),
  differencesList: document.querySelector("#differencesList"),
  specSections: document.querySelector("#specSections"),
  prosList: document.querySelector("#prosList"),
  consList: document.querySelector("#consList"),
  verdictText: document.querySelector("#verdictText"),
  opinionText: document.querySelector("#opinionText"),
  sourcesPanel: document.querySelector("#sourcesPanel"),
  sourcesList: document.querySelector("#sourcesList"),
  historyList: document.querySelector("#historyList"),
  clearHistory: document.querySelector("#clearHistory")
};

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  void compareItems([
    elements.firstItem.value,
    elements.secondItem.value,
    elements.thirdItem.value
  ]);
});

elements.clearHistory.addEventListener("click", async () => {
  state.history = [];
  persistState();
  renderHistory();

  try {
    await fetch("./api/history", { method: "DELETE" });
  } catch {
    // Lokalni fallback uz probehl.
  }
});

quickComparisons.forEach((items) => {
  const label = items.filter(Boolean).join(" vs ");
  const button = document.createElement("button");
  button.type = "button";
  button.className = "quick-chip";
  button.textContent = label;
  button.addEventListener("click", () => {
    elements.firstItem.value = items[0] || "";
    elements.secondItem.value = items[1] || "";
    elements.thirdItem.value = items[2] || "";
    void compareItems(items);
  });
  elements.quickList.appendChild(button);
});

void init();

async function init() {
  loadState();
  await loadRemoteHistory();
  renderHistory();
  if (state.lastResult) {
    renderResult(state.lastResult);
  }
}

async function compareItems(rawItems) {
  const items = rawItems.map((item) => String(item || "").trim()).filter(Boolean);
  if (items.length < 2) {
    return;
  }

  const cachedResult = findCachedComparison(items);
  if (cachedResult) {
    state.lastResult = cachedResult;
    renderResult(cachedResult);
    renderHistory();
    elements.modeNote.textContent = "Stejne porovnani jsem nasla v historii, tak jsem ho znovu pouzila bez noveho AI volani.";
    return;
  }

  setLoading(true);
  const result = (await tryLiveComparison(items)) || generateDemoComparison(items);
  const nextResult = {
    ...result,
    cacheMode: result.cacheMode || "live"
  };
  state.lastResult = nextResult;
  upsertHistory(nextResult);
  persistState();
  renderResult(nextResult);
  renderHistory();
  setLoading(false);
}

function generateDemoComparison(items) {
  const products = items.map((name) => ({
    name,
    subtitle: "Demo nahled produktu",
    price: "Orientacni trzni hladina",
    imageUrl: "",
    imageHint: initialsFor(name)
  }));

  return {
    id: crypto.randomUUID(),
    title: items.join(" vs "),
    badge: "Demo porovnani",
    products,
    summary: `${items.join(", ")} cílí pravděpodobně na podobnou skupinu lidí, ale každý produkt má jiný poměr ceny, parametrů a celkového dojmu.`,
    myPick: items[0],
    winnerReason: "V demo rezimu beru jako bezpecnejsi volbu prvni produkt, protoze nemam zivy research.",
    betterFor: products.map((product, index) => ({
      product: product.name,
      text:
        index === 0
          ? "Pro cloveka, ktery chce bezpecnejsi univerzalni volbu a celkove vyrovnany zazitek."
          : "Pro cloveka, ktery hleda trochu jiny styl, konkretni funkci nebo lepsi pomer ceny a vykonu."
    })),
    differences: [
      "Nejvetsi rozdil casto neni v jedne specifikaci, ale v kombinaci ceny, parametru a celkoveho dojmu.",
      "Vyber je dobry delat podle toho, jestli chces jistotu, konkretni funkce nebo nejlepsi pomer hodnoty.",
      "Pro profesionalnejsi vysledek je lepsi zive AI porovnani se zdroji."
    ],
    specSections: [
      {
        title: "Zakladni prehled",
        rows: [
          {
            name: "Kategorie",
            values: products.map(() => "Elektronika / demo kategorie")
          },
          {
            name: "Cena",
            values: products.map((product) => product.price)
          },
          {
            name: "Dojem",
            values: products.map((product, index) =>
              index === 0 ? "Bezpecnejsi univerzalni volba" : "Alternativa s jinou prioritou"
            )
          }
        ]
      }
    ],
    pros: [
      "Rychly prvni nahled bez cekani na backend.",
      "Stejna struktura jako u ostreho AI vystupu."
    ],
    cons: [
      "Neobsahuje realny webovy research.",
      "Ceny a parametry nejsou overene z aktualnich zdroju."
    ],
    verdict: `Kdybych mela vybrat v demo rezimu, sahla bych spis po ${items[0]}, ale pro realne rozhodnuti bych urcite chtela zive AI porovnani.`,
    opinion: `Profesionalne bych to shrnula tak, ze demo vysledek je dobry jen jako rychly ramec. Na skutecne nakupni rozhodnuti je lepsi pouzit ostrou AI verzi, ktera pracuje se zdroji, cenami a detailnimi parametry.`,
    sources: [],
    createdAt: new Date().toISOString()
  };
}

function renderResult(result) {
  elements.resultEmpty.hidden = true;
  elements.resultContent.hidden = false;
  elements.resultTitle.textContent = result.title;
  elements.resultBadge.textContent = result.badge || "AI porovnani";
  elements.myPick.textContent = result.myPick || "-";
  elements.winnerReason.textContent = result.winnerReason || "-";
  elements.modeSummary.textContent = result.cacheMode === "history" ? "Historie" : "Live AI";
  elements.sourceCount.textContent = String((result.sources || []).length);
  elements.summaryText.textContent = result.summary || "";
  elements.verdictText.textContent = result.verdict || "";
  elements.opinionText.textContent = result.opinion || result.verdict || "";

  renderProducts(result.products || []);
  renderBetterFor(result.betterFor || []);
  renderBulletList(elements.differencesList, result.differences || []);
  renderSpecSections(result);
  renderBulletList(elements.prosList, result.pros || []);
  renderBulletList(elements.consList, result.cons || []);
  renderSources(result.sources || []);
}

function renderProducts(products) {
  elements.productGrid.innerHTML = products
    .map((product) => {
      const media = product.imageUrl
        ? `<img src="${escapeAttribute(product.imageUrl)}" alt="${escapeHtml(product.name)}" />`
        : `<div class="product-fallback">${escapeHtml(product.imageHint || initialsFor(product.name))}</div>`;

      return `
        <article class="product-card">
          <div class="product-media">${media}</div>
          <h3>${escapeHtml(product.name)}</h3>
          <p class="product-subtitle">${escapeHtml(product.subtitle || "Bez dalsiho popisu")}</p>
          <span class="product-price">${escapeHtml(product.price || "-")}</span>
        </article>
      `;
    })
    .join("");
}

function renderBetterFor(items) {
  elements.betterForGrid.innerHTML = items
    .map(
      (item) => `
        <article class="use-case-card">
          <p class="use-case-label">Lepsi pro</p>
          <strong>${escapeHtml(item.product)}</strong>
          <p>${escapeHtml(item.text)}</p>
        </article>
      `
    )
    .join("");
}

function renderSpecSections(result) {
  const sections = Array.isArray(result.specSections) ? result.specSections : [];
  const products = Array.isArray(result.products) ? result.products : [];

  if (!sections.length) {
    elements.specSections.innerHTML = "<p class=\"empty-state\">Parametry zatim nejsou k dispozici.</p>";
    return;
  }

  elements.specSections.innerHTML = sections
    .map((section) => {
      const headCells = products.map((product) => `<th>${escapeHtml(product.name)}</th>`).join("");
      const rows = section.rows
        .map((row) => {
          const valueCells = row.values
            .map((value) => `<td>${escapeHtml(value || "-")}</td>`)
            .join("");
          return `<tr><td class="spec-name-cell">${escapeHtml(row.name)}</td>${valueCells}</tr>`;
        })
        .join("");

      return `
        <article class="spec-table">
          <div class="spec-table-title">${escapeHtml(section.title)}</div>
          <div class="spec-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Parametr</th>
                  ${headCells}
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderSources(sources) {
  if (!sources.length) {
    elements.sourcesPanel.hidden = true;
    elements.sourcesList.innerHTML = "";
    return;
  }

  elements.sourcesPanel.hidden = false;
  elements.sourcesList.innerHTML = sources
    .map(
      (source) => `
        <article class="source-card">
          <strong>${escapeHtml(source.title)}</strong>
          <p class="source-note">${escapeHtml(source.note || "Zdroj k porovnani")}</p>
          <a href="${escapeAttribute(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.url)}</a>
        </article>
      `
    )
    .join("");
}

function renderBulletList(target, items) {
  target.innerHTML = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderHistory() {
  if (!state.history.length) {
    elements.historyList.className = "history-list empty-state";
    elements.historyList.textContent = "Zatim tu nejsou zadna porovnani.";
    return;
  }

  elements.historyList.className = "history-list";
  elements.historyList.innerHTML = "";

  state.history.forEach((entry) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "history-item";
    button.innerHTML = `
      <strong>${escapeHtml(entry.title)}</strong>
      <span>${escapeHtml(entry.verdict || entry.summary || "")}</span>
    `;
    button.addEventListener("click", () => {
      state.lastResult = { ...entry, cacheMode: "history" };
      renderResult(state.lastResult);
    });
    elements.historyList.appendChild(button);
  });
}

async function loadRemoteHistory() {
  try {
    const response = await fetch("./api/history");
    if (!response.ok) {
      return;
    }

    const payload = await response.json();
    const remoteItems = Array.isArray(payload.items) ? payload.items : [];
    remoteItems.forEach((item) => upsertHistory(item, false));
    persistState();
  } catch {
    // Lokalni historie zustava i bez backendu.
  }
}

function upsertHistory(entry, moveToFront = true) {
  const key = comparisonKey((entry.products || []).map((product) => product.name));
  state.history = state.history.filter(
    (item) => comparisonKey((item.products || []).map((product) => product.name)) !== key
  );

  if (moveToFront) {
    state.history.unshift(entry);
  } else {
    state.history.push(entry);
  }

  state.history = state.history.slice(0, 25);
}

function persistState() {
  const snapshot = {
    history: state.history,
    lastResult: state.lastResult
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw);
    state.history = Array.isArray(parsed.history) ? parsed.history : [];
    state.lastResult = parsed.lastResult || null;
  } catch {
    state.history = [];
    state.lastResult = null;
  }
}

function findCachedComparison(items) {
  const targetKey = comparisonKey(items);
  const match = state.history.find(
    (entry) => comparisonKey((entry.products || []).map((product) => product.name)) === targetKey
  );
  return match ? { ...match, cacheMode: "history" } : null;
}

function comparisonKey(items) {
  return items
    .map(normalizeItem)
    .filter(Boolean)
    .sort()
    .join("::");
}

function normalizeItem(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

async function tryLiveComparison(items) {
  try {
    const response = await fetch("./api/compare", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ items })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      if (payload?.details?.includes("insufficient_quota")) {
        elements.modeNote.textContent = "AI backend bezi, ale OpenAI API nema dostatek kreditu.";
      }
      return null;
    }

    const payload = await response.json();
    if (!payload?.result) {
      return null;
    }

    elements.modeNote.textContent = "Bezi zive AI porovnani z webu.";
    return payload.result;
  } catch {
    elements.modeNote.textContent = "Zive AI porovnani neni dostupne, proto appka pouziva demo rezim.";
    return null;
  }
}

function setLoading(isLoading) {
  elements.submitButton.disabled = isLoading;
  elements.submitButton.textContent = isLoading ? "Porovnavam..." : "Porovnat produkty";
}

function initialsFor(name) {
  return String(name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "AI";
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(text) {
  return escapeHtml(text);
}
