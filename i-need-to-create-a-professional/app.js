const STORAGE_KEYS = {
  estimates: "ctw.savedEstimates.v1",
  settings: "ctw.settings.v1",
};

const defaultSettings = {
  businessName: "Cascadia Tree Works",
  tagline: "Tree Removal, Pruning, Fire Mitigation & View Enhancement",
  phone: "",
  email: "",
  laborRate: 100,
  climbingRate: 150,
  groundRate: 45,
  minimumJob: 350,
  halfDayTarget: 750,
  fullDaySoloTarget: 1250,
  fullDayCrewTarget: 1800,
  technicalDayTarget: 2400,
  dumpTrailerCost: 100,
  fuelFee: 95,
  defaultRiskMargin: 22,
  defaultProfitMargin: 20,
  salesTaxEnabled: false,
  salesTaxRate: 0,
};

const emptyTree = () => ({
  id: crypto.randomUUID(),
  species: "",
  height: 60,
  dbh: 18,
  stems: 1,
  condition: "Alive",
  lean: "Neutral",
  life: "Alive",
  access: "Moderate",
  dropZone: "Moderate",
  targets: [],
  powerLines: false,
  climbRequired: true,
  riggingRequired: false,
  craneRecommended: false,
  customerKeepsWood: false,
  customerKeepsBrush: false,
});

const defaultEstimate = () => ({
  id: crypto.randomUUID(),
  status: "Draft",
  createdAt: new Date().toISOString(),
  customer: {
    name: "",
    phone: "",
    email: "",
    address: "",
    date: localDate(),
    notes: "",
  },
  jobTypes: ["Removal"],
  trees: [emptyTree()],
  pricing: {
    laborHours: 6,
    workers: 1,
    workDays: 1,
    dumpTrailerNeeded: false,
    trailerCost: state.settings?.dumpTrailerCost || defaultSettings.dumpTrailerCost,
    dumpFees: 0,
    fuelFee: state.settings?.fuelFee || defaultSettings.fuelFee,
    equipmentRental: 0,
    subcontractorCost: 0,
    craneLiftCost: 0,
    permitCost: 0,
    miscCost: 0,
    riskMargin: state.settings?.defaultRiskMargin || defaultSettings.defaultRiskMargin,
    profitMargin: state.settings?.defaultProfitMargin || defaultSettings.defaultProfitMargin,
    deposit: 0,
    paymentTerms: "Payment due upon completion unless otherwise agreed.",
    scope: "",
  },
});

const jobTypes = [
  "Removal",
  "Technical climbing removal",
  "Pruning",
  "Fire mitigation",
  "Limbing",
  "View enhancement",
  "Brush cleanup",
  "Hauling",
  "Subcontract climbing",
  "Other",
];

const targetOptions = ["House", "Shed", "Fence", "Road", "Driveway", "Septic", "Landscaping", "Power line", "Other"];

const templates = [
  {
    name: "Solo Climbing Removal",
    description: "Customer keeps wood and brush. Climber only, no hauling.",
    apply: (estimate) => {
      estimate.jobTypes = ["Removal", "Technical climbing removal"];
      estimate.pricing.laborHours = 7;
      estimate.pricing.workers = 1;
      estimate.pricing.dumpTrailerNeeded = false;
      estimate.pricing.dumpFees = 0;
      estimate.pricing.riskMargin = 28;
      estimate.pricing.scope = "Climb and remove designated tree in manageable sections. Customer keeps all wood and brush onsite. Cleanup limited to work area safety sweep.";
      estimate.trees[0].climbRequired = true;
      estimate.trees[0].customerKeepsWood = true;
      estimate.trees[0].customerKeepsBrush = true;
    },
  },
  {
    name: "Small Removal With Cleanup",
    description: "Solo or two-person crew with brush cleanup and optional hauling.",
    apply: (estimate) => {
      estimate.jobTypes = ["Removal", "Brush cleanup", "Hauling"];
      estimate.pricing.laborHours = 6;
      estimate.pricing.workers = 2;
      estimate.pricing.dumpTrailerNeeded = true;
      estimate.pricing.dumpFees = 120;
      estimate.pricing.riskMargin = 20;
      estimate.pricing.scope = "Remove small to mid-size tree, process material, clean work area, and haul brush/debris unless customer elects to keep material onsite.";
    },
  },
  {
    name: "Fire Mitigation Day",
    description: "Day-rate style defensible space, slash cleanup optional.",
    apply: (estimate) => {
      estimate.jobTypes = ["Fire mitigation", "Limbing", "Brush cleanup"];
      estimate.pricing.laborHours = 8;
      estimate.pricing.workers = 1;
      estimate.pricing.workDays = 1;
      estimate.pricing.riskMargin = 18;
      estimate.pricing.scope = "Fire mitigation day: limb ladder fuels, thin small trees/brush, pile or stage slash as agreed, and improve defensible space around structures.";
      estimate.trees[0].climbRequired = false;
      estimate.trees[0].riggingRequired = false;
    },
  },
  {
    name: "Technical Near Structure",
    description: "Climbing and rigging with higher price floor and ground help.",
    apply: (estimate) => {
      estimate.jobTypes = ["Technical climbing removal", "Removal"];
      estimate.pricing.laborHours = 8;
      estimate.pricing.workers = 2;
      estimate.pricing.riskMargin = 35;
      estimate.pricing.subcontractorCost = 350;
      estimate.pricing.scope = "Technical removal near structure. Climb and rig sections to protect targets. Ground worker recommended for rope handling, landing zone control, and cleanup support.";
      estimate.trees[0].climbRequired = true;
      estimate.trees[0].riggingRequired = true;
      estimate.trees[0].dropZone = "Tight";
      estimate.trees[0].targets = ["House"];
    },
  },
  {
    name: "Pruning / View Enhancement",
    description: "Hourly or half-day pruning with cleanup optional.",
    apply: (estimate) => {
      estimate.jobTypes = ["Pruning", "View enhancement"];
      estimate.pricing.laborHours = 4;
      estimate.pricing.workers = 1;
      estimate.pricing.riskMargin = 15;
      estimate.pricing.scope = "Selective pruning and view enhancement. Remove or reduce specified limbs for clearance, light, and sight lines while preserving tree health where practical.";
      estimate.trees[0].climbRequired = true;
      estimate.trees[0].riggingRequired = false;
    },
  },
];

