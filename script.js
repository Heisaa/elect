/* Riksdagsvalet 2026 – gissa resultatet */

const ELECTION_YEAR = 2026;
const ELECTION_DATE = "13 september 2026";

const PARTIES = [
  { abbr: "S",  name: "Socialdemokraterna", base: 30.3 },
  { abbr: "V",  name: "Vänsterpartiet",     base: 6.7 },
  { abbr: "MP", name: "Miljöpartiet",      base: 5.1 },
  { abbr: "C",  name: "Centerpartiet",      base: 6.7 },
  { abbr: "L",  name: "Liberalerna",        base: 4.6 },
  { abbr: "KD", name: "Kristdemokraterna",  base: 4.6 },
  { abbr: "M",  name: "Moderaterna",        base: 19.1 },
  { abbr: "SD", name: "Sverigedemokraterna",base: 20.5 },
];
const OTHERS_ABBR = "Övriga";
const OTHERS_NAME = "övriga partier";

const TRACK_MAX = 40; // procent som motsvarar stapelns fulla höjd

/* Färgpalett: [topp, botten] för stapelns gradient + badge-färg */
const COLORS = {
  S:  { grad: ["#ff4557", "#c00d24"], glow: "rgba(232,17,45,0.35)" },
  V:  { grad: ["#ff5148", "#b31e14"], glow: "rgba(218,41,28,0.35)" },
  MP: { grad: ["#9be14d", "#6cb02a"], glow: "rgba(131,207,57,0.35)" },
  C:  { grad: ["#2fd47e", "#007a43"], glow: "rgba(0,159,87,0.35)" },
  L:  { grad: ["#3fa4ff", "#005082"], glow: "rgba(0,106,167,0.35)" },
  KD: { grad: ["#5d6cd0", "#1b2260"], glow: "rgba(35,43,107,0.4)" },
  M:  { grad: ["#7cc0f0", "#2c7dbf"], glow: "rgba(82,163,216,0.35)" },
  SD: { grad: ["#ffd25e", "#e8a200"], glow: "rgba(254,188,17,0.3)" },
  OV: { grad: ["#9aa3b5", "#5b6478"], glow: "rgba(138,146,156,0.3)" },
};

/* ---------- Partimärken (inline-SVG, alternativt logos/<abbr>.png|svg) ---------- */

function chipSvg(color, letters, textColor = "#fff") {
  const size = letters.length > 1 ? 15 : 21;
  return `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${letters}">
    <rect width="40" height="40" rx="11" fill="${color}"/>
    <text x="20" y="20" text-anchor="middle" dominant-baseline="central"
      font-family="'Space Grotesk','Inter',sans-serif" font-weight="700" font-size="${size}"
      fill="${textColor}">${letters}</text>
  </svg>`;
}

function rosetteSvg() {
  let petals = "";
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    petals += `<circle cx="${20 + 10 * Math.cos(a)}" cy="${20 + 10 * Math.sin(a)}" r="7.2" fill="#e8112d"/>`;
  }
  return `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="S">
    <rect width="40" height="40" rx="11" fill="#fff"/>
    ${petals}
    <circle cx="20" cy="20" r="7" fill="#b3001b"/>
  </svg>`;
}

function daisySvg() {
  let petals = "";
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    petals += `<circle cx="${20 + 10 * Math.cos(a)}" cy="${20 + 10 * Math.sin(a)}" r="7"
      fill="${i % 2 ? "#f4c50f" : "#83cf39"}"/>`;
  }
  return `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="MP">
    <rect width="40" height="40" rx="11" fill="#fff"/>
    ${petals}
    <circle cx="20" cy="20" r="5.5" fill="#fff"/>
  </svg>`;
}

const BADGE_SVG = {
  S: rosetteSvg(),
  MP: daisySvg(),
  V: chipSvg("#da291c", "V"),
  C: chipSvg("#009f57", "C"),
  L: chipSvg("#006aa7", "L"),
  KD: chipSvg("#232b6b", "KD"),
  M: chipSvg("#52a3d8", "M"),
  SD: chipSvg("#123c8a", "SD", "#febc11"),
  OV: chipSvg("#6b7484", "Ö"),
};

