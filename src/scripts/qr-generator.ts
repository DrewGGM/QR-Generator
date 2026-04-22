import QRCodeStyling, {
  type Options,
  type DotType,
  type CornerSquareType,
  type CornerDotType,
  type ErrorCorrectionLevel,
  type ExtensionFunction,
} from "qr-code-styling";
import { templates, colorPalettes, type StylePreset } from "../data/templates";

type FrameStyle = "none" | "simple" | "label" | "rounded" | "scan";

interface FrameState {
  style: FrameStyle;
  text: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
}

interface State {
  templateId: string;
  data: Record<string, string>;
  style: StylePreset;
  size: number;
  margin: number;
  logo: string | null;
  logoSize: number;
  hideBackgroundDots: boolean;
  frame: FrameState;
}

const root = document.getElementById("qr-app");
if (!root) throw new Error("#qr-app not found");

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => root.querySelector(sel) as T;
const $$ = <T extends HTMLElement = HTMLElement>(sel: string) => Array.from(root.querySelectorAll(sel)) as T[];

const SVG_NS = "http://www.w3.org/2000/svg";

const initialTemplate = templates[0];
const state: State = {
  templateId: initialTemplate.id,
  data: { url: "https://qr-permanente.pages.dev" },
  style: { ...initialTemplate.preset },
  size: 300,
  margin: 8,
  logo: null,
  logoSize: 0.32,
  hideBackgroundDots: true,
  frame: initialTemplate.framePreset
    ? { ...initialTemplate.framePreset }
    : { style: "none", text: "", textColor: "#ffffff", bgColor: "#1a2570", borderColor: "#1a2570" },
};

const qrContainer = $<HTMLDivElement>("#qr-preview");

function buildOptions(): Partial<Options> {
  const tpl = templates.find((t) => t.id === state.templateId)!;
  const data = tpl.encode(state.data) || " ";

  const dotsOptions: Options["dotsOptions"] = state.style.dotsGradient
    ? {
        type: state.style.dotsType as DotType,
        gradient: {
          type: state.style.dotsGradient.type,
          rotation: 0,
          colorStops: [
            { offset: 0, color: state.style.dotsGradient.from },
            { offset: 1, color: state.style.dotsGradient.to },
          ],
        },
      }
    : { type: state.style.dotsType as DotType, color: state.style.dotsColor };

  return {
    width: state.size,
    height: state.size,
    type: "svg",
    data,
    margin: state.margin,
    qrOptions: { errorCorrectionLevel: state.style.errorCorrection as ErrorCorrectionLevel },
    image: state.logo ?? undefined,
    dotsOptions,
    cornersSquareOptions: {
      type: state.style.cornersSquareType as CornerSquareType,
      color: state.style.cornersColor,
    },
    cornersDotOptions: {
      type: state.style.cornersDotType as CornerDotType,
      color: state.style.cornersColor,
    },
    backgroundOptions: { color: state.style.backgroundColor },
    imageOptions: {
      crossOrigin: "anonymous",
      margin: 6,
      imageSize: state.logoSize,
      hideBackgroundDots: state.hideBackgroundDots,
    },
  };
}

