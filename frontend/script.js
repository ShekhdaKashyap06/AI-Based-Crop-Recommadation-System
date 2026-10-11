/* ============================================================
   CROP DATA
   Copied from dataset/crop_requirements1.csv and
   dataset/crop_economics1.csv. The backend has no "check one
   crop" endpoint, so page 3 uses this table for the crop the
   user types in.
   ============================================================ */
const CROPS = [
    { name: "Rice", soil: "Clay/Loam", ph: [5.5, 7.0], temp: [20, 35], rain: [150, 300], cost: 22000 },
    { name: "Maize", soil: "Loam/Sandy loam", ph: [5.5, 7.5], temp: [18, 32], rain: [50, 200], cost: 11000 },
    { name: "Chickpea", soil: "Well-drained loam/Sandy loam", ph: [6.0, 8.0], temp: [15, 30], rain: [40, 100], cost: 9000 },
    { name: "Kidneybeans", soil: "Well-drained loam", ph: [5.5, 6.5], temp: [15, 25], rain: [60, 150], cost: 10000 },
    { name: "Pigeonpeas", soil: "Well-drained loam", ph: [6.5, 7.5], temp: [20, 35], rain: [60, 150], cost: 10000 },
    { name: "Mothbeans", soil: "Sandy/Sandy loam", ph: [6.0, 8.0], temp: [25, 35], rain: [20, 60], cost: 6500 },
    { name: "Mungbean", soil: "Loam/Sandy loam", ph: [6.2, 7.2], temp: [25, 35], rain: [35, 100], cost: 7500 },
    { name: "Blackgram", soil: "Loam/Sandy loam", ph: [6.0, 7.5], temp: [25, 35], rain: [40, 100], cost: 8000 },
    { name: "Lentil", soil: "Well-drained loam", ph: [6.0, 7.5], temp: [18, 30], rain: [30, 100], cost: 8500 },
    { name: "Pomegranate", soil: "Well-drained loam/Sandy loam", ph: [5.5, 7.5], temp: [20, 35], rain: [50, 100], cost: 45000 },
    { name: "Banana", soil: "Deep fertile loam", ph: [6.0, 7.5], temp: [20, 35], rain: [100, 250], cost: 50000 },
    { name: "Mango", soil: "Well-drained loam", ph: [5.5, 7.5], temp: [24, 35], rain: [75, 250], cost: 35000 },
    { name: "Grapes", soil: "Well-drained sandy loam/loam", ph: [6.0, 7.5], temp: [15, 35], rain: [50, 100], cost: 90000 },
    { name: "Watermelon", soil: "Sandy loam", ph: [6.0, 7.5], temp: [22, 35], rain: [40, 100], cost: 18000 },
    { name: "Muskmelon", soil: "Sandy loam", ph: [6.0, 7.5], temp: [22, 35], rain: [40, 100], cost: 18000 },
    { name: "Apple", soil: "Well-drained loam", ph: [5.5, 7.0], temp: [10, 24], rain: [50, 150], cost: 50000 },
    { name: "Orange", soil: "Well-drained loam/Sandy loam", ph: [5.5, 7.5], temp: [20, 30], rain: [75, 150], cost: 35000 },
    { name: "Papaya", soil: "Well-drained loam", ph: [6.0, 7.0], temp: [21, 33], rain: [100, 200], cost: 30000 },
    { name: "Coconut", soil: "Sandy loam/Loam", ph: [5.5, 8.0], temp: [20, 32], rain: [100, 250], cost: 25000 },
    { name: "Cotton", soil: "Deep well-drained loam/Black soil", ph: [5.5, 8.5], temp: [21, 35], rain: [50, 120], cost: 21000 },
    { name: "Jute", soil: "Loam/Sandy loam", ph: [6.0, 7.5], temp: [24, 35], rain: [150, 250], cost: 14000 },
    { name: "Coffee", soil: "Well-drained loam", ph: [5.0, 6.5], temp: [18, 28], rain: [150, 300], cost: 30000 }
];

const SQFT_PER_ACRE = 43560;

/* ============================================================
   SMALL HELPERS
   ============================================================ */
const $ = id => document.getElementById(id);

const esc = s => String(s).replace(/[&<>"']/g, c => (
    { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]
));