// Försök ladda riktiga logotyper från logos/-mappen, fall annars tillbaka till SVG-märket.
const logoImgs = {};
function tryLogo(partyKey, onDone) {
  const paths = [`logos/${partyKey}.png`, `logos/${partyKey}.svg`];
  const attempt = (i) => {
    if (i >= paths.length) return;
    const img = new Image();
    img.onload = () => { logoImgs[partyKey] = img; onDone(); };
    img.onerror = () => attempt(i + 1);
    img.src = paths[i];
  };
  attempt(0);
}

/* ---------- State ---------- */

const values = Object.fromEntries(PARTIES.map((p) => [p.abbr, 0]));

function round1(v) { return Math.round(v * 10) / 10; }
function sumParties() { return round1(Object.values(values).reduce((a, b) => a + b, 0)); }
function othersValue() { return round1(Math.max(0, 100 - sumParties())); }
function isValid() { return sumParties() <= 100 + 1e-9; }
function fmt(pct) { return pct.toFixed(1).replace(".", ","); }

function clampValue(abbr, value) {
  const othersSum = Object.entries(values)
    .filter(([a]) => a !== abbr)
    .reduce((s, [, v]) => s + v, 0);
  return round1(Math.min(Math.max(value, 0), Math.max(0, round1(100 - othersSum))));
}

function allRows() {
  return [
    ...PARTIES.map((p) => ({ key: p.abbr, abbr: p.abbr, name: p.name, pct: values[p.abbr] })),
    { key: "OV", abbr: OTHERS_ABBR, name: OTHERS_NAME, pct: othersValue() },
  ];
}

/* ---------- DOM ---------- */

const chart = document.getElementById("chart");
const warning = document.getElementById("warning");
const downloadBtn = document.getElementById("download-btn");
const copyBtn = document.getElementById("copy-btn");
const copiedMsg = document.getElementById("copied-msg");
const canvas = document.getElementById("result-canvas");

const els = {};

function buildColumn(p) {
  const isOthers = p.key === "OV";
  const c = COLORS[p.key];
  const col = document.createElement("div");
  col.className = "column" + (isOthers ? " is-others" : "");
  col.innerHTML = `
    <div class="badge" title="${p.name}">${BADGE_SVG[p.key]}</div>
    <div class="track${isOthers ? " readonly" : ""}" ${isOthers ? "" : 'role="slider" tabindex="0" aria-label="' + p.name + '"'}>
      <div class="bar" style="background:linear-gradient(180deg,${c.grad[0]},${c.grad[1]});box-shadow:0 0 18px ${c.glow}"></div>
    </div>
    <div class="value-row">
      ${isOthers ? "" : '<button class="stepper minus" type="button" aria-label="Minska">−</button>'}
      ${isOthers
        ? '<span class="pct-input static" data-others>0,0</span>'
        : `<input class="pct-input" type="text" inputmode="decimal" value="0,0" aria-label="${p.name}, procent">`}
      ${isOthers ? "" : '<button class="stepper plus" type="button" aria-label="Öka">+</button>'}
    </div>
    <span class="col-abbr">${p.abbr}</span>`;
  chart.appendChild(col);

  const track = col.querySelector(".track");
  const bar = col.querySelector(".bar");
  const entry = { col, track, bar };

  if (isOthers) {
    entry.input = col.querySelector("[data-others]");
    return entry;
  }

  entry.input = col.querySelector(".pct-input");
  entry.minus = col.querySelector(".minus");
  entry.plus = col.querySelector(".plus");

  /* Drag / klick på stapeln */
  const pctFromPointer = (clientY) => {
    const r = track.getBoundingClientRect();
    const frac = (r.bottom - clientY) / r.height;
    return round1(Math.min(Math.max(frac, 0), 1) * TRACK_MAX);
  };
  track.addEventListener("pointerdown", (e) => {
    track.classList.add("dragging");
    track.setPointerCapture(e.pointerId);
    setValue(p.abbr, pctFromPointer(e.clientY));
  });
  track.addEventListener("pointermove", (e) => {
    if (track.hasPointerCapture(e.pointerId)) setValue(p.abbr, pctFromPointer(e.clientY));
  });
  track.addEventListener("pointerup", () => track.classList.remove("dragging"));
  track.addEventListener("pointercancel", () => track.classList.remove("dragging"));

  /* Scrollhjul: finjustera ±0,1 */
  track.addEventListener("wheel", (e) => {
    e.preventDefault();
    setValue(p.abbr, values[p.abbr] + (e.deltaY < 0 ? 0.1 : -0.1));
  }, { passive: false });

  /* Tangenter på track (fokus) */
  track.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" || e.key === "ArrowRight") {
      e.preventDefault();
      setValue(p.abbr, values[p.abbr] + (e.shiftKey ? 1 : 0.1));
    } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
      e.preventDefault();
      setValue(p.abbr, values[p.abbr] - (e.shiftKey ? 1 : 0.1));
    }
  });

  entry.minus.addEventListener("click", () => setValue(p.abbr, values[p.abbr] - 0.1));
  entry.plus.addEventListener("click", () => setValue(p.abbr, values[p.abbr] + 0.1));

  /* Sifferfält: text med komma, klamrar först vid blur */
  const parse = (s) => parseFloat(s.replace(/\s/g, "").replace(",", "."));
  entry.input.addEventListener("input", () => {
    const v = parse(entry.input.value);
    if (!Number.isNaN(v)) {
      values[p.abbr] = round1(Math.min(Math.max(v, 0), 100));
      refreshUI();
    }
  });
  entry.input.addEventListener("change", () => {
    const v = parse(entry.input.value);
    setValue(p.abbr, Number.isNaN(v) ? 0 : v);
  });
  entry.input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp") { e.preventDefault(); setValue(p.abbr, values[p.abbr] + (e.shiftKey ? 1 : 0.1)); }
    if (e.key === "ArrowDown") { e.preventDefault(); setValue(p.abbr, values[p.abbr] - (e.shiftKey ? 1 : 0.1)); }
  });
  return entry;
}

