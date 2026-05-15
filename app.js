const DATA_URL = "./data/candidates.json";
const AUTO_REFRESH_MS = 5 * 60 * 1000;
const SIDEBAR_STORAGE_KEY = "schoolfit.sidebarHidden";
const TARGET_CITIES = [
  "Belmont",
  "Cupertino",
  "Hillsborough",
  "Los Altos",
  "Los Gatos",
  "Mountain View",
  "Palo Alto",
  "San Carlos",
  "San Mateo"
];

const state = {
  metadata: null,
  candidates: [],
  filtered: [],
  selectedId: null,
  cities: new Set(),
  minScore: 95,
  onlyEligible: false,
  minBeds: 3,
  minBaths: 2,
  daysFilter: "any",
  sortKey: "average",
  sortDirection: "desc",
  search: "",
  sidebarHidden: window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true",
  hiddenMarketCount: 0,
  refreshTimer: null
};

const els = {
  appShell: document.querySelector("#appShell"),
  refreshButton: document.querySelector("#refreshButton"),
  cityFilters: document.querySelector("#cityFilters"),
  scoreFloor: document.querySelector("#scoreFloor"),
  scoreFloorValue: document.querySelector("#scoreFloorValue"),
  onlyEligible: document.querySelector("#onlyEligible"),
  minBeds: document.querySelector("#minBeds"),
  minBaths: document.querySelector("#minBaths"),
  daysFilter: document.querySelector("#daysFilter"),
  searchInput: document.querySelector("#searchInput"),
  sidebarToggleButton: document.querySelector("#sidebarToggleButton"),
  exportButton: document.querySelector("#exportButton"),
  candidateList: document.querySelector("#candidateList"),
  emptyState: document.querySelector("#emptyState"),
  inspectorContent: document.querySelector("#inspectorContent"),
  eligibleCount: document.querySelector("#eligibleCount"),
  bestAverage: document.querySelector("#bestAverage"),
  freshCount: document.querySelector("#freshCount"),
  sortDirectionButtons: document.querySelectorAll("[data-sort-key][data-sort-direction]")
};

async function loadCandidates() {
  setRefreshButtonBusy(true);

  const response = await fetch(`${DATA_URL}?t=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Could not load ${DATA_URL}`);
  }

  const data = await response.json();
  state.metadata = data.metadata;
  const enriched = data.candidates.map(enrichCandidate);
  state.candidates = enriched.filter(isClearlyForSale);
  state.hiddenMarketCount = enriched.length - state.candidates.length;

  if (state.cities.size === 0) {
    uniqueCities().forEach((city) => state.cities.add(city));
    renderCityFilters();
  }

  updateMetadata();
  applyFilters();
  scheduleAutoRefresh();
  setRefreshButtonBusy(false);
}

function setRefreshButtonBusy(isBusy) {
  els.refreshButton.disabled = isBusy;
  els.refreshButton.classList.toggle("is-loading", isBusy);
  els.refreshButton.setAttribute("aria-busy", String(isBusy));
  els.refreshButton.setAttribute("aria-label", isBusy ? "Refreshing market data" : "Refresh market data");
  els.refreshButton.innerHTML = `
    <span class="button-icon" aria-hidden="true">↻</span>
    <span class="visually-hidden">${isBusy ? "Refreshing" : "Refresh"}</span>
  `;
}

function scheduleAutoRefresh() {
  if (state.refreshTimer) {
    window.clearInterval(state.refreshTimer);
  }

  state.refreshTimer = window.setInterval(() => {
    loadCandidates().catch((error) => {
      console.error(error);
      els.refreshButton.title = "Auto-refresh could not reload market data.";
    });
  }, AUTO_REFRESH_MS);
}

function enrichCandidate(candidate) {
  const primaryScores = {
    elementary: numericScore(primarySchool(candidate.schools.elementary)?.testScorePercentile),
    middle: numericScore(primarySchool(candidate.schools.middle)?.testScorePercentile),
    high: numericScore(primarySchool(candidate.schools.high)?.testScorePercentile)
  };
  const scoreValues = Object.values(primaryScores).filter((score) => Number.isFinite(score));
  const hasCompletePrimaryScores = scoreValues.length === 3;
  const schoolAverage = hasCompletePrimaryScores ? roundToOne(scoreValues.reduce((sum, score) => sum + score, 0) / 3) : null;
  const schoolMinimum = hasCompletePrimaryScores ? Math.min(...scoreValues) : null;
  const hasPrimarySchoolAssignments = Object.values(candidate.schools).every((schools = []) => Boolean(primarySchool(schools)));
  const allPrimaryScoresVerified = Object.values(candidate.schools).every((schools) => primarySchool(schools)?.scoreStatus === "verified");

  return {
    ...candidate,
    primaryScores,
    schoolAverage,
    schoolMinimum,
    hasCompletePrimaryScores,
    hasPrimarySchoolAssignments,
    allPrimaryScoresVerified
  };
}