const pct   = v => (Number(v) || 0).toFixed(1) + "%";
const clamp = v => Math.max(0, Math.min(100, Number(v) || 0));
const inr   = n => "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
const norm  = s => String(s).toLowerCase().replace(/[^a-z]/g, "");   // "Kidney beans" -> "kidneybeans"

function showError(id, msg){ const e = $(id); e.textContent = msg; e.classList.add("show"); }
function clearError(id){ const e = $(id); e.textContent = ""; e.classList.remove("show"); }


/* ============================================================
   SAVED STATE  (kept while the tab is open, survives refresh)
   ============================================================ */
const state = { details: null, budget: null };

try{
    Object.assign(state, JSON.parse(sessionStorage.getItem("fieldLedger") || "{}"));
}catch(e){ /* storage not available - state just lives in memory */ }

function save(){
    try{ sessionStorage.setItem("fieldLedger", JSON.stringify(state)); }catch(e){}
}


/* ============================================================
   API CALL  (backend is used exactly as it is)
   ============================================================ */
async function callRecommend(details, budget){
    const base = $("apiBase").value.trim().replace(/\/+$/, "");
    let res;
    try{
        res = await fetch(base + "/recommend", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...details, budget })
        });
    }catch(e){
        throw new Error(`Could not reach the API at ${base}.\nMake sure FastAPI is running.`);
    }
    if(!res.ok){
        let msg = `Server responded ${res.status}.`;
        try{
            const d = await res.json();
            if(Array.isArray(d.detail)){
                msg = d.detail.map(i => `${(i.loc || []).join(".")}: ${i.msg}`).join("\n");
            }else if(d.detail){ msg = d.detail; }
        }catch(e){}
        throw new Error(msg);
    }
    return res.json();
}


/* ============================================================
   PAGE ROUTING  (#/  #/budget  #/check)
   ============================================================ */
function go(hash){ location.hash = hash; }

function route(){
    const page = location.hash.replace("#/", "") || "details";

    // Guards: later pages need the earlier data
    if(page === "budget" && !state.details){ showError("detailsError", "Fill in your field details first."); return go("#/"); }

    const views = ["details", "budget", "check", "about"];
    const view = views.includes(page) ? page : "details";
    const flow = ["details", "budget", "check"];
    const current = flow.indexOf(view);

    views.forEach(name => $("view-" + name).classList.toggle("show", name === view));

    // stepper belongs to the 3-step flow only
    $("stepbar").hidden = current < 0;
    flow.forEach((name, i) => {
        const step = $("step" + (i + 1));
        step.classList.toggle("active", i === current);
        step.classList.toggle("done", i < current);
    });

    // top navigation highlight
    const navKey = (view === "details" || view === "budget") ? "recommend" : view;
    document.querySelectorAll(".nav a").forEach(a => a.classList.toggle("on", a.dataset.view === navKey));

    if(view === "details") fillDetails();
    if(view === "budget")  openBudgetPage();
    if(view === "check")   openCheckPage();

    window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);

/* API status light in the top bar */
async function pingApi(){
    const base = $("apiBase").value.trim().replace(/\/+$/, "");
    try{
        const r = await fetch(base + "/");
        if(!r.ok) throw new Error();
        $("apiDot").className = "api up";   $("apiTxt").textContent = "API online";
    }catch(e){
        $("apiDot").className = "api down"; $("apiTxt").textContent = "API offline";
    }
}
$("apiBase").addEventListener("change", pingApi);


/* ============================================================
   SUMMARY OF PAGE-1 DETAILS (shown on pages 2 and 3)
   ============================================================ */
function summaryHTML(withBudget){
    const d = state.details;
    const rows = [
        ["Nitrogen", d.nitrogen], ["Phosphorus", d.phosphorus], ["Potassium", d.potassium],
        ["Soil pH", d.ph], ["Temperature", d.temperature + " °C"], ["Humidity", d.humidity + "%"],
        ["Rainfall", d.rainfall + " mm"], ["Soil type", d.soil_type], ["Land", d.land_area + " sq.ft"]
    ];
    if(withBudget && state.budget) rows.push(["Budget", inr(state.budget)]);
    return `<h4>Your field</h4><dl>` +
        rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("") +
        `</dl><a href="#/">Edit details</a>`;
}