const frameExtension: ExtensionFunction = (svg, options) => {
  const frame = state.frame;
  if (frame.style === "none" && !frame.text.trim()) return;

  const w = (options.width as number) || state.size;
  const h = (options.height as number) || state.size;
  const text = frame.text.trim().toUpperCase();
  const hasLabel = !!text && (frame.style === "label" || frame.style === "rounded" || frame.style === "scan");

  const padding = frame.style === "simple" ? 10 : 14;
  const labelHeight = hasLabel ? Math.round(w * 0.18) : 0;
  const labelTop = frame.style === "scan";
  const cornerRadius = frame.style === "rounded" ? Math.round(w * 0.08) : frame.style === "label" ? Math.round(w * 0.06) : frame.style === "simple" ? 8 : 4;
  const borderWidth = frame.style === "simple" ? 4 : frame.style === "label" ? 8 : frame.style === "rounded" ? 5 : frame.style === "scan" ? 6 : 0;

  const totalW = w + padding * 2;
  const totalH = h + padding * 2 + labelHeight;

  // Move existing QR contents into a translated <g>
  const innerY = labelTop ? padding + labelHeight : padding;
  const inner = document.createElementNS(SVG_NS, "g");
  inner.setAttribute("transform", `translate(${padding}, ${innerY})`);
  while (svg.firstChild) inner.appendChild(svg.firstChild);

  // Resize SVG (CSS will scale it, internal resolution preserved)
  svg.setAttribute("width", String(totalW));
  svg.setAttribute("height", String(totalH));
  svg.setAttribute("viewBox", `0 0 ${totalW} ${totalH}`);

  // Clip path so the label background respects the rounded outer corners
  const clipId = "qr-frame-clip";
  const defs = document.createElementNS(SVG_NS, "defs");
  const clipPath = document.createElementNS(SVG_NS, "clipPath");
  clipPath.setAttribute("id", clipId);
  const clipRect = document.createElementNS(SVG_NS, "rect");
  clipRect.setAttribute("x", "0");
  clipRect.setAttribute("y", "0");
  clipRect.setAttribute("width", String(totalW));
  clipRect.setAttribute("height", String(totalH));
  clipRect.setAttribute("rx", String(cornerRadius));
  clipPath.appendChild(clipRect);
  defs.appendChild(clipPath);
  svg.appendChild(defs);

  // Group everything under the clip so nothing escapes the rounded corners
  const clipped = document.createElementNS(SVG_NS, "g");
  clipped.setAttribute("clip-path", `url(#${clipId})`);

  // Outer background
  const outerBg = document.createElementNS(SVG_NS, "rect");
  outerBg.setAttribute("x", "0");
  outerBg.setAttribute("y", "0");
  outerBg.setAttribute("width", String(totalW));
  outerBg.setAttribute("height", String(totalH));
  outerBg.setAttribute("fill", state.style.backgroundColor);
  clipped.appendChild(outerBg);

  clipped.appendChild(inner);

  // Label background (colored bar)
  if (hasLabel) {
    const labelY = labelTop ? 0 : h + padding * 2;
    const labelBg = document.createElementNS(SVG_NS, "rect");
    labelBg.setAttribute("x", "0");
    labelBg.setAttribute("y", String(labelY));
    labelBg.setAttribute("width", String(totalW));
    labelBg.setAttribute("height", String(labelHeight));
    labelBg.setAttribute("fill", frame.bgColor);
    if (frame.style === "rounded") {
      // Floating pill: smaller, centered
      const pillW = Math.min(totalW * 0.7, w * 0.7);
      const pillH = labelHeight * 0.75;
      const pillX = (totalW - pillW) / 2;
      const pillY = labelY + (labelHeight - pillH) / 2;
      labelBg.setAttribute("x", String(pillX));
      labelBg.setAttribute("y", String(pillY));
      labelBg.setAttribute("width", String(pillW));
      labelBg.setAttribute("height", String(pillH));
      labelBg.setAttribute("rx", String(pillH / 2));
    }
    clipped.appendChild(labelBg);

    const textEl = document.createElementNS(SVG_NS, "text");
    textEl.setAttribute("x", String(totalW / 2));
    textEl.setAttribute("y", String(labelY + labelHeight / 2));
    textEl.setAttribute("text-anchor", "middle");
    textEl.setAttribute("dominant-baseline", "central");
    textEl.setAttribute("fill", frame.textColor);
    textEl.setAttribute("font-family", "Inter, system-ui, -apple-system, sans-serif");
    textEl.setAttribute("font-size", String(Math.max(18, Math.round(w * 0.085))));
    textEl.setAttribute("font-weight", "800");
    textEl.setAttribute("letter-spacing", "2");
    textEl.textContent = frame.text.trim().toUpperCase();
    clipped.appendChild(textEl);

    if (frame.style === "scan") {
      const arrow = document.createElementNS(SVG_NS, "path");
      const ax = totalW / 2;
      const ay = labelHeight - 4;
      arrow.setAttribute("d", `M ${ax - 8} ${ay - 8} L ${ax} ${ay} L ${ax + 8} ${ay - 8}`);
      arrow.setAttribute("stroke", frame.textColor);
      arrow.setAttribute("stroke-width", "3");
      arrow.setAttribute("fill", "none");
      arrow.setAttribute("stroke-linecap", "round");
      arrow.setAttribute("stroke-linejoin", "round");
      clipped.appendChild(arrow);
    }
  }

  svg.appendChild(clipped);

  // Outer border on top (NOT inside clip, so it draws cleanly)
  if (borderWidth > 0) {
    const border = document.createElementNS(SVG_NS, "rect");
    const off = borderWidth / 2;
    border.setAttribute("x", String(off));
    border.setAttribute("y", String(off));
    border.setAttribute("width", String(totalW - borderWidth));
    border.setAttribute("height", String(totalH - borderWidth));
    border.setAttribute("fill", "none");
    border.setAttribute("stroke", frame.borderColor);
    border.setAttribute("stroke-width", String(borderWidth));
    border.setAttribute("rx", String(Math.max(0, cornerRadius - off)));
    svg.appendChild(border);
  }
};

