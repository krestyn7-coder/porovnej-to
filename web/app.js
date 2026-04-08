const STORAGE_KEY = "porovnej-to-history-v1";

const quickComparisons = [
  ["iPhone 15 Pro", "Google Pixel 10 Pro"],
  ["PS5", "Xbox Series X"],
  ["AirPods Pro 2", "Sony WF-1000XM5"],
  ["MacBook Air", "iPad Pro"],
  ["Netflix", "Max"]
];

const state = {
  history: [],
  lastResult: null
};

const elements = {
  form: document.querySelector("#compareForm"),
  firstItem: document.querySelector("#firstItem"),
  secondItem: document.querySelector("#secondItem"),
  submitButton: document.querySelector(".primary-button"),
  modeNote: document.querySelector("#modeNote"),
  quickList: document.querySelector("#quickList"),
  resultEmpty: document.querySelector("#resultEmpty"),
  resultContent: document.querySelector("#resultContent"),
  resultTitle: document.querySelector("#resultTitle"),
  resultBadge: document.querySelector("#resultBadge"),
  priceFirst: document.querySelector("#priceFirst"),
  priceSecond: document.querySelector("#priceSecond"),
  myPick: document.querySelector("#myPick"),
  specsGrid: document.querySelector("#specsGrid"),
  summaryText: document.querySelector("#summaryText"),
  differencesList: document.querySelector("#differencesList"),
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
  void compareItems(elements.firstItem.value, elements.secondItem.value);
});

elements.clearHistory.addEventListener("click", () => {
  state.history = [];
  persistState();
  renderHistory();
});

quickComparisons.forEach(([first, second]) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "quick-chip";
  button.textContent = `${first} vs ${second}`;
  button.addEventListener("click", () => {
    elements.firstItem.value = first;
    elements.secondItem.value = second;
    void compareItems(first, second);
  });
  elements.quickList.appendChild(button);
});

loadState();
renderHistory();
if (state.lastResult) {
  renderResult(state.lastResult);
}

async function compareItems(firstRaw, secondRaw) {
  const first = String(firstRaw || "").trim();
  const second = String(secondRaw || "").trim();

  if (!first || !second) {
    return;
  }

  const cachedResult = findCachedComparison(first, second);
  if (cachedResult) {
    state.lastResult = cachedResult;
    renderResult(cachedResult);
    renderHistory();
    elements.modeNote.textContent = "Stejne porovnani jsem nasla v historii, tak jsem ho znovu pouzila bez noveho AI volani.";
    return;
  }

  setLoading(true);
  const result = (await tryLiveComparison(first, second)) || generateComparison(first, second);
  state.lastResult = result;
  state.history.unshift(result);
  state.history = state.history.slice(0, 20);
  persistState();
  renderResult(result);
  renderHistory();
  setLoading(false);
}

