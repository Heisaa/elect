/* Riksdagsvalet 2026 – gissa resultatet */

const ELECTION_YEAR = 2026;
const ELECTION_DATE = "13 september 2026";

const PARTIES = [
  { abbr: "S",  name: "Socialdemokraterna", color: "#e8112d", base: 30.3 },
  { abbr: "V",  name: "Vänsterpartiet",     color: "#da291c", base: 6.7 },
  { abbr: "MP", name: "Miljöpartiet",      color: "#83cf39", base: 5.1 },
  { abbr: "C",  name: "Centerpartiet",      color: "#009f57", base: 6.7 },
  { abbr: "L",  name: "Liberalerna",        color: "#006aa7", base: 4.6 },
  { abbr: "KD", name: "Kristdemokraterna",  color: "#232b6b", base: 4.6 },
  { abbr: "M",  name: "Moderaterna",        color: "#52a3d8", base: 19.1 },
  { abbr: "SD", name: "Sverigedemokraterna",color: "#febc11", base: 20.5 },
];
const OTHERS = { abbr: "Övriga", name: "övriga partier", color: "#8a929c" };

const tbody = document.querySelector("#party-table tbody");
const totalDisplay = document.getElementById("total-display");
const warning = document.getElementById("warning");
const downloadBtn = document.getElementById("download-btn");
const copyBtn = document.getElementById("copy-btn");
const copiedMsg = document.getElementById("copied-msg");
const canvas = document.getElementById("result-canvas");

/* ---------- State helpers ---------- */

const values = Object.fromEntries(PARTIES.map((p) => [p.abbr, 0]));

function round1(v) {
  return Math.round(v * 10) / 10;
}

function sumParties() {
  return round1(Object.values(values).reduce((a, b) => a + b, 0));
}

function othersValue() {
  return round1(Math.max(0, 100 - sumParties()));
}

function allRows() {
  return [...PARTIES, OTHERS].map((p) => {
    const pct = p === OTHERS ? othersValue() : values[p.abbr];
    return { ...p, pct };
  });
}

function isValid() {
  return sumParties() <= 100 + 1e-9;
}

function fmt(pct) {
  return pct.toFixed(1).replace(".", ",");
}

/* ---------- UI construction ---------- */

const rows = {};