const state = {
  activeScreen: "dashboard",
  settings: loadSettings(),
  estimate: null,
  saved: loadSaved(),
  dictation: {
    supported: Boolean(window.SpeechRecognition || window.webkitSpeechRecognition),
    activePath: null,
    status: "",
  },
};

state.estimate = defaultEstimate();

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function localDate() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

function loadSettings() {
  try {
    return { ...defaultSettings, ...JSON.parse(localStorage.getItem(STORAGE_KEYS.settings) || "{}") };
  } catch {
    return { ...defaultSettings };
  }
}

function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.estimates) || "[]");
  } catch {
    return [];
  }
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(state.settings));
}

function saveEstimates() {
  localStorage.setItem(STORAGE_KEYS.estimates, JSON.stringify(state.saved));
}

function calculateDifficulty(estimate) {
  let score = 1;
  const trees = estimate.trees;

  trees.forEach((tree) => {
    if (Number(tree.height) >= 80) score += 1.2;
    else if (Number(tree.height) >= 55) score += 0.6;
    if (Number(tree.dbh) >= 30) score += 1;
    else if (Number(tree.dbh) >= 18) score += 0.45;
    if (tree.life !== "Alive" || tree.condition.includes("Dead") || tree.condition.includes("Compromised")) score += 1.1;
    if (tree.dropZone === "Tight") score += 1.1;
    if (tree.dropZone === "Very tight") score += 1.5;
    if (tree.targets.length) score += Math.min(1.6, tree.targets.length * 0.35);
    if (tree.powerLines || tree.targets.includes("Power line")) score += 1.2;
    if (tree.climbRequired) score += 0.7;
    if (tree.riggingRequired) score += 1.1;
    if (tree.craneRecommended) score += 1.2;
    if (tree.access === "Difficult") score += 0.85;
    if (tree.access === "Poor / steep") score += 1.2;
  });

  if (estimate.jobTypes.includes("Hauling") || estimate.pricing.dumpTrailerNeeded) score += 0.35;
  if (estimate.customer.notes.toLowerCase().includes("rush")) score += 0.4;
  if (estimate.customer.notes.toLowerCase().includes("customer help")) score -= 0.25;

  const normalized = Math.max(1, Math.min(10, Math.round(score)));
  const label = normalized <= 3 ? "Easy" : normalized <= 6 ? "Moderate" : normalized <= 8 ? "Difficult" : "High-risk / technical";
  return { score: normalized, label };
}

function calculatePrice(estimate = state.estimate, settings = state.settings) {
  const p = estimate.pricing;
  const difficulty = calculateDifficulty(estimate);
  const hasTechnical = estimate.jobTypes.includes("Technical climbing removal") || difficulty.score >= 8;
  const primaryRate = hasTechnical ? settings.climbingRate : settings.laborRate;
  const leadLabor = Number(p.laborHours) * primaryRate;
  const groundWorkers = Math.max(0, Number(p.workers) - 1);
  const groundLabor = groundWorkers * Number(p.laborHours) * settings.groundRate;
  const labor = leadLabor + groundLabor;
  const equipment = Number(p.equipmentRental) + Number(p.craneLiftCost) + Number(p.permitCost) + Number(p.miscCost);
  const disposal = (p.dumpTrailerNeeded ? Number(p.trailerCost) : 0) + Number(p.dumpFees);
  const subcontractors = Number(p.subcontractorCost);
  const base = labor + equipment + disposal + subcontractors + Number(p.fuelFee);
  const risk = base * (Number(p.riskMargin) / 100);
  const profit = (base + risk) * (Number(p.profitMargin) / 100);
  const tax = settings.salesTaxEnabled ? (base + risk + profit) * (Number(settings.salesTaxRate) / 100) : 0;
  const calculated = base + risk + profit + tax;

  const halfDayFloor = Number(p.laborHours) >= 3.5 ? settings.halfDayTarget : 0;
  const fullDayFloor = Number(p.workDays) >= 1 ? (Number(p.workers) > 1 ? settings.fullDayCrewTarget : settings.fullDaySoloTarget) * Number(p.workDays) : 0;
  const technicalFloor = hasTechnical ? settings.technicalDayTarget * Math.max(1, Number(p.workDays)) : 0;
  const floor = Math.max(settings.minimumJob, halfDayFloor, fullDayFloor, technicalFloor);
  const recommended = Math.max(calculated, floor);
  const low = Math.max(settings.minimumJob, recommended * 0.84);
  const premium = recommended * (difficulty.score >= 8 ? 1.25 : 1.17);

  const warnings = [];
  if (difficulty.score >= 9) warnings.push("High-risk technical job. Add margin, bring a ground worker, or recommend a crane/lift before committing.");
  if (calculated < floor) warnings.push("This price may be too low for the day-rate target. The recommended price has been raised to protect margin and risk.");
  if (hasTechnical && Number(p.workers) < 2) warnings.push("Technical climbing with no ground worker selected. Consider adding ground help for rope handling and cleanup.");
  if (estimate.trees.some((tree) => tree.powerLines)) warnings.push("Power lines are nearby. Confirm clearance requirements and utility coordination.");

  return { labor, equipment, disposal, subcontractors, base, risk, profit, tax, calculated, low, recommended, premium, floor, difficulty, warnings };
}