for (const p of PARTIES) els[p.abbr] = buildColumn({ key: p.abbr, abbr: p.abbr, name: p.name });
els.OV = buildColumn({ key: "OV", abbr: OTHERS_ABBR, name: OTHERS_NAME });

/* ---------- Uppdatering ---------- */

function setValue(abbr, value) {
  values[abbr] = clampValue(abbr, value);
  refreshUI();
}

function refreshUI() {
  for (const p of PARTIES) {
    const e = els[p.abbr];
    const v = values[p.abbr];
    e.bar.style.height = (Math.min(v, TRACK_MAX) / TRACK_MAX * 100).toFixed(1) + "%";
    if (document.activeElement !== e.input) e.input.value = fmt(v);
    e.track.setAttribute("aria-valuenow", v);
  }
  const ov = othersValue();
  els.OV.bar.style.height = (Math.min(ov, TRACK_MAX) / TRACK_MAX * 100).toFixed(1) + "%";
  els.OV.input.textContent = fmt(ov);

  const ok = isValid();
  warning.classList.toggle("hidden", ok);
  downloadBtn.disabled = !ok;
  copyBtn.disabled = !ok;
}

document.getElementById("prefill-2022").addEventListener("click", () => {
  for (const p of PARTIES) values[p.abbr] = p.base;
  refreshUI();
});
document.getElementById("reset").addEventListener("click", () => {
  for (const p of PARTIES) values[p.abbr] = 0;
  refreshUI();
});

/* ---------- Kopiera som text ---------- */

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

/* ---------- Bild ---------- */

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function roundedTopBar(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
}