for (const p of PARTIES) {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>
      <span class="party-cell">
        <span class="party-dot" style="background:${p.color}"></span>
        <span class="party-abbr">${p.abbr}</span>
        <span class="party-name">${p.name}</span>
      </span>
    </td>
    <td class="slider-cell"><input type="range" min="0" max="100" step="0.1" value="0" aria-label="${p.name}"></td>
    <td>
      <span class="value-cell">
        <button class="stepper minus" type="button" aria-label="Minska ${p.name}">−</button>
        <input class="pct-input" type="number" min="0" max="100" step="0.1" value="0" aria-label="${p.name}, procent">
        <button class="stepper plus" type="button" aria-label="Öka ${p.name}">+</button>
        <span class="pct-sign">&nbsp;%</span>
      </span>
    </td>`;
  tbody.appendChild(tr);

  rows[p.abbr] = {
    slider: tr.querySelector('input[type="range"]'),
    input: tr.querySelector(".pct-input"),
    minus: tr.querySelector(".minus"),
    plus: tr.querySelector(".plus"),
  };
}

const othersTr = document.createElement("tr");
othersTr.innerHTML = `
  <td>
    <span class="party-cell">
      <span class="party-dot" style="background:${OTHERS.color}"></span>
      <span class="party-abbr">${OTHERS.abbr}</span>
      <span class="party-name">${OTHERS.name}</span>
    </span>
  </td>
  <td class="slider-cell"><em style="color:var(--muted);font-size:0.85rem">beräknas automatiskt</em></td>
  <td><span class="value-cell"><span class="others-value pct-input" style="border:none;background:transparent">0,0</span><span class="pct-sign">&nbsp;%</span></span></td>`;
tbody.appendChild(othersTr);
const othersDisplay = othersTr.querySelector(".others-value");

/* ---------- Value updates ---------- */

// Clamp a new value for a party so the total never exceeds 100.0.
function clampValue(abbr, value) {
  const othersSum = Object.entries(values)
    .filter(([a]) => a !== abbr)
    .reduce((s, [, v]) => s + v, 0);
  return round1(Math.min(Math.max(value, 0), Math.max(0, round1(100 - othersSum))));
}

function setValue(abbr, value, { clamp = true } = {}) {
  if (clamp) value = clampValue(abbr, value);
  values[abbr] = value;
  refreshUI();
}

function refreshUI() {
  for (const p of PARTIES) {
    const r = rows[p.abbr];
    const v = values[p.abbr];
    if (document.activeElement !== r.input) {
      r.input.value = v.toFixed(1);
    }
    r.slider.value = v.toFixed(1);
  }
  othersDisplay.textContent = fmt(othersValue());
  totalDisplay.innerHTML = "100,0&nbsp;%";
  const ok = isValid();
  warning.classList.toggle("hidden", ok);
  downloadBtn.disabled = !ok;
  copyBtn.disabled = !ok;
}

for (const p of PARTIES) {
  const r = rows[p.abbr];

  r.slider.addEventListener("input", () => setValue(p.abbr, parseFloat(r.slider.value)));
  r.input.addEventListener("input", () => {
    // Update live while typing, but don't clamp until blur.
    const v = parseFloat(r.input.value);
    if (!Number.isNaN(v)) {
      values[p.abbr] = round1(Math.min(Math.max(v, 0), 100));
      refreshUI();
    }
  });
  r.input.addEventListener("change", () => {
    const v = parseFloat(r.input.value);
    setValue(p.abbr, Number.isNaN(v) ? 0 : v);
  });

  const step = (delta) => () => {
    const v = parseFloat(r.input.value);
    setValue(p.abbr, (Number.isNaN(v) ? 0 : v) + delta);
  };
  r.minus.addEventListener("click", step(-0.1));
  r.plus.addEventListener("click", step(0.1));

  // Arrow keys on the number input also respect the clamp via change event.
}

document.getElementById("prefill-2022").addEventListener("click", () => {
  for (const p of PARTIES) values[p.abbr] = p.base;
  refreshUI();
});

document.getElementById("reset").addEventListener("click", () => {
  for (const p of PARTIES) values[p.abbr] = 0;
  refreshUI();
});

/* ---------- Copy as text ---------- */

function buildText() {
  const lines = allRows().map((r) => `${r.abbr.padEnd(7)} ${fmt(r.pct)} %`);
  return [
    `Min gissning – Riksdagsvalet ${ELECTION_YEAR} (${ELECTION_DATE})`,
    "-".repeat(24),
    ...lines,
    "-".repeat(24),
    `Summa: 100,0 %`,
  ].join("\n");
}

copyBtn.addEventListener("click", async () => {
  const text = buildText();
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback for older browsers / non-secure contexts
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
  copiedMsg.classList.remove("hidden");
  setTimeout(() => copiedMsg.classList.add("hidden"), 2000);
});

/* ---------- Image download ---------- */

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawCanvas() {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;

  ctx.fillStyle = "#f4f6f8";
  ctx.fillRect(0, 0, W, H);

  // Header
  ctx.fillStyle = "#1a1a1a";
  ctx.font = "700 44px 'Segoe UI', system-ui, sans-serif";
  ctx.fillText(`Min gissning: Riksdagsvalet ${ELECTION_YEAR}`, 60, 80);
  ctx.fillStyle = "#5f6672";
  ctx.font = "400 22px 'Segoe UI', system-ui, sans-serif";
  ctx.fillText(`Riksdagsval ${ELECTION_DATE} · alla partier i procent av rösterna`, 60, 116);

  // Bars
  const data = allRows();
  const maxPct = Math.max(...data.map((d) => d.pct), 1);
  const labelX = 60, barX = 260, barMaxW = 730, pctX = W - 60;
  const top = 160, rowH = 48;

  data.forEach((d, i) => {
    const y = top + i * rowH;
    const cy = y + rowH / 2;

    ctx.fillStyle = "#1a1a1a";
    ctx.font = "700 24px 'Segoe UI', system-ui, sans-serif";
    ctx.fillText(d.abbr, labelX, cy + 8);

    ctx.fillStyle = "#e3e7ec";
    roundRect(ctx, barX, cy - 13, barMaxW, 26, 6);
    ctx.fill();

    const w = (d.pct / maxPct) * barMaxW;
    if (d.pct > 0) {
      ctx.fillStyle = d.color;
      roundRect(ctx, barX, cy - 13, Math.max(w, 12), 26, 6);
      ctx.fill();
    }

    ctx.fillStyle = "#1a1a1a";
    ctx.font = "700 24px 'Segoe UI', system-ui, sans-serif";
    const pctText = fmt(d.pct) + " %";
    ctx.fillText(pctText, pctX - ctx.measureText(pctText).width, cy + 8);
  });

  // Footer
  ctx.fillStyle = "#5f6672";
  ctx.font = "400 20px 'Segoe UI', system-ui, sans-serif";
  ctx.fillText("Summa: 100,0 %", 60, H - 36);
}

downloadBtn.addEventListener("click", () => {
  drawCanvas();
  const link = document.createElement("a");
  link.download = `riksdagsgissning-${ELECTION_YEAR}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
});

/* ---------- Init ---------- */
refreshUI();