function uniqueCities() {
  return [...new Set([...TARGET_CITIES, ...state.candidates.map((candidate) => candidate.city)])].sort();
}

function renderCityFilters() {
  els.cityFilters.innerHTML = uniqueCities()
    .map((city) => {
      const id = `city-${slugify(city)}`;
      return `
        <label class="checkbox-line" for="${id}" title="${escapeAttribute(city)}">
          <input id="${id}" type="checkbox" value="${escapeAttribute(city)}" checked />
          <span>${escapeHtml(city)}</span>
        </label>
      `;
    })
    .join("");

  els.cityFilters.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", () => {
      if (input.checked) {
        state.cities.add(input.value);
      } else {
        state.cities.delete(input.value);
      }
      applyFilters();
    });
  });
}

function applyFilters() {
  const query = state.search.trim().toLowerCase();

  state.filtered = state.candidates
    .filter((candidate) => state.cities.has(candidate.city))
    .filter((candidate) => candidate.beds >= state.minBeds)
    .filter((candidate) => candidate.baths >= state.minBaths)
    .filter((candidate) => state.daysFilter === "any" || (Number.isFinite(candidate.daysOnMarket) && candidate.daysOnMarket <= Number(state.daysFilter)))
    .filter((candidate) => !state.onlyEligible || allPrimarySchoolsPass(candidate))
    .filter((candidate) => !query || searchableText(candidate).includes(query))
    .sort(sortCandidates);

  if (!state.filtered.some((candidate) => candidate.id === state.selectedId)) {
    state.selectedId = state.filtered[0]?.id ?? null;
  }

  renderSummary();
  renderCandidates();
  renderInspector();
}

function isClearlyForSale(candidate) {
  return candidate.listing?.marketStatus === "active" && Number.isFinite(candidate.listing?.askingPrice);
}

function allPrimarySchoolsPass(candidate) {
  if (!candidate.hasCompletePrimaryScores) {
    return false;
  }
  return Object.values(candidate.primaryScores).every((score) => score >= state.minScore);
}

function searchableText(candidate) {
  const schoolNames = Object.values(candidate.schools)
    .flat()
    .map((school) => school.name)
    .join(" ");
  return `${candidate.address} ${candidate.city} ${candidate.zip} ${schoolNames}`.toLowerCase();
}

function sortCandidates(a, b) {
  const aValue = sortableSortValue(a, state.sortKey);
  const bValue = sortableSortValue(b, state.sortKey);
  const primary = aValue === bValue ? 0 : aValue < bValue ? -1 : 1;

  if (primary !== 0) {
    return state.sortDirection === "asc" ? primary : -primary;
  }

  return sortableScore(b.schoolAverage) - sortableScore(a.schoolAverage)
    || sortableScore(b.schoolMinimum) - sortableScore(a.schoolMinimum)
    || sortableDays(a.daysOnMarket) - sortableDays(b.daysOnMarket);
}

function sortableSortValue(candidate, sortKey) {
  if (sortKey === "days") {
    return sortableDays(candidate.daysOnMarket);
  }
  if (sortKey === "space") {
    return Number.isFinite(candidate.sqft) ? candidate.sqft : -1;
  }
  return sortableScore(candidate.schoolAverage);
}

function renderSummary() {
  const eligible = state.candidates.filter((candidate) => allPrimarySchoolsPass(candidate)).length;
  const best = state.filtered.find((candidate) => Number.isFinite(candidate.schoolAverage))?.schoolAverage;

  els.eligibleCount.textContent = `${eligible}`;
  els.bestAverage.textContent = Number.isFinite(best) ? `${best}%` : "--";
  els.freshCount.textContent = `${state.candidates.length}`;
}

function renderCandidates() {
  els.emptyState.classList.toggle("hidden", state.filtered.length > 0);
  els.candidateList.innerHTML = state.filtered.map(candidateRow).join("");

  els.candidateList.querySelectorAll(".candidate-row").forEach((row) => {
    row.addEventListener("click", () => {
      state.selectedId = row.dataset.id;
      renderCandidates();
      renderInspector();
    });
  });
}