function generateComparison(first, second) {
  const category = detectCategory(first, second);
  const pair = `${first} vs ${second}`;

  const templates = {
    smartphone: {
      badge: "Telefony",
      summary: `${first} a ${second} budou nejspis cilit na podobneho cloveka, ale kazdy z nich obvykle boduje v jine casti zazitku. Jeden casto pusobi vice premiove a stabilne, druhy zase vice flexibilne a nabizi jiny styl fotek nebo systemu.`,
      prices: {
        first: "Vyssi stredni nebo vyssi trida",
        second: "Vyssi stredni nebo vyssi trida"
      },
      myPick: first,
      opinion: `Kdybych si mela vybrat naslepo pro cloveka, ktery chce co nejmene resit kompromisy, sahla bych spis po ${first}. Pokud ale chces vic experimentovat a zaujala te specificka AI nebo fotky, dava smysl i ${second}.`,
      specs: [
        { name: "Displej", first: "Premiovy OLED panel", second: "Kvalitni OLED panel" },
        { name: "Fotoaparat", first: "Stabilni a konzistentni fotky", second: "Vyrazny vlastni styl fotek" },
        { name: "System", first: "Silny ekosystem a jednoduchost", second: "Vetsi otevrenost a Google sluzby" },
        { name: "Podpora", first: "Dlouha a predvidatelna", second: "Dobra, ale podle znacky ruzne vnimana" }
      ],
      differences: [
        `${first} bude pro nekoho zajimavy hlavne kvuli prostredi, ekosystemu a delce podpory.`,
        `${second} muze vic zaujmout otevrenosti systemu, AI funkcemi nebo vlastnim stylem fotaku.`,
        `Rozhodnuti casto stoji hlavne na tom, jestli chces pohodli a provazanost, nebo vetsi volnost a odlisny charakter telefonu.`
      ],
      pros: [
        `Silnejsi stranky ${first} mohou byt zpracovani, konzistence a jednodussi kazdodenni pouzivani.`,
        `Silnejsi stranky ${second} mohou byt originalnejsi funkce, Google sluzby nebo jiny pristup k fotografii.`
      ],
      cons: [
        `${first} muze vadit cenou nebo mensi volnosti v systemu.`,
        `${second} muze vadit horsi kompatibilitou s nekterymi doplnky nebo jinym stylem prostredi.`
      ],
      verdict: `Jestli chces co nejpohodlnejsi a nejuhlazenejsi zazitek, casto vyhraje ${first}. Jestli chces zkusit neco trochu jineho a vic si hrat s funkcemi, muze byt lepsi ${second}.`
    },
    console: {
      badge: "Herni konzole",
      summary: `${first} a ${second} jsou si vykonove blizko, ale rozdil dela hlavne knihovna her, ovladac a to, ke ktere znacce mas bliz.`,
      prices: {
        first: "Podobna konzolova hladina",
        second: "Podobna konzolova hladina"
      },
      myPick: first,
      opinion: `Tady bych se rozhodovala hlavne podle her. Pokud nemas silnou preferenci, lehce bych se priklonila k ${first}, ale u konzoli je osobni vkus uplne klicovy.`,
      specs: [
        { name: "Vykon", first: "Srovnatelna moderna konzole", second: "Srovnatelna moderna konzole" },
        { name: "Hry", first: "Silne first-party znacky", second: "Silne sluzby a jina nabidka" },
        { name: "Predplatne", first: "Podle ekosystemu", second: "Casto vyhodne pro hrace sluzeb" },
        { name: "Ovlac", first: "Vlastni styl ovladace", second: "Vlastni styl ovladace" }
      ],
      differences: [
        `${first} muze byt silnejsi v exkluzivitach nebo znamych first-party znackach.`,
        `${second} muze zaujmout sluzbami, predplatnym nebo zpusobem, jak se ti pracuje s ekosystemem.`,
        `Kvalita hrani nebude dramaticky jina, ale pocit z cele sluzby ano.`
      ],
      pros: [
        `${first} dava smysl, kdyz te tahnou konkretni hry a znacka.`,
        `${second} muze byt vyhodnejsi, pokud resis pomer cena, knihovna a predplatne.`
      ],
      cons: [
        `${first} nemusi byt nejvyhodnejsi, kdyz resis hlavne cenu her a sluzeb.`,
        `${second} nemusi mit presne ty exkluzivity, ktere chces hrat.`
      ],
      verdict: `Vyber podle her, ne podle tabulek. Pokud te vic lakaji hry na ${first}, vem ${first}. Pokud chces sirsi hodnotu kolem sluzeb, muze sedet vic ${second}.`
    },
    audio: {
      badge: "Sluchatka",
      summary: `U ${first} a ${second} obvykle rozhoduje hlavne pohodli, zvukovy charakter, ANC a to, s jakym telefonem je budes nejvic pouzivat.`,
      prices: {
        first: "Vyssi audio trida",
        second: "Vyssi audio trida"
      },
      myPick: second,
      opinion: `Kdybych vybirala ciste podle zvuku a univerzalnosti, casto bych sahla po ${second}. Pokud je pro tebe ale dulezite bezproblemove pouzivani v jednom ekosystemu, ${first} muze byt prijemnejsi volba.`,
      specs: [
        { name: "Zvuk", first: "Vyladeny pro pohodove poslouchani", second: "Casto detailnejsi a nastavitelny" },
        { name: "ANC", first: "Silne", second: "Velmi silne" },
        { name: "Ekosystem", first: "Top v jednom ekosystemu", second: "Univerzalnejsi" },
        { name: "Nastaveni", first: "Jednodussi", second: "Podrobnejsi" }
      ],
      differences: [
        `${first} muze byt silnejsi v jednoduchosti ovladani a propojeni s jednou znackou.`,
        `${second} muze nabidnout jiny zvukovy projev nebo detailnejsi nastaveni.`,
        `Rozdil je casto vic o preferencich nez o tom, co je objektivne lepsi.`
      ],
      pros: [
        `${first} muze bodovat pohodlim a bezproblemovym pouzivanim.`,
        `${second} muze bodovat zvukem, ANC nebo aplikaci s nastavenim.`
      ],
      cons: [
        `${first} nemusi sedet, pokud chces hodne nastavovani a neutralni zvuk.`,
        `${second} nemusi byt tak pohodlne v kazdem ekosystemu.`
      ],
      verdict: `Pro bezstarostne pouzivani casto vyjde lip ${first}. Pro hrani se zvukem a nastavenim muze vyhrat ${second}.`
    },
    streaming: {
      badge: "Streamovaci sluzby",
      summary: `${first} a ${second} se nejvic lisi nabidkou obsahu, stylem aplikace a tim, co realne sledujes nejcasteji.`,
      prices: {
        first: "Podle aktualniho tarifu sluzby",
        second: "Podle aktualniho tarifu sluzby"
      },
      myPick: first,
      opinion: `Tady bych volila to, co budes opravdu zapinat casteji. Kdybych mela vybrat naslepo, necham si ${first} jen pokud mi dlouhodobe dava vic konkretniho obsahu.`,
      specs: [
        { name: "Obsah", first: "Vlastni tvorba a doporuceni", second: "Jiny mix filmu a serialu" },
        { name: "Aplikace", first: "Znamy styl ovladani", second: "Jiny pocit z prohlizeni" },
        { name: "Cena", first: "Podle tarifu", second: "Podle tarifu" },
        { name: "Pro koho", first: "Pro fanousky jejich katalogu", second: "Pro fanousky jineho typu obsahu" }
      ],
      differences: [
        `${first} muze mit pro tebe zajimavejsi vlastni tvorbu a jina doporuceni.`,
        `${second} muze nabizet jiny pomer filmu, serialu a lokalniho obsahu.`,
        `Rozhodnuti se casto nema delat podle poctu titulu, ale podle toho, co opravdu zapinas.`
      ],
      pros: [
        `${first} dava smysl, kdyz te bavi jejich styl katalogu a originaly.`,
        `${second} muze byt lepsi, kdyz chces jiny typ knihovny nebo vyhodnejsi pocit z predplatneho.`
      ],
      cons: [
        `${first} muze pusobit omezenim katalogu v nekterych oblastech.`,
        `${second} nemusi mit tak silne tituly presne pro tvuj vkus.`
      ],
      verdict: `Vyber bych delala podle konkretniho obsahu, ktery opravdu sledujes. Pokud casteji oteviras ${first}, zustala bych u ${first}; jinak muze byt rozumnejsi ${second}.`
    },
    general: {
      badge: "Rychle porovnani",
      summary: `${first} a ${second} budou nejspis cilit na podobnou potrebu, ale kazda varianta muze byt lepsi pro jiny typ cloveka.`,
      prices: {
        first: "Podle trhu a varianty",
        second: "Podle trhu a varianty"
      },
      myPick: first,
      opinion: `Kdybych mela vybrat jen podle bezpecnejsiho dojmu, sahla bych spis po ${first}. Pokud ale vis, proc chces konkretne ${second}, klidne muze byt lepsi prave ten.`,
      specs: [
        { name: "Hlavni fokus", first: "Vyrovnany zazitek", second: "Jina priorita nebo funkce" },
        { name: "Pouziti", first: "Univerzalnejsi", second: "Specifickejsi" },
        { name: "Pomer cena vykon", first: "Zalezi na trhu", second: "Zalezi na trhu" },
        { name: "Pro koho", first: "Pro cloveka co chce klid", second: "Pro cloveka co vi co chce" }
      ],
      differences: [
        `${first} muze pusobit bezpecneji a jednoduseji na kazdodenni pouzivani.`,
        `${second} muze byt zajimavejsi, pokud hledas neco konkretniho nebo jiny pomer ceny a hodnoty.`,
        `Nejvetsi rozdil casto neni v jedne specifikaci, ale v tom, co od toho ve skutecnosti cekas.`
      ],
      pros: [
        `${first} muze byt lepsi volba pro cloveka, ktery chce jistotu a vyrovnany zazitek.`,
        `${second} muze byt lepsi pro cloveka, ktery chce neco specifickeho nebo jinou prioritu.`
      ],
      cons: [
        `${first} nemusi byt idealni, pokud je pro tebe hlavni originalita nebo specificka funkce.`,
        `${second} nemusi byt nejjistejsi volba, pokud chces univerzalni reseni.`
      ],
      verdict: `Kdybych mela vybrat naslepo, volila bych to, co vic odpovida tvym prioritam. Jestli chces jednodussi a klidnejsi volbu, spis ${first}. Jestli chces neco specifickeho, spis ${second}.`
    }
  };

  const selected = templates[category];
  return {
    id: crypto.randomUUID(),
    title: pair,
    first,
    second,
    badge: `Demo - ${selected.badge}`,
    prices: selected.prices,
    myPick: selected.myPick,
    opinion: selected.opinion,
    specs: selected.specs,
    summary: selected.summary,
    differences: selected.differences,
    pros: selected.pros,
    cons: selected.cons,
    verdict: selected.verdict,
    sources: [],
    createdAt: new Date().toISOString()
  };
}