/* ============================================================
   PAGE 1 — FIELD DETAILS
   ============================================================ */
const detailIds = {
    nitrogen:"nitrogen", phosphorus:"phosphorus", potassium:"potassium",
    ph:"ph", temperature:"temperature", humidity:"humidity",
    rainfall:"rainfall", soil_type:"soilType", land_area:"landArea"
};

// Allowed input ranges (frontend validation only)
const INPUT_LIMITS = {
    nitrogen:    { label: "Nitrogen",    min: 0, max: 140,  unit: " mg/kg" },
    phosphorus:  { label: "Phosphorus",  min: 0, max: 145,  unit: " mg/kg" },
    potassium:   { label: "Potassium",   min: 0, max: 205,  unit: " mg/kg" },
    ph:          { label: "Soil pH",     min: 0, max: 14,   unit: "" },
    temperature: { label: "Temperature", min: 0, max: 50,   unit: " °C" },
    humidity:    { label: "Humidity",    min: 0, max: 100,  unit: " %" },
    rainfall:    { label: "Rainfall",    min: 0, max: 3000, unit: " mm" }
};
const SOIL_TYPES = ["Loam", "Sandy loam", "Clay", "Clay loam", "Sandy", "Silty loam", "Red soil", "Black soil"];

function fillDetails(){
    if(!state.details) return;
    for(const [key, id] of Object.entries(detailIds)) $(id).value = state.details[key];
}

$("detailsForm").addEventListener("submit", e => {
    e.preventDefault();
    clearError("detailsError");

    const d = {};
    for(const [key, id] of Object.entries(detailIds)){
        d[key] = key === "soil_type" ? $(id).value : parseFloat($(id).value);
    }

    // Input validation (impossible values only - crop suitability is decided by the backend)
    for(const [key, val] of Object.entries(d)){
        if(val === "" || (typeof val === "number" && Number.isNaN(val))){
            return showError("detailsError", "Please fill in all fields.");
        }
    }
    for(const [key, rule] of Object.entries(INPUT_LIMITS)){
        if(d[key] < rule.min || d[key] > rule.max){
            return showError("detailsError", `${rule.label} must be between ${rule.min} and ${rule.max}${rule.unit}.`);
        }
    }
    if(!SOIL_TYPES.includes(d.soil_type)) return showError("detailsError", "Please select a soil type from the list.");
    if(d.land_area <= 0) return showError("detailsError", "Land area must be greater than 0.");

    // If the details changed, old results no longer apply
    if(JSON.stringify(d) !== JSON.stringify(state.details)) state.reco = null;

    state.details = d;
    save();
    go("#/budget");                       // ---> page 2
});


/* ============================================================
   PAGE 2 — BUDGET + RECOMMENDATION
   ============================================================ */
function openBudgetPage(){
    $("summary2").innerHTML = summaryHTML(false);
    if(state.budget) $("budget").value = state.budget;
    clearError("budgetError");
    if(state.reco) renderResults(state.reco); else $("results").innerHTML = "";
}

function badgeClass(status){
    return status === "Affordable" ? "ok" : status === "Not Affordable" ? "no" : "";
}

function barRow(cls, tag, value){
    return `
        <div class="bar-row ${cls}">
            <span class="tag">${tag}</span>
            <div class="track"><div class="fill" data-w="${clamp(value)}"></div></div>
            <span class="val">${pct(value)}</span>
        </div>`;
}