const qrCode = new QRCodeStyling(buildOptions());
qrCode.append(qrContainer);
qrCode.applyExtension(frameExtension);

function render() {
  qrCode.update(buildOptions());
  // Re-apply extension after each update (update rebuilds the SVG)
  qrCode.applyExtension(frameExtension);
}

// === FIELDS RENDERING ===
const fieldsContainer = $<HTMLDivElement>("#fields");
function renderFields() {
  const tpl = templates.find((t) => t.id === state.templateId)!;
  fieldsContainer.innerHTML = "";
  tpl.fields.forEach((f) => {
    const wrap = document.createElement("div");
    let inputHtml = "";
    const value = state.data[f.key] ?? "";
    const safeVal = value.replace(/"/g, "&quot;");
    if (f.type === "textarea") {
      inputHtml = `<textarea class="field min-h-[90px] resize-y" data-key="${f.key}" placeholder="${f.placeholder ?? ""}" ${f.required ? "required" : ""}>${value}</textarea>`;
    } else if (f.type === "select") {
      const opts = (f.options ?? [])
        .map((o) => `<option value="${o.value}" ${o.value === value ? "selected" : ""}>${o.label}</option>`)
        .join("");
      inputHtml = `<select class="field" data-key="${f.key}">${opts}</select>`;
    } else {
      inputHtml = `<input type="${f.type}" class="field" data-key="${f.key}" placeholder="${f.placeholder ?? ""}" value="${safeVal}" ${f.required ? "required" : ""}/>`;
    }
    wrap.innerHTML = `
      <label class="label">${f.label}${f.required ? ' <span class="text-rose-500">*</span>' : ""}</label>
      ${inputHtml}
      ${f.help ? `<p class="mt-1 text-xs text-slate-500">${f.help}</p>` : ""}
    `;
    fieldsContainer.appendChild(wrap);
  });

  fieldsContainer.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("[data-key]").forEach((el) => {
    el.addEventListener("input", () => {
      state.data[el.dataset.key!] = el.value;
      render();
    });
  });
}

// === TEMPLATES ===
function selectTemplate(id: string, applyPreset = true) {
  const tpl = templates.find((t) => t.id === id);
  if (!tpl) return;
  state.templateId = id;
  state.data = {};
  tpl.fields.forEach((f) => {
    if (f.type === "select" && f.options?.length) state.data[f.key] = f.options[0].value;
    else state.data[f.key] = "";
  });
  if (applyPreset) {
    state.style = { ...tpl.preset };
    if (tpl.framePreset) {
      state.frame = { ...tpl.framePreset };
    }
    syncStyleControls();
    syncFrameControls();
  }
  $$<HTMLButtonElement>("[data-template]").forEach((b) => {
    b.classList.toggle("active", b.dataset.template === id);
  });
  renderFields();
  render();
}

$$<HTMLButtonElement>("[data-template]").forEach((b) => {
  b.addEventListener("click", () => selectTemplate(b.dataset.template!));
});

// === STYLE CONTROLS ===
function syncStyleControls() {
  ($("#dots-type") as HTMLSelectElement).value = state.style.dotsType;
  ($("#corners-square-type") as HTMLSelectElement).value = state.style.cornersSquareType;
  ($("#corners-dot-type") as HTMLSelectElement).value = state.style.cornersDotType;
  ($("#dots-color") as HTMLInputElement).value = state.style.dotsColor;
  ($("#corners-color") as HTMLInputElement).value = state.style.cornersColor;
  ($("#bg-color") as HTMLInputElement).value = state.style.backgroundColor;
  ($("#error-level") as HTMLSelectElement).value = state.style.errorCorrection;
  ($("#use-gradient") as HTMLInputElement).checked = !!state.style.dotsGradient;
  ($("#gradient-from") as HTMLInputElement).value = state.style.dotsGradient?.from ?? state.style.dotsColor;
  ($("#gradient-to") as HTMLInputElement).value = state.style.dotsGradient?.to ?? state.style.dotsColor;
  ($("#gradient-type") as HTMLSelectElement).value = state.style.dotsGradient?.type ?? "linear";
  toggleGradientUI();
}

function toggleGradientUI() {
  const on = ($("#use-gradient") as HTMLInputElement).checked;
  $("#gradient-options").classList.toggle("hidden", !on);
  $("#dots-color-wrap").classList.toggle("hidden", on);
}

const styleBindings: { sel: string; apply: (v: string) => void }[] = [
  { sel: "#dots-type", apply: (v) => (state.style.dotsType = v as StylePreset["dotsType"]) },
  { sel: "#corners-square-type", apply: (v) => (state.style.cornersSquareType = v as StylePreset["cornersSquareType"]) },
  { sel: "#corners-dot-type", apply: (v) => (state.style.cornersDotType = v as StylePreset["cornersDotType"]) },
  { sel: "#dots-color", apply: (v) => (state.style.dotsColor = v) },
  { sel: "#corners-color", apply: (v) => (state.style.cornersColor = v) },
  { sel: "#bg-color", apply: (v) => (state.style.backgroundColor = v) },
  { sel: "#error-level", apply: (v) => (state.style.errorCorrection = v as StylePreset["errorCorrection"]) },
];

styleBindings.forEach(({ sel, apply }) => {
  $(sel).addEventListener("input", (e) => {
    apply((e.target as HTMLInputElement).value);
    render();
  });
});

$("#use-gradient").addEventListener("change", () => {
  const on = ($("#use-gradient") as HTMLInputElement).checked;
  if (on) {
    state.style.dotsGradient = {
      from: ($("#gradient-from") as HTMLInputElement).value,
      to: ($("#gradient-to") as HTMLInputElement).value,
      type: ($("#gradient-type") as HTMLSelectElement).value as "linear" | "radial",
    };
  } else {
    state.style.dotsGradient = undefined;
  }
  toggleGradientUI();
  render();
});

["#gradient-from", "#gradient-to", "#gradient-type"].forEach((sel) => {
  $(sel).addEventListener("input", () => {
    if (!state.style.dotsGradient) return;
    state.style.dotsGradient = {
      from: ($("#gradient-from") as HTMLInputElement).value,
      to: ($("#gradient-to") as HTMLInputElement).value,
      type: ($("#gradient-type") as HTMLSelectElement).value as "linear" | "radial",
    };
    render();
  });
});

// === FRAME CONTROLS ===
function syncFrameControls() {
  ($("#frame-style") as HTMLSelectElement).value = state.frame.style;
  ($("#frame-text") as HTMLInputElement).value = state.frame.text;
  ($("#frame-text-color") as HTMLInputElement).value = state.frame.textColor;
  ($("#frame-bg-color") as HTMLInputElement).value = state.frame.bgColor;
  ($("#frame-border-color") as HTMLInputElement).value = state.frame.borderColor;
  toggleFrameUI();
}

function toggleFrameUI() {
  const isNone = state.frame.style === "none";
  $("#frame-options").classList.toggle("hidden", isNone);
}

const frameBindings: { sel: string; apply: (v: string) => void }[] = [
  { sel: "#frame-style", apply: (v) => { state.frame.style = v as FrameStyle; toggleFrameUI(); } },
  { sel: "#frame-text", apply: (v) => (state.frame.text = v) },
  { sel: "#frame-text-color", apply: (v) => (state.frame.textColor = v) },
  { sel: "#frame-bg-color", apply: (v) => (state.frame.bgColor = v) },
  { sel: "#frame-border-color", apply: (v) => (state.frame.borderColor = v) },
];
frameBindings.forEach(({ sel, apply }) => {
  $(sel).addEventListener("input", (e) => {
    apply((e.target as HTMLInputElement).value);
    render();
  });
});

// Frame text suggestion chips
$$<HTMLButtonElement>("[data-frame-suggest]").forEach((b) => {
  b.addEventListener("click", () => {
    const txt = b.dataset.frameSuggest!;
    state.frame.text = txt;
    if (state.frame.style === "none") state.frame.style = "label";
    syncFrameControls();
    render();
  });
});

// Size + margin sliders
$("#size").addEventListener("input", (e) => {
  state.size = +(e.target as HTMLInputElement).value;
  $("#size-val").textContent = `${state.size}px`;
  render();
});
$("#margin").addEventListener("input", (e) => {
  state.margin = +(e.target as HTMLInputElement).value;
  $("#margin-val").textContent = `${state.margin}px`;
  render();
});

// Logo
const logoInput = $("#logo-input") as HTMLInputElement;
logoInput.addEventListener("change", () => {
  const f = logoInput.files?.[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    state.logo = e.target?.result as string;
    $("#logo-controls").classList.remove("hidden");
    render();
  };
  reader.readAsDataURL(f);
});
$("#logo-remove").addEventListener("click", () => {
  state.logo = null;
  logoInput.value = "";
  $("#logo-controls").classList.add("hidden");
  render();
});
$("#logo-size").addEventListener("input", (e) => {
  state.logoSize = +(e.target as HTMLInputElement).value;
  $("#logo-size-val").textContent = `${Math.round(state.logoSize * 100)}%`;
  render();
});
$("#hide-bg-dots").addEventListener("change", (e) => {
  state.hideBackgroundDots = (e.target as HTMLInputElement).checked;
  render();
});

// Color palettes
const palettesEl = $("#palettes");
colorPalettes.forEach((p) => {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.title = p.name;
  btn.className = "swatch";
  btn.style.background = `linear-gradient(135deg, ${p.dots} 50%, ${p.corners} 50%)`;
  btn.addEventListener("click", () => {
    state.style.dotsColor = p.dots;
    state.style.cornersColor = p.corners;
    state.style.backgroundColor = p.bg;
    state.style.dotsGradient = undefined;
    syncStyleControls();
    render();
  });
  palettesEl.appendChild(btn);
});

// === DOWNLOADS (read from the DOM SVG so frames are always included) ===
function getCurrentSvg(): SVGSVGElement | null {
  return qrContainer.querySelector("svg");
}

function triggerDownload(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function serializeSvg(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  if (!clone.getAttribute("xmlns")) clone.setAttribute("xmlns", SVG_NS);
  if (!clone.getAttribute("xmlns:xlink")) clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  return new XMLSerializer().serializeToString(clone);
}

function fileName(ext: string) {
  return `qr-${state.templateId}-${Date.now()}.${ext}`;
}

async function downloadSvg() {
  const svg = getCurrentSvg();
  if (!svg) return;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n${serializeSvg(svg)}`;
  triggerDownload(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }), fileName("svg"));
}

async function downloadRaster(format: "png" | "jpeg" | "webp") {
  const svg = getCurrentSvg();
  if (!svg) return;

  const vbW = svg.viewBox.baseVal.width || +(svg.getAttribute("width") || "300");
  const vbH = svg.viewBox.baseVal.height || +(svg.getAttribute("height") || "300");

  // Render at 3x for crisp print quality
  const scale = 3;
  const xml = serializeSvg(svg);
  const svgBlob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to load SVG image"));
      img.src = svgUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(vbW * scale);
    canvas.height = Math.round(vbH * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No 2D canvas context");

    if (format !== "png") {
      ctx.fillStyle = state.style.backgroundColor || "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const mime = format === "png" ? "image/png" : format === "jpeg" ? "image/jpeg" : "image/webp";
    const quality = format === "png" ? undefined : 0.95;

    await new Promise<void>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("toBlob returned null"));
          triggerDownload(blob, fileName(format));
          resolve();
        },
        mime,
        quality,
      );
    });
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

$("#download-svg").addEventListener("click", () => void downloadSvg());
$("#download-png").addEventListener("click", () => void downloadRaster("png"));
$("#download-jpeg").addEventListener("click", () => void downloadRaster("jpeg"));
$("#download-webp").addEventListener("click", () => void downloadRaster("webp"));

// Copy data string
$("#copy-data").addEventListener("click", async () => {
  const tpl = templates.find((t) => t.id === state.templateId)!;
  const data = tpl.encode(state.data);
  await navigator.clipboard.writeText(data);
  const btn = $("#copy-data") as HTMLButtonElement;
  const original = btn.textContent;
  btn.textContent = "¡Copiado!";
  setTimeout(() => (btn.textContent = original), 1500);
});

// Print
$("#print-qr").addEventListener("click", () => window.print());

// Init
selectTemplate(state.templateId, false);
syncStyleControls();
syncFrameControls();
$("#size-val").textContent = `${state.size}px`;
$("#margin-val").textContent = `${state.margin}px`;
$("#logo-size-val").textContent = `${Math.round(state.logoSize * 100)}%`;