function updatePath(path, value) {
  const keys = path.split(".");
  let target = state.estimate;
  keys.slice(0, -1).forEach((key) => {
    target = target[key];
  });
  target[keys.at(-1)] = value;
}

function updateSetting(key, value) {
  state.settings[key] = value;
  saveSettings();
}

function toggleArrayValue(array, value) {
  return array.includes(value) ? array.filter((item) => item !== value) : [...array, value];
}

function applyTemplate(index) {
  const estimate = structuredClone(state.estimate);
  templates[index].apply(estimate);
  state.estimate = estimate;
  state.activeScreen = "estimate";
  render();
}

function saveCurrentEstimate() {
  const estimate = structuredClone(state.estimate);
  const totals = calculatePrice(estimate);
  estimate.savedAt = new Date().toISOString();
  estimate.amount = Math.round(totals.recommended);
  estimate.difficulty = totals.difficulty;
  const existing = state.saved.findIndex((item) => item.id === estimate.id);
  if (existing >= 0) state.saved[existing] = estimate;
  else state.saved.unshift(estimate);
  saveEstimates();
  state.activeScreen = "saved";
  render();
}

function loadEstimate(id) {
  const found = state.saved.find((item) => item.id === id);
  if (found) {
    state.estimate = structuredClone(found);
    state.activeScreen = "estimate";
    render();
  }
}

function deleteEstimate(id) {
  state.saved = state.saved.filter((item) => item.id !== id);
  saveEstimates();
  render();
}

function copyEstimate() {
  const text = estimateText();
  navigator.clipboard?.writeText(text);
}

function appendToPath(path, text) {
  const keys = path.split(".");
  let target = state.estimate;
  keys.slice(0, -1).forEach((key) => {
    target = target[key];
  });
  const key = keys.at(-1);
  const current = String(target[key] || "").trim();
  const cleaned = cleanDictation(text);
  target[key] = current ? `${current}\n${cleaned}` : cleaned;
}

function cleanDictation(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .trim();
}

let recognition;

function startDictation(path) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    state.dictation.status = "Dictation is not supported in this browser. Use the phone keyboard microphone, or run this in Chrome/Safari with speech recognition enabled.";
    render();
    return;
  }

  if (recognition) recognition.stop();

  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = true;
  recognition.interimResults = true;
  state.dictation.activePath = path;
  state.dictation.status = "Listening. Speak naturally, then tap Stop.";
  render();

  recognition.onresult = (event) => {
    let finalText = "";
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      if (event.results[index].isFinal) finalText += `${event.results[index][0].transcript} `;
    }
    if (!finalText.trim()) return;
    appendToPath(path, finalText);
    const field = document.querySelector(`[data-path="${path}"]`);
    if (field) field.value = path.split(".").reduce((obj, key) => obj?.[key], state.estimate) || "";
  };

  recognition.onerror = (event) => {
    state.dictation.status = `Dictation stopped: ${event.error}. You can still use your phone keyboard microphone.`;
    state.dictation.activePath = null;
    render();
  };

  recognition.onend = () => {
    if (state.dictation.activePath === path) {
      state.dictation.activePath = null;
      state.dictation.status = "Dictation saved.";
      render();
    }
  };

  recognition.start();
}

function stopDictation() {
  if (recognition) recognition.stop();
  state.dictation.activePath = null;
  state.dictation.status = "Dictation saved.";
  render();
}

function estimateText() {
  const e = state.estimate;
  const totals = calculatePrice();
  return `${state.settings.businessName}
${state.settings.tagline}

Estimate for: ${e.customer.name || "Customer"}
Address: ${e.customer.address || "Job address"}
Date: ${formatDate(e.customer.date)}

Scope of Work:
${scopeText()}

Recommended price: ${money.format(totals.recommended)}

Terms:
- Estimate valid for 14 days.
- Customer responsible for marking private utilities, irrigation, septic, and underground hazards.
- Stump grinding is not included unless specified.
- Wood and debris handling only included if stated in scope.
- Weather, access, or hidden defects may affect scheduling.
- Additional work outside listed scope may require a change order.`;
}

function scopeText() {
  const e = state.estimate;
  const treeSummary = e.trees
    .map((tree, index) => {
      const targets = tree.targets.length ? ` Targets: ${tree.targets.join(", ")}.` : "";
      return `Tree ${index + 1}: ${tree.species || "Tree"}, approx. ${tree.height} ft, ${tree.dbh} in DBH, ${tree.life.toLowerCase()}, ${tree.access.toLowerCase()} access, ${tree.dropZone.toLowerCase()} drop zone.${targets}`;
    })
    .join("\n");
  const debris = debrisTerms();
  return `${e.pricing.scope || "Perform listed tree service work as discussed onsite."}
${treeSummary}
Job type: ${e.jobTypes.join(", ")}.
${debris}`;
}