function renderResults(data){
    const list = data.recommendations || [];
    const best = data.best_affordable_crop;

    if(!list.length){
        $("results").innerHTML = `<p class="hint">The model returned no candidates.</p>`;
        return;
    }

    const cards = list.map((r, i) => {
        const cost = (r.estimated_cost == null)
            ? "Cost data not available"
            : "Estimated cost — " + inr(r.estimated_cost);
        return `
        <article class="card ${best && r.crop === best ? "best" : ""}">
            <div class="card-top">
                <div>
                    <span class="rank">No. ${String(i + 1).padStart(2, "0")} of ${list.length}</span>
                    <h3 class="card-name">${esc(r.crop)}</h3>
                </div>
                <span class="badge ${badgeClass(r.status)}">${esc(r.status)}</span>
            </div>
            <div class="bars">
                ${barRow("ml",   "ML read", r.ml_score)}
                ${barRow("fit",  "Fit",     r.suitability_score)}
                ${barRow("econ", "Budget",  r.economic_score)}
            </div>
            ${r.soil_status ? `<p class="soil-note ${r.soil_status === "Suitable" ? "yes" : "nope"}">${
                r.soil_status === "Suitable"
                    ? "✔ Soil suitable"
                    : "✘ Soil not suitable — " + esc(r.soil_message || "")}</p>` : ""}
            <div class="card-foot">
                <span>Final score <b>${pct(r.final_score)}</b></span>
                <span>${cost}</span>
            </div>
        </article>`;
    }).join("");

    $("results").innerHTML = `
        <div class="results-head">
            <h2>Top candidates</h2>
            ${best
                ? `<span class="seal">Best affordable — ${esc(best)}</span>`
                : `<span class="hint">No top-3 crop fits this budget</span>`}
        </div>
        <div class="cards">${cards}</div>`;

    // animate bars
    requestAnimationFrame(() => {
        document.querySelectorAll("#results .fill").forEach(el => el.style.width = el.dataset.w + "%");
    });
}

$("budgetForm").addEventListener("submit", async e => {
    e.preventDefault();
    clearError("budgetError");

    const budget = parseFloat($("budget").value);
    if(Number.isNaN(budget) || budget <= 0){
        return showError("budgetError", "Please enter a budget greater than 0.");
    }

    $("budgetBtn").disabled = true;
    $("budgetHint").textContent = "Analysing…";

    try{
        const data = await callRecommend(state.details, budget);
        state.budget = budget;
        state.reco = data;
        save();
        renderResults(data);
        $("budgetHint").textContent = "Done";
        $("results").scrollIntoView({ behavior: "smooth", block: "start" });
    }catch(err){
        showError("budgetError", err.message);
        $("budgetHint").textContent = "Failed";
    }finally{
        $("budgetBtn").disabled = false;
    }
});

$("toCheckBtn").addEventListener("click", () => {
    clearError("budgetError");
    if(!state.budget){
        return showError("budgetError", "Enter your budget and click “Get recommendation” first.");
    }
    go("#/check");                        // ---> page 3
});


/* ============================================================
   PAGE 3 — CHECK THE USER'S OWN CROP
   ============================================================ */
$("cropList").innerHTML = CROPS.map(c => `<option value="${c.name}">`).join("");

function openCheckPage(){
    const ready = !!(state.details && state.budget);
    $("view-check").classList.toggle("flow", ready);
    $("summary3").hidden = $("checkForm").hidden = $("checkResult").hidden = !ready;
    $("checkGate").hidden = ready;
    if(!ready){
        const noDetails = !state.details;
        $("gateMsg").textContent = noDetails
            ? "To check a crop we need your field details first. Enter them, add your budget, then come back here."
            : "Add your budget and get a recommendation first. Then you can test any crop against your field.";
        $("gateBtn").textContent = noDetails ? "Enter field details →" : "Go to budget →";
        $("gateBtn").href = noDetails ? "#/" : "#/budget";
        return;
    }
    $("summary3").innerHTML = summaryHTML(true);
    clearError("checkError");
}

// Same scoring rule as the backend (app/core/suitability.py)
function rangeScore(value, min, max){
    if(value >= min && value <= max) return 100;
    const distance = value < min ? min - value : value - max;
    return Math.max(0, Math.round((100 - distance / (max - min) * 100) * 100) / 100);
}

function soilScore(farmerSoil, requiredSoil){
    const farmer = farmerSoil.toLowerCase().trim();
    return requiredSoil.toLowerCase().split("/").some(s => s.trim() === farmer) ? 100 : 0;
}