function detectCategory(first, second) {
  const value = `${first} ${second}`.toLowerCase();

  if (/(iphone|pixel|samsung|galaxy|phone|telefon)/.test(value)) {
    return "smartphone";
  }

  if (/(ps5|playstation|xbox|konzole)/.test(value)) {
    return "console";
  }

  if (/(airpods|sony|sluchat|buds|headphones|wf-)/.test(value)) {
    return "audio";
  }

  if (/(netflix|max|disney|prime video|oneplay|magenta)/.test(value)) {
    return "streaming";
  }

  return "general";
}

function renderResult(result) {
  elements.resultEmpty.hidden = true;
  elements.resultContent.hidden = false;
  elements.resultTitle.textContent = result.title;
  elements.resultBadge.textContent = result.badge;
  elements.priceFirst.textContent = result.prices?.first || "-";
  elements.priceSecond.textContent = result.prices?.second || "-";
  elements.myPick.textContent = result.myPick || "-";
  elements.summaryText.textContent = result.summary;
  elements.opinionText.textContent = result.opinion || result.verdict;
  renderBulletList(elements.differencesList, result.differences);
  renderBulletList(elements.prosList, result.pros);
  renderBulletList(elements.consList, result.cons);
  elements.verdictText.textContent = result.verdict;
  renderSpecs(result);

  if (Array.isArray(result.sources) && result.sources.length) {
    elements.sourcesPanel.hidden = false;
    elements.sourcesList.innerHTML = result.sources
      .map((source) => `<li><a href="${escapeAttribute(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.title)}</a></li>`)
      .join("");
  } else {
    elements.sourcesPanel.hidden = true;
    elements.sourcesList.innerHTML = "";
  }
}