function debrisTerms() {
  const keepsWood = state.estimate.trees.every((tree) => tree.customerKeepsWood);
  const keepsBrush = state.estimate.trees.every((tree) => tree.customerKeepsBrush);
  if (keepsWood && keepsBrush) return "Customer keeps all wood and brush onsite.";
  if (keepsWood) return "Customer keeps wood onsite; brush/debris handling as listed.";
  if (keepsBrush) return "Customer keeps brush onsite; wood handling as listed.";
  return state.estimate.pricing.dumpTrailerNeeded ? "Includes cleanup and hauling for listed debris." : "Cleanup/debris handling limited to listed scope.";
}

function formatDate(value) {
  if (!value) return "";
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function render() {
  document.querySelector("#app").innerHTML = App();
}

function App() {
  const screens = ["dashboard", "estimate", "trees", "pricing", "preview", "saved", "settings"];
  return `
    <div class="app">
      <header class="topbar">
        <div class="shell">
          <div class="brand-row">
            <div class="brand">
              <div class="logo"><img src="assets/cascadia-logo.svg" alt="Cascadia Tree Works logo" /></div>
              <div>
                <h1>${escapeHtml(state.settings.businessName)}</h1>
                <p>Mobile field estimator</p>
              </div>
            </div>
            <button class="btn gold" data-action="newEstimate">New</button>
          </div>
          <nav class="tabs" aria-label="App screens">
            ${screens.map((screen) => `<button class="tab ${state.activeScreen === screen ? "active" : ""}" data-screen="${screen}">${screenLabel(screen)}</button>`).join("")}
          </nav>
        </div>
      </header>
      <main class="shell desktop-grid">
        <div>
          ${Screen("dashboard", Dashboard())}
          ${Screen("estimate", EstimateForm())}
          ${Screen("trees", TreeDetails())}
          ${Screen("pricing", PricingCalculator())}
          ${Screen("preview", EstimatePreview(true))}
          ${Screen("saved", SavedEstimates())}
          ${Screen("settings", Settings())}
        </div>
        <aside class="estimate-sidebar no-print">
          ${SummarySidebar()}
        </aside>
      </main>
    </div>
  `;
}

function Screen(name, content) {
  return `<section class="screen ${state.activeScreen === name ? "active" : ""} ${name === "preview" ? "print-screen" : ""}">${content}</section>`;
}

function screenLabel(screen) {
  return {
    dashboard: "Dashboard",
    estimate: "New Estimate",
    trees: "Trees",
    pricing: "Pricing",
    preview: "Preview",
    saved: "Saved",
    settings: "Settings",
  }[screen];
}

function Dashboard() {
  const totals = calculatePrice();
  return `
    <div class="stack">
      <section class="panel">
        <div class="section-title">
          <div>
            <p class="eyebrow">On-site estimating</p>
            <h2>Build safer tree work prices in the field</h2>
            <p>Use templates, score job risk, and sanity-check the price against Cascadia Tree Works day-rate targets.</p>
          </div>
        </div>
        <div class="price-grid">
          <div class="price-box"><span>Low</span><strong>${money.format(totals.low)}</strong></div>
          <div class="price-box recommended"><span>Recommended</span><strong>${money.format(totals.recommended)}</strong></div>
          <div class="price-box"><span>Premium</span><strong>${money.format(totals.premium)}</strong></div>
        </div>
      </section>
      <section class="panel">
        <div class="section-title">
          <div>
            <p class="eyebrow">Quick templates</p>
            <h2>Common Cascadia jobs</h2>
          </div>
        </div>
        <div class="template-grid">
          ${templates.map((template, index) => `
            <button class="template-card" data-template="${index}">
              <strong>${template.name}</strong>
              <span>${template.description}</span>
            </button>
          `).join("")}
        </div>
      </section>
    </div>
  `;
}

function EstimateForm() {
  const c = state.estimate.customer;
  return `
    <div class="stack">
      <section class="panel">
        <div class="section-title">
          <div>
            <p class="eyebrow">Customer</p>
            <h2>Customer Info</h2>
          </div>
        </div>
        <div class="grid-2">
          ${Input("Customer name", "customer.name", c.name, "text", "Avery Johnson")}
          ${Input("Phone number", "customer.phone", c.phone, "tel", "(509) 555-0142")}
          ${Input("Email", "customer.email", c.email, "email", "customer@example.com")}
          ${Input("Estimate date", "customer.date", c.date, "date")}
        </div>
        <div class="stack" style="margin-top:12px">
          ${Input("Job address", "customer.address", c.address, "text", "Leavenworth, WA")}
          ${Textarea("Notes", "customer.notes", c.notes, "Rush timing, customer help, access notes, gate codes, hazards.")}
          ${DictationPanel("customer.notes")}
        </div>
      </section>
      <section class="panel">
        <div class="section-title">
          <div>
            <p class="eyebrow">Job type</p>
            <h2>Select one or more</h2>
          </div>
        </div>
        <div class="pill-grid">
          ${jobTypes.map((type) => `<button class="pill ${state.estimate.jobTypes.includes(type) ? "active" : ""}" data-job-type="${type}">${type}</button>`).join("")}
        </div>
      </section>
      ${FooterActions("trees", "Next: Tree Details")}
    </div>
  `;
}

function TreeDetails() {
  const totals = calculatePrice();
  return `
    <div class="stack">
      <section class="panel">
        <div class="section-title">
          <div>
            <p class="eyebrow">Tree details</p>
            <h2>Risk and difficulty</h2>
            <p>Capture the jobsite details that usually cause underbidding: targets, access, rigging, dead wood, and cleanup.</p>
          </div>
        </div>
        ${ScoreCard(totals)}
      </section>
      <section class="panel">
        <div class="button-row" style="margin-bottom:12px">
          <button class="btn primary" data-action="addTree">Add Tree</button>
        </div>
        ${state.estimate.trees.map((tree, index) => TreeCard(tree, index)).join("")}
      </section>
      ${FooterActions("pricing", "Next: Pricing")}
    </div>
  `;
}

function TreeCard(tree, index) {
  return `
    <article class="tree-card">
      <div class="tree-header">
        <strong>Tree ${index + 1}</strong>
        ${state.estimate.trees.length > 1 ? `<button class="btn danger" data-remove-tree="${tree.id}">Remove</button>` : ""}
      </div>
      <div class="grid-2">
        ${TreeInput(index, "species", "Tree species", tree.species, "text", "Douglas fir")}
        ${TreeInput(index, "height", "Approx. height", tree.height, "number", "", "decimal")}
        ${TreeInput(index, "dbh", "DBH inches", tree.dbh, "number", "", "decimal")}
        ${TreeInput(index, "stems", "Number of stems", tree.stems, "number", "", "numeric")}
        ${TreeSelect(index, "condition", "Condition", tree.condition, ["Alive", "Dead top", "Dead", "Compromised", "Storm damaged"])}
        ${TreeSelect(index, "life", "Dead/alive", tree.life, ["Alive", "Partially dead", "Dead"])}
        ${TreeSelect(index, "lean", "Lean direction", tree.lean, ["Neutral", "Toward target", "Away from target", "Side lean"])}
        ${TreeSelect(index, "access", "Access difficulty", tree.access, ["Easy", "Moderate", "Difficult", "Poor / steep"])}
        ${TreeSelect(index, "dropZone", "Drop zone size", tree.dropZone, ["Open", "Moderate", "Tight", "Very tight"])}
      </div>
      <div class="stack" style="margin-top:12px">
        <label>Nearby targets</label>
        <div class="pill-grid">
          ${targetOptions.map((target) => `<button class="pill ${tree.targets.includes(target) ? "active" : ""}" data-tree-target="${index}|${target}">${target}</button>`).join("")}
        </div>
        <div class="grid-2">
          ${Toggle(`Power lines nearby`, tree.powerLines, `tree|${index}|powerLines`)}
          ${Toggle(`Climb required`, tree.climbRequired, `tree|${index}|climbRequired`)}
          ${Toggle(`Rigging required`, tree.riggingRequired, `tree|${index}|riggingRequired`)}
          ${Toggle(`Crane/lift recommended`, tree.craneRecommended, `tree|${index}|craneRecommended`)}
          ${Toggle(`Customer keeps wood`, tree.customerKeepsWood, `tree|${index}|customerKeepsWood`)}
          ${Toggle(`Customer keeps brush`, tree.customerKeepsBrush, `tree|${index}|customerKeepsBrush`)}
        </div>
      </div>
    </article>
  `;
}

function PricingCalculator() {
  const p = state.estimate.pricing;
  const totals = calculatePrice();
  return `
    <div class="stack">
      <section class="panel">
        <div class="section-title">
          <div>
            <p class="eyebrow">Calculator</p>
            <h2>Pricing Inputs</h2>
            <p>Base cost plus risk margin, profit margin, minimums, and day-rate sanity checks.</p>
          </div>
        </div>
        <div class="grid-2">
          ${Input("Estimated labor hours", "pricing.laborHours", p.laborHours, "number", "", "decimal")}
          ${Input("Number of workers", "pricing.workers", p.workers, "number", "", "numeric")}
          ${Input("Number of work days", "pricing.workDays", p.workDays, "number", "", "decimal")}
          ${Input("Fuel / mobilization", "pricing.fuelFee", p.fuelFee, "number", "", "decimal")}
          ${Input("Trailer rental cost", "pricing.trailerCost", p.trailerCost, "number", "", "decimal")}
          ${Input("Dump fees", "pricing.dumpFees", p.dumpFees, "number", "", "decimal")}
          ${Input("Equipment rental", "pricing.equipmentRental", p.equipmentRental, "number", "", "decimal")}
          ${Input("Subcontractor cost", "pricing.subcontractorCost", p.subcontractorCost, "number", "", "decimal")}
          ${Input("Crane / lift cost", "pricing.craneLiftCost", p.craneLiftCost, "number", "", "decimal")}
          ${Input("Permit cost", "pricing.permitCost", p.permitCost, "number", "", "decimal")}
          ${Input("Miscellaneous cost", "pricing.miscCost", p.miscCost, "number", "", "decimal")}
          ${Input("Risk margin %", "pricing.riskMargin", p.riskMargin, "number", "", "decimal")}
          ${Input("Profit margin %", "pricing.profitMargin", p.profitMargin, "number", "", "decimal")}
          ${Input("Deposit", "pricing.deposit", p.deposit, "number", "", "decimal")}
        </div>
        <div class="stack" style="margin-top:12px">
          ${Toggle("Dump trailer needed", p.dumpTrailerNeeded, "pricing.dumpTrailerNeeded")}
          ${Textarea("Detailed work description", "pricing.scope", p.scope, "Describe exactly what is included and what is not.")}
          ${DictationPanel("pricing.scope")}
          ${Input("Payment terms", "pricing.paymentTerms", p.paymentTerms, "text")}
        </div>
      </section>
      <section class="panel">
        ${PriceResult(totals)}
      </section>
      ${FooterActions("preview", "Next: Preview")}
    </div>
  `;
}

function PriceResult(totals) {
  return `
    <div class="section-title">
      <div>
        <p class="eyebrow">Recommended estimate</p>
        <h2>${money.format(totals.recommended)}</h2>
      </div>
    </div>
    <div class="price-grid">
      <div class="price-box"><span>Low</span><strong>${money.format(totals.low)}</strong></div>
      <div class="price-box recommended"><span>Recommended</span><strong>${money.format(totals.recommended)}</strong></div>
      <div class="price-box"><span>Premium</span><strong>${money.format(totals.premium)}</strong></div>
    </div>
    <div class="breakdown" style="margin-top:14px">
      <div><span>Labor total</span><strong>${money.format(totals.labor)}</strong></div>
      <div><span>Equipment total</span><strong>${money.format(totals.equipment)}</strong></div>
      <div><span>Dump / disposal</span><strong>${money.format(totals.disposal)}</strong></div>
      <div><span>Subcontractors</span><strong>${money.format(totals.subcontractors)}</strong></div>
      <div><span>Fuel / mobilization</span><strong>${money.format(state.estimate.pricing.fuelFee)}</strong></div>
      <div><span>Risk margin</span><strong>${money.format(totals.risk)}</strong></div>
      <div><span>Profit margin</span><strong>${money.format(totals.profit)}</strong></div>
      <div><span>Sales tax</span><strong>${money.format(totals.tax)}</strong></div>
    </div>
    ${Warnings(totals)}
  `;
}

function ScoreCard(totals) {
  const cls = totals.difficulty.score >= 9 ? "high" : totals.difficulty.score >= 7 ? "medium" : "";
  return `
    <div class="score-card">
      <div class="score-ring ${cls}">${totals.difficulty.score}</div>
      <div>
        <strong>${totals.difficulty.label}</strong>
        <p class="helper">1-3 easy, 4-6 moderate, 7-8 difficult, 9-10 high-risk / technical.</p>
      </div>
    </div>
    ${Warnings(totals)}
  `;
}

function Warnings(totals) {
  if (!totals.warnings.length) return `<div class="notice" style="margin-top:12px">No major pricing warnings. Still confirm access, targets, debris handling, and weather before sending.</div>`;
  return `<div class="stack" style="margin-top:12px">${totals.warnings.map((warning) => `<div class="warning">${warning}</div>`).join("")}</div>`;
}

function EstimatePreview(showActions = false) {
  const e = state.estimate;
  const totals = calculatePrice();
  return `
    <div class="stack">
      ${showActions ? `
        <div class="panel no-print">
          <div class="button-row">
            <button class="btn primary" data-action="saveEstimate">Save Estimate</button>
            <button class="btn secondary" data-action="copyEstimate">Copy Text</button>
            <button class="btn gold" data-action="printEstimate">Export PDF</button>
          </div>
          <p class="helper">PDF export uses your browser print dialog. Choose “Save as PDF.”</p>
        </div>
      ` : ""}
      <article class="estimate-paper" id="estimatePaper">
        <div class="paper-head">
          <div>
            <div class="paper-brand"><span class="paper-logo"><img src="assets/cascadia-logo.svg" alt="" /></span>${escapeHtml(state.settings.businessName)}</div>
            <p>${escapeHtml(state.settings.tagline)}</p>
          </div>
          <div class="paper-meta">
            <strong>Estimate</strong><br />
            ${formatDate(e.customer.date)}
          </div>
        </div>
        <section class="paper-section">
          <h3>Estimate For</h3>
          <p><strong>${escapeHtml(e.customer.name || "Customer name")}</strong><br />${escapeHtml(e.customer.address || "Job address")}<br />${escapeHtml(e.customer.phone || "")}${e.customer.phone && e.customer.email ? " · " : ""}${escapeHtml(e.customer.email || "")}</p>
        </section>
        <section class="paper-section">
          <h3>Scope of Work</h3>
          <p>${escapeHtml(scopeText())}</p>
        </section>
        <section class="paper-section">
          <h3>Safety / Pricing Notes</h3>
          <ul>
            <li>Difficulty score: ${totals.difficulty.score}/10 (${totals.difficulty.label}).</li>
            ${totals.warnings.length ? totals.warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join("") : "<li>No major pricing warnings noted at estimate time.</li>"}
          </ul>
        </section>
        <section class="paper-section">
          <h3>Optional Breakdown</h3>
          <ul>
            <li>Labor: ${money.format(totals.labor)}</li>
            <li>Equipment / rental / permits / misc: ${money.format(totals.equipment)}</li>
            <li>Dump / disposal: ${money.format(totals.disposal)}</li>
            <li>Subcontractors: ${money.format(totals.subcontractors)}</li>
            <li>Risk and profit margin: ${money.format(totals.risk + totals.profit)}</li>
            ${Number(e.pricing.deposit) ? `<li>Deposit: ${money.format(e.pricing.deposit)}</li>` : ""}
          </ul>
          <div class="paper-total"><span>Total Estimate Price</span><strong>${money.format(totals.recommended)}</strong></div>
        </section>
        <section class="paper-section">
          <h3>Terms</h3>
          <ul>
            <li>Estimate valid for 14 days.</li>
            <li>Customer responsible for marking private utilities, irrigation, septic, and underground hazards.</li>
            <li>Work does not include stump grinding unless specified.</li>
            <li>Wood and debris handling only included if stated in scope.</li>
            <li>Weather, access, or hidden defects may affect scheduling.</li>
            <li>Additional work outside listed scope may require a change order.</li>
            <li>${escapeHtml(e.pricing.paymentTerms)}</li>
          </ul>
          <div class="signature-grid">
            <div class="signature-line"><span>Customer Signature</span></div>
            <div class="signature-line"><span>Date</span></div>
          </div>
        </section>
      </article>
    </div>
  `;
}

function SavedEstimates() {
  return `
    <section class="panel">
      <div class="section-title">
        <div>
          <p class="eyebrow">Local storage</p>
          <h2>Saved Estimates</h2>
          <p>Saved on this device/browser. No login or cloud sync in this prototype.</p>
        </div>
      </div>
      ${state.saved.length ? `
        <div class="saved-grid">
          ${state.saved.map((estimate) => `
            <article class="saved-card">
              <div class="button-row" style="justify-content:space-between">
                <span class="status">${estimate.status}</span>
                <select data-status="${estimate.id}" aria-label="Estimate status">
                  ${["Draft", "Sent", "Accepted", "Declined", "Completed"].map((status) => `<option value="${status}" ${estimate.status === status ? "selected" : ""}>${status}</option>`).join("")}
                </select>
              </div>
              <strong style="margin-top:10px">${escapeHtml(estimate.customer.name || "Unnamed customer")}</strong>
              <span>${escapeHtml(estimate.customer.address || "No address")} · ${formatDate(estimate.customer.date)}</span>
              <span>${estimate.jobTypes.join(", ")}</span>
              <strong style="margin-top:8px">${money.format(estimate.amount || calculatePrice(estimate).recommended)}</strong>
              <div class="button-row" style="margin-top:12px">
                <button class="btn primary" data-load-estimate="${estimate.id}">Open</button>
                <button class="btn danger" data-delete-estimate="${estimate.id}">Delete</button>
              </div>
            </article>
          `).join("")}
        </div>
      ` : `<div class="empty">No saved estimates yet. Build one, then tap Save Estimate from the preview.</div>`}
    </section>
  `;
}

function Settings() {
  const s = state.settings;
  return `
    <section class="panel">
      <div class="section-title">
        <div>
          <p class="eyebrow">Business settings</p>
          <h2>Default Rates and Info</h2>
        </div>
      </div>
      <div class="grid-2">
        ${SettingInput("Business name", "businessName", s.businessName, "text")}
        ${SettingInput("Phone number", "phone", s.phone, "tel")}
        ${SettingInput("Email", "email", s.email, "email")}
        ${SettingInput("Solo labor rate", "laborRate", s.laborRate, "number")}
        ${SettingInput("Technical climbing rate", "climbingRate", s.climbingRate, "number")}
        ${SettingInput("Ground worker rate", "groundRate", s.groundRate, "number")}
        ${SettingInput("Minimum job price", "minimumJob", s.minimumJob, "number")}
        ${SettingInput("Half-day target", "halfDayTarget", s.halfDayTarget, "number")}
        ${SettingInput("Full-day solo target", "fullDaySoloTarget", s.fullDaySoloTarget, "number")}
        ${SettingInput("Full-day crew target", "fullDayCrewTarget", s.fullDayCrewTarget, "number")}
        ${SettingInput("Technical removal target", "technicalDayTarget", s.technicalDayTarget, "number")}
        ${SettingInput("Dump trailer cost", "dumpTrailerCost", s.dumpTrailerCost, "number")}
        ${SettingInput("Fuel / mobilization fee", "fuelFee", s.fuelFee, "number")}
        ${SettingInput("Default risk margin %", "defaultRiskMargin", s.defaultRiskMargin, "number")}
        ${SettingInput("Default profit margin %", "defaultProfitMargin", s.defaultProfitMargin, "number")}
        ${SettingInput("Sales tax rate %", "salesTaxRate", s.salesTaxRate, "number")}
      </div>
      <div class="stack" style="margin-top:12px">
        ${SettingInput("Tagline", "tagline", s.tagline, "text")}
        ${Toggle("Sales tax enabled", s.salesTaxEnabled, "setting.salesTaxEnabled")}
        <label>Logo upload <input type="file" accept="image/*" disabled /></label>
        <p class="helper">Logo upload is shown as a placeholder for the next version. This prototype now uses your Cascadia Tree Works logo from the app assets folder.</p>
      </div>
    </section>
  `;
}

function SummarySidebar() {
  const totals = calculatePrice();
  return `
    <section class="panel">
      <div class="section-title">
        <div>
          <p class="eyebrow">Live total</p>
          <h2>${money.format(totals.recommended)}</h2>
          <p>${totals.difficulty.score}/10 · ${totals.difficulty.label}</p>
        </div>
      </div>
      ${PriceResult(totals)}
    </section>
  `;
}

function FooterActions(nextScreen, label) {
  return `
    <div class="footer-actions no-print">
      <button class="btn secondary" data-screen="dashboard">Dashboard</button>
      <button class="btn primary" data-screen="${nextScreen}">${label}</button>
    </div>
  `;
}

function Input(label, path, value, type = "text", placeholder = "", inputmode = "") {
  const numeric = type === "number";
  return `
    <label>
      ${label}
      <input data-path="${path}" type="${type}" value="${escapeAttr(value)}" placeholder="${escapeAttr(placeholder)}" ${inputmode ? `inputmode="${inputmode}"` : ""} ${numeric ? 'step="0.25"' : ""} />
    </label>
  `;
}

function SettingInput(label, key, value, type = "text") {
  return `
    <label>
      ${label}
      <input data-setting="${key}" type="${type}" value="${escapeAttr(value)}" ${type === "number" ? 'inputmode="decimal" step="0.25"' : ""} />
    </label>
  `;
}

function TreeInput(index, key, label, value, type = "text", placeholder = "", inputmode = "") {
  return `
    <label>
      ${label}
      <input data-tree-field="${index}|${key}" type="${type}" value="${escapeAttr(value)}" placeholder="${escapeAttr(placeholder)}" ${inputmode ? `inputmode="${inputmode}"` : ""} ${type === "number" ? 'step="0.25"' : ""} />
    </label>
  `;
}

function TreeSelect(index, key, label, value, options) {
  return `
    <label>
      ${label}
      <select data-tree-field="${index}|${key}">
        ${options.map((option) => `<option value="${escapeAttr(option)}" ${value === option ? "selected" : ""}>${option}</option>`).join("")}
      </select>
    </label>
  `;
}

function Textarea(label, path, value, placeholder = "") {
  const active = state.dictation.activePath === path;
  return `
    <label class="dictation-field">
      <span class="field-top">
        ${label}
        <button class="dictation-button ${active ? "active" : ""}" data-dictate="${path}" type="button">${active ? "Stop" : "Dictate"}</button>
      </span>
      <textarea data-path="${path}" placeholder="${escapeAttr(placeholder)}">${escapeHtml(value)}</textarea>
    </label>
  `;
}

function DictationPanel(path) {
  const active = state.dictation.activePath === path;
  const supportText = state.dictation.supported
    ? "Tap Dictate and speak in normal jobsite language. It appends text to this field."
    : "This browser does not expose built-in speech recognition. Use your phone keyboard microphone here, or upgrade later to an OpenAI transcription backend.";
  return `
    <div class="dictation-panel ${active ? "active" : ""}">
      <strong>${active ? "Listening now" : "Voice input"}</strong>
      <span>${escapeHtml(state.dictation.status || supportText)}</span>
    </div>
  `;
}

function Toggle(label, checked, key) {
  return `
    <button class="toggle ${checked ? "active" : ""}" data-toggle="${key}" type="button">
      <span>${label}</span>
      <i class="switch" aria-hidden="true"></i>
    </button>
  `;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("\n", " ");
}

document.addEventListener("input", (event) => {
  const target = event.target;
  if (target.matches("[data-path]")) {
    updatePath(target.dataset.path, target.type === "number" ? Number(target.value) : target.value);
  }
  if (target.matches("[data-setting]")) {
    updateSetting(target.dataset.setting, target.type === "number" ? Number(target.value) : target.value);
  }
  if (target.matches("[data-tree-field]")) {
    const [index, key] = target.dataset.treeField.split("|");
    state.estimate.trees[Number(index)][key] = target.type === "number" ? Number(target.value) : target.value;
    render();
  }
});

document.addEventListener("change", (event) => {
  const target = event.target;
  if (target.matches("[data-path]")) {
    updatePath(target.dataset.path, target.type === "number" ? Number(target.value) : target.value);
    render();
  }
  if (target.matches("[data-setting]")) {
    updateSetting(target.dataset.setting, target.type === "number" ? Number(target.value) : target.value);
    render();
  }
  if (target.matches("[data-tree-field]")) {
    const [index, key] = target.dataset.treeField.split("|");
    state.estimate.trees[Number(index)][key] = target.type === "number" ? Number(target.value) : target.value;
    render();
  }
  if (target.matches("[data-status]")) {
    const estimate = state.saved.find((item) => item.id === target.dataset.status);
    if (estimate) {
      estimate.status = target.value;
      saveEstimates();
      render();
    }
  }
});

document.addEventListener("click", (event) => {
  const target = event.target.closest("button");
  if (!target) return;

  if (target.dataset.screen) {
    state.activeScreen = target.dataset.screen;
    render();
  }
  if (target.dataset.action === "newEstimate") {
    state.estimate = defaultEstimate();
    state.activeScreen = "estimate";
    render();
  }
  if (target.dataset.action === "addTree") {
    state.estimate.trees.push(emptyTree());
    render();
  }
  if (target.dataset.action === "saveEstimate") saveCurrentEstimate();
  if (target.dataset.action === "copyEstimate") copyEstimate();
  if (target.dataset.action === "printEstimate") window.print();
  if (target.dataset.dictate) {
    if (state.dictation.activePath === target.dataset.dictate) stopDictation();
    else startDictation(target.dataset.dictate);
  }
  if (target.dataset.template) applyTemplate(Number(target.dataset.template));
  if (target.dataset.jobType) {
    state.estimate.jobTypes = toggleArrayValue(state.estimate.jobTypes, target.dataset.jobType);
    render();
  }
  if (target.dataset.treeTarget) {
    const [index, value] = target.dataset.treeTarget.split("|");
    const tree = state.estimate.trees[Number(index)];
    tree.targets = toggleArrayValue(tree.targets, value);
    render();
  }
  if (target.dataset.toggle) {
    const parts = target.dataset.toggle.split("|");
    if (parts[0] === "tree") {
      const tree = state.estimate.trees[Number(parts[1])];
      tree[parts[2]] = !tree[parts[2]];
    } else if (parts[0] === "setting") {
      state.settings[parts[1]] = !state.settings[parts[1]];
      saveSettings();
    } else {
      const keys = target.dataset.toggle.split(".");
      let obj = state.estimate;
      keys.slice(0, -1).forEach((key) => {
        obj = obj[key];
      });
      obj[keys.at(-1)] = !obj[keys.at(-1)];
    }
    render();
  }
  if (target.dataset.removeTree) {
    state.estimate.trees = state.estimate.trees.filter((tree) => tree.id !== target.dataset.removeTree);
    render();
  }
  if (target.dataset.loadEstimate) loadEstimate(target.dataset.loadEstimate);
  if (target.dataset.deleteEstimate) deleteEstimate(target.dataset.deleteEstimate);
});

render();