function checkCrop(crop, d, budget){
    const soil = soilScore(d.soil_type, crop.soil);
    const ph   = rangeScore(d.ph, crop.ph[0], crop.ph[1]);
    const temp = rangeScore(d.temperature, crop.temp[0], crop.temp[1]);
    const rain = rangeScore(d.rainfall, crop.rain[0], crop.rain[1]);

    const suitability = Math.round((soil * 0.30 + ph * 0.25 + temp * 0.25 + rain * 0.20) * 100) / 100;
    const cost = crop.cost * (d.land_area / SQFT_PER_ACRE);

    return {
        suitability,
        rows: [
            { name: "Soil type",   yours: d.soil_type,               ideal: crop.soil.replace(/\//g, " / "), score: soil },
            { name: "Soil pH",     yours: d.ph,                      ideal: `${crop.ph[0]} – ${crop.ph[1]}`,   score: ph },
            { name: "Temperature", yours: `${d.temperature} °C`,     ideal: `${crop.temp[0]} – ${crop.temp[1]} °C`, score: temp },
            { name: "Rainfall",    yours: `${d.rainfall} mm`,        ideal: `${crop.rain[0]} – ${crop.rain[1]} mm`, score: rain }
        ],
        cost,
        affordable: cost <= budget
    };
}

$("checkForm").addEventListener("submit", async e => {
    e.preventDefault();
    clearError("checkError");
    $("checkResult").innerHTML = "";

    const typed = $("cropName").value.trim();
    if(!typed) return showError("checkError", "Please enter a crop name.");

    const crop = CROPS.find(c => norm(c.name) === norm(typed));
    if(!crop){
        return showError("checkError",
            `“${typed}” is not in the crop database.\nAvailable crops: ` + CROPS.map(c => c.name).join(", "));
    }

    $("checkBtn").disabled = true;

    // Ask the backend whether the crop is in the ML model's top 3 for this field
    let mlLine;
    try{
        const data = await callRecommend(state.details, state.budget);
        const hit = (data.recommendations || []).find(r => norm(r.crop) === norm(crop.name));
        mlLine = hit
            ? `The ML model ranks <b>${esc(crop.name)}</b> in its top 3 for this field, with a score of <b>${pct(hit.ml_score)}</b>.`
            : `<b>${esc(crop.name)}</b> is not in the ML model's top 3 for this field.`;
    }catch(err){
        mlLine = `ML model result not available (${esc(err.message.split("\n")[0])}).`;
    }

    const r = checkCrop(crop, state.details, state.budget);

    const verdict = r.suitability >= 80 ? ["Well suited", "ok"]
                  : r.suitability >= 50 ? ["Partly suited", "mid"]
                  :                       ["Poorly suited", "no"];

    const rows = r.rows.map(x => `
        <tr>
            <td>${x.name}</td>
            <td>${esc(x.yours)}</td>
            <td>${esc(x.ideal)}</td>
            <td class="${x.score === 100 ? "yes" : "nope"}">
                ${x.score === 100 ? "✔ Match" : "✘ " + x.score.toFixed(0) + "%"}
            </td>
        </tr>`).join("");

    $("checkResult").innerHTML = `
        <article class="card ${verdict[1] === "ok" ? "best" : ""}">
            <div class="card-top">
                <div>
                    <span class="rank">Your crop</span>
                    <h3 class="card-name">${esc(crop.name)}</h3>
                </div>
                <span class="badge ${verdict[1]}">${verdict[0]} · ${pct(r.suitability)}</span>
            </div>

            <table class="check">
                <thead><tr><th>Detail</th><th>Your field</th><th>Ideal for ${esc(crop.name)}</th><th>Result</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>

            <div class="notes">
                <p>Estimated cost for your land: <b>${inr(r.cost)}</b> against a budget of <b>${inr(state.budget)}</b> —
                   <b class="${r.affordable ? "yes" : "nope"}">${r.affordable ? "Affordable" : "Not affordable"}</b>.</p>
                <p>${mlLine}</p>
            </div>
        </article>`;

    $("checkBtn").disabled = false;
});

$("backToBudget").addEventListener("click", () => go("#/budget"));


/* ============================================================
   START
   ============================================================ */
/* ============================================================
   START A NEW PREDICTION  (clears everything, back to page 1)
   ============================================================ */
function newPrediction(){
    state.details = null; state.budget = null; state.reco = null;
    save();
    Object.values(detailIds).forEach(id => $(id).value = "");
    $("budget").value = ""; $("cropName").value = "";
    $("results").innerHTML = ""; $("checkResult").innerHTML = "";
    $("budgetHint").textContent = "";
    ["detailsError", "budgetError", "checkError"].forEach(clearError);
    if(location.hash === "" || location.hash === "#/") route(); else go("#/");
}
document.querySelectorAll(".js-new").forEach(b => b.addEventListener("click", newPrediction));

pingApi();
route();