function drawBadge(ctx, key, cx, cy, size) {
  const img = logoImgs[key];
  if (img) {
    // vit bricka bakom logotypen (blå logotyper syns dåligt mot mörk bakgrund)
    ctx.fillStyle = "#fff";
    roundRect(ctx, cx - size / 2, cy - size / 2, size, size, size * 0.27);
    ctx.fill();
    const iw = img.naturalWidth || 512, ih = img.naturalHeight || 512;
    const scale = (size * 0.92) / Math.max(iw, ih);
    const w = iw * scale, h = ih * scale;
    ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
    return;
  }
  const x = cx - size / 2, y = cy - size / 2;
  if (key === "S") {
    ctx.fillStyle = "#fff";
    roundRect(ctx, x, y, size, size, size * 0.27); ctx.fill();
    ctx.fillStyle = "#e8112d";
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.arc(cx + size * 0.25 * Math.cos(a), cy + size * 0.25 * Math.sin(a), size * 0.18, 0, 7);
      ctx.fill();
    }
    ctx.fillStyle = "#b3001b";
    ctx.beginPath(); ctx.arc(cx, cy, size * 0.175, 0, 7); ctx.fill();
  } else if (key === "MP") {
    ctx.fillStyle = "#fff";
    roundRect(ctx, x, y, size, size, size * 0.27); ctx.fill();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      ctx.fillStyle = i % 2 ? "#f4c50f" : "#83cf39";
      ctx.beginPath();
      ctx.arc(cx + size * 0.25 * Math.cos(a), cy + size * 0.25 * Math.sin(a), size * 0.175, 0, 7);
      ctx.fill();
    }
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(cx, cy, size * 0.14, 0, 7); ctx.fill();
  } else {
    const solid = { V: "#da291c", C: "#009f57", L: "#006aa7", KD: "#232b6b", M: "#52a3d8", SD: "#123c8a", OV: "#6b7484" };
    const letterColor = key === "SD" ? "#febc11" : "#fff";
    ctx.fillStyle = solid[key] || "#6b7484";
    roundRect(ctx, x, y, size, size, size * 0.27); ctx.fill();
    ctx.fillStyle = letterColor;
    ctx.font = `700 ${key.length > 2 ? size * 0.34 : size * 0.5}px "Space Grotesk","Inter",sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(key === "OV" ? "Ö" : key, cx, cy + size * 0.02);
  }
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function drawCanvas() {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const FONT = '"Space Grotesk","Inter",sans-serif';

  ctx.fillStyle = "#0a0e1a";
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W * 0.7, -100, 50, W * 0.7, -100, 700);
  glow.addColorStop(0, "rgba(27,43,82,0.8)");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#eef1f8";
  ctx.font = `700 40px ${FONT}`;
  ctx.textAlign = "center";
  ctx.fillText(`Min gissning: Riksdagsvalet ${ELECTION_YEAR}`, W / 2, 64);
  ctx.fillStyle = "#929cb3";
  ctx.font = `400 20px ${FONT}`;
  ctx.fillText(`${ELECTION_DATE} · procent av rösterna · summa 100,0 %`, W / 2, 98);
  ctx.textAlign = "left";

  const data = allRows();
  const n = data.length;
  const left = 70, right = W - 70;
  const colW = (right - left) / n;
  const barW = Math.min(56, colW * 0.62);
  const baseline = 500, maxBarH = 270;
  const badgeSize = 46;

  data.forEach((d, i) => {
    const cx = left + colW * (i + 0.5);
    const h = (Math.min(d.pct, TRACK_MAX) / TRACK_MAX) * maxBarH;
    const c = COLORS[d.key];

    // spår
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    roundRect(ctx, cx - barW / 2, baseline - maxBarH, barW, maxBarH, 12);
    ctx.fill();

    // stapel
    if (d.pct > 0) {
      const g = ctx.createLinearGradient(0, baseline - h, 0, baseline);
      g.addColorStop(0, c.grad[0]);
      g.addColorStop(1, c.grad[1]);
      ctx.fillStyle = g;
      roundedTopBar(ctx, cx - barW / 2, baseline - h, barW, h, 12);
      ctx.fill();
    }

    // märke ovanpå stapeln
    drawBadge(ctx, d.key, cx, baseline - h - badgeSize / 2 - 8, badgeSize);

    // procent + partibokstav
    ctx.fillStyle = "#eef1f8";
    ctx.font = `700 24px ${FONT}`;
    ctx.textAlign = "center";
    ctx.fillText(fmt(d.pct), cx, baseline + 38);
    ctx.fillStyle = "#929cb3";
    ctx.font = `700 16px ${FONT}`;
    ctx.fillText(d.abbr === OTHERS_ABBR ? "Övriga" : d.abbr, cx, baseline + 62);
    ctx.textAlign = "left";
  });

  ctx.fillStyle = "rgba(255,255,255,0.14)";
  ctx.fillRect(left, baseline, right - left, 1);
}

downloadBtn.addEventListener("click", async () => {
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  drawCanvas();
  const link = document.createElement("a");
  link.download = `riksdagsgissning-${ELECTION_YEAR}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
});

/* ---------- Riktiga logotyper (om de finns i logos/) ---------- */

for (const p of [...PARTIES.map((p) => p.abbr), "OV"]) {
  tryLogo(p, () => {
    const badge = els[p].col.querySelector(".badge");
    badge.innerHTML = `<img src="${logoImgs[p].src}" alt="${p}">`;
  });
}

refreshUI();