function candidateRow(candidate, index) {
  const selected = candidate.id === state.selectedId ? " selected" : "";

  return `
    <button class="candidate-row${selected}" type="button" role="listitem" data-id="${escapeAttribute(candidate.id)}">
      <span class="rank">${index + 1}</span>
      ${housePhoto(candidate, "thumb")}
      <span class="home-cell">
        <span class="address-line">${escapeHtml(candidate.address)}</span>
        <span class="sub-line">${escapeHtml(candidateLocationLine(candidate))}</span>
      </span>
      <span class="facts-cell">
        <span>${candidate.beds} bd · ${formatBaths(candidate.baths)} ba</span>
        <span>${formatNumber(candidate.sqft)} sq ft</span>
      </span>
      <span class="market-cell">
        <span>${escapeHtml(formatAskingPrice(candidate))}</span>
        <span>${escapeHtml(formatZestimate(candidate))}</span>
        <span>${escapeHtml(formatDaysOnMarket(candidate.daysOnMarket))}</span>
      </span>
      ${scoreChip(candidate.schoolAverage)}
      <span class="score-trio" aria-label="Elementary, middle, and high school test scores">
        ${scoreMini("E", candidate.primaryScores.elementary)}
        ${scoreMini("M", candidate.primaryScores.middle)}
        ${scoreMini("H", candidate.primaryScores.high)}
      </span>
    </button>
  `;
}

function renderInspector() {
  const candidate = state.candidates.find((item) => item.id === state.selectedId);
  if (!candidate) {
    els.inspectorContent.innerHTML = '<div class="inspector-placeholder">Select a home to inspect its schools.</div>';
    return;
  }

  const status = candidateStatus(candidate);

  els.inspectorContent.innerHTML = `
    <section class="inspector-hero">
      ${housePhoto(candidate, "hero")}
      <div class="source-row">
        <span class="status-pill ${status.tone}">${escapeHtml(status.label)}</span>
        <span class="detail-chip">${Number.isFinite(candidate.schoolAverage) ? `${candidate.schoolAverage}% avg test score` : "School scores pending"}</span>
        <span class="detail-chip">Asking price: ${escapeHtml(formatAskingPrice(candidate))}</span>
        <span class="detail-chip">Zestimate: ${escapeHtml(formatZestimate(candidate))}</span>
        <span class="detail-chip">${escapeHtml(formatDaysOnMarket(candidate.daysOnMarket))}</span>
      </div>
      <h3>${escapeHtml(candidate.address)}</h3>
      <div class="sub-line">${escapeHtml(candidateLocationLine(candidate))}</div>
      <div class="detail-row">
        <span class="detail-chip">${candidate.beds} bedrooms</span>
        <span class="detail-chip">${formatBaths(candidate.baths)} baths</span>
        <span class="detail-chip">${formatNumber(candidate.sqft)} sq ft</span>
        <span class="detail-chip">${escapeHtml(candidate.lot)}</span>
      </div>
      <div class="source-row">
        <a class="link-button" href="${escapeAttribute(candidate.listing.sourceUrl)}" target="_blank" rel="noreferrer">Open listing</a>
        ${candidate.listing.redfinUrl ? `<a class="link-button" href="${escapeAttribute(candidate.listing.redfinUrl)}" target="_blank" rel="noreferrer">Open Redfin search</a>` : ""}
        ${listingSourceChips(candidate)}
      </div>
    </section>

    <section>
      <h4>Assigned schools</h4>
      <div class="school-stack">
        ${schoolCard("Elementary", candidate.schools.elementary)}
        ${schoolCard("Middle", candidate.schools.middle)}
        ${schoolCard("High", candidate.schools.high)}
      </div>
    </section>

    <section>
      <h4>Listing notes</h4>
      <div class="detail-row">
        ${(candidate.luxuryNotes ?? []).map((note) => `<span class="detail-chip">${escapeHtml(note)}</span>`).join("")}
      </div>
      ${listingDataNotes(candidate)}
    </section>

    <div class="data-footnote">
      ${candidate.allPrimaryScoresVerified ? "GreatSchools test-score percentiles are verified." : "Some GreatSchools test-score percentiles still need verification."}
      Verify price and listing availability before making buying decisions.
    </div>
  `;
}