function renderSpecs(result) {
  const specs = Array.isArray(result.specs) ? result.specs : [];
  if (!specs.length) {
    elements.specsGrid.innerHTML = "<p>Parametry zatim nejsou k dispozici.</p>";
    return;
  }

  elements.specsGrid.innerHTML = specs
    .map(
      (spec) => `
        <article class="spec-row">
          <strong class="spec-name">${escapeHtml(spec.name)}</strong>
          <div class="spec-values">
            <div class="spec-value">
              <span class="spec-device">${escapeHtml(result.first)}</span>
              <strong>${escapeHtml(spec.first)}</strong>
            </div>
            <div class="spec-value">
              <span class="spec-device">${escapeHtml(result.second)}</span>
              <strong>${escapeHtml(spec.second)}</strong>
            </div>
          </div>
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
      <span>${escapeHtml(entry.verdict)}</span>
    `;
    button.addEventListener("click", () => {
      state.lastResult = entry;
      renderResult(entry);
    });
    elements.historyList.appendChild(button);
  });
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

function findCachedComparison(first, second) {
  const targetKey = comparisonKey(first, second);
  return state.history.find((entry) => comparisonKey(entry.first, entry.second) === targetKey) || null;
}

function comparisonKey(first, second) {
  const normalized = [normalizeItem(first), normalizeItem(second)].sort();
  return normalized.join("::");
}

function normalizeItem(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

async function tryLiveComparison(first, second) {
  try {
    const response = await fetch("./api/compare", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ first, second })
    });

    if (!response.ok) {
      if (response.status === 404) {
        elements.modeNote.textContent = "Backend zatim neni nasazeny, proto appka pouziva demo rezim.";
      }
      return null;
    }

    const payload = await response.json();
    if (!payload || !payload.result) {
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
  elements.submitButton.textContent = isLoading ? "Porovnavam..." : "Porovnat";
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