function schoolCard(level, schools) {
  const primary = primarySchool(schools);
  if (!primary) {
    return "";
  }

  const alternates = schools.filter((school) => school !== primary);

  return `
    <article class="school-card">
      <div class="school-card-header">
        <div>
          <strong>${escapeHtml(primary.name)}</strong>
          <p>${escapeHtml(level)} · ${escapeHtml(primary.grades)} · ${escapeHtml(primary.district)}</p>
        </div>
        ${scoreChip(primary.testScorePercentile)}
      </div>
      <div class="source-row">
        <span class="detail-chip">${escapeHtml(formatAssignmentConfidence(primary.confidence))}</span>
        ${primary.testScoreRating ? `<span class="detail-chip">Test Score ${primary.testScoreRating}/10</span>` : ""}
        ${scoreVerificationChip(primary)}
        <a class="link-button" href="${escapeAttribute(primary.sourceUrl)}" target="_blank" rel="noreferrer">GreatSchools</a>
      </div>
      ${alternates.length ? `
        <div class="school-options">
          ${alternates.map((school) => `
            <div class="school-option">
              <span>${escapeHtml(school.name)} · ${escapeHtml(school.note)}</span>
              ${scoreChip(school.testScorePercentile)}
            </div>
          `).join("")}
        </div>
      ` : ""}
    </article>
  `;
}

function updateMetadata() {
  const generatedAt = state.metadata?.generatedAt ? new Date(state.metadata.generatedAt) : null;
  els.refreshButton.title = generatedAt
    ? `Last refresh ${formatDateTime(generatedAt)}`
    : "Refresh market data";
}

function updateSidebarToggle() {
  els.appShell.classList.toggle("sidebar-hidden", state.sidebarHidden);
  els.sidebarToggleButton.setAttribute("aria-pressed", String(state.sidebarHidden));
  els.sidebarToggleButton.setAttribute("aria-label", state.sidebarHidden ? "Show filters sidebar" : "Hide filters sidebar");
  els.sidebarToggleButton.title = state.sidebarHidden ? "Show filters" : "Hide filters";
  els.sidebarToggleButton.querySelector(".sidebar-toggle-label").textContent = state.sidebarHidden ? "Show filters" : "Hide filters";
}

function updateSortButtons() {
  els.sortDirectionButtons.forEach((button) => {
    const active = button.dataset.sortKey === state.sortKey && button.dataset.sortDirection === state.sortDirection;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function primarySchool(schools = []) {
  return schools.find((school) => school.assignment === "primary") ?? schools[0];
}

function candidateStatus(candidate) {
  if (!candidate.hasPrimarySchoolAssignments || !candidate.hasCompletePrimaryScores) {
    return { label: "Needs schools", tone: "warn" };
  }
  if (!candidate.allPrimaryScoresVerified) {
    return { label: "Score source", tone: "warn" };
  }
  if (!allPrimarySchoolsPass(candidate)) {
    return { label: `Below ${state.minScore}`, tone: "warn" };
  }
  return { label: "Eligible", tone: "pass" };
}

function scoreChip(score) {
  if (!Number.isFinite(score)) {
    return '<span class="score-chip pending">Pending</span>';
  }

  const tone = score >= state.minScore ? "pass" : score >= state.minScore - 3 ? "warn" : "fail";
  return `<span class="score-chip ${tone}">${roundToOne(score)}%</span>`;
}

function scoreMini(label, score) {
  if (!Number.isFinite(score)) {
    return `<span class="score-mini pending"><span>${escapeHtml(label)}</span>--</span>`;
  }

  const tone = score >= state.minScore ? "pass" : score >= state.minScore - 3 ? "warn" : "fail";
  return `<span class="score-mini ${tone}"><span>${escapeHtml(label)}</span>${roundToOne(score)}</span>`;
}

function scoreVerificationChip(school) {
  if (school.scoreStatus !== "verified") {
    return '<span class="detail-chip warn-chip">Score unverified</span>';
  }
  return `<span class="detail-chip verified-chip">Verified ${formatShortDate(school.scoreVerifiedAt)}</span>`;
}

function housePhoto(candidate, variant) {
  const url = candidate.listing?.imageUrl;
  const className = variant === "hero" ? "hero-photo" : "photo-thumb";
  const alt = `${candidate.address} house photo`;

  if (url) {
    return `
      <span class="${className}">
        <img src="${escapeAttribute(url)}" alt="${escapeAttribute(alt)}" loading="eager" />
      </span>
    `;
  }

  return `
    <span class="${className}" aria-label="House photo pending for ${escapeAttribute(candidate.address)}">
      <span class="photo-placeholder">Photo pending</span>
    </span>
  `;
}

function candidateLocationLine(candidate) {
  const neighborhood = candidate.neighborhood && candidate.neighborhood !== "Assignment pending"
    ? ` · ${candidate.neighborhood}`
    : "";
  return `${candidate.city}, CA ${candidate.zip}${neighborhood}`;
}

function formatAssignmentConfidence(confidence) {
  if (confidence === "listing-source") {
    return "Listing source";
  }
  return `${confidence} confidence`;
}

function listingSourceChips(candidate) {
  const chips = [];
  if (candidate.listing?.marketStatus) {
    chips.push(candidate.listing.marketStatus === "active" ? "Active listing" : "Off market");
  }
  if (candidate.listing?.mlsNumber) {
    chips.push(`MLS ${candidate.listing.mlsNumber}`);
  }
  return chips.map((chip) => `<span class="detail-chip">${escapeHtml(chip)}</span>`).join("");
}

function listingDataNotes(candidate) {
  const notes = [
    candidate.listing?.zestimateNote,
    candidate.listing?.zestimateRange ? `Zestimate range: ${formatUsd(candidate.listing.zestimateRange[0])} - ${formatUsd(candidate.listing.zestimateRange[1])}.` : null
  ].filter(Boolean);

  if (!notes.length) {
    return "";
  }

  return `
    <div class="note-box listing-note">
      <strong>Listing data</strong>
      ${notes.map((note) => `<div>${escapeHtml(note)}</div>`).join("")}
    </div>
  `;
}

function formatAskingPrice(candidate) {
  const askingPrice = candidate.listing?.askingPrice;
  if (typeof askingPrice === "number" && Number.isFinite(askingPrice)) {
    return formatUsd(askingPrice);
  }
  return candidate.listing?.priceLabel ?? "Open listing to verify";
}

function formatZestimate(candidate) {
  const zestimate = candidate.listing?.zestimate;
  if (typeof zestimate === "number" && Number.isFinite(zestimate)) {
    return formatUsd(zestimate);
  }
  return candidate.listing?.zestimateLabel ?? "Zestimate pending";
}

function formatUsd(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function exportCsv() {
  const rows = [
    ["rank", "address", "city", "zip", "asking_price", "zestimate", "market_status", "mls", "beds", "baths", "sqft", "days_on_market", "school_average", "elementary", "middle", "high", "status", "source_url"]
  ];

  state.filtered.forEach((candidate, index) => {
    rows.push([
      index + 1,
      candidate.address,
      candidate.city,
      candidate.zip,
      formatAskingPrice(candidate),
      formatZestimate(candidate),
      candidate.listing.marketStatus ?? "",
      candidate.listing.mlsNumber ?? "",
      candidate.beds,
      candidate.baths,
      candidate.sqft,
      candidate.daysOnMarket,
      candidate.schoolAverage,
      candidate.primaryScores.elementary,
      candidate.primaryScores.middle,
      candidate.primaryScores.high,
      candidateStatus(candidate).label,
      candidate.listing.sourceUrl
    ]);
  });

  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "schoolfit-candidates.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function roundToOne(value) {
  return Math.round(value * 10) / 10;
}

function numericScore(value) {
  const score = Number(value);
  return Number.isFinite(score) ? score : null;
}

function sortableScore(value) {
  return Number.isFinite(value) ? value : -1;
}

function sortableDays(value) {
  return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
}

function formatBaths(value) {
  return Number.isInteger(value) ? `${value}` : `${value.toFixed(1)}`;
}

function formatDaysOnMarket(value) {
  if (!Number.isFinite(value)) {
    return "Days on market pending";
  }
  return `${value} days on market`;
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDateTime(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function formatShortDate(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(date);
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

els.scoreFloor.addEventListener("input", () => {
  state.minScore = Number(els.scoreFloor.value);
  els.scoreFloorValue.textContent = `${state.minScore}%`;
  applyFilters();
});

els.onlyEligible.addEventListener("change", () => {
  state.onlyEligible = els.onlyEligible.checked;
  applyFilters();
});

els.minBeds.addEventListener("change", () => {
  state.minBeds = Number(els.minBeds.value);
  applyFilters();
});

els.minBaths.addEventListener("change", () => {
  state.minBaths = Number(els.minBaths.value);
  applyFilters();
});

els.daysFilter.addEventListener("change", () => {
  state.daysFilter = els.daysFilter.value;
  applyFilters();
});

els.searchInput.addEventListener("input", () => {
  state.search = els.searchInput.value;
  applyFilters();
});

els.sidebarToggleButton.addEventListener("click", () => {
  state.sidebarHidden = !state.sidebarHidden;
  window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(state.sidebarHidden));
  updateSidebarToggle();
});

els.sortDirectionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.sortKey = button.dataset.sortKey;
    state.sortDirection = button.dataset.sortDirection;
    updateSortButtons();
    applyFilters();
  });
});

els.refreshButton.addEventListener("click", () => loadCandidates());
els.exportButton.addEventListener("click", exportCsv);

updateSortButtons();
updateSidebarToggle();
loadCandidates().catch((error) => {
  console.error(error);
  els.emptyState.classList.remove("hidden");
});
